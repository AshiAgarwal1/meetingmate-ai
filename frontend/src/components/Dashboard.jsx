import meetingmateai from "../assets/meetingmateai.png";

function Dashboard({ mode, meetingCount, setActivePage }) {
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
          <span className="status-value status-online">Online</span>
          <span className="status-sub">Gemini 1.5 Flash</span>
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
          <span className="status-sub">This month</span>
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