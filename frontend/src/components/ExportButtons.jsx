import { useState } from "react";
import { exportAsPdf, exportAsTxt, copyToClipboard } from "../utils/exportUtils";

function ExportButtons({ result }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const success = await copyToClipboard(result);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="export-buttons">
      <button className="export-btn export-pdf" onClick={() => exportAsPdf(result)}>
        ⬇ Export PDF
      </button>
      <button className="export-btn export-txt" onClick={() => exportAsTxt(result)}>
        ⬇ Export TXT
      </button>
      <button className="export-btn export-copy" onClick={handleCopy}>
        {copied ? "✅ Copied!" : "📋 Copy All"}
      </button>
    </div>
  );
}

export default ExportButtons;