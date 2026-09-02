"""
Result Parser for FaceTrace Ledger.
Validates URLs, cleans metadata, deduplicates, and extracts domains.
"""

from typing import Any, Dict, List
from urllib.parse import urlparse
from src.utils.helpers import get_utc_timestamp


def is_valid_url(url: str | None) -> bool:
    """Validate if a string is a well-formed HTTP/HTTPS URL."""
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def extract_domain(url: str) -> str:
    """Extract clean domain name from a URL."""
    try:
        parsed = urlparse(url.strip())
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc or "unknown"
    except Exception:
        return "unknown"


def parse_search_results(raw_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Parse, validate, and deduplicate search results.
    """
    cleaned: List[Dict[str, Any]] = []
    seen_urls = set()
    current_time = get_utc_timestamp()

    for item in raw_results:
        page_url = item.get("url") or item.get("link")
        if not is_valid_url(page_url):
            continue

        normalized_url = page_url.strip()
        if normalized_url in seen_urls:
            continue
        seen_urls.add(normalized_url)

        domain = extract_domain(normalized_url)
        title = (item.get("title") or item.get("name") or "Web Match").strip()
        thumb = item.get("thumbnail_url") or item.get("thumbnail") or item.get("image_url")
        desc = (item.get("description") or item.get("snippet") or "").strip()
        provider = item.get("provider", "unknown")

        cleaned.append({
            "url": normalized_url,
            "domain": domain,
            "page_title": title,
            "thumbnail_url": thumb if is_valid_url(thumb) else None,
            "description": desc,
            "provider": provider,
            "timestamp": current_time
        })

    return cleaned
