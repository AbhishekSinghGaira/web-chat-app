import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  InputAdornment,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  username: string;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit for group images

const CreateGroup: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);
  const [groupImageBase64, setGroupImageBase64] = useState<string | null>(null);

  // Load recent contacts
  useEffect(() => {
    if (!currentUser) return;
    
    const loadRecentContacts = async () => {
      try {
        setLoading(true);
        
        // Get user's chats
        const userChatsRef = collection(db, 'users', currentUser.uid, 'chats');
        const q = query(userChatsRef, where('isGroup', '==', false));
        const querySnapshot = await getDocs(q);
        
        const chatPromises = querySnapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          const chatId = chatDoc.id;
          
          // Get the chat document to find the other user's ID
          const chatRef = doc(db, 'chats', chatId);
          const chatSnapshot = await getDocs(collection(chatRef, 'messages'));
          
          if (chatSnapshot.empty) return null;
          
          // Find the other user's ID
          const chatDocument = await getDocs(collection(db, 'chats'));
          const chat = chatDocument.docs.find(doc => doc.id === chatId);
          
          if (!chat) return null;
          
          const members = chat.data().members;
          const otherUserId = members.find((id: string) => id !== currentUser.uid);
          
          if (!otherUserId) return null;
          
          // Get the other user's data
          const userDoc = await getDocs(collection(db, 'users'));
          const otherUser = userDoc.docs.find(doc => doc.id === otherUserId);
          
          if (!otherUser) return null;
          
          return {
            uid: otherUser.id,
            ...otherUser.data()
          } as UserData;
        });
        
        const contacts = (await Promise.all(chatPromises)).filter(Boolean) as UserData[];
        setSearchResults(contacts);
      } catch (error) {
        console.error('Error loading recent contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecentContacts();
  }, [currentUser]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUser) return;
    
    setSearching(true);
    setError('');
    
    try {
      // Search by username
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      const results: UserData[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as UserData;
        // Don't include current user in results
        if (userData.uid !== currentUser.uid) {
          results.push(userData);
        }
      });
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No users found with that username');
      }
    } catch (error) {
      console.error('Error searching for users:', error);
      setError('An error occurred while searching for users');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUserSelect = (user: UserData) => {
    const isSelected = selectedUsers.some(u => u.uid === user.uid);
    
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.uid !== user.uid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Image size exceeds the 2MB limit. Your image is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return;
    }
    
    setImageError('');
    setGroupImage(file);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Convert to base64 for storage
      const base64Data = await convertImageToBase64(file);
      setGroupImageBase64(base64Data);
    } catch (error) {
      console.error('Error processing image:', error);
      setImageError('Failed to process image. Please try another one.');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || !currentUser) {
      setError('Please enter a group name and select at least one user');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create group chat
      const members = [currentUser.uid, ...selectedUsers.map(user => user.uid)];
      
      const chatRef = collection(db, 'chats');
      const newChatRef = await addDoc(chatRef, {
        name: groupName,
        photoURL: groupImageBase64 || '',
        isGroup: true,
        members,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: ''
      });
      
      const chatId = newChatRef.id;
      
      // Add chat to all members' chats
      for (const memberId of members) {
        await setDoc(doc(db, 'users', memberId, 'chats', chatId), {
          isGroup: true,
          name: groupName,
          photoURL: groupImageBase64 || '',
          lastMessage: `${currentUser.displayName} created this group`,
          lastMessageTime: serverTimestamp(),
          unreadCount: memberId === currentUser.uid ? 0 : 1
        });
      }
      
      // Add system message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: `${currentUser.displayName} created this group`,
        senderId: 'system',
        senderName: 'System',
        timestamp: serverTimestamp()
      });
      
      // Navigate to the new group chat
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      setError('An error occurred while creating the group');
    } finally {
      setLoading(false);
    }
  };

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
        <Typography variant="h6">Create Group</Typography>
      </Box>
      
      {/* Group Info */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              position: 'relative',
              width: 80,
              height: 80,
              mr: 2
            }}
          >
            <Avatar
              src={groupImagePreview || undefined}
              sx={{ width: 80, height: 80 }}
            />
            <input
              accept="image/*"
              type="file"
              id="group-image-upload"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <label htmlFor="group-image-upload">
              <IconButton
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper'
                }}
              >
                <AddPhotoAlternateIcon />
              </IconButton>
            </label>
          </Box>
          
          <TextField
            fullWidth
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
          />
        </Box>
        
        {imageError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {imageError}
          </Alert>
        )}
        
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected Users ({selectedUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.map(user => (
                <Chip
                  key={user.uid}
                  avatar={<Avatar src={user.photoURL} />}
                  label={user.displayName || user.username}
                  onDelete={() => handleUserSelect(user)}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search users by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button 
                  variant="contained" 
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  size="small"
                >
                  Search
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* User List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2 }}>
        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {loading || searching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : searchResults.length > 0 ? (
          <Paper elevation={1}>
            <List>
              {searchResults.map((user, index) => {
                const isSelected = selectedUsers.some(u => u.uid === user.uid);
                
                return (
                  <React.Fragment key={user.uid}>
                    <ListItem
                      component="div"
                      onClick={() => handleUserSelect(user)}
                    >
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemAvatar>
                        <Avatar src={user.photoURL} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.displayName || user.username}
                        secondary={`@${user.username}`}
                      />
                    </ListItem>
                    {index < searchResults.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        ) : (
          <Typography color="text.secondary" align="center">
            {searchQuery ? 'No users found' : 'Search for users to add to the group'}
          </Typography>
        )}
      </Box>
      
      {/* Create Button */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleCreateGroup}
          disabled={loading || !groupName.trim() || selectedUsers.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Group'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateGroup; 