function About() {
  return (
    <div className="results-card">
      <h2>ℹ️ About MeetingMate AI</h2>
      <p>
        MeetingMate AI is an AI-powered meeting assistant that transcribes,
        analyzes, and summarizes meetings in real time — turning raw
        conversation into structured summaries, action items, decisions,
        and next steps.
      </p>

      <h3 style={{ marginTop: 20 }}>Tech Stack</h3>
      <ul>
        <li>React + Vite (Frontend)</li>
        <li>Flask (Backend API)</li>
        <li>Google Gemini API (AI Analysis)</li>
        <li>Web Speech API (Live Transcription)</li>
        <li>Axios (API Communication)</li>
      </ul>

      <h3 style={{ marginTop: 20 }}>Version</h3>
      <p>v1.0.0</p>
    </div>
  );
}

export default About;