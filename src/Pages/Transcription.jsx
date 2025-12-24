import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  IconButton,
  LinearProgress,
  Divider,
  Paper,
  Tooltip,
  Card,
  CardContent,
  Chip,
  Grid,
  Collapse,
  Avatar,
  Badge
} from '@mui/material';
import { 
  ArrowBack,
  Description, 
  PlayArrow, 
  Pause, 
  VolumeUp, 
  Delete as DeleteIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  CloudUpload as CloudUploadIcon,
  AccessTime,
  CheckCircleOutline,
  ExpandMore,
  ExpandLess,
  Folder,
  Audiotrack
} from '@mui/icons-material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CircularProgress from '@mui/material/CircularProgress';
import './Home.css';

function Transcription() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null); 
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState(null);
  const [expandedFile, setExpandedFile] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [transcriptionText, setTranscriptionText] = useState('');

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    results: initialResults = {},
    files: initialFiles = [],
    selectedFile: initialSelectedFile = null,
    isBulk = false
  } = location.state || {};

  useEffect(() => {
    if (initialResults) {
      setResults(initialResults);
      if (!isBulk && initialResults) extractTranscriptionText(initialResults);
    }
    if (initialSelectedFile) setSelectedFile(initialSelectedFile);
    if (initialFiles.length) setFiles(initialFiles);
  }, [initialResults, initialSelectedFile, initialFiles]);

  useEffect(() => {
    if (files.length > 0 && !isBulk) {
      const file = files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      const audio = new Audio();
      audio.src = url;
      audio.onloadedmetadata = () => setAudioDuration(audio.duration);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [files, isBulk]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []).filter(f => 
      f.type.startsWith('audio/') || 
      ['.wav','.mp3','.m4a','.ogg','.flac'].some(ext => f.name.toLowerCase().endsWith(ext))
    );
    if (selected.length) {
      setFiles([selected[0]]);
      setResults(null);
      setError(null);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (e) => {
    if (!audioRef.current) return;
    const t = parseFloat(e.target.value);
    audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append('files', selectedFile);
    
    try {
      const res = await fetch('https://hafsaabd82-omnilingual-asr.hf.space/api/predict', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!res.ok) throw new Error('Backend error');
      
      const data = await res.json();
      setResults(data.results || {});
      if (!isBulk) extractTranscriptionText(data.results);
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  function extractTranscriptionText(res) {
    if (!res) {
      setTranscriptionText('');
      return '';
    }
    if (typeof res === 'string') {
      setTranscriptionText(res);
      return res;
    }
    if (res.transcription) {
      setTranscriptionText(res.transcription);
      return res.transcription;
    }
    if (res.text) {
      setTranscriptionText(res.text);
      return res.text;
    }
    if (res.segments && Array.isArray(res.segments)) {
      const text = res.segments.map(s => s.text).join(' ');
      setTranscriptionText(text);
      return text;
    }
    const firstKey = Object.keys(res || {})[0];
    if (firstKey) {
      const first = res[firstKey];
      if (typeof first === 'string') {
        setTranscriptionText(first);
        return first;
      }
      if (first.transcription) {
        setTranscriptionText(first.transcription);
        return first.transcription;
      }
      if (first.text) {
        setTranscriptionText(first.text);
        return first.text;
      }
      setTranscriptionText(JSON.stringify(first));
      return JSON.stringify(first);
    }
    setTranscriptionText('');
    return '';
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRemoveFile = () => {
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
    setResults(null);
  };

  const handleCopyTranscription = (fileName, transcription) => {
    const text = typeof transcription === 'string' 
      ? transcription 
      : JSON.stringify(transcription, null, 2);
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 1500);
    });
  };

  const toggleExpandFile = (fileName) => {
    setExpandedFile(expandedFile === fileName ? null : fileName);
  };
 const getWordCount = () => transcriptionText ? transcriptionText.trim().split(/\s+/).length : 0;
  return (
    <>
      <div className="floating-background">
        <div className="floating-circle" />
      </div>

      <Box className="home-container">
        {/* Header */}
        <Box className="home-header">
          <Typography variant="h1" className="home-title">
            Audio Transcription
          </Typography>
          <Typography sx={{
            color: 'var(--color-tertiary)',
            fontSize: '1rem',
            fontWeight: 400,
            letterSpacing: '0.5px',
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto 40px auto'
          }}>
            {isBulk ? 'Bulk Transcription Results' : 'Single Audio Transcription'}
          </Typography>
        </Box>

         {!isBulk && (
                    <div style={{ 
                    maxWidth: '1000px', 
                    margin: '0 auto', 
                    marginBottom: '48px', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(11, 17, 24, 0.1)', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'blur(12px)',
                    background: 'transparent'
                  }}> 
                  <Box sx={{ maxWidth: '1000px', margin: '0 auto', mb: 6 }}>
                    {/* File selector block removed per latest request */}
                    {/* Transcription Results Section - Only show when results exist */}
                    {transcriptionText && (
                      <Paper sx={{ 
                        borderRadius: '16px', 
                        border: '1px solid rgba(11, 17, 24, 0.1)', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(12px)',
                        background: 'transparent'
                      }}> 
                        <CardContent sx={{ p: 4 }}>
                          {/* Header: simplified to match bulk theme (no status indicators) */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Description sx={{ color: 'var(--color-tertiary)', fontSize: 22 }} />
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--color-primary)' }}>Transcription Result</Typography>
                            </Box>
        
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                              <Tooltip title={copied ? 'Copied!' : 'Copy transcription'}>
                                <IconButton onClick={handleCopyTranscription} sx={{ padding: '8px', color: copied ? 'var(--color-tertiary)' : 'var(--color-primary)', '&:hover': { backgroundColor: 'rgba(11, 17, 24, 0.05)' } }}>
                                  {copied ? <CheckCircleOutline /> : <ContentCopyIcon />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
        
                          <Divider sx={{ mb: 3, borderColor: 'rgba(11, 17, 24, 0.08)', borderWidth: '1px' }} />
        
                          {/* Transcription Content: keeps segments or plain text, styled to match bulk */}
                          <Box sx={{ backgroundColor: 'transparent', borderRadius: '10px', border: '1px solid rgba(11, 17, 24, 0.06)', p: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, mt: 0.5 }}>
                                    <Description sx={{ fontSize: 16, color: 'var(--color-tertiary)', ml: 1, mt: 0.25}} />
                                    {selectedFile?.name || (results && Object.keys(results || {})[0]) || 'Audio'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#666', ml: 2}}>Transcription Text</Typography>
                                </Box>
                                <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ color: 'var(--color-primary)', borderRadius: '6px', padding: 0.5, mr:1, '&:hover': { backgroundColor: 'rgba(11, 17, 24, 0.04)' }, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                                  <ExpandMore />
                                </IconButton>
                              </Box>
        
                              <Collapse in={expanded}>
                                <Paper elevation={0} sx={{ p: 3, background: 'transparent', borderRadius: '8px', border: '1px solid rgba(11, 17, 24, 0.05)', maxHeight: '400px', overflow: 'auto' }}>
                                {results?.segments ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    {results.segments.map((segment, index) => (
                                      <Box key={index} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                          <Chip label={formatTime(segment.start)} size="small" sx={{ backgroundColor: 'rgba(74, 144, 226, 0.1)', color: '#4a90e2', fontWeight: 500, fontSize: '0.75rem', height: 24 }} />
                                          <Typography variant="caption" sx={{ color: '#666' }}>Duration: {formatTime(segment.end - segment.start)}</Typography>
                                        </Box>
                                        <Typography sx={{ lineHeight: 1.7, color: 'var(--color-tertiary)', fontSize: '0.95rem', pl: 2, borderLeft: '2px solid rgba(74, 144, 226, 0.2)' }}>{segment.text}</Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography sx={{ color: 'var(--color-tertiary)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{transcriptionText}</Typography>
                                )}
                              </Paper>
                            </Collapse>
                          </Box>
        
                          {/* Footer: simple stats to match bulk spacing */}
                          
                        </CardContent>
                      </Paper>
                    )}
                  </Box>
                </div>
                )}

        {/* Bulk Results Section - Refined */}
{isBulk && results && Object.keys(results).length > 0 && (
  <div style={{ 
    maxWidth: '1000px', 
    margin: '0 auto', 
    marginBottom: '48px', 
    borderRadius: '16px', 
    border: '1px solid rgba(11, 17, 24, 0.1)', 
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(12px)',
    background: 'transparent'
  }}> 
    <CardContent>
      {/* Results Header - Enhanced */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between',
        mb: 4,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 0.5
          }}>
            <RecordVoiceOverIcon sx={{ 
              color: 'var(--color-tertiary)',
              fontSize: 22 
            }} />
            Bulk Transcription Results
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flexWrap: 'wrap'
          }}>
            <Chip
              label={`${Object.keys(results).length} files`}
              size="small"
              sx={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(11, 17, 24, 0.1)',
                color: 'var(--color-primary)',
                height: 24,
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            />
            <Typography variant="body2" sx={{ 
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              <CheckCircleOutline sx={{ fontSize: 16, color: 'var(--color-primary)' }} />
              All processed successfully
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5,
          alignItems: 'center'
        }}>
          <Tooltip title="Copy all results to clipboard">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const allText = Object.entries(results)
                  .map(([fileName, transcription]) => 
                    `${fileName}:\n${typeof transcription === 'string' ? transcription : JSON.stringify(transcription, null, 2)}`
                  )
                  .join('\n\n');
                navigator.clipboard.writeText(allText).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              startIcon={copied ? <CheckCircleOutline /> : <ContentCopyIcon />}
              sx={{
                borderColor: 'var(--color-primary)',
                color: copied ? 'var(--color-tertiary)' : 'var(--color-primary)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.875rem',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  borderColor: copied ? 'var(--color-tertiary)' : 'var(--color-primary)',
                  backgroundColor: copied ? 'rgba(76, 175, 80, 0.04)' : 'rgba(74, 144, 226, 0.04)',
                }
              }}
            >
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </Tooltip>
        </Box>
      </Box>
      
      <Divider sx={{ 
        my: 3, 
        borderColor: 'rgba(11, 17, 24, 0.08)',
        borderWidth: '1px'
      }} />

      {/* File Results List - Enhanced */}
      <Box sx={{ 
        backgroundColor: 'transparent',
        borderRadius: '12px',
      }}>
        <Typography variant="subtitle2" sx={{ 
          fontWeight: 600, 
          color: 'var(--color-primary)',
          mb: 3,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Individual Files ({Object.keys(results).length})
        </Typography>

        {Object.entries(results).map(([fileName, transcription], index) => {
          const isExpanded = expandedFile === fileName;
          const isFileCopied = copiedFile === fileName;
          const transcriptionText = typeof transcription === 'string' ? transcription : JSON.stringify(transcription, null, 2);
          
          return (
            <Paper 
              key={fileName}
              elevation={0}
              sx={{ 
                mb: 2.5,
                background: "transparent",
                borderRadius: '10px',
                border: '1px solid rgba(11, 17, 24, 0.06)',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: 'rgba(74, 144, 226, 0.2)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {/* File Header - Cleaner */}
              <Box 
                sx={{ 
                  p: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? 'rgba(11, 17, 24, 0.02)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(11, 17, 24, 0.015)'
                  }
                }}
                onClick={() => toggleExpandFile(fileName)}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  flex: 1,
                  minWidth: 0,
                }}>
                      <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>
                      {index + 1}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      mb: 0.5,
                      flexWrap: 'wrap'
                    }}>
                      <Typography sx={{ 
                        fontWeight: 600, 
                        color: 'var(--color-primary)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mt: 1
                      }}>
                        {fileName}
                      </Typography>
                      
                      <Chip
                        label="Completed"
                        size="small"
                        sx={{
                          backgroundColor: 'transparent',
                          color: '#0B1118',
                          fontSize: '0.6875rem',
                          height: 20,
                          fontWeight: 500,
                          border: '1px solid rgba(76, 175, 80, 0.2)', 
                          mt: 1
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1.5,
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25
                      }}>
                        <AccessTime sx={{ fontSize: 12 }} />
                        {transcriptionText.length > 200 ? 'Long' : 'Short'} text
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25
                      }}>
                        •
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.75rem'
                      }}>
                        {transcriptionText.length} characters
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  flexShrink: 0,
                  ml: 1
                }}>
                  <Tooltip title={isFileCopied ? "Copied!" : "Copy transcription"}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyTranscription(fileName, transcription);
                      }}
                      sx={{
                        color: isFileCopied ? '#2d3748' : '#0B1118',
                        borderRadius: '6px',
                        padding: 0.5,
                        backgroundColor: isFileCopied ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                        '&:hover': {
                          backgroundColor: isFileCopied
                            ? 'rgba(76, 175, 80, 0.12)'
                            : 'rgba(74, 144, 226, 0.08)',
                        },
                      }}
                    >
                      {isFileCopied ? (
                        <CheckCircleOutline sx={{ fontSize: 18 }} />
                      ) : (
                        <ContentCopyIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpandFile(fileName);
                    }}
                    sx={{
                      color: '#0B1118',
                      borderRadius: '6px',
                      padding: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(11, 17, 24, 0.04)',
                      },
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <ExpandMore />
                  </IconButton>
                </Box>
              </Box>
              
              {/* Transcription Content - Refined */}
              <Collapse in={isExpanded}>
                <Box sx={{ 
                  p: 0,
                  borderTop: '1px solid rgba(11, 17, 24, 0.04)'
                }}>
                  <Box sx={{ 
                    p: 2.5,
                    backgroundColor: 'rgba(11, 17, 24, 0.01)',
                    borderTop: '1px solid rgba(11, 17, 24, 0.02)'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: '#0B1118',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mt: 1
                      }}>
                        <Description sx={{ fontSize: 16, color: '#2d3748', ml: 1 }} />
                        Transcription Content
                      </Typography>
                    </Box>
                    
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 3,
                        background: "transparent",
                        borderRadius: '8px',
                        border: '1px solid rgba(11, 17, 24, 0.05)',
                        mt: 1,
                        maxHeight: '320px',
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                          width: '6px'
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(11, 17, 24, 0.02)',
                          borderRadius: '3px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(11, 17, 24, 0.1)',
                          borderRadius: '3px',
                          '&:hover': {
                            background: 'rgba(11, 17, 24, 0.15)'
                          }
                        }
                      }}
                    >
                      <Typography sx={{ 
                        color: 'var(--color-tertiary)',
                        lineHeight: 1.7,
                        fontSize: '0.9375rem',
                        whiteSpace: 'pre-wrap',
                        fontFamily: '"SF Mono", "Roboto Mono", Consolas, monospace',
                        letterSpacing: '0.01em'
                      }}>
                        {transcriptionText}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Box>
      
      {/* Footer - Subtle */}
      <Box sx={{ 
        mt: 4, 
        pt: 4, 
        borderTop: '1px solid rgba(11, 17, 24, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
          <CheckCircleOutline sx={{ 
            fontSize: 18, 
            color: '#0B1118',
            mt: 2
          }} />
          <Typography variant="body2" sx={{ 
            color: '#666',
            fontSize: '0.875rem',
            mt: 2
          }}>
            All {Object.keys(results).length} files processed successfully
          </Typography>
        </Box>
        
      </Box>
    </CardContent>
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

export default Transcription;