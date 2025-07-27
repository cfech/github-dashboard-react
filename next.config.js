/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    TARGET_ORGANIZATIONS: process.env.TARGET_ORGANIZATIONS,
    LOOK_BACK_DAYS: process.env.LOOK_BACK_DAYS,
    CACHE_TTL_MINUTES: process.env.CACHE_TTL_MINUTES,
  }
}

module.exports = nextConfig