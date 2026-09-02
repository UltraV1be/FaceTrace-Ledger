"""
SerpApi Google Lens Reverse Image Search Provider.
Handles image optimization (<500KB compliance), structured request tracing,
masked logging, transient retry logic, and granular error categorization.
"""

import time
import uuid
import io
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import cv2
import requests
from src.search.providers.base import ReverseSearchProvider
from src.utils.logger import logger


class SerpApiError(Exception):
    """Base exception for SerpApi provider errors."""
    def __init__(self, code: str, message: str, http_status: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(f"[{code}] {message}")
        self.code = code
        self.message = message
        self.http_status = http_status
        self.details = details or {}


class SerpApiAuthError(SerpApiError):
    """401 Unauthorized."""
    pass


class SerpApiAccessDeniedError(SerpApiError):
    """403 Forbidden."""
    pass


class SerpApiRateLimitError(SerpApiError):
    """429 Rate Limit."""
    pass


class SerpApiInvalidRequestError(SerpApiError):
    """400 Bad Request."""
    pass


class SerpApiTimeoutError(SerpApiError):
    """Request timeout."""
    pass


class SerpApiConnectionError(SerpApiError):
    """Network connection failure."""
    pass


class SerpApiParseError(SerpApiError):
    """Response parse failure."""
    pass


class SerpApiLensProvider(ReverseSearchProvider):
    UPLOAD_ENDPOINT = "https://serpapi.com/image"
    SEARCH_ENDPOINT = "https://serpapi.com/search.json"
    MAX_SERPAPI_IMAGE_BYTES = 450 * 1024  # 450 KB safety limit (SerpApi strict limit is 500 KB)

    def __init__(self, api_key: str = ""):
        clean_key = api_key.strip()
        if (clean_key.startswith('"') and clean_key.endswith('"')) or (clean_key.startswith("'") and clean_key.endswith("'")):
            clean_key = clean_key[1:-1].strip()
        self.api_key = clean_key

    @property
    def provider_name(self) -> str:
        return "serpapi_lens"

    def get_masked_key(self) -> str:
        """Return masked API key for safe telemetry."""
        if not self.api_key:
            return "NOT_CONFIGURED"
        if len(self.api_key) <= 8:
            return f"{self.api_key[:2]}****"
        return f"{self.api_key[:4]}****{self.api_key[-4:]}"

    def _optimize_image_for_upload(self, image_path: Path) -> Tuple[bytes, str]:
        """
        Validate and optimize an image to ensure it is under SerpApi's 500KB limit
        and encoded in standard JPEG format.
        """
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found at: {image_path}")

        raw_size = image_path.stat().st_size
        img = cv2.imread(str(image_path))
        if img is None:
            raise SerpApiInvalidRequestError(
                "SERPAPI_INVALID_IMAGE",
                f"File '{image_path.name}' is not a valid or readable raster image matrix.",
                http_status=400
            )

        h, w = img.shape[:2]

        # Initial compression attempt
        quality = 85
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        success, encoded = cv2.imencode('.jpg', img, encode_param)

        # If payload is larger than limit or dimensions exceed 1200px, resize proportionally
        max_dim = 1200
        while (len(encoded) > self.MAX_SERPAPI_IMAGE_BYTES or max(h, w) > max_dim) and quality > 30:
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                w = int(w * scale)
                h = int(h * scale)
                img = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)

            quality -= 10
            max_dim = int(max_dim * 0.85)
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
            success, encoded = cv2.imencode('.jpg', img, encode_param)

        final_bytes = encoded.tobytes()
        logger.info(f"[SEARCH] Image optimized: {raw_size/1024:.1f} KB -> {len(final_bytes)/1024:.1f} KB ({w}x{h} px, Q={quality})")
        return final_bytes, f"{image_path.stem}_optimized.jpg"

    def _execute_with_retry(self, request_fn, description: str, max_retries: int = 2):
        """Execute network call with exponential backoff for transient errors."""
        for attempt in range(1, max_retries + 2):
            try:
                return request_fn()
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
                if attempt > max_retries:
                    raise
                wait_sec = 2 ** (attempt - 1)
                logger.warning(f"[SEARCH] Transient network issue during {description} (Attempt {attempt}/{max_retries + 1}). Retrying in {wait_sec}s: {e}")
                time.sleep(wait_sec)
            except requests.exceptions.HTTPError as e:
                # Only retry 5xx server errors
                if e.response is not None and 500 <= e.response.status_code < 600 and attempt <= max_retries:
                    wait_sec = 2 ** (attempt - 1)
                    logger.warning(f"[SEARCH] SerpApi 5xx server error (Status {e.response.status_code}). Retrying in {wait_sec}s...")
                    time.sleep(wait_sec)
                else:
                    raise

    def _upload_image(self, image_path: Path, audit_trail: List[Dict[str, Any]]) -> str:
        """Upload optimized image binary to SerpApi and return reference image_id."""
        image_bytes, filename = self._optimize_image_for_upload(image_path)

        audit_trail.append({
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event": "SERPAPI_IMAGE_UPLOAD_STARTING",
            "bytes_to_upload": len(image_bytes),
            "filename": filename
        })

        def do_upload():
            files = {"image": (filename, io.BytesIO(image_bytes), "image/jpeg")}
            params = {"api_key": self.api_key} if self.api_key else {}
            return requests.post(self.UPLOAD_ENDPOINT, files=files, params=params, timeout=30)

        try:
            resp = self._execute_with_retry(do_upload, "image binary upload")
        except requests.exceptions.Timeout as e:
            raise SerpApiTimeoutError(
                "SERPAPI_REQUEST_TIMEOUT",
                "SerpApi image upload timed out after 30 seconds. Check network connectivity.",
                details={"stage": "image_upload"}
            ) from e
        except requests.exceptions.ConnectionError as e:
            raise SerpApiConnectionError(
                "SERPAPI_CONNECTION_FAILED",
                f"Could not connect to SerpApi upload endpoint ({self.UPLOAD_ENDPOINT}).",
                details={"stage": "image_upload"}
            ) from e
        except Exception as e:
            raise SerpApiConnectionError(
                "SERPAPI_CONNECTION_FAILED",
                f"Network failure uploading image to SerpApi: {e}",
                details={"stage": "image_upload"}
            ) from e

        # Handle HTTP status codes
        if resp.status_code == 401:
            raise SerpApiAuthError(
                "SERPAPI_AUTHENTICATION_FAILED",
                "SerpApi rejected credentials (HTTP 401). Check SEARCH_API_KEY in .env.",
                http_status=401
            )
        elif resp.status_code == 403:
            raise SerpApiAccessDeniedError(
                "SERPAPI_ACCESS_DENIED",
                "SerpApi access forbidden (HTTP 403). Account or endpoint access restricted.",
                http_status=403
            )
        elif resp.status_code == 429:
            raise SerpApiRateLimitError(
                "SERPAPI_RATE_LIMIT_REACHED",
                "SerpApi rate limit or monthly search quota exhausted (HTTP 429).",
                http_status=429
            )
        elif resp.status_code == 400:
            err_msg = resp.text
            try:
                err_msg = resp.json().get("error", resp.text)
            except Exception:
                pass
            raise SerpApiInvalidRequestError(
                "SERPAPI_INVALID_REQUEST",
                f"SerpApi rejected image parameters: {err_msg}",
                http_status=400,
                details={"response": err_msg}
            )
        elif resp.status_code != 200:
            raise SerpApiError(
                "SERPAPI_UPLOAD_FAILED",
                f"SerpApi image upload returned unexpected HTTP {resp.status_code}: {resp.text}",
                http_status=resp.status_code
            )

        try:
            data = resp.json()
        except Exception as e:
            raise SerpApiParseError(
                "SERPAPI_RESPONSE_PARSE_FAILED",
                f"Failed to parse SerpApi upload JSON response: {e}",
                http_status=resp.status_code
            )

        image_id = data.get("image_id") or data.get("id") or data.get("image_url") or data.get("url")
        if not image_id:
            raise SerpApiParseError(
                "SERPAPI_RESPONSE_PARSE_FAILED",
                f"SerpApi upload response missing 'image_id': {data}",
                http_status=resp.status_code
            )

        audit_trail.append({
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event": "SERPAPI_IMAGE_UPLOAD_SUCCESS",
            "image_id_prefix": f"{str(image_id)[:12]}..."
        })

        return image_id

    def search_with_trace(self, image_path: str) -> Dict[str, Any]:
        """
        Execute reverse-image search and return results along with full diagnostic trace.
        """
        req_id = f"search_{time.strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
        started_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        audit_trail = [
            {"time": started_at, "event": "SEARCH_INITIALIZED", "search_request_id": req_id},
            {"time": started_at, "event": "PROVIDER_CONFIGURED", "provider": "serpapi", "engine": "google_lens", "api_key_masked": self.get_masked_key()}
        ]

        if not self.api_key:
            raise SerpApiAuthError(
                "SERPAPI_AUTHENTICATION_FAILED",
                "MISSING_API_KEY: SerpApi requires an API key.\nPlease configure SEARCH_API_KEY in your .env file.",
                http_status=401,
                details={"search_request_id": req_id}
            )

        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Input image not found: {image_path}")

        # Step 1: Upload image
        logger.info(f"[SEARCH] [{req_id}] Preparing reverse-image request for {path.name}")
        image_ref = self._upload_image(path, audit_trail)

        # Step 2: Query Google Lens
        if str(image_ref).startswith("http://") or str(image_ref).startswith("https://"):
            params = {
                "engine": "google_lens",
                "url": image_ref,
                "api_key": self.api_key
            }
        else:
            params = {
                "engine": "google_lens",
                "image_id": image_ref,
                "api_key": self.api_key
            }

        audit_trail.append({
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event": "SERPAPI_REQUEST_SENT",
            "endpoint": self.SEARCH_ENDPOINT,
            "engine": "google_lens"
        })

        logger.info(f"[SEARCH] [{req_id}] Sending search query to SerpApi Google Lens engine")

        def do_search():
            return requests.get(self.SEARCH_ENDPOINT, params=params, timeout=30)

        try:
            resp = self._execute_with_retry(do_search, "Google Lens search query")
        except requests.exceptions.Timeout as e:
            raise SerpApiTimeoutError(
                "SERPAPI_REQUEST_TIMEOUT",
                "Google Lens search query timed out after 30 seconds.",
                details={"search_request_id": req_id}
            ) from e
        except requests.exceptions.ConnectionError as e:
            raise SerpApiConnectionError(
                "SERPAPI_CONNECTION_FAILED",
                f"Could not connect to SerpApi search endpoint ({self.SEARCH_ENDPOINT}).",
                details={"search_request_id": req_id}
            ) from e

        audit_trail.append({
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "event": "SERPAPI_RESPONSE_RECEIVED",
            "http_status": resp.status_code
        })

        if resp.status_code == 401:
            raise SerpApiAuthError(
                "SERPAPI_AUTHENTICATION_FAILED",
                "SerpApi rejected credentials on search endpoint (HTTP 401).",
                http_status=401,
                details={"search_request_id": req_id}
            )
        elif resp.status_code == 429:
            raise SerpApiRateLimitError(
                "SERPAPI_RATE_LIMIT_REACHED",
                "SerpApi rate limit reached on search query (HTTP 429).",
                http_status=429,
                details={"search_request_id": req_id}
            )
        elif resp.status_code != 200:
            raise SerpApiError(
                "SERPAPI_SEARCH_FAILED",
                f"SerpApi Google Lens query failed with HTTP {resp.status_code}: {resp.text}",
                http_status=resp.status_code,
                details={"search_request_id": req_id}
            )

        try:
            data = resp.json()
        except Exception as e:
            raise SerpApiParseError(
                "SERPAPI_RESPONSE_PARSE_FAILED",
                f"Failed to decode SerpApi search JSON: {e}",
                http_status=resp.status_code,
                details={"search_request_id": req_id}
            )

        if "error" in data:
            raise SerpApiInvalidRequestError(
                "SERPAPI_PROVIDER_ERROR",
                f"SerpApi returned error: {data['error']}",
                http_status=200,
                details={"search_request_id": req_id, "provider_error": data["error"]}
            )

        visual_matches = data.get("visual_matches", [])
        logger.info(f"[SEARCH] [{req_id}] Visual matches returned by SerpApi: {len(visual_matches)}")

        # Normalize results
        normalized = []
        for match in visual_matches:
            normalized.append({
                "title": match.get("title"),
                "url": match.get("link"),
                "source": match.get("source"),
                "thumbnail_url": match.get("thumbnail"),
                "description": match.get("snippet") or match.get("source"),
                "provider": self.provider_name
            })

        completed_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        audit_trail.append({
            "time": completed_at,
            "event": "RESULTS_PARSED",
            "count": len(normalized)
        })

        trace_summary = {
            "search_request_id": req_id,
            "provider": "serpapi",
            "engine": "google_lens",
            "request_started_at": started_at,
            "request_completed_at": completed_at,
            "request_sent": True,
            "http_status": resp.status_code,
            "results_count": len(normalized),
            "audit_trail": audit_trail
        }

        return {
            "results": normalized,
            "trace": trace_summary
        }

    def search(self, image_path: str) -> List[Dict[str, Any]]:
        """Standard search interface returning list of results."""
        res = self.search_with_trace(image_path)
        return res["results"]
