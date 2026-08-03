import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

function TranscriptInput({ transcript, setTranscript, handleAnalyze }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        setTranscript(e.target.result);
      };
      reader.readAsText(file);
    },
    [setTranscript]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"] },
    multiple: false,
    noClick: true,
  });

  return (
    <div className="transcript-card">
      <h2>📄 Transcript Analysis</h2>

      <p className="field-label">Paste your transcript below</p>
      <textarea
        className="transcript-box"
        rows="8"
        placeholder="Paste your meeting transcript here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />
      <p className="char-counter">{transcript.length} / 100000 characters</p>

      <div className="or-divider">OR</div>

      <div {...getRootProps()} className={isDragActive ? "dropzone active" : "dropzone"}>
        <input {...getInputProps()} />
        <div className="dropzone-icon">☁️</div>
        <p className="dropzone-title">Drag & Drop your text file here</p>
        <p className="dropzone-sub">or</p>
        <button type="button" className="upload-btn" onClick={open}>
          📁 Upload TXT File
        </button>
        <p className="dropzone-note">Only .txt files are supported</p>
      </div>

      <button className="analyze-btn" onClick={handleAnalyze} disabled={!transcript.trim()}>
        ✨ Analyze Transcript
      </button>
    </div>
  );
}

export default TranscriptInput;