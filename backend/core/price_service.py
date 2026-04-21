import os
from statistics import mean

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


def _to_float(price_value: str) -> float:
    cleaned_value = "".join(character for character in price_value if character.isdigit() or character == ".")
    return float(cleaned_value) if cleaned_value else 0.0


def _fetch_records(api_key: str, normalized_commodity: str, state: str | None) -> list[dict[str, str]]:
    url = f"{DATA_GOV_BASE_URL}{DATA_GOV_RESOURCE_ID}"
    params: dict[str, str | int] = {
        "api-key": api_key,
        "format": "json",
        "filters[commodity]": normalized_commodity,
        "limit": 5,
    }
    if state:
        params["filters[state]"] = state

    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()
    payload = response.json()
    return payload.get("records", [])


def fetch_mandi_prices(commodity: str, state: str) -> PriceResponse:
    try:
        normalized_commodity = COMMODITY_NAME_MAP.get(commodity.strip().lower(), commodity.strip().title())
        api_key = os.getenv("DATA_GOV_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="DATA_GOV_API_KEY is not configured")

        records_raw = _fetch_records(api_key, normalized_commodity, state)
        state_label = state
        fallback_message = None
        if not records_raw:
            records_raw = _fetch_records(api_key, normalized_commodity, None)
            if not records_raw:
                raise HTTPException(
                    status_code=404,
                    detail=f"No mandi price records found for {normalized_commodity}",
                )
            state_label = f"{state} (fallback average across available prices)"
            fallback_message = f"Karnataka prices were unavailable, so the response uses the average across available {normalized_commodity} prices."

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

        if fallback_message:
            grade_a_values = [_to_float(record.max_price) for record in mapped_records]
            grade_b_values = [_to_float(record.modal_price) for record in mapped_records]
            grade_c_values = [_to_float(record.min_price) for record in mapped_records]
            grade_a_estimate = f"₹{mean(grade_a_values):.0f}"
            grade_b_estimate = f"₹{mean(grade_b_values):.0f}"
            grade_c_estimate = f"₹{mean(grade_c_values):.0f}"
        else:
            most_recent = mapped_records[0]
            grade_a_estimate = most_recent.max_price
            grade_b_estimate = most_recent.modal_price
            grade_c_estimate = most_recent.min_price

        return PriceResponse(
            commodity=normalized_commodity,
            state=state_label,
            records=mapped_records,
            grade_A_estimate=grade_a_estimate,
            grade_B_estimate=grade_b_estimate,
            grade_C_estimate=grade_c_estimate,
        )
    except HTTPException:
        raise
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Failed to fetch mandi prices from data.gov.in") from exc
