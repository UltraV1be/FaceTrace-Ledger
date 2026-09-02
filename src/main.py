"""
FaceTrace Ledger - Main CLI Pipeline
End-to-end face recognition, genuine reverse image search, cryptographic hashing, and blockchain verification.
"""

import sys
import argparse
from pathlib import Path
from typing import Optional

# Ensure project root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.config import config
from src.face.detector import FaceDetector, FaceDetectionError
from src.face.encoder import FaceEncoder, FaceEncodingError
from src.face.matcher import FaceMatcher
from src.search.reverse_search import ReverseImageSearchService
from src.search.result_parser import parse_search_results
from src.search.candidate_downloader import CandidateDownloader
from src.search.candidate_verifier import CandidateVerifier
from src.record.metadata_builder import build_verification_record
from src.record.canonicalizer import canonicalize
from src.crypto.hashing import hash_file, hash_record
from src.blockchain.client import BlockchainClient, BlockchainConnectionError
from src.blockchain.uploader import BlockchainUploader
from src.blockchain.verifier import BlockchainVerifier
from src.utils.logger import (
    log_header,
    log_step,
    log_success,
    log_fail,
    log_info,
    logger,
    BOLD,
    RESET,
    GREEN,
    RED,
    CYAN
)
from src.utils.helpers import save_json, load_json, get_utc_timestamp


def run_pipeline(image_path_str: str) -> bool:
    """Execute full end-to-end FaceTrace Ledger pipeline."""
    log_header("FaceTrace Ledger", "Face Search + Blockchain Verification Pipeline")

    TOTAL_STEPS = 8
    image_path = Path(image_path_str).resolve()

    # Step 1: Loading image
    log_step(1, TOTAL_STEPS, "Loading input image")
    if not image_path.exists():
        log_fail(f"Image not found at: {image_path}")
        print(f"\n[WHAT FAILED] File loading failed.\n[WHY IT FAILED] Path '{image_path}' does not exist.\n[WHAT TO DO] Provide a valid image path.")
        return False
    log_success(f"Image loaded: {image_path.name}")
    image_sha256 = hash_file(image_path)
    log_info("SHA-256", f"{image_sha256[:16]}...")

    # Step 2: Detecting face
    log_step(2, TOTAL_STEPS, "Detecting face")
    detector = FaceDetector()
    try:
        face_info = detector.detect_primary_face(image_path)
        log_success("Face detected")
        log_info("Bounding Box", face_info["bbox"])
        log_info("Confidence", face_info["confidence"])
    except FaceDetectionError as e:
        log_fail(str(e))
        print(f"\n[WHAT FAILED] Face detection.\n[WHY IT FAILED] No frontal face could be found in the image.\n[WHAT TO DO] Provide a clear portrait photograph containing a human face.")
        return False

    # Step 3: Generating face encoding
    log_step(3, TOTAL_STEPS, "Generating face encoding")
    encoder = FaceEncoder(detector)
    try:
        input_embedding = encoder.encode(face_info)
        log_success(f"Face embedding generated (Dimension: {len(input_embedding)})")
    except FaceEncodingError as e:
        log_fail(str(e))
        print(f"\n[WHAT FAILED] Face embedding generation.\n[WHY IT FAILED] Could not extract normalized face vector.\n[WHAT TO DO] Ensure image resolution is at least 112x112.")
        return False

    # Step 4: Genuine reverse image search
    log_step(4, TOTAL_STEPS, "Performing genuine reverse image search")
    search_service = ReverseImageSearchService()
    try:
        raw_results = search_service.search(image_path)
        log_success(f"Search completed")
        log_info("Results Found", len(raw_results))
    except (ValueError, PermissionError, RuntimeError) as e:
        log_fail(f"Search failed: {e}")
        print(f"\n[WHAT FAILED] Reverse image search.\n[WHY IT FAILED] {e}\n[WHAT TO DO] Configure SEARCH_API_KEY in .env or check network connection.")
        return False

    if not raw_results:
        log_fail("Search provider returned 0 results for this image.")
        print("\n[WHAT FAILED] No candidate results returned by search provider.\n[WHY IT FAILED] The image may not be indexed or publicly available.\n[WHAT TO DO] Try an image indexed on the public web.")
        return False

    # Step 5: Candidate verification
    log_step(5, TOTAL_STEPS, "Verifying candidate results")
    parsed_candidates = parse_search_results(raw_results)
    log_info("Valid URLs Parsed", len(parsed_candidates))

    verifier = CandidateVerifier(detector=detector, encoder=encoder)
    best_candidate, evaluated_candidates = verifier.verify_candidates(
        input_embedding=input_embedding,
        candidates=parsed_candidates,
        max_candidates_to_check=10
    )

    if not best_candidate:
        log_fail("NO_VERIFIED_MATCH_FOUND: No candidate passed the configured similarity threshold.")
        print(f"\n[WHAT FAILED] Candidate verification.\n[WHY IT FAILED] None of the {len(evaluated_candidates)} evaluated candidates scored above threshold ({config.face_match_threshold}).\n[WHAT TO DO] Adjust FACE_MATCH_THRESHOLD in .env if testing lower-confidence matches.")
        return False

    print(f"\n  {BOLD}{GREEN}BEST VERIFIED CANDIDATE{RESET}")
    print(f"  URL: {best_candidate.get('url')}")
    print(f"  Similarity: {best_candidate.get('similarity_score')}")

    # Step 6: Creating verification record
    log_step(6, TOTAL_STEPS, "Creating canonical verification record")
    record = build_verification_record(
        source_url=best_candidate.get("url", "unknown"),
        source_domain=best_candidate.get("domain", "unknown"),
        result_title=best_candidate.get("page_title", "Untitled Match"),
        image_sha256=image_sha256,
        similarity_score=best_candidate.get("similarity_score", 0.0),
        search_provider=config.reverse_search_provider
    )
    record_file = config.results_dir / "verification_record.json"
    save_json(record, record_file)
    log_success("Canonical record created and saved")
    log_info("Record Path", str(record_file))

    # Step 7: Generating SHA-256 fingerprint
    log_step(7, TOTAL_STEPS, "Generating SHA-256 cryptographic fingerprint")
    hash_result = hash_record(record)
    record_hash = hash_result["hash"]
    log_success("Cryptographic fingerprint generated")
    log_info("Record Hash (SHA-256)", record_hash)
    log_info("Canonical JSON", hash_result["canonical_payload"])

    # Step 8: Uploading to blockchain
    log_step(8, TOTAL_STEPS, "Uploading fingerprint to blockchain")
    try:
        client = BlockchainClient()
        
        # If contract address not yet deployed or configured, auto-deploy to local tester
        if not client.contract_address:
            from scripts.deploy_contract import deploy_contract
            contract_addr = deploy_contract()
            client.load_contract(contract_addr)
        else:
            client.load_contract()

        uploader = BlockchainUploader(client)
        upload_result = uploader.upload_record_hash(record_hash)
        log_success("Transaction confirmed on blockchain")
        log_info("Transaction Hash", upload_result["transaction_hash"])
        log_info("Block Number", upload_result["block_number"])
    except Exception as e:
        log_fail(f"Blockchain upload error: {e}")
        print(f"\n[WHAT FAILED] Blockchain registration.\n[WHY IT FAILED] {e}\n[WHAT TO DO] Ensure local node or contract is properly configured.")
        return False

    # RE-VERIFICATION PHASE
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}{'BLOCKCHAIN RE-VERIFICATION'.center(60)}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}\n")

    blockchain_verifier = BlockchainVerifier(client)
    verification_check = blockchain_verifier.verify_discovered_record(record)

    log_info("Local Computed Hash", verification_check["local_hash"])
    log_info("Blockchain Status", "FOUND AND MATCHED" if verification_check["verified"] else "NOT FOUND")

    if verification_check["verified"]:
        log_success("VERIFIED ON-CHAIN")
        log_info("Registration Timestamp", verification_check["timestamp"])
        log_info("Submitter Address", verification_check["submitter"])
        print(f"\n  {BOLD}{GREEN}RESULT: DATA MATCHES THE REGISTERED TAMPER-EVIDENT RECORD{RESET}\n")
    else:
        log_fail("VERIFICATION MISMATCH")
        return False

    # Save Pipeline Result Artifact
    pipeline_result = {
        "status": "SUCCESS",
        "verified": True,
        "input_image": str(image_path),
        "image_sha256": image_sha256,
        "source_url": record["source_url"],
        "source_domain": record["source_domain"],
        "result_title": record["result_title"],
        "similarity_score": record["similarity_score"],
        "search_provider": record["search_provider"],
        "record_hash_sha256": record_hash,
        "transaction_hash": upload_result["transaction_hash"],
        "block_number": upload_result["block_number"],
        "submitter": upload_result["submitter"],
        "verified_at": record["verified_at"]
    }
    save_json(pipeline_result, config.results_dir / "pipeline_result.json")
    return True


def verify_record_file(record_path_str: str) -> bool:
    """Verify an existing verification record file against the blockchain."""
    log_header("FaceTrace Ledger", "Blockchain Record Verification")

    record_path = Path(record_path_str).resolve()
    if not record_path.exists():
        log_fail(f"Record file not found at: {record_path}")
        return False

    record = load_json(record_path)
    hash_result = hash_record(record)
    local_hash = hash_result["hash"]

    print("  [1/2] Recomputing local cryptographic fingerprint...")
    log_info("Computed SHA-256", local_hash)
    log_info("Canonical JSON", hash_result["canonical_payload"])

    print("\n  [2/2] Querying smart contract on blockchain...")
    client = BlockchainClient()
    if not client.contract_address:
        from scripts.deploy_contract import deploy_contract
        contract_addr = deploy_contract()
        client.load_contract(contract_addr)
    else:
        client.load_contract()

    verifier = BlockchainVerifier(client)
    res = verifier.verify_discovered_record(record)

    if res["verified"]:
        log_success("VERIFIED: Record matches on-chain state.")
        log_info("Block Timestamp", res["timestamp"])
        log_info("Submitter", res["submitter"])
        return True
    else:
        log_fail(f"VERIFICATION FAILED: {res.get('reason')}")
        return False


def demo_tamper(record_path_str: str) -> bool:
    """Demonstrate blockchain tamper-evidence by altering a record field."""
    log_header("FaceTrace Ledger", "Tamper Detection Demonstration")

    record_path = Path(record_path_str).resolve()
    if not record_path.exists():
        log_fail(f"Record file not found at: {record_path}")
        return False

    original_record = load_json(record_path)
    orig_hash = hash_record(original_record)["hash"]

    client = BlockchainClient()
    if not client.contract_address:
        from scripts.deploy_contract import deploy_contract
        contract_addr = deploy_contract()
        client.load_contract(contract_addr)
    else:
        client.load_contract()

    # Step 1: Verify original
    print(f"\n{BOLD}--- STEP 1: VERIFYING ORIGINAL UNMODIFIED RECORD ---{RESET}")
    verifier = BlockchainVerifier(client)
    orig_check = verifier.verify_discovered_record(original_record)
    log_info("Original Hash", orig_hash)
    if orig_check["verified"]:
        log_success("ORIGINAL RECORD VERIFIED ON-CHAIN")
    else:
        log_fail("Original record is not yet registered on-chain. Registering now for demonstration...")
        uploader = BlockchainUploader(client)
        uploader.upload_record_hash(orig_hash)
        orig_check = verifier.verify_discovered_record(original_record)
        if orig_check["verified"]:
            log_success("Original record registered and verified.")

    # Step 2: Create tampered copy
    print(f"\n{BOLD}--- STEP 2: CREATING TAMPERED RECORD ---{RESET}")
    tampered_record = dict(original_record)
    old_score = tampered_record.get("similarity_score", 0.85)
    tampered_record["similarity_score"] = 0.9999  # Tamper similarity score
    tampered_record["source_url"] = "https://malicious-tampered-site.org/fake_profile.html"

    tampered_hash = hash_record(tampered_record)["hash"]
    log_info("Original Hash", orig_hash)
    log_info("Tampered Hash", tampered_hash)

    # Step 3: Verify tampered copy against blockchain
    print(f"\n{BOLD}--- STEP 3: ATTEMPTING BLOCKCHAIN VERIFICATION OF TAMPERED RECORD ---{RESET}")
    tamper_check = verifier.verify_discovered_record(tampered_record)

    if not tamper_check["verified"]:
        log_fail("VERIFICATION FAILED (HASH_MISMATCH)")
        print(f"\n  {BOLD}{RED}SECURITY ALERT: DATA HAS BEEN MODIFIED OR TAMPERED WITH!{RESET}")
        print(f"  The tampered hash ({tampered_hash}) does not match any registered immutable blockchain state.\n")
        return True
    else:
        log_fail("Tampering was not detected (unexpected).")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="FaceTrace Ledger: Face Recognition, Reverse Search, and Blockchain Integrity Pipeline"
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Command: run
    run_parser = subparsers.add_parser("run", help="Run full pipeline on an input image")
    run_parser.add_argument("--image", required=True, help="Path to input photograph containing face")

    # Command: verify
    verify_parser = subparsers.add_parser("verify", help="Verify a verification_record.json against blockchain")
    verify_parser.add_argument("--record", required=True, help="Path to verification_record.json")

    # Command: demo-tamper
    tamper_parser = subparsers.add_parser("demo-tamper", help="Demonstrate tamper detection")
    tamper_parser.add_argument("--record", required=True, help="Path to verification_record.json")

    args = parser.parse_args()

    if args.command == "run":
        success = run_pipeline(args.image)
        sys.exit(0 if success else 1)
    elif args.command == "verify":
        success = verify_record_file(args.record)
        sys.exit(0 if success else 1)
    elif args.command == "demo-tamper":
        success = demo_tamper(args.record)
        sys.exit(0 if success else 1)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
