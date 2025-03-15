import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme,
  useMediaQuery,
  styled,
  keyframes
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallIcon from '@mui/icons-material/Call';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import GifIcon from '@mui/icons-material/Gif';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import VoiceCall from '../components/VoiceCall';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhotoURL: string;
  timestamp: Timestamp;
  mediaData?: string; // Base64 encoded media data
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  fileName?: string;
  fileSize?: number;
}

interface ChatInfo {
  id: string;
  name: string;
  photoURL: string;
  isGroup: boolean;
  members: string[];
  createdBy: string;
  createdAt: Timestamp;
}

interface EmojiData {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for files

// Define animations
const seenAnimation = keyframes`
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(33, 150, 243, 0.1);
  }
  100% {
    background-color: transparent;
  }
`;

// Styled components
const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isOwn' && prop !== 'isSeen'
})<{ isOwn: boolean; isSeen: boolean }>(({ theme, isOwn, isSeen }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '85%',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '90%',
    padding: theme.spacing(1.25),
  },
  borderRadius: theme.spacing(2),
  position: 'relative',
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[100],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  animation: isSeen ? `${seenAnimation} 2s ease-in-out` : 'none',
  '&::after': {
    content: '""',
    position: 'absolute',
    width: 0,
    height: 0,
    border: '8px solid transparent',
    borderTopColor: isOwn ? theme.palette.primary.main : theme.palette.grey[100],
    borderBottom: 0,
    bottom: '-8px',
    [isOwn ? 'right' : 'left']: '20px',
    marginBottom: 0,
  }
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.grey[50],
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    height: '100vh',
  },
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  backgroundImage: 'linear-gradient(45deg, #f5f5f5 25%, transparent 25%, transparent 75%, #f5f5f5 75%, #f5f5f5), linear-gradient(45deg, #f5f5f5 25%, transparent 25%, transparent 75%, #f5f5f5 75%, #f5f5f5)',
  backgroundSize: '60px 60px',
  backgroundPosition: '0 0, 30px 30px',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
  '&::-webkit-scrollbar': {
    width: '4px',
    [theme.breakpoints.down('sm')]: {
      width: '2px',
    },
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[300],
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.grey[400],
    },
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

const ChatRoomWithVoice: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [inCall, setInCall] = useState(false);
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [fileError, setFileError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);
  const [gifAnchorEl, setGifAnchorEl] = useState<HTMLElement | null>(null);

  // Fetch chat info
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const fetchChatInfo = async () => {
      try {
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatDocRef);
        
        if (chatDoc.exists()) {
          setChatInfo({
            id: chatDoc.id,
            ...chatDoc.data()
          } as ChatInfo);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chat info:', error);
        setLoading(false);
      }
    };

    fetchChatInfo();
  }, [chatId, currentUser]);

  // Listen for messages
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc) => {
        messageList.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(messageList);
      
      // Mark messages as read
      updateUnreadCount();
    });

    return () => unsubscribe();
  }, [chatId, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateUnreadCount = async () => {
    if (!chatId || !currentUser) return;
    
    try {
      const userChatRef = doc(db, 'users', currentUser.uid, 'chats', chatId);
      await updateDoc(userChatRef, {
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId || !currentUser) return;

    try {
      const newMessage = {
        text: message,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        timestamp: serverTimestamp()
      };

      // Add message to chat
      await addDoc(collection(db, 'chats', chatId, 'messages'), newMessage);

      // Update last message in chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: currentUser.uid
      });

      // Update last message for all chat members
      if (chatInfo) {
        for (const memberId of chatInfo.members) {
          const userChatRef = doc(db, 'users', memberId, 'chats', chatId);
          
          if (memberId === currentUser.uid) {
            await updateDoc(userChatRef, {
              lastMessage: message,
              lastMessageTime: serverTimestamp(),
              unreadCount: 0
            });
          } else {
            const userChatDoc = await getDoc(userChatRef);
            if (userChatDoc.exists()) {
              const userData = userChatDoc.data();
              await updateDoc(userChatRef, {
                lastMessage: message,
                lastMessageTime: serverTimestamp(),
                unreadCount: (userData.unreadCount || 0) + 1
              });
            }
          }
        }
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !chatId || !currentUser) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds the 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    setFileError('');

    try {
      // Determine file type
      let mediaType: 'image' | 'video' | 'audio' | 'file' = 'file';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      // Convert file to base64
      const base64Data = await convertFileToBase64(file);

      // Add message with media
      const newMessage = {
        text: mediaType === 'file' ? `Shared a file: ${file.name}` : '',
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        timestamp: serverTimestamp(),
        mediaData: base64Data,
        mediaType,
        fileName: file.name,
        fileSize: file.size
      };

      // Add message to chat
      await addDoc(collection(db, 'chats', chatId, 'messages'), newMessage);

      // Update last message in chat
      const lastMessageText = mediaType === 'image' 
        ? '📷 Image' 
        : mediaType === 'video' 
          ? '🎥 Video' 
          : mediaType === 'audio' 
            ? '🎵 Audio' 
            : `📎 File: ${file.name}`;

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: lastMessageText,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: currentUser.uid
      });

      // Update last message for all chat members
      if (chatInfo) {
        for (const memberId of chatInfo.members) {
          const userChatRef = doc(db, 'users', memberId, 'chats', chatId);
          
          if (memberId === currentUser.uid) {
            await updateDoc(userChatRef, {
              lastMessage: lastMessageText,
              lastMessageTime: serverTimestamp(),
              unreadCount: 0
            });
          } else {
            const userChatDoc = await getDoc(userChatRef);
            if (userChatDoc.exists()) {
              const userData = userChatDoc.data();
              await updateDoc(userChatRef, {
                lastMessage: lastMessageText,
                lastMessageTime: serverTimestamp(),
                unreadCount: (userData.unreadCount || 0) + 1
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setFileError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAttachClick = () => {
    setAnchorEl(null);
    fileInputRef.current?.click();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStartCall = () => {
    setAnchorEl(null);
    setInCall(true);
    // In a real app, you would implement the call functionality here
    // using WebRTC with simple-peer or a service like Twilio
  };

  const handleEndCall = () => {
    setInCall(false);
  };

  const handleStartVoiceCall = () => {
    setAnchorEl(null);
    setInVoiceCall(true);
  };

  const handleEndVoiceCall = () => {
    setInVoiceCall(false);
  };

  const handleEmojiClick = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    handleEmojiClose();
  };

  const handleGifClick = (event: React.MouseEvent<HTMLElement>) => {
    setGifAnchorEl(event.currentTarget);
  };

  const handleGifClose = () => {
    setGifAnchorEl(null);
  };

  const handleGifSelect = async (gifUrl: string) => {
    if (!chatId || !currentUser) return;

    try {
      setUploading(true);
      
      // Add message with GIF
      const newMessage = {
        text: '',
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhotoURL: currentUser.photoURL,
        timestamp: serverTimestamp(),
        mediaData: gifUrl,
        mediaType: 'image',
        fileName: 'GIF'
      };

      // Add message to chat
      await addDoc(collection(db, 'chats', chatId, 'messages'), newMessage);

      // Update last message in chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: '🎬 GIF',
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: currentUser.uid
      });

      // Update last message for all chat members
      if (chatInfo) {
        for (const memberId of chatInfo.members) {
          const userChatRef = doc(db, 'users', memberId, 'chats', chatId);
          
          if (memberId === currentUser.uid) {
            await updateDoc(userChatRef, {
              lastMessage: '🎬 GIF',
              lastMessageTime: serverTimestamp(),
              unreadCount: 0
            });
          } else {
            const userChatDoc = await getDoc(userChatRef);
            if (userChatDoc.exists()) {
              const userData = userChatDoc.data();
              await updateDoc(userChatRef, {
                lastMessage: '🎬 GIF',
                lastMessageTime: serverTimestamp(),
                unreadCount: (userData.unreadCount || 0) + 1
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending GIF:', error);
      setFileError('Failed to send GIF. Please try again.');
    } finally {
      setUploading(false);
      handleGifClose();
    }
  };

  const renderMessage = (msg: Message, index: number) => {
    const isOwn = msg.senderId === currentUser?.uid;
    const isSeen = isOwn && index === messages.length - 1 && messages.length > 1;
    const showAvatar = !isOwn && (!messages[index - 1] || messages[index - 1].senderId !== msg.senderId);
    
    return (
      <Box
        key={msg.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            flexDirection: isOwn ? 'row-reverse' : 'row',
            gap: 1,
          }}
        >
          {!isOwn && showAvatar && (
            <Avatar
              src={msg.senderPhotoURL}
              sx={{ width: 32, height: 32 }}
            />
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
            {!isOwn && showAvatar && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                {msg.senderName}
              </Typography>
            )}
            <MessageBubble isOwn={isOwn} isSeen={isSeen} elevation={0}>
              {msg.mediaType === 'image' && (
                <Box
                  component="img"
                  src={msg.mediaData}
                  alt="Shared image"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 1,
                    mb: msg.text ? 1 : 0,
                  }}
                />
              )}
              {msg.text && (
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {msg.text}
                </Typography>
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 0.5,
                  mt: 0.5,
                }}
              >
                <Typography variant="caption" color={isOwn ? 'inherit' : 'text.secondary'} sx={{ opacity: 0.8 }}>
                  {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                {isOwn && (
                  <DoneAllIcon
                    sx={{
                      fontSize: 16,
                      color: isSeen ? '#34B7F1' : 'inherit',
                      opacity: 0.8,
                    }}
                  />
                )}
              </Box>
            </MessageBubble>
          </Box>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chatInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Chat not found</Typography>
      </Box>
    );
  }

  return (
    <ChatContainer>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          [theme.breakpoints.down('sm')]: {
            p: 1.5,
          },
        }}
      >
        <Avatar 
          src={chatInfo?.photoURL} 
          sx={{ 
            mr: 2,
            [theme.breakpoints.down('sm')]: {
              width: 36,
              height: 36,
              mr: 1.5,
            },
          }} 
        />
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              [theme.breakpoints.down('sm')]: {
                fontSize: '0.9rem',
              },
            }}
          >
            {chatInfo?.name}
          </Typography>
          {chatInfo?.isGroup && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                [theme.breakpoints.down('sm')]: {
                  fontSize: '0.75rem',
                },
              }}
            >
              {chatInfo.members.length} members
            </Typography>
          )}
        </Box>
        <IconButton
          color={inCall ? 'secondary' : 'default'}
          onClick={inCall ? handleEndCall : handleStartCall}
          sx={{ 
            [theme.breakpoints.down('sm')]: {
              padding: 0.5,
            },
          }}
        >
          <VideocamIcon />
        </IconButton>
        <IconButton
          color={inVoiceCall ? 'secondary' : 'default'}
          onClick={inVoiceCall ? handleEndVoiceCall : handleStartVoiceCall}
          sx={{ 
            [theme.breakpoints.down('sm')]: {
              padding: 0.5,
            },
          }}
        >
          <CallIcon />
        </IconButton>
        <IconButton 
          onClick={handleMenuOpen}
          sx={{ 
            [theme.breakpoints.down('sm')]: {
              padding: 0.5,
            },
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <MessagesContainer>
        {messages.map((msg, index) => renderMessage(msg, index))}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Input */}
      <InputContainer>
        {fileError && (
          <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block' }}>
            {fileError}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <IconButton onClick={handleAttachClick} disabled={uploading}>
            <AttachFileIcon />
          </IconButton>
          <IconButton onClick={handleEmojiClick} disabled={uploading}>
            <EmojiEmotionsIcon />
          </IconButton>
          <IconButton onClick={handleGifClick} disabled={uploading}>
            <GifIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={uploading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: 'background.paper',
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || uploading}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </InputContainer>

      {/* Emoji Picker */}
      <EmojiPicker
        anchorEl={emojiAnchorEl}
        onSelect={handleEmojiSelect}
        onClose={handleEmojiClose}
      />

      {/* GIF Picker */}
      <GifPicker
        anchorEl={gifAnchorEl}
        onSelect={handleGifSelect}
        onClose={handleGifClose}
      />

      {/* Voice Call Dialog */}
      <VoiceCall
        open={inVoiceCall}
        onClose={handleEndVoiceCall}
        recipientName={chatInfo?.name || ''}
        recipientPhoto={chatInfo?.photoURL || ''}
        isGroup={chatInfo?.isGroup}
      />

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleStartCall}>
          <ListItemIcon>
            <VideocamIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Start video call" />
        </MenuItem>
        <MenuItem onClick={handleStartVoiceCall}>
          <ListItemIcon>
            <CallIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Start voice call" />
        </MenuItem>
      </Menu>
    </ChatContainer>
  );
};

export default ChatRoomWithVoice; 