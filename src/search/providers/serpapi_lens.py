"""
SerpApi Google Lens Reverse Image Search Provider.
Uploads the local image directly to SerpApi and retrieves live Google Lens visual matches.
"""

from pathlib import Path
from typing import Any, Dict, List
import requests
from src.search.providers.base import ReverseSearchProvider
from src.utils.logger import logger


class SerpApiLensProvider(ReverseSearchProvider):
    UPLOAD_ENDPOINT = "https://serpapi.com/image"
    SEARCH_ENDPOINT = "https://serpapi.com/search.json"

    def __init__(self, api_key: str = ""):
        # Strip outer quotes if user wrapped in quotes in .env
        clean_key = api_key.strip()
        if (clean_key.startswith('"') and clean_key.endswith('"')) or (clean_key.startswith("'") and clean_key.endswith("'")):
            clean_key = clean_key[1:-1].strip()
        self.api_key = clean_key

    @property
    def provider_name(self) -> str:
        return "serpapi_lens"

    def _upload_image(self, image_path: Path) -> str:
        """Upload image to SerpApi to receive a temporary image_id for search."""
        logger.info(f"[SEARCH] Uploading image binary ({image_path.name}) to SerpApi image cache")
        with open(image_path, "rb") as img_file:
            # Field name is 'image'
            files = {"image": (image_path.name, img_file, "image/jpeg")}
            params = {"api_key": self.api_key} if self.api_key else {}
            response = requests.post(
                self.UPLOAD_ENDPOINT,
                files=files,
                params=params,
                timeout=30
            )

        if response.status_code in (401, 403):
            raise PermissionError("SerpApi authentication failed: Invalid or missing SEARCH_API_KEY.")

        if response.status_code != 200:
            raise RuntimeError(f"SerpApi image upload failed with HTTP {response.status_code}: {response.text}")

        data = response.json()
        image_id = data.get("image_id") or data.get("id") or data.get("image_url") or data.get("url")
        if not image_id:
            raise RuntimeError(f"SerpApi upload did not return an image_id: {data}")

        return image_id

    def search(self, image_path: str) -> List[Dict[str, Any]]:
        if not self.api_key:
            raise ValueError(
                "MISSING_API_KEY: SerpApi requires an API key.\n"
                "Please obtain a free key from https://serpapi.com and set SEARCH_API_KEY in your .env file."
            )

        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Input image not found: {image_path}")

        # Step 1: Upload image to get image_id or direct url
        image_ref = self._upload_image(path)
        logger.info(f"[SEARCH] Image uploaded successfully. Reference: {image_ref}")

        # Step 2: Query Google Lens
        # If image_ref is a full URL or an ID
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

        logger.info(f"[SEARCH] Sending search query to SerpApi Google Lens engine")
        resp = requests.get(self.SEARCH_ENDPOINT, params=params, timeout=30)

        if resp.status_code != 200:
            raise RuntimeError(f"SerpApi search failed with HTTP {resp.status_code}: {resp.text}")

        data = resp.json()
        if "error" in data:
            raise RuntimeError(f"SerpApi returned error: {data['error']}")

        visual_matches = data.get("visual_matches", [])
        logger.info(f"[SEARCH] Raw visual matches returned by SerpApi: {len(visual_matches)}")

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

        return normalized
