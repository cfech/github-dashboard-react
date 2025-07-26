import { fetchUserInfo, fetchRepositories, fetchOrganizationRepositories, fetchRepositoryCommits, fetchRepositoryCommitsSince, fetchRepositoryPRs, fetchRepositoryPRsSince, startApiTracking, logApiSummary, generateApiReport } from './githubApi';
import { getCachedData, setCachedData, mergeCachedData, getCacheMetadata } from './fileCache';
import { CONFIG } from './constants';
import { GitHubRepository, GitHubCommit, GitHubPR } from '@/types/github';

export interface SyncResult {
  commits: GitHubCommit[];
  pull_requests: GitHubPR[];
  repositories: GitHubRepository[];
  user_info: any;
  isIncremental: boolean;
  newCommitsCount: number;
  newPRsCount: number;
  syncTimestamp: string;
}

// Fetch only new commits since last sync for a specific repository
async function fetchIncrementalCommits(repo: GitHubRepository, since: string): Promise<GitHubCommit[]> {
  try {
    console.log(`🔄 Fetching incremental commits for ${repo.nameWithOwner} since ${since}`);
    
    // Use efficient GitHub API 'since' parameter to only fetch new commits
    const newCommits = await fetchRepositoryCommitsSince(repo, since);
    
    console.log(`📝 Found ${newCommits.length} new commits for ${repo.nameWithOwner}`);
    return newCommits;
  } catch (error) {
    console.error(`❌ Error fetching incremental commits for ${repo.nameWithOwner}:`, error);
    return [];
  }
}

// Fetch PRs with status updates since last sync for a specific repository
async function fetchIncrementalPRs(repo: GitHubRepository, since: string, cachedPRs: GitHubPR[] = []): Promise<GitHubPR[]> {
  try {
    console.log(`🔄 Fetching incremental PRs for ${repo.nameWithOwner} since ${since}`);
    
    // Use efficient GitHub API to only fetch PRs created or updated since last sync
    const updatedPRs = await fetchRepositoryPRsSince(repo, since);
    
    console.log(`🔀 Found ${updatedPRs.length} updated PRs for ${repo.nameWithOwner}`);
    return updatedPRs;
  } catch (error) {
    console.error(`❌ Error fetching incremental PRs for ${repo.nameWithOwner}:`, error);
    return [];
  }
}

// Perform incremental sync - only fetch new data since last sync
export async function performIncrementalSync(): Promise<SyncResult> {
  console.log('🔄 Starting incremental sync...');
  console.time('Incremental Sync');
  
  const cachedData = getCachedData();
  const metadata = getCacheMetadata();
  
  if (!cachedData || !metadata) {
    console.log('📂 No cached data found, performing full sync instead');
    return performFullSync();
  }

  const since = metadata.lastSync;
  console.log(`📅 Fetching data since: ${since}`);

  try {
    // Use cached repositories for incremental sync
    const repositories = cachedData.repositories;
    console.log(`📦 Using ${repositories.length} cached repositories`);

    // Filter repositories to only those that have been pushed since last sync
    const lastSyncDate = new Date(since);
    const updatedRepos = repositories.filter(repo => {
      const pushedAt = new Date(repo.pushedAt);
      const wasUpdated = pushedAt > lastSyncDate;
      
      if (wasUpdated) {
        console.log(`📤 Repository ${repo.nameWithOwner} was pushed at ${pushedAt.toISOString()} (after last sync)`);
      }
      
      return wasUpdated;
    });

    console.log(`🎯 Found ${updatedRepos.length} repositories updated since last sync (${repositories.length} total cached)`);
    
    if (updatedRepos.length === 0) {
      console.log(`✨ No repositories updated since last sync - returning cached data`);
      return {
        commits: cachedData.commits,
        pull_requests: cachedData.pull_requests,
        repositories: cachedData.repositories,
        user_info: cachedData.user_info,
        isIncremental: true,
        newCommitsCount: 0,
        newPRsCount: 0,
        syncTimestamp: new Date().toISOString()
      };
    }

    // Fetch incremental data for updated repositories
    const incrementalPromises = updatedRepos.map(async (repo) => {
      const [commits, prs] = await Promise.all([
        fetchIncrementalCommits(repo, since),
        fetchIncrementalPRs(repo, since, cachedData.pull_requests)
      ]);
      return { repo: repo.nameWithOwner, commits, prs };
    });

    const results = await Promise.all(incrementalPromises);
    
    // Combine all new commits and PRs
    const newCommits: GitHubCommit[] = [];
    const newPRs: GitHubPR[] = [];
    
    results.forEach(({ repo, commits, prs }) => {
      newCommits.push(...commits);
      newPRs.push(...prs);
    });

    console.log(`✅ Incremental sync found: ${newCommits.length} new commits, ${newPRs.length} new PRs`);

    // Merge with existing cached data
    const mergedData = mergeCachedData(newCommits, newPRs, []);
    
    // Save merged data to cache (incremental sync)
    setCachedData({
      commits: mergedData.commits,
      pull_requests: mergedData.pull_requests,
      repositories: mergedData.repositories,
      user_info: cachedData.user_info
    }, false);

    console.timeEnd('Incremental Sync');

    return {
      commits: mergedData.commits,
      pull_requests: mergedData.pull_requests,
      repositories: mergedData.repositories,
      user_info: cachedData.user_info,
      isIncremental: true,
      newCommitsCount: newCommits.length,
      newPRsCount: newPRs.length,
      syncTimestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Incremental sync failed, fallback to cached data:', error);
    console.timeEnd('Incremental Sync');
    
    // Return cached data if incremental sync fails
    return {
      commits: cachedData.commits,
      pull_requests: cachedData.pull_requests,
      repositories: cachedData.repositories,
      user_info: cachedData.user_info,
      isIncremental: true,
      newCommitsCount: 0,
      newPRsCount: 0,
      syncTimestamp: metadata.lastSync
    };
  }
}

// Perform full sync - fetch all data fresh
export async function performFullSync(): Promise<SyncResult> {
  console.log('🔄 Starting full sync...');
  console.time('Full Sync');
  
  // Start API tracking
  startApiTracking();

  try {
    // 1. Fetch user info
    console.time('User Info Query');
    const userInfo = await fetchUserInfo();
    console.timeEnd('User Info Query');

    // 2. Get target organizations
    const targetOrgs = process.env.TARGET_ORGANIZATIONS?.split(',').map(org => org.trim()) || [];
    console.log(`🎯 Target organizations:`, targetOrgs.length > 0 ? targetOrgs.join(', ') : 'None');

    // 3. Fetch all repositories
    console.time('Repository Discovery');
    const allRepositories: GitHubRepository[] = [];

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

    console.log(`📦 Repository Discovery: ${allRepositories.length} repos found`);
    console.timeEnd('Repository Discovery');

    // 4. Fetch data from ALL repositories (full sync)
    console.log(`🎯 Fetching data from ALL ${allRepositories.length} repositories (this may take a while...)`);

    // Sort repositories by most recently pushed for better progress feedback
    const sortedRepos = allRepositories
      .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime());

    // 5. Fetch commits and PRs for ALL repositories
    console.time('Bulk Data Query');
    const allCommits: GitHubCommit[] = [];
    const allPRs: GitHubPR[] = [];

    // Process repositories in batches to avoid overwhelming the API
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < sortedRepos.length; i += BATCH_SIZE) {
      batches.push(sortedRepos.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} repositories each`);

    // Process each batch sequentially to avoid rate limiting
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} repos)`);

      const fetchPromises = batch.map(async (repo) => {
        try {
          console.log(`  📝 Fetching ${repo.nameWithOwner}...`);
          const [commits, prs] = await Promise.all([
            fetchRepositoryCommits(repo),
            fetchRepositoryPRs(repo)
          ]);
          return { commits, prs };
        } catch (error) {
          console.warn(`  ❌ Failed to fetch data for repo: ${repo.nameWithOwner}`, error);
          return { commits: [], prs: [] };
        }
      });

      const results = await Promise.all(fetchPromises);
      
      results.forEach(({ commits, prs }) => {
        allCommits.push(...commits);
        allPRs.push(...prs);
      });

      console.log(`  ✅ Batch ${batchIndex + 1} complete: ${allCommits.length} total commits, ${allPRs.length} total PRs`);
      
      // Small delay between batches to be respectful to GitHub API
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Full sync completed: ${allCommits.length} commits, ${allPRs.length} PRs`);
    console.timeEnd('Bulk Data Query');

    // Log API call summary and generate report
    logApiSummary();
    const reportFile = await generateApiReport();
    if (reportFile) {
      console.log(`📄 Detailed API report saved: ${reportFile}`);
    }

    // 6. Save all data to cache (full sync)
    setCachedData({
      commits: allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      pull_requests: allPRs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      repositories: allRepositories,
      user_info: userInfo
    }, true);

    console.timeEnd('Full Sync');

    return {
      commits: allCommits,
      pull_requests: allPRs,
      repositories: allRepositories,
      user_info: userInfo,
      isIncremental: false,
      newCommitsCount: allCommits.length,
      newPRsCount: allPRs.length,
      syncTimestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Full sync failed:', error);
    console.timeEnd('Full Sync');
    
    // Still generate report even if sync failed
    logApiSummary();
    const reportFile = await generateApiReport();
    if (reportFile) {
      console.log(`📄 API report saved despite sync failure: ${reportFile}`);
    }
    
    throw error;
  }
}