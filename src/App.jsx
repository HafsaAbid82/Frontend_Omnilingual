import { useState } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prevFiles) => {
      const combined = [...prevFiles, ...newFiles];
      // prevent duplicates by filename
      const uniqueFiles = Array.from(new Map(combined.map(f => [f.name, f])).values());
      return uniqueFiles;
    });

    setResults(null);
    setError(null);
  };

  // Upload files to FastAPI backend
  const handleUpload = async () => {
    if (!files.length) return;

    setLoading(true);
    setResults(null);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      // ✅ Correct endpoint for FastAPI
      const response = await fetch("https://hafsaabd82-omnilingual-asr.hf.space/api/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();
      // ✅ FastAPI returns {"results": {...}}
      setResults(data.results || {});
    } catch (err) {
      setError("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <div className="container">
        <header className="header">
          <h1 className="title">Omnilingual ASR – Transcription</h1>
          <p>Bulk Urdu speech-to-text transcription</p>
        </header>

        <div className="section-box">
          <h2 className="section-title">Upload Audio Files</h2>

          <div className="flex-container">
            <label className="upload-area">
              <p className="upload-icon">📂 Click or drag audio files here</p>
              <input
                type="file"
                multiple
                accept=".wav,.mp3"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              {files.map((f) => (
                <div key={f.name} className="file-item">
                  🎧 {f.name}
                </div>
              ))}
            </div>
          )}

          <button
            className="button"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : "Upload & Transcribe"}
          </button>

          {error && <p className="error-text">{error}</p>}
        </div>

        {results && (
  <div className="section-box">
    <h2 className="section-title">Transcriptions</h2>
    <div className="transcription-output-container">
      {Object.entries(results).map(([file, text]) => (
        <div key={file} className="transcription-segment">
          <div className="speaker-label">{file}</div>
          <p className="segment-text">
            {typeof text === "string" ? text : JSON.stringify(text)}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    </div>
  );
}

export default App;
