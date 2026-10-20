from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import logging
import os

load_dotenv()
logging.basicConfig(level=logging.INFO)

# Imported after load_dotenv() so the provider keys in .env are available.
from ai_providers import generate_minutes

app = Flask(__name__)

# CORS: only allow the frontend origin(s) listed in .env.
allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
]
CORS(app, origins=allowed_origins)

# Protects your API quota from accidental spam / strangers.
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per hour"])

MAX_TRANSCRIPT_CHARS = int(os.getenv("MAX_TRANSCRIPT_CHARS", "100000"))


def configured_providers():
    """Which AI providers have keys set (for /health, never exposes the keys)."""
    return {
        "gemini": bool(os.getenv("GEMINI_API_KEY")),
        "groq": bool(os.getenv("GROQ_API_KEY")),
        "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
        "local_fallback": True,
    }


@app.route("/health", methods=["GET"])
@limiter.exempt
def health():
    return jsonify({"status": "ok", "providers": configured_providers()})


@app.route("/analyze", methods=["POST"])
@limiter.limit("10 per minute")
def analyze():
    data = request.get_json(silent=True) or {}
    transcript = (data.get("transcript") or "").strip()

    if not transcript:
        return jsonify({"error": "transcript is required"}), 400

    if len(transcript) > MAX_TRANSCRIPT_CHARS:
        return jsonify({"error": f"transcript exceeds {MAX_TRANSCRIPT_CHARS} character limit"}), 400

    # Never raises on AI failure: walks Gemini -> Gemini backup -> Groq ->
    # OpenRouter -> local heuristic.
    result = generate_minutes(transcript)

    return jsonify({
        "analysis": result["analysis"],           # markdown, same as before
        "meta": {
            "provider": result["provider"],
            "degraded": result["degraded"],       # True = all AI failed, basic mode
            "cached": result["cached"],
            "attempts": result["attempts"],
        },
    })


@app.errorhandler(429)
def too_many_requests(_):
    return jsonify({"error": "Too many requests. Please wait a minute and try again."}), 429


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(debug=debug_mode)
