export interface GitHubUser {
  login: string;
  name: string;
  email?: string;
  bio?: string;
  company?: string;
  location?: string;
  avatar_url: string;
  url: string;
  created_at: string;
  followers: number;
  following: number;
  public_repos: number;
  total_commit_contributions: number;
  total_pr_contributions: number;
  total_issue_contributions: number;
  total_repository_contributions: number;
}

export interface GitHubRepository {
  name: string;
  nameWithOwner: string;
  url: string;
  pushedAt: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export interface GitHubCommit {
  repo: string;
  repo_url: string;
  branch_name: string;
  branch_url: string;
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubPR {
  repo: string;
  repo_url: string;
  number: number;
  title: string;
  state: "Open" | "Merged" | "Closed";
  author: string;
  created_at: string;
  merged_at?: string;
  url: string;
}

export interface GitHubData {
  commits: GitHubCommit[];
  pull_requests: GitHubPR[];
  user_info: GitHubUser;
}

export interface SearchIndex {
  commits: Array<{
    id: string;
    searchText: string;
    originalData: GitHubCommit;
  }>;
  prs: Array<{
    id: string;
    searchText: string;
    originalData: GitHubPR;
  }>;
}