import { GitHubData, GitHubUser } from '@/types/github';

export async function fetchGitHubData(): Promise<GitHubData> {
  const response = await fetch('/api/github/data');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch GitHub data');
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

export async function refreshGitHubData(): Promise<void> {
  const response = await fetch('/api/github/data', {
    method: 'POST'
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to refresh data');
  }
}