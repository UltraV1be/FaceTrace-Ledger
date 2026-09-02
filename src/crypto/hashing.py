"""
Cryptographic Hashing for FaceTrace Ledger.
Implements SHA-256 hashing for files, strings, and canonical verification records.
"""

import hashlib
from pathlib import Path
from typing import Any, Dict
from src.record.canonicalizer import canonicalize


def hash_file(filepath: Path | str) -> str:
    """Compute SHA-256 hexadecimal digest of a file in chunks."""
    path = Path(filepath)
    if not path.is_file():
        raise FileNotFoundError(f"File not found for hashing: {filepath}")

    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest().lower()


def hash_string(content: str) -> str:
    """Compute SHA-256 hexadecimal digest of a UTF-8 string."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest().lower()


def hash_record(record: Dict[str, Any]) -> Dict[str, str]:
    """
    Produce a canonical SHA-256 cryptographic fingerprint for a verification record.
    
    Returns:
        Dict with keys: 'algorithm', 'hash', 'canonical_payload'
    """
    canonical_str = canonicalize(record)
    digest = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest().lower()
    return {
        "algorithm": "SHA-256",
        "hash": digest,
        "canonical_payload": canonical_str
    }


def hex_to_bytes32(hex_str: str) -> bytes:
    """
    Convert a 64-character hexadecimal SHA-256 string (with or without 0x) to 32 bytes for Solidity bytes32.
    """
    clean_hex = hex_str.strip()
    if clean_hex.startswith("0x") or clean_hex.startswith("0X"):
        clean_hex = clean_hex[2:]

    if len(clean_hex) != 64:
        raise ValueError(f"Invalid SHA-256 hex string length ({len(clean_hex)}). Expected 64 characters.")

    try:
        raw_bytes = bytes.fromhex(clean_hex)
        if len(raw_bytes) != 32:
            raise ValueError(f"Expected 32 bytes, got {len(raw_bytes)}")
        return raw_bytes
    except ValueError as e:
        raise ValueError(f"Failed to convert hex to bytes32: {e}")


def bytes32_to_hex(raw_bytes: bytes) -> str:
    """Convert 32 bytes back to a 64-char lowercase hexadecimal string."""
    if len(raw_bytes) != 32:
        raise ValueError(f"Expected 32 bytes, got {len(raw_bytes)}")
    return raw_bytes.hex().lower()
