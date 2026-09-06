"""
Face Matcher for FaceTrace Ledger.
Calculates cosine similarity between face embeddings and evaluates threshold conformance.
"""

from typing import Any, Dict
import numpy as np
from src.config import config


def cosine_similarity(embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
    """
    Compute cosine similarity between two face embeddings.
    Formula: dot(a, b) / (norm(a) * norm(b))
    """
    a = np.asarray(embedding_a, dtype=np.float32).flatten()
    b = np.asarray(embedding_b, dtype=np.float32).flatten()

    if a.shape != b.shape:
        raise ValueError(f"Embedding shape mismatch: {a.shape} vs {b.shape}")

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    score = float(np.dot(a, b) / (norm_a * norm_b))
    # Bound between -1.0 and 1.0 to guard against precision edge cases
    return max(-1.0, min(1.0, score))


class FaceMatcher:
    def __init__(self, threshold: float | None = None):
        self.threshold = threshold if threshold is not None else config.face_match_threshold

    def compare(self, embedding_a: np.ndarray, embedding_b: np.ndarray) -> Dict[str, Any]:
        """
        Compare two embeddings and return similarity status with tiered confidence.
        Based on observed distribution: 1.0 (exact), ~0.87-0.92 (high), ~0.55-0.75 (probable), <0.55 (low)
        """
        similarity = cosine_similarity(embedding_a, embedding_b)
        score = max(0.0, similarity)
        
        # Tiered confidence bands
        if score >= 0.75:
            tier = "HIGH_CONFIDENCE_MATCH"
            passed = True
            evaluation = "High confidence biometric match"
        elif score >= 0.55:
            tier = "PROBABLE_MATCH"
            passed = True
            evaluation = "Probable biometric match"
        elif score >= 0.40:
            tier = "LOW_CONFIDENCE"
            passed = False
            evaluation = "Low confidence / Inconclusive"
        else:
            tier = "NO_MATCH"
            passed = False
            evaluation = "Candidate similarity below threshold"

        return {
            "similarity_score": round(score, 4),
            "threshold": 0.55,  # Using the lowest passing bound as the explicit threshold for UI
            "confidence_tier": tier,
            "match": passed,
            "evaluation": evaluation
        }
