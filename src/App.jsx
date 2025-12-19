import { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validAudioFiles = newFiles.filter(file => 
      file.type.startsWith('audio/') || 
      ['.wav', '.mp3', '.m4a', '.ogg', '.flac'].some(ext => file.name.toLowerCase().endsWith(ext))
    );
    setFiles((prevFiles) => {
      const combined = [...prevFiles, ...validAudioFiles];
      const uniqueFiles = Array.from(new Map(combined.map(f => [f.name + f.size, f])).values());
      return uniqueFiles;
    })
    setResults(null);
    setError(null);
  };
  const removeFile = (fileName) => {
    setFiles(files.filter(f => f.name !== fileName));
  };
  const handleUpload = async () => {
    if (!files.length) return;

    setLoading(true);
    setResults(null);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("https://hafsaabd82-omnilingual-asr.hf.space/api/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();
      setResults(data.results || {});
    } catch (err) {
      setError("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
<div className="floating-background">
  {[...Array(18)].map((_, i) => { 
    const randomLeft = Math.random() * 100; 
    const randomTop = Math.random() * 100; 
    const circleCenterX = 40 + Math.random() * 20; 
    const circleCenterY = 40 + Math.random() * 20; 
    const angle = (i / 18) * Math.PI * 2;
    const radius = 30 + Math.random() * 50; 
    const useRandom = Math.random() > 0.5;
    const baseX = useRandom ? randomLeft : circleCenterX + Math.cos(angle) * radius;
    const baseY = useRandom ? randomTop : circleCenterY + Math.sin(angle) * radius;
    const randomY = Math.random() * 80 - 40; 
    const randomX = Math.random() * 80 - 40;
    const randomRotate = Math.random() * 180;
    const colors = [
      'rgba(79, 70, 229, 0.12)', 
      'rgba(99, 102, 241, 0.12)',  
      'rgba(129, 140, 248, 0.12)', 
      'rgba(168, 162, 255, 0.12)', 
      'rgba(199, 210, 254, 0.12)', 
    ];
    
    const colorIndex = i % colors.length;
    
    return (
      <div
        key={i}
        className="floating-circle"
        style={{
          '--float-y': `${randomY}px`,
          '--float-x': `${randomX}px`,
          '--rotate': `${randomRotate}deg`,
          width: `${Math.random() * 70 + 50}px`, 
          height: `${Math.random() * 70 + 50}px`,
          left: `${baseX}%`,
          top: `${baseY}%`,
          animationDelay: `${i * 0.4}s`, 
          background: colors[colorIndex],
          animationDuration: `${12 + Math.random() * 10}s`, 
        }}
      />
    );
  })}
</div>
      
        <div className="container">
          <header className="header">
            <h1 className="title">Omnilingual ASR – Transcription</h1>
            <p>Bulk Urdu speech-to-text transcription with audio preview</p>
          </header>

          <div className="section-box">
            <h2 className="section-title">Upload Audio Files</h2>

            <div className="flex-container">
              <label className="upload-area">
                <div className="upload-icon">
                  <span>📂</span>
                  <div>Click or drag audio files here</div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '4px' }}>
                  Supports: .wav, .mp3, .m4a, .ogg, .flac
                </p>
                <input
                  type="file"
                  multiple
                  accept=".wav,.mp3,.m4a,.ogg,.flac,audio/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {files.length > 0 && (
              <div className="file-list">
                {files.map((file) => (
                  <div key={`${file.name}-${file.size}`} className="file-item">
                    <div className="file-header">
                      <div className="file-icon">🎧</div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-meta">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.type || 'Audio file'}</span>
                        </div>
                      </div>
                      <button 
                        className="remove-file-btn" 
                        onClick={() => removeFile(file.name)}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="audio-player-container">
                      <AudioPlayer file={file} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="actions">
              <button
                className="button"
                onClick={handleUpload}
                disabled={loading || files.length === 0}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Processing audio files…</span>
                  </>
                ) : (
                  <>
                    <span> 📤 </span>
                    <span>Upload & Transcribe</span>
                  </>
                )}
              </button>
            </div>

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
    </>
  );
}

function AudioPlayer({ file }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  const fileURL = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      URL.revokeObjectURL(fileURL);
    };
  }, [fileURL]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const value = parseFloat(e.target.value);
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="custom-audio-player">
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }}>
        <source src={fileURL} type={file.type || 'audio/mpeg'} />
        Your browser does not support the audio element.
      </audio>
      
      <div className="audio-controls">
        <button 
          className="play-pause-btn" 
          onClick={togglePlay}
          disabled={!isLoaded}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </div>
        
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          style={{ flex: 2 }}
          disabled={!isLoaded}
        />
        
        <div className="volume-control">
          <span>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
    
  );
}

export default App;
