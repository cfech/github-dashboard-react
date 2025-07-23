/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    TARGET_ORGANIZATIONS: process.env.TARGET_ORGANIZATIONS,
    REPO_FETCH_LIMIT: process.env.REPO_FETCH_LIMIT,
    LOOK_BACK_DAYS: process.env.LOOK_BACK_DAYS,
  }
}

module.exports = nextConfig