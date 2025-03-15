import React, { useState, useEffect } from 'react';
import { Box, Popper, Paper, ClickAwayListener, TextField, InputAdornment, Grid, Typography, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { GiphyFetch } from '@giphy/js-fetch-api';

// Initialize Giphy with your API key
const gf = new GiphyFetch(process.env.REACT_APP_GIPHY_API_KEY || '');

interface GifPickerProps {
  anchorEl: HTMLElement | null;
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

const GifPicker: React.FC<GifPickerProps> = ({ anchorEl, onSelect, onClose }) => {
  const [gifs, setGifs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const open = Boolean(anchorEl);

  useEffect(() => {
    if (open) {
      fetchGifs();
    }
  }, [open, searchQuery]);

  const fetchGifs = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!process.env.REACT_APP_GIPHY_API_KEY) {
        setError('GIPHY API key is not configured');
        return;
      }

      const result = await gf.search(searchQuery || 'trending', {
        limit: 8,
        rating: 'g',
        type: 'gifs',
      });
      
      setGifs(result.data);
    } catch (err) {
      console.error('Error fetching GIFs:', err);
      setError('Failed to fetch GIFs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <Paper elevation={3} sx={{ width: 280, maxWidth: '90vw', maxHeight: '60vh', overflow: 'hidden' }}>
          <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search GIFs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            
            {error && (
              <Typography color="error" variant="caption" sx={{ display: 'block', mb: 1 }}>
                {error}
              </Typography>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={{ overflow: 'auto', maxHeight: '300px' }}>
                <Grid container spacing={1}>
                  {gifs.map((gif) => (
                    <Grid item xs={6} key={gif.id}>
                      <Box
                        onClick={() => onSelect(gif.images.original.url)}
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={gif.images.fixed_width_small.url}
                          alt={gif.title}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
};

export default GifPicker; 