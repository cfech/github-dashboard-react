'use client';

import React, { useState, useMemo } from 'react';
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
  TableSortLabel
} from '@mui/material';
import { AccountTree as GitBranch } from '@mui/icons-material';
import { GitHubCommit } from '@/types/github';
import { formatTimestampToLocal, isTimestampTodayLocal, truncateText } from '@/utils/dateUtils';
import { CONFIG } from '@/lib/constants';

interface CommitsTableProps {
  commits: GitHubCommit[];
  searchTerm?: string;
}

type SortOrder = 'asc' | 'desc';

export default function CommitsTable({ commits, searchTerm = '' }: CommitsTableProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'repo' | 'author'>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const repositories = useMemo(() => {
    const repos = Array.from(new Set(commits.map(commit => commit.repo))).sort();
    return repos;
  }, [commits]);

  const filteredAndSortedCommits = useMemo(() => {
    let filtered = commits;

    // Filter by repository
    if (selectedRepo !== 'all') {
      filtered = filtered.filter(commit => commit.repo === selectedRepo);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(commit => 
        commit.message.toLowerCase().includes(lowerSearch) ||
        commit.author.toLowerCase().includes(lowerSearch)
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
  }, [commits, selectedRepo, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'repo' | 'author') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
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
  };

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
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            <MenuItem value="all">All Repositories</MenuItem>
            {repositories.map((repo) => (
              <MenuItem key={repo} value={repo}>
                {repo.split('/')[1] || repo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredAndSortedCommits.length} of {commits.length} commits
        {selectedRepo !== 'all' && ` for ${selectedRepo.split('/')[1] || selectedRepo}`}
        {searchTerm && ` matching "${searchTerm}"`}
      </Typography>

      <TableContainer 
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
            {filteredAndSortedCommits.map((commit, index) => {
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
                        {commit.repo.split('/')[1] || commit.repo}
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
                        {commit.branch_name}
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
      </TableContainer>
    </Box>
  );
}