function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "🏠" },
    { key: "live", label: "Live Meeting", icon: "🎤" },
    { key: "transcript", label: "Transcript Analysis", icon: "📄" },
    { key: "results", label: "Results", icon: "📊" },
    { key: "about", label: "About", icon: "ℹ️" },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon-wrap">
          <img src="/favicon.svg" alt="MeetingMate logo" className="sidebar-logo-img" />
        </div>
        <span className="sidebar-logo-text">MeetingMate</span>
        
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={
              activePage === item.key ? "sidebar-link active" : "sidebar-link"
            }
            onClick={() => setActivePage(item.key)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;