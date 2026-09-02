"""
Result Parser and Social Media URL Classifier for FaceTrace Ledger.
Validates URLs, cleans metadata, deduplicates, detects social media platforms,
and classifies results into SOCIAL_MEDIA_POST, SOCIAL_MEDIA_PROFILE,
SOCIAL_MEDIA_PAGE, and GENERAL_WEB_RESULT.
"""

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from src.utils.helpers import get_utc_timestamp

# Centralized platform domain mappings
SOCIAL_MEDIA_DOMAINS: Dict[str, List[str]] = {
    "instagram": ["instagram.com", "instagr.am"],
    "facebook": ["facebook.com", "fb.com", "fb.watch", "m.facebook.com"],
    "x": ["x.com", "twitter.com", "t.co"],
    "reddit": ["reddit.com", "redd.it", "old.reddit.com"],
    "tiktok": ["tiktok.com"],
    "linkedin": ["linkedin.com"],
    "pinterest": ["pinterest.com", "pin.it", "pinterest.co.uk"],
    "threads": ["threads.net"],
    "youtube": ["youtube.com", "youtu.be", "m.youtube.com"],
}

# Non-profile system routes for major platforms
SYSTEM_ROUTES = {
    "explore", "about", "legal", "help", "settings", "terms", "privacy",
    "login", "signup", "accounts", "direct", "stories", "tags", "search",
    "home", "i", "notifications", "messages", "feed", "jobs", "mynetwork"
}


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
        # Remove common prefixes
        for prefix in ("www.", "m.", "mobile.", "old."):
            if netloc.startswith(prefix):
                netloc = netloc[len(prefix):]
        # Remove port if present
        if ":" in netloc:
            netloc = netloc.split(":")[0]
        return netloc or "unknown"
    except Exception:
        return "unknown"


def detect_social_platform(hostname: str) -> Optional[str]:
    """Identify which social platform a hostname belongs to."""
    clean_host = hostname.lower()
    for prefix in ("www.", "m.", "mobile.", "old."):
        if clean_host.startswith(prefix):
            clean_host = clean_host[len(prefix):]
    if ":" in clean_host:
        clean_host = clean_host.split(":")[0]

    for platform, domains in SOCIAL_MEDIA_DOMAINS.items():
        for domain in domains:
            if clean_host == domain or clean_host.endswith("." + domain):
                return platform
    return None


def classify_url(url: str | None) -> Dict[str, Any]:
    """
    Classify a URL into structured provenance metadata.
    
    Returns:
        {
            "url": str,
            "domain": str,
            "is_social_media": bool,
            "social_platform": Optional[str],
            "result_type": "SOCIAL_MEDIA_POST" | "SOCIAL_MEDIA_PROFILE" | "SOCIAL_MEDIA_PAGE" | "GENERAL_WEB_RESULT"
        }
    """
    if not is_valid_url(url):
        return {
            "url": url or "",
            "domain": "invalid",
            "is_social_media": False,
            "social_platform": None,
            "result_type": "GENERAL_WEB_RESULT"
        }

    assert url is not None
    parsed = urlparse(url.strip())
    domain = extract_domain(url)
    platform = detect_social_platform(parsed.netloc)

    if not platform:
        return {
            "url": url.strip(),
            "domain": domain,
            "is_social_media": False,
            "social_platform": None,
            "result_type": "GENERAL_WEB_RESULT"
        }

    path = parsed.path.strip()
    path_lower = path.lower()
    segments = [s for s in path.strip("/").split("/") if s]

    result_type = "SOCIAL_MEDIA_PAGE"  # Default social fallback

    if platform == "instagram":
        if any(path_lower.startswith(p) for p in ("/p/", "/reel/", "/reels/", "/tv/")):
            result_type = "SOCIAL_MEDIA_POST"
        elif not segments or segments[0].lower() in SYSTEM_ROUTES:
            result_type = "SOCIAL_MEDIA_PAGE"
        elif len(segments) >= 1:
            result_type = "SOCIAL_MEDIA_PROFILE"

    elif platform == "x":
        if len(segments) >= 3 and segments[1].lower() == "status":
            result_type = "SOCIAL_MEDIA_POST"
        elif not segments or segments[0].lower() in SYSTEM_ROUTES:
            result_type = "SOCIAL_MEDIA_PAGE"
        elif len(segments) == 1:
            result_type = "SOCIAL_MEDIA_PROFILE"

    elif platform == "reddit":
        if "/comments/" in path_lower or (len(segments) >= 4 and segments[0] == "r" and segments[2] == "comments"):
            result_type = "SOCIAL_MEDIA_POST"
        elif len(segments) >= 2 and segments[0] in ("user", "u"):
            result_type = "SOCIAL_MEDIA_PROFILE"
        elif len(segments) >= 1 and segments[0] == "r":
            result_type = "SOCIAL_MEDIA_PAGE"
        elif not segments:
            result_type = "SOCIAL_MEDIA_PAGE"

    elif platform == "tiktok":
        if any(seg.startswith("@") for seg in segments) and "video" in segments:
            result_type = "SOCIAL_MEDIA_POST"
        elif "/video/" in path_lower:
            result_type = "SOCIAL_MEDIA_POST"
        elif segments and segments[0].startswith("@"):
            result_type = "SOCIAL_MEDIA_PROFILE"

    elif platform == "linkedin":
        if any(path_lower.startswith(p) for p in ("/feed/update/", "/posts/", "/pulse/")):
            result_type = "SOCIAL_MEDIA_POST"
        elif path_lower.startswith("/in/"):
            result_type = "SOCIAL_MEDIA_PROFILE"
        elif path_lower.startswith("/company/") or path_lower.startswith("/school/"):
            result_type = "SOCIAL_MEDIA_PAGE"

    elif platform == "pinterest":
        if path_lower.startswith("/pin/"):
            result_type = "SOCIAL_MEDIA_POST"
        elif not segments or segments[0].lower() in SYSTEM_ROUTES:
            result_type = "SOCIAL_MEDIA_PAGE"
        elif len(segments) == 1:
            result_type = "SOCIAL_MEDIA_PROFILE"

    elif platform == "facebook":
        if any(p in path_lower for p in ("/posts/", "/permalink.php", "/photo.php", "/photo/", "/photos/", "/video.php", "/videos/", "/reel/", "/reels/", "/story.php")):
            result_type = "SOCIAL_MEDIA_POST"
        elif any(p in path_lower for p in ("/profile.php", "/people/")):
            result_type = "SOCIAL_MEDIA_PROFILE"
        elif any(p in path_lower for p in ("/pages/", "/groups/")):
            result_type = "SOCIAL_MEDIA_PAGE"
        elif len(segments) == 1 and segments[0].lower() not in SYSTEM_ROUTES:
            result_type = "SOCIAL_MEDIA_PROFILE"

    elif platform == "threads":
        if "/post/" in path_lower:
            result_type = "SOCIAL_MEDIA_POST"
        elif segments and segments[0].startswith("@"):
            result_type = "SOCIAL_MEDIA_PROFILE"

    elif platform == "youtube":
        if path_lower.startswith("/watch") or path_lower.startswith("/shorts/") or "/community" in path_lower:
            result_type = "SOCIAL_MEDIA_POST"
        elif any(path_lower.startswith(p) for p in ("/@", "/channel/", "/user/", "/c/")):
            result_type = "SOCIAL_MEDIA_PROFILE"

    return {
        "url": url.strip(),
        "domain": domain,
        "is_social_media": True,
        "social_platform": platform,
        "result_type": result_type
    }


def parse_search_results(raw_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Parse, validate, deduplicate, and classify search results.
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

        classification = classify_url(normalized_url)
        title = (item.get("title") or item.get("name") or "Web Match").strip()
        thumb = item.get("thumbnail_url") or item.get("thumbnail") or item.get("image_url")
        desc = (item.get("description") or item.get("snippet") or "").strip()
        provider = item.get("provider", "unknown")

        cleaned.append({
            "url": normalized_url,
            "domain": classification["domain"],
            "page_title": title,
            "thumbnail_url": thumb if is_valid_url(thumb) else None,
            "description": desc,
            "provider": provider,
            "is_social_media": classification["is_social_media"],
            "social_platform": classification["social_platform"],
            "result_type": classification["result_type"],
            "timestamp": current_time
        })

    return cleaned
