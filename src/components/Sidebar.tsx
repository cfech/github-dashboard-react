'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import { Refresh, Code, Group, Star, Warning, Sync } from '@mui/icons-material';
import { GitHubUser } from '@/types/github';
import { INFO_MESSAGES } from '@/lib/constants';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user?: GitHubUser;
  onRefresh: () => void;
  onFullSync: () => void;
  debugMode: boolean;
}

export default function Sidebar({ open, onClose, user, onRefresh, onFullSync, debugMode }: SidebarProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 300, p: 2 }}>
        {user && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={user.avatar_url} alt={user.name} sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h6">{user.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  @{user.login}
                </Typography>
              </Box>
            </Box>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Profile Stats
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  icon={<Code />} 
                  label={`${user.public_repos} repos`} 
                  size="small" 
                />
                <Chip 
                  icon={<Group />} 
                  label={`${user.followers} followers`} 
                  size="small" 
                />
                <Chip 
                  icon={<Star />} 
                  label={`${user.total_commit_contributions} commits`} 
                  size="small" 
                />
              </Box>
              {user.company && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {user.company}
                </Typography>
              )}
              {user.location && (
                <Typography variant="body2" color="text.secondary">
                  {user.location}
                </Typography>
              )}
            </Paper>
            
            <Divider sx={{ my: 2 }} />
          </>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Data Controls
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            fullWidth
            onClick={onRefresh}
            disabled={debugMode}
            sx={{ mb: 1 }}
          >
            {INFO_MESSAGES.refresh_data}
          </Button>
          
          <Tooltip title="⚠️ This will completely refresh all data from GitHub and may take several minutes. Use only when you need to reset the cache or fix data issues.">
            <Button
              variant="contained"
              startIcon={<Warning />}
              fullWidth
              onClick={onFullSync}
              disabled={debugMode}
              sx={{ 
                mb: 1,
                bgcolor: 'error.main',
                '&:hover': {
                  bgcolor: 'error.dark',
                },
                color: 'error.contrastText'
              }}
            >
              Full Data Reset
            </Button>
          </Tooltip>
          
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              <strong>💡 Refresh Options:</strong>
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              • <strong>Quick Refresh</strong> (floating button): Checks for new commits/PRs only
            </Typography>
            <Typography variant="caption" display="block">
              • <strong>Full Reset</strong> (red button): Completely refreshes all data from GitHub
            </Typography>
          </Alert>
          
          {debugMode && (
            <Typography variant="caption" color="text.secondary">
              Refresh disabled in debug mode
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Debug Information
          </Typography>
          <FormControlLabel
            control={<Switch checked={debugMode} />}
            label="Debug Mode"
            disabled
          />
          <Typography variant="caption" color="text.secondary" display="block">
            {debugMode ? INFO_MESSAGES.debug_mode_on : INFO_MESSAGES.debug_mode_off}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}