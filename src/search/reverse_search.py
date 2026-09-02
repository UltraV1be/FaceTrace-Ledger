"""
Reverse Image Search Service for FaceTrace Ledger.
Orchestrates dynamic reverse image search, provider fallback, and logging.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
from src.config import config
from src.crypto.hashing import hash_file
from src.search.providers.factory import SearchProviderFactory
from src.utils.logger import logger
from src.utils.helpers import save_json


class ReverseImageSearchService:
    def __init__(self, provider_name: Optional[str] = None, api_key: Optional[str] = None):
        self.provider_name = (provider_name or config.reverse_search_provider).strip().lower()
        self.api_key = api_key if api_key is not None else config.search_api_key

    def search(self, image_path: Path | str) -> List[Dict[str, Any]]:
        """
        Perform genuine reverse image search using the input image.
        
        Logs the required search lifecycle and saves raw search results.
        """
        path = Path(image_path).resolve()
        if not path.exists():
            raise FileNotFoundError(f"Input image not found at {path}")

        # Compute SHA-256 fingerprint prefix
        file_sha256 = hash_file(path)
        sha_prefix = file_sha256[:12]

        print(f"  [SEARCH] Starting reverse image search")
        print(f"  [SEARCH] Input image received: {path.name}")
        print(f"  [SEARCH] Image fingerprint: {sha_prefix}...")
        print(f"  [SEARCH] Selected provider: {self.provider_name}")

        try:
            provider = SearchProviderFactory.create(self.provider_name, api_key=self.api_key)
            print(f"  [SEARCH] Sending image to search provider ({self.provider_name})")
            print(f"  [SEARCH] Waiting for search results...")
            
            raw_results = provider.search(str(path))
            count = len(raw_results)
            print(f"  [SEARCH] Results received: {count}")

            # Save search results for auditability
            save_path = config.results_dir / "search_results.json"
            save_json({
                "image_path": str(path),
                "image_sha256": file_sha256,
                "provider": self.provider_name,
                "total_results": count,
                "results": raw_results
            }, save_path)
            logger.debug(f"Saved raw search results to {save_path}")

            return raw_results

        except (ValueError, PermissionError, RuntimeError, FileNotFoundError) as e:
            logger.error(f"[SEARCH] Primary provider '{self.provider_name}' failed: {e}")
            raise
        except Exception as e:
            logger.error(f"[SEARCH] Unexpected error in reverse search: {e}")
            raise RuntimeError(f"Reverse search failed: {e}") from e
