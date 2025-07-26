'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { GitHubCommit, GitHubPR } from '@/types/github';
import { PROJECT_COLORS } from '@/lib/theme';
import { truncateText } from '@/utils/dateUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ActivityChartsProps {
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
}

export default function ActivityCharts({ commits, pullRequests }: ActivityChartsProps) {
  // Data integrity check to catch inconsistencies
  const dataChecksum = useMemo(() => {
    const commitChecksum = commits.map(c => `${c.sha}-${c.author}-${c.date}`).join('|');
    const prChecksum = pullRequests.map(pr => `${pr.number}-${pr.author}-${pr.created_at}`).join('|');
    return `${commitChecksum.length}-${prChecksum.length}`;
  }, [commits, pullRequests]);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 ActivityCharts data checksum: ${dataChecksum}`);
  }
  // Calculate the earliest data point for the notice
  const earliestDataInfo = useMemo(() => {
    const allDates: Date[] = [];
    
    // Add commit dates
    commits.forEach(commit => {
      if (commit.date) {
        allDates.push(new Date(commit.date));
      }
    });
    
    // Add PR dates
    pullRequests.forEach(pr => {
      if (pr.created_at) {
        allDates.push(new Date(pr.created_at));
      }
    });
    
    if (allDates.length === 0) {
      return null;
    }
    
    const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const totalItems = commits.length + pullRequests.length;
    
    return {
      date: earliestDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalItems
    };
  }, [commits, pullRequests]);

  const commitChartData = useMemo(() => {
    // Ensure we have valid commits data
    if (!Array.isArray(commits) || commits.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Commits',
          data: [],
          backgroundColor: PROJECT_COLORS.chartBlue,
          borderColor: PROJECT_COLORS.chartBorderCommit,
          borderWidth: 1,
        }],
      };
    }
    
    const commitsByUser = commits.reduce((acc, commit) => {
      // Ensure commit has required fields
      if (!commit || !commit.author) {
        return acc;
      }
      const author = truncateText(commit.author, 12);
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Include ALL users with more than 25 commits, sorted by count
    const sortedUsers = Object.entries(commitsByUser)
      .filter(([, count]) => count > 25)
      .sort(([, a], [, b]) => b - a);

    return {
      labels: sortedUsers.map(([user]) => user),
      datasets: [
        {
          label: 'Commits',
          data: sortedUsers.map(([, count]) => count),
          backgroundColor: PROJECT_COLORS.chartBlue,
          borderColor: PROJECT_COLORS.chartBorderCommit,
          borderWidth: 1,
        },
      ],
    };
  }, [commits]);

  const prChartData = useMemo(() => {
    // Ensure we have valid PRs data
    if (!Array.isArray(pullRequests) || pullRequests.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Pull Requests',
          data: [],
          backgroundColor: PROJECT_COLORS.chartBlueAlt,
          borderColor: PROJECT_COLORS.chartBorderPR,
          borderWidth: 1,
        }],
      };
    }
    
    const prsByUser = pullRequests.reduce((acc, pr) => {
      // Ensure PR has required fields
      if (!pr || !pr.author) {
        return acc;
      }
      const author = truncateText(pr.author, 12);
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Include ALL users with more than 10 PRs, sorted by count
    const sortedUsers = Object.entries(prsByUser)
      .filter(([, count]) => count > 10)
      .sort(([, a], [, b]) => b - a);

    return {
      labels: sortedUsers.map(([user]) => user),
      datasets: [
        {
          label: 'Pull Requests',
          data: sortedUsers.map(([, count]) => count),
          backgroundColor: PROJECT_COLORS.chartBlueAlt,
          borderColor: PROJECT_COLORS.chartBorderPR,
          borderWidth: 1,
        },
      ],
    };
  }, [pullRequests]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  if (process.env.NODE_ENV === 'development') {
    console.group('📊 Chart Data Preparation');
    console.time('Chart Data Prep');
    console.log(`📊 Total commits: ${commits.length}`);
    console.log(`📋 Total PRs: ${pullRequests.length}`);
    console.log(`📊 Commit Chart: ${commitChartData.labels.length} contributors with 25+ commits`);
    console.log(`📋 PR Chart: ${prChartData.labels.length} contributors with 10+ PRs`);
    
    // Log the actual data for debugging
    if (commitChartData.labels.length > 0) {
      console.log('📊 Top commit contributors:', 
        commitChartData.labels.slice(0, 3).map((label, i) => 
          `${label}: ${commitChartData.datasets[0].data[i]}`
        ).join(', ')
      );
    }
    
    if (prChartData.labels.length > 0) {
      console.log('📋 Top PR contributors:', 
        prChartData.labels.slice(0, 3).map((label, i) => 
          `${label}: ${prChartData.datasets[0].data[i]}`
        ).join(', ')
      );
    }
    
    console.timeEnd('Chart Data Prep');
    console.groupEnd();
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          📊 Activity Charts
        </Typography>
        
        {earliestDataInfo && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontStyle: 'italic',
              opacity: 0.7,
              fontSize: '0.75rem'
            }}
          >
            Data from {earliestDataInfo.date} ({earliestDataInfo.totalItems} items)
          </Typography>
        )}
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom align="center">
              Commit Activity (Contributors with 25+ commits)
            </Typography>
            <Box sx={{ height: 350 }}>
              <Bar data={commitChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom align="center">
              Pull Request Activity (Contributors with 10+ PRs)
            </Typography>
            <Box sx={{ height: 350 }}>
              <Bar data={prChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}