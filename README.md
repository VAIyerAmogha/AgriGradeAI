# AgriGrade AI

**Camera-based produce grading and live mandi price guidance for Indian farmers.**

Upload a photo of your produce. Get an A / B / C / Reject quality grade with a plain-language explanation, then see what it's actually selling for at nearby mandis — powered by a custom object detection model and live data from [data.gov.in](https://data.gov.in).

---

## What it does

Small farmers often can't tell whether their lot will fetch Grade A prices or get rejected at the mandi — and middlemen exploit that information gap. AgriGrade AI closes it with two features:

1. **Grading** — Upload a JPEG/PNG of produce (tomato, apple, mango supported). A detection model localizes the produce and any defect regions, computes defect coverage, and assigns a grade with a human-readable reason.
2. **Price guidance** — Live minimum / modal / maximum mandi prices for a commodity and state, pulled from the Government of India's daily market price dataset, with per-grade price estimates.

---

## How grading works

The pipeline in [`backend/core/grading_engine.py`](backend/core/grading_engine.py):

```
image → letterbox to 640×640 → ONNX detection model → NMS
      → produce box + defect boxes
      → defect coverage = Σ (defect ∩ produce area) / produce area
      → severity-weighted defect score
      → grade against per-commodity thresholds
```

**Detection.** A YOLO-format object detection model exported to ONNX (`best.onnx`), run with `onnxruntime` on CPU. Four classes: `tomato`, `apple`, `mango`, `defect`. Preprocessing (letterboxing, normalization) and postprocessing (xywh→xyxy decoding, confidence filtering at 0.25, NMS at IoU 0.45) are implemented from scratch in NumPy — no ultralytics dependency at inference time.

**Grading logic.**

- Defect coverage is the fraction of the produce bounding box overlapped by detected defect regions.
- Coverage is weighted by defect severity (derived from defect detection confidence).
- The weighted score is compared against per-commodity thresholds:

| Commodity | Grade A | Grade B | Grade C | Reject |
|---|---|---|---|---|
| Tomato / Apple | ≤ 3% | ≤ 12% | ≤ 25% | > 25% |
| Mango | ≤ 4% | ≤ 15% | ≤ 30% | > 30% |
| Potato | ≤ 5% | ≤ 18% | ≤ 35% | > 35% |

- Hard rejects: defect coverage above 15%, or produce detection confidence below 50% (returned as `uncertain`).

**Note on quality indicators.** The API also returns `color_score`, `texture_score`, and `shape_score`. These are *heuristic indicators* derived from detection outputs (defect coverage, confidence, bounding-box aspect ratio) to give farmers an at-a-glance quality breakdown — they are **not** independent color/texture analysis. See [Roadmap](#roadmap).

---

## Price guidance

`GET /api/price` queries the data.gov.in **Current Daily Price of Various Commodities from Various Markets (Mandi)** dataset (resource `9ef84268-d588-465a-a308-a864a43d0070`), filtered by commodity and state, with automatic fallback to all-India records when a state has no recent data. The response includes recent per-market min/modal/max prices plus estimated prices for Grade A/B/C lots.

Supported commodity aliases: tomato, mango, potato, apple, banana, onion, grapes (others are passed through title-cased).

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/grade` | Multipart image upload (JPEG/PNG) → grade |
| `GET` | `/api/price?commodity=Tomato&state=Karnataka` | Live mandi prices |

Example grade response:

```json
{
  "produce_name": "Tomato",
  "confidence": 0.91,
  "defect_percentage": 6.4,
  "color_score": 0.99,
  "texture_score": 0.87,
  "shape_score": 0.85,
  "grade": "B",
  "reason": "Tomato detected with confidence 0.91. Detected 2 surface defect region(s) covering ~6.4% of the produce surface. Suitable for local market.",
  "uncertain": false
}
```

Interactive docs at `http://localhost:8000/docs` once the backend is running.

---

## Tech stack

| Layer | Choice |
|---|---|
| Inference | ONNX Runtime (CPU), NumPy, Pillow |
| Backend | FastAPI, Pydantic, Uvicorn |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Price data | data.gov.in Mandi Prices API |

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free [data.gov.in](https://data.gov.in) API key (Profile → API keys → Generate)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # paste your DATA_GOV_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

---

## Project structure

```
backend/
  main.py                  # FastAPI app, CORS, router wiring
  best.onnx                # detection model weights
  routers/
    grade.py               # POST /api/grade — upload validation + pipeline
    price.py               # GET  /api/price — mandi price lookup
  core/
    grading_engine.py      # letterboxing, ONNX inference, NMS, grading logic
    price_service.py       # data.gov.in client, fallbacks, grade estimates
    schemas.py             # Pydantic response models
frontend/
  app/                     # landing, /upload (grading), /prices pages
  components/              # ImageUploader, GradeResultCard, PriceCard, ScoreBar…
  lib/                     # typed API client, shared types, local history
```

---

## Roadmap

- [ ] Replace heuristic color/texture indicators with real analysis (HSV histograms for ripeness, GLCM texture features on the produce crop)
- [ ] Pixel-level defect segmentation instead of bounding-box overlap for more accurate coverage
- [ ] More commodities (onion, banana, grapes already supported on the price side)
- [ ] Publish model card: training dataset, augmentations, and per-class mAP
- [ ] Move `best.onnx` (43 MB) out of the repo into a release asset / Git LFS
- [ ] Hindi and Kannada UI localization

---

## License

MIT
