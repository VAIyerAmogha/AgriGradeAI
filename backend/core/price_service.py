import os

import requests
from fastapi import HTTPException

from core.schemas import PriceRecord, PriceResponse


COMMODITY_NAME_MAP = {
    "tomato": "Tomato",
    "mango": "Mango",
    "potato": "Potato",
    "apple": "Apple",
    "banana": "Banana",
    "onion": "Onion",
    "grapes": "Grapes",
}

DATA_GOV_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
DATA_GOV_BASE_URL = "https://api.data.gov.in/resource/"


def fetch_mandi_prices(commodity: str, state: str) -> PriceResponse:
    try:
        normalized_commodity = COMMODITY_NAME_MAP.get(commodity.strip().lower(), commodity.strip().title())
        api_key = os.getenv("DATA_GOV_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="DATA_GOV_API_KEY is not configured")

        url = f"{DATA_GOV_BASE_URL}{DATA_GOV_RESOURCE_ID}"
        params = {
            "api-key": api_key,
            "format": "json",
            "filters[commodity]": normalized_commodity,
            "filters[state]": state,
            "limit": 5,
        }

        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        payload = response.json()

        records_raw = payload.get("records", [])
        if not records_raw:
            raise HTTPException(
                status_code=404,
                detail=f"No mandi price records found for {normalized_commodity} in {state}",
            )

        mapped_records: list[PriceRecord] = []
        for record in records_raw:
            mapped_records.append(
                PriceRecord(
                    market=str(record.get("market", "N/A")),
                    date=str(record.get("arrival_date", "N/A")),
                    min_price=str(record.get("min_price", "N/A")),
                    modal_price=str(record.get("modal_price", "N/A")),
                    max_price=str(record.get("max_price", "N/A")),
                )
            )

        most_recent = mapped_records[0]
        return PriceResponse(
            commodity=normalized_commodity,
            state=state,
            records=mapped_records,
            grade_A_estimate=most_recent.max_price,
            grade_B_estimate=most_recent.modal_price,
            grade_C_estimate=most_recent.min_price,
        )
    except HTTPException:
        raise
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Failed to fetch mandi prices from data.gov.in") from exc
