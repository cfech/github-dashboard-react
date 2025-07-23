'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  IconButton,
  Fab,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Menu, Refresh } from '@mui/icons-material';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import CommitStream from '@/components/CommitStream';
import PRStream from '@/components/PRStream';
import ActivityCharts from '@/components/ActivityCharts';
import CommitsTable from '@/components/CommitsTable';
import GlobalSearch from '@/components/GlobalSearch';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import { GitHubData } from '@/types/github';
import { mockData } from '@/data/mockData';
import { fetchGitHubData, refreshGitHubData } from '@/lib/apiClient';
import { INFO_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';

export default function Dashboard() {
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE?.toLowerCase() === 'true';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (debugMode) {
        // Simulate API delay in debug mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(mockData);
        setSnackbarMessage(INFO_MESSAGES.debug_mode_on);
        setSnackbarOpen(true);
        
        // Performance logging for debug mode
        if (process.env.NODE_ENV === 'development') {
          console.group('🎨 Debug Mode Performance');
          console.log(`📊 Mock Data Loaded: ${mockData.commits.length} commits, ${mockData.pull_requests.length} PRs`);
          console.log(`👤 User: ${mockData.user_info.name} (@${mockData.user_info.login})`);
          console.groupEnd();
        }
      } else {
        // Fetch real data from GitHub API
        console.log('🔄 Fetching live GitHub data...');
        const githubData = await fetchGitHubData();
        setData(githubData);
        setSnackbarMessage(INFO_MESSAGES.debug_mode_off + ` - Loaded ${githubData.commits.length} commits, ${githubData.pull_requests.length} PRs`);
        setSnackbarOpen(true);
        
        // Performance logging for production mode
        if (process.env.NODE_ENV === 'development') {
          console.group('🎨 Production Mode Performance');
          console.log(`📊 Live Data Loaded: ${githubData.commits.length} commits, ${githubData.pull_requests.length} PRs`);
          console.log(`👤 User: ${githubData.user_info.name} (@${githubData.user_info.login})`);
          console.groupEnd();
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.api_error);
      
      // Show helpful error message for common issues
      if (err instanceof Error) {
        if (err.message.includes('GITHUB_TOKEN')) {
          setError('GitHub token not configured. Please check your environment variables.');
        } else if (err.message.includes('403')) {
          setError('GitHub API rate limit exceeded or insufficient permissions. Please check your token scopes.');
        } else if (err.message.includes('401')) {
          setError('GitHub token is invalid. Please check your GITHUB_TOKEN environment variable.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!debugMode) {
      try {
        // Clear cache and fetch fresh data
        await refreshGitHubData();
        await fetchData();
        setSnackbarMessage('Data refreshed successfully');
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Error refreshing data:', err);
        setSnackbarMessage('Failed to refresh data');
        setSnackbarOpen(true);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {debugMode && (
          <Alert severity="info">
            Debug mode is enabled. Using mock data for development.
          </Alert>
        )}
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header user={data?.user_info} />
      
      <Container maxWidth="xl" sx={{ mt: 3, pb: 3 }}>
        <Grid container spacing={3}>
          {/* Two-column layout for streams */}
          <Grid item xs={12} md={6}>
            <CommitStream commits={data?.commits || []} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <PRStream pullRequests={data?.pull_requests || []} />
          </Grid>
        </Grid>
        
        {/* Secondary sections */}
        <Grid item xs={12}>
          <GlobalSearch 
            commits={data?.commits || []} 
            pullRequests={data?.pull_requests || []}
            onSearchChange={setSearchTerm}
          />
        </Grid>
        
        <Grid item xs={12}>
          <CommitsTable 
            commits={data?.commits || []} 
            searchTerm={searchTerm}
          />
        </Grid>
        
        {/* Activity Charts */}
        <Grid item xs={12}>
          <ActivityCharts 
            commits={data?.commits || []} 
            pullRequests={data?.pull_requests || []}
          />
        </Grid>
        
        {/* Activity Heatmap */}
        <Grid item xs={12}>
          <ActivityHeatmap commits={data?.commits || []} />
        </Grid>
      </Container>

      {/* Floating Menu Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu />
      </Fab>

      {/* Floating Refresh Button */}
      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={handleRefresh}
        disabled={loading || debugMode}
      >
        <Refresh />
      </Fab>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={data?.user_info}
        onRefresh={handleRefresh}
        debugMode={debugMode}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}