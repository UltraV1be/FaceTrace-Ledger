"""
Metadata Builder for Canonical Verification Records.
Constructs sanitized, audit-ready verification records without exposing raw biometric data.
Includes social media platform and post-level classification provenance.
"""

from typing import Any, Dict, Optional
from src.utils.helpers import get_utc_timestamp


def build_verification_record(
    source_url: str,
    source_domain: str,
    result_title: str,
    image_sha256: str,
    similarity_score: float,
    search_provider: str,
    result_type: str = "GENERAL_WEB_RESULT",
    is_social_media: bool = False,
    social_platform: Optional[str] = None,
    similarity_threshold: float = 0.65,
    candidate_image_sha256: Optional[str] = None,
    record_version: str = "1.0",
    verified_at: Optional[str] = None
) -> Dict[str, Any]:
    """
    Construct a canonical verification record.
    
    CRITICAL PRIVACY RULE:
    Raw biometric embeddings or face vectors MUST NEVER be included in this record.
    Only the input image hash, similarity score, and discovered provenance metadata are stored.
    """
    if not source_url:
        raise ValueError("source_url cannot be empty")
    if not image_sha256 or len(image_sha256) != 64:
        raise ValueError("image_sha256 must be a valid 64-character hex string")

    record: Dict[str, Any] = {
        "record_version": record_version,
        "source_url": str(source_url).strip(),
        "source_domain": str(source_domain).strip(),
        "result_type": str(result_type).strip(),
        "is_social_media": bool(is_social_media),
        "social_platform": str(social_platform).strip().lower() if social_platform else None,
        "result_title": str(result_title or "Untitled Match").strip(),
        "image_sha256": str(image_sha256).strip().lower(),
        "candidate_image_sha256": str(candidate_image_sha256).strip().lower() if candidate_image_sha256 else None,
        "similarity_score": round(float(similarity_score), 4),
        "similarity_threshold": round(float(similarity_threshold), 4),
        "search_provider": str(search_provider).strip(),
        "verified_at": verified_at or get_utc_timestamp()
    }

    return record
