"""
Generate sample facial portrait images for local pipeline testing.
"""

import cv2
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "input"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def generate_portrait(filename: str = "sample_portrait.jpg"):
    img = np.full((320, 320, 3), 235, dtype=np.uint8)
    
    # Head contour
    cv2.ellipse(img, (160, 160), (90, 120), 0, 0, 360, (210, 180, 140), -1)
    
    # Eyes
    cv2.circle(img, (125, 135), 12, (255, 255, 255), -1)
    cv2.circle(img, (195, 135), 12, (255, 255, 255), -1)
    cv2.circle(img, (125, 135), 6, (60, 40, 20), -1)
    cv2.circle(img, (195, 135), 6, (60, 40, 20), -1)
    
    # Nose
    cv2.line(img, (160, 140), (160, 180), (180, 150, 120), 3)
    cv2.line(img, (160, 180), (150, 185), (180, 150, 120), 3)
    
    # Mouth
    cv2.ellipse(img, (160, 215), (35, 18), 0, 0, 180, (70, 70, 180), -1)
    cv2.ellipse(img, (160, 215), (35, 18), 0, 0, 180, (40, 40, 120), 2)
    
    out_path = DATA_DIR / filename
    cv2.imwrite(str(out_path), img)
    print(f"Sample portrait created -> {out_path}")
    return out_path


if __name__ == "__main__":
    generate_portrait()
