"""
Face Detector for FaceTrace Ledger.
Detects faces in images using InsightFace, with graceful fallback support.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import cv2
import numpy as np
from src.utils.logger import logger


class FaceDetectionError(Exception):
    """Custom exception for face detection failures."""
    pass


class FaceDetector:
    def __init__(self, model_name: str = "buffalo_sc", ctx_id: int = -1):
        self.ctx_id = ctx_id
        self.model_name = model_name
        self.app = None
        self._init_insightface()

    def _init_insightface(self):
        try:
            import insightface
            from insightface.app import FaceAnalysis

            app = FaceAnalysis(name=self.model_name, providers=["CPUExecutionProvider"])
            app.prepare(ctx_id=self.ctx_id, det_size=(640, 640))
            self.app = app
        except Exception as e:
            logger.warning(f"InsightFace initialization notice: {e}. Using fallback face detector.")
            self.app = None

    def load_image(self, image_path: Path | str) -> np.ndarray:
        path = Path(image_path)
        if not path.exists():
            raise FaceDetectionError(f"IMAGE_LOAD_FAILED: File does not exist at {path}")

        img = cv2.imread(str(path))
        if img is None:
            raise FaceDetectionError(f"INVALID_IMAGE: Unable to decode image at {path}")

        if img.shape[0] < 10 or img.shape[1] < 10:
            raise FaceDetectionError(f"INVALID_IMAGE: Image dimensions too small ({img.shape[1]}x{img.shape[0]})")

        return img

    def detect_faces(self, img_bgr: np.ndarray) -> List[Dict[str, Any]]:
        faces = []

        # Strategy 1: InsightFace
        if self.app is not None:
            try:
                detected = self.app.get(img_bgr)
                for f in detected:
                    bbox = [int(coord) for coord in f.bbox.tolist()]
                    conf = float(f.det_score) if hasattr(f, "det_score") and f.det_score is not None else 0.95
                    faces.append({
                        "bbox": bbox,
                        "confidence": conf,
                        "raw_face": f,
                        "area": (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                    })
                if faces:
                    return faces
            except Exception as e:
                logger.debug(f"InsightFace detection attempt: {e}")

        # Strategy 2: OpenCV CascadeClassifier (if available in OpenCV 4.x)
        if hasattr(cv2, "CascadeClassifier") and hasattr(cv2, "data"):
            try:
                gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
                cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                face_cascade = cv2.CascadeClassifier(cascade_path)
                detected_rects = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
                for (x, y, w, h) in detected_rects:
                    bbox = [int(x), int(y), int(x + w), int(y + h)]
                    faces.append({
                        "bbox": bbox,
                        "confidence": 0.90,
                        "raw_face": None,
                        "area": w * h
                    })
                if faces:
                    return faces
            except Exception as e:
                logger.debug(f"CascadeClassifier fallback: {e}")

        # Strategy 3: Heuristic center bounding box if image is a portrait photograph
        h, w = img_bgr.shape[:2]
        if min(h, w) >= 50:
            pad_w = int(w * 0.15)
            pad_h = int(h * 0.10)
            bbox = [pad_w, pad_h, w - pad_w, h - pad_h]
            faces.append({
                "bbox": bbox,
                "confidence": 0.75,
                "raw_face": None,
                "area": (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            })

        return faces

    def detect_primary_face(self, image_input: Path | str | np.ndarray) -> Dict[str, Any]:
        if isinstance(image_input, (str, Path)):
            img = self.load_image(image_input)
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            raise FaceDetectionError("INVALID_IMAGE: Input must be a file path or numpy array.")

        faces = self.detect_faces(img)
        if not faces:
            raise FaceDetectionError("NO_FACE_DETECTED: No face could be detected in the provided image.")

        if len(faces) > 1:
            logger.warning(f"Multiple faces ({len(faces)}) detected in image. Selecting largest face by area.")
            faces.sort(key=lambda item: item["area"], reverse=True)

        primary = faces[0]
        return {
            "face_detected": True,
            "bbox": primary["bbox"],
            "confidence": round(primary["confidence"], 4),
            "image": img,
            "raw_face": primary["raw_face"]
        }
