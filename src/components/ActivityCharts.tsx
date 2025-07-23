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
  const commitChartData = useMemo(() => {
    const commitsByUser = commits.reduce((acc, commit) => {
      const author = truncateText(commit.author, 12);
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedUsers = Object.entries(commitsByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

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
    const prsByUser = pullRequests.reduce((acc, pr) => {
      const author = truncateText(pr.author, 12);
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedUsers = Object.entries(prsByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

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
    console.log(`📊 Commit Chart: ${commitChartData.labels.length} contributors`);
    console.log(`📋 PR Chart: ${prChartData.labels.length} contributors`);
    console.timeEnd('Chart Data Prep');
    console.groupEnd();
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        📊 Activity Charts
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom align="center">
              Commit Activity
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={commitChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom align="center">
              Pull Request Activity
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={prChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}