import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseSections, getSectionStyle } from "../utils/parseSections";
import ExportButtons from "./ExportButtons";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

function ResultsSection({ result }) {
  if (!result) {
    return <EmptyState />;
  }

  if (result === "Analyzing meeting...") {
    return <LoadingSpinner />;
  }

  if (result.startsWith("Error")) {
    const detail = result.startsWith("Error:") ? result.slice(6).trim() : null;
    return (
      <div className="results-card">
        <h2>⚠️ Something went wrong</h2>
        <p>{detail || "Could not connect to the backend. Please check your Flask server is running."}</p>
      </div>
    );
  }

  const sections = parseSections(result);

  return (
    <div className="results-page">
      <div className="results-header-row">
        <h2>📋 Meeting Analysis</h2>
        <ExportButtons result={result} />
      </div>

      <div className="section-cards-grid">
        {sections.map((section, i) => {
          const { icon, className } = getSectionStyle(section.title);
          return (
            <div key={i} className={`section-card ${className}`}>
              <h3>
                <span className="section-icon">{icon}</span>
                {section.title}
              </h3>
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {section.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ResultsSection;