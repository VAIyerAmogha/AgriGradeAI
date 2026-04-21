from fastapi import APIRouter, File, HTTPException, UploadFile

from core.grading_engine import run_grading_pipeline
from core.schemas import GradeResponse


router = APIRouter(tags=["grading"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}


@router.post(
    "/grade",
    response_model=GradeResponse,
    responses={400: {"description": "Invalid image type"}},
)
async def grade_produce(file: UploadFile = File(...)) -> GradeResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    return run_grading_pipeline(image_bytes)
