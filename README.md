# GitHub Dashboard - React v2

A modern, real-time GitHub activity dashboard built with React, Next.js, TypeScript, and Material UI. This dashboard provides comprehensive insights into GitHub repository activity with intelligent color coding, interactive charts, and detailed activity streams.

![GitHub Dashboard Screenshot](https://via.placeholder.com/800x400?text=GitHub+Dashboard+Screenshot)

## ✨ Features

### Core Functionality
- **Real-time Activity Streams**: Live commit and pull request feeds with intelligent color coding
- **Two-Column Layout**: Commit stream (left) and PR stream (right) for optimal viewing
- **TODAY Badges**: Special highlighting for today's activity
- **Timeline Emojis**: Visual indicators for activity recency (🌟 today, 🌙 yesterday, ☄️ this week, ⭐ older)

### Advanced Features
- **Global Search**: Search across all commits and PRs by message content or author
- **Repository Filtering**: Client-side filtering with repository dropdown
- **Activity Charts**: Bar charts showing commit and PR activity by contributor
- **Activity Heatmap**: GitHub-style heatmap showing most active hours
- **Light/Dark Mode**: Toggle between light and dark themes with localStorage persistence
- **Debug Mode**: Mock data for development with comprehensive performance logging

### Performance & Security
- **Server-side API Integration**: All GitHub API calls are server-side only
- **Aggressive Caching**: 5-minute TTL to respect GitHub API limits
- **Performance Monitoring**: Comprehensive timing logs in development mode
- **Responsive Design**: Mobile-first approach with touch-friendly controls

## 🛠 Technology Stack

- **Frontend**: React 18+ with Next.js 14 for server-side rendering
- **Language**: TypeScript with strict mode
- **UI Library**: Material UI (MUI) v5+ with custom theming
- **State Management**: React Context API for theme management
- **Charts**: Chart.js with react-chartjs-2
- **Authentication**: GitHub Personal Access Token (server-side only)
- **Styling**: MUI theming with custom color schemes

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: Version 18+ or 20+
- **npm**: Version 8+ (comes with Node.js)
- **GitHub Account**: With access to target organizations
- **GitHub Personal Access Token**: With required scopes (see setup section)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd github-dashboard-react-v2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Server-side only (NEVER expose to client)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TARGET_ORGANIZATIONS=myorg,anotherorg

# GitHub Server Configuration (Optional - for GitHub Enterprise)
GITHUB_API_URL=https://api.github.com/graphql
GITHUB_BASE_URL=https://github.com
GITHUB_RAW_URL=https://raw.githubusercontent.com

# API Configuration
REPO_FETCH_LIMIT=25
LOOK_BACK_DAYS=5

# Commit Fetching Configuration
FETCH_ALL_COMMITS=true
EXCLUDE_BRANCH_PREFIXES=ex1,ex2,ex3

# Client-side safe
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_APP_NAME="GitHub Dashboard"
NEXT_PUBLIC_CACHE_TTL=300000
```

### 4. GitHub Personal Access Token Setup

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select these required scopes:
   - ✅ `repo` - Full control of private repositories
   - ✅ `read:org` - Read organization membership
   - ✅ `read:user` - Read user profile information  
   - ✅ `read:project` - Read project boards
4. Copy the token and add it to your `.env.local` file

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |

## 🎯 Usage Guide

### Debug Mode vs Production

**Debug Mode** (`NEXT_PUBLIC_DEBUG_MODE=true`):
- Uses comprehensive mock data
- Shows performance timing in console
- Disables refresh button to prevent API calls
- Perfect for development and testing

**Production Mode** (`NEXT_PUBLIC_DEBUG_MODE=false`):
- Fetches real data from GitHub API
- Enables refresh functionality
- Respects API rate limits with caching
- Requires valid GitHub token

### Key Features

#### 1. Activity Streams
- **Commit Stream**: Shows recent commits with repository, branch, message, and author
- **PR Stream**: Displays pull requests with status, title, and merge information
- **Color Coding**: Purple (today), green (yesterday), orange (this week), white (older)

#### 2. Global Search
- Search across all commits and pull requests
- Real-time results with 300ms debounce
- Highlights matching terms in results
- Shows combined results with visual distinction

#### 3. Repository Table
- Sortable columns (date, repository, author)
- Repository filtering via dropdown
- Search integration with highlighting
- Fixed height with scrolling

#### 4. Activity Visualization
- **Bar Charts**: Commit and PR activity by top contributors
- **Heatmap**: GitHub-style activity heatmap by day/hour
- **Performance Optimized**: Memoized calculations

#### 5. Theme Management
- Light/dark mode toggle in header
- Automatic localStorage persistence
- Consistent color schemes across modes

## 🔧 Configuration

### Environment Variables

#### Server-Side (Never expose to client)
```bash
GITHUB_TOKEN=<your_github_token>              # GitHub API authentication
TARGET_ORGANIZATIONS=<comma_separated_orgs>   # Organizations to fetch
REPO_FETCH_LIMIT=25                          # Max repositories per org
LOOK_BACK_DAYS=5                            # Days of activity to show

# Commit Fetching Configuration
FETCH_ALL_COMMITS=true                       # true=all commits, false=first 100 per branch
EXCLUDE_BRANCH_PREFIXES=<comma_separated>    # Filter branches starting with these prefixes

NODE_ENV=development                         # Environment mode
```

#### Client-Side (Safe for browser)
```bash
NEXT_PUBLIC_DEBUG_MODE=true                  # Enable debug mode
NEXT_PUBLIC_APP_NAME="GitHub Dashboard"      # Application title
NEXT_PUBLIC_CACHE_TTL=300000                # Cache TTL (5 minutes)
```

### Customization

#### Color Scheme
Edit `src/lib/theme.ts` to customize colors:

```typescript
export const PROJECT_COLORS = {
  today: '#9C27B0',        // Purple for today's activity
  yesterday: '#43A047',    // Green for yesterday
  thisWeek: '#FB8C00',     // Orange for this week
  older: '#FFFFFF',        // White for older items
  // ... more colors
};
```

#### Performance Thresholds
Modify `src/lib/constants.ts` for performance monitoring:

```typescript
const PERFORMANCE_THRESHOLDS = {
  apiCall: 1000,        // Warn if API call > 1s
  dataProcessing: 500,  // Warn if processing > 500ms
  componentRender: 200, // Warn if render > 200ms
  searchOperation: 100, // Warn if search > 100ms
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "GITHUB_TOKEN environment variable not set"
**Solution**: Ensure your `.env.local` file contains a valid GitHub token with required scopes.

#### 2. Rate Limiting Issues
**Solutions**:
- Enable debug mode for development
- Ensure 5-minute cache TTL is working
- Check token permissions and quotas

#### 3. No Data Showing
**Check**:
- GitHub token has access to target organizations
- Organizations exist and are spelled correctly
- Repositories have recent activity (within LOOK_BACK_DAYS)

#### 4. Build Errors
**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npm run type-check
```

#### 5. Performance Issues
**Optimizations**:
- Enable debug mode to use mock data
- Reduce `REPO_FETCH_LIMIT` in `.env.local`
- Decrease `LOOK_BACK_DAYS` for less data processing
- Set `FETCH_ALL_COMMITS=false` for faster syncs (limits to 100 commits per branch)
- Use `EXCLUDE_BRANCH_PREFIXES` to filter out temporary/generated branches

### Advanced Configuration

#### Commit Fetching Control
Control how many commits are fetched per branch:

```bash
# Fetch ALL commits from ALL branches (comprehensive but slower)
FETCH_ALL_COMMITS=true

# Fetch only first 100 commits per branch (faster, good for most use cases)
FETCH_ALL_COMMITS=false
```

**Performance Impact**:
- `true`: Complete history, may take longer for repositories with many commits
- `false`: Recent commits only, significantly faster API calls

#### Branch Filtering
Exclude branches that start with specific prefixes:

```bash
# Filter out branches starting with these prefixes
EXCLUDE_BRANCH_PREFIXES=codegenie,temp,test,feature/temp

# Examples of branches that would be filtered:
# - codegenie-feature-123
# - temp-branch
# - test-implementation
# - feature/temp-fix
```

**Use Cases**:
- Exclude auto-generated branches (e.g., from AI tools)
- Filter out temporary/experimental branches
- Skip test/staging branches
- Reduce noise from development workflows

### Development Tips

#### 1. Performance Monitoring
Enable detailed console logging in development:
```typescript
// Automatic in development mode
console.group('🔍 GitHub API Performance');
console.log('📊 User Info Query: 234ms');
console.log('📦 Repository Discovery: 567ms');
console.groupEnd();
```

#### 2. Mock Data Development
Use debug mode for rapid development:
```bash
NEXT_PUBLIC_DEBUG_MODE=true
```

#### 3. API Testing
Test GraphQL queries directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -X POST \
     -d '{"query": "query { viewer { login name } }"}' \
     https://api.github.com/graphql
```

## 🔐 Security Considerations

### Critical Security Requirements

1. **Never expose GitHub tokens client-side**
   - All API calls must be server-side only
   - Use Next.js API routes for GitHub integration
   - Environment variables prefixed with `NEXT_PUBLIC_` are exposed to clients

2. **Token Permissions**
   - Use minimal required scopes
   - Regularly rotate tokens
   - Monitor token usage in GitHub settings

3. **Data Validation**
   - All user inputs are sanitized
   - GraphQL queries use parameterized variables
   - Error messages don't expose sensitive information

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables for Production

Ensure these are set in your deployment platform:
```bash
GITHUB_TOKEN=<your_production_token>
TARGET_ORGANIZATIONS=<your_orgs>
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_CACHE_TTL=300000
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up environment: `cp .env.example .env.local`
5. Enable debug mode: `NEXT_PUBLIC_DEBUG_MODE=true`

### Code Style

- Use TypeScript with strict mode
- Follow Material UI component patterns
- Add JSDoc comments for complex functions
- Use conventional commit messages

### Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add screenshots for UI changes
4. Request review from maintainers

## 📊 Performance Benchmarks

### Target Performance Metrics

- **Initial Page Load**: < 3 seconds
- **Search Operations**: < 100ms
- **Data Processing**: < 500ms
- **API Calls**: < 1 second each
- **Component Renders**: < 200ms

### Optimization Techniques

1. **Data Caching**: 5-minute TTL for all API responses
2. **Component Memoization**: React.memo for expensive renders
3. **Search Indexing**: Pre-processed search data for instant results
4. **Virtualization**: For large lists (not yet implemented)
5. **Code Splitting**: Next.js automatic optimization

## 📈 Roadmap

### Phase 1 (Completed) ✅
- [x] Basic dashboard layout
- [x] Commit and PR streams
- [x] Material UI theming
- [x] Debug mode with mock data

### Phase 2 (Completed) ✅
- [x] Global search functionality
- [x] Activity charts
- [x] Repository filtering
- [x] Activity heatmap

### Phase 3 (Future)
- [ ] Real-time updates with WebSockets  
- [ ] Advanced filtering options
- [ ] Export functionality (CSV, PDF)
- [ ] Team analytics dashboard
- [ ] Custom widget system
- [ ] Mobile app companion

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GitHub API**: For providing comprehensive repository data
- **Material UI**: For the excellent component library
- **Chart.js**: For powerful chart visualization
- **Next.js**: For the amazing React framework
- **TypeScript**: For type safety and developer experience

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/github-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/github-dashboard/discussions)
- **Documentation**: This README and inline code comments

---

**Made with ❤️ for the developer community**# github-dashboard-react
