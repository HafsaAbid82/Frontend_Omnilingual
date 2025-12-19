import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import NotesIcon from '@mui/icons-material/Notes';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Divider from '@mui/material/Divider';
import EmailIcon from '@mui/icons-material/Email';
import Logo from '../assets/logo.png';
import './Navbar.css';

function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuId = 'primary-search-account-menu';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      sx={{
        '& .MuiPaper-root': {
          backgroundColor: '#1a2332',
          color: '#FAF5EB',
          borderRadius: '12px',
          marginTop: '12px',
          minWidth: '220px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          padding: '4px 0',
        }
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: '#FAF5EB',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '8px 16px 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        Services
      </Typography>
      
      <MenuItem 
        onClick={handleMenuClose}
        sx={{
          padding: '12px 16px',
          gap: '12px',
          '&:hover': {
            backgroundColor: '#0B1118',
            color: '#FAF5EB'
          }
        }}
      >
        <TranslateIcon fontSize="small" />
        <Box sx={{ flexGrow: 1 }}>Translation</Box>
      </MenuItem>
      
      <MenuItem 
        onClick={handleMenuClose}
        sx={{
          padding: '12px 16px',
          gap: '12px',
          '&:hover': {
            backgroundColor: '#0B1118',
            color: '#FAF5EB'
          }
        }}
      >
        <NotesIcon fontSize="small" />
        <Box sx={{ flexGrow: 1 }}>Transcription</Box>
      </MenuItem>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
      
      <Typography
        variant="subtitle2"
        sx={{
          color: '#FAF5EB',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '8px 16px 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        Account
      </Typography>
      
      <MenuItem 
        onClick={handleMenuClose}
        sx={{
          padding: '12px 16px',
          gap: '12px',
          '&:hover': {
            backgroundColor: '#0B1118',
            color: '#FAF5EB'
          }
        }}
      >
        <AccountCircleIcon fontSize="small" />
        <Box sx={{ flexGrow: 1 }}>Profile</Box>
      </MenuItem>
      
      <MenuItem 
        onClick={handleMenuClose}
        sx={{
          padding: '12px 16px',
          gap: '12px',
          '&:hover': {
            backgroundColor: '#0B1118',
            color: '#FAF5EB'
          }
        }}
      >
        <DashboardIcon fontSize="small" />
        <Box sx={{ flexGrow: 1 }}>Dashboard</Box>
      </MenuItem>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
      
      <MenuItem 
        onClick={handleMenuClose}
        sx={{
          padding: '12px 16px',
          gap: '12px',
          color: '#FF6B6B',
          '&:hover': {
            backgroundColor: 'rgba(255,107,107,0.1)',
            color: '#FF5252'
          }
        }}
      >
        <ExitToAppIcon fontSize="small" />
        <Box sx={{ flexGrow: 1 }}>Logout</Box>
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <Box sx={{ flexGrow: 1, mt: 0, width: '100vw', zIndex: 2 }}>
        <AppBar 
          position="relative" 
          sx={{ 
            backgroundColor: '#FAF5EB',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            py: 1,
            borderBottom: '1px solid rgba(11, 17, 24, 0.1)',
            mt: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: "100%",
            position: 'relative',
            zIndex: 2
          }}
        >
          <Toolbar 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              maxWidth: '1680px', // Increased to larger standard size
              margin: '0 auto',
              width: '100%',
              minHeight: '80px',
              px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 } // Increased padding for larger width
            }}
          >
            {/* Left side: Logo and Brand Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                size="medium" 
                edge="start" 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  p: 0,
                  '&:hover': { 
                    backgroundColor: 'transparent',
                    '& img': {
                      transform: 'scale(1.1)'
                    }
                  }
                }} 
                disableRipple
              >
                <img src={Logo} alt="Logo" className="logo" />
              </IconButton>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    color: '#0B1118',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    lineHeight: 1,
                    fontSize: { xs: '1.25rem', md: '1.5rem', lg: '1.75rem' } // Slightly larger for wider navbar
                  }}
                >
                  Omnilingual
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Typography
                    variant="caption"
                    component="span"
                    sx={{
                      color: '#2d3748',
                      fontSize: '0.85rem', // Slightly larger
                      fontWeight: 400,
                      letterSpacing: '0.5px',
                      lineHeight: 1.2
                    }}
                  >
                    (Meta)
                  </Typography>
                  <Typography
                    variant="caption"
                    component="span"
                    sx={{
                      color: '#2d3748',
                      fontSize: '0.85rem', // Slightly larger
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                      lineHeight: 1.2
                    }}
                  >
                    Translate & Transcribe
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right side: User Info and Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* User Info with Email */}
              <Box sx={{ 
                display: { xs: 'none', sm: 'flex' }, 
                flexDirection: 'column', 
                alignItems: 'flex-end',
                gap: 0.5 
              }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#0B1118',
                    fontWeight: 600,
                    fontSize: '1rem', // Slightly larger
                    lineHeight: 1.2
                  }}
                >
                  John Doe
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: '0.85rem', color: '#666' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#2d3748',
                      fontSize: '0.85rem',
                      fontWeight: 400,
                      lineHeight: 1.2
                    }}
                  >
                    johndoe@gmail.com
                  </Typography>
                </Box>
              </Box>

              {/* User Profile with Notification Badge */}
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 12,
                    height: 12,
                    backgroundColor: '#2d3748',
                    borderRadius: '50%',
                    border: '2px solid #FAF5EB',
                    zIndex: 1
                  }}
                />
                <IconButton
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  sx={{
                    color: '#0B1118',
                    backgroundColor: 'rgba(11, 17, 24, 0.03)',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(11, 17, 24, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'rgba(11, 17, 24, 0.06)',
                      borderColor: 'rgba(11, 17, 24, 0.2)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <PersonOutlineOutlinedIcon />
                </IconButton>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        {renderMenu}
      </Box>
    </>
  );
}

export default Navbar;