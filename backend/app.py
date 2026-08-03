from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# CORS: only allow the frontend origin(s) listed in .env, not every site on
# the internet. Comma-separated so you can add your deployed frontend URL
# alongside localhost during development.
allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
]
CORS(app, origins=allowed_origins)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
MAX_TRANSCRIPT_CHARS = int(os.getenv("MAX_TRANSCRIPT_CHARS", "100000"))

model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": GEMINI_MODEL})


@app.route("/analyze", methods=["POST"])
def analyze():
    if model is None:
        return jsonify({"error": "Server is missing GEMINI_API_KEY. Set it in backend/.env."}), 500

    data = request.get_json(silent=True) or {}
    transcript = (data.get("transcript") or "").strip()

    if not transcript:
        return jsonify({"error": "transcript is required"}), 400

    if len(transcript) > MAX_TRANSCRIPT_CHARS:
        return jsonify({"error": f"transcript exceeds {MAX_TRANSCRIPT_CHARS} character limit"}), 400

    prompt = f"""
You are an AI Meeting Assistant.

Analyze the meeting transcript and provide:

1. Summary
2. Minutes of Meeting
3. Action Items
4. Decisions
5. Risks
6. Open Questions
7. Next Steps

Transcript:

{transcript}
"""

    try:
        response = model.generate_content(prompt)
    except Exception as exc:
        app.logger.exception("Gemini request failed")
        return jsonify({"error": f"AI request failed: {exc}"}), 502

    return jsonify({"analysis": response.text})


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(debug=debug_mode)
