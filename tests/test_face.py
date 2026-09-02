"""
Tests for Face Detection, Encoding, and Similarity Matching.
"""

import numpy as np
import pytest
import cv2
from pathlib import Path
from src.face.detector import FaceDetector, FaceDetectionError
from src.face.encoder import FaceEncoder, FaceEncodingError
from src.face.matcher import FaceMatcher, cosine_similarity


@pytest.fixture
def sample_face_image(tmp_path) -> Path:
    """Create a synthetic test image containing a detectable face pattern."""
    img_path = tmp_path / "test_face.png"
    # Create 200x200 canvas
    img = np.full((200, 200, 3), 200, dtype=np.uint8)
    # Draw simple facial features (head, eyes, mouth)
    cv2.circle(img, (100, 100), 60, (180, 180, 180), -1) # Head
    cv2.circle(img, (80, 85), 8, (20, 20, 20), -1)       # Left eye
    cv2.circle(img, (120, 85), 8, (20, 20, 20), -1)      # Right eye
    cv2.ellipse(img, (100, 125), (25, 12), 0, 0, 180, (20, 20, 20), 3) # Mouth
    cv2.imwrite(str(img_path), img)
    return img_path


def test_cosine_similarity_identical():
    v1 = np.array([1.0, 0.0, 0.5, -0.2], dtype=np.float32)
    assert pytest.approx(cosine_similarity(v1, v1), 1e-4) == 1.0


def test_cosine_similarity_orthogonal():
    v1 = np.array([1.0, 0.0], dtype=np.float32)
    v2 = np.array([0.0, 1.0], dtype=np.float32)
    assert pytest.approx(cosine_similarity(v1, v2), 1e-4) == 0.0


def test_face_matcher_threshold():
    matcher = FaceMatcher(threshold=0.70)
    v1 = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    v2 = np.array([0.9, 0.1, 0.0], dtype=np.float32)
    res = matcher.compare(v1, v2)
    assert res["match"] is True
    assert res["similarity_score"] > 0.70


def test_invalid_image_load():
    detector = FaceDetector()
    with pytest.raises(FaceDetectionError):
        detector.detect_primary_face("non_existent_file_xyz.jpg")


def test_face_encoding_dimension(sample_face_image):
    detector = FaceDetector()
    encoder = FaceEncoder(detector)
    # Manual face info dict
    img = cv2.imread(str(sample_face_image))
    face_info = {
        "face_detected": True,
        "bbox": [40, 40, 160, 160],
        "image": img,
        "raw_face": None
    }
    embedding = encoder.encode(face_info)
    assert isinstance(embedding, np.ndarray)
    assert len(embedding) == 512
    # Check unit norm
    norm = np.linalg.norm(embedding)
    assert pytest.approx(norm, 1e-4) == 1.0
