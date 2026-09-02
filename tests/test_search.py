"""
Tests for Reverse Image Search Parsing, Providers, and Factory.
"""

import pytest
from src.search.result_parser import parse_search_results, is_valid_url, extract_domain
from src.search.providers.factory import SearchProviderFactory
from src.search.providers.base import ReverseSearchProvider


class MockSearchProvider(ReverseSearchProvider):
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    @property
    def provider_name(self) -> str:
        return "mock_provider"

    def search(self, image_path: str) -> list:
        return [
            {
                "title": "Mock Profile Match",
                "url": "https://social.example.org/user/alice",
                "source": "social.example.org",
                "thumbnail_url": "https://social.example.org/thumb.jpg",
                "description": "Alice Public Profile",
                "provider": "mock_provider"
            }
        ]


def test_url_validation():
    assert is_valid_url("https://example.com/photo.jpg") is True
    assert is_valid_url("http://sub.domain.co.uk/path?q=1") is True
    assert is_valid_url("ftp://invalid.com") is False
    assert is_valid_url("not_a_url") is False
    assert is_valid_url("") is False
    assert is_valid_url(None) is False


def test_domain_extraction():
    assert extract_domain("https://www.example.com/test") == "example.com"
    assert extract_domain("https://sub.domain.org/page") == "sub.domain.org"


def test_parse_search_results_deduplication():
    raw = [
        {"url": "https://example.com/page1", "title": "First", "thumbnail_url": "https://example.com/t1.jpg"},
        {"url": "https://example.com/page1", "title": "Duplicate", "thumbnail_url": "https://example.com/t1.jpg"},
        {"url": "invalid-url", "title": "Malformed"},
        {"url": "https://example.com/page2", "title": "Second", "thumbnail_url": "https://example.com/t2.jpg"}
    ]
    parsed = parse_search_results(raw)
    assert len(parsed) == 2
    assert parsed[0]["url"] == "https://example.com/page1"
    assert parsed[1]["url"] == "https://example.com/page2"
    assert parsed[0]["domain"] == "example.com"


def test_provider_factory_registration():
    SearchProviderFactory.register("mock_provider", MockSearchProvider)
    provider = SearchProviderFactory.create("mock_provider", api_key="test_key")
    assert provider.provider_name == "mock_provider"
    results = provider.search("dummy.jpg")
    assert len(results) == 1
    assert results[0]["title"] == "Mock Profile Match"
