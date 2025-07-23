import { GitHubData } from '@/types/github';

export const mockData: GitHubData = {
  user_info: {
    login: "connorfech",
    name: "Connor Fech",
    email: "connor@example.com",
    bio: "Full-stack developer passionate about React and TypeScript",
    company: "GitHub Dashboard Inc",
    location: "San Francisco, CA",
    avatar_url: "https://avatars.githubusercontent.com/u/1234567?v=4",
    url: "https://github.com/connorfech",
    created_at: "2020-01-01T00:00:00Z",
    followers: 150,
    following: 75,
    public_repos: 42,
    total_commit_contributions: 1234,
    total_pr_contributions: 89,
    total_issue_contributions: 156,
    total_repository_contributions: 25,
  },
  commits: [
    // Today's commits
    {
      repo: "cfech/github-dashboard",
      repo_url: "https://github.com/cfech/github-dashboard",
      branch_name: "main",
      branch_url: "https://github.com/cfech/github-dashboard/tree/main",
      sha: "d332219",
      message: "Add real-time activity streams with color coding and intelligent filtering",
      author: "Connor Fech",
      date: new Date().toISOString(),
      url: "https://github.com/cfech/github-dashboard/commit/d332219"
    },
    {
      repo: "myorg/api-service",
      repo_url: "https://github.com/myorg/api-service",
      branch_name: "feature/auth",
      branch_url: "https://github.com/myorg/api-service/tree/feature/auth",
      sha: "a1b2c3d",
      message: "Implement JWT authentication middleware for secure API endpoints",
      author: "Sarah Johnson",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      url: "https://github.com/myorg/api-service/commit/a1b2c3d"
    },
    {
      repo: "anotherorg/frontend-app",
      repo_url: "https://github.com/anotherorg/frontend-app",
      branch_name: "develop",
      branch_url: "https://github.com/anotherorg/frontend-app/tree/develop",
      sha: "e4f5g6h",
      message: "Fix responsive layout issues on mobile devices and improve accessibility",
      author: "Mike Chen",
      date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      url: "https://github.com/anotherorg/frontend-app/commit/e4f5g6h"
    },
    // Yesterday's commits
    {
      repo: "cfech/github-dashboard",
      repo_url: "https://github.com/cfech/github-dashboard",
      branch_name: "main",
      branch_url: "https://github.com/cfech/github-dashboard/tree/main",
      sha: "i7j8k9l",
      message: "Update Material UI theming with dark mode support and custom color palette",
      author: "Connor Fech",
      date: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // Yesterday
      url: "https://github.com/cfech/github-dashboard/commit/i7j8k9l"
    },
    {
      repo: "myorg/database-utils",
      repo_url: "https://github.com/myorg/database-utils",
      branch_name: "main",
      branch_url: "https://github.com/myorg/database-utils/tree/main",
      sha: "m1n2o3p",
      message: "Optimize database queries for better performance in production environment",
      author: "Alex Rodriguez",
      date: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // Yesterday
      url: "https://github.com/myorg/database-utils/commit/m1n2o3p"
    },
    // This week's commits
    {
      repo: "anotherorg/ci-pipeline",
      repo_url: "https://github.com/anotherorg/ci-pipeline",
      branch_name: "main",
      branch_url: "https://github.com/anotherorg/ci-pipeline/tree/main",
      sha: "q4r5s6t",
      message: "Configure automated testing pipeline with GitHub Actions and Docker",
      author: "Emma Davis",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      url: "https://github.com/anotherorg/ci-pipeline/commit/q4r5s6t"
    },
    {
      repo: "myorg/monitoring-tools",
      repo_url: "https://github.com/myorg/monitoring-tools",
      branch_name: "feature/alerts",
      branch_url: "https://github.com/myorg/monitoring-tools/tree/feature/alerts",
      sha: "u7v8w9x",
      message: "Add comprehensive error monitoring and alerting system integration",
      author: "David Kim",
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      url: "https://github.com/myorg/monitoring-tools/commit/u7v8w9x"
    },
    // Older commits
    {
      repo: "cfech/personal-blog",
      repo_url: "https://github.com/cfech/personal-blog",
      branch_name: "main",
      branch_url: "https://github.com/cfech/personal-blog/tree/main",
      sha: "y1z2a3b",
      message: "Publish new blog post about React performance optimization techniques",
      author: "Connor Fech",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      url: "https://github.com/cfech/personal-blog/commit/y1z2a3b"
    },
    {
      repo: "anotherorg/legacy-system",
      repo_url: "https://github.com/anotherorg/legacy-system",
      branch_name: "refactor",
      branch_url: "https://github.com/anotherorg/legacy-system/tree/refactor",
      sha: "c4d5e6f",
      message: "Refactor legacy PHP code to modern Laravel framework with improved security",
      author: "Lisa Wang",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      url: "https://github.com/anotherorg/legacy-system/commit/c4d5e6f"
    }
  ],
  pull_requests: [
    // Today's PRs
    {
      repo: "cfech/github-dashboard",
      repo_url: "https://github.com/cfech/github-dashboard",
      number: 123,
      title: "Add comprehensive GitHub Dashboard with real-time activity streams",
      state: "Open",
      author: "connorfech",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      url: "https://github.com/cfech/github-dashboard/pull/123"
    },
    {
      repo: "myorg/api-service",
      repo_url: "https://github.com/myorg/api-service",
      number: 456,
      title: "Implement OAuth 2.0 authentication flow with refresh token support",
      state: "Merged",
      author: "sarahjohnson",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      merged_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      url: "https://github.com/myorg/api-service/pull/456"
    },
    // Yesterday's PRs
    {
      repo: "anotherorg/frontend-app",
      repo_url: "https://github.com/anotherorg/frontend-app",
      number: 789,
      title: "Fix critical bug in user authentication causing session timeouts",
      state: "Merged",
      author: "mikechen",
      created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // Yesterday
      merged_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      url: "https://github.com/anotherorg/frontend-app/pull/789"
    },
    {
      repo: "myorg/database-utils",
      repo_url: "https://github.com/myorg/database-utils",
      number: 101,
      title: "Add database migration scripts for new user preferences table",
      state: "Open",
      author: "alexrodriguez",
      created_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // Yesterday
      url: "https://github.com/myorg/database-utils/pull/101"
    },
    // This week's PRs
    {
      repo: "anotherorg/ci-pipeline",
      repo_url: "https://github.com/anotherorg/ci-pipeline",
      number: 202,
      title: "Update CI/CD pipeline to support multi-environment deployments",
      state: "Merged",
      author: "emmadavis",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      merged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      url: "https://github.com/anotherorg/ci-pipeline/pull/202"
    },
    // Older PRs
    {
      repo: "cfech/personal-blog",
      repo_url: "https://github.com/cfech/personal-blog",
      number: 303,
      title: "Redesign blog layout with improved typography and mobile responsiveness",
      state: "Closed",
      author: "connorfech",
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      url: "https://github.com/cfech/personal-blog/pull/303"
    },
    {
      repo: "myorg/monitoring-tools",
      repo_url: "https://github.com/myorg/monitoring-tools",
      number: 404,
      title: "Integrate Prometheus metrics collection with custom dashboards",
      state: "Merged",
      author: "davidkim",
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      merged_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      url: "https://github.com/myorg/monitoring-tools/pull/404"
    }
  ]
};