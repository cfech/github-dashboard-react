import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchUserInfo, 
  fetchRepositories, 
  fetchOrganizationRepositories,
  fetchRepositoryCommits,
  fetchRepositoryPRs 
} from '@/lib/githubApi';
import { ERROR_MESSAGES, CONFIG } from '@/lib/constants';
import { GitHubRepository, GitHubCommit, GitHubPR } from '@/types/github';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry>();

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

export async function GET(request: NextRequest) {
  try {
    // Check if GitHub token is configured
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.no_token },
        { status: 500 }
      );
    }

    const cacheKey = 'github-dashboard-data';
    
    // Check cache first
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      console.log('💾 Cache HIT - returning cached data');
      const response = NextResponse.json(cachedData);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    console.log('💾 Cache MISS - fetching fresh data');
    console.group('🔍 GitHub API Performance');
    console.time('Total API Fetch');

    // 1. Fetch user info
    console.time('User Info Query');
    const userInfo = await fetchUserInfo();
    console.timeEnd('User Info Query');

    // 2. Get target organizations from environment
    const targetOrgs = process.env.TARGET_ORGANIZATIONS?.split(',').map(org => org.trim()) || [];
    console.log(`🎯 Target organizations: ${targetOrgs.join(', ')}`);

    // 3. Fetch repositories from user and organizations
    console.time('Repository Discovery');
    let allRepositories: GitHubRepository[] = [];
    
    // Fetch user repositories
    const userRepos = await fetchRepositories();
    allRepositories.push(...userRepos);
    
    // Fetch organization repositories
    for (const orgName of targetOrgs) {
      try {
        const orgRepos = await fetchOrganizationRepositories(orgName);
        allRepositories.push(...orgRepos);
      } catch (error) {
        console.warn(`Failed to fetch repositories for org: ${orgName}`, error);
      }
    }

    // Filter by recent activity only (include all repositories)
    const cutoffDate = new Date(Date.now() - CONFIG.LOOK_BACK_DAYS * 24 * 60 * 60 * 1000);
    console.log(`⏰ Filtering repositories with activity since: ${cutoffDate.toISOString()}`);
    console.log(`📊 Total repositories discovered: ${allRepositories.length}`);
    
    const recentRepos = allRepositories
      .filter(repo => {
        const pushedAt = new Date(repo.pushedAt);
        const isRecent = pushedAt >= cutoffDate;
        const daysSinceLastPush = Math.ceil((Date.now() - pushedAt.getTime()) / (1000 * 60 * 60 * 24));
        
        if (isRecent) {
          console.log(`✅ ${repo.nameWithOwner}: last pushed ${daysSinceLastPush} days ago (${pushedAt.toISOString()})`);
        } else {
          console.log(`❌ ${repo.nameWithOwner}: last pushed ${daysSinceLastPush} days ago - too old`);
        }
        
        return isRecent;
      })
      .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
      .slice(0, CONFIG.DEFAULT_REPO_FETCH_LIMIT);

    console.log(`📦 Repository Discovery: Found ${recentRepos.length} active repositories (limited to ${CONFIG.DEFAULT_REPO_FETCH_LIMIT})`);
    console.timeEnd('Repository Discovery');

    // 4. Fetch commits and PRs for each repository
    console.time('Bulk Data Query');
    const allCommits: GitHubCommit[] = [];
    const allPRs: GitHubPR[] = [];

    const fetchPromises = recentRepos.map(async (repo) => {
      try {
        const [commits, prs] = await Promise.all([
          fetchRepositoryCommits(repo),
          fetchRepositoryPRs(repo)
        ]);
        
        // Filter commits by date
        const recentCommits = commits.filter(commit => {
          const commitDate = new Date(commit.date);
          return commitDate >= cutoffDate;
        });
        
        // Filter PRs by date
        const recentPRs = prs.filter(pr => {
          const prDate = new Date(pr.created_at);
          return prDate >= cutoffDate;
        });
        
        return { commits: recentCommits, prs: recentPRs };
      } catch (error) {
        console.warn(`Failed to fetch data for repo: ${repo.nameWithOwner}`, error);
        return { commits: [], prs: [] };
      }
    });

    const results = await Promise.all(fetchPromises);
    
    results.forEach(({ commits, prs }) => {
      allCommits.push(...commits);
      allPRs.push(...prs);
    });

    console.log(`🔄 Bulk Data Query: ${allCommits.length} commits, ${allPRs.length} PRs`);
    console.timeEnd('Bulk Data Query');
    console.timeEnd('Total API Fetch');
    console.groupEnd();

    // 5. Prepare response data
    const responseData = {
      user_info: userInfo,
      commits: allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      pull_requests: allPRs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    };

    // Cache the data
    const cacheTTL = parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '300000');
    setCache(cacheKey, responseData, cacheTTL);

    // Set response headers
    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', `public, s-maxage=${cacheTTL / 1000}, stale-while-revalidate=${cacheTTL / 500}`);
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return NextResponse.json(
      { 
        error: ERROR_MESSAGES.api_error,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST route to refresh cache
export async function POST(request: NextRequest) {
  try {
    const cacheKey = 'github-dashboard-data';
    cache.delete(cacheKey);
    
    console.log('🔄 Cache manually cleared');
    
    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}