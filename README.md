# Finopsy

Student-first Indian personal-finance diagnostics: upload transactions, see where money went, receive a deterministic Money Autopsy, and optionally get roasted.

## Structure

- `frontend/` — Next.js, TypeScript, Tailwind UI
- `backend/` — FastAPI, deterministic financial engine and import pipeline
- `docs/` — durable product and architecture context for focused agent tasks

## Run locally

1. Create `backend/.env` from `backend/.env.example` when integrations are added.
2. Backend: `cd backend; python -m venv .venv; .venv\\Scripts\\activate; pip install -r requirements.txt; uvicorn app.main:app --reload`
3. Frontend: `cd frontend; npm install; npm run dev`

The backend health endpoint is at `http://localhost:8000/api/health`; the frontend runs at `http://localhost:3000`.
