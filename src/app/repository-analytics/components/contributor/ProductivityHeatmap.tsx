'use client';

import React, { useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Alert } from '@mui/material';
import { ResponsiveCalendar } from '@nivo/calendar';
import { GitHubCommit } from '@/types/github';
import { TimeFrame } from '../ContributorAnalytics';

interface ProductivityHeatmapProps {
  commits: GitHubCommit[];
  timeFrame: TimeFrame;
}

interface CalendarData {
  day: string;
  value: number;
}

interface HourlyData {
  hour: number;
  commits: number;
  percentage: number;
}

interface DailyData {
  day: string;
  dayName: string;
  commits: number;
  percentage: number;
}

export default function ProductivityHeatmap({ commits, timeFrame }: ProductivityHeatmapProps) {

  // Calculate hourly productivity pattern
  const hourlyData = useMemo(() => {
    const hourlyCommits = new Array(24).fill(0);
    
    commits.forEach(commit => {
      const date = new Date(commit.date);
      const hour = date.getHours();
      hourlyCommits[hour]++;
    });

    const totalCommits = commits.length;
    
    return hourlyCommits.map((commits, hour) => ({
      hour,
      commits,
      percentage: totalCommits > 0 ? (commits / totalCommits) * 100 : 0
    }));
  }, [commits]);

  // Calculate daily productivity pattern
  const dailyData = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyCommits = new Array(7).fill(0);
    
    commits.forEach(commit => {
      const date = new Date(commit.date);
      const dayOfWeek = date.getDay();
      dailyCommits[dayOfWeek]++;
    });

    const totalCommits = commits.length;
    
    return dailyCommits.map((commits, index) => ({
      day: index.toString(),
      dayName: dayNames[index],
      commits,
      percentage: totalCommits > 0 ? (commits / totalCommits) * 100 : 0
    }));
  }, [commits]);


  const maxHourlyCommits = Math.max(...hourlyData.map(d => d.commits), 1);
  const maxDailyCommits = Math.max(...dailyData.map(d => d.commits), 1);

  return (
    <Box>
      
      <Grid container spacing={3}>

        {/* Hourly Pattern */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hourly Activity Pattern
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {hourlyData.map(({ hour, commits, percentage }) => (
                  <Box
                    key={hour}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: `rgba(76, 149, 108, ${commits / maxHourlyCommits})`,
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: commits > maxHourlyCommits * 0.5 ? 'white' : 'black',
                      cursor: 'pointer',
                      borderRadius: 1,
                      position: 'relative'
                    }}
                    title={`${hour}:00 - ${commits} commits (${percentage.toFixed(1)}%)`}
                  >
                    {hour}
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Hours are displayed in 24-hour format. Darker colors indicate higher activity.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Pattern */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Activity Pattern
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {dailyData.map(({ day, dayName, commits, percentage }) => (
                  <Box
                    key={day}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ width: 80, fontWeight: 'medium' }}>
                      {dayName}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        height: 24,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${(commits / maxDailyCommits) * 100}%`,
                          backgroundColor: '#4c956c',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ width: 60, textAlign: 'right' }}>
                      {commits} ({percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}