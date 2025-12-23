import { useState, useRef, useEffect } from "react";
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import { CheckCircleOutline } from '@mui/icons-material';
import TranslateIcon from '@mui/icons-material/Translate';
import BulkProcessing from "../Components/BulkProcessing";
import { 
  ArrowDropDown as ArrowDropDownIcon,
  CloudUpload as CloudUploadIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Language as LanguageIcon,
  PlayArrow,
  Pause,
  Delete as DeleteIcon,
  AccessTime,
  Description,
  VolumeUp
} from "@mui/icons-material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Menu,
  MenuItem,
  Grid,
  IconButton,
  LinearProgress,
  Chip,
  Card as MuiCard,
  CardContent as MuiCardContent
} from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import CircularProgress from '@mui/material/CircularProgress';
import "./Home.css";

function Home() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingType, setProcessingType] = useState('Single Processing');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFileInputVisible, setIsFileInputVisible] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioUrl, setAudioUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]); 
  const [showBulkProcessing, setShowBulkProcessing] = useState(false);
  const [shouldTriggerBulkInput, setShouldTriggerBulkInput] = useState(false);

 
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  
 
  useEffect(() => {
    if (files.length > 0 && processingType === 'Single Processing') {
      const file = files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      const audio = new Audio();
      audio.src = url;
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setSelectedFile(null);
      setAudioUrl(null);
    }
  }, [files, processingType]);
  useEffect(() => {
    if (showBulkProcessing && bulkFileInputRef.current) {
  
      const timer = setTimeout(() => {
        bulkFileInputRef.current.click();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showBulkProcessing]);
  

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    
    audio.volume = volume;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

 
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validAudioFiles = newFiles.filter(file => 
      file.type.startsWith('audio/') || 
      ['.wav', '.mp3', '.m4a', '.ogg', '.flac'].some(ext => file.name.toLowerCase().endsWith(ext))
    );
    
    if (processingType === 'Single Processing') {
      setFiles(validAudioFiles.slice(0, 1));
    } else {
      setFiles((prevFiles) => {
        const combined = [...prevFiles, ...validAudioFiles];
        const uniqueFiles = Array.from(new Map(combined.map(f => [f.name + f.size, f])).values());
        return uniqueFiles;
      });
    }
    
    setResults(null);
    setError(null);
    setSelectedCard(0);
    setIsFileInputVisible(false);
  };
  
  const handleBulkFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validAudioFiles = newFiles.filter(file => 
      file.type.startsWith('audio/') || 
      ['.wav', '.mp3', '.m4a', '.ogg', '.flac'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );
    
    setBulkFiles(validAudioFiles);
    setResults(null);
    setError(null);
  };
  
  const removeFile = () => {
    setFiles([]);
    setSelectedFile(null);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
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
      setSelectedCard(2);
    } catch (err) {
      setError("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };
  
  const handleProcessingMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProcessingMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProcessingTypeSelect = (selectedType) => {
    setProcessingType(selectedType);
    setAnchorEl(null);
    
    if (selectedType === 'Single Processing') {
      setShowBulkProcessing(false);
      setBulkFiles([]);
      setFiles([]);
      setSelectedFile(null);
      setAudioUrl(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    } else if (selectedType === 'Bulk Processing') {
      setShowBulkProcessing(true);
      setFiles([]);
      setSelectedFile(null);
      setResults(null);
      setAudioUrl(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleCardClick = (index) => {
    setSelectedCard(index);
    if (index === 1) {
      setIsRecording(!isRecording);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (e) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };


  return (
    <>
      <div className="floating-background">
        {[...Array(12)].map((_, i) => { 
          const randomLeft = Math.random() * 100; 
          const randomTop = Math.random() * 100; 
          const colors = [
            'rgba(42, 67, 101, 0.08)', 
            'rgba(74, 144, 226, 0.08)',  
            'rgba(11, 17, 24, 0.05)', 
            'rgba(45, 55, 72, 0.06)', 
            'rgba(250, 245, 235, 0.1)', 
          ];
          
          const colorIndex = i % colors.length;
          
          return (
            <div
              key={i}
              className="floating-circle"
              style={{
                '--float-y': `${Math.random() * 60 - 30}px`,
                '--float-x': `${Math.random() * 60 - 30}px`,
                '--rotate': `${Math.random() * 180}deg`,
                width: `${Math.random() * 60 + 40}px`,
                height: `${Math.random() * 60 + 40}px`,
                left: `${randomLeft}%`,
                top: `${randomTop}%`,
                animationDelay: `${i * 0.3}s`,
                background: colors[colorIndex],
                animationDuration: `${15 + Math.random() * 10}s`,
                border: '1px solid rgba(74, 144, 226, 0.05)',
              }}
            />
          );
        })}
      </div>

      <input
        type="file"
        accept=".wav,.mp3,.m4a,.ogg,.flac,audio/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
       <input
        type="file"
        ref={bulkFileInputRef}
        onChange={handleBulkFileChange}
        style={{ display: 'none' }}
        multiple
        accept=".wav,.mp3,.m4a,.ogg,.flac,audio/*"
        webkitdirectory=""
        directory=""
        mozdirectory=""
      />

      <audio
        ref={audioRef}
        src={audioUrl || ''}
        style={{ display: 'none' }}
      />

      <Box className="home-container">
        <Box className="home-header">
          <Typography variant="h1" className="home-title">
            Audio Transcription
          </Typography>
          <Typography sx={{
            color: '#2d3748',
            fontSize: '1rem',
            fontWeight: 400,
            letterSpacing: '0.5px',
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 40px auto'
          }}>
            Transcribe your audio files efficiently with AI-powered accuracy and seamless workflow.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, }}>
          <Button
            variant="outlined"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleProcessingMenuOpen}
            sx={{
              borderColor: 'rgba(74, 144, 226, 0.3)',
              color: '#1a2332',
              backgroundColor: 'transparent',
              backdropFilter: 'blur(12px)',
              borderRadius: '10px',
              padding: '10px 24px',
              fontWeight: 500,
              mb:8,
              '&:hover': {
                backgroundColor: 'rgba(199, 201, 203, 0.1)',
                borderColor: '#2d3748'
              }
            }}
          >
            {processingType}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProcessingMenuClose}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                marginTop: '8px',
                minWidth: '200px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                backgroundColor: 'transparent',
                backdropFilter: 'blur(12px)',
              }
            }}
          >
            <MenuItem 
              onClick={() => handleProcessingTypeSelect('Single Processing')}
              sx={{ 
                padding: '12px 16px',
                color: processingType === 'Single Processing' ? '#adb5c4ff' : '#1a2332',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <CloudUploadIcon /> 
              Single Processing
            </MenuItem>
            <MenuItem 
              onClick={() => handleProcessingTypeSelect('Bulk Processing')}
              sx={{ 
                padding: '12px 16px',
                color: processingType === 'Bulk Processing' ? '#adb5c4ff' : '#1a2332',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <FolderIcon />
              Bulk Processing
            </MenuItem>
          </Menu>
        </Box>
        {selectedFile && processingType === 'Single Processing' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', marginBottom: '48px', borderRadius: '16px', border: '1px solid rgba(11, 17, 24, 0.1)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
              <MuiCardContent>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 3, 
                  color: '#0B1118',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Description sx={{ color: '#2d3748' }} />
                  Selected Audio File
                </Typography>
               <Divider sx={{ my: 2, borderColor: 'rgba(11, 17, 24, 0.1)' , mt:-2}} />
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mb: 3,
                  p: 2,
                  borderRadius: '12px',
                }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      width: '100%'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: '#0B1118' }}
                      >
                        {selectedFile.name}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {formatFileSize(selectedFile.size)}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{ color: '#666', textTransform: 'uppercase' }}
                        >
                          {selectedFile.type.split('/')[1] || 'audio'}
                        </Typography>
                        <Chip 
                          icon={<AccessTime />}
                          label={formatTime(audioDuration)}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: 'rgba(74, 144, 226, 0.3)',
                            color: '#2d3748'
                          }}
                        />
                      </Box>
                    </Box>

                    <IconButton
                      onClick={removeFile}
                      sx={{
                        color: '#dc2626',
                        '&:hover': {
                          backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    mb: 2,
                    width: '100%'
                  }}
                >
                  <IconButton
                    onClick={handlePlayPause}
                    sx={{
                      backgroundColor: '#0B1118',
                      color: 'white',
                      width: 56,
                      height: 56,
                      '&:hover': { backgroundColor: '#1a2332' }
                    }}
                  >
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>

                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="caption" sx={{ color: '#666', minWidth: 40 }}>
                        {formatTime(currentTime)}
                      </Typography>

                      <Box sx={{ flexGrow: 1 }}>
                        <input
                          type="range"
                          min="0"
                          max={audioDuration || 100}
                          value={currentTime}
                          onChange={handleTimeChange}
                          style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            background: `linear-gradient(to right, #0B1118 ${(currentTime / audioDuration) * 100}%, #e5e7eb ${(currentTime / audioDuration) * 100}%)`,
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                        />
                      </Box>

                      <Typography variant="caption" sx={{ color: '#666', minWidth: 40 }}>
                        {formatTime(audioDuration)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
                    <VolumeUp sx={{ color: '#0B1118' }} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                      }}
                      style={{
                        width: '100%',
                        height: '4px',
                        borderRadius: '2px',
                        background: `linear-gradient(to right, #0B1118 ${volume * 100}%, #e5e7eb ${volume * 100}%)`,
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={loading}
                    startIcon={<Description />}
                    sx={{
                      backgroundColor: '#0B1118',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '4px 2px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      minWidth: '200px',
                      '&:hover': {
                        backgroundColor: '#2d3748',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px rgba(11, 17, 24, 0.2)'
                      },
                      '&:disabled': {
                        backgroundColor: '#9ca3af'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16 }}>
                          <CircularProgress size={16} color="inherit" />
                        </Box>
                        Processing...
                      </Box>
                    ) : (
                      'Transcribe Audio'
                    )}
                  </Button>
                </Box>
                {loading && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1, textAlign: 'center' }}>
                      Transcribing audio file...
                    </Typography>
                    <LinearProgress 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: 'rgba(11, 17, 24, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#0B1118'
                        }
                      }} 
                    />
                  </Box>
                )}
              </MuiCardContent>
          </div>
        )}
         {processingType === 'Bulk Processing' && (
          <BulkProcessing 
            files={bulkFiles}
            onFilesChange={setBulkFiles}
          />
        )}
        {results && typeof results === 'object' && (
         <div style={{ maxWidth: '900px', margin: '0 auto', marginBottom: '48px', borderRadius: '16px', border: '1px solid rgba(11, 17, 24, 0.1)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}> 
          <Box sx={{ 
            maxWidth: '900px', 
            margin: '0 auto', 
            justifyContent: 'center',
            alignItems: 'center',
            mb: 6,
          }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'left', 
                  justifyContent: 'center', 
                  mb: 4,
                  flexDirection: 'column',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  textAlign: 'left',
                  mb: 3, 
                  color: '#0B1118',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                    <RecordVoiceOverIcon sx={{ color: '#2d3748' }} />
                 Transcription Results
                </Typography>      
                </Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(11, 17, 24, 0.1)' , mt:-2}} />
                
                <Box sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  p: 3,
                }}>
                  {Object.entries(results).map(([fileName, transcription], index) => (
                    <Box key={fileName} sx={{ mb: index !== Object.entries(results).length - 1 ? 3 : 0 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        p: 1.5,
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 , justifyContent: 'space-between', width: '100%'}}>
                        <Typography sx={{ 
                          fontWeight: 600, 
                          color: '#0B1118',
                          fontSize: '1rem',
                          mb: 2,
                        }}>
                          {selectedFile.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                 <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy'}>
  <IconButton
    onClick={() => {
      const text = Object.entries(results)
        .map(([fileName, transcription]) =>
          `${fileName}:\n${
            typeof transcription === 'string'
              ? transcription
              : JSON.stringify(transcription, null, 2)
          }`
        )
        .join('\n\n');

      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }}
    sx={{
      color: copied ? '#16a34a' : '#4A90E2',
      borderRadius: '100%',
      p: 1,
      '&:hover': {
        backgroundColor: copied
          ? 'rgba(22, 163, 74, 0.12)'
          : 'rgba(74, 144, 226, 0.08)',
      },
      transition: 'all 0.2s ease',
    }}
  >
    {copied ? (
      <CheckCircleOutline fontSize="small" />
    ) : (
      <ContentCopyIcon fontSize="small" />
    )}
  </IconButton>
</Tooltip>
                </Box>
                </Box>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2.5,
                           background: "transparent" ,
                           backdropfilter: 'blur(8px)',
                          borderRadius: '8px',
                          border: '1px solid rgba(11, 17, 24, 0.05)'
                        }}
                      >
                        <Typography sx={{ 
                          color: '#2d3748',
                          lineHeight: 1.6,
                          fontSize: '0.95rem',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {typeof transcription === "string" ? transcription : JSON.stringify(transcription, null, 2)}
                        </Typography>
                      </Paper>
                      {index !== Object.entries(results).length - 1 && (
                        <Divider sx={{ my: 3, borderColor: 'rgba(11, 17, 24, 0.05)' }} />
                      )}
                    </Box>
                  ))}
                </Box>
                
              </CardContent>
          </Box>
</div>  

        )}
        {error && (
          <Box sx={{ maxWidth: '800px', mx: 'auto', mb: 6 }}>
            <Paper elevation={0} sx={{ 
              borderRadius: '16px', 
              border: '1px solid rgba(220, 38, 38, 0.2)', 
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
              p: 3
            }}>
              <Typography sx={{ color: '#dc2626', textAlign: 'center' }}>
                {error}
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </>
  );

}
export default Home;