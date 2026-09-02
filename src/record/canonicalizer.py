"""
Canonicalizer for Verification Records.
Ensures deterministic JSON serialization for consistent cryptographic hashing.
"""

import json
from typing import Any, Dict


def canonicalize(data: Dict[str, Any]) -> str:
    """
    Produce a deterministic, canonical JSON representation of a dictionary.
    
    Rules:
    - Keys are sorted alphabetically.
    - Compact separators without whitespace (',' and ':').
    - Unicode characters preserved (ensure_ascii=False).
    - Floats are rounded/formatted deterministically if needed.
    """
    if not isinstance(data, dict):
        raise TypeError(f"Expected dict for canonicalization, got {type(data).__name__}")

    return json.dumps(
        data,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False
    )
