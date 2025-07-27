'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Fab,
  Tooltip,
  Snackbar,
  Grid
} from '@mui/material';
import { Analytics, Hub, Menu, Refresh } from '@mui/icons-material';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ContributorAnalytics from './components/ContributorAnalytics';
import RepositoryClustering from './components/RepositoryClustering';
import { GitHubCommit, GitHubPR, GitHubRepository, GitHubUser, GitHubData } from '@/types/github';
import { mockData } from '@/data/mockData';
import { fetchGitHubData, refreshGitHubData, fullSyncGitHubData } from '@/lib/apiClient';
import { INFO_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

export default function RepositoryAnalyticsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GitHubData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE?.toLowerCase() === 'true';

  useEffect(() => {
    fetchData();
  }, []);

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
          console.group('🎨 Repository Analytics Debug Mode');
          console.log(`📊 Mock Data Loaded: ${mockData.commits.length} commits, ${mockData.pull_requests.length} PRs`);
          console.log(`👤 User: ${mockData.user_info.name} (@${mockData.user_info.login})`);
          console.groupEnd();
        }
      } else {
        // Fetch real data from GitHub API
        console.log('🔄 Fetching live GitHub data for analytics...');
        const githubData = await fetchGitHubData();
        setData(githubData);
        
        setSnackbarMessage(`📊 Analytics data loaded: ${githubData.commits.length} commits, ${githubData.pull_requests.length} PRs`);
        setSnackbarOpen(true);
        
        // Performance logging for production mode
        if (process.env.NODE_ENV === 'development') {
          console.group('🎨 Repository Analytics Performance');
          console.log(`📊 Live Data Loaded: ${githubData.commits.length} commits, ${githubData.pull_requests.length} PRs`);
          console.log(`👤 User: ${githubData.user_info.name} (@${githubData.user_info.login})`);
          console.groupEnd();
        }
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
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

  // Incremental refresh - check for new commits/PRs only
  const handleRefresh = async () => {
    if (!debugMode) {
      setLoading(true);
      try {
        console.log('🔄 Refreshing analytics data...');
        const refreshedData = await refreshGitHubData();
        setData(refreshedData);
        
        // Show notification with new data count
        const cacheInfo = refreshedData.cache_info;
        if (cacheInfo && ((cacheInfo.new_commits || 0) > 0 || (cacheInfo.new_prs || 0) > 0)) {
          setSnackbarMessage(`✨ Found ${cacheInfo.new_commits || 0} new commits and ${cacheInfo.new_prs || 0} new PRs!`);
        } else {
          setSnackbarMessage('✓ Analytics data is up to date!');
        }
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Error refreshing analytics data:', err);
        setSnackbarMessage('❌ Failed to refresh analytics data');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
  };

  // Full sync - completely refresh all data (for settings)
  const handleFullSync = async () => {
    if (!debugMode) {
      setLoading(true);
      try {
        console.log('🔄 Performing full sync for analytics...');
        const syncedData = await fullSyncGitHubData();
        setData(syncedData);
        setSnackbarMessage(`🔄 Full sync completed! Analytics ready with ${syncedData.commits.length} commits and ${syncedData.pull_requests.length} PRs`);
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Error performing full sync:', err);
        setSnackbarMessage('❌ Failed to perform full sync');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header user={data?.user_info} />
        
        <Box 
          sx={{ 
            flex: 1,
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            px: 3,
            py: 8
          }}
        >
          <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
            {/* Main Loading Spinner */}
            <Box sx={{ mb: 4 }}>
              <CircularProgress 
                size={80} 
                thickness={4}
                sx={{ 
                  color: 'primary.main',
                  mb: 3
                }}
              />
            </Box>
            
            {/* Loading Title */}
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                color: 'primary.main',
                mb: 2
              }}
            >
              Analyzing Your Repositories
            </Typography>
            
            {/* Loading Message */}
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ mb: 4, fontWeight: 'medium' }}
            >
              {debugMode 
                ? "Loading mock data for development..." 
                : "Fetching and processing your GitHub data..."
              }
            </Typography>
            
            {/* What we're doing */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                backgroundColor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                🔍 What we&apos;re analyzing:
              </Typography>
              <Box sx={{ textAlign: 'left', mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • 📊 Commit patterns and contributor activity
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • 🔀 Pull request data and collaboration metrics
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • 🏗️ Repository relationships and clustering
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • ⚡ Productivity patterns and knowledge distribution
                </Typography>
                <Typography variant="body2">
                  • 🎯 Interactive visualizations and insights
                </Typography>
              </Box>
            </Paper>
            
            {/* Debug mode notice */}
            {debugMode && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.9rem'
                  }
                }}
              >
                <strong>Debug Mode:</strong> Using sample data for development. 
                Set NEXT_PUBLIC_DEBUG_MODE=false for live GitHub data.
              </Alert>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Header user={data?.user_info} />
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
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Header user={undefined} />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="info">
            No data available for analysis.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header user={data?.user_info} />
      
      <Container maxWidth="xl" sx={{ mt: 3, pb: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Repository Analytics
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
            Advanced insights into contributor patterns, knowledge distribution, and repository relationships using data-driven algorithms and statistical analysis
          </Typography>
          
          <Box sx={{ mb: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics color="primary" />
              What You&apos;ll Discover
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>📈 Contributor Analytics:</strong> Productivity heatmaps showing when your team is most active, knowledge concentration risk analysis with bus factor calculations, and collaboration network visualizations.
                </Typography>
                <Typography variant="body2">
                  <strong>🌐 Repository Clustering:</strong> AI-powered grouping of similar repositories using our 6-factor algorithm (contributor overlap, activity patterns, maturity, scale, complexity, and recent activity).
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" paragraph>
                  <strong>🔍 Interactive Analysis:</strong> Explore repository relationships through multiple visualization modes including card layouts, similarity matrices, and detailed clustering breakdowns.
                </Typography>
                <Typography variant="body2">
                  <strong>📊 Detailed Metrics:</strong> All calculations are transparent with hover tooltips explaining formulas, thresholds, and interpretation guidelines.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Paper elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 80,
                fontSize: '1.1rem',
                fontWeight: 'medium',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              },
              '& .Mui-selected': {
                fontWeight: 'bold'
              }
            }}
          >
            <Tab 
              icon={<Analytics sx={{ fontSize: 32, mb: 1 }} />} 
              label="Contributor Analytics" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<Hub sx={{ fontSize: 32, mb: 1 }} />} 
              label="Repository Clustering" 
              {...a11yProps(1)} 
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <ContributorAnalytics 
              commits={data.commits || []}
              pullRequests={data.pull_requests || []}
              repositories={data.repositories || []}
              userInfo={data.user_info!}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <RepositoryClustering 
              commits={data.commits || []}
              pullRequests={data.pull_requests || []}
              repositories={data.repositories || []}
              userInfo={data.user_info!}
            />
          </TabPanel>
        </Paper>
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
      <Tooltip title="🔄 Quick refresh: Update analytics data with latest commits and PRs">
        <Fab
          color="secondary"
          sx={{ position: 'fixed', bottom: 80, right: 16 }}
          onClick={handleRefresh}
          disabled={loading || debugMode}
        >
          <Refresh />
        </Fab>
      </Tooltip>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={data?.user_info}
        onRefresh={handleRefresh}
        onFullSync={handleFullSync}
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