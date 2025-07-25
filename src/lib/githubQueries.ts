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
              history(first:100) {
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