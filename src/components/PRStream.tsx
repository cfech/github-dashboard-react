'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Link,
  Stack
} from '@mui/material';
import { MergeType as PullRequest, AccessTime } from '@mui/icons-material';
import { GitHubPR } from '@/types/github';
import { formatTimestampToLocal, getDateColorAndEmoji, isTimestampTodayLocal, truncateText } from '@/utils/dateUtils';
import { CONFIG, PR_STATUS_EMOJIS } from '@/lib/constants';
import { PROJECT_COLORS } from '@/lib/theme';

interface PRStreamProps {
  pullRequests: GitHubPR[];
}

function PRItem({ pr }: { pr: GitHubPR }) {
  const [dateColor, timelineEmoji] = getDateColorAndEmoji(pr.created_at);
  const isToday = isTimestampTodayLocal(pr.created_at);
  const formattedDate = formatTimestampToLocal(pr.created_at);
  const truncatedTitle = truncateText(pr.title, CONFIG.PR_TITLE_MAX_LENGTH);
  
  const getStatusStyles = (state: string) => {
    switch (state) {
      case 'Open':
        return {
          bgcolor: PROJECT_COLORS.openPRBg,
          color: PROJECT_COLORS.openPRText,
        };
      case 'Merged':
        return {
          bgcolor: PROJECT_COLORS.mergedPRBg,
          color: PROJECT_COLORS.mergedPRText,
        };
      case 'Closed':
        return {
          bgcolor: PROJECT_COLORS.closedPRBg,
          color: PROJECT_COLORS.closedPRText,
        };
      default:
        return {
          bgcolor: '#f5f5f5',
          color: '#666666',
        };
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 1,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link href={pr.repo_url} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
            {pr.repo.split('/')[1]}
          </Link>
          {isToday && (
            <Chip
              label="TODAY"
              size="small"
              sx={{
                background: 'linear-gradient(45deg, #ff8f00, #f57c00)',
                color: 'white',
                fontWeight: 600,
                fontSize: '9px',
                height: '20px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: dateColor }}>
          {timelineEmoji}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <PullRequest sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Link 
          href={pr.url} 
          target="_blank" 
          rel="noopener"
          sx={{ fontWeight: 500 }}
        >
          #{pr.number}
        </Link>
        <Chip 
          label={`${PR_STATUS_EMOJIS[pr.state] || ''} ${pr.state}`}
          size="small"
          sx={getStatusStyles(pr.state)}
        />
      </Box>
      
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1,
          color: 'text.primary',
          lineHeight: 1.4,
          fontWeight: 500
        }}
      >
        {truncatedTitle}
      </Typography>
      
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          by {pr.author}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: dateColor }}>
            {formattedDate}
          </Typography>
        </Box>
        {pr.merged_at && (
          <Typography variant="caption" color="success.main">
            Merged {formatTimestampToLocal(pr.merged_at)}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

export default function PRStream({ pullRequests }: PRStreamProps) {
  const recentPRs = pullRequests
    .filter(pr => {
      const prDate = new Date(pr.created_at);
      const cutoffDate = new Date(Date.now() - CONFIG.LOOK_BACK_DAYS * 24 * 60 * 60 * 1000);
      return prDate >= cutoffDate;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🔀 Pull Request Stream
        <Chip label={`${recentPRs.length} PRs`} size="small" />
      </Typography>
      
      <Box 
        sx={{ 
          height: CONFIG.STREAM_CONTAINER_HEIGHT,
          overflowY: 'auto',
          pr: 1
        }}
      >
        {recentPRs.length > 0 ? (
          recentPRs.map((pr, index) => (
            <PRItem key={`${pr.repo}-${pr.number}-${index}`} pr={pr} />
          ))
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No pull requests found in the last {CONFIG.LOOK_BACK_DAYS} days
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}