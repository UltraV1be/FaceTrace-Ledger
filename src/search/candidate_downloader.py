"""
Candidate Image Downloader for FaceTrace Ledger.
Downloads candidate match images safely with MIME validation and size limits.
"""

import hashlib
from pathlib import Path
from typing import Dict, Optional, Tuple
import requests
from src.config import config
from src.utils.logger import logger

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff"
}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB
DOWNLOAD_TIMEOUT = 15  # seconds


class CandidateDownloadError(Exception):
    """Exception for candidate download issues."""
    pass


class CandidateDownloader:
    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or config.candidates_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FaceTraceLedger/1.0"
        })

    def download(self, image_url: str) -> Path:
        """
        Download a candidate image safely.
        
        Args:
            image_url: Direct URL to the candidate image/thumbnail.
            
        Returns:
            Path: Local filepath of the downloaded candidate.
            
        Raises:
            CandidateDownloadError: If download fails, format is unsupported, or size exceeds limit.
        """
        if not image_url:
            raise CandidateDownloadError("DOWNLOAD_FAILED: Empty image URL provided")

        try:
            resp = self.session.get(image_url, stream=True, timeout=DOWNLOAD_TIMEOUT)
        except requests.exceptions.Timeout:
            raise CandidateDownloadError(f"TIMEOUT: Download timed out for {image_url}")
        except requests.exceptions.RequestException as e:
            raise CandidateDownloadError(f"DOWNLOAD_FAILED: Network error: {e}")

        if resp.status_code == 403 or resp.status_code == 401:
            raise CandidateDownloadError(f"ACCESS_DENIED: HTTP {resp.status_code} accessing {image_url}")
        elif resp.status_code != 200:
            raise CandidateDownloadError(f"IMAGE_UNAVAILABLE: HTTP {resp.status_code} for {image_url}")

        content_type = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
        if content_type and content_type not in ALLOWED_MIME_TYPES and not content_type.startswith("image/"):
            raise CandidateDownloadError(f"UNSUPPORTED_FORMAT: Content-Type '{content_type}' is not a recognized image")

        # Determine file extension
        ext = ".jpg"
        if "png" in content_type or image_url.lower().endswith(".png"):
            ext = ".png"
        elif "webp" in content_type or image_url.lower().endswith(".webp"):
            ext = ".webp"

        # Unique filename based on URL hash
        url_hash = hashlib.sha256(image_url.encode("utf-8")).hexdigest()[:16]
        dest_file = self.output_dir / f"candidate_{url_hash}{ext}"

        total_bytes = 0
        with open(dest_file, "wb") as f:
            for chunk in resp.iter_content(chunk_size=65536):
                if chunk:
                    total_bytes += len(chunk)
                    if total_bytes > MAX_FILE_SIZE:
                        dest_file.unlink(missing_ok=True)
                        raise CandidateDownloadError(f"FILE_TOO_LARGE: Image exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit")
                    f.write(chunk)

        if total_bytes < 100:
            dest_file.unlink(missing_ok=True)
            raise CandidateDownloadError("INVALID_IMAGE: Downloaded file is too small or empty")

        return dest_file
