# MeetingMate AI

An AI meeting assistant: paste a transcript (or record live in-browser),
and it returns a structured summary, minutes, action items, decisions,
risks, open questions, and next steps -- powered by Google Gemini.

## Stack

- **Frontend:** React 19 + Vite, `react-markdown` for rendering results,
  `react-dropzone` for `.txt` uploads, Web Speech API for live transcription
- **Backend:** Flask + `google-generativeai`

## Project structure

```
meetingmate-ai/
├── backend/     # Flask + Gemini API
└── frontend/    # React + Vite
```

## Run it locally

**Backend**
```bash
cd backend
cp .env.example .env        # then paste your GEMINI_API_KEY in
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py                 # http://127.0.0.1:5000
```

**Frontend**
```bash
cd frontend
cp .env.example .env          # defaults to the local backend above
npm install
npm run dev                   # http://localhost:5173
```

Get a `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey).

## Deploying

**Backend (Render, Railway, Fly.io, etc.)**
- Root directory: `backend`
- Set env vars: `GEMINI_API_KEY`, `FRONTEND_ORIGINS` (your deployed frontend
  URL, comma-separated if more than one), `GEMINI_MODEL` (optional, defaults
  to `gemini-3.5-flash`)
- Start command: `gunicorn app:app` (already in `Procfile`)

**Frontend (Vercel/Netlify)**
- Root directory: `frontend`
- Set env var `VITE_API_URL` to your deployed backend's URL
- Build command `npm run build`, output directory `dist` (see `frontend/vercel.json`)

Deploy the backend first, then point the frontend's `VITE_API_URL` at it.

## Notes / limitations

- Live transcription uses the browser's Web Speech API -- Chrome and Edge
  support it; Firefox and Safari currently don't.
- Meeting results only live in memory for the current session -- refreshing
  the page clears them. There's no database yet (see "Next steps" below).
- Transcripts are capped at 100,000 characters, enforced on both the
  frontend and the backend.

## Next steps

Things I'd build next to take this from demo to product:
- Persist meetings to a database (SQLite/Postgres) instead of just React state
- Auth + per-user meeting history
- Background job queue for long transcripts instead of a synchronous request
- Tests (pytest for the backend, Vitest for the frontend) and CI
