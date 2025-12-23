import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Tooltip,
  Divider,
  Paper
} from '@mui/material';
import {
  Folder as FolderIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Flag as FlagIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow,
  Pause,
  Delete as DeleteIcon,
  VolumeUp,
  Description,
  FiberManualRecord,
  ContentCopy,
  RecordVoiceOver
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';

function BulkProcessing({ files = [], onFilesChange }) {
  const [processingStatus, setProcessingStatus] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoProcess, setAutoProcess] = useState(false);
  const [audioPlayers, setAudioPlayers] = useState({});
  const [currentTime, setCurrentTime] = useState({});
  const [isPlaying, setIsPlaying] = useState({});
  const [volume, setVolume] = useState({});
  const [audioUrls, setAudioUrls] = useState({});
  const [processingSingleFile, setProcessingSingleFile] = useState(null);
  const [copiedFiles, setCopiedFiles] = useState({});
  
  const fileInputRef = useRef(null);
  const audioRefs = useRef({});

  const categories = {
    toBeProcessed: files.filter(file => !processingStatus[file.name] || processingStatus[file.name]?.status === 'pending'),
    processed: files.filter(file => processingStatus[file.name]?.status === 'completed'),
    flagged: files.filter(file => processingStatus[file.name]?.status === 'flagged'),
    failed: files.filter(file => processingStatus[file.name]?.status === 'failed')
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validAudioFiles = newFiles.filter(file => 
      file.type.startsWith('audio/') || 
      ['.wav', '.mp3', '.m4a', '.ogg', '.flac'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (validAudioFiles.length === 0) return;

    validAudioFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      
      audio.onloadedmetadata = () => {
        setAudioPlayers(prev => ({
          ...prev,
          [file.name]: {
            duration: audio.duration,
            url
          }
        }));
      };

      setAudioUrls(prev => ({ ...prev, [file.name]: url }));
      setCurrentTime(prev => ({ ...prev, [file.name]: 0 }));
      setIsPlaying(prev => ({ ...prev, [file.name]: false }));
      setVolume(prev => ({ ...prev, [file.name]: 1 }));
      
      // Initialize status as pending
      setProcessingStatus(prev => ({
        ...prev,
        [file.name]: { status: 'pending', progress: 0 }
      }));
    });

    if (onFilesChange) {
      onFilesChange(prev => {
        const combined = [...prev, ...validAudioFiles];
        const uniqueFiles = Array.from(
          new Map(combined.map(f => [f.name + f.size + f.lastModified, f])).values()
        );
        return uniqueFiles;
      });
    }

    // Reset file input to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Process only the new files when autoProcess is enabled
    if (autoProcess && validAudioFiles.length > 0) {
      handleProcessNewFiles(validAudioFiles);
    }
  };

  // Function to process only newly added files
  const handleProcessNewFiles = async (newFiles) => {
    setIsProcessing(true);
    
    for (const file of newFiles) {
      try {
        setProcessingStatus(prev => ({
          ...prev,
          [file.name]: { status: 'processing', progress: 0 }
        }));

        // Actual API call
        const transcription = await processFileWithAPI(file);
        
        setProcessingStatus(prev => ({
          ...prev,
          [file.name]: { 
            status: 'completed', 
            progress: 100,
            transcription: transcription
          }
        }));

      } catch (error) {
        setProcessingStatus(prev => ({
          ...prev,
          [file.name]: { status: 'failed', progress: 100, error: error.message }
        }));
      }
    }
    
    setIsProcessing(false);
  };

  const handleFolderUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Actual API call function
  const processFileWithAPI = async (file) => {
    const formData = new FormData();
    formData.append("files", file);
    
    try {
      const response = await fetch("https://hafsaabd82-omnilingual-asr.hf.space/api/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const data = await response.json();
      
      // The API returns an object with filename as key and transcription as value
      // We need to extract the transcription for this specific file
      const transcription = data.results[file.name] || 
                           data.results[0]?.transcription || 
                           JSON.stringify(data.results, null, 2);
      
      return transcription;
    } catch (error) {
      throw new Error(`Failed to transcribe: ${error.message}`);
    }
  };

  const handleProcessAll = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    
    // Initialize all files as processing
    const initialStatus = {};
    files.forEach(file => {
      initialStatus[file.name] = { status: 'processing', progress: 0 };
    });
    setProcessingStatus(initialStatus);

    // Process files sequentially
    for (const file of files) {
      try {
        // Update progress to show processing has started
        setProcessingStatus(prev => ({
          ...prev,
          [file.name]: { status: 'processing', progress: 25 }
        }));

        // Actual API call
        const transcription = await processFileWithAPI(file);

        setProcessingStatus(prev => ({
          ...prev,
          [file.name]: { 
            status: 'completed', 
            progress: 100,
            transcription: transcription
          }
        }));

      } catch (error) {
        setProcessingStatus(prev => ({
          ...prev,
          [file.name]: { status: 'failed', progress: 100, error: error.message }
        }));
      }
    }
    
    setIsProcessing(false);
  };

  const handleProcessSingle = async (fileName) => {
    const file = files.find(f => f.name === fileName);
    if (!file) return;
    
    setProcessingSingleFile(fileName);
    
    try {
      setProcessingStatus(prev => ({
        ...prev,
        [fileName]: { status: 'processing', progress: 0 }
      }));

      // Actual API call
      const transcription = await processFileWithAPI(file);

      setProcessingStatus(prev => ({
        ...prev,
        [fileName]: { 
          status: 'completed', 
          progress: 100,
          transcription: transcription
        }
      }));

    } catch (error) {
      setProcessingStatus(prev => ({
        ...prev,
        [fileName]: { status: 'failed', progress: 100, error: error.message }
      }));
    } finally {
      setProcessingSingleFile(null);
    }
  };

  const handlePlayPause = (fileName) => {
    const audio = audioRefs.current[fileName];
    if (!audio) return;

    if (isPlaying[fileName]) {
      audio.pause();
    } else {
      audio.play();
    }
    
    setIsPlaying(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  };

  const handleTimeUpdate = (fileName, time) => {
    setCurrentTime(prev => ({
      ...prev,
      [fileName]: time
    }));
  };

  const handleVolumeChange = (fileName, newVolume) => {
    setVolume(prev => ({
      ...prev,
      [fileName]: newVolume
    }));
    
    const audio = audioRefs.current[fileName];
    if (audio) {
      audio.volume = newVolume;
    }
  };
  
  const handleTimeChange = (fileName, newTime) => {
    setCurrentTime(prev => ({
      ...prev,
      [fileName]: newTime
    }));
    
    const audio = audioRefs.current[fileName];
    if (audio) {
      audio.currentTime = newTime;
    }
  };

  const handleRemoveFile = (fileName) => {
    if (onFilesChange) {
      onFilesChange(prev => prev.filter(file => file.name !== fileName));
    }
    
    if (audioUrls[fileName]) {
      URL.revokeObjectURL(audioUrls[fileName]);
    }
    
    delete audioRefs.current[fileName];
    delete audioUrls[fileName];
    delete currentTime[fileName];
    delete isPlaying[fileName];
    delete volume[fileName];
    delete processingStatus[fileName];
  };

  const handleCopyTranscription = (fileName, transcription) => {
    navigator.clipboard.writeText(transcription).then(() => {
      setCopiedFiles(prev => ({
        ...prev,
        [fileName]: true
      }));
      
      // Reset copied state after 1.5 seconds
      setTimeout(() => {
        setCopiedFiles(prev => ({
          ...prev,
          [fileName]: false
        }));
      }, 1500);
    });
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  useEffect(() => {
    return () => {
      Object.values(audioUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  useEffect(() => {
    files.forEach(file => {
      if (!audioPlayers[file.name]) {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        
        audio.onloadedmetadata = () => {
          setAudioPlayers(prev => ({
            ...prev,
            [file.name]: {
              duration: audio.duration,
              url
            }
          }));
        };

        setAudioUrls(prev => ({ ...prev, [file.name]: url }));
        setCurrentTime(prev => ({ ...prev, [file.name]: 0 }));
        setIsPlaying(prev => ({ ...prev, [file.name]: false }));
        setVolume(prev => ({ ...prev, [file.name]: 1 }));
        
        // Initialize status if not already set
        if (!processingStatus[file.name]) {
          setProcessingStatus(prev => ({
            ...prev,
            [file.name]: { status: 'pending', progress: 0 }
          }));
        }
      }
    });
  }, [files]);

  return (
    <Box sx={{ maxWidth: '100vw', py: 4, }}>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac"
        onChange={handleFileChange}
      />

      <div style={{ maxWidth: '1000px', margin: '0 auto', marginBottom: '48px', borderRadius: '16px', border: '1px solid rgba(11, 17, 24, 0.1)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', padding: '24px 32px', background: 'transparent', backdropFilter: 'blur(12px)' }}>
        <Box sx={{ mb: 6 , }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#0B1118' }}>
              Bulk Audio Processing
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoProcess}
                    onChange={(e) => setAutoProcess(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto Process"
                sx={{ color: '#2d3748' }}
              />
              
              <Button
                variant="contained"
                onClick={handleProcessAll}
                disabled={isProcessing || files.length === 0}
                startIcon={<Description />}
                sx={{
                  backgroundColor: '#0B1118',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '10px 24px',
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
                  }
                }}
              >
                {isProcessing ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    Processing...
                  </Box>
                ) : (
                  'Transcribe All'
                )}
              </Button>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ my: 2, borderColor: 'rgba(11, 17, 24, 0.1)' , mt: 2}} />
        
        {files.length > 0 && (
          <>
            <Box sx={{ alignItems: 'center', width: '100%' , justifyContent: 'center'}}>
              <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    backgroundColor: 'transparent', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(74, 144, 226, 0.2)',
                    borderRadius: '12px',
                    width: '180px',
                    textAlign: 'center'
                  }}>
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                        {files.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', opacity: 0.8 }}>
                        Total Files
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    backgroundColor: 'transparent', 
                    backdropFilter: 'blur(8px)', 
                    border: '1px solid rgba(255, 193, 7, 0.2)',
                    borderRadius: '12px',
                    width: '180px',
                    textAlign: 'center'
                  }}>
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#23629aff', mb: 1 }}>
                        {categories.toBeProcessed.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', opacity: 0.8 }}>
                        To Be Processed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    backgroundColor: 'transparent', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    borderRadius: '12px',
                    width: '180px',
                    textAlign: 'center'
                  }}>
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                        {categories.processed.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', opacity: 0.8 }}>
                        Processed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    backgroundColor: 'transparent', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 152, 0, 0.2)',
                    borderRadius: '12px',
                    width: '180px',
                    textAlign: 'center'
                  }}>
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#ff9800', mb: 1 }}>
                       {categories.flagged.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', opacity: 0.8 }}>
                        Flagged
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    backgroundColor: 'transparent', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(244, 67, 54, 0.2)',
                    borderRadius: '12px',
                    width: '180px',
                    textAlign: 'center'
                  }}>
                    <CardContent>
                      <Typography variant="h3" sx={{ fontWeight: 700, color: '#c42c2cff', mb: 1 }}>
                        {categories.failed.length}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2d3748', opacity: 0.8 }}>
                        Failed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0B1118', mb: 3 }}>
                  Uploaded Audio Files ({files.length})
                </Typography>
                <IconButton
                  onClick={handleFolderUpload}
                  sx={{
                    color: '#2d3748',
                    '&:hover': {
                      backgroundColor: 'rgba(74, 144, 226, 0.1)',
                      borderRadius: '100%',
                    },
                  }}
                >
                  <FolderOpenIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ 
                maxHeight: '500px',
                overflow: 'auto'
              }}>
                {files.map((file, index) => {
                  const status = processingStatus[file.name];
                  const audioPlayer = audioPlayers[file.name];
                  const isProcessingThisFile = processingSingleFile === file.name;
                  const isCopied = copiedFiles[file.name] || false;
                  
                  return (
                    <Box 
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      sx={{ 
                        p: 3,
                        backgroundColor: status?.status === 'processing' ? 'rgba(74, 144, 226, 0.02)' : 'transparent',
                        mb: 2,
                        
                        borderRadius: '8px'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography sx={{ fontWeight: 600, color: '#0B1118' }}>
                              {file.name}
                            </Typography>
                            
                            {status && (
                              <Chip
                                icon={
                                  status.status === 'completed' ? <CheckCircleIcon /> :
                                  status.status === 'processing' ? <AccessTimeIcon /> :
                                  status.status === 'pending' ? <Description /> :
                                  status.status === 'flagged' ? <FlagIcon /> :
                                  <ErrorIcon />
                                }
                                label={status.status}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    status.status === 'completed' ? 'rgba(76, 175, 80, 0.1)' :
                                    status.status === 'processing' ? 'rgba(74, 144, 226, 0.1)' :
                                    status.status === 'pending' ? 'rgba(45, 55, 72, 0.1)' :
                                    status.status === 'flagged' ? 'rgba(255, 152, 0, 0.1)' :
                                    'rgba(244, 67, 54, 0.1)',
                                  color:
                                    status.status === 'completed' ? '#4caf50' :
                                    status.status === 'processing' ? '#4A90E2' :
                                    status.status === 'pending' ? '#2d3748' :
                                    status.status === 'flagged' ? '#ff9800' :
                                    '#f44336'
                                }}
                              />
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              {formatFileSize(file.size)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666', textTransform: 'uppercase' }}>
                              {file.type.split('/')[1] || 'audio'}
                            </Typography>
                            {audioPlayer?.duration && (
                              <Chip 
                                icon={<AccessTimeIcon />}
                                label={formatTime(audioPlayer.duration)}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  borderColor: 'rgba(74, 144, 226, 0.3)',
                                  color: '#2d3748'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        
                        <IconButton
                          onClick={() => handleRemoveFile(file.name)}
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
                      
                      {audioPlayer && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <IconButton
                              onClick={() => handlePlayPause(file.name)}
                              sx={{
                                backgroundColor: '#0B1118',
                                color: 'white',
                                width: 40,
                                height: 40,
                                '&:hover': { backgroundColor: '#1a2332' }
                              }}
                            >
                              {isPlaying[file.name] ? <Pause /> : <PlayArrow />}
                            </IconButton>
                            
                            <audio
                              ref={el => audioRefs.current[file.name] = el}
                              src={audioUrls[file.name]}
                              onTimeUpdate={(e) => handleTimeUpdate(file.name, e.target.currentTime)}
                              onEnded={() => setIsPlaying(prev => ({ ...prev, [file.name]: false }))}
                              style={{ display: 'none' }}
                            />
                            
                            <Box sx={{ flexGrow: 1 }}>
                              <input
                                type="range"
                                min="0"
                                max={audioPlayer.duration || 100}
                                value={currentTime[file.name] || 0}
                                onChange={(e) => {
                                  const time = parseFloat(e.target.value);
                                  handleTimeUpdate(file.name, time);
                                  if (audioRefs.current[file.name]) {
                                    audioRefs.current[file.name].currentTime = time;
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  height: '4px',
                                  borderRadius: '2px',
                                  background: `linear-gradient(to right, #0B1118 ${((currentTime[file.name] || 0) / audioPlayer.duration) * 100}%, #e5e7eb ${((currentTime[file.name] || 0) / audioPlayer.duration) * 100}%)`,
                                  WebkitAppearance: 'none'
                                }}
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                              <VolumeUp sx={{ color: '#0B1118', fontSize: 20 }} />
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume[file.name] || 1}
                                onChange={(e) => handleVolumeChange(file.name, parseFloat(e.target.value))}
                                style={{
                                  width: '100%',
                                  height: '4px',
                                  borderRadius: '2px',
                                  background: `linear-gradient(to right, #0B1118 ${(volume[file.name] || 1) * 100}%, #e5e7eb ${(volume[file.name] || 1) * 100}%)`,
                                  WebkitAppearance: 'none'
                                }}
                              />
                            </Box>
                            
                            <Typography variant="caption" sx={{ color: '#666', minWidth: 80 }}>
                              {formatTime(currentTime[file.name] || 0)} / {formatTime(audioPlayer.duration)}
                            </Typography>
                            
                            {(!status || status.status === 'pending' || status.status === 'failed') && (
                              <IconButton
                                onClick={() => handleProcessSingle(file.name)}
                                disabled={isProcessingThisFile}
                                sx={{
                                  color: '#0B1118',
                                  fontSize: '0.875rem',
                                  '&:hover': {
                                    backgroundColor: '#dfe9faff',
                                    transform: 'translateY(-2px)',
                                  },
                                  '&:disabled': {
                                    backgroundColor: '#394254ff'
                                  },
                                  transition: 'all 0.3s ease',
                                  ml: 2
                                }}
                              >
                                {isProcessingThisFile ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 16, height: 16 }}>
                                      <CircularProgress size={16} color="inherit" />
                                    </Box>
                                  </Box>
                                ) : (
                                  <Description />
                                )}
                              </IconButton>
                            )}
                          </Box>
                          
                          {status?.status === 'processing' && (
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={status.progress || 0}
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3,
                                  backgroundColor: 'rgba(11, 17, 24, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#0B1118'
                                  }
                                }}
                              />
                              <Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
                                Processing... {status.progress || 0}%
                              </Typography>
                            </Box>
                          )}
                          
                          {status?.transcription && (
                            <Box sx={{ mt: 3 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 2 
                              }}>
                                <Typography variant="subtitle2" sx={{ 
                                  fontWeight: 600, 
                                  color: '#0B1118',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}>
                                  <RecordVoiceOver sx={{ fontSize: 20 }} />
                                  Transcription:
                                </Typography>
                                
                                <Tooltip title={isCopied ? "Copied!" : "Copy to clipboard"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyTranscription(file.name, status.transcription)}
                                    sx={{
                                      color: isCopied ? '#4caf50' : '#4A90E2',
                                      borderRadius: '100%',
                                      p: 1,
                                      '&:hover': {
                                        backgroundColor: isCopied
                                          ? 'rgba(76, 175, 80, 0.12)'
                                          : 'rgba(74, 144, 226, 0.08)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    {isCopied ? (
                                      <CheckCircleOutline fontSize="small" />
                                    ) : (
                                      <ContentCopy fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                              
                              <Paper 
                                elevation={0}
                                sx={{ 
                                  p: 2.5,
                                  background: "transparent",
                                  backdropFilter: 'blur(8px)',
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
                                  {status.transcription}
                                </Typography>
                              </Paper>
                            </Box>
                          )}
                          
                          {status?.error && (
                            <Typography variant="caption" sx={{ color: '#f44336', mt: 1, display: 'block' }}>
                              Error: {status.error}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </>
        )}
        
        {files.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 8,
            textAlign: 'center'
          }}>
            <FolderIcon sx={{ fontSize: 64, color: 'rgba(11, 17, 24, 0.2)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#2d3748', mb: 1, fontWeight: 600 }}>
              No Audio Files Uploaded
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 3, maxWidth: '400px' }}>
              Upload audio files to get started with bulk transcription. Supported formats: WAV, MP3, M4A, OGG, FLAC
            </Typography>
            <Button
              variant="contained"
              onClick={handleFolderUpload}
              startIcon={<CloudUploadIcon />}
              sx={{
                backgroundColor: '#0B1118',
                color: 'white',
                borderRadius: '12px',
                padding: '10px 24px',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#2d3748',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(11, 17, 24, 0.2)'
                }
              }}
            >
              Upload Audio Files
            </Button>
          </Box>
        )}
      </div>
    </Box>
  );
}

export default BulkProcessing;