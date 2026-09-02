"""
Search Provider Factory for FaceTrace Ledger.
Instantiates reverse image search providers dynamically from configuration.
"""

from typing import Dict, Type
from src.search.providers.base import ReverseSearchProvider
from src.search.providers.serpapi_lens import SerpApiLensProvider
from src.search.providers.bing_visual import BingVisualProvider


class SearchProviderFactory:
    _registry: Dict[str, Type[ReverseSearchProvider]] = {
        "serpapi_lens": SerpApiLensProvider,
        "google_lens": SerpApiLensProvider,
        "bing_visual": BingVisualProvider,
    }

    @classmethod
    def register(cls, name: str, provider_cls: Type[ReverseSearchProvider]) -> None:
        """Register a new provider plugin at runtime."""
        cls._registry[name.lower()] = provider_cls

    @classmethod
    def create(cls, provider_name: str, api_key: str = "") -> ReverseSearchProvider:
        """
        Create and return a configured provider instance.
        
        Args:
            provider_name: The registered name of the provider.
            api_key: The API key for authentication.
        """
        normalized_name = provider_name.strip().lower()
        provider_cls = cls._registry.get(normalized_name)
        if not provider_cls:
            available = ", ".join(cls._registry.keys())
            raise ValueError(
                f"Unknown reverse search provider: '{provider_name}'. Available providers: {available}"
            )
        return provider_cls(api_key=api_key)

    @classmethod
    def get_available_providers(cls) -> list[str]:
        return list(cls._registry.keys())
