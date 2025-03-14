import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 3 : 5,
          width: '100%',
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to ChatApp
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Connect with friends, share media, and make voice calls
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            sx={{ py: 1.5 }}
          >
            Sign in with Google
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login; 