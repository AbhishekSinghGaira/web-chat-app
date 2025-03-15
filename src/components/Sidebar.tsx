import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CallIcon from '@mui/icons-material/Call';
import ChatIcon from '@mui/icons-material/Chat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface SidebarProps {
  onClose: () => void;
}

interface ChatItem {
  id: string;
  name: string;
  photoURL: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isGroup: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    chatId: string;
  } | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Get user's chats
    const userChatsRef = collection(db, 'users', currentUser.uid, 'chats');
    const q = query(userChatsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList: ChatItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatList.push({
          id: doc.id,
          name: data.name,
          photoURL: data.photoURL || '',
          lastMessage: data.lastMessage || 'Start a conversation',
          timestamp: data.lastMessageTime?.toDate() || new Date(),
          unreadCount: data.unreadCount || 0,
          isGroup: data.isGroup || false
        });
      });
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    if (window.innerWidth < 960) {
      onClose();
    }
  };

  const handleChatWithVoiceClick = (chatId: string) => {
    navigate(`/chat-with-voice/${chatId}`);
    if (window.innerWidth < 960) {
      onClose();
    }
  };

  const handleCreateGroup = () => {
    navigate('/create-group');
    if (window.innerWidth < 960) {
      onClose();
    }
  };

  const handleFindUsers = () => {
    navigate('/find-users');
    if (window.innerWidth < 960) {
      onClose();
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    if (window.innerWidth < 960) {
      onClose();
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleContextMenu = (event: React.MouseEvent, chatId: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            chatId,
          }
        : null,
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const filteredChats = chats.filter(chat => {
    if (tabValue === 1 && !chat.isGroup) return false;
    if (tabValue === 2 && chat.isGroup) return false;
    if (!searchQuery) return true;
    return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Profile */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Tooltip title="View Profile">
          <Avatar 
            src={currentUser?.photoURL || undefined} 
            sx={{ 
              width: 50, 
              height: 50, 
              mr: 2,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={handleProfileClick}
          />
        </Tooltip>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" noWrap>
            {currentUser?.displayName || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {currentUser?.email || ''}
          </Typography>
        </Box>
        <IconButton onClick={handleLogout} color="primary">
          <LogoutIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      {/* Actions */}
      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <Tooltip title="Profile">
          <IconButton color="primary" onClick={handleProfileClick}>
            <AccountCircleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Create Group">
          <IconButton color="primary" onClick={handleCreateGroup}>
            <GroupAddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Find Users">
          <IconButton color="primary" onClick={handleFindUsers}>
            <PersonAddIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Search */}
      <Box sx={{ px: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All" />
        <Tab label="Groups" />
        <Tab label="Direct" />
      </Tabs>
      
      {/* Chat List */}
      <List sx={{ flexGrow: 1, overflow: 'auto', pt: 0 }}>
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ListItem 
              key={chat.id} 
              disablePadding
              onContextMenu={(event) => handleContextMenu(event, chat.id)}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  onClick={(event) => {
                    event.stopPropagation();
                    handleContextMenu(event, chat.id);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => handleChatClick(chat.id)}>
                <ListItemAvatar>
                  <Badge
                    color="primary"
                    badgeContent={chat.unreadCount}
                    invisible={chat.unreadCount === 0}
                  >
                    <Avatar src={chat.photoURL} />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={chat.name}
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px'
                      }}
                    >
                      {chat.lastMessage}
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {chat.timestamp.toLocaleDateString()}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </Typography>
          </Box>
        )}
      </List>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => {
          if (contextMenu) {
            handleChatClick(contextMenu.chatId);
            handleContextMenuClose();
          }
        }}>
          <ListItemIcon>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open Chat</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu) {
            handleChatWithVoiceClick(contextMenu.chatId);
            handleContextMenuClose();
          }
        }}>
          <ListItemIcon>
            <CallIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open with Voice Call</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Sidebar; 