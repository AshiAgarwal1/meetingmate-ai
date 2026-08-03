const pageTitles = {
  dashboard: "Dashboard",
  live: "Live Meeting",
  transcript: "Transcript Analysis",
  results: "Results",
  about: "About",
};

function Header({ activePage }) {
  return (
    <div className="top-header">
      <h1 className="page-title">{pageTitles[activePage] || "MeetingMate AI"}</h1>
    </div>
  );
}

export default Header;