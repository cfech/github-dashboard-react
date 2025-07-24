import { GitHubData, GitHubUser } from '@/types/github';

// Fetch GitHub data (uses cache if valid, otherwise performs incremental sync)
export async function fetchGitHubData(): Promise<GitHubData> {
  const response = await fetch('/api/github/data');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch GitHub data');
  }
  
  return response.json();
}

// Refresh GitHub data (performs incremental sync to check for new commits/PRs)
export async function refreshGitHubData(): Promise<GitHubData> {
  const response = await fetch('/api/github/data?refresh=true');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to refresh GitHub data');
  }
  
  return response.json();
}

// Full sync GitHub data (completely refreshes all data from GitHub)
export async function fullSyncGitHubData(): Promise<GitHubData> {
  const response = await fetch('/api/github/data?fullSync=true');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to perform full sync');
  }
  
  return response.json();
}

export async function fetchGitHubUser(): Promise<GitHubUser> {
  const response = await fetch('/api/github/user');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch user data');
  }
  
  return response.json();
}

