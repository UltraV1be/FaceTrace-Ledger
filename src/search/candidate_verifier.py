"""
Candidate Face Verifier for FaceTrace Ledger.
Downloads candidate images, detects faces, extracts embeddings, and compares with input face.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from src.config import config
from src.face.detector import FaceDetector, FaceDetectionError
from src.face.encoder import FaceEncoder, FaceEncodingError
from src.face.matcher import FaceMatcher
from src.search.candidate_downloader import CandidateDownloader, CandidateDownloadError
from src.utils.logger import logger, log_success, log_fail


class CandidateVerifier:
    def __init__(
        self,
        detector: Optional[FaceDetector] = None,
        encoder: Optional[FaceEncoder] = None,
        matcher: Optional[FaceMatcher] = None,
        downloader: Optional[CandidateDownloader] = None
    ):
        self.detector = detector or FaceDetector()
        self.encoder = encoder or FaceEncoder(self.detector)
        self.matcher = matcher or FaceMatcher()
        self.downloader = downloader or CandidateDownloader()

    def verify_candidates(
        self,
        input_embedding: np.ndarray,
        candidates: List[Dict[str, Any]],
        max_candidates_to_check: int = 10
    ) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Evaluate candidate search results against the input face embedding.
        
        Returns:
            Tuple of (best_matching_candidate or None, list_of_all_evaluated_candidates)
        """
        evaluated: List[Dict[str, Any]] = []

        subset = candidates[:max_candidates_to_check]
        for idx, candidate in enumerate(subset, start=1):
            url = candidate.get("url")
            thumb_url = candidate.get("thumbnail_url")
            target_image_url = thumb_url or url

            print(f"\n  Candidate {idx}: {candidate.get('page_title', 'Untitled')}")
            print(f"  URL: {url}")

            if not target_image_url:
                print(f"    ✗ Skipped: No image URL available")
                continue

            try:
                # Step 1: Download candidate image
                cand_image_path = self.downloader.download(target_image_url)

                # Step 2: Detect face in candidate
                face_info = self.detector.detect_primary_face(cand_image_path)

                # Step 3: Extract candidate face embedding
                cand_embedding = self.encoder.encode(face_info)

                # Step 4: Compare cosine similarity against input face embedding
                comparison = self.matcher.compare(input_embedding, cand_embedding)
                sim_score = comparison["similarity_score"]
                is_match = comparison["match"]

                print(f"  Similarity: {sim_score:.4f} (Threshold: {comparison['threshold']})")
                if is_match:
                    log_success("PASSED THRESHOLD")
                else:
                    log_fail("BELOW THRESHOLD")

                eval_entry = {
                    **candidate,
                    "similarity_score": sim_score,
                    "face_detected": True,
                    "match": is_match,
                    "candidate_local_image": str(cand_image_path)
                }
                evaluated.append(eval_entry)

            except (CandidateDownloadError, FaceDetectionError, FaceEncodingError) as e:
                print(f"    ✗ Candidate evaluation note: {e}")
                evaluated.append({
                    **candidate,
                    "similarity_score": 0.0,
                    "face_detected": False,
                    "match": False,
                    "error": str(e)
                })
            except Exception as e:
                logger.debug(f"Unexpected error evaluating candidate {url}: {e}")
                evaluated.append({
                    **candidate,
                    "similarity_score": 0.0,
                    "face_detected": False,
                    "match": False,
                    "error": str(e)
                })

        # Rank evaluated candidates by similarity score descending
        evaluated.sort(key=lambda x: x.get("similarity_score", 0.0), reverse=True)

        best_match = None
        for item in evaluated:
            if item.get("match") is True:
                best_match = item
                break

        return best_match, evaluated
