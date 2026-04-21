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


def run_grading_pipeline(image_bytes: bytes) -> GradeResponse:
    """Run a stub grading pipeline with real rule-based grade mapping.

    This function is intentionally structured so only the detection/scoring internals
    need replacement when integrating a real computer vision model later.
    """
    # Placeholder usage to make the stub signature realistic for future model inference.
    _ = image_bytes

    # Step 1: Stub produce classification output (replace with model inference later).
    produce_name = "Tomato"
    confidence = 0.94

    # Step 2: Stub defect detection output (replace with model detections later).
    defect_percentage = 6.5
    detected_defect_types = ["bruise"]

    # Step 3: Stub feature quality scores (replace with real model quality heads later).
    color_score = 0.82
    texture_score = 0.76
    shape_score = 0.88

    # Step 4: Compute severity-weighted defect score using configured defect severities.
    max_severity = max(DEFECT_SEVERITY.get(defect, 0.4) for defect in detected_defect_types)
    weighted_defect_score = (defect_percentage / 100.0) * (0.5 + 0.5 * max_severity)

    # Step 5: Apply produce-specific thresholds to assign AGMARK-like grade bands.
    thresholds = GRADE_THRESHOLDS.get(produce_name, GRADE_THRESHOLDS["default"])
    if weighted_defect_score <= thresholds["A"]:
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

    # Step 6: Build an explainable reason for farmer-facing output.
    dominant_defect = detected_defect_types[0].replace("_", " ")
    reason = (
        f"Minor {dominant_defect} detected covering ~{defect_percentage}% of surface. "
        f"{market_note}"
    )

    return GradeResponse(
        produce_name=produce_name,
        confidence=confidence,
        defect_percentage=defect_percentage,
        color_score=color_score,
        texture_score=texture_score,
        shape_score=shape_score,
        grade=grade,
        reason=reason,
        uncertain=confidence < 0.5,
    )
