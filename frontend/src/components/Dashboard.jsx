import { useEffect, useState } from "react";
import meetingmateai from "../assets/meetingmateai.png";

const PROVIDER_LABELS = { gemini: "Gemini", groq: "Groq", openrouter: "OpenRouter" };

function Dashboard({ mode, meetingCount, setActivePage, apiUrl }) {
  // Real backend status (replaces the old hardcoded "Online / Gemini 1.5 Flash").
  const [health, setHealth] = useState({ state: "checking", providers: [] });

  useEffect(() => {
    const controller = new AbortController();
    // Render's free tier can take ~1 minute to wake up, so allow a long wait.
    const timer = setTimeout(() => controller.abort(), 70000);
    const slowNotice = setTimeout(
      () => setHealth((h) => (h.state === "checking" ? { ...h, state: "waking" } : h)),
      4000
    );

    fetch(`${apiUrl}/health`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((data) => {
        const active = Object.entries(data.providers || {})
          .filter(([name, on]) => on && PROVIDER_LABELS[name])
          .map(([name]) => PROVIDER_LABELS[name]);
        setHealth({ state: "online", providers: active });
      })
      .catch(() => setHealth({ state: "offline", providers: [] }))
      .finally(() => {
        clearTimeout(timer);
        clearTimeout(slowNotice);
      });

    return () => {
      controller.abort();
      clearTimeout(timer);
      clearTimeout(slowNotice);
    };
  }, [apiUrl]);

  const ai = {
    checking: { value: "Checking...", cls: "", sub: "Contacting backend" },
    waking: { value: "Waking up...", cls: "", sub: "Server is starting, please wait" },
    offline: { value: "Offline", cls: "status-offline", sub: "Backend unreachable" },
    online: health.providers.length
      ? {
          value: "Online",
          cls: "status-online",
          sub: `${health.providers.length} AI provider${health.providers.length > 1 ? "s" : ""}: ${health.providers.join(", ")}`,
        }
      : { value: "Limited", cls: "status-offline", sub: "No AI keys set - basic mode only" },
  }[health.state];

  const quickActions = [
    {
      key: "live",
      icon: "🎤",
      title: "Start Live Meeting",
      desc: "Start recording and transcribe in real-time",
    },
    {
      key: "transcript",
      icon: "📄",
      title: "Analyze Transcript",
      desc: "Paste or upload a transcript to analyze",
    },
    {
      key: "results",
      icon: "📊",
      title: "View Results",
      desc: "View all your previous meeting results",
    },
    {
      key: "about",
      icon: "ℹ️",
      title: "About Project",
      desc: "Learn more about MeetingMate AI",
    },
  ];

  return (
    <div className="dashboard">
      <div className="welcome-card">
        <div className="welcome-text">
          <h2>Welcome back! 👋</h2>
          <p>Your AI Meeting Assistant is ready to help you capture, analyze and summarize meetings.</p>
        </div>
        <div className="welcome-icon">
          <img src={meetingmateai} alt="MeetingMate AI robot" className="welcome-robot-img" />
        </div>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <span className="status-label">✨ AI Status</span>
          <span className={`status-value ${ai.cls}`}>{ai.value}</span>
          <span className="status-sub">{ai.sub}</span>
        </div>

        <div className="status-card">
          <span className="status-label">🎙️ Recording Status</span>
          <span className="status-value">Inactive</span>
          <span className="status-sub">Not recording</span>
        </div>

        <div className="status-card">
          <span className="status-label">🧭 Current Mode</span>
          <span className="status-value status-link">{mode === "live" ? "Live Meeting" : "Transcript"}</span>
          <span className="status-sub">Overview</span>
        </div>

        <div className="status-card">
          <span className="status-label">📁 Total Meetings</span>
          <span className="status-value">{meetingCount}</span>
          <span className="status-sub">This session</span>
        </div>
      </div>

      <div className="quick-actions-section">
        <h3>Quick Actions</h3>
        <p className="quick-actions-sub">Start a new meeting or analyze existing transcripts.</p>

        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.key}
              className="quick-action-card"
              onClick={() => setActivePage(action.key)}
            >
              <span className="quick-action-icon">{action.icon}</span>
              <span className="quick-action-text">
                <span className="quick-action-title">{action.title}</span>
                <span className="quick-action-desc">{action.desc}</span>
              </span>
              <span className="quick-action-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;