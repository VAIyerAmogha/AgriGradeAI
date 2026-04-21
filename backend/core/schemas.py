from typing import Literal

from pydantic import BaseModel


class GradeResponse(BaseModel):
    produce_name: str
    confidence: float
    defect_percentage: float
    color_score: float
    texture_score: float
    shape_score: float
    grade: Literal["A", "B", "C", "REJECT"]
    reason: str
    uncertain: bool


class PriceRecord(BaseModel):
    market: str
    date: str
    min_price: str
    modal_price: str
    max_price: str


class PriceResponse(BaseModel):
    commodity: str
    state: str
    records: list[PriceRecord]
    grade_A_estimate: str
    grade_B_estimate: str
    grade_C_estimate: str


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
