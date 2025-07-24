'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Link,
  Stack,
  CircularProgress
} from '@mui/material';
import { AccountTree as GitBranch, AccessTime } from '@mui/icons-material';
import { GitHubCommit } from '@/types/github';
import { formatTimestampToLocal, getDateColorAndEmoji, isTimestampTodayLocal, truncateText } from '@/utils/dateUtils';
import { CONFIG } from '@/lib/constants';

interface CommitStreamProps {
  commits: GitHubCommit[];
}

const ITEMS_PER_PAGE = 20;

function CommitItem({ commit }: { commit: GitHubCommit }) {
  const [dateColor, timelineEmoji] = getDateColorAndEmoji(commit.date);
  const isToday = isTimestampTodayLocal(commit.date);
  const formattedDate = formatTimestampToLocal(commit.date);
  const truncatedMessage = truncateText(commit.message, CONFIG.COMMIT_MESSAGE_MAX_LENGTH);

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
          <Link href={commit.repo_url} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
            {commit.repo.split('/')[1]}
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
        <GitBranch sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {commit.branch_name}
        </Typography>
      </Box>
      
      <Typography 
        variant="body2" 
        sx={{ 
          fontStyle: 'italic', 
          mb: 1,
          color: 'text.secondary',
          lineHeight: 1.4
        }}
      >
        {truncatedMessage}
      </Typography>
      
      <Stack direction="row" spacing={2} alignItems="center">
        <Link 
          href={commit.url} 
          target="_blank" 
          rel="noopener"
          sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
        >
          {commit.sha}
        </Link>
        <Typography variant="body2" color="text.secondary">
          {commit.author}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: dateColor }}>
            {formattedDate}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function CommitStream({ commits }: CommitStreamProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sort all commits (show ALL commits, not filtered by date)
  const sortedCommits = useMemo(() => {
    return commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commits]);

  // Get currently visible commits
  const visibleCommits = useMemo(() => {
    return sortedCommits.slice(0, visibleCount);
  }, [sortedCommits, visibleCount]);

  const hasMore = visibleCount < sortedCommits.length;

  // Load more commits function
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, sortedCommits.length));
      setIsLoading(false);
    }, 100);
  }, [isLoading, hasMore, sortedCommits.length]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollThreshold = 200; // Load more when 200px from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      loadMore();
    }
  }, [loadMore, isLoading, hasMore]);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        📝 Commit Stream
        <Chip label={`${visibleCommits.length}/${sortedCommits.length} commits`} size="small" />
      </Typography>
      
      <Box 
        ref={scrollContainerRef}
        sx={{ 
          height: CONFIG.STREAM_CONTAINER_HEIGHT,
          overflowY: 'auto',
          pr: 1
        }}
      >
        {sortedCommits.length > 0 ? (
          <>
            {visibleCommits.map((commit, index) => (
              <CommitItem key={`${commit.repo}-${commit.sha}-${index}`} commit={commit} />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Loading more commits...
                </Typography>
              </Box>
            )}
            
            {/* End of list indicator */}
            {!hasMore && sortedCommits.length > ITEMS_PER_PAGE && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  All {sortedCommits.length} commits loaded
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No commits found
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}