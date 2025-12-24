import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom'; // Add this import
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
  const navigate = useNavigate(); // Add this hook
  
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
      // Navigate to transcription page with results
      navigate('/transcription', { 
        state: { 
          results: data.results || {},
          selectedFile: selectedFile
        } 
      });
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
      <div className="floating-background" />

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

      <Box className="home-container" >
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
                        <Typography variant="caption" sx={{ color: '#666', mt: 0.5 }}>
                          {formatFileSize(selectedFile.size)}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{ color: '#666', textTransform: 'uppercase', mt: 0.5 }}
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
                            height: 24,
                            padding: 0.15,
                            mt: 0.25,
                            color: '#2d3748'
                          }}
                        />
                      </Box>
                    </Box>

                    <IconButton
                      onClick={removeFile}
                      sx={{
                        color: '#0B1118',
                        '&:hover': {
                          backgroundColor: 'rgba(11, 17, 24, 0.06)',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ color: '#0B1118' }} />
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
                      padding: '12px 24px',
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
                    }}
                  >
                  Transcribe Audio
                  </Button>
                </Box>
              </MuiCardContent>
          </div>
        )}
         {processingType === 'Bulk Processing' && (
          <BulkProcessing 
            files={bulkFiles}
            onFilesChange={setBulkFiles}
            onNavigateToTranscription={navigate} // Add this prop
          />
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