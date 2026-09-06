"""
End-to-End Pipeline Integration Test.
Verifies full flow: Image -> Face Detection -> Embedding -> Search -> Candidate Verification -> Canonical Record -> SHA-256 -> Blockchain Upload -> Re-verification -> Artifact Generation.
"""

import pytest
import numpy as np
import cv2
from pathlib import Path
from src.face.detector import FaceDetector
from src.face.encoder import FaceEncoder
from src.face.matcher import FaceMatcher
from src.search.providers.factory import SearchProviderFactory
from src.search.providers.base import ReverseSearchProvider
from src.search.candidate_downloader import CandidateDownloader
from src.search.candidate_verifier import CandidateVerifier
from src.record.metadata_builder import build_verification_record
from src.crypto.hashing import hash_file, hash_record
from src.blockchain.client import BlockchainClient
from src.blockchain.uploader import BlockchainUploader
from src.blockchain.verifier import BlockchainVerifier
from src.utils.helpers import save_json


class E2EMockProvider(ReverseSearchProvider):
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    @property
    def provider_name(self) -> str:
        return "e2e_mock"

    def search(self, image_path: str) -> list:
        # Returns candidate linking to local candidate image fixture
        return [
            {
                "title": "Verified Public Researcher Profile",
                "url": "https://university.example.org/staff/researcher",
                "source": "university.example.org",
                "thumbnail_url": f"file://{image_path}",
                "description": "Public Directory Profile",
                "provider": "e2e_mock"
            }
        ]


class LocalFileDownloader(CandidateDownloader):
    """Custom downloader for offline e2e test passing through local file paths."""
    def download(self, image_url: str) -> Path:
        if image_url.startswith("file://"):
            return Path(image_url[7:])
        return super().download(image_url)


def test_full_pipeline_end_to_end(tmp_path):
    # 1. Create test face image
    sample_file = Path("data/input/lena.jpg")
    img_path = tmp_path / "e2e_face.jpg"
    if sample_file.exists():
        img = cv2.imread(str(sample_file))
        cv2.imwrite(str(img_path), img)
    else:
        img = np.full((300, 300, 3), 220, dtype=np.uint8)
        cv2.ellipse(img, (150, 150), (80, 100), 0, 0, 360, (200, 170, 130), -1)
        cv2.circle(img, (120, 130), 10, (255, 255, 255), -1)
        cv2.circle(img, (180, 130), 10, (255, 255, 255), -1)
        cv2.circle(img, (120, 130), 5, (50, 30, 10), -1)
        cv2.circle(img, (180, 130), 5, (50, 30, 10), -1)
        cv2.line(img, (150, 135), (150, 170), (160, 130, 100), 2)
        cv2.ellipse(img, (150, 195), (30, 15), 0, 0, 180, (60, 60, 160), -1)
        cv2.imwrite(str(img_path), img)

    image_sha256 = hash_file(img_path)
    assert len(image_sha256) == 64

    # 2. Face detection
    detector = FaceDetector()
    face_info = detector.detect_primary_face(img_path)
    assert face_info["face_detected"] is True

    # 3. Face encoding
    encoder = FaceEncoder(detector)
    input_embedding = encoder.encode(face_info)
    assert len(input_embedding) == 512

    # 4. Search provider execution
    SearchProviderFactory.register("e2e_mock", E2EMockProvider)
    search_provider = SearchProviderFactory.create("e2e_mock")
    raw_results = search_provider.search(str(img_path))
    assert len(raw_results) == 1

    # 5. Candidate verification
    local_downloader = LocalFileDownloader(output_dir=tmp_path / "candidates")
    verifier = CandidateVerifier(
        detector=detector,
        encoder=encoder,
        matcher=FaceMatcher(threshold=0.60),
        downloader=local_downloader
    )
    best_candidate, evaluated = verifier.verify_candidates(input_embedding, raw_results)
    assert best_candidate is not None
    assert best_candidate["similarity_score"] >= 0.60

    # 6. Canonical record construction
    record = build_verification_record(
        source_url=best_candidate["url"],
        source_domain=best_candidate["source"],
        result_title=best_candidate["title"],
        image_sha256=image_sha256,
        similarity_score=best_candidate["similarity_score"],
        search_provider="e2e_mock"
    )

    # 7. Cryptographic fingerprinting
    hash_result = hash_record(record)
    record_hash = hash_result["hash"]
    assert len(record_hash) == 64

    # 8. Blockchain upload and on-chain re-verification
    client = BlockchainClient(use_tester_fallback=True)
    contract = client.ensure_contract_deployed()
    uploader = BlockchainUploader(client, contract)
    blockchain_verifier = BlockchainVerifier(client, contract)

    upload_info = uploader.upload_record_hash(record_hash)
    assert upload_info["status"] == "success"

    verify_info = blockchain_verifier.verify_discovered_record(record)
    assert verify_info["verified"] is True
    assert verify_info["local_hash"] == record_hash
    assert verify_info["blockchain_exists"] is True
