// Repository profiling types for optimized fetching strategies

export interface BranchMetadata {
  name: string;
  lastCommitSha: string;
  lastCommitDate: string;
  isDefault: boolean;
  isMergedAndInactive?: boolean;
  mergeInfo?: BranchMergeInfo;
}

export interface BranchMergeInfo {
  hasAssociatedMergedPR: boolean;
  mergedPRNumber?: number;
  mergedAt?: string;
  baseRef?: string;
  daysSinceLastCommit: number;
  daysSinceMerge?: number;
  appearsFullyMerged: boolean;
  confidence: number; // 0-1 confidence that branch is merged and inactive
}

export interface BranchComparisonStats {
  branchName: string;
  aheadBy: number;
  behindBy: number;
  totalCommits: number;
}

export interface RepositoryProfile {
  repositoryId: string;
  repositoryName: string;
  
  // Size metrics
  totalBranches: number;
  sampleSize: number;
  branchSizes: number[];
  averageBranchSize: number;
  medianBranchSize: number;
  branchSizeVariance: number;
  
  // Distribution metrics
  smallBranchPercentage: number;   // <50 commits
  mediumBranchPercentage: number;  // 50-250 commits
  largeBranchPercentage: number;   // >250 commits
  
  // Repository characteristics
  defaultBranch: string;
  repositoryAge?: number;
  totalCommits?: number;
  
  // Classification
  repositoryType: 'clean' | 'legacy' | 'mixed' | 'experimental';
  confidence: number;
  
  // Metadata
  createdAt: string;
  lastAnalyzed: string;
  analysisVersion: string;
}

export type FetchStrategy = 
  | 'PURE_COMPARE_API'      // All small branches - use Compare API for everything
  | 'PURE_GRAPHQL'          // All large branches - use GraphQL with local dedup
  | 'HYBRID_THRESHOLD'      // Mixed - use Compare API for small, GraphQL for large
  | 'ADAPTIVE_BATCH';       // Complex patterns - adaptive per branch

export interface ProfileCache {
  repositoryId: string;
  profile: RepositoryProfile;
  strategyMetrics: any[];
  fetchCount: number;
  lastUpdated: string;
}