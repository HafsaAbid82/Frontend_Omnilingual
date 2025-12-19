import { useState } from "react";
import { 
  ArrowDropDown as ArrowDropDownIcon,
  CloudUpload as CloudUploadIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Menu,
  MenuItem,
  Grid
} from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import "./Home.css";

function Home() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingType, setProcessingType] = useState('Single Processing');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
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
    });
    setResults(null);
    setError(null);
    setSelectedCard(0); // Auto-select upload audio card when files are added
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
      setSelectedCard(2); // Show translation card when results are ready
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

  const handleProcessingTypeSelect = (type) => {
    setProcessingType(type);
    setAnchorEl(null);
  };

  const handleCardClick = (index) => {
    setSelectedCard(index);
    if (index === 1) {
      // Real-time transcription simulation
      setIsRecording(!isRecording);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const featureCards = [
    {
      title: "Upload Audio",
      description: "Upload and transcribe audio files in multiple formats",
      icon: <CloudUploadIcon sx={{ fontSize: 48, color: '#2d3748' }} />,
      color: "rgba(74, 144, 226, 0.1)"
    },
    {
      title: "Real-time Transcription",
      description: "Live speech recognition with instant transcription",
      icon: <RecordVoiceOverIcon sx={{ fontSize: 48, color: '#2d3748' }} />,
      color: "rgba(255, 107, 107, 0.1)"
    },
    {
      title: "Multi-language Translation",
      description: "Translate transcriptions into multiple languages",
      icon: <LanguageIcon sx={{ fontSize: 48, color: '#2d3748' }} />,
      color: "rgba(76, 175, 80, 0.1)"
    }
  ];

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

      <Box className="home-container">
        {/* Header */}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button
              variant="outlined"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleProcessingMenuOpen}
              sx={{
                borderColor: 'rgba(74, 144, 226, 0.3)',
                color: '#1a2332',
                backgroundColor: '#FAF5EB',
                borderRadius: '10px',
                padding: '10px 24px',
                fontWeight: 500,
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
                  backgroundColor: '#1a2332',
                }
              }}
            >
              <MenuItem 
                onClick={() => handleProcessingTypeSelect('Single Processing')}
                sx={{ 
                  padding: '12px 16px',
                  color: processingType === 'Single Processing' ? '#adb5c4ff' : '#FAF5EB',
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
                  color: processingType === 'Bulk Processing' ? '#adb5c4ff' : '#FAF5EB',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <FolderIcon />
                Bulk Processing
              </MenuItem>
            </Menu>
          </Box>

        {/* Feature Cards */}
        <Box sx={{ mb: 6,  px: 2 }}>
          <Grid container spacing={3} sx={{justifyContent: 'center', alignItems: 'center', mt: 8}}>
            {featureCards.map((card, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  className={`feature-card ${selectedCard === index ? 'selected' : ''}`}
                  onClick={() => handleCardClick(index)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    height: '100%',
                    backgroundColor: selectedCard === index ? card.color : '#FAF5EB',
                    border: selectedCard === index ? '2px solid #4A90E2' : '1px solid rgba(11, 17, 24, 0.1)',
                    borderRadius: '16px',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      {card.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#0B1118' }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.5 }}>
                      {card.description}
                    </Typography>
                    {index === 1 && isRecording && (
                      <Box sx={{ mt: 2 }}>
                        <Box className="recording-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#FF6B6B', fontWeight: 500 }}>
                          Recording...
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        </Box>
    </>
  );
}

export default Home;