import React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Box, Popper, Paper, ClickAwayListener, useTheme } from '@mui/material';

interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  onSelect: (emoji: any) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ anchorEl, onSelect, onClose }) => {
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Popper 
      open={open} 
      anchorEl={anchorEl} 
      placement="top-start" 
      style={{ zIndex: 1300 }}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 10],
          },
        },
      ]}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper elevation={3} sx={{ maxWidth: '90vw', maxHeight: '70vh', overflow: 'hidden' }}>
          <Box sx={{ p: 1 }}>
            <Picker 
              data={data} 
              onEmojiSelect={onSelect}
              theme={isDarkMode ? 'dark' : 'light'}
              set="native"
              previewPosition="none"
              skinTonePosition="none"
              emojiSize={24}
              emojiButtonSize={36}
              maxFrequentRows={4}
              navPosition="bottom"
              perLine={7}
              searchPosition="sticky"
            />
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
};

export default EmojiPicker; 