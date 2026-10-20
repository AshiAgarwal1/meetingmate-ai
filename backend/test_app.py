"""Run: python -m pytest -q   (pip install pytest). No API keys needed."""
import ai_providers
from app import app

SAMPLE = ("Priya: We decided to launch on 15 March. Rahul will finish the login module by Friday. "
          "Amit: I am worried about the payment gateway delay, it is a risk. Who owns testing? "
          "Priya: Next step is a follow up call on Monday.")


def client():
    return app.test_client()


def test_health():
    r = client().get("/health")
    assert r.status_code == 200 and r.json["status"] == "ok"


def test_empty_transcript_rejected():
    assert client().post("/analyze", json={"transcript": "  "}).status_code == 400


def test_all_providers_down_still_returns_analysis(monkeypatch):
    for k in ("GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"):
        monkeypatch.delenv(k, raising=False)
    ai_providers._cache.clear()
    r = client().post("/analyze", json={"transcript": SAMPLE})
    assert r.status_code == 200
    assert r.json["meta"]["degraded"] is True
    assert "## 1. Summary" in r.json["analysis"]


def test_falls_back_to_second_provider(monkeypatch):
    ai_providers._cache.clear()
    ai_providers._cooldown_until.clear()
    fake = {k: ([] if k != "summary" else "ok") for k in ai_providers.SCHEMA_KEYS}

    def boom(*a, **k):
        raise ai_providers.ProviderError("quota", retryable=False, quota=True)

    monkeypatch.setattr(ai_providers, "_call_gemini", boom)
    monkeypatch.setattr(ai_providers, "_call_groq", lambda t, m=None: fake)
    r = client().post("/analyze", json={"transcript": SAMPLE})
    assert r.json["meta"]["provider"].startswith("groq")
    assert r.json["meta"]["degraded"] is False


def test_string_fields_are_coerced_to_lists():
    d = ai_providers._extract_json('{"summary": "x", "minutes": "* one\\n* two", "decisions": null}')
    assert d["minutes"] == ["one", "two"] and d["decisions"] == []
    assert len(d["action_items"]) == 0
