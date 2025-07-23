import { GITHUB_API_URL, CONFIG } from './constants';
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

async function executeGraphQLQuery(query: string, variables?: any) {
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
    
    return result.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export async function fetchUserInfo(): Promise<GitHubUser> {
  const startTime = performance.now();
  const data = await executeGraphQLQuery(GET_USER_INFO_QUERY);
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
    const data = await executeGraphQLQuery(GET_REPOSITORIES_QUERY, { after });
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
    const data = await executeGraphQLQuery(GET_ORGANIZATION_REPOS_QUERY, { org: orgName, after });
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
    });
    
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
    const data = await executeGraphQLQuery(GET_REPOSITORY_PRS_QUERY, { owner, name });
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