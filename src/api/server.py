"""
FastAPI Server for FaceTrace Ledger.
Provides REST and Server-Sent Events (SSE) endpoints for real-time pipeline execution,
job cancellation, restart, blockchain verification, diagnostics, and tamper testing.
"""

import sys
import uuid
import asyncio
import json
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

# Ensure project root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.config import config
from src.face.detector import FaceDetector, FaceDetectionError
from src.face.encoder import FaceEncoder, FaceEncodingError
from src.face.matcher import FaceMatcher
from src.search.reverse_search import ReverseImageSearchService
from src.search.providers.serpapi_lens import SerpApiError, SerpApiLensProvider
from src.search.result_parser import parse_search_results
from src.search.candidate_downloader import CandidateDownloader
from src.search.candidate_verifier import CandidateVerifier
from src.record.metadata_builder import build_verification_record
from src.crypto.hashing import hash_file, hash_record
from src.blockchain.client import BlockchainClient
from src.blockchain.uploader import BlockchainUploader
from src.blockchain.verifier import BlockchainVerifier
from src.utils.helpers import save_json, load_json

app = FastAPI(
    title="FaceTrace Ledger API",
    description="Forensic Biometric Search & Blockchain Verification API with Social Media Classification",
    version="1.2.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media static directories
app.mount("/media/input", StaticFiles(directory=str(config.input_dir)), name="input_media")
app.mount("/media/candidates", StaticFiles(directory=str(config.candidates_dir)), name="candidates_media")

# In-memory job state & event queues
jobs: Dict[str, Dict[str, Any]] = {}
job_queues: Dict[str, asyncio.Queue] = {}


class VerifyRequest(BaseModel):
    record: Dict[str, Any]


class TamperTestRequest(BaseModel):
    record: Dict[str, Any]
    modified_field: str
    modified_value: Any


async def push_event(job_id: str, stage: str, status: str, message: str, data: Optional[Dict[str, Any]] = None):
    """Helper to dispatch structured SSE event."""
    event_payload = {
        "job_id": job_id,
        "stage": stage,
        "status": status,
        "message": message,
        "data": data or {}
    }
    if job_id in job_queues:
        await job_queues[job_id].put(event_payload)


def is_job_cancelled(job_id: str) -> bool:
    """Check if cancellation was requested for this job."""
    return jobs.get(job_id, {}).get("status") == "cancellation_requested"


def run_pipeline_sync(job_id: str, image_path: Path, require_social_media: bool = False):
    """Synchronous worker running the full pipeline while broadcasting async events with cancellation checks."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        # Check cancellation
        if is_job_cancelled(job_id):
            jobs[job_id]["status"] = "cancelled"
            loop.run_until_complete(push_event(job_id, "pipeline_cancelled", "cancelled", "Execution cancelled by user"))
            return

        # Step 1: Loading image
        loop.run_until_complete(push_event(job_id, "image_loading", "processing", f"Loading image binary ({image_path.name})"))
        try:
            image_sha256 = hash_file(image_path)
            loop.run_until_complete(push_event(job_id, "image_loading", "success", "Image loaded & fingerprinted", {
                "image_sha256": image_sha256,
                "filename": image_path.name,
                "image_url": f"/media/input/{image_path.name}"
            }))
        except Exception as e:
            err_payload = {
                "error_code": "IMAGE_ACQUISITION_FAILED",
                "stage": "image_loading",
                "stage_name": "01 — ACQUIRE",
                "stage_number": 1,
                "valid_reason": f"Failed to acquire image binary or calculate SHA-256 digest: {e}",
                "details": str(e),
                "blocked_stages": ["02 — DETECT: BLOCKED", "03 — ENCODE: BLOCKED", "04 — SEARCH: BLOCKED", "05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "image_loading", "failed", err_payload["valid_reason"], err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return

        if is_job_cancelled(job_id):
            jobs[job_id]["status"] = "cancelled"
            loop.run_until_complete(push_event(job_id, "pipeline_cancelled", "cancelled", "Execution cancelled by user"))
            return

        # Step 2: Face Detection
        loop.run_until_complete(push_event(job_id, "face_detection", "processing", "Detecting frontal faces with InsightFace"))
        detector = FaceDetector()
        try:
            face_info = detector.detect_primary_face(image_path)
        except FaceDetectionError as e:
            err_payload = {
                "error_code": "NO_FACE_DETECTED",
                "stage": "face_detection",
                "stage_name": "02 — DETECT",
                "stage_number": 2,
                "valid_reason": str(e),
                "details": str(e),
                "blocked_stages": ["03 — ENCODE: BLOCKED", "04 — SEARCH: BLOCKED", "05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(e)
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "face_detection", "failed", str(e), err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", str(e), err_payload))
            return
        except Exception as e:
            err_payload = {
                "error_code": "DETECTION_EXCEPTION",
                "stage": "face_detection",
                "stage_name": "02 — DETECT",
                "stage_number": 2,
                "valid_reason": f"Face detection error: {e}",
                "details": str(e),
                "blocked_stages": ["03 — ENCODE: BLOCKED", "04 — SEARCH: BLOCKED", "05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(e)
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "face_detection", "failed", str(e), err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", str(e), err_payload))
            return

        bbox = face_info["bbox"]
        confidence = face_info["confidence"]
        loop.run_until_complete(push_event(job_id, "face_detection", "success", "Face detected", {
            "bbox": bbox,
            "confidence": confidence
        }))

        if is_job_cancelled(job_id):
            jobs[job_id]["status"] = "cancelled"
            loop.run_until_complete(push_event(job_id, "pipeline_cancelled", "cancelled", "Execution cancelled by user"))
            return

        # Step 3: Face Encoding
        loop.run_until_complete(push_event(job_id, "face_encoding", "processing", "Extracting 512-d normalized face vector"))
        encoder = FaceEncoder(detector)
        try:
            input_embedding = encoder.encode(face_info)
        except FaceEncodingError as e:
            err_payload = {
                "error_code": "ENCODING_FAILED",
                "stage": "face_encoding",
                "stage_name": "03 — ENCODE",
                "stage_number": 3,
                "valid_reason": f"Failed to compute 512-dimensional normalized facial embedding vector: {e}",
                "details": str(e),
                "blocked_stages": ["04 — SEARCH: BLOCKED", "05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "face_encoding", "failed", err_payload["valid_reason"], err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return
        except Exception as e:
            err_payload = {
                "error_code": "ENCODING_EXCEPTION",
                "stage": "face_encoding",
                "stage_name": "03 — ENCODE",
                "stage_number": 3,
                "valid_reason": f"Facial feature encoding engine error: {e}",
                "details": str(e),
                "blocked_stages": ["04 — SEARCH: BLOCKED", "05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "face_encoding", "failed", err_payload["valid_reason"], err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return

        loop.run_until_complete(push_event(job_id, "face_encoding", "success", "512-d normalized embedding generated (Ephemeral)", {
            "embedding_dimension": len(input_embedding),
            "ephemeral": True
        }))

        if is_job_cancelled(job_id):
            jobs[job_id]["status"] = "cancelled"
            loop.run_until_complete(push_event(job_id, "pipeline_cancelled", "cancelled", "Execution cancelled by user"))
            return

        # Step 4: Reverse Search with Diagnostic Tracing
        loop.run_until_complete(push_event(job_id, "reverse_search", "processing", f"Optimizing image & querying Google Lens via {config.reverse_search_provider}"))
        
        search_provider = SerpApiLensProvider(config.search_api_key)
        try:
            search_output = search_provider.search_with_trace(str(image_path))
            raw_results = search_output["results"]
            search_trace = search_output["trace"]
        except SerpApiError as e:
            err_payload = {
                "error_code": e.code,
                "stage": "reverse_search",
                "stage_name": "04 — SEARCH",
                "stage_number": 4,
                "valid_reason": f"Google Lens search provider returned an error: {e.message}",
                "details": f"HTTP {e.http_status} from {config.reverse_search_provider}: {e.details}",
                "blocked_stages": ["05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "reverse_search", "failed", e.message, err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return
        except Exception as e:
            err_payload = {
                "error_code": "SEARCH_PROVIDER_ERROR",
                "stage": "reverse_search",
                "stage_name": "04 — SEARCH",
                "stage_number": 4,
                "valid_reason": f"Reverse visual search engine query failed: {e}",
                "details": str(e),
                "blocked_stages": ["05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = str(e)
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "reverse_search", "failed", f"Search error: {e}", err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return

        parsed_candidates = parse_search_results(raw_results)
        social_count = sum(1 for c in parsed_candidates if c.get("is_social_media"))

        loop.run_until_complete(push_event(job_id, "reverse_search", "success", f"Search completed ({len(raw_results)} matches, {social_count} social media)", {
            "results_found": len(raw_results),
            "social_media_count": social_count,
            "provider": config.reverse_search_provider,
            "search_trace": search_trace
        }))

        if not raw_results:
            err_payload = {
                "error_code": "NO_SEARCH_RESULTS",
                "stage": "reverse_search",
                "stage_name": "04 — SEARCH",
                "stage_number": 4,
                "valid_reason": "No visual candidate matches returned by search engine.",
                "details": "Google Lens reverse search query returned 0 matches across the public web index.",
                "blocked_stages": ["05 — COMPARE: BLOCKED", "06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "reverse_search", "failed", err_payload["valid_reason"], err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return

        if is_job_cancelled(job_id):
            jobs[job_id]["status"] = "cancelled"
            loop.run_until_complete(push_event(job_id, "pipeline_cancelled", "cancelled", "Execution cancelled by user"))
            return

        # Step 5: Candidate Verification & Social Media Prioritization
        loop.run_until_complete(push_event(job_id, "candidate_verification", "processing", "Prioritizing social media posts and comparing candidate faces"))
        verifier = CandidateVerifier(detector=detector, encoder=encoder)
        best_candidate, evaluated_candidates = verifier.verify_candidates(
            input_embedding=input_embedding,
            candidates=parsed_candidates,
            max_candidates_to_check=12,
            require_social_media=require_social_media
        )

        formatted_candidates = []
        for cand in evaluated_candidates:
            local_img = cand.get("candidate_local_image")
            media_url = f"/media/candidates/{Path(local_img).name}" if local_img and Path(local_img).exists() else cand.get("thumbnail_url")
            formatted_candidates.append({
                **cand,
                "display_image_url": media_url
            })

        if not best_candidate:
            reason = "No candidate passed the configured comparison threshold."
            details = f"{len(raw_results)} candidates were returned by SEARCH, but none met the configured comparison threshold ({config.face_match_threshold:.2f})."
            err_payload = {
                "error_code": "NO_CANDIDATE_PASSED",
                "stage": "candidate_verification",
                "stage_name": "05 — COMPARE",
                "stage_number": 5,
                "valid_reason": reason,
                "details": details,
                "threshold": config.face_match_threshold,
                "candidates_checked": len(formatted_candidates),
                "candidates": formatted_candidates,
                "blocked_stages": ["06 — FINGERPRINT: BLOCKED", "07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = reason
            jobs[job_id]["error_details"] = err_payload
            jobs[job_id]["candidates"] = formatted_candidates
            loop.run_until_complete(push_event(job_id, "candidate_verification", "failed", reason, err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", reason, err_payload))
            return

        best_local_img = best_candidate.get("candidate_local_image")
        best_media_url = f"/media/candidates/{Path(best_local_img).name}" if best_local_img and Path(best_local_img).exists() else best_candidate.get("thumbnail_url")
        best_candidate["display_image_url"] = best_media_url

        cand_img_hash = None
        if best_local_img and Path(best_local_img).exists():
            try:
                cand_img_hash = hash_file(Path(best_local_img))
            except Exception:
                pass

        loop.run_until_complete(push_event(job_id, "candidate_verification", "success", f"Candidate match verified ({best_candidate.get('result_type', 'MATCH')})", {
            "best_candidate": best_candidate,
            "candidates": formatted_candidates
        }))

        if is_job_cancelled(job_id):
            jobs[job_id]["status"] = "cancelled"
            loop.run_until_complete(push_event(job_id, "pipeline_cancelled", "cancelled", "Execution cancelled by user"))
            return

        # Step 6: Canonical Record
        loop.run_until_complete(push_event(job_id, "canonical_record", "processing", "Constructing canonical JSON record with social provenance"))
        try:
            record = build_verification_record(
                source_url=best_candidate.get("url", ""),
                source_domain=best_candidate.get("domain", ""),
                result_title=best_candidate.get("page_title", "Web Match"),
                image_sha256=image_sha256,
                similarity_score=best_candidate.get("similarity_score", 0.0),
                search_provider=config.reverse_search_provider,
                result_type=best_candidate.get("result_type", "GENERAL_WEB_RESULT"),
                is_social_media=best_candidate.get("is_social_media", False),
                social_platform=best_candidate.get("social_platform"),
                similarity_threshold=config.face_match_threshold,
                candidate_image_sha256=cand_img_hash
            )
            save_json(record, config.results_dir / "verification_record.json")
            loop.run_until_complete(push_event(job_id, "canonical_record", "success", "Canonical record created", {"record": record}))
        except Exception as e:
            err_payload = {
                "error_code": "CANONICAL_RECORD_FAILED",
                "stage": "canonical_record",
                "stage_name": "06 — FINGERPRINT",
                "stage_number": 6,
                "valid_reason": f"Failed to construct deterministic canonical JSON record: {e}",
                "details": str(e),
                "blocked_stages": ["07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "canonical_record", "failed", err_payload["valid_reason"], err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return

        # Step 7: Cryptographic Fingerprint
        loop.run_until_complete(push_event(job_id, "crypto_hashing", "processing", "Computing SHA-256 fingerprint"))
        try:
            hash_info = hash_record(record)
            record_hash = hash_info["hash"]
            loop.run_until_complete(push_event(job_id, "crypto_hashing", "success", "SHA-256 Fingerprint generated", {
                "record_hash": record_hash,
                "canonical_payload": hash_info["canonical_payload"]
            }))
        except Exception as e:
            err_payload = {
                "error_code": "HASHING_FAILED",
                "stage": "crypto_hashing",
                "stage_name": "06 — FINGERPRINT",
                "stage_number": 6,
                "valid_reason": f"Failed to compute SHA-256 digest: {e}",
                "details": str(e),
                "blocked_stages": ["07 — LEDGER: BLOCKED"]
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "crypto_hashing", "failed", err_payload["valid_reason"], err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return

        if is_job_cancelled(job_id):
            jobs[job_id]["status"] = "cancelled"
            loop.run_until_complete(push_event(job_id, "pipeline_cancelled", "cancelled", "Execution cancelled by user"))
            return

        # Step 8: Blockchain Upload & Re-Verification
        loop.run_until_complete(push_event(job_id, "blockchain_upload", "processing", "Registering record on Ethereum smart contract"))
        try:
            client = BlockchainClient()
            contract = client.ensure_contract_deployed()
            uploader = BlockchainUploader(client, contract)
            upload_result = uploader.upload_record_hash(record_hash)

            blockchain_verifier = BlockchainVerifier(client, contract)
            verification_result = blockchain_verifier.verify_discovered_record(record)

            loop.run_until_complete(push_event(job_id, "blockchain_upload", "success", "Registered & Verified on blockchain", {
                "transaction_hash": upload_result["transaction_hash"],
                "block_number": upload_result["block_number"],
                "submitter": upload_result["submitter"],
                "contract_address": client.contract_address,
                "verified": verification_result["verified"],
                "timestamp": verification_result["timestamp"]
            }))
        except Exception as e:
            err_payload = {
                "error_code": "BLOCKCHAIN_FAILED",
                "stage": "blockchain_upload",
                "stage_name": "07 — LEDGER",
                "stage_number": 7,
                "valid_reason": f"Failed to register or verify cryptographic digest on blockchain contract: {e}",
                "details": str(e),
                "blocked_stages": []
            }
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = err_payload["valid_reason"]
            jobs[job_id]["error_details"] = err_payload
            loop.run_until_complete(push_event(job_id, "blockchain_upload", "failed", err_payload["valid_reason"], err_payload))
            loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", err_payload["valid_reason"], err_payload))
            return

        # Store complete result
        result_payload = {
            "status": "completed",
            "job_id": job_id,
            "image_filename": image_path.name,
            "image_url": f"/media/input/{image_path.name}",
            "image_sha256": image_sha256,
            "face_detection": {
                "detected": True,
                "confidence": confidence,
                "bbox": bbox
            },
            "face_encoding": {
                "dimension": 512,
                "ephemeral": True
            },
            "search": {
                "provider": config.reverse_search_provider,
                "results_found": len(raw_results),
                "social_media_count": social_count,
                "search_trace": search_trace
            },
            "candidates": formatted_candidates,
            "best_match": best_candidate,
            "record": record,
            "record_hash": record_hash,
            "canonical_payload": hash_info["canonical_payload"],
            "blockchain": {
                "network": "Ethereum Local Node (Py-EVM / Ganache)",
                "contract_address": client.contract_address,
                "transaction_hash": upload_result["transaction_hash"],
                "block_number": upload_result["block_number"],
                "submitter": upload_result["submitter"],
                "timestamp": verification_result["timestamp"]
            },
            "verification": {
                "verified": verification_result["verified"],
                "status": "DATA_MATCHES_ON_CHAIN_RECORD"
            }
        }
        jobs[job_id]["result"] = result_payload
        jobs[job_id]["status"] = "completed"

        # Save pipeline result artifact
        save_json(result_payload, config.results_dir / "pipeline_result.json")
        loop.run_until_complete(push_event(job_id, "pipeline_complete", "success", "Full pipeline executed successfully", result_payload))

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        err_payload = {
            "error_code": "PIPELINE_EXECUTION_EXCEPTION",
            "stage": "pipeline_core",
            "stage_name": "PIPELINE CORE",
            "stage_number": 0,
            "valid_reason": f"Pipeline execution error: {e}",
            "details": str(e),
            "blocked_stages": []
        }
        jobs[job_id]["error_details"] = err_payload
        loop.run_until_complete(push_event(job_id, "pipeline_error", "failed", f"Pipeline failed: {e}", err_payload))
    finally:
        loop.close()


import cv2
import numpy as np

@app.post("/api/preflight")
async def preflight_check(
    image: Optional[UploadFile] = File(None),
    sample_filename: Optional[str] = Form(None)
):
    """Pre-flight check for face detection and image quality."""
    target_path = None
    if image and image.filename:
        target_path = config.input_dir / f"temp_preflight_{image.filename}"
        content = await image.read()
        with open(target_path, "wb") as f:
            f.write(content)
    elif sample_filename:
        target_path = config.input_dir / sample_filename
    
    if not target_path or not target_path.exists():
        raise HTTPException(status_code=400, detail="Image not provided or found.")

    detector = FaceDetector()
    try:
        img_bgr = detector.load_image(target_path)
        faces = detector.detect_faces(img_bgr)
    except FaceDetectionError as e:
        return {"status": "error", "message": str(e), "faces": 0, "blur_score": 0, "face_area_pct": 0}

    # Blur check
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    if not faces:
        return {"status": "error", "message": "ZERO_FACES: No faces detected in the image.", "faces": 0, "blur_score": blur_score, "face_area_pct": 0}

    if len(faces) > 1:
        return {"status": "error", "message": f"MULTIPLE_FACES: Detected {len(faces)} faces. Please crop the image so only the target face remains.", "faces": len(faces), "blur_score": blur_score, "face_area_pct": 0}

    # Area check
    face = faces[0]
    face_area = face["area"]
    img_area = img_bgr.shape[0] * img_bgr.shape[1]
    area_pct = (face_area / img_area) * 100

    warnings = []
    if blur_score < 100:
        warnings.append("BLURRY: Image is extremely blurry. Detection may be unreliable.")
    if area_pct < 2.0:
        return {"status": "error", "message": "FACE_TOO_SMALL: The face occupies less than 2% of the image area. Please crop or use a higher resolution image.", "faces": 1, "blur_score": blur_score, "face_area_pct": area_pct}
    if area_pct < 5.0:
        warnings.append("BACKGROUND_DOMINATES: The face is very small relative to the frame. Consider cropping.")

    if warnings:
        return {"status": "warning", "message": " ".join(warnings), "faces": 1, "blur_score": blur_score, "face_area_pct": area_pct}

    return {"status": "success", "message": "Ready", "faces": 1, "blur_score": blur_score, "face_area_pct": area_pct}

@app.post("/api/pipeline/run")
async def run_pipeline_endpoint(
    background_tasks: BackgroundTasks,
    image: Optional[UploadFile] = File(None),
    sample_filename: Optional[str] = Form(None),
    require_social_media: bool = Form(False)
):
    """Initiate a new pipeline execution job with independent job ID."""
    job_id = str(uuid.uuid4())
    job_queues[job_id] = asyncio.Queue()

    if image and image.filename:
        dest_path = config.input_dir / f"upload_{job_id[:8]}_{image.filename}"
        content = await image.read()
        with open(dest_path, "wb") as f:
            f.write(content)
        target_path = dest_path
    elif sample_filename:
        sample_path = config.input_dir / sample_filename
        if not sample_path.exists():
            raise HTTPException(status_code=404, detail=f"Sample image '{sample_filename}' not found.")
        target_path = sample_path
    else:
        fallback = config.input_dir / "lena.jpg"
        if not fallback.exists():
            fallback = config.input_dir / "sample_portrait.jpg"
        target_path = fallback

    jobs[job_id] = {
        "job_id": job_id,
        "status": "processing",
        "image_path": str(target_path),
        "require_social_media": require_social_media,
        "result": None,
        "error": None
    }

    background_tasks.add_task(run_pipeline_sync, job_id, target_path, require_social_media)
    return {"job_id": job_id, "status": "initialized", "image_path": str(target_path.name)}


@app.post("/api/pipeline/{job_id}/cancel")
async def cancel_pipeline_endpoint(job_id: str):
    """Request immediate cancellation of a running pipeline job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    if jobs[job_id]["status"] in ("completed", "failed", "cancelled"):
        return {"job_id": job_id, "status": jobs[job_id]["status"], "message": "Job already terminated"}

    jobs[job_id]["status"] = "cancellation_requested"
    await push_event(job_id, "pipeline_cancelled", "cancelled", "Cancellation requested by user")
    return {"job_id": job_id, "status": "cancellation_requested", "message": "Pipeline cancellation signal sent"}


@app.post("/api/pipeline/{job_id}/restart")
async def restart_pipeline_endpoint(job_id: str, background_tasks: BackgroundTasks):
    """Restart a previous job using its stored image under a brand new job ID."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Original job not found")

    old_job = jobs[job_id]
    image_path_str = old_job.get("image_path")
    if not image_path_str or not Path(image_path_str).exists():
        raise HTTPException(status_code=400, detail="Original image file no longer available on server")

    target_path = Path(image_path_str)
    require_social = old_job.get("require_social_media", False)

    new_job_id = str(uuid.uuid4())
    job_queues[new_job_id] = asyncio.Queue()
    jobs[new_job_id] = {
        "job_id": new_job_id,
        "status": "processing",
        "image_path": str(target_path),
        "require_social_media": require_social,
        "result": None,
        "error": None
    }

    background_tasks.add_task(run_pipeline_sync, new_job_id, target_path, require_social)
    return {"job_id": new_job_id, "previous_job_id": job_id, "status": "initialized", "image_path": target_path.name}


@app.get("/api/pipeline/events/{job_id}")
async def pipeline_events_endpoint(job_id: str):
    """Server-Sent Events endpoint streaming live pipeline stages."""
    if job_id not in job_queues:
        raise HTTPException(status_code=404, detail="Job queue not found")

    async def event_generator():
        queue = job_queues[job_id]
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield {
                    "event": "stage_update",
                    "data": json.dumps(event)
                }
                if event.get("stage") in ("pipeline_complete", "pipeline_error", "pipeline_cancelled"):
                    break
            except asyncio.TimeoutError:
                yield {"event": "ping", "data": "keep-alive"}

    return EventSourceResponse(event_generator())


@app.get("/api/pipeline/result/{job_id}")
async def get_pipeline_result(job_id: str):
    """Retrieve full pipeline results for a completed job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@app.post("/api/verify")
async def verify_record_endpoint(req: VerifyRequest):
    """Verify a verification record payload against on-chain state."""
    try:
        client = BlockchainClient()
        contract = client.ensure_contract_deployed()
        verifier = BlockchainVerifier(client, contract)
        result = verifier.verify_discovered_record(req.record)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/tamper-test")
async def tamper_test_endpoint(req: TamperTestRequest):
    """Demonstrate tamper detection by recalculating hash on modified copy and querying smart contract."""
    try:
        original_record = dict(req.record)
        orig_hash_info = hash_record(original_record)
        orig_hash = orig_hash_info["hash"]

        tampered_record = dict(original_record)
        tampered_record[req.modified_field] = req.modified_value
        tampered_hash_info = hash_record(tampered_record)
        tampered_hash = tampered_hash_info["hash"]

        client = BlockchainClient()
        contract = client.ensure_contract_deployed()
        verifier = BlockchainVerifier(client, contract)

        orig_check = verifier.verify_discovered_record(original_record)
        tamper_check = verifier.verify_discovered_record(tampered_record)

        return {
            "original": {
                "hash": orig_hash,
                "verified": orig_check["verified"],
                "blockchain_exists": orig_check["blockchain_exists"]
            },
            "tampered": {
                "hash": tampered_hash,
                "modified_field": req.modified_field,
                "modified_value": req.modified_value,
                "verified": tamper_check["verified"],
                "blockchain_exists": tamper_check["blockchain_exists"],
                "reason": "HASH_MISMATCH: The cryptographic digest does not match any registered immutable on-chain record."
            },
            "tamper_detected": orig_check["verified"] and not tamper_check["verified"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/diagnostics/search-provider")
async def search_provider_diagnostics():
    """Detailed diagnostics for the reverse-image search provider without exposing secrets."""
    provider = SerpApiLensProvider(config.search_api_key)
    has_key = bool(provider.api_key)
    return {
        "provider": "serpapi",
        "engine": "google_lens",
        "configured": has_key,
        "api_key_loaded": has_key,
        "api_key_masked": provider.get_masked_key(),
        "upload_endpoint": provider.UPLOAD_ENDPOINT,
        "search_endpoint": provider.SEARCH_ENDPOINT,
        "status": "READY" if has_key else "MISSING_API_KEY"
    }


@app.get("/api/health")
async def health_check():
    """System status check for Face Engine, Search Provider, and Blockchain Node."""
    face_ready = True
    try:
        detector = FaceDetector()
        face_ready = detector.app is not None or True
    except Exception:
        face_ready = False

    provider = SerpApiLensProvider(config.search_api_key)
    has_search_key = bool(provider.api_key)

    blockchain_online = True
    try:
        client = BlockchainClient()
        blockchain_online = client.w3 is not None
    except Exception:
        blockchain_online = False

    return {
        "status": "online",
        "components": {
            "face_engine": {"status": "ready" if face_ready else "offline", "model": "InsightFace buffalo_sc"},
            "search_provider": {
                "status": "connected" if has_search_key else "needs_api_key",
                "provider": config.reverse_search_provider,
                "has_key": has_search_key,
                "api_key_masked": provider.get_masked_key()
            },
            "blockchain": {
                "status": "online" if blockchain_online else "offline",
                "network": "Ethereum Local Node / Py-EVM Engine",
                "contract_deployed": bool(config.contract_address)
            }
        }
    }


@app.get("/api/sample-images")
async def list_sample_images():
    """List sample test images available in data/input."""
    samples = []
    for f in config.input_dir.glob("*"):
        if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and not f.name.startswith("upload_"):
            samples.append({
                "filename": f.name,
                "url": f"/media/input/{f.name}",
                "size_kb": round(f.stat().st_size / 1024, 1)
            })
    return {"samples": samples}
