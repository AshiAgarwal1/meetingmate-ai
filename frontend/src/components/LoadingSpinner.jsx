import meetingmateai from "../assets/meetingmateai.png";

function LoadingSpinner() {
  return (
    <div className="loading-card">
      <div className="spinner"></div>
      <h3>
        <img src={meetingmateai} alt="MeetingMate" className="loading-icon" />
        Generating AI Insights...
      </h3>
      <p>Analyzing conversation, extracting action items and decisions</p>
    </div>
  );
}

export default LoadingSpinner;