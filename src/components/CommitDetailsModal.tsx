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
} from '@mui/material';
import { Close, Search, Clear, GitHub } from '@mui/icons-material';
import { GitHubCommit } from '@/types/github';
import { useCommitSearch } from '@/hooks/useSearch';
import { formatTimestampToLocal, getDateColorAndEmoji, isTimestampTodayLocal, truncateText } from '@/utils/dateUtils';
import { CONFIG } from '@/lib/constants';

interface CommitDetailsModalProps {
  open: boolean;
  onClose: () => void;
  commits: GitHubCommit[];
  initialContributor: string;
  contributors: string[]; // All contributors from chart
}

export default function CommitDetailsModal({ 
  open, 
  onClose, 
  commits, 
  initialContributor, 
  contributors 
}: CommitDetailsModalProps) {
  const [selectedContributor, setSelectedContributor] = useState<string>(initialContributor);
  const [visibleResultsCount, setVisibleResultsCount] = useState<number>(50);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>(''); // Add local search state for debugging
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Filter commits for selected contributor
  const contributorCommits = useMemo(() => {
    return commits.filter(commit => 
      truncateText(commit.author, 12) === selectedContributor
    );
  }, [commits, selectedContributor]);

  // Use search hook
  const {
    searchTerm,
    searchResults,
    handleSearchChange,
    clearSearch,
    isSearching
  } = useCommitSearch(contributorCommits);

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

  // Render commit item (consistent with global search)
  const renderCommitItem = (commit: GitHubCommit, index: number) => {
    const [colorClass, emoji] = getDateColorAndEmoji(commit.date);
    const isToday = isTimestampTodayLocal(commit.date);

    return (
      <ListItem
        key={`${commit.repo}-${commit.sha}-${index}`}
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
          <GitHub sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
          <Link
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              textDecoration: 'none', 
              flexGrow: 1,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <Typography variant="body2" component="div" sx={{ fontWeight: 500, color: 'inherit' }}>
              {highlightSearchTerms(truncateText(commit.message, CONFIG.COMMIT_MESSAGE_MAX_LENGTH), searchTerm)}
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
            {emoji} {formatTimestampToLocal(commit.date)}
          </Typography>
          
          <Link
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              fontFamily: 'monospace', 
              fontSize: '0.875rem',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {commit.sha}
          </Link>
          
          <Typography variant="caption" color="text.secondary">
            {highlightSearchTerms(commit.author, searchTerm)}
          </Typography>
          
          <Typography variant="caption" color="primary.main">
            {truncateText(commit.branch_name, 20)}
          </Typography>
          
          <Link
            href={commit.repo_url || `https://github.com/${commit.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {commit.repo.split('/')[1]}
          </Link>
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
            📊 Commits by {selectedContributor} ({contributorCommits.length} total)
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
              placeholder="Search commits..."
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
              ? `${searchResults.length} commits match your search`
              : `Showing ${Math.min(visibleResultsCount, searchResults.length)} of ${searchResults.length} commits`
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
              {visibleResults.map((commit, index) => renderCommitItem(commit, index))}
              
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
                    Scroll down to load more commits...
                  </Typography>
                </ListItem>
              )}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {isSearching 
                  ? 'No commits match your search criteria'
                  : 'No commits found for this contributor'
                }
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}