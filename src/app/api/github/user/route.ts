import { NextRequest, NextResponse } from 'next/server';
import { fetchUserInfo } from '@/lib/githubApi';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Check if GitHub token is configured
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.no_token },
        { status: 500 }
      );
    }

    console.time('🔍 GitHub API Performance - User Info');
    const userInfo = await fetchUserInfo();
    console.timeEnd('🔍 GitHub API Performance - User Info');

    // Set cache headers (5 minutes)
    const response = NextResponse.json(userInfo);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.api_error },
      { status: 500 }
    );
  }
}