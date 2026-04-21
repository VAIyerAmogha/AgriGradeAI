# AgriGrade AI

AgriGrade AI is a full-stack prototype that provides camera-based produce grading and mandi price guidance for Indian farmers.

## Prerequisites

- Node.js 18+
- Python 3.10+

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your data.gov.in API key to .env
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Getting a data.gov.in API key

1. Go to https://data.gov.in
2. Register for a free account
3. Go to your profile -> API keys -> Generate key
4. Paste it into backend/.env as DATA_GOV_API_KEY

## API endpoints

- `GET /health` - health check
- `POST /api/grade` - upload produce image, get grade
- `GET /api/price?commodity=Tomato&state=Karnataka` - get mandi prices

## Project structure explanation

- `backend/`: FastAPI app with grading and pricing APIs.
- `backend/core/`: Domain schemas and business logic for grading and prices.
- `backend/routers/`: HTTP route handlers for grade and price endpoints.
- `frontend/`: Next.js app with upload, grading result, and pricing interface.
- `frontend/components/`: Reusable UI components used by the app page.
- `frontend/lib/`: Typed API client and shared TypeScript interfaces.
