'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tooltip
} from '@mui/material';
import { GitHubCommit } from '@/types/github';

interface ActivityHeatmapProps {
  commits: GitHubCommit[];
}

interface HeatmapData {
  [day: number]: { [hour: number]: number };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmap({ commits }: ActivityHeatmapProps) {
  const heatmapData = useMemo<HeatmapData>(() => {
    const startTime = performance.now();
    
    const data: HeatmapData = {};
    
    // Initialize data structure
    for (let day = 0; day < 7; day++) {
      data[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        data[day][hour] = 0;
      }
    }
    
    // Process commits
    commits.forEach(commit => {
      const date = new Date(commit.date);
      const day = date.getDay();
      const hour = date.getHours();
      data[day][hour]++;
    });
    
    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now();
      console.group('🔥 Heatmap Data Aggregation');
      console.log(`🔥 Heatmap Aggregation: ${(endTime - startTime).toFixed(1)}ms (processed ${commits.length} commits)`);
      console.groupEnd();
    }
    
    return data;
  }, [commits]);

  const getIntensityColor = (count: number): string => {
    if (count === 0) return '#f0f0f0';
    if (count <= 2) return '#c6e48b';
    if (count <= 5) return '#7bc96f';
    if (count <= 10) return '#239a3b';
    return '#196127';
  };

  const getMaxCount = () => {
    let max = 0;
    Object.values(heatmapData).forEach(dayData => {
      Object.values(dayData).forEach(count => {
        max = Math.max(max, count as number);
      });
    });
    return max;
  };

  const maxCount = getMaxCount();

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        🔥 Activity Heatmap - Most Active Hours
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Commit activity by day of week and hour (local time)
        </Typography>
        
        <Box sx={{ width: '100%' }}>
          {/* Hour labels */}
          <Box sx={{ 
            display: 'flex', 
            mb: 1, 
            ml: { xs: 3, sm: 4 },
            width: 'calc(100% - 32px)'
          }}>
            {HOURS.map(hour => (
              <Box 
                key={hour} 
                sx={{ 
                  flex: 1,
                  minWidth: 0,
                  height: 20, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'text.secondary'
                }}
              >
                {hour % 4 === 0 ? hour : ''}
              </Box>
            ))}
          </Box>
          
          {/* Heatmap grid */}
          {DAYS.map((dayName, dayIndex) => (
            <Box key={dayName} sx={{ display: 'flex', alignItems: 'center', mb: 0.5, width: '100%' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  width: { xs: 24, sm: 30 },
                  minWidth: { xs: 24, sm: 30 },
                  fontSize: '12px', 
                  color: 'text.secondary',
                  textAlign: 'right',
                  mr: 1
                }}
              >
                {dayName}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flex: 1,
                gap: { xs: '1px', sm: '2px' }
              }}>
                {HOURS.map(hour => {
                  const count = heatmapData[dayIndex][hour];
                  return (
                    <Tooltip
                      key={`${dayIndex}-${hour}`}
                      title={`${dayName} ${hour}:00 - ${count} commit${count !== 1 ? 's' : ''}`}
                      placement="top"
                    >
                      <Box
                        sx={{
                          flex: 1,
                          aspectRatio: '1',
                          minWidth: { xs: '8px', sm: '12px' },
                          maxWidth: '24px',
                          backgroundColor: getIntensityColor(count),
                          border: '1px solid #e0e0e0',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          '&:hover': {
                            opacity: 0.8,
                          }
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Less
          </Typography>
          {[0, 1, 3, 6, 11].map(threshold => (
            <Box
              key={threshold}
              sx={{
                width: 12,
                height: 12,
                backgroundColor: getIntensityColor(threshold),
                border: '1px solid #e0e0e0',
                borderRadius: '1px'
              }}
            />
          ))}
          <Typography variant="caption" color="text.secondary">
            More
          </Typography>
        </Box>
        
        {maxCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            Peak activity: {maxCount} commits in a single hour
          </Typography>
        )}
      </Paper>
    </Box>
  );
}