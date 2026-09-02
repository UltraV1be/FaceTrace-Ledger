"""
Metadata Builder for Canonical Verification Records.
Constructs sanitized, audit-ready verification records without exposing raw biometric data.
"""

from typing import Any, Dict
from src.utils.helpers import get_utc_timestamp


def build_verification_record(
    source_url: str,
    source_domain: str,
    result_title: str,
    image_sha256: str,
    similarity_score: float,
    search_provider: str,
    record_version: str = "1.0",
    verified_at: str | None = None
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

    return {
        "record_version": record_version,
        "source_url": str(source_url).strip(),
        "source_domain": str(source_domain).strip(),
        "result_title": str(result_title or "Untitled Web Match").strip(),
        "image_sha256": str(image_sha256).strip().lower(),
        "similarity_score": round(float(similarity_score), 4),
        "search_provider": str(search_provider).strip(),
        "verified_at": verified_at or get_utc_timestamp()
    }
