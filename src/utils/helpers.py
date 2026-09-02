"""
General Helper Functions for FaceTrace Ledger.
"""

import json
from pathlib import Path
from typing import Any, Dict
from datetime import datetime, timezone


def get_utc_timestamp() -> str:
    """Return current UTC time in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


def save_json(data: Any, filepath: Path, indent: int = 2) -> None:
    """Save data to JSON file safely."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


def load_json(filepath: Path) -> Dict[str, Any]:
    """Load JSON file safely."""
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)
