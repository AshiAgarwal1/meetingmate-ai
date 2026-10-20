"""
ai_providers.py - resilient AI layer for MeetingMate.

Fallback chain (first that works wins):
  1. Gemini (primary model, then a backup Gemini model)
  2. Groq        (free tier, very fast, OpenAI-compatible)
  3. OpenRouter  (free models, OpenAI-compatible)
  4. Local rule-based summary (no AI, no network - never fails)

Features: retries with exponential backoff, circuit breaker (skip a provider
for a while after it hits quota/errors), response cache, structured JSON output.
"""
import hashlib
import json
import logging
import os
import re
import time

import requests

log = logging.getLogger("meetingmate.ai")

REQUEST_TIMEOUT = 45          # seconds per provider call
MAX_RETRIES = 2               # retries per provider on transient errors
COOLDOWN_SECONDS = 120        # how long to skip a provider after it fails hard
CACHE_MAX = 100

SCHEMA_KEYS = ["summary", "minutes", "action_items", "decisions",
               "risks", "open_questions", "next_steps"]

PROMPT = """You are an expert meeting assistant. Read the transcript and return
ONLY valid JSON (no markdown fences, no commentary) with exactly these keys:
- "summary": string, 3-5 sentences
- "minutes": list of strings (key discussion points, in order)
- "action_items": list of objects {{"task": str, "owner": str, "deadline": str}}
  (use "Unassigned"/"Not specified" when unknown; never invent facts)
- "decisions": list of strings
- "risks": list of strings
- "open_questions": list of strings
- "next_steps": list of strings
Only use information present in the transcript.

TRANSCRIPT:
{transcript}
"""


class ProviderError(Exception):
    def __init__(self, msg, retryable=True, quota=False):
        super().__init__(msg)
        self.retryable = retryable
        self.quota = quota


# ---------------------------------------------------------------- helpers
def _extract_json(text: str) -> dict:
    """Parse JSON even if the model wrapped it in ```json fences or chatter."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            raise ProviderError("Model did not return JSON", retryable=True)
        try:
            data = json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            raise ProviderError("Model returned malformed JSON", retryable=True)
    for k in SCHEMA_KEYS:
        data.setdefault(k, "" if k == "summary" else [])
        # Models sometimes return a plain string/None where a list is expected.
        if k != "summary":
            v = data[k]
            if v is None:
                data[k] = []
            elif isinstance(v, str):
                data[k] = [ln.lstrip("-*\u2022 ").strip() for ln in v.splitlines() if ln.strip()]
            elif isinstance(v, dict):
                data[k] = [v]
    return data


def _classify_http(status: int, body: str) -> ProviderError:
    quota = status == 429 or "quota" in body.lower() or "rate" in body.lower()
    retryable = status in (408, 429, 500, 502, 503, 504)
    return ProviderError(f"HTTP {status}: {body[:200]}", retryable=retryable, quota=quota)


# ---------------------------------------------------------------- providers
def _call_gemini(transcript: str, model: str) -> dict:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise ProviderError("GEMINI_API_KEY not set", retryable=False)
    # Plain REST call: no SDK version headaches.
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    resp = requests.post(
        url,
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": PROMPT.format(transcript=transcript)}]}],
            "generationConfig": {"temperature": 0.2,
                                 "responseMimeType": "application/json"},
        },
        timeout=REQUEST_TIMEOUT,
    )
    if resp.status_code != 200:
        raise _classify_http(resp.status_code, resp.text)
    try:
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise ProviderError("Gemini returned no content (maybe blocked)", retryable=False)
    return _extract_json(text)


def _call_openai_compatible(transcript: str, base_url: str, key_env: str,
                            model: str, extra_headers=None) -> dict:
    key = os.getenv(key_env)
    if not key:
        raise ProviderError(f"{key_env} not set", retryable=False)
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    headers.update(extra_headers or {})
    resp = requests.post(
        f"{base_url}/chat/completions",
        headers=headers,
        json={
            "model": model,
            "temperature": 0.2,
            "messages": [{"role": "user", "content": PROMPT.format(transcript=transcript)}],
        },
        timeout=REQUEST_TIMEOUT,
    )
    if resp.status_code != 200:
        raise _classify_http(resp.status_code, resp.text)
    try:
        text = resp.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise ProviderError("Provider returned no content", retryable=True)
    return _extract_json(text)


def _call_groq(transcript: str, model: str = None) -> dict:
    model = model or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    return _call_openai_compatible(
        transcript, "https://api.groq.com/openai/v1", "GROQ_API_KEY", model)


def _call_openrouter(transcript: str) -> dict:
    return _call_openai_compatible(
        transcript, "https://openrouter.ai/api/v1", "OPENROUTER_API_KEY",
        os.getenv("OPENROUTER_MODEL", "openrouter/free"),
        extra_headers={"X-Title": "MeetingMate AI"})


def _local_fallback(transcript: str) -> dict:
    """Last resort: no AI. Simple keyword heuristics so the app never dies."""
    lines = [l.strip() for l in re.split(r"[\n.!?]+", transcript) if len(l.strip()) > 15]
    pick = lambda pat: [l for l in lines if re.search(pat, l, re.I)][:8]
    return {
        "summary": " ".join(lines[:4]) or "Transcript too short to summarize.",
        "minutes": lines[:10],
        "action_items": [{"task": l, "owner": "Unassigned", "deadline": "Not specified"}
                         for l in pick(r"\b(will|need to|should|must|todo|action|please|assign)\b")],
        "decisions": pick(r"\b(decided|agreed|approved|finalized|going with)\b"),
        "risks": pick(r"\b(risk|concern|blocker|delay|issue|problem|worried)\b"),
        "open_questions": [l for l in lines if "?" in l or re.search(r"\b(unclear|tbd|not sure)\b", l, re.I)][:8],
        "next_steps": pick(r"\b(next|follow up|by (monday|tuesday|wednesday|thursday|friday)|deadline)\b"),
    }




# ---------------------------------------------------------------- markdown
SECTION_TITLES = [
    ("summary", "Summary"), ("minutes", "Minutes of Meeting"),
    ("action_items", "Action Items"), ("decisions", "Decisions"),
    ("risks", "Risks"), ("open_questions", "Open Questions"),
    ("next_steps", "Next Steps"),
]


def to_markdown(data: dict) -> str:
    """Render structured data as '## N. Title' markdown, which the existing
    frontend (parseSections) already knows how to turn into cards."""
    out = []
    for i, (key, title) in enumerate(SECTION_TITLES, 1):
        out.append(f"## {i}. {title}")
        val = data.get(key)
        if key == "summary":
            out.append(str(val or "No summary available."))
        elif key == "action_items":
            items = val or []
            if not items:
                out.append("- None identified.")
            else:
                out.append("| Task | Owner | Deadline |\n|---|---|---|")
                for it in items:
                    if isinstance(it, dict):
                        row = [str(it.get(k, "")).replace("|", "/") for k in ("task", "owner", "deadline")]
                    else:
                        row = [str(it).replace("|", "/"), "Unassigned", "Not specified"]
                    out.append("| " + " | ".join(row) + " |")
        else:
            items = val or []
            out.extend([f"- {x}" for x in items] or ["- None identified."])
        out.append("")
    return "\n".join(out)

# ---------------------------------------------------------------- orchestrator
_cooldown_until: dict[str, float] = {}
_cache: dict[str, dict] = {}


def _providers():
    primary = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    backup = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite")
    groq_primary = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    groq_backup = os.getenv("GROQ_FALLBACK_MODEL", "openai/gpt-oss-20b")
    chain = [
        (f"gemini:{primary}", lambda t: _call_gemini(t, primary)),
        (f"gemini:{backup}", lambda t: _call_gemini(t, backup)),
        (f"groq:{groq_primary}", lambda t: _call_groq(t, groq_primary)),
        (f"groq:{groq_backup}", lambda t: _call_groq(t, groq_backup)),
        ("openrouter", _call_openrouter),
    ]
    return chain


def generate_minutes(transcript: str) -> dict:
    """Returns {"data": {...}, "provider": str, "degraded": bool, "attempts": [...]}.
    Never raises for provider failures."""
    transcript = transcript.strip()
    cache_key = hashlib.sha256(transcript.encode()).hexdigest()
    if cache_key in _cache:
        return {**_cache[cache_key], "cached": True}

    attempts = []
    for name, fn in _providers():
        if _cooldown_until.get(name, 0) > time.time():
            attempts.append({"provider": name, "status": "skipped (cooling down)"})
            continue
        for attempt in range(MAX_RETRIES + 1):
            try:
                data = fn(transcript)
                result = {"data": data, "analysis": to_markdown(data), "provider": name,
                          "degraded": False, "attempts": attempts, "cached": False}
                if len(_cache) >= CACHE_MAX:
                    _cache.pop(next(iter(_cache)))
                _cache[cache_key] = result
                return result
            except ProviderError as e:
                log.warning("%s attempt %d failed: %s", name, attempt + 1, e)
                if e.quota or not e.retryable or attempt == MAX_RETRIES:
                    attempts.append({"provider": name, "status": f"failed: {str(e)[:120]}"})
                    if e.quota or not e.retryable:
                        _cooldown_until[name] = time.time() + COOLDOWN_SECONDS
                    break
                time.sleep(2 ** attempt)          # 1s, 2s ...
            except requests.RequestException as e:
                log.warning("%s network error: %s", name, e)
                if attempt == MAX_RETRIES:
                    attempts.append({"provider": name, "status": f"network error: {str(e)[:100]}"})
                    _cooldown_until[name] = time.time() + 30
                    break
                time.sleep(2 ** attempt)

    # Everything failed -> local heuristic so the user still gets something.
    log.error("All AI providers failed: %s", attempts)
    local = _local_fallback(transcript)
    return {"data": local, "analysis": to_markdown(local), "provider": "local-heuristic",
            "degraded": True, "attempts": attempts, "cached": False}
