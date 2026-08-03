import { useRef, useState, useEffect } from "react";

function LiveMeeting({ transcript, setTranscript, handleAnalyze }) {
  const recognitionRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  function formatTime(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function startMeeting() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setSeconds(0);
  }

  function stopMeeting() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }

  return (
    <div className="live-meeting-card">
      <div className="live-meeting-grid">
        <div className="recording-panel">
          <div className="recording-status-row">
            {isRecording ? (
              <span className="rec-dot">● Recording</span>
            ) : (
              <span className="rec-dot-inactive">○ Not recording</span>
            )}
            <span className="rec-timer">{formatTime(seconds)}</span>
          </div>

          <div className="mic-circle-wrap">
            <div className={isRecording ? "mic-circle pulsing" : "mic-circle"}>
              🎙️
            </div>
          </div>

          {isRecording && (
            <div className="waveform">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${(i % 6) * 0.1}s` }}></span>
              ))}
            </div>
          )}

          <div className="recording-controls">
            <button className="record-btn" onClick={startMeeting} disabled={isRecording}>
              🎤 Start Meeting
            </button>
            <button className="record-btn stop" onClick={stopMeeting} disabled={!isRecording}>
              🛑 Stop Meeting
            </button>
          </div>
        </div>

        <div className="live-transcript-box">
          <h3>Live Transcript</h3>
          <p>{transcript || "Start speaking..."}</p>
        </div>
      </div>

      <div className="tip-banner">
        💡 Tip: Speak clearly and avoid background noise for better transcription accuracy.
      </div>

      <button
        className="analyze-btn"
        onClick={handleAnalyze}
        disabled={!transcript.trim()}
      >
        ✨ Analyze Meeting
      </button>
    </div>
  );
}

export default LiveMeeting;