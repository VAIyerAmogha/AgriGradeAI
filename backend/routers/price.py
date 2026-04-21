from fastapi import APIRouter

from core.price_service import fetch_mandi_prices
from core.schemas import PriceResponse


router = APIRouter(tags=["pricing"])


@router.get("/price", response_model=PriceResponse)
def get_price(commodity: str, state: str = "Karnataka") -> PriceResponse:
    return fetch_mandi_prices(commodity=commodity, state=state)
