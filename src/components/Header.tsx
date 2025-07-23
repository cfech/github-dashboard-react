'use client';

import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Avatar, 
  Box, 
  IconButton,
  Tooltip
} from '@mui/material';
import { GitHub, Settings, Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from './ThemeProvider';
import { GitHubUser } from '@/types/github';

interface HeaderProps {
  user?: GitHubUser;
}

export default function Header({ user }: HeaderProps) {
  const { mode, toggleTheme } = useTheme();

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <GitHub sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {process.env.NEXT_PUBLIC_APP_NAME || 'GitHub Dashboard'}
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.name}
            </Typography>
            <Avatar 
              src={user.avatar_url} 
              alt={user.name}
              sx={{ width: 32, height: 32 }}
            />
          </Box>
        )}
        
        <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
            {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Settings">
          <IconButton color="inherit">
            <Settings />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}