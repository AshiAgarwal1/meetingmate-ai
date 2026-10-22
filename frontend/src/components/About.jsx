function About() {
  return (
    <div className="results-card">
      <h2>ℹ️ About MeetingMate AI</h2>
      <p>
        MeetingMate AI is an AI-powered meeting assistant that turns raw
        conversation into structured minutes, action items, decisions, risks
        and next steps. Record a meeting live in your browser, or paste a
        transcript, and get organized notes in seconds.
      </p>

      <h3 style={{ marginTop: 20 }}>Reliability</h3>
      <p>
        If one AI service is busy or rate-limited, MeetingMate automatically
        switches to the next one, so you still get your results. Each result
        shows which AI produced it.
      </p>

      <h3 style={{ marginTop: 20 }}>Tech Stack</h3>
      <ul>
        <li>React + Vite (Frontend)</li>
        <li>Flask (Backend API) with rate limiting and response caching</li>
        <li>Multi-provider AI with automatic fallback: Google Gemini, Groq, OpenRouter</li>
        <li>Offline rule-based summary as a last resort</li>
        <li>Web Speech API (Live Transcription)</li>
        <li>Axios (API Communication)</li>
      </ul>

      <h3 style={{ marginTop: 20 }}>Version</h3>
      <p>v1.1.0</p>
    </div>
  );
}

export default About;