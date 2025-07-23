export const CONFIG = {
  DEBUG_DATA_FILENAME: "github_data.json",
  COMMIT_STREAM_DEBUG_FILENAME: "cs_debug.json", 
  LOOK_BACK_DAYS: 5,
  DEFAULT_REPO_FETCH_LIMIT: 25,
  COMMIT_STREAM_REPO_LIMIT: 30,
  COMMITS_PER_REPO_DEFAULT: 10,
  MAX_REPOS_FOR_COMMIT_STREAM: 5,
  REQUEST_TIMEOUT: 30000,
  GRAPHQL_QUERY_TIMEOUT: 45000,
  STREAM_CONTAINER_HEIGHT: 900,
  TABLE_CONTAINER_HEIGHT: 350,
  COMMIT_MESSAGE_MAX_LENGTH: 100,
  PR_TITLE_MAX_LENGTH: 100,
  DEFAULT_TEXT_TRUNCATION_SUFFIX: "...",
  DEFAULT_DISPLAY_COUNT: 10,
  MIN_DISPLAY_COUNT: 1,
  MAX_DISPLAY_COUNT: 50,
};

export const PR_STATUS_EMOJIS = {
  "Open": "🔄",
  "Merged": "✅", 
  "Closed": "❌"
};

export const ACTIVITY_EMOJIS = {
  "commit": "📝",
  "pr": "🔀",
  "repo": "📦", 
  "branch": "🌿",
  "author": "👤",
  "date": "📅"
};

export const TIMELINE_EMOJIS = {
  "today": "🌟",
  "yesterday": "🌙", 
  "this_week": "☄️",
  "older": "⭐"
};

export const DATE_COLORS = {
  today: '#9C27B0',
  yesterday: '#43A047',
  this_week: '#FB8C00',
  older: '#FFFFFF'
};

export const ERROR_MESSAGES = {
  "no_token": "GITHUB_TOKEN environment variable not set.",
  "no_repos": "No repositories found.",
  "no_commits": "No commits found.", 
  "no_prs": "No pull requests found.",
  "api_error": "Error communicating with GitHub API.",
  "timeout_error": "Request timed out.",
  "file_not_found": "Debug file not found.",
  "invalid_data": "Invalid data format received."
};

export const INFO_MESSAGES = {
  "debug_mode_on": "Debug Mode is ON. Using local data.",
  "debug_mode_off": "Debug Mode is OFF. Fetching live data.",
  "no_commits_this_week": "No commits this week.",
  "no_prs_this_week": "No pull requests opened or merged this week.",
  "refresh_data": "Refresh Live Data"
};

export const GITHUB_API_URL = 'https://api.github.com/graphql';