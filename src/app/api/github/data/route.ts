import { NextRequest, NextResponse } from 'next/server';
import { performIncrementalSync, performFullSync } from '@/lib/incrementalSync';
import { getCachedData, isCacheValid } from '@/lib/fileCache';
import { ERROR_MESSAGES } from '@/lib/constants';

// Cache validation period in minutes - configurable via environment variable
const CACHE_VALID_MINUTES = parseInt(process.env.CACHE_TTL_MINUTES || '15');

export async function GET(request: NextRequest) {
  try {
    // Check if GitHub token is configured
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.no_token },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const forceFullSync = searchParams.get('fullSync') === 'true';
    const forceRefresh = searchParams.get('refresh') === 'true';

    console.log('🔍 GitHub API Request:', { forceFullSync, forceRefresh });

    // Check if cache exists at all
    const cachedData = getCachedData();
    const cacheExists = cachedData !== null;
    
    // If no cache exists, force a full sync on initial load
    if (!cacheExists && !forceFullSync && !forceRefresh) {
      console.log('📂 No cache found - performing initial full sync...');
      const syncResult = await performFullSync();
      
      const responseData = {
        user_info: syncResult.user_info,
        repositories: syncResult.repositories.map(repo => ({
          nameWithOwner: repo.nameWithOwner,
          name: repo.name,
          url: repo.url,
          isPrivate: repo.isPrivate,
          pushedAt: repo.pushedAt,
          defaultBranch: repo.defaultBranch
        })),
        commits: syncResult.commits,
        pull_requests: syncResult.pull_requests,
        cache_info: {
          source: 'initial_full_sync',
          last_sync: syncResult.syncTimestamp,
          is_incremental: false,
          new_commits: syncResult.newCommitsCount,
          new_prs: syncResult.newPRsCount,
          initial_load: true
        }
      };

      const response = NextResponse.json(responseData);
      response.headers.set('X-Cache', 'INITIAL_SYNC');
      response.headers.set('X-Cache-Source', 'full_sync');
      console.log(`✅ Initial sync completed: ${responseData.commits.length} commits, ${responseData.pull_requests.length} PRs`);
      return response;
    }
    
    // Check if we should use cached data
    if (!forceRefresh && !forceFullSync && isCacheValid(CACHE_VALID_MINUTES)) {
      console.log('💾 Using valid cached data');
      if (cachedData) {
        const response = NextResponse.json({
          user_info: cachedData.user_info,
          repositories: cachedData.repositories.map(repo => ({
            nameWithOwner: repo.nameWithOwner,
            name: repo.name,
            url: repo.url,
            isPrivate: repo.isPrivate,
            pushedAt: repo.pushedAt,
            defaultBranch: repo.defaultBranch
          })),
          commits: cachedData.commits,
          pull_requests: cachedData.pull_requests,
          cache_info: {
            source: 'file_cache',
            last_sync: cachedData.metadata.lastSync,
            last_full_sync: cachedData.metadata.lastFullSync,
            is_incremental: false
          }
        });
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Source', 'file');
        return response;
      }
    }

    // Determine sync type
    let syncResult;
    if (forceFullSync) {
      console.log('🔄 Performing forced full sync');
      syncResult = await performFullSync();
    } else {
      console.log('🔄 Performing incremental sync');
      syncResult = await performIncrementalSync();
    }

    // Prepare response data
    const responseData = {
      user_info: syncResult.user_info,
      repositories: syncResult.repositories.map(repo => ({
        nameWithOwner: repo.nameWithOwner,
        name: repo.name,
        url: repo.url,
        isPrivate: repo.isPrivate,
        pushedAt: repo.pushedAt,
        defaultBranch: repo.defaultBranch
      })),
      commits: syncResult.commits,
      pull_requests: syncResult.pull_requests,
      cache_info: {
        source: 'github_api',
        last_sync: syncResult.syncTimestamp,
        is_incremental: syncResult.isIncremental,
        new_commits: syncResult.newCommitsCount,
        new_prs: syncResult.newPRsCount
      }
    };

    // Set response headers
    const response = NextResponse.json(responseData);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-Cache-Source', syncResult.isIncremental ? 'incremental_sync' : 'full_sync');
    response.headers.set('X-New-Commits', syncResult.newCommitsCount.toString());
    response.headers.set('X-New-PRs', syncResult.newPRsCount.toString());

    console.log(`✅ API Response: ${responseData.commits.length} commits, ${responseData.pull_requests.length} PRs`);
    console.log(`📊 New data: +${syncResult.newCommitsCount} commits, +${syncResult.newPRsCount} PRs`);

    return response;

  } catch (error) {
    console.error('❌ GitHub API Error:', error);
    
    // Try to return cached data as fallback
    const cachedData = getCachedData();
    if (cachedData) {
      console.log('📂 Returning cached data as fallback');
      const response = NextResponse.json({
        user_info: cachedData.user_info,
        repositories: cachedData.repositories.map(repo => ({
          nameWithOwner: repo.nameWithOwner,
          name: repo.name,
          url: repo.url,
          isPrivate: repo.isPrivate,
          pushedAt: repo.pushedAt,
          defaultBranch: repo.defaultBranch
        })),
        commits: cachedData.commits,
        pull_requests: cachedData.pull_requests,
        cache_info: {
          source: 'file_cache_fallback',
          last_sync: cachedData.metadata.lastSync,
          last_full_sync: cachedData.metadata.lastFullSync,
          error: 'API request failed, using cached data'
        }
      });
      response.headers.set('X-Cache', 'FALLBACK');
      return response;
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch GitHub data',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}