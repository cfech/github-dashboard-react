import { GITHUB_API_URL, CONFIG } from './constants';
import fs from 'fs';
import path from 'path';
import { 
  GET_USER_INFO_QUERY, 
  GET_REPOSITORIES_QUERY, 
  GET_ORGANIZATION_REPOS_QUERY,
  GET_REPOSITORY_COMMITS_QUERY,
  GET_REPOSITORY_ALL_BRANCHES_COMMITS_QUERY,
  GET_REPOSITORY_PRS_QUERY
} from './githubQueries';
import { GitHubUser, GitHubRepository, GitHubCommit, GitHubPR } from '@/types/github';

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
    const reportPath = path.join(process.cwd(), 'api-reports', filename);

    const report = this.formatReport(stats);
    
    try {
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
RECOMMENDATIONS
===============
- Monitor rate limit usage to stay within GitHub's 5000 requests/hour limit
- Consider caching strategies for frequently accessed data
- Optimize batch processing for multiple repositories
- Use incremental sync when possible to reduce API calls

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
}

const apiTracker = ApiCallTracker.getInstance();

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
  const [owner, name] = repo.nameWithOwner.split('/');
  
  try {
    console.log(`🔍 Fetching commits from all branches for ${repo.nameWithOwner}`);
    const data = await executeGraphQLQuery(GET_REPOSITORY_ALL_BRANCHES_COMMITS_QUERY, {
      owner,
      name
    }, 'AllBranchesCommits', repo.nameWithOwner);
    
    const branches = data.repository?.refs?.nodes || [];
    console.log(`📝 Found ${branches.length} branches in ${repo.nameWithOwner}`);
    
    const allCommits: GitHubCommit[] = [];
    
    for (const branch of branches) {
      const commits = branch.target?.history?.nodes || [];
      console.log(`📂 Branch '${branch.name}': ${commits.length} commits`);
      
      const branchCommits = commits.map((commit: any) => ({
        repo: repo.nameWithOwner,
        repo_url: repo.url,
        branch_name: branch.name,
        branch_url: `${repo.url}/tree/${branch.name}`,
        sha: commit.oid.substring(0, 7),
        message: commit.message || "No message",
        author: commit.author?.name || commit.author?.user?.login || "Unknown",
        date: commit.committedDate,
        url: commit.url
      }));
      
      allCommits.push(...branchCommits);
    }
    
    // Sort all commits by date (most recent first) and remove duplicates by SHA
    const uniqueCommits = allCommits
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((commit, index, arr) => 
        index === arr.findIndex(c => c.sha === commit.sha)
      );
    
    console.log(`✅ Total unique commits across all branches: ${uniqueCommits.length}`);
    return uniqueCommits;
  } catch (error) {
    console.error(`❌ Error fetching commits for ${repo.nameWithOwner}:`, error);
    return [];
  }
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

// Export API tracking functions
export const startApiTracking = () => apiTracker.startTracking();
export const logApiSummary = () => apiTracker.logSummary();
export const generateApiReport = () => apiTracker.generateReport();