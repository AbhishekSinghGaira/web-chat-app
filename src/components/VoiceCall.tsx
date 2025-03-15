import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Paper,
  useTheme
} from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

interface VoiceCallProps {
  open: boolean;
  onClose: () => void;
  recipientName: string;
  recipientPhoto: string;
  isGroup?: boolean;
}

const VoiceCall: React.FC<VoiceCallProps> = ({
  open,
  onClose,
  recipientName,
  recipientPhoto,
  isGroup = false
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();

  // Simulate call connection
  useEffect(() => {
    if (open) {
      // Simulate connection delay
      const timer = setTimeout(() => {
        setCallStatus('connected');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [open]);

  // Call timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
      setCallDuration(0);
      setCallStatus('connecting');
    }, 500);
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleEndCall}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={recipientPhoto} 
            sx={{ 
              width: 100, 
              height: 100,
              border: '3px solid',
              borderColor: callStatus === 'connected' ? 'success.main' : 'grey.400',
              boxShadow: 3
            }}
          />
          
          <Typography variant="h6" fontWeight="bold">
            {recipientName}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {isGroup ? 'Group Voice Call' : 'Voice Call'}
          </Typography>
          
          {callStatus === 'connecting' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Connecting...
              </Typography>
            </Box>
          )}
          
          {callStatus === 'connected' && (
            <Typography variant="body2" color="success.main">
              Connected • {formatCallDuration(callDuration)}
            </Typography>
          )}
          
          {callStatus === 'ended' && (
            <Typography variant="body2" color="error">
              Call ended
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Paper 
              elevation={3} 
              sx={{ 
                borderRadius: '50%', 
                backgroundColor: isMuted ? 'error.main' : 'primary.main',
                color: 'white',
                transition: 'all 0.2s'
              }}
            >
              <IconButton 
                color="inherit" 
                onClick={() => setIsMuted(!isMuted)}
                disabled={callStatus !== 'connected'}
              >
                {isMuted ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Paper>
            
            <Paper 
              elevation={3} 
              sx={{ 
                borderRadius: '50%', 
                backgroundColor: 'error.main',
                color: 'white',
                transition: 'all 0.2s'
              }}
            >
              <IconButton 
                color="inherit" 
                onClick={handleEndCall}
              >
                <CallEndIcon />
              </IconButton>
            </Paper>
            
            <Paper 
              elevation={3} 
              sx={{ 
                borderRadius: '50%', 
                backgroundColor: isSpeakerOn ? 'primary.main' : 'grey.500',
                color: 'white',
                transition: 'all 0.2s'
              }}
            >
              <IconButton 
                color="inherit" 
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                disabled={callStatus !== 'connected'}
              >
                {isSpeakerOn ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCall; 