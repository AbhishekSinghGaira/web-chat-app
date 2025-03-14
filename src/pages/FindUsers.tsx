import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  CircularProgress,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  username: string;
}

const FindUsers: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUser) return;
    
    setLoading(true);
    setError('');
    setSearchResults([]);
    
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
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const startChat = async (user: UserData) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Check if chat already exists
      const currentUserChatsRef = collection(db, 'users', currentUser.uid, 'chats');
      const q = query(currentUserChatsRef, where('isGroup', '==', false), where('members', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      
      let chatId: string;
      
      if (!querySnapshot.empty) {
        // Chat already exists, navigate to it
        chatId = querySnapshot.docs[0].id;
      } else {
        // Create a new chat
        const chatRef = collection(db, 'chats');
        const newChatRef = await addDoc(chatRef, {
          isGroup: false,
          members: [currentUser.uid, user.uid],
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          lastMessageSenderId: ''
        });
        
        chatId = newChatRef.id;
        
        // Add chat to current user's chats
        await setDoc(doc(db, 'users', currentUser.uid, 'chats', chatId), {
          isGroup: false,
          name: user.displayName || user.username,
          photoURL: user.photoURL || '',
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0
        });
        
        // Add chat to other user's chats
        await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
          isGroup: false,
          name: currentUser.displayName,
          photoURL: currentUser.photoURL || '',
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          unreadCount: 0
        });
      }
      
      // Navigate to chat
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('An error occurred while starting the chat');
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
        <Typography variant="h6">Find Users</Typography>
      </Box>
      
      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
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
                  disabled={loading || !searchQuery.trim()}
                >
                  Search
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* Results */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : searchResults.length > 0 ? (
          <Paper elevation={1}>
            <List>
              {searchResults.map((user, index) => (
                <React.Fragment key={user.uid}>
                  <ListItem
                    secondaryAction={
                      <Button 
                        variant="contained" 
                        onClick={() => startChat(user)}
                      >
                        Message
                      </Button>
                    }
                  >
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
              ))}
            </List>
          </Paper>
        ) : searchQuery ? (
          <Typography color="text.secondary" align="center" sx={{ p: 2 }}>
            Search for users by username
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
};

export default FindUsers; 