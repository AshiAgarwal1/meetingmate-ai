import { useState } from 'react';
import './App.css';
import axios from "axios";

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TranscriptInput from './components/TranscriptInput';
import ResultsSection from './components/ResultsSection';
import LiveMeeting from './components/LiveMeeting';
import About from './components/About';

// Reads from Vite's env at build time (set VITE_API_URL in .env for
// staging/prod). Falls back to the local Flask dev server.
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
const MAX_TRANSCRIPT_CHARS = 100000;

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mode, setMode] = useState("live");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState("");
  const [meetingCount, setMeetingCount] = useState(0);

  function handlePageChange(newPage) {
    setActivePage(newPage);
    // Only switch "mode" (which input page Dashboard links to) -- don't
    // wipe whatever the user has already typed just because they clicked
    // over to another tab and came back.
    if (newPage === "live" || newPage === "transcript") {
      setMode(newPage);
    }
  }

  async function handleAnalyze() {
    if (!transcript.trim()) {
      alert("Please enter or record a transcript first.");
      return;
    }

    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      alert(`Transcript is over the ${MAX_TRANSCRIPT_CHARS.toLocaleString()} character limit. Trim it and try again.`);
      return;
    }

    // Navigate immediately so the user sees feedback instead of a frozen button
    setResult("Analyzing meeting...");
    setActivePage("results");

    try {
      const response = await axios.post(`${API_URL}/analyze`, { transcript });
      setResult(response.data.analysis);
      setMeetingCount((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      // Surface the backend's actual error message when there is one
      // (missing API key, oversized transcript, Gemini failure) instead of
      // always showing the same generic string.
      const backendMessage = error?.response?.data?.error;
      setResult(backendMessage ? `Error: ${backendMessage}` : "Error connecting to backend.");
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} setActivePage={handlePageChange} />

      <div className="main-content">
        <Header activePage={activePage} />

        {activePage === "dashboard" && (
          <Dashboard mode={mode} meetingCount={meetingCount} setActivePage={handlePageChange} />
        )}

        {activePage === "live" && (
          <LiveMeeting
            transcript={transcript}
            setTranscript={setTranscript}
            handleAnalyze={handleAnalyze}
          />
        )}

        {activePage === "transcript" && (
          <TranscriptInput
            transcript={transcript}
            setTranscript={setTranscript}
            handleAnalyze={handleAnalyze}
          />
        )}

        {activePage === "results" && <ResultsSection result={result} />}

        {activePage === "about" && <About />}
      </div>
    </div>
  );
}

export default App;