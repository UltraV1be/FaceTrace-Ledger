"""
Tests for Canonicalization and Verification Record Builder.
"""

import pytest
from src.record.canonicalizer import canonicalize
from src.record.metadata_builder import build_verification_record


def test_canonicalize_reordered_keys():
    d1 = {"b": 2, "a": 1, "c": [1, 2, 3]}
    d2 = {"a": 1, "c": [1, 2, 3], "b": 2}
    assert canonicalize(d1) == canonicalize(d2)
    assert canonicalize(d1) == '{"a":1,"b":2,"c":[1,2,3]}'


def test_build_verification_record_valid():
    record = build_verification_record(
        source_url="https://example.com/profile.jpg",
        source_domain="example.com",
        result_title="User Profile",
        image_sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        similarity_score=0.887654,
        search_provider="serpapi_lens",
        verified_at="2026-09-02T05:00:00Z"
    )
    assert record["record_version"] == "1.0"
    assert record["similarity_score"] == 0.8877
    assert "raw_embedding" not in record
    assert "face_vector" not in record


def test_build_verification_record_invalid_sha256():
    with pytest.raises(ValueError):
        build_verification_record(
            source_url="https://example.com",
            source_domain="example.com",
            result_title="Title",
            image_sha256="short_hash",
            similarity_score=0.9,
            search_provider="test"
        )
