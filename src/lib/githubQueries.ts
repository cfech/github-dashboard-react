export const REPOSITORY_FIELDS_FRAGMENT = `
  fragment RepositoryFields on Repository {
    name
    nameWithOwner
    url
    pushedAt
    isPrivate
    defaultBranchRef {
      name
    }
  }
`;

export const COMMIT_FIELDS_FRAGMENT = `
  fragment CommitFields on Commit {
    oid
    message
    committedDate
    author {
      name
      email
      user {
        login
      }
    }
    url
  }
`;

export const PULL_REQUEST_FIELDS_FRAGMENT = `
  fragment PullRequestFields on PullRequest {
    number
    title
    url
    createdAt
    mergedAt
    state
    author {
      login
    }
    repository {
      nameWithOwner
      url
    }
  }
`;

export const GET_USER_INFO_QUERY = `
  query GetUserInfo {
    viewer {
      login
      name
      email
      bio
      company
      location
      avatarUrl
      url
      createdAt
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(first: 1) {
        totalCount
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoryContributions
      }
    }
  }
`;

export const GET_REPOSITORIES_QUERY = `
  query GetRepositories($after: String) {
    viewer {
      repositories(first: 100, after: $after, orderBy: {field: PUSHED_AT, direction: DESC}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ...RepositoryFields
        }
      }
    }
  }
  ${REPOSITORY_FIELDS_FRAGMENT}
`;

export const GET_ORGANIZATION_REPOS_QUERY = `
  query GetOrganizationRepos($org: String!, $after: String) {
    organization(login: $org) {
      repositories(first: 100, after: $after, orderBy: {field: PUSHED_AT, direction: DESC}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ...RepositoryFields
        }
      }
    }
  }
  ${REPOSITORY_FIELDS_FRAGMENT}
`;

export const GET_REPOSITORY_COMMITS_QUERY = `
  query GetRepositoryCommits($owner: String!, $name: String!, $branch: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(first: 100) {
              nodes {
                ...CommitFields
              }
            }
          }
        }
      }
    }
  }
  ${COMMIT_FIELDS_FRAGMENT}
`;

export const GET_REPOSITORY_ALL_BRANCHES_COMMITS_QUERY = `
  query GetRepositoryAllBranchesCommits($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      refs(refPrefix: "refs/heads/", first: 20) {
        nodes {
          name
          target {
            ... on Commit {
              history(first: 100) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  ...CommitFields
                }
              }
            }
          }
        }
      }
    }
  }
  ${COMMIT_FIELDS_FRAGMENT}
`;

// Query to fetch commits from a specific branch since a date (for more efficient branch processing)
export const GET_BRANCH_COMMITS_SINCE_QUERY = `
  query GetBranchCommitsSince($owner: String!, $name: String!, $branch: String!, $since: GitTimestamp!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(first: 100, since: $since) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ...CommitFields
              }
            }
          }
        }
      }
    }
  }
  ${COMMIT_FIELDS_FRAGMENT}
`;

// Query to fetch commits since a specific date (for incremental sync)
export const GET_REPOSITORY_COMMITS_SINCE_QUERY = `
  query GetRepositoryCommitsSince($owner: String!, $name: String!, $since: GitTimestamp!) {
    repository(owner: $owner, name: $name) {
      refs(refPrefix: "refs/heads/", first: 20) {
        nodes {
          name
          target {
            ... on Commit {
              history(first: 100, since: $since) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  ...CommitFields
                }
              }
            }
          }
        }
      }
    }
  }
  ${COMMIT_FIELDS_FRAGMENT}
`;

// Query to fetch additional commits from a specific branch when there are more than 100
export const GET_MORE_BRANCH_COMMITS_QUERY = `
  query GetMoreBranchCommits($owner: String!, $name: String!, $branch: String!, $cursor: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(first: 100, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ...CommitFields
              }
            }
          }
        }
      }
    }
  }
  ${COMMIT_FIELDS_FRAGMENT}
`;

export const GET_REPOSITORY_PRS_QUERY = `
  query GetRepositoryPRs($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          ...PullRequestFields
        }
      }
    }
  }
  ${PULL_REQUEST_FIELDS_FRAGMENT}
`;

// Query to fetch PRs updated since a specific date (for incremental sync)
export const GET_REPOSITORY_PRS_SINCE_QUERY = `
  query GetRepositoryPRsSince($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          ...PullRequestFields
          updatedAt
        }
      }
    }
  }
  ${PULL_REQUEST_FIELDS_FRAGMENT}
`;

// Query to get basic branch information for comparison strategy
export const GET_REPOSITORY_BRANCHES_QUERY = `
  query GetRepositoryBranches($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        name
      }
      refs(refPrefix: "refs/heads/", first: 50) {
        nodes {
          name
          target {
            ... on Commit {
              oid
              committedDate
            }
          }
        }
      }
    }
  }
`;

// Query to get commits from a single branch (for main branch full fetch)
export const GET_SINGLE_BRANCH_COMMITS_QUERY = `
  query GetSingleBranchCommits($owner: String!, $name: String!, $branch: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(first: 100) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ...CommitFields
              }
            }
          }
        }
      }
    }
  }
  ${COMMIT_FIELDS_FRAGMENT}
`;

// Query to get branch metadata with last commit info (for profiling and incremental sync)
export const GET_BRANCHES_WITH_LAST_COMMIT_QUERY = `
  query GetBranchesWithLastCommit($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        name
      }
      refs(refPrefix: "refs/heads/", first: 50) {
        nodes {
          name
          target {
            ... on Commit {
              oid
              committedDate
              history(first: 1) {
                nodes {
                  ... on Commit {
                    oid
                    committedDate
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Query to get branch comparison stats (for profiling)
export const GET_BRANCH_COMPARISON_STATS_QUERY = `
  query GetBranchComparisonStats($owner: String!, $name: String!, $base: String!, $head: String!) {
    repository(owner: $owner, name: $name) {
      compareResult: object(expression: $head) {
        ... on Commit {
          history(first: 1, since: $base) {
            totalCount
          }
        }
      }
    }
  }
`;

// Query for REST API style compare (for hybrid strategy)
export const GET_REPOSITORY_COMPARE_QUERY = `
  query GetRepositoryCompare($owner: String!, $name: String!, $base: String!, $head: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $head) {
        compare(headRef: $base) {
          ahead_by: aheadBy
          behind_by: behindBy
          commits {
            totalCount
          }
        }
      }
    }
  }
`;

// Query to get branches with detailed merge analysis information
export const GET_BRANCHES_WITH_MERGE_INFO_QUERY = `
  query GetBranchesWithMergeInfo($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        name
        target {
          ... on Commit {
            oid
            committedDate
          }
        }
      }
      refs(refPrefix: "refs/heads/", first: 50) {
        nodes {
          name
          target {
            ... on Commit {
              oid
              committedDate
              history(first: 1) {
                nodes {
                  ... on Commit {
                    oid
                    committedDate
                  }
                }
              }
            }
          }
          associatedPullRequests(first: 1, states: [MERGED]) {
            nodes {
              number
              state
              mergedAt
              baseRefName
              headRefName
            }
          }
        }
      }
    }
  }
`;

// Query to check if a branch has unique commits compared to main
export const GET_BRANCH_UNIQUE_COMMITS_QUERY = `
  query GetBranchUniqueCommits($owner: String!, $name: String!, $branch: String!, $base: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(first: 5) {
              nodes {
                oid
                parents(first: 5) {
                  nodes {
                    oid
                  }
                }
              }
            }
          }
        }
      }
      baseRef: ref(qualifiedName: $base) {
        target {
          ... on Commit {
            history(first: 100) {
              nodes {
                oid
              }
            }
          }
        }
      }
    }
  }
`;

// Query to get PRs associated with a specific branch
export const GET_BRANCH_ASSOCIATED_PRS_QUERY = `
  query GetBranchAssociatedPRs($owner: String!, $name: String!, $headRefName: String!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 5, headRefName: $headRefName, states: [MERGED, CLOSED]) {
        nodes {
          number
          state
          mergedAt
          closedAt
          baseRefName
          headRefName
          title
        }
      }
    }
  }
`;