'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  TextField,
  Autocomplete,
  Typography,
  List,
  ListItem,
  Link,
  Chip,
  Stack,
  InputAdornment,
  CircularProgress,
  Paper
} from '@mui/material';
import { Close, Search, Clear, MergeType as PullRequest } from '@mui/icons-material';
import { GitHubPR } from '@/types/github';
import { usePRSearch } from '@/hooks/useSearch';
import { formatTimestampToLocal, getDateColorAndEmoji, isTimestampTodayLocal, truncateText } from '@/utils/dateUtils';
import { CONFIG, PR_STATUS_EMOJIS } from '@/lib/constants';

interface PRDetailsModalProps {
  open: boolean;
  onClose: () => void;
  pullRequests: GitHubPR[];
  initialContributor: string;
  contributors: string[]; // All contributors from chart
}

export default function PRDetailsModal({ 
  open, 
  onClose, 
  pullRequests, 
  initialContributor, 
  contributors 
}: PRDetailsModalProps) {
  const [selectedContributor, setSelectedContributor] = useState<string>(initialContributor);
  const [visibleResultsCount, setVisibleResultsCount] = useState<number>(50);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>(''); // Add local search state for debugging
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Filter PRs for selected contributor
  const contributorPRs = useMemo(() => {
    return pullRequests.filter(pr => 
      truncateText(pr.author, 12) === selectedContributor
    );
  }, [pullRequests, selectedContributor]);

  // Use search hook
  const {
    searchTerm,
    searchResults,
    handleSearchChange,
    clearSearch,
    isSearching
  } = usePRSearch(contributorPRs);

  // Visible results with lazy loading
  const visibleResults = useMemo(() => {
    return searchResults.slice(0, visibleResultsCount);
  }, [searchResults, visibleResultsCount]);

  // Reset search when contributor changes
  useEffect(() => {
    setLocalSearchTerm('');
    clearSearch();
    setVisibleResultsCount(50);
  }, [selectedContributor]); // Removed clearSearch from dependencies

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedContributor(initialContributor);
      setLocalSearchTerm('');
      setVisibleResultsCount(50);
    }
  }, [open, initialContributor]);

  // Lazy loading on scroll
  const handleScroll = useCallback(() => {
    if (!resultsContainerRef.current || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = resultsContainerRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (scrolledToBottom && visibleResultsCount < searchResults.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleResultsCount(prev => Math.min(prev + 50, searchResults.length));
        setIsLoadingMore(false);
      }, 200);
    }
  }, [isLoadingMore, visibleResultsCount, searchResults.length]);

  useEffect(() => {
    const container = resultsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Render PR item (consistent with global search)
  const renderPRItem = (pr: GitHubPR, index: number) => {
    const [colorClass, emoji] = getDateColorAndEmoji(pr.created_at);
    const isToday = isTimestampTodayLocal(pr.created_at);
    const statusEmoji = PR_STATUS_EMOJIS[pr.state] || '📝';

    return (
      <ListItem
        key={`${pr.repo}-${pr.number}-${index}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          py: 1.5,
          px: 2,
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
          <PullRequest sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
          <Link
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              textDecoration: 'none', 
              flexGrow: 1,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <Typography variant="body2" component="div" sx={{ fontWeight: 500, color: 'inherit' }}>
              {highlightSearchTerms(truncateText(pr.title, CONFIG.PR_TITLE_MAX_LENGTH), searchTerm)}
            </Typography>
          </Link>
          {isToday && (
            <Chip
              label="TODAY"
              size="small"
              sx={{
                ml: 1,
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: 'secondary.main',
                color: 'secondary.contrastText',
                fontWeight: 'bold',
              }}
            />
          )}
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Typography variant="caption" sx={{ color: colorClass }}>
            {emoji} {formatTimestampToLocal(pr.created_at)}
          </Typography>
          
          <Link
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              fontWeight: 500,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            #{pr.number}
          </Link>
          
          <Typography variant="caption" color="text.secondary">
            by {highlightSearchTerms(pr.author, searchTerm)}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: pr.state === 'Open' ? 'success.main' : pr.state === 'Merged' ? 'primary.main' : 'text.secondary'
            }}
          >
            {statusEmoji} {pr.state}
          </Typography>
          
          <Link
            href={pr.repo_url || `https://github.com/${pr.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {pr.repo.split('/')[1]}
          </Link>
          
          {pr.merged_at && (
            <Typography variant="caption" color="success.main">
              Merged {formatTimestampToLocal(pr.merged_at)}
            </Typography>
          )}
        </Stack>
      </ListItem>
    );
  };

  // Highlight search terms (reused from global search)
  const highlightSearchTerms = (text: string, searchTerms: string) => {
    if (!searchTerms || searchTerms.length < 2) return text;

    const terms = searchTerms.toLowerCase().split(' ').filter(term => term.length > 0);
    let result: React.ReactNode = text;

    for (const singleTerm of terms) {
      const escapedTerm = singleTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      
      if (typeof result === 'string') {
        const parts: string[] = result.split(regex);
        result = parts.map((part: string, index: number) =>
          regex.test(part) ? (
            <mark key={`${singleTerm}-${index}`} style={{ backgroundColor: '#ffeb3b', padding: '1px 2px', borderRadius: '2px' }}>
              {part}
            </mark>
          ) : (
            part
          )
        );
      }
    }

    return result;
  };

  const contributorOptions = contributors.map(contributor => ({
    label: contributor,
    value: contributor
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '50%',
          height: '70%',
          maxHeight: '70vh',
          maxWidth: '50vw'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            📋 Pull Requests by {selectedContributor} ({contributorPRs.length} total)
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search and Filter Controls */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Stack direction="row" spacing={2} alignItems="center">
            <Autocomplete
              options={contributorOptions}
              value={{ label: selectedContributor, value: selectedContributor }}
              onChange={(_, newValue) => {
                if (newValue) {
                  setSelectedContributor(newValue.value);
                }
              }}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Contributor"
                  size="small"
                  sx={{ minWidth: 200 }}
                />
              )}
              sx={{ flexShrink: 0 }}
            />
            
            <TextField
              fullWidth
              size="small"
              placeholder="Search pull requests..."
              value={localSearchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                setLocalSearchTerm(newValue);
                handleSearchChange(newValue);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: localSearchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => {
                      setLocalSearchTerm('');
                      clearSearch();
                    }}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            </Stack>
          </form>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {isSearching 
              ? `${searchResults.length} pull requests match your search`
              : `Showing ${Math.min(visibleResultsCount, searchResults.length)} of ${searchResults.length} pull requests`
            }
          </Typography>
        </Box>

        {/* Results List */}
        <Box
          ref={resultsContainerRef}
          sx={{
            height: 'calc(100% - 120px)',
            overflow: 'auto',
          }}
        >
          {visibleResults.length > 0 ? (
            <List sx={{ p: 0 }}>
              {visibleResults.map((pr, index) => renderPRItem(pr, index))}
              
              {/* Loading indicator */}
              {isLoadingMore && (
                <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </ListItem>
              )}
              
              {/* Load more indicator */}
              {!isLoadingMore && visibleResultsCount < searchResults.length && (
                <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Scroll down to load more pull requests...
                  </Typography>
                </ListItem>
              )}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {isSearching 
                  ? 'No pull requests match your search criteria'
                  : 'No pull requests found for this contributor'
                }
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}