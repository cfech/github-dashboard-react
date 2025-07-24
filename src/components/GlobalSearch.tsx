'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  List,
  ListItem,
  Link,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import { Search, Clear, GitHub, MergeType as PullRequest } from '@mui/icons-material';
import { GitHubCommit, GitHubPR, SearchIndex } from '@/types/github';
import { formatTimestampToLocal, getDateColorAndEmoji, isTimestampTodayLocal, truncateText } from '@/utils/dateUtils';
import { CONFIG, PR_STATUS_EMOJIS } from '@/lib/constants';

interface GlobalSearchProps {
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
  onSearchChange: (searchTerm: string) => void;
}

interface SearchResult {
  type: 'commit' | 'pr';
  data: GitHubCommit | GitHubPR;
  relevanceScore: number;
}

export default function GlobalSearch({ commits, pullRequests, onSearchChange }: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [showResults, setShowResults] = useState<boolean>(false);
  const [visibleResultsCount, setVisibleResultsCount] = useState<number>(50);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Build enhanced search index with pre-computed search strings
  const searchIndex = useMemo<SearchIndex>(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Search Index Building');
      console.time('Search Index Building');
    }

    const index: SearchIndex = {
      commits: commits.map(commit => ({
        id: `${commit.repo}-${commit.sha}`,
        // Pre-compute comprehensive search text including all searchable fields
        searchText: [
          commit.message,
          commit.author,
          commit.repo,
          commit.branch_name,
          commit.sha
        ].join(' ').toLowerCase(),
        originalData: commit
      })),
      prs: pullRequests.map(pr => ({
        id: `${pr.repo}-${pr.number}`,
        // Pre-compute comprehensive search text including all searchable fields
        searchText: [
          pr.title,
          pr.author,
          pr.repo,
          pr.number.toString(),
          pr.state
        ].join(' ').toLowerCase(),
        originalData: pr
      }))
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Search Index: indexed ${index.commits.length + index.prs.length} items`);
      console.timeEnd('Search Index Building');
      console.groupEnd();
    }

    return index;
  }, [commits, pullRequests]);

  // Optimized search results with early termination and caching
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) return [];

    const startTime = performance.now();
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
    const searchTerms = lowerSearchTerm.split(' ').filter(term => term.length > 0);
    const results: SearchResult[] = [];

    // Helper function for optimized relevance scoring
    const calculateRelevanceScore = (text: string, terms: string[]): number => {
      let score = 0;
      
      for (const term of terms) {
        const termIndex = text.indexOf(term);
        if (termIndex === -1) continue;
        
        if (termIndex === 0) score += 15; // Starts with term
        else if (text.indexOf(` ${term}`) >= 0) score += 10; // Word boundary
        else score += 5; // Contains term anywhere
        
        // Bonus for exact matches
        if (text === term) score += 20;
      }
      
      return score;
    };

    // Combined search with early termination for performance
    const searchItems = [
      ...searchIndex.commits.map(item => ({ ...item, type: 'commit' as const })),
      ...searchIndex.prs.map(item => ({ ...item, type: 'pr' as const }))
    ];

    // Search all items (no early termination for infinite scroll)
    for (const { searchText, originalData, type } of searchItems) {
      // Check if all search terms are present (AND logic for multiple terms)
      const matchesAllTerms = searchTerms.every(term => searchText.includes(term));
      
      if (matchesAllTerms) {
        const relevanceScore = calculateRelevanceScore(searchText, searchTerms);
        
        // Only include results with meaningful relevance
        if (relevanceScore > 0) {
          results.push({
            type,
            data: originalData,
            relevanceScore
          });
        }
      }
    }

    // Optimized sorting: sort only the results we found
    results.sort((a, b) => {
      // Primary sort: relevance score
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort: date (more recent first)
      const aDate = a.type === 'commit' ? (a.data as GitHubCommit).date : (a.data as GitHubPR).created_at;
      const bDate = b.type === 'commit' ? (b.data as GitHubCommit).date : (b.data as GitHubPR).created_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now();
      console.group('🔍 Search Performance');
      console.log(`🔍 Search query: "${debouncedSearchTerm}" (${searchTerms.length} terms)`);
      console.log(`📊 Results: ${results.length} items found in ${(endTime - startTime).toFixed(1)}ms`);
      console.log(`💾 Index size: ${searchIndex.commits.length + searchIndex.prs.length} total items`);
      console.log(`⚡ Performance: ${((searchIndex.commits.length + searchIndex.prs.length) / (endTime - startTime) * 1000).toFixed(0)} items/second`);
      console.log(`🔄 Infinite scroll ready: ${results.length} total results available`);
      console.groupEnd();
    }

    return results;
  }, [debouncedSearchTerm, searchIndex]);

  // Debounce search input for better performance
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // Reduced from 300ms to 150ms for more responsive feel

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setShowResults(value.trim().length > 0);
    setVisibleResultsCount(50); // Reset to initial count
    onSearchChange(value);
  }, [onSearchChange]);

  // Load more results for infinite scroll
  const loadMoreResults = useCallback(() => {
    if (isLoadingMore || visibleResultsCount >= searchResults.length) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleResultsCount(prev => Math.min(prev + 50, searchResults.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, visibleResultsCount, searchResults.length]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = resultsContainerRef.current;
    if (!container || isLoadingMore || visibleResultsCount >= searchResults.length) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollThreshold = 200; // Load more when 200px from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      loadMoreResults();
    }
  }, [loadMoreResults, isLoadingMore, visibleResultsCount, searchResults.length]);

  // Set up scroll listener
  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Optimized highlight function with memoization
  const highlightMatch = useCallback((text: string, term: string) => {
    if (!term || !text) return text;
    
    try {
      // Split multiple terms and highlight each
      const terms = term.toLowerCase().split(' ').filter(t => t.length > 0);
      let result: React.ReactNode = text;
      
      for (const singleTerm of terms) {
        const escapedTerm = singleTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        if (typeof result === 'string') {
          const parts = result.split(regex);
          result = parts.map((part, index) =>
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
    } catch (error) {
      // If regex fails, return original text
      return text;
    }
  }, []);

  const displayResults = useMemo(() => {
    return searchResults.slice(0, visibleResultsCount);
  }, [searchResults, visibleResultsCount]);

  const hasMoreResults = visibleResultsCount < searchResults.length;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        🔍 Global Search
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search commits and PRs by message, author, repository, branch, or SHA..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSearchChange('')} size="small">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        {showResults && (
          <>
            <Box sx={{ mt: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchResults.length > 0 
                  ? `${searchResults.length} results found (showing ${displayResults.length})`
                  : debouncedSearchTerm.length < 2 
                    ? 'Type at least 2 characters to search'
                    : 'No results found'
                }
              </Typography>
              {debouncedSearchTerm !== searchTerm && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Searching...
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {searchResults.length > 0 && (
              <Box 
                ref={resultsContainerRef}
                sx={{ maxHeight: 400, overflow: 'auto' }}
              >
                <List dense>
                  {displayResults.map((result, index) => (
                    <ListItem key={`${result.type}-${result.data.repo}-${index}`} sx={{ px: 0, py: 1 }}>
                      <Box sx={{ width: '100%' }}>
                        {result.type === 'commit' ? (
                          <CommitSearchResult 
                            commit={result.data as GitHubCommit} 
                            searchTerm={debouncedSearchTerm}
                            highlightMatch={highlightMatch}
                          />
                        ) : (
                          <PRSearchResult 
                            pr={result.data as GitHubPR} 
                            searchTerm={debouncedSearchTerm}
                            highlightMatch={highlightMatch}
                          />
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
                
                {/* Loading indicator for infinite scroll */}
                {isLoadingMore && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading more results...
                    </Typography>
                  </Box>
                )}
                
                {/* End of results indicator */}
                {!hasMoreResults && searchResults.length > 50 && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      All {searchResults.length} results loaded
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

const CommitSearchResult = React.memo(function CommitSearchResult({ 
  commit, 
  searchTerm, 
  highlightMatch 
}: { 
  commit: GitHubCommit; 
  searchTerm: string;
  highlightMatch: (text: string, term: string) => React.ReactNode;
}) {
  const [dateColor, timelineEmoji] = getDateColorAndEmoji(commit.date);
  const isToday = isTimestampTodayLocal(commit.date);

  return (
    <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <GitHub sx={{ fontSize: 16, color: 'text.secondary' }} />
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
              fontSize: '8px',
              height: '16px',
            }}
          />
        )}
        <Typography variant="caption" sx={{ color: dateColor }}>
          {timelineEmoji}
        </Typography>
      </Stack>
      
      <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 0.5 }}>
        {highlightMatch(truncateText(commit.message, CONFIG.COMMIT_MESSAGE_MAX_LENGTH), searchTerm)}
      </Typography>
      
      <Stack direction="row" spacing={2} alignItems="center">
        <Link href={commit.url} target="_blank" rel="noopener" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {commit.sha}
        </Link>
        <Typography variant="caption">
          {highlightMatch(commit.author, searchTerm)}
        </Typography>
        <Typography variant="caption" sx={{ color: dateColor }}>
          {formatTimestampToLocal(commit.date)}
        </Typography>
      </Stack>
    </Box>
  );
});

const PRSearchResult = React.memo(function PRSearchResult({ 
  pr, 
  searchTerm, 
  highlightMatch 
}: { 
  pr: GitHubPR; 
  searchTerm: string;
  highlightMatch: (text: string, term: string) => React.ReactNode;
}) {
  const [dateColor, timelineEmoji] = getDateColorAndEmoji(pr.created_at);
  const isToday = isTimestampTodayLocal(pr.created_at);

  return (
    <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <PullRequest sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Link href={pr.repo_url} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
          {pr.repo.split('/')[1]}
        </Link>
        <Link href={pr.url} target="_blank" rel="noopener" sx={{ fontWeight: 500 }}>
          #{pr.number}
        </Link>
        <Chip 
          label={`${PR_STATUS_EMOJIS[pr.state] || ''} ${pr.state}`}
          size="small"
          variant="outlined"
        />
        {isToday && (
          <Chip
            label="TODAY"
            size="small"
            sx={{
              background: 'linear-gradient(45deg, #ff8f00, #f57c00)',
              color: 'white',
              fontWeight: 600,
              fontSize: '8px',
              height: '16px',
            }}
          />
        )}
        <Typography variant="caption" sx={{ color: dateColor }}>
          {timelineEmoji}
        </Typography>
      </Stack>
      
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
        {highlightMatch(truncateText(pr.title, CONFIG.PR_TITLE_MAX_LENGTH), searchTerm)}
      </Typography>
      
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption">
          by {highlightMatch(pr.author, searchTerm)}
        </Typography>
        <Typography variant="caption" sx={{ color: dateColor }}>
          {formatTimestampToLocal(pr.created_at)}
        </Typography>
        {pr.merged_at && (
          <Typography variant="caption" color="success.main">
            Merged {formatTimestampToLocal(pr.merged_at)}
          </Typography>
        )}
      </Stack>
    </Box>
  );
});