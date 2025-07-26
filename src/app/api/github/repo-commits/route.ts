import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryCommits } from '@/lib/githubApi';
import { GitHubRepository } from '@/types/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoName = searchParams.get('repo');

  if (!repoName) {
    return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
  }

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  try {
    console.log(`🔍 Fetching commits for repository: ${repoName}`);
    
    // Create a minimal repository object for the API call
    const [, name] = repoName.split('/');
    const repo: GitHubRepository = {
      name,
      nameWithOwner: repoName,
      url: `https://github.com/${repoName}`,
      pushedAt: new Date().toISOString(),
      isPrivate: false,
      defaultBranch: 'main' // This will be updated by the GraphQL query
    };

    const commits = await fetchRepositoryCommits(repo);
    
    console.log(`✅ Successfully fetched ${commits.length} commits for ${repoName}`);
    
    return NextResponse.json({
      repository: repoName,
      commits: commits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    });

  } catch (error) {
    console.error(`❌ Error fetching commits for ${repoName}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch commits for ${repoName}` }, 
      { status: 500 }
    );
  }
}