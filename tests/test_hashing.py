"""
Tests for Cryptographic Hashing and Conversions.
"""

import pytest
from src.crypto.hashing import hash_string, hash_file, hash_record, hex_to_bytes32, bytes32_to_hex


def test_hash_string_deterministic():
    content = "FaceTrace Ledger Secure Record"
    h1 = hash_string(content)
    h2 = hash_string(content)
    assert h1 == h2
    assert len(h1) == 64


def test_hash_string_collision_resistance():
    h1 = hash_string("Record A")
    h2 = hash_string("Record B")
    assert h1 != h2


def test_hash_record_deterministic():
    rec1 = {
        "record_version": "1.0",
        "source_url": "https://example.com/photo.jpg",
        "similarity_score": 0.85,
        "image_sha256": "a" * 64
    }
    rec2 = {
        "image_sha256": "a" * 64,
        "similarity_score": 0.85,
        "source_url": "https://example.com/photo.jpg",
        "record_version": "1.0"
    }
    # Reordered keys must produce exact same cryptographic fingerprint
    res1 = hash_record(rec1)
    res2 = hash_record(rec2)
    assert res1["hash"] == res2["hash"]
    assert res1["algorithm"] == "SHA-256"


def test_hash_record_tamper_detection():
    rec1 = {"score": 0.85, "url": "https://example.com"}
    rec2 = {"score": 0.86, "url": "https://example.com"}
    assert hash_record(rec1)["hash"] != hash_record(rec2)["hash"]


def test_bytes32_conversion_roundtrip():
    valid_hex = "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    raw_b32 = hex_to_bytes32(valid_hex)
    assert len(raw_b32) == 32
    reconstructed = bytes32_to_hex(raw_b32)
    assert reconstructed == valid_hex.lower()


def test_bytes32_conversion_with_0x_prefix():
    valid_hex = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    raw_b32 = hex_to_bytes32(valid_hex)
    assert len(raw_b32) == 32


def test_bytes32_conversion_invalid_length():
    with pytest.raises(ValueError):
        hex_to_bytes32("abc123")
