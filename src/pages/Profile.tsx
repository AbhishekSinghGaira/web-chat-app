import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB limit for avatars

const Profile: React.FC = () => {
  const { currentUser, updateUsername, checkUsernameAvailability, updateProfilePicture } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);
          setUsername(userData.username || '');
          setAvatarPreview(userData.photoURL || null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, navigate]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setIsAvailable(null);
    setError('');
  };

  const handleCheckAvailability = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username === userProfile?.username) {
      setIsAvailable(null);
      setError('This is your current username');
      return;
    }

    setChecking(true);
    setError('');
    
    try {
      const available = await checkUsernameAvailability(username);
      setIsAvailable(available);
      
      if (!available) {
        setError('Username is already taken');
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      setError('Failed to check username availability');
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username === userProfile?.username) {
      setError('This is your current username');
      return;
    }

    if (isAvailable !== true) {
      setError('Please check username availability first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const updated = await updateUsername(username);
      
      if (updated) {
        setSuccess('Username updated successfully');
        // Update local state
        setUserProfile({
          ...userProfile,
          username
        });
      } else {
        setError('Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setError('Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError(`Image size exceeds the 2MB limit. Your image is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file');
      return;
    }
    
    setAvatarError('');
    setAvatarLoading(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Convert to base64 for storage
      const base64Data = await convertImageToBase64(file);
      
      // Update profile picture
      const updated = await updateProfilePicture(base64Data);
      
      if (updated) {
        setSuccess('Profile picture updated successfully');
        // Update local state
        setUserProfile({
          ...userProfile,
          photoURL: base64Data
        });
      } else {
        setAvatarError('Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      setAvatarError('Failed to update profile picture');
    } finally {
      setAvatarLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading && !userProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <IconButton edge="start" onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Profile</Typography>
      </Box>
      
      {/* Profile Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        <Paper elevation={2} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          {/* Profile Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                    onClick={handleAvatarClick}
                    disabled={avatarLoading}
                  >
                    {avatarLoading ? <CircularProgress size={24} color="inherit" /> : <AddAPhotoIcon />}
                  </IconButton>
                }
              >
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 100, height: 100, mr: 3 }}
                />
              </Badge>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </Box>
            <Box sx={{ ml: 3 }}>
              <Typography variant="h5">
                {currentUser?.displayName || 'User'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentUser?.email}
              </Typography>
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                @{userProfile?.username || 'username'}
              </Typography>
            </Box>
          </Box>
          
          {avatarError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {avatarError}
            </Alert>
          )}
          
          <Divider sx={{ my: 3 }} />
          
          {/* Username Update */}
          <Typography variant="h6" gutterBottom>
            Update Username
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your username is unique and is used by others to find you.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter new username"
              error={!!error}
              helperText={error}
              sx={{ mr: 2 }}
              disabled={loading}
            />
            <Button
              variant="outlined"
              onClick={handleCheckAvailability}
              disabled={checking || loading || !username.trim() || username === userProfile?.username}
            >
              {checking ? <CircularProgress size={24} /> : 'Check'}
            </Button>
          </Box>
          
          {isAvailable === true && (
            <Typography color="success.main" sx={{ mb: 2 }}>
              Username is available!
            </Typography>
          )}
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleUpdateUsername}
            disabled={loading || isAvailable !== true}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Username'}
          </Button>
        </Paper>
      </Box>
      
      {/* Success Notification */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile; 