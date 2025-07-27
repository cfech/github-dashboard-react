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


