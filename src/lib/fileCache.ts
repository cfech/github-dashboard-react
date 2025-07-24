import fs from 'fs';
import path from 'path';
import { GitHubCommit, GitHubPR, GitHubUser, GitHubRepository } from '@/types/github';

const CACHE_DIR = path.join(process.cwd(), '.github-dashboard-cache');
const COMMITS_FILE = path.join(CACHE_DIR, 'commits.json');
const PRS_FILE = path.join(CACHE_DIR, 'pull-requests.json');
const USER_FILE = path.join(CACHE_DIR, 'user-info.json');
const REPOS_FILE = path.join(CACHE_DIR, 'repositories.json');
const METADATA_FILE = path.join(CACHE_DIR, 'metadata.json');

interface CacheMetadata {
  lastSync: string;
  lastFullSync: string;
  version: string;
}

interface CachedData {
  commits: GitHubCommit[];
  pull_requests: GitHubPR[];
  user_info: GitHubUser | null;
  repositories: GitHubRepository[];
  metadata: CacheMetadata;
}

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`📁 Created cache directory: ${CACHE_DIR}`);
  }
}

// Read metadata from file
export function getCacheMetadata(): CacheMetadata | null {
  try {
    ensureCacheDir();
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading cache metadata:', error);
  }
  return null;
}

// Write metadata to file
export function setCacheMetadata(metadata: CacheMetadata) {
  try {
    ensureCacheDir();
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    console.log(`💾 Cache metadata updated: last sync ${metadata.lastSync}`);
  } catch (error) {
    console.error('Error writing cache metadata:', error);
  }
}

// Read all cached data
export function getCachedData(): CachedData | null {
  try {
    ensureCacheDir();
    
    const metadata = getCacheMetadata();
    if (!metadata) return null;

    const commits = fs.existsSync(COMMITS_FILE) 
      ? JSON.parse(fs.readFileSync(COMMITS_FILE, 'utf8')) 
      : [];
    
    const pull_requests = fs.existsSync(PRS_FILE) 
      ? JSON.parse(fs.readFileSync(PRS_FILE, 'utf8')) 
      : [];
    
    const user_info = fs.existsSync(USER_FILE) 
      ? JSON.parse(fs.readFileSync(USER_FILE, 'utf8')) 
      : null;
    
    const repositories = fs.existsSync(REPOS_FILE) 
      ? JSON.parse(fs.readFileSync(REPOS_FILE, 'utf8')) 
      : [];

    console.log(`📖 Loaded cached data: ${commits.length} commits, ${pull_requests.length} PRs, ${repositories.length} repos`);
    console.log(`📅 Last sync: ${metadata.lastSync}, Last full sync: ${metadata.lastFullSync}`);

    return {
      commits,
      pull_requests,
      user_info,
      repositories,
      metadata
    };
  } catch (error) {
    console.error('Error reading cached data:', error);
    return null;
  }
}

// Write all data to cache files
export function setCachedData(data: Omit<CachedData, 'metadata'>, isFullSync: boolean = false) {
  try {
    ensureCacheDir();
    
    const now = new Date().toISOString();
    const existingMetadata = getCacheMetadata();
    
    const metadata: CacheMetadata = {
      lastSync: now,
      lastFullSync: isFullSync ? now : (existingMetadata?.lastFullSync || now),
      version: '1.0.0'
    };

    // Write data files
    fs.writeFileSync(COMMITS_FILE, JSON.stringify(data.commits, null, 2));
    fs.writeFileSync(PRS_FILE, JSON.stringify(data.pull_requests, null, 2));
    fs.writeFileSync(USER_FILE, JSON.stringify(data.user_info, null, 2));
    fs.writeFileSync(REPOS_FILE, JSON.stringify(data.repositories, null, 2));
    
    // Write metadata
    setCacheMetadata(metadata);

    console.log(`💾 Cached data saved: ${data.commits.length} commits, ${data.pull_requests.length} PRs, ${data.repositories.length} repos`);
    console.log(`📅 ${isFullSync ? 'Full sync' : 'Incremental sync'} completed at ${now}`);
  } catch (error) {
    console.error('Error writing cached data:', error);
  }
}

// Merge new data with existing cached data
export function mergeCachedData(newCommits: GitHubCommit[], newPRs: GitHubPR[], newRepos: GitHubRepository[] = []) {
  const existingData = getCachedData();
  if (!existingData) {
    console.log('🆕 No existing cache, treating as full sync');
    return {
      commits: newCommits,
      pull_requests: newPRs,
      repositories: newRepos
    };
  }

  // Merge commits (deduplicate by repo + SHA)
  const commitMap = new Map<string, GitHubCommit>();
  
  // Add existing commits
  existingData.commits.forEach(commit => {
    const key = `${commit.repo}-${commit.sha}`;
    commitMap.set(key, commit);
  });
  
  // Add/update with new commits
  let newCommitCount = 0;
  newCommits.forEach(commit => {
    const key = `${commit.repo}-${commit.sha}`;
    if (!commitMap.has(key)) {
      newCommitCount++;
    }
    commitMap.set(key, commit);
  });

  // Merge PRs (deduplicate by repo + number)
  const prMap = new Map<string, GitHubPR>();
  
  // Add existing PRs
  existingData.pull_requests.forEach(pr => {
    const key = `${pr.repo}-${pr.number}`;
    prMap.set(key, pr);
  });
  
  // Add/update with new PRs
  let newPRCount = 0;
  newPRs.forEach(pr => {
    const key = `${pr.repo}-${pr.number}`;
    if (!prMap.has(key)) {
      newPRCount++;
    }
    prMap.set(key, pr);
  });

  // Merge repositories (keep existing + add new)
  const repoMap = new Map<string, GitHubRepository>();
  
  // Add existing repos
  existingData.repositories.forEach(repo => {
    repoMap.set(repo.nameWithOwner, repo);
  });
  
  // Add/update with new repos
  newRepos.forEach(repo => {
    repoMap.set(repo.nameWithOwner, repo);
  });

  const mergedData = {
    commits: Array.from(commitMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    pull_requests: Array.from(prMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    repositories: Array.from(repoMap.values()).sort((a, b) => a.nameWithOwner.localeCompare(b.nameWithOwner))
  };

  console.log(`🔄 Merged data: +${newCommitCount} new commits, +${newPRCount} new PRs`);
  console.log(`📊 Total after merge: ${mergedData.commits.length} commits, ${mergedData.pull_requests.length} PRs, ${mergedData.repositories.length} repos`);

  return mergedData;
}

// Clear all cached data
export function clearCache() {
  try {
    const files = [COMMITS_FILE, PRS_FILE, USER_FILE, REPOS_FILE, METADATA_FILE];
    files.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    console.log('🗑️ Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Check if cache exists and is recent
export function isCacheValid(maxAgeMinutes: number = 60): boolean {
  const metadata = getCacheMetadata();
  if (!metadata) return false;

  const lastSync = new Date(metadata.lastSync);
  const now = new Date();
  const ageMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

  return ageMinutes < maxAgeMinutes;
}