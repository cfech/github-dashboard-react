'use client';

import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Avatar, 
  Box, 
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import { GitHub, Settings, Brightness4, Brightness7, Home, Analytics } from '@mui/icons-material';
import { useTheme } from './ThemeProvider';
import { GitHubUser } from '@/types/github';
import { useRouter, usePathname } from 'next/navigation';

interface HeaderProps {
  user?: GitHubUser;
}

export default function Header({ user }: HeaderProps) {
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <GitHub sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          {process.env.NEXT_PUBLIC_APP_NAME || 'GitHub Dashboard'}
        </Typography>
        
        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          <Button
            color="inherit"
            startIcon={<Home />}
            onClick={() => handleNavigation('/')}
            sx={{
              backgroundColor: pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<Analytics />}
            onClick={() => handleNavigation('/repository-analytics')}
            sx={{
              backgroundColor: pathname === '/repository-analytics' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Analytics
          </Button>
        </Box>
        
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