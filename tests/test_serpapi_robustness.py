"""
Tests for SerpApi search robustness, image auto-optimization, request tracing,
masked credentials, error taxonomy, and pipeline cancellation.
"""

import pytest
from pathlib import Path
from src.search.providers.serpapi_lens import (
    SerpApiLensProvider,
    SerpApiAuthError,
    SerpApiRateLimitError,
    SerpApiInvalidRequestError,
    SerpApiTimeoutError,
    SerpApiConnectionError
)


class TestSerpApiRobustness:
    def test_masked_key(self):
        p1 = SerpApiLensProvider("abcdef1234567890")
        assert p1.get_masked_key() == "abcd****7890"

        p2 = SerpApiLensProvider("")
        assert p2.get_masked_key() == "NOT_CONFIGURED"

        p3 = SerpApiLensProvider('"quoted_key_123456"')
        assert p3.api_key == "quoted_key_123456"

    def test_missing_api_key_raises_auth_error(self):
        p = SerpApiLensProvider("")
        with pytest.raises(SerpApiAuthError) as exc_info:
            p.search("data/input/lena.jpg")
        assert "MISSING_API_KEY" in str(exc_info.value)
        assert exc_info.value.http_status == 401

    def test_image_optimization_under_limit(self):
        p = SerpApiLensProvider("dummy_key")
        # Optimize real sample image
        img_bytes, filename = p._optimize_image_for_upload(Path("data/input/lena.jpg"))
        assert len(img_bytes) <= p.MAX_SERPAPI_IMAGE_BYTES
        assert filename.endswith(".jpg")

    def test_nonexistent_image_raises(self):
        p = SerpApiLensProvider("dummy_key")
        with pytest.raises(FileNotFoundError):
            p.search("data/input/nonexistent_image_12345.jpg")
