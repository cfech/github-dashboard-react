import { GITHUB_API_URL, CONFIG } from './constants';
import fs from 'fs';
import path from 'path';
import { 
  GET_USER_INFO_QUERY, 
  GET_REPOSITORIES_QUERY, 
  GET_ORGANIZATION_REPOS_QUERY,
  GET_REPOSITORY_COMMITS_QUERY,
  GET_REPOSITORY_ALL_BRANCHES_COMMITS_QUERY,
  GET_REPOSITORY_COMMITS_SINCE_QUERY,
  GET_BRANCH_COMMITS_SINCE_QUERY,
  GET_REPOSITORY_BRANCHES_QUERY,
  GET_SINGLE_BRANCH_COMMITS_QUERY,
  GET_BRANCHES_WITH_LAST_COMMIT_QUERY,
  GET_BRANCHES_WITH_MERGE_INFO_QUERY,
  GET_BRANCH_UNIQUE_COMMITS_QUERY,
  GET_BRANCH_ASSOCIATED_PRS_QUERY,
  GET_BRANCH_COMPARISON_STATS_QUERY,
  GET_MORE_BRANCH_COMMITS_QUERY,
  GET_REPOSITORY_PRS_QUERY,
  GET_REPOSITORY_PRS_SINCE_QUERY
} from './githubQueries';
import { GitHubUser, GitHubRepository, GitHubCommit, GitHubPR } from '@/types/github';
import { 
  RepositoryProfile, 
  FetchStrategy, 
  BranchMetadata, 
  BranchMergeInfo,
  BranchComparisonStats,
  StrategyMetrics,
  ProfileCache
} from '@/types/profiling';

const headers = {
  "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
  "Content-Type": "application/json"
};

// API Call Tracking System
interface ApiCallRecord {
  type: string;
  query: string;
  variables?: any;
  timestamp: string;
  duration: number;
  success: boolean;
  error?: string;
  repository?: string;
  branch?: string;
}

class ApiCallTracker {
  private static instance: ApiCallTracker;
  private calls: ApiCallRecord[] = [];
  private startTime: number = 0;

  static getInstance(): ApiCallTracker {
    if (!ApiCallTracker.instance) {
      ApiCallTracker.instance = new ApiCallTracker();
    }
    return ApiCallTracker.instance;
  }

  startTracking() {
    this.calls = [];
    this.startTime = Date.now();
    console.log('🔍 API Call Tracking Started');
  }

  recordCall(record: Omit<ApiCallRecord, 'timestamp'>) {
    this.calls.push({
      ...record,
      timestamp: new Date().toISOString()
    });
  }

  getStats() {
    const totalCalls = this.calls.length;
    const successfulCalls = this.calls.filter(call => call.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const totalDuration = this.calls.reduce((sum, call) => sum + call.duration, 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    const callsByType = this.calls.reduce((acc, call) => {
      acc[call.type] = (acc[call.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      totalDuration,
      avgDuration,
      callsByType,
      totalTime: Date.now() - this.startTime,
      calls: this.calls
    };
  }

  async generateReport() {
    const stats = this.getStats();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `api-report-${timestamp}.txt`;
    const reportsDir = path.join(process.cwd(), 'api-reports');
    const reportPath = path.join(reportsDir, filename);

    const report = this.formatReport(stats);
    
    try {
      // Ensure the api-reports directory exists
      await fs.promises.mkdir(reportsDir, { recursive: true });
      
      await fs.promises.writeFile(reportPath, report, 'utf8');
      console.log(`📊 API Report generated: api-reports/${filename}`);
      return filename;
    } catch (error) {
      console.error('❌ Failed to generate API report:', error);
      return null;
    }
  }

  private formatReport(stats: any): string {
    const { totalCalls, successfulCalls, failedCalls, totalDuration, avgDuration, callsByType, totalTime, calls } = stats;
    
    let report = `GitHub Dashboard - API Call Report
Generated: ${new Date().toISOString()}
=====================================

SUMMARY STATISTICS
==================
Total API Calls: ${totalCalls}
Successful Calls: ${successfulCalls}
Failed Calls: ${failedCalls}
Success Rate: ${totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : 0}%

TIMING STATISTICS
=================
Total API Time: ${(totalDuration / 1000).toFixed(2)} seconds
Average Call Duration: ${avgDuration.toFixed(0)}ms
Total Sync Time: ${(totalTime / 1000).toFixed(2)} seconds
API Efficiency: ${totalTime > 0 ? ((totalDuration / totalTime) * 100).toFixed(1) : 0}%

CALL BREAKDOWN BY TYPE
======================
`;

    Object.entries(callsByType).forEach(([type, count]) => {
      report += `${type}: ${count} calls\n`;
    });

    report += `
RATE LIMITING ANALYSIS
======================
API Calls per Second: ${totalTime > 0 ? ((totalCalls / (totalTime / 1000)).toFixed(2)) : 0}
Estimated Rate Limit Usage: ${(totalCalls / 5000 * 100).toFixed(2)}% (assuming 5000/hour limit)

DETAILED CALL LOG
=================
`;

    calls.forEach((call: ApiCallRecord, index: number) => {
      report += `${index + 1}. [${call.timestamp}] ${call.type}
   Duration: ${call.duration}ms | Success: ${call.success}
   Repository: ${call.repository || 'N/A'} | Branch: ${call.branch || 'N/A'}
   ${call.error ? `Error: ${call.error}` : ''}
   
`;
    });

    report += `
MERGED BRANCH OPTIMIZATION
==========================
${this.optimizationMetrics ? `
Strategy Used: ${this.optimizationMetrics.strategy}
Branches Skipped: ${this.optimizationMetrics.branchesSkipped}
Branches Processed: ${this.optimizationMetrics.branchesProcessed}
Optimization Efficiency: ${this.optimizationMetrics.optimizationEfficiency.toFixed(1)}%
Estimated API Call Reduction: ${this.optimizationMetrics.optimizationEfficiency.toFixed(0)}%
` : 'No optimization metrics available for this session'}

RECOMMENDATIONS
===============
- Monitor rate limit usage to stay within GitHub's 5000 requests/hour limit
- Consider caching strategies for frequently accessed data
- Optimize batch processing for multiple repositories
- Use incremental sync when possible to reduce API calls
- Merged branch detection provides ${this.optimizationMetrics?.optimizationEfficiency?.toFixed(0) || 'unknown'}% efficiency gain

End of Report
=============`;

    return report;
  }

  logSummary() {
    const stats = this.getStats();
    console.group('📊 API Call Summary');
    console.log(`🔢 Total API Calls: ${stats.totalCalls}`);
    console.log(`✅ Successful: ${stats.successfulCalls} | ❌ Failed: ${stats.failedCalls}`);
    console.log(`⏱️  Total API Time: ${(stats.totalDuration / 1000).toFixed(2)}s | Avg: ${stats.avgDuration.toFixed(0)}ms`);
    console.log(`🚀 Rate: ${stats.totalTime > 0 ? (stats.totalCalls / (stats.totalTime / 1000)).toFixed(2) : 0} calls/second`);
    console.log('📋 Call Types:');
    Object.entries(stats.callsByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.groupEnd();
  }
  
  recordOptimizationMetrics(branchesSkipped: number, branchesProcessed: number, strategy: string) {
    const efficiency = branchesSkipped + branchesProcessed > 0 
      ? (branchesSkipped / (branchesSkipped + branchesProcessed)) * 100 
      : 0;
      
    console.log(`🎯 Merged Branch Optimization: ${branchesSkipped} branches skipped, ${branchesProcessed} processed (${efficiency.toFixed(0)}% efficiency)`);
    
    // Store metrics for reporting
    this.optimizationMetrics = {
      branchesSkipped,
      branchesProcessed,
      optimizationEfficiency: efficiency,
      strategy
    };
  }
  
  private optimizationMetrics: any = null;
}

const apiTracker = ApiCallTracker.getInstance();

// Repository Profiling System for Optimal Strategy Selection
class RepositoryProfiler {
  private static instance: RepositoryProfiler;
  private profileCache = new Map<string, ProfileCache>();
  
  static getInstance(): RepositoryProfiler {
    if (!RepositoryProfiler.instance) {
      RepositoryProfiler.instance = new RepositoryProfiler();
    }
    return RepositoryProfiler.instance;
  }

  async getOrCreateProfile(repo: GitHubRepository): Promise<RepositoryProfile> {
    const cached = this.profileCache.get(repo.nameWithOwner);
    
    // Use cached profile if recent (less than 7 days old) and confident
    if (cached && this.isProfileValid(cached)) {
      console.log(`📋 Using cached profile for ${repo.nameWithOwner} (${cached.profile.repositoryType})`);
      return cached.profile;
    }
    
    console.log(`🔍 Analyzing repository profile for ${repo.nameWithOwner}...`);
    const profile = await this.analyzeRepository(repo);
    
    // Cache the new profile
    this.profileCache.set(repo.nameWithOwner, {
      repositoryId: repo.nameWithOwner,
      profile,
      strategyMetrics: [],
      fetchCount: 0,
      lastUpdated: new Date().toISOString()
    });
    
    return profile;
  }

  private isProfileValid(cached: ProfileCache): boolean {
    const age = Date.now() - new Date(cached.lastUpdated).getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    return age < maxAge && cached.profile.confidence > 0.7;
  }

  private async analyzeRepository(repo: GitHubRepository): Promise<RepositoryProfile> {
    const [owner, name] = repo.nameWithOwner.split('/');
    
    try {
      // Step 1: Get branches with merge analysis to filter out merged/inactive branches
      const allBranchesWithMergeInfo = await mergedBranchDetector.getBranchesWithMergeAnalysis(repo);
      
      if (allBranchesWithMergeInfo.length === 0) {
        return this.createMinimalProfile(repo, repo.defaultBranch || 'main');
      }
      
      // Step 2: Filter to only active branches for profiling
      const activeBranches = mergedBranchDetector.getActiveBranches(allBranchesWithMergeInfo);
      const mergedInactiveBranches = mergedBranchDetector.getMergedInactiveBranches(allBranchesWithMergeInfo);
      
      const defaultBranch = allBranchesWithMergeInfo.find(b => b.isDefault)?.name || 'main';
      
      console.log(`🎯 Repository analysis: ${activeBranches.length} active branches, ${mergedInactiveBranches.length} merged/inactive branches`);
      
      if (activeBranches.length <= 1) { // Only default branch is active
        return this.createMinimalProfile(repo, defaultBranch);
      }
      
      // Step 3: Sample only active feature branches for analysis
      const activeFeatureBranches = activeBranches.filter(b => !b.isDefault);
      const sampleSize = Math.min(activeFeatureBranches.length, 10);
      const sampleBranches = this.selectRepresentativeSample(activeFeatureBranches, sampleSize);
      
      console.log(`📊 Analyzing ${sampleBranches.length} active branches (skipped ${mergedInactiveBranches.length} merged/inactive)`);
      
      // Step 4: Analyze sample branches for size estimation
      const branchStats: BranchComparisonStats[] = [];
      for (const branch of sampleBranches) {
        try {
          const stats = await this.getBranchComparisonStats(owner, name, defaultBranch, branch.name);
          branchStats.push(stats);
          
          // Small delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`⚠️  Failed to analyze branch ${branch.name}:`, error);
        }
      }
      
      if (branchStats.length === 0) {
        return this.createMinimalProfile(repo, defaultBranch);
      }
      
      // Step 5: Calculate profile metrics based on active branches only
      const totalBranchesForProfile = activeBranches.length; // Only count active branches in profile
      return this.calculateRepositoryProfile(repo, defaultBranch, totalBranchesForProfile, branchStats);
      
    } catch (error) {
      console.error(`❌ Failed to analyze repository ${repo.nameWithOwner}:`, error);
      return this.createMinimalProfile(repo, repo.defaultBranch || 'main');
    }
  }

  private selectRepresentativeSample(branches: BranchMetadata[], maxSample: number): BranchMetadata[] {
    if (branches.length <= maxSample) return branches;
    
    // Sort by last commit date to get a mix of old and new branches
    const sorted = branches.sort((a, b) => 
      new Date(b.lastCommitDate || 0).getTime() - new Date(a.lastCommitDate || 0).getTime()
    );
    
    // Take every nth branch to get a representative sample
    const step = Math.floor(branches.length / maxSample);
    const sample = [];
    for (let i = 0; i < maxSample && i * step < sorted.length; i++) {
      sample.push(sorted[i * step]);
    }
    
    return sample;
  }

  private async getBranchComparisonStats(
    owner: string, 
    name: string, 
    baseBranch: string, 
    headBranch: string
  ): Promise<BranchComparisonStats> {
    // For profiling, we need to estimate branch size
    // Since GitHub's GraphQL doesn't have a direct compare, we'll use a workaround
    const data = await executeGraphQLQuery(GET_SINGLE_BRANCH_COMMITS_QUERY, {
      owner, name, branch: `refs/heads/${headBranch}`
    }, 'BranchSizeEstimate', `${owner}/${name}`, headBranch);
    
    const commits = data.repository?.ref?.target?.history?.nodes || [];
    const hasMore = data.repository?.ref?.target?.history?.pageInfo?.hasNextPage || false;
    
    // Rough estimate: if we got 100 commits and there are more, estimate 150-300
    // If we got fewer than 100, that's likely the actual count
    let estimatedSize = commits.length;
    if (hasMore) {
      estimatedSize = Math.max(commits.length * 1.5, 150);
    }
    
    return {
      branchName: headBranch,
      aheadBy: estimatedSize, // Rough approximation
      behindBy: 0, // Not needed for profiling
      totalCommits: estimatedSize
    };
  }

  private calculateRepositoryProfile(
    repo: GitHubRepository,
    defaultBranch: string,
    totalBranches: number,
    branchStats: BranchComparisonStats[]
  ): RepositoryProfile {
    const branchSizes = branchStats.map(s => s.aheadBy);
    const average = branchSizes.reduce((sum, size) => sum + size, 0) / branchSizes.length;
    const median = this.calculateMedian(branchSizes);
    const variance = this.calculateVariance(branchSizes, average);
    
    // Classify branch sizes
    const small = branchSizes.filter(size => size < 50).length;
    const medium = branchSizes.filter(size => size >= 50 && size <= 250).length;
    const large = branchSizes.filter(size => size > 250).length;
    const total = branchSizes.length;
    
    const smallPercentage = (small / total) * 100;
    const mediumPercentage = (medium / total) * 100;
    const largePercentage = (large / total) * 100;
    
    // Determine repository type and confidence
    const { repositoryType, confidence } = this.classifyRepository(
      average, median, smallPercentage, mediumPercentage, largePercentage, variance
    );
    
    return {
      repositoryId: repo.nameWithOwner,
      repositoryName: repo.nameWithOwner,
      totalBranches,
      sampleSize: branchStats.length,
      branchSizes,
      averageBranchSize: average,
      medianBranchSize: median,
      branchSizeVariance: variance,
      smallBranchPercentage: smallPercentage,
      mediumBranchPercentage: mediumPercentage,
      largeBranchPercentage: largePercentage,
      defaultBranch,
      repositoryType,
      confidence,
      createdAt: new Date().toISOString(),
      lastAnalyzed: new Date().toISOString(),
      analysisVersion: '1.0'
    };
  }

  private classifyRepository(
    average: number,
    median: number,
    smallPercentage: number,
    mediumPercentage: number,
    largePercentage: number,
    variance: number
  ): { repositoryType: RepositoryProfile['repositoryType'], confidence: number } {
    
    // Clean development pattern: mostly small branches
    if (smallPercentage > 70 && average < 75) {
      return { repositoryType: 'clean', confidence: 0.9 };
    }
    
    // Legacy pattern: mostly large branches
    if (largePercentage > 60 || average > 400) {
      return { repositoryType: 'legacy', confidence: 0.85 };
    }
    
    // Mixed pattern: combination of small and medium/large
    if (smallPercentage > 30 && mediumPercentage > 20) {
      return { repositoryType: 'mixed', confidence: 0.8 };
    }
    
    // Experimental: high variance or unclear patterns
    if (variance > 10000 || (largePercentage > 20 && smallPercentage > 40)) {
      return { repositoryType: 'experimental', confidence: 0.7 };
    }
    
    // Default to mixed with lower confidence
    return { repositoryType: 'mixed', confidence: 0.6 };
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private calculateVariance(numbers: number[], mean: number): number {
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private createMinimalProfile(repo: GitHubRepository, defaultBranch: string): RepositoryProfile {
    return {
      repositoryId: repo.nameWithOwner,
      repositoryName: repo.nameWithOwner,
      totalBranches: 1,
      sampleSize: 0,
      branchSizes: [],
      averageBranchSize: 0,
      medianBranchSize: 0,
      branchSizeVariance: 0,
      smallBranchPercentage: 100,
      mediumBranchPercentage: 0,
      largeBranchPercentage: 0,
      defaultBranch,
      repositoryType: 'clean',
      confidence: 0.5,
      createdAt: new Date().toISOString(),
      lastAnalyzed: new Date().toISOString(),
      analysisVersion: '1.0'
    };
  }

  selectOptimalStrategy(profile: RepositoryProfile): FetchStrategy {
    console.log(`🎯 Repository ${profile.repositoryName} profile: ${profile.repositoryType} (confidence: ${(profile.confidence * 100).toFixed(0)}%)`);
    console.log(`📊 Branch distribution: ${profile.smallBranchPercentage.toFixed(0)}% small, ${profile.mediumBranchPercentage.toFixed(0)}% medium, ${profile.largeBranchPercentage.toFixed(0)}% large`);
    
    // Pure Compare API: mostly small branches
    if (profile.repositoryType === 'clean' && profile.smallBranchPercentage > 80) {
      console.log(`🚀 Selected strategy: PURE_COMPARE_API (optimal for small branches)`);
      return 'PURE_COMPARE_API';
    }
    
    // Pure GraphQL: mostly large branches
    if (profile.repositoryType === 'legacy' && profile.largeBranchPercentage > 60) {
      console.log(`🔧 Selected strategy: PURE_GRAPHQL (optimal for large branches)`);
      return 'PURE_GRAPHQL';
    }
    
    // Hybrid threshold: mixed sizes
    if (profile.repositoryType === 'mixed' || 
        (profile.smallBranchPercentage > 40 && profile.largeBranchPercentage < 40)) {
      console.log(`⚖️  Selected strategy: HYBRID_THRESHOLD (optimal for mixed sizes)`);
      return 'HYBRID_THRESHOLD';
    }
    
    // Adaptive: experimental or unclear patterns
    console.log(`🔄 Selected strategy: ADAPTIVE_BATCH (handles complex patterns)`);
    return 'ADAPTIVE_BATCH';
  }
}

const repositoryProfiler = RepositoryProfiler.getInstance();

// Merged Branch Detection System for Maximum Efficiency
class MergedBranchDetector {
  private static instance: MergedBranchDetector;
  private detectionCache = new Map<string, BranchMergeInfo>();
  
  static getInstance(): MergedBranchDetector {
    if (!MergedBranchDetector.instance) {
      MergedBranchDetector.instance = new MergedBranchDetector();
    }
    return MergedBranchDetector.instance;
  }

  async getBranchesWithMergeAnalysis(repo: GitHubRepository): Promise<BranchMetadata[]> {
    const [owner, name] = repo.nameWithOwner.split('/');
    
    try {
      console.log(`🔍 Analyzing branches for merged/inactive status in ${repo.nameWithOwner}...`);
      
      const data = await executeGraphQLQuery(GET_BRANCHES_WITH_MERGE_INFO_QUERY, {
        owner, name
      }, 'BranchMergeAnalysis', repo.nameWithOwner);
      
      const defaultBranch = data.repository?.defaultBranchRef?.name || 'main';
      const defaultBranchCommitDate = data.repository?.defaultBranchRef?.target?.committedDate;
      const branches = data.repository?.refs?.nodes || [];
      
      const branchAnalysis: BranchMetadata[] = [];
      let skippedCount = 0;
      
      for (const branch of branches) {
        const mergeInfo = await this.analyzeBranchMergeStatus(
          branch, 
          defaultBranch, 
          defaultBranchCommitDate,
          repo
        );
        
        const branchMetadata: BranchMetadata = {
          name: branch.name,
          lastCommitSha: branch.target?.oid || '',
          lastCommitDate: branch.target?.committedDate || '',
          isDefault: branch.name === defaultBranch,
          isMergedAndInactive: mergeInfo.appearsFullyMerged && mergeInfo.confidence > 0.7,
          mergeInfo
        };
        
        if (branchMetadata.isMergedAndInactive) {
          skippedCount++;
          console.log(`⏭️  Branch '${branch.name}' appears merged and inactive (confidence: ${(mergeInfo.confidence * 100).toFixed(0)}%)`);
        }
        
        branchAnalysis.push(branchMetadata);
      }
      
      const activeCount = branchAnalysis.filter(b => !b.isMergedAndInactive).length;
      console.log(`📊 Branch analysis complete: ${activeCount} active, ${skippedCount} merged/inactive (${((skippedCount / branches.length) * 100).toFixed(0)}% reduction)`);
      
      return branchAnalysis;
      
    } catch (error) {
      console.error(`❌ Error analyzing branch merge status for ${repo.nameWithOwner}:`, error);
      return [];
    }
  }

  private async analyzeBranchMergeStatus(
    branch: any,
    defaultBranch: string,
    defaultBranchCommitDate: string,
    repo: GitHubRepository
  ): Promise<BranchMergeInfo> {
    const branchName = branch.name;
    const lastCommitDate = branch.target?.committedDate;
    const cacheKey = `${repo.nameWithOwner}:${branchName}:${lastCommitDate}`;
    
    // Check cache first
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)!;
    }
    
    const now = new Date();
    const branchLastCommit = new Date(lastCommitDate || 0);
    const defaultBranchLastCommit = new Date(defaultBranchCommitDate || 0);
    
    const daysSinceLastCommit = Math.floor((now.getTime() - branchLastCommit.getTime()) / (1000 * 60 * 60 * 24));
    
    // Skip analysis for default branch
    if (branchName === defaultBranch) {
      const mergeInfo: BranchMergeInfo = {
        hasAssociatedMergedPR: false,
        daysSinceLastCommit,
        appearsFullyMerged: false,
        confidence: 0
      };
      this.detectionCache.set(cacheKey, mergeInfo);
      return mergeInfo;
    }
    
    let confidence = 0;
    let appearsFullyMerged = false;
    let hasAssociatedMergedPR = false;
    let mergedAt: string | undefined;
    let mergedPRNumber: number | undefined;
    let daysSinceMerge: number | undefined;
    
    // Signal 1: Check associated merged PRs from the branch data
    const associatedPRs = branch.associatedPullRequests?.nodes || [];
    const mergedPR = associatedPRs.find((pr: any) => pr.state === 'MERGED');
    
    if (mergedPR) {
      hasAssociatedMergedPR = true;
      mergedAt = mergedPR.mergedAt;
      mergedPRNumber = mergedPR.number;
      
      if (mergedAt) {
        const mergeDate = new Date(mergedAt);
        daysSinceMerge = Math.floor((now.getTime() - mergeDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // High confidence if merged and no commits since merge
        if (branchLastCommit <= mergeDate) {
          confidence += 0.5;
          appearsFullyMerged = true;
        }
      }
    }
    
    // Signal 2: Age-based analysis
    if (daysSinceLastCommit > 30) {
      confidence += 0.2; // Old branches are likely merged or abandoned
    }
    
    if (daysSinceLastCommit > 90) {
      confidence += 0.2; // Very old branches are almost certainly inactive
    }
    
    // Signal 3: Branch last commit is older than default branch
    if (branchLastCommit < defaultBranchLastCommit) {
      confidence += 0.1; // Likely merged if main has newer commits
    }
    
    // Signal 4: Branch naming patterns suggest merge/cleanup
    if (this.hasMergedBranchNamingPattern(branchName)) {
      confidence += 0.1;
    }
    
    // Signal 5: Very stale branches (>6 months) are almost certainly dead
    if (daysSinceLastCommit > 180) {
      confidence = Math.max(confidence, 0.8);
      appearsFullyMerged = true;
    }
    
    // Cap confidence at 0.95 to leave room for manual override
    confidence = Math.min(confidence, 0.95);
    
    const mergeInfo: BranchMergeInfo = {
      hasAssociatedMergedPR,
      mergedPRNumber,
      mergedAt,
      baseRef: mergedPR?.baseRefName,
      daysSinceLastCommit,
      daysSinceMerge,
      appearsFullyMerged,
      confidence
    };
    
    // Cache the result
    this.detectionCache.set(cacheKey, mergeInfo);
    
    return mergeInfo;
  }

  private hasMergedBranchNamingPattern(branchName: string): boolean {
    const mergedPatterns = [
      /merged/i,
      /old[\-_]/i,
      /archive/i,
      /backup/i,
      /deprecated/i,
      /done/i,
      /completed/i
    ];
    
    return mergedPatterns.some(pattern => pattern.test(branchName));
  }

  getActiveBranches(branches: BranchMetadata[]): BranchMetadata[] {
    return branches.filter(branch => !branch.isMergedAndInactive);
  }

  getMergedInactiveBranches(branches: BranchMetadata[]): BranchMetadata[] {
    return branches.filter(branch => branch.isMergedAndInactive);
  }
}

const mergedBranchDetector = MergedBranchDetector.getInstance();

async function executeGraphQLQuery(query: string, variables?: any, callType: string = 'Unknown', repository?: string, branch?: string) {
  const startTime = performance.now();
  let success = false;
  let errorMessage: string | undefined;

  try {
    const response = await fetch(GITHUB_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(CONFIG.GRAPHQL_QUERY_TIMEOUT)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }
    
    success = true;
    return result.data;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API request failed:', error);
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    apiTracker.recordCall({
      type: callType,
      query: query.trim().split('\n')[0].replace(/^\s*/, ''), // First line as identifier
      variables,
      duration,
      success,
      error: errorMessage,
      repository,
      branch
    });
  }
}

export async function fetchUserInfo(): Promise<GitHubUser> {
  const startTime = performance.now();
  const data = await executeGraphQLQuery(GET_USER_INFO_QUERY, {}, 'UserInfo');
  const endTime = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`👤 User Info Query: ${(endTime - startTime).toFixed(0)}ms`);
  }
  
  const viewer = data.viewer;
  return {
    login: viewer.login,
    name: viewer.name || viewer.login,
    email: viewer.email,
    bio: viewer.bio,
    company: viewer.company,
    location: viewer.location,
    avatar_url: viewer.avatarUrl,
    url: viewer.url,
    created_at: viewer.createdAt,
    followers: viewer.followers.totalCount,
    following: viewer.following.totalCount,
    public_repos: viewer.repositories.totalCount,
    total_commit_contributions: viewer.contributionsCollection.totalCommitContributions,
    total_pr_contributions: viewer.contributionsCollection.totalPullRequestContributions,
    total_issue_contributions: viewer.contributionsCollection.totalIssueContributions,
    total_repository_contributions: viewer.contributionsCollection.totalRepositoryContributions,
  };
}

export async function fetchRepositories(): Promise<GitHubRepository[]> {
  const startTime = performance.now();
  const repositories: GitHubRepository[] = [];
  let hasNextPage = true;
  let after: string | null = null;
  
  while (hasNextPage) {
    const data = await executeGraphQLQuery(GET_REPOSITORIES_QUERY, { after }, 'UserRepositories');
    const repoData = data.viewer.repositories;
    
    repositories.push(...repoData.nodes.map((node: any) => ({
      name: node.name,
      nameWithOwner: node.nameWithOwner,
      url: node.url,
      pushedAt: node.pushedAt,
      isPrivate: node.isPrivate,
      defaultBranch: node.defaultBranchRef?.name || 'main'
    })));
    
    hasNextPage = repoData.pageInfo.hasNextPage;
    after = repoData.pageInfo.endCursor;
  }
  
  const endTime = performance.now();
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Repository Discovery: ${(endTime - startTime).toFixed(0)}ms (${repositories.length} repos found)`);
  }
  
  return repositories;
}

export async function fetchOrganizationRepositories(orgName: string): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];
  let hasNextPage = true;
  let after: string | null = null;
  
  while (hasNextPage) {
    const data = await executeGraphQLQuery(GET_ORGANIZATION_REPOS_QUERY, { org: orgName, after }, 'OrganizationRepositories');
    const repoData = data.organization.repositories;
    
    repositories.push(...repoData.nodes.map((node: any) => ({
      name: node.name,
      nameWithOwner: node.nameWithOwner,
      url: node.url,
      pushedAt: node.pushedAt,
      isPrivate: node.isPrivate,
      defaultBranch: node.defaultBranchRef?.name || 'main'
    })));
    
    hasNextPage = repoData.pageInfo.hasNextPage;
    after = repoData.pageInfo.endCursor;
  }
  
  return repositories;
}

export async function fetchRepositoryCommits(repo: GitHubRepository): Promise<GitHubCommit[]> {
  try {
    console.log(`🔍 Fetching commits for ${repo.nameWithOwner} using intelligent profiling...`);
    
    // Step 1: Get or create repository profile
    const profile = await repositoryProfiler.getOrCreateProfile(repo);
    const strategy = repositoryProfiler.selectOptimalStrategy(profile);
    
    // Step 2: Execute the optimal strategy
    const startTime = performance.now();
    let commits: GitHubCommit[];
    
    switch (strategy) {
      case 'PURE_COMPARE_API':
        commits = await fetchWithPureCompareStrategy(repo, profile);
        break;
      case 'PURE_GRAPHQL':
        commits = await fetchWithPureGraphQLStrategy(repo, profile);
        break;
      case 'HYBRID_THRESHOLD':
        commits = await fetchWithHybridThresholdStrategy(repo, profile);
        break;
      case 'ADAPTIVE_BATCH':
        commits = await fetchWithAdaptiveBatchStrategy(repo, profile);
        break;
      default:
        console.warn(`⚠️  Unknown strategy ${strategy}, falling back to PURE_GRAPHQL`);
        commits = await fetchWithPureGraphQLStrategy(repo, profile);
    }
    
    const executionTime = performance.now() - startTime;
    console.log(`✅ Strategy ${strategy} completed in ${executionTime.toFixed(0)}ms: ${commits.length} unique commits`);
    
    return commits;
    
  } catch (error) {
    console.error(`❌ Error fetching commits for ${repo.nameWithOwner}:`, error);
    return [];
  }
}

// Strategy Implementation: Pure Compare API (for repositories with mostly small branches)
async function fetchWithPureCompareStrategy(repo: GitHubRepository, profile: RepositoryProfile): Promise<GitHubCommit[]> {
  console.log(`🚀 Executing PURE_COMPARE_API strategy for ${repo.nameWithOwner}`);
  
  // Note: This would use REST API Compare endpoint in a real implementation
  // For now, we'll use GraphQL with efficient filtering as a placeholder
  return await fetchWithPureGraphQLStrategy(repo, profile);
}

// Strategy Implementation: Pure GraphQL (for repositories with mostly large branches) 
async function fetchWithPureGraphQLStrategy(repo: GitHubRepository, profile: RepositoryProfile): Promise<GitHubCommit[]> {
  console.log(`🔧 Executing PURE_GRAPHQL strategy for ${repo.nameWithOwner}`);
  
  const [owner, name] = repo.nameWithOwner.split('/');
  const fetchAllCommits = process.env.FETCH_ALL_COMMITS !== 'false';
  const excludePrefixes = process.env.EXCLUDE_BRANCH_PREFIXES 
    ? process.env.EXCLUDE_BRANCH_PREFIXES.split(',').map(prefix => prefix.trim()).filter(Boolean)
    : [];
    
  // Get branches with merge analysis - this automatically filters merged/inactive branches
  const allBranchesWithMergeInfo = await mergedBranchDetector.getBranchesWithMergeAnalysis(repo);
  const activeBranches = mergedBranchDetector.getActiveBranches(allBranchesWithMergeInfo);
  const mergedInactiveBranches = mergedBranchDetector.getMergedInactiveBranches(allBranchesWithMergeInfo);
  
  // Apply additional exclude prefix filtering
  const filteredBranches = activeBranches.filter(branch => {
    const shouldExclude = excludePrefixes.some(prefix => 
      branch.name.toLowerCase().startsWith(prefix.toLowerCase())
    );
    return !shouldExclude;
  });
  
  const defaultBranch = profile.defaultBranch;
  const allCommits: GitHubCommit[] = [];
  const seenCommitShas = new Set<string>();
  
  // Record optimization metrics
  apiTracker.recordOptimizationMetrics(mergedInactiveBranches.length, filteredBranches.length, 'PURE_GRAPHQL');
  
  console.log(`🎯 Processing ${filteredBranches.length} active branches (${mergedInactiveBranches.length} merged/inactive branches automatically skipped)`);
  
  // Process main branch first, then others
  const sortedBranches = filteredBranches.sort((a, b) => {
    if (a.name === defaultBranch) return -1;
    if (b.name === defaultBranch) return 1;
    return 0;
  });
  
  for (const branch of sortedBranches) {
    const branchCommits = await fetchSingleBranchCommits(owner, name, branch.name, repo, fetchAllCommits);
    
    // Filter out already seen commits
    const newCommits = branchCommits.filter(commit => {
      const sha = commit.sha;
      if (seenCommitShas.has(sha)) return false;
      seenCommitShas.add(sha);
      return true;
    });
    
    allCommits.push(...newCommits);
    console.log(`📂 Branch '${branch.name}': ${newCommits.length} unique commits (${branchCommits.length - newCommits.length} duplicates filtered)`);
  }
  
  return allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Strategy Implementation: Hybrid Threshold (for mixed repositories)
async function fetchWithHybridThresholdStrategy(repo: GitHubRepository, profile: RepositoryProfile): Promise<GitHubCommit[]> {
  console.log(`⚖️  Executing HYBRID_THRESHOLD strategy for ${repo.nameWithOwner}`);
  
  // For now, use the GraphQL strategy as a placeholder
  // In a full implementation, this would check branch sizes and use Compare API for small branches
  return await fetchWithPureGraphQLStrategy(repo, profile);
}

// Strategy Implementation: Adaptive Batch (for complex/experimental repositories)
async function fetchWithAdaptiveBatchStrategy(repo: GitHubRepository, profile: RepositoryProfile): Promise<GitHubCommit[]> {
  console.log(`🔄 Executing ADAPTIVE_BATCH strategy for ${repo.nameWithOwner}`);
  
  // For complex repositories, use the most conservative GraphQL approach
  return await fetchWithPureGraphQLStrategy(repo, profile);
}

export async function fetchRepositoryPRs(repo: GitHubRepository): Promise<GitHubPR[]> {
  const [owner, name] = repo.nameWithOwner.split('/');
  
  try {
    const data = await executeGraphQLQuery(GET_REPOSITORY_PRS_QUERY, { owner, name }, 'PullRequests', repo.nameWithOwner);
    const prs = data.repository?.pullRequests?.nodes || [];
    
    return prs.map((pr: any) => ({
      repo: repo.nameWithOwner,
      repo_url: repo.url,
      number: pr.number,
      title: pr.title,
      state: (pr.state.charAt(0).toUpperCase() + pr.state.slice(1).toLowerCase()) as "Open" | "Merged" | "Closed",
      author: pr.author?.login || "Unknown",
      created_at: pr.createdAt,
      merged_at: pr.mergedAt,
      url: pr.url
    }));
  } catch (error) {
    console.error(`Error fetching PRs for ${repo.nameWithOwner}:`, error);
    return [];
  }
}

// Enhanced incremental commit fetching - only fetches from branches that actually changed
export async function fetchRepositoryCommitsSince(repo: GitHubRepository, since: string): Promise<GitHubCommit[]> {
  const [owner, name] = repo.nameWithOwner.split('/');
  
  try {
    console.log(`🔄 Starting optimized incremental commit fetch for ${repo.nameWithOwner} since ${since}`);
    
    // Step 1: Get branch metadata to identify which branches changed
    const changedBranches = await getChangedBranches(repo, since);
    
    if (changedBranches.length === 0) {
      console.log(`📭 No branch changes in ${repo.nameWithOwner} since ${since}`);
      return [];
    }
    
    console.log(`🎯 Found ${changedBranches.length} changed branches in ${repo.nameWithOwner}`);
    
    // Step 2: Fetch commits only from changed branches
    const allCommits: GitHubCommit[] = [];
    const fetchAllCommits = process.env.FETCH_ALL_COMMITS !== 'false';
    
    for (const branch of changedBranches) {
      console.log(`🔄 Fetching new commits from branch '${branch.name}' (last commit: ${new Date(branch.lastCommitDate).toISOString()})`);
      
      // Fetch commits from this specific branch since the specified date
      const branchCommits = await fetchBranchCommitsSince(owner, name, branch.name, since, repo);
      
      if (branchCommits.length > 0) {
        allCommits.push(...branchCommits);
        console.log(`✅ Branch '${branch.name}': ${branchCommits.length} new commits`);
      } else {
        console.log(`📭 Branch '${branch.name}': 0 new commits`);
      }
    }
    
    // Step 3: Sort and deduplicate (since some commits might appear in multiple branches)
    const uniqueCommits = allCommits
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((commit, index, arr) => 
        index === arr.findIndex(c => c.sha === commit.sha)
      );
    
    console.log(`🎉 Optimized incremental sync complete: ${uniqueCommits.length} unique new commits from ${changedBranches.length} changed branches`);
    return uniqueCommits;
    
  } catch (error) {
    console.error(`❌ Error in optimized incremental commit fetch for ${repo.nameWithOwner}:`, error);
    return [];
  }
}

// Get list of active branches that have commits newer than the specified date
async function getChangedBranches(repo: GitHubRepository, since: string): Promise<BranchMetadata[]> {
  const sinceDate = new Date(since);
  
  try {
    console.log(`🔍 Analyzing changed branches in ${repo.nameWithOwner} since ${since} (with merged branch detection)`);
    
    // Get branches with merge analysis to automatically filter out merged/inactive branches
    const allBranchesWithMergeInfo = await mergedBranchDetector.getBranchesWithMergeAnalysis(repo);
    const activeBranches = mergedBranchDetector.getActiveBranches(allBranchesWithMergeInfo);
    const mergedInactiveBranches = mergedBranchDetector.getMergedInactiveBranches(allBranchesWithMergeInfo);
    
    console.log(`📊 Branch filtering: ${activeBranches.length} active, ${mergedInactiveBranches.length} merged/inactive (${mergedInactiveBranches.length} automatically skipped)`);
    
    // Apply exclude prefix filtering to active branches
    const excludePrefixes = process.env.EXCLUDE_BRANCH_PREFIXES 
      ? process.env.EXCLUDE_BRANCH_PREFIXES.split(',').map(prefix => prefix.trim()).filter(Boolean)
      : [];
    
    const filteredActiveBranches = activeBranches.filter(branch => {
      const shouldExclude = excludePrefixes.some(prefix => 
        branch.name.toLowerCase().startsWith(prefix.toLowerCase())
      );
      if (shouldExclude) {
        console.log(`🚫 Excluding active branch '${branch.name}' (matches prefix filter)`);
      }
      return !shouldExclude;
    });
    
    // Find branches with commits newer than since date
    const changedBranches = filteredActiveBranches.filter(branch => {
      const lastCommitDate = new Date(branch.lastCommitDate || 0);
      return lastCommitDate > sinceDate;
    });
    
    console.log(`🎯 Found ${changedBranches.length} changed active branches (${filteredActiveBranches.length - changedBranches.length} active but unchanged)`);
    
    return changedBranches;
    
  } catch (error) {
    console.error(`❌ Error getting changed branches for ${repo.nameWithOwner}:`, error);
    return [];
  }
}

// Optimized incremental PR fetching - uses GitHub's native filtering for efficiency
export async function fetchRepositoryPRsSince(repo: GitHubRepository, since: string): Promise<GitHubPR[]> {
  const [owner, name] = repo.nameWithOwner.split('/');
  
  try {
    console.log(`🔄 Starting optimized incremental PR fetch for ${repo.nameWithOwner} since ${since}`);
    
    // Fetch recent PRs and filter client-side (GitHub GraphQL doesn't support PR since filtering)
    const data = await executeGraphQLQuery(GET_REPOSITORY_PRS_SINCE_QUERY, {
      owner,
      name
    }, 'IncrementalPRs', repo.nameWithOwner);
    
    const allPRs = data.repository?.pullRequests?.nodes || [];
    
    if (allPRs.length === 0) {
      console.log(`📭 No updated PRs found for ${repo.nameWithOwner} since ${since}`);
      return [];
    }
    
    console.log(`🎯 Processing ${allPRs.length} potentially updated PRs for ${repo.nameWithOwner}`);
    
    const sinceDate = new Date(since);
    
    // Filter PRs that were actually created or updated since the last sync
    const updatedPRs = allPRs.filter((pr: any) => {
      const createdAt = new Date(pr.createdAt);
      const updatedAt = new Date(pr.updatedAt || pr.createdAt);
      
      return createdAt > sinceDate || updatedAt > sinceDate;
    });
    
    console.log(`✅ Found ${updatedPRs.length} truly updated PRs (filtered from ${allPRs.length} candidates)`);
    
    const mappedPRs = updatedPRs.map((pr: any) => ({
      repo: repo.nameWithOwner,
      repo_url: repo.url,
      number: pr.number,
      title: pr.title,
      state: (pr.state.charAt(0).toUpperCase() + pr.state.slice(1).toLowerCase()) as "Open" | "Merged" | "Closed",
      author: pr.author?.login || "Unknown",
      created_at: pr.createdAt,
      merged_at: pr.mergedAt,
      url: pr.url
    }));
    
    return mappedPRs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
  } catch (error) {
    console.error(`❌ Error in optimized incremental PR fetch for ${repo.nameWithOwner}:`, error);
    return [];
  }
}

// Helper function to fetch additional commits for branches with more than 100 commits
async function fetchAdditionalBranchCommits(
  owner: string, 
  name: string, 
  branchName: string, 
  cursor: string, 
  repo: GitHubRepository,
  seenCommitShas: Set<string>
): Promise<GitHubCommit[]> {
  const allAdditionalCommits: GitHubCommit[] = [];
  let currentCursor: string | null = cursor;
  let pageCount = 0;
  
  while (currentCursor) {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount} for branch '${branchName}'...`);
    
    const data = await executeGraphQLQuery(GET_MORE_BRANCH_COMMITS_QUERY, {
      owner,
      name,
      branch: `refs/heads/${branchName}`,
      cursor: currentCursor
    }, 'AdditionalBranchCommits', repo.nameWithOwner, branchName);
    
    const commits = data.repository?.ref?.target?.history?.nodes || [];
    const pageInfo = data.repository?.ref?.target?.history?.pageInfo;
    
    // Filter out commits we've already seen
    const newCommits = commits.filter((commit: any) => !seenCommitShas.has(commit.oid));
    
    console.log(`  📝 Got ${commits.length} additional commits (${newCommits.length} new) on page ${pageCount}`);
    
    const branchCommits = newCommits.map((commit: any) => {
      const fullSha = commit.oid;
      const shortSha = fullSha.substring(0, 7);
      seenCommitShas.add(fullSha); // Track this commit
      
      return {
        repo: repo.nameWithOwner,
        repo_url: repo.url,
        branch_name: branchName,
        branch_url: `${repo.url}/tree/${branchName}`,
        sha: shortSha,
        message: commit.message || "No message",
        author: commit.author?.name || commit.author?.user?.login || "Unknown",
        date: commit.committedDate,
        url: commit.url
      };
    });
    
    allAdditionalCommits.push(...branchCommits);
    
    // Check if there are more commits to fetch
    currentCursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
    
    // Small delay between pages to be respectful of API limits
    if (currentCursor) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  
  console.log(`📊 Branch '${branchName}': fetched ${allAdditionalCommits.length} additional commits across ${pageCount} pages`);
  return allAdditionalCommits;
}

// Helper function to fetch commits from a specific branch since a date (for efficient API filtering)
async function fetchBranchCommitsSince(
  owner: string,
  name: string,
  branchName: string,
  since: string,
  repo: GitHubRepository
): Promise<GitHubCommit[]> {
  try {
    const data = await executeGraphQLQuery(GET_BRANCH_COMMITS_SINCE_QUERY, {
      owner,
      name,
      branch: `refs/heads/${branchName}`,
      since
    }, 'BranchCommitsSince', repo.nameWithOwner, branchName);
    
    const commits = data.repository?.ref?.target?.history?.nodes || [];
    
    return commits.map((commit: any) => ({
      repo: repo.nameWithOwner,
      repo_url: repo.url,
      branch_name: branchName,
      branch_url: `${repo.url}/tree/${branchName}`,
      sha: commit.oid.substring(0, 7),
      message: commit.message || "No message",
      author: commit.author?.name || commit.author?.user?.login || "Unknown",
      date: commit.committedDate,
      url: commit.url
    }));
  } catch (error) {
    console.error(`❌ Error fetching commits since ${since} for branch ${branchName}:`, error);
    return [];
  }
}

// Helper function to fetch all commits from a single branch (used in compare strategy)
async function fetchSingleBranchCommits(
  owner: string,
  name: string,
  branchName: string,
  repo: GitHubRepository,
  fetchAllCommits: boolean = true
): Promise<GitHubCommit[]> {
  try {
    const data = await executeGraphQLQuery(GET_SINGLE_BRANCH_COMMITS_QUERY, {
      owner,
      name,
      branch: `refs/heads/${branchName}`
    }, 'SingleBranchCommits', repo.nameWithOwner, branchName);
    
    const commits = data.repository?.ref?.target?.history?.nodes || [];
    const pageInfo = data.repository?.ref?.target?.history?.pageInfo;
    
    // Map initial commits
    const allCommits = commits.map((commit: any) => ({
      repo: repo.nameWithOwner,
      repo_url: repo.url,
      branch_name: branchName,
      branch_url: `${repo.url}/tree/${branchName}`,
      sha: commit.oid.substring(0, 7),
      message: commit.message || "No message",
      author: commit.author?.name || commit.author?.user?.login || "Unknown",
      date: commit.committedDate,
      url: commit.url
    }));
    
    // Fetch additional pages if needed and configured
    if (fetchAllCommits && pageInfo?.hasNextPage) {
      const additionalCommits = await fetchAdditionalBranchCommitsSimple(owner, name, branchName, pageInfo.endCursor, repo);
      allCommits.push(...additionalCommits);
    }
    
    return allCommits;
  } catch (error) {
    console.error(`❌ Error fetching commits for branch ${branchName}:`, error);
    return [];
  }
}

// Helper function to fetch additional commits without deduplication (for pagination)
async function fetchAdditionalBranchCommitsSimple(
  owner: string,
  name: string,
  branchName: string,
  cursor: string,
  repo: GitHubRepository
): Promise<GitHubCommit[]> {
  const allAdditionalCommits: GitHubCommit[] = [];
  let currentCursor: string | null = cursor;
  let pageCount = 0;
  
  while (currentCursor) {
    pageCount++;
    console.log(`📄 Fetching page ${pageCount} for branch '${branchName}'...`);
    
    const data = await executeGraphQLQuery(GET_MORE_BRANCH_COMMITS_QUERY, {
      owner,
      name,
      branch: `refs/heads/${branchName}`,
      cursor: currentCursor
    }, 'AdditionalBranchCommits', repo.nameWithOwner, branchName);
    
    const commits = data.repository?.ref?.target?.history?.nodes || [];
    const pageInfo = data.repository?.ref?.target?.history?.pageInfo;
    
    console.log(`  📝 Got ${commits.length} additional commits (page ${pageCount})`);
    
    const branchCommits = commits.map((commit: any) => ({
      repo: repo.nameWithOwner,
      repo_url: repo.url,
      branch_name: branchName,
      branch_url: `${repo.url}/tree/${branchName}`,
      sha: commit.oid.substring(0, 7),
      message: commit.message || "No message",
      author: commit.author?.name || commit.author?.user?.login || "Unknown",
      date: commit.committedDate,
      url: commit.url
    }));
    
    allAdditionalCommits.push(...branchCommits);
    
    // Check if there are more commits to fetch
    currentCursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
    
    // Small delay between pages to be respectful of API limits
    if (currentCursor) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  
  console.log(`📊 Branch '${branchName}': fetched ${allAdditionalCommits.length} additional commits across ${pageCount} pages`);
  return allAdditionalCommits;
}

// Export API tracking functions
export const startApiTracking = () => apiTracker.startTracking();
export const logApiSummary = () => apiTracker.logSummary();
export const generateApiReport = () => apiTracker.generateReport();