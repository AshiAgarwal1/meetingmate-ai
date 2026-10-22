# MeetingMate AI

An AI-powered meeting assistant that converts meeting transcripts into structured summaries, meeting minutes, action items, decisions, risks, open questions, and next steps.

**Live Demo:** https://meetingmate-ai.vercel.app  
**GitHub:** https://github.com/AshiAgarwal1/meetingmate-ai

## Features

- **Transcript Analysis:** Generate structured meeting insights from text transcripts.
- **Live Transcription:** Capture speech using the browser's Web Speech API.
- **File Upload:** Upload `.txt` transcripts for analysis.
- **Multiple AI Providers:** Gemini, Groq, and OpenRouter with automatic fallback.
- **Error Handling:** Retries, provider cooldowns, and response caching.
- **Local Fallback:** Generate a basic rule-based analysis if all AI providers fail.
- **Security and Validation:** Transcript size limits, API rate limiting, and configured CORS origins.

## Tech Stack

- **Frontend:** React, Vite, JavaScript, Axios
- **Backend:** Python, Flask, REST API
- **AI Providers:** Google Gemini, Groq, OpenRouter
- **Deployment:** Vercel (frontend), configurable Python hosting (backend)

## How It Works

1. Enter a transcript, upload a text file, or use live transcription.
2. The frontend sends the transcript to the Flask backend.
3. The backend checks its response cache and attempts the configured AI providers in order.
4. If a provider fails, the backend retries eligible errors or moves to another provider.
5. If all AI providers fail, a rule-based fallback generates a basic analysis.
6. The frontend displays the results in structured sections.

## Run Locally

### Backend

```bash
cd backend
python -m venv venv
```

Activate the environment:

**Windows PowerShell**
```powershell
.\venv\Scripts\Activate.ps1
```

**macOS/Linux**
```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and add the API keys for the providers you want to use. Keep these keys private.

Start the backend:

```bash
python app.py
```

Backend URL: `http://127.0.0.1:5000`

### Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`. Set `VITE_API_URL` to your backend URL.

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Deployment

- **Backend:** Deploy the `backend` directory to a Python hosting platform. Configure the required API keys and `FRONTEND_ORIGINS`.
- **Frontend:** Deploy the `frontend` directory to Vercel. Set `VITE_API_URL` to the deployed backend URL and use `npm run build` to build the application.

## Limitations

- Live transcription depends on browser support for the Web Speech API.
- Meeting history is not stored in a database.
- Cache and cooldown state are held in memory and reset when the backend restarts.
- The local fallback uses simple rules and is less capable than AI-generated analysis.
