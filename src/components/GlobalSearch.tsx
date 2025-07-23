'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Stack
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
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);

  // Build search index
  const searchIndex = useMemo<SearchIndex>(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Search Index Building');
      console.time('Search Index Building');
    }

    const index: SearchIndex = {
      commits: commits.map(commit => ({
        id: `${commit.repo}-${commit.sha}`,
        searchText: `${commit.message} ${commit.author}`.toLowerCase(),
        originalData: commit
      })),
      prs: pullRequests.map(pr => ({
        id: `${pr.repo}-${pr.number}`,
        searchText: `${pr.title} ${pr.author}`.toLowerCase(),
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

  // Debounced search results
  const searchResults = useMemo(() => {
    // Helper function for calculating search relevance
    const calculateRelevanceScore = (text: string, term: string): number => {
      let score = 0;
      const termIndex = text.indexOf(term);
      
      if (termIndex === 0) score += 10; // Starts with term
      else if (termIndex > 0) score += 5; // Contains term
      
      const wordBoundaryIndex = text.indexOf(` ${term}`);
      if (wordBoundaryIndex >= 0) score += 5; // Word boundary
      
      return score;
    };
    if (!searchTerm.trim()) return [];

    const startTime = performance.now();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results: SearchResult[] = [];

    // Search commits
    searchIndex.commits.forEach(({ searchText, originalData }) => {
      if (searchText.includes(lowerSearchTerm)) {
        const relevanceScore = calculateRelevanceScore(searchText, lowerSearchTerm);
        results.push({
          type: 'commit',
          data: originalData,
          relevanceScore
        });
      }
    });

    // Search PRs
    searchIndex.prs.forEach(({ searchText, originalData }) => {
      if (searchText.includes(lowerSearchTerm)) {
        const relevanceScore = calculateRelevanceScore(searchText, lowerSearchTerm);
        results.push({
          type: 'pr',
          data: originalData,
          relevanceScore
        });
      }
    });

    // Sort by relevance then by date
    results.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      const aDate = a.type === 'commit' ? (a.data as GitHubCommit).date : (a.data as GitHubPR).created_at;
      const bDate = b.type === 'commit' ? (b.data as GitHubCommit).date : (b.data as GitHubPR).created_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    if (process.env.NODE_ENV === 'development') {
      const endTime = performance.now();
      console.group('🔍 Search Performance');
      console.log(`🔍 Search query: "${searchTerm}" (${searchTerm.length} chars)`);
      console.log(`📊 Results: ${results.length} items found in ${(endTime - startTime).toFixed(1)}ms`);
      console.log(`💾 Index size: ${searchIndex.commits.length + searchIndex.prs.length} total items`);
      console.groupEnd();
    }

    return results;
  }, [searchTerm, searchIndex]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowResults(value.trim().length > 0);
    setShowMore(false);
    onSearchChange(value);
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '1px 2px', borderRadius: '2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const displayResults = showMore ? searchResults : searchResults.slice(0, 50);

  // Use debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        // Trigger search after 300ms delay
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        🔍 Global Search
      </Typography>
      
      <Paper sx={{ p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search commits and PRs by message or author..."
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
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {searchResults.length} results found
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List dense>
                {displayResults.map((result, index) => (
                  <ListItem key={`${result.type}-${index}`} sx={{ px: 0, py: 1 }}>
                    <Box sx={{ width: '100%' }}>
                      {result.type === 'commit' ? (
                        <CommitSearchResult 
                          commit={result.data as GitHubCommit} 
                          searchTerm={searchTerm}
                          highlightMatch={highlightMatch}
                        />
                      ) : (
                        <PRSearchResult 
                          pr={result.data as GitHubPR} 
                          searchTerm={searchTerm}
                          highlightMatch={highlightMatch}
                        />
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
              
              {searchResults.length > 50 && !showMore && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setShowMore(true)}
                  >
                    Show more results ({searchResults.length - 50} remaining)
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

function CommitSearchResult({ 
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
}

function PRSearchResult({ 
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
}