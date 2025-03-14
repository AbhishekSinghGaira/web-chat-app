import React from 'react';
import { Box, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        p: 3,
        textAlign: 'center'
      }}
    >
      {isMobile ? (
        // Mobile view - show instructions to select a chat
        <Box>
          <Typography variant="h5" gutterBottom>
            Welcome to ChatApp
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Select a chat from the sidebar or start a new conversation
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/find-users')}
              fullWidth
            >
              Find Users
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/create-group')}
              fullWidth
            >
              Create Group
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/profile')}
              fullWidth
            >
              View Profile
            </Button>
          </Box>
        </Box>
      ) : (
        // Desktop view - show welcome message
        <Box sx={{ maxWidth: 600 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to ChatApp
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Connect with friends, share media, and make voice calls
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Select a chat from the sidebar to start messaging or use the buttons below to find new friends or create a group.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/find-users')}
            >
              Find Users
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/create-group')}
            >
              Create Group
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/profile')}
            >
              View Profile
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Home; 