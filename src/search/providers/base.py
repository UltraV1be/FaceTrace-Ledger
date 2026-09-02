"""
Base Abstract Reverse Search Provider Interface.
All reverse search providers must inherit from this class.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class ReverseSearchProvider(ABC):
    """Abstract base class for reverse image search providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the unique identifier name of the provider."""
        pass

    @abstractmethod
    def search(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Execute reverse image search using the input image.
        
        Args:
            image_path: Absolute or relative path to the image file.
            
        Returns:
            List of normalized candidate search results:
            [
                {
                    "title": str or None,
                    "url": str or None,
                    "source": str or None,
                    "thumbnail_url": str or None,
                    "description": str or None,
                    "provider": str
                }
            ]
        """
        pass
