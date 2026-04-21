from __future__ import annotations

import io
from dataclasses import dataclass

from functools import lru_cache
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

from core.schemas import GradeResponse


DEFECT_SEVERITY = {
    "bruise": 0.6,
    "rot": 1.0,
    "crack": 0.7,
    "discolouration": 0.3,
    "mold": 1.0,
    "mechanical_damage": 0.5,
    "overripe": 0.8,
}

GRADE_THRESHOLDS = {
    "Tomato": {"A": 0.03, "B": 0.12, "C": 0.25},
    "Mango": {"A": 0.04, "B": 0.15, "C": 0.30},
    "Potato": {"A": 0.05, "B": 0.18, "C": 0.35},
    "Apple": {"A": 0.03, "B": 0.12, "C": 0.25},
    "default": {"A": 0.04, "B": 0.15, "C": 0.28},
}

CLASS_NAMES = {0: "tomato", 1: "apple", 2: "defect"}
PRODUCE_CLASS_IDS = {0, 1}
DEFECT_CLASS_ID = 2
MODEL_INPUT_SIZE = 640
CONFIDENCE_THRESHOLD = 0.25
NMS_IOU_THRESHOLD = 0.45
DEFECT_REJECT_THRESHOLD = 15.0
MODEL_PATH = Path(__file__).resolve().parents[1] / "best.onnx"


@dataclass(frozen=True)
class Detection:
    class_id: int
    score: float
    box: tuple[float, float, float, float]


@lru_cache(maxsize=1)
def get_session() -> ort.InferenceSession:
    return ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])


def letterbox(image: Image.Image, size: int = MODEL_INPUT_SIZE) -> tuple[np.ndarray, float, float, float]:
    original_width, original_height = image.size
    scale = min(size / original_width, size / original_height)
    resized_width = int(round(original_width * scale))
    resized_height = int(round(original_height * scale))

    resized = image.resize((resized_width, resized_height), Image.Resampling.BILINEAR)
    canvas = Image.new("RGB", (size, size), (114, 114, 114))
    pad_x = (size - resized_width) // 2
    pad_y = (size - resized_height) // 2
    canvas.paste(resized, (pad_x, pad_y))

    array = np.asarray(canvas, dtype=np.float32) / 255.0
    array = np.transpose(array, (2, 0, 1))[None, ...]
    return array, scale, float(pad_x), float(pad_y)


def xywh_to_xyxy(box: np.ndarray) -> tuple[float, float, float, float]:
    center_x, center_y, width, height = [float(value) for value in box]
    half_width = width / 2.0
    half_height = height / 2.0
    return (
        center_x - half_width,
        center_y - half_height,
        center_x + half_width,
        center_y + half_height,
    )


def clip_box(box: tuple[float, float, float, float], width: float, height: float) -> tuple[float, float, float, float]:
    x1, y1, x2, y2 = box
    return (
        max(0.0, min(x1, width)),
        max(0.0, min(y1, height)),
        max(0.0, min(x2, width)),
        max(0.0, min(y2, height)),
    )


def box_area(box: tuple[float, float, float, float]) -> float:
    x1, y1, x2, y2 = box
    return max(0.0, x2 - x1) * max(0.0, y2 - y1)


def intersection_area(
    box_a: tuple[float, float, float, float],
    box_b: tuple[float, float, float, float],
) -> float:
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b
    x1 = max(ax1, bx1)
    y1 = max(ay1, by1)
    x2 = min(ax2, bx2)
    y2 = min(ay2, by2)
    return box_area((x1, y1, x2, y2))


def iou(box_a: tuple[float, float, float, float], box_b: tuple[float, float, float, float]) -> float:
    overlap = intersection_area(box_a, box_b)
    if overlap == 0.0:
        return 0.0
    union = box_area(box_a) + box_area(box_b) - overlap
    if union <= 0.0:
        return 0.0
    return overlap / union


def non_max_suppression(detections: list[Detection], threshold: float = NMS_IOU_THRESHOLD) -> list[Detection]:
    kept: list[Detection] = []
    for class_id in sorted({detection.class_id for detection in detections}):
        class_detections = sorted(
            [detection for detection in detections if detection.class_id == class_id],
            key=lambda detection: detection.score,
            reverse=True,
        )
        while class_detections:
            best = class_detections.pop(0)
            kept.append(best)
            class_detections = [
                detection
                for detection in class_detections
                if iou(best.box, detection.box) < threshold
            ]
    return kept


def preprocess_image(image_bytes: bytes) -> tuple[np.ndarray, int, int]:
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            rgb_image = image.convert("RGB")
            width, height = rgb_image.size
            input_tensor, _, _, _ = letterbox(rgb_image)
            return input_tensor, width, height
    except Exception as exc:
        raise ValueError("Uploaded file is not a valid image") from exc


def postprocess_predictions(
    raw_output: np.ndarray,
    original_width: int,
    original_height: int,
) -> list[Detection]:
    predictions = np.squeeze(raw_output, axis=0).T
    detections: list[Detection] = []

    for prediction in predictions:
        box = prediction[:4]
        class_scores = prediction[4:]
        class_id = int(np.argmax(class_scores))
        score = float(class_scores[class_id])
        if score < CONFIDENCE_THRESHOLD:
            continue

        xyxy = clip_box(xywh_to_xyxy(box), float(MODEL_INPUT_SIZE), float(MODEL_INPUT_SIZE))
        detections.append(Detection(class_id=class_id, score=score, box=xyxy))

    if not detections:
        return []

    return non_max_suppression(detections)


def remap_box_to_original(
    box: tuple[float, float, float, float],
    original_width: int,
    original_height: int,
) -> tuple[float, float, float, float]:
    scale = min(MODEL_INPUT_SIZE / original_width, MODEL_INPUT_SIZE / original_height)
    resized_width = original_width * scale
    resized_height = original_height * scale
    pad_x = (MODEL_INPUT_SIZE - resized_width) / 2.0
    pad_y = (MODEL_INPUT_SIZE - resized_height) / 2.0

    x1, y1, x2, y2 = box
    original_box = (
        (x1 - pad_x) / scale,
        (y1 - pad_y) / scale,
        (x2 - pad_x) / scale,
        (y2 - pad_y) / scale,
    )
    return clip_box(original_box, float(original_width), float(original_height))


def get_detected_produce(detections: list[Detection]) -> Detection | None:
    produce_detections = [detection for detection in detections if detection.class_id in PRODUCE_CLASS_IDS]
    if not produce_detections:
        return None
    return max(produce_detections, key=lambda detection: detection.score)


def get_detected_defects(detections: list[Detection]) -> list[Detection]:
    return [detection for detection in detections if detection.class_id == DEFECT_CLASS_ID]


def run_grading_pipeline(image_bytes: bytes) -> GradeResponse:
    """Run ONNX inference and map the detections to an AGMARK-style grade."""
    try:
        input_tensor, original_width, original_height = preprocess_image(image_bytes)
        session = get_session()
        raw_output = session.run(None, {session.get_inputs()[0].name: input_tensor})[0]
        detections = postprocess_predictions(raw_output, original_width, original_height)
    except ValueError as exc:
        raise exc
    except Exception as exc:
        raise RuntimeError("Model inference failed") from exc

    produce_detection = get_detected_produce(detections)
    defect_detections = get_detected_defects(detections)

    if produce_detection is None:
        produce_name = "Tomato"
        confidence = 0.0
        produce_box = (0.0, 0.0, float(original_width), float(original_height))
    else:
        produce_name = CLASS_NAMES.get(produce_detection.class_id, "tomato").title()
        confidence = produce_detection.score
        produce_box = remap_box_to_original(produce_detection.box, original_width, original_height)

    defect_boxes = [remap_box_to_original(detection.box, original_width, original_height) for detection in defect_detections]
    produce_area = max(box_area(produce_box), 1.0)
    defect_area = sum(intersection_area(defect_box, produce_box) for defect_box in defect_boxes)
    defect_percentage = max(0.0, min(100.0, (defect_area / produce_area) * 100.0))

    highest_defect_confidence = max((detection.score for detection in defect_detections), default=0.0)
    max_severity = max(0.6, min(1.0, 0.5 + 0.5 * highest_defect_confidence)) if defect_detections else 0.0
    weighted_defect_score = (defect_percentage / 100.0) * (0.5 + 0.5 * max_severity)

    color_score = max(0.0, min(1.0, 0.95 - 0.8 * (defect_percentage / 100.0) + 0.1 * confidence))
    texture_score = max(0.0, min(1.0, 0.93 - 0.9 * (defect_percentage / 100.0)))

    width = max(produce_box[2] - produce_box[0], 1.0)
    height = max(produce_box[3] - produce_box[1], 1.0)
    aspect_ratio = width / height
    shape_score = max(0.0, min(1.0, 0.9 - 0.25 * abs(np.log(max(aspect_ratio, 1e-6))) - 0.4 * (defect_percentage / 100.0)))

    thresholds = GRADE_THRESHOLDS.get(produce_name, GRADE_THRESHOLDS["default"])
    if defect_percentage > DEFECT_REJECT_THRESHOLD:
        grade = "REJECT"
        defect_count = len(defect_detections) if defect_detections else 0
        market_note = (
            f"Rejected because defect coverage is {defect_percentage:.1f}%, above the {DEFECT_REJECT_THRESHOLD:.0f}% limit. "
            f"Detected {defect_count} defect region(s), so this lot is not market ready."
        )
    elif weighted_defect_score <= thresholds["A"]:
        grade = "A"
        market_note = "Premium quality and suitable for high-value sale."
    elif weighted_defect_score <= thresholds["B"]:
        grade = "B"
        market_note = "Suitable for local market."
    elif weighted_defect_score <= thresholds["C"]:
        grade = "C"
        market_note = "Best suited for processing or discounted sale."
    else:
        grade = "REJECT"
        market_note = "Not market ready due to defect severity."

    if defect_detections:
        dominant_defect = "surface defect"
        defect_phrase = f"Detected {len(defect_detections)} {dominant_defect} region(s)"
    else:
        defect_phrase = "No significant defects detected"

    reason = (
        f"{produce_name} detected with confidence {confidence:.2f}. "
        f"{defect_phrase} covering ~{defect_percentage:.1f}% of the produce surface. "
        f"{market_note}"
    )

    return GradeResponse(
        produce_name=produce_name,
        confidence=confidence,
        defect_percentage=round(defect_percentage, 2),
        color_score=round(color_score, 2),
        texture_score=round(texture_score, 2),
        shape_score=round(shape_score, 2),
        grade=grade,
        reason=reason,
        uncertain=confidence < 0.5,
    )
