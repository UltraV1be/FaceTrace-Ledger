"""
Bing Visual Search Provider for FaceTrace Ledger.
Sends image binary to Microsoft Azure Bing Visual Search endpoint.
"""

from pathlib import Path
from typing import Any, Dict, List
import requests
from src.search.providers.base import ReverseSearchProvider
from src.utils.logger import logger


class BingVisualProvider(ReverseSearchProvider):
    ENDPOINT = "https://api.bing.microsoft.com/v7.0/images/visualsearch"

    def __init__(self, api_key: str):
        self.api_key = api_key.strip() if api_key else ""

    @property
    def provider_name(self) -> str:
        return "bing_visual"

    def search(self, image_path: str) -> List[Dict[str, Any]]:
        if not self.api_key:
            raise ValueError(
                "MISSING_API_KEY: Bing Visual Search requires an Azure API key.\n"
                "Please set SEARCH_API_KEY in your .env file."
            )

        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Input image not found: {image_path}")

        headers = {"Ocp-Apim-Subscription-Key": self.api_key}
        with open(path, "rb") as f:
            files = {"image": (path.name, f, "image/jpeg")}
            logger.info(f"[SEARCH] Sending image to Bing Visual Search API ({path.name})")
            resp = requests.post(self.ENDPOINT, headers=headers, files=files, timeout=30)

        if resp.status_code == 401 or resp.status_code == 403:
            raise PermissionError("Bing Visual Search authentication failed: Invalid SEARCH_API_KEY.")

        if resp.status_code != 200:
            raise RuntimeError(f"Bing Visual Search failed with HTTP {resp.status_code}: {resp.text}")

        data = resp.json()
        normalized = []

        tags = data.get("tags", [])
        for tag in tags:
            for action in tag.get("actions", []):
                action_type = action.get("actionType")
                if action_type in ("VisualSearch", "PagesIncluding", "SimilarImages"):
                    data_items = action.get("data", {}).get("value", [])
                    for item in data_items:
                        normalized.append({
                            "title": item.get("name"),
                            "url": item.get("hostPageUrl") or item.get("webSearchUrl"),
                            "source": item.get("hostPageDisplayUrl"),
                            "thumbnail_url": item.get("thumbnailUrl") or item.get("contentUrl"),
                            "description": item.get("name"),
                            "provider": self.provider_name
                        })

        return normalized
