'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Chip,
  TableSortLabel,
  CircularProgress
} from '@mui/material';
import { AccountTree as GitBranch } from '@mui/icons-material';
import { GitHubCommit } from '@/types/github';
import { formatTimestampToLocal, isTimestampTodayLocal, truncateText } from '@/utils/dateUtils';
import { CONFIG } from '@/lib/constants';

interface Repository {
  nameWithOwner: string;
  name: string;
  url: string;
  isPrivate: boolean;
  pushedAt: string;
  defaultBranch: string;
}

interface CommitsTableProps {
  commits: GitHubCommit[];
  repositories?: Repository[];
  searchTerm?: string;
}

type SortOrder = 'asc' | 'desc';

export default function CommitsTable({ commits, repositories = [], searchTerm = '' }: CommitsTableProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'repo' | 'author'>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [additionalCommits, setAdditionalCommits] = useState<GitHubCommit[]>([]);
  const [loadingRepo, setLoadingRepo] = useState<string | null>(null);
  const [searchTriggeredLoading, setSearchTriggeredLoading] = useState<string[]>([]);
  const [visibleRows, setVisibleRows] = useState(50);
  const [tableLoading, setTableLoading] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Combine all available repositories (from commits + from API) - optimized
  const allRepositories = useMemo(() => {
    const repoSet = new Set<string>();
    
    // Add repos from commits
    commits.forEach(commit => repoSet.add(commit.repo));
    
    // Add repos from API
    repositories.forEach(repo => repoSet.add(repo.nameWithOwner));
    
    return Array.from(repoSet).sort();
  }, [commits, repositories]);

  // Combine original commits with additionally fetched commits
  const allCommits = useMemo(() => {
    return [...commits, ...additionalCommits];
  }, [commits, additionalCommits]);

  // Function to fetch commits for a repository that doesn't have data
  const fetchRepoCommits = useCallback(async (repoName: string, isSearchTriggered = false) => {
    if (loadingRepo === repoName) return; // Prevent duplicate requests
    
    setLoadingRepo(repoName);
    if (isSearchTriggered) {
      setSearchTriggeredLoading(prev => [...prev, repoName]);
    }
    
    try {
      console.log(`🔍 Fetching commits for ${repoName}${isSearchTriggered ? ' (search-triggered)' : ''}`);
      const response = await fetch(`/api/github/repo-commits?repo=${encodeURIComponent(repoName)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.commits.length} commits for ${repoName}`);
      
      // Add the new commits to our additional commits state
      setAdditionalCommits(prev => {
        // Remove any existing commits for this repo to avoid duplicates
        const filtered = prev.filter(commit => commit.repo !== repoName);
        return [...filtered, ...data.commits];
      });
    } catch (error) {
      console.error(`❌ Error fetching commits for ${repoName}:`, error);
    } finally {
      setLoadingRepo(null);
      if (isSearchTriggered) {
        setSearchTriggeredLoading(prev => prev.filter(repo => repo !== repoName));
      }
    }
  }, [loadingRepo]);

  // Handle repository selection
  const handleRepoChange = useCallback((repoName: string) => {
    setSelectedRepo(repoName);
    
    // If this repo has no commits loaded and it's not 'all', fetch its commits
    if (repoName !== 'all') {
      const hasCommits = allCommits.some(commit => commit.repo === repoName);
      if (!hasCommits) {
        fetchRepoCommits(repoName);
      }
    }
  }, [allCommits, fetchRepoCommits]);

  // Debounced search-triggered fetching to prevent excessive API calls
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search-triggered fetching
    if (searchTerm && searchTerm.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        const reposWithoutData = allRepositories.filter(repo => 
          !allCommits.some(commit => commit.repo === repo) &&
          !searchTriggeredLoading.includes(repo)
        );
        
        // Limit to 3 repositories at a time to prevent API rate limiting
        const reposToFetch = reposWithoutData.slice(0, 3);
        
        if (reposToFetch.length > 0) {
          console.log(`🔍 Search triggered: fetching data for ${reposToFetch.length} repositories`);
          reposToFetch.forEach(repo => {
            fetchRepoCommits(repo, true);
          });
        }
      }, 800); // 800ms debounce for search-triggered fetching
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, allRepositories, allCommits, searchTriggeredLoading, fetchRepoCommits]);

  // Pre-process commits with lowercase search strings for better performance
  const preprocessedCommits = useMemo(() => {
    return allCommits.map(commit => ({
      ...commit,
      _searchString: (
        commit.message + ' ' +
        commit.author + ' ' +
        commit.repo + ' ' +
        commit.branch_name + ' ' +
        commit.sha
      ).toLowerCase()
    }));
  }, [allCommits]);

  const filteredAndSortedCommits = useMemo(() => {
    let filtered = preprocessedCommits;

    // Filter by repository (fast string comparison)
    if (selectedRepo !== 'all') {
      filtered = filtered.filter(commit => commit.repo === selectedRepo);
    }

    // Filter by search term (single string search instead of multiple includes)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(commit => 
        commit._searchString.includes(lowerSearch)
      );
    }

    // Sort commits
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'repo':
          aValue = a.repo;
          bValue = b.repo;
          break;
        case 'author':
          aValue = a.author;
          bValue = b.author;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [preprocessedCommits, selectedRepo, searchTerm, sortBy, sortOrder]);

  // Get visible commits for display (with infinite scrolling)
  const visibleCommits = useMemo(() => {
    return filteredAndSortedCommits.slice(0, visibleRows);
  }, [filteredAndSortedCommits, visibleRows]);

  const hasMoreRows = visibleRows < filteredAndSortedCommits.length;

  // Load more rows function
  const loadMoreRows = useCallback(() => {
    if (tableLoading || !hasMoreRows) return;
    
    setTableLoading(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleRows(prev => Math.min(prev + 50, filteredAndSortedCommits.length));
      setTableLoading(false);
    }, 100);
  }, [tableLoading, hasMoreRows, filteredAndSortedCommits.length]);

  // Infinite scroll handler for table
  const handleTableScroll = useCallback(() => {
    const container = tableContainerRef.current;
    if (!container || tableLoading || !hasMoreRows) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollThreshold = 300; // Load more when 300px from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      loadMoreRows();
    }
  }, [loadMoreRows, tableLoading, hasMoreRows]);

  // Set up scroll listener for table
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleTableScroll);
    return () => container.removeEventListener('scroll', handleTableScroll);
  }, [handleTableScroll]);

  const handleSort = (field: 'date' | 'repo' | 'author') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    // Reset visible rows when sorting changes
    setVisibleRows(50);
  };

  // Reset visible rows when filters change
  useEffect(() => {
    setVisibleRows(50);
  }, [selectedRepo, searchTerm]);

  // Memoized highlight function to reduce re-renders
  const highlightSearchTerm = useCallback((text: string, term: string) => {
    if (!term || !text) return text;
    
    try {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} style={{ backgroundColor: '#ffeb3b', padding: '2px' }}>
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch (error) {
      // If regex fails, return original text
      return text;
    }
  }, []);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          📄 Commits by Repository
        </Typography>
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="repo-select-label">Repository</InputLabel>
          <Select
            labelId="repo-select-label"
            value={selectedRepo}
            label="Repository"
            onChange={(e) => handleRepoChange(e.target.value)}
          >
            <MenuItem value="all">All Repositories</MenuItem>
            {allRepositories.map((repo) => {
              const hasCommits = allCommits.some(commit => commit.repo === repo);
              const isLoading = loadingRepo === repo;
              
              return (
                <MenuItem key={repo} value={repo}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <span>{repo.split('/')[1] || repo}</span>
                    {isLoading && (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    )}
                    {!hasCommits && !isLoading && (
                      <Chip 
                        label="Load data" 
                        size="small" 
                        variant="outlined" 
                        sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
                      />
                    )}
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      {/* Search loading indicator */}
      {searchTriggeredLoading.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="info.contrastText">
            Searching additional {searchTriggeredLoading.length} repositories for &quot;{searchTerm}&quot;...
          </Typography>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {visibleCommits.length} of {filteredAndSortedCommits.length} commits
        {selectedRepo !== 'all' && ` for ${selectedRepo.split('/')[1] || selectedRepo}`}
        {searchTerm && ` matching &quot;${searchTerm}&quot;`}
        {searchTerm && allRepositories.length > allRepositories.filter(repo => allCommits.some(commit => commit.repo === repo)).length && (
          <Chip 
            label={`${allRepositories.length - allRepositories.filter(repo => allCommits.some(commit => commit.repo === repo)).length} repos not searched yet`}
            size="small" 
            color="warning" 
            variant="outlined"
            sx={{ ml: 1 }} 
          />
        )}
      </Typography>

      <TableContainer 
        ref={tableContainerRef}
        component={Paper} 
        sx={{ 
          height: CONFIG.TABLE_CONTAINER_HEIGHT,
          overflow: 'auto'
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'repo'}
                  direction={sortBy === 'repo' ? sortOrder : 'desc'}
                  onClick={() => handleSort('repo')}
                >
                  Repository
                </TableSortLabel>
              </TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>SHA</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'author'}
                  direction={sortBy === 'author' ? sortOrder : 'desc'}
                  onClick={() => handleSort('author')}
                >
                  Author
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'date'}
                  direction={sortBy === 'date' ? sortOrder : 'desc'}
                  onClick={() => handleSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleCommits.map((commit, index) => {
              const isToday = isTimestampTodayLocal(commit.date);
              return (
                <TableRow 
                  key={`${commit.repo}-${commit.sha}-${index}`}
                  sx={{ 
                    backgroundColor: isToday ? 'action.hover' : 'inherit',
                    '&:hover': { backgroundColor: 'action.selected' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link href={commit.repo_url} target="_blank" rel="noopener">
                        {highlightSearchTerm(commit.repo.split('/')[1] || commit.repo, searchTerm)}
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
                            height: '18px',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GitBranch sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Link 
                        href={commit.branch_url} 
                        target="_blank" 
                        rel="noopener"
                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                      >
                        {highlightSearchTerm(commit.branch_name, searchTerm)}
                      </Link>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={commit.url} 
                      target="_blank" 
                      rel="noopener"
                      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    >
                      {commit.sha}
                    </Link>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {highlightSearchTerm(
                        truncateText(commit.message, CONFIG.COMMIT_MESSAGE_MAX_LENGTH),
                        searchTerm
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {highlightSearchTerm(commit.author, searchTerm)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                      {formatTimestampToLocal(commit.date)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Loading indicator inside table container */}
        {tableLoading && (
          <Box sx={{ textAlign: 'center', py: 2, bgcolor: 'background.paper' }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading more commits...
            </Typography>
          </Box>
        )}
        
        {/* End of list indicator */}
        {!hasMoreRows && filteredAndSortedCommits.length > 50 && (
          <Box sx={{ textAlign: 'center', py: 2, bgcolor: 'background.paper' }}>
            <Typography variant="body2" color="text.secondary">
              All {filteredAndSortedCommits.length} commits loaded
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}