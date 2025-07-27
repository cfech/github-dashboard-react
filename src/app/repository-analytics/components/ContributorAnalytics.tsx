'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import { Info, TrendingUp, Warning, Share } from '@mui/icons-material';
import { GitHubCommit, GitHubPR, GitHubRepository, GitHubUser } from '@/types/github';
import ProductivityHeatmap from './contributor/ProductivityHeatmap';
import RiskAnalysisCards from './contributor/RiskAnalysisCards';
import SimpleCollaborationNetwork from './contributor/SimpleCollaborationNetwork';

interface ContributorAnalyticsProps {
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
  repositories: GitHubRepository[];
  userInfo: GitHubUser;
}

export type TimeFrame = '30days' | '6months' | '12months' | 'all';

const TIMEFRAME_OPTIONS = [
  { value: '30days' as TimeFrame, label: '30 Days' },
  { value: '6months' as TimeFrame, label: '6 Months' },
  { value: '12months' as TimeFrame, label: '12 Months' },
  { value: 'all' as TimeFrame, label: 'All Time' },
];

export default function ContributorAnalytics({
  commits,
  pullRequests,
  repositories,
  userInfo
}: ContributorAnalyticsProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('6months');

  const handleTimeFrameChange = (event: SelectChangeEvent<TimeFrame>) => {
    setTimeFrame(event.target.value as TimeFrame);
  };

  // Filter data based on selected timeframe
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeFrame) {
      case '30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        cutoffDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      case '12months':
        cutoffDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0); // Include all data
        break;
    }

    const filteredCommits = commits.filter(commit => 
      new Date(commit.date) >= cutoffDate
    );
    
    const filteredPRs = pullRequests.filter(pr => 
      new Date(pr.created_at) >= cutoffDate
    );

    return { commits: filteredCommits, pullRequests: filteredPRs };
  }, [commits, pullRequests, timeFrame]);

  // Calculate repository statistics for risk analysis
  const repositoryStats = useMemo(() => {
    const stats = new Map<string, {
      repo: string;
      totalCommits: number;
      contributors: Map<string, number>;
      lastActivity: Date;
    }>();

    filteredData.commits.forEach(commit => {
      if (!stats.has(commit.repo)) {
        stats.set(commit.repo, {
          repo: commit.repo,
          totalCommits: 0,
          contributors: new Map(),
          lastActivity: new Date(0)
        });
      }

      const repoStats = stats.get(commit.repo)!;
      repoStats.totalCommits++;
      
      const currentCount = repoStats.contributors.get(commit.author) || 0;
      repoStats.contributors.set(commit.author, currentCount + 1);
      
      const commitDate = new Date(commit.date);
      if (commitDate > repoStats.lastActivity) {
        repoStats.lastActivity = commitDate;
      }
    });

    return Array.from(stats.values());
  }, [filteredData.commits]);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Contributor Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Analyze contributor patterns, productivity trends, and knowledge concentration risks
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Time Frame</InputLabel>
          <Select
            value={timeFrame}
            label="Time Frame"
            onChange={handleTimeFrameChange}
          >
            {TIMEFRAME_OPTIONS.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={4}>
        {/* Productivity Heatmap Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <TrendingUp color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h5" gutterBottom sx={{ mb: 0, fontWeight: 'bold' }}>
                Developer Productivity Patterns
              </Typography>
              <Tooltip title={
                <Box sx={{ p: 1, maxWidth: 400 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Developer Productivity Patterns
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>What it shows:</strong> A calendar heatmap visualizing when developers commit code throughout the day and week.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>How it&apos;s computed:</strong>
                    • Each day shows total commits made by all contributors
                    • Color intensity represents commit frequency (darker = more commits)
                    • Time filtering affects which commits are included in calculations
                  </Typography>
                  <Typography variant="body2">
                    <strong>Use cases:</strong> Identify peak productivity hours, understand team working patterns, optimize meeting schedules, and detect work-life balance issues.
                  </Typography>
                </Box>
              }>
                <IconButton size="small">
                  <Info color="action" fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: '1rem' }}>
              Visualize when developers are most active across different time periods
            </Typography>
            <ProductivityHeatmap 
              commits={filteredData.commits}
              timeFrame={timeFrame}
            />
          </Paper>
        </Grid>

        {/* Knowledge Concentration Risk Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Warning color="warning" sx={{ fontSize: 28 }} />
              <Typography variant="h5" gutterBottom sx={{ mb: 0, fontWeight: 'bold' }}>
                Knowledge Concentration Risk Analysis
              </Typography>
              <Tooltip title={
                <Box sx={{ p: 1, maxWidth: 500 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Knowledge Concentration Risk Analysis
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>What it measures:</strong> The degree to which repository knowledge is concentrated in individual contributors.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Risk calculation formula:</strong>
                    • Base Risk = (Top Contributor Commits / Total Commits) × 100
                    • +10 points if inactive {'>'}30 days, +20 if {'>'}90 days
                    • -5 points if {'>'}3 contributors, -10 if {'>'}5 contributors
                    • Final score determines risk level: Critical (85+), High (70+), Medium (50+), Low ({'<'}50)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Why it matters:</strong> High concentration creates bus factor risks. If key contributors leave, the project loses critical knowledge. Scores {'>'}50% indicate potential problems.
                  </Typography>
                </Box>
              }>
                <IconButton size="small">
                  <Info color="action" fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: '1rem' }}>
              Identify repositories with high dependency on individual contributors. All repositories are shown with color-coded risk levels.
            </Typography>
            <RiskAnalysisCards 
              repositoryStats={repositoryStats}
              repositories={repositories}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 4 }} />
        </Grid>

        {/* Cross-Repository Collaboration Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Share color="info" sx={{ fontSize: 28 }} />
              <Typography variant="h5" gutterBottom sx={{ mb: 0, fontWeight: 'bold' }}>
                Cross-Repository Collaboration Network
              </Typography>
              <Tooltip title={
                <Box sx={{ p: 1, maxWidth: 450 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Cross-Repository Collaboration Network
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Network types:</strong>
                    • <strong>Contributor ↔ Repositories:</strong> Shows which contributors work on which repos
                    • <strong>Contributor Collaboration:</strong> Contributors connected by shared repositories
                    • <strong>Repository Relationships:</strong> Repos connected by shared contributors
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>How connections are calculated:</strong>
                    • Node size = activity level (commits + PRs)
                    • Link strength = collaboration frequency
                    • Network statistics show collaboration patterns
                  </Typography>
                  <Typography variant="body2">
                    <strong>Insights:</strong> Identify key connectors, collaboration bottlenecks, and opportunities for knowledge transfer.
                  </Typography>
                </Box>
              }>
                <IconButton size="small">
                  <Info color="action" fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: '1rem' }}>
              Visualize how contributors collaborate across different repositories
            </Typography>
            <SimpleCollaborationNetwork 
              commits={filteredData.commits}
              pullRequests={filteredData.pullRequests}
              repositories={repositories}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}