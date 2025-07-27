'use client';

import { useState, useMemo, useRef } from 'react';
import { GitHubCommit, GitHubPR } from '@/types/github';

interface SearchIndexItem<T> {
  id: string;
  searchText: string;
  originalData: T;
}

interface SearchResult<T> {
  type: 'commit' | 'pr';
  data: T;
  relevanceScore: number;
}

export function useCommitSearch(commits: GitHubCommit[]) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build search index for commits
  const searchIndex = useMemo(() => {
    return commits.map(commit => ({
      id: `${commit.repo}-${commit.sha}`,
      searchText: [
        commit.message,
        commit.author,
        commit.repo,
        commit.branch_name,
        commit.sha
      ].join(' ').toLowerCase(),
      originalData: commit
    }));
  }, [commits]);

  // Search results with relevance scoring
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) return commits;

    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
    const searchTerms = lowerSearchTerm.split(' ').filter(term => term.length > 0);
    
    const results: { commit: GitHubCommit; score: number }[] = [];

    for (const item of searchIndex) {
      let relevanceScore = 0;
      let termMatches = 0;

      for (const term of searchTerms) {
        if (item.searchText.includes(term)) {
          termMatches++;
          
          // Higher score for exact matches in important fields
          if (item.originalData.message.toLowerCase().includes(term)) {
            relevanceScore += 10;
          }
          if (item.originalData.author.toLowerCase().includes(term)) {
            relevanceScore += 8;
          }
          if (item.originalData.repo.toLowerCase().includes(term)) {
            relevanceScore += 6;
          }
          if (item.originalData.branch_name.toLowerCase().includes(term)) {
            relevanceScore += 4;
          }
          
          // Bonus for exact word matches
          const words = item.searchText.split(' ');
          if (words.includes(term)) {
            relevanceScore += 5;
          }
        }
      }

      // Only include results that match all search terms
      if (termMatches === searchTerms.length && relevanceScore > 0) {
        results.push({ commit: item.originalData, score: relevanceScore });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.commit);
  }, [searchIndex, debouncedSearchTerm, commits]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 300);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  return {
    searchTerm,
    searchResults,
    handleSearchChange,
    clearSearch,
    hasResults: searchResults.length > 0,
    isSearching: searchTerm.length >= 2
  };
}

export function usePRSearch(pullRequests: GitHubPR[]) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Build search index for PRs
  const searchIndex = useMemo(() => {
    return pullRequests.map(pr => ({
      id: `${pr.repo}-${pr.number}`,
      searchText: [
        pr.title,
        pr.author,
        pr.repo,
        pr.number.toString(),
        pr.state
      ].join(' ').toLowerCase(),
      originalData: pr
    }));
  }, [pullRequests]);

  // Search results with relevance scoring
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) return pullRequests;

    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
    const searchTerms = lowerSearchTerm.split(' ').filter(term => term.length > 0);
    
    const results: { pr: GitHubPR; score: number }[] = [];

    for (const item of searchIndex) {
      let relevanceScore = 0;
      let termMatches = 0;

      for (const term of searchTerms) {
        if (item.searchText.includes(term)) {
          termMatches++;
          
          // Higher score for exact matches in important fields
          if (item.originalData.title.toLowerCase().includes(term)) {
            relevanceScore += 10;
          }
          if (item.originalData.author.toLowerCase().includes(term)) {
            relevanceScore += 8;
          }
          if (item.originalData.repo.toLowerCase().includes(term)) {
            relevanceScore += 6;
          }
          if (item.originalData.state.toLowerCase().includes(term)) {
            relevanceScore += 4;
          }
          
          // Bonus for exact word matches
          const words = item.searchText.split(' ');
          if (words.includes(term)) {
            relevanceScore += 5;
          }
        }
      }

      // Only include results that match all search terms
      if (termMatches === searchTerms.length && relevanceScore > 0) {
        results.push({ pr: item.originalData, score: relevanceScore });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .map(result => result.pr);
  }, [searchIndex, debouncedSearchTerm, pullRequests]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 300);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  return {
    searchTerm,
    searchResults,
    handleSearchChange,
    clearSearch,
    hasResults: searchResults.length > 0,
    isSearching: searchTerm.length >= 2
  };
}