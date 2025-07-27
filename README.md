# GitHub Dashboard - React v2

A modern, real-time GitHub activity dashboard built with React, Next.js, TypeScript, and Material UI. This dashboard provides comprehensive insights into GitHub repository activity with intelligent color coding, interactive charts, and detailed activity streams.

![GitHub Dashboard Screenshot](https://via.placeholder.com/800x400?text=GitHub+Dashboard+Screenshot)

## ✨ Features

### Core Functionality
- **Real-time Activity Streams**: Live commit and pull request feeds with intelligent color coding
- **Two-Column Layout**: Commit stream (left) and PR stream (right) for optimal viewing
- **TODAY Badges**: Special highlighting for today's activity with gradient styling
- **Timeline Emojis**: Visual indicators for activity recency (🌟 today, 🌙 yesterday, ☄️ this week, ⭐ older)
- **Icon Indicators**: GitHub icon for commits, pull request icon for PRs across all views

### Interactive Features
- **Clickable Activity Charts**: Click chart bars to open detailed modal views
- **Interactive Modal System**: 
  - Detailed commit/PR modals with full search functionality
  - Contributor switching via searchable autocomplete dropdown
  - Lazy loading with scroll-based pagination (50 items at a time)
  - Clickable titles, SHA hashes, and PR numbers linking to GitHub
- **Global Search**: Unified search across all commits and PRs with:
  - Real-time search with 300ms debouncing
  - Search term highlighting in results
  - Relevance scoring and recency weighting
  - Combined results with visual type distinction

### Advanced Features
- **Repository Filtering**: Client-side filtering with repository dropdown
- **Activity Charts**: Interactive bar charts with different thresholds:
  - Commit activity (contributors with 25+ commits)
  - PR activity (contributors with 10+ PRs)
  - Hover tooltips with click instructions
- **Activity Heatmap**: GitHub-style heatmap showing most active hours
- **Light/Dark Mode**: Toggle between light and dark themes with localStorage persistence
- **Debug Mode**: Comprehensive mock data for development with performance logging

### Performance & Security
- **Intelligent Caching System**: 
  - 15-minute cache TTL with incremental sync
  - File-based persistent caching
  - Smart refresh and full sync options
- **Server-side API Integration**: All GitHub API calls are server-side only
- **Performance Monitoring**: Comprehensive timing logs and API call tracking in development
- **Responsive Design**: Mobile-first approach with touch-friendly controls
- **Branch Filtering**: Configurable branch prefix exclusion for cleaner data

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
# ====================================
# REQUIRED ENVIRONMENT VARIABLES
# ====================================

# GitHub Personal Access Token (REQUIRED)
# Get from: https://github.com/settings/tokens
# Required scopes: repo, read:org, read:user, read:project
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Target Organizations (REQUIRED)
# Comma-separated list of GitHub organizations to fetch data from
TARGET_ORGANIZATIONS=myorg,anotherorg

# ====================================
# OPTIONAL ENVIRONMENT VARIABLES
# ====================================

# GitHub Server Configuration (Optional - for GitHub Enterprise)
GITHUB_API_URL=https://api.github.com/graphql
GITHUB_BASE_URL=https://github.com
GITHUB_RAW_URL=https://raw.githubusercontent.com

# API Configuration (Optional - defaults provided)
# LOOK_BACK_DAYS=5               # Currently hardcoded to 5 days of activity history

# Commit Fetching Configuration (Optional)
FETCH_ALL_COMMITS=true          # true=all commits, false=first 100 per branch
EXCLUDE_BRANCH_PREFIXES=        # Comma-separated prefixes to exclude (e.g., "temp,test,codegenie")

# Environment (Optional)
NODE_ENV=development

# ====================================
# CLIENT-SIDE CONFIGURATION
# ====================================

# Debug Mode (Optional - defaults to false)
NEXT_PUBLIC_DEBUG_MODE=true     # Use mock data instead of GitHub API

# Application Configuration (Optional)
NEXT_PUBLIC_APP_NAME="GitHub Dashboard"
# NEXT_PUBLIC_CACHE_TTL=300000  # NOT USED - Cache TTL is hardcoded to 15 minutes
```

### 4. GitHub Personal Access Token Setup

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give your token a descriptive name (e.g., "GitHub Dashboard")
4. Select these **required scopes**:
   - ✅ `repo` - Full control of private repositories
   - ✅ `read:org` - Read organization membership
   - ✅ `read:user` - Read user profile information
   - ✅ `read:project` - Read project boards
5. Set an appropriate expiration date
6. Click "Generate token"
7. **Important**: Copy the token immediately and store it securely
8. Add the token to your `.env.local` file
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
- **Icon Indicators**: GitHub icon for commits, pull request icon for PRs

#### 2. Interactive Chart System
- **Clickable Charts**: Click any chart bar to open detailed modal
- **Smart Thresholds**: Commits (25+), PRs (10+) for cleaner visualization
- **Hover Tooltips**: Interactive guidance with click instructions
- **Modal Details**: Full commit/PR details with search and navigation

#### 3. Advanced Modal Features
- **Searchable Content**: Real-time search within modal results
- **Contributor Switching**: Autocomplete dropdown for all chart contributors
- **Lazy Loading**: Scroll-based pagination (50 items per load)
- **Clickable Elements**: 
  - Commit messages and SHA hashes link to GitHub
  - PR titles and numbers link to GitHub
  - Repository names link to GitHub repos
- **Search State Management**: Search resets when switching contributors

#### 4. Global Search System
- **Unified Search**: Search across all commits and pull requests
- **Smart Results**: Relevance scoring with recency weighting
- **Real-time Highlighting**: Search terms highlighted in results
- **Visual Distinction**: Icons and styling differentiate commits vs PRs
- **Performance Optimized**: 150ms debounce with indexed search

#### 5. Repository Management
- **Sortable Tables**: Date, repository, author columns
- **Repository Filtering**: Dropdown with all available repositories
- **Search Integration**: Highlighting and filtering across all views
- **Branch Filtering**: Configurable exclusion of temporary/test branches

#### 6. Activity Visualization
- **Interactive Bar Charts**: Click for detailed contributor views
- **Activity Heatmap**: GitHub-style contribution heatmap by day/hour
- **Performance Optimized**: Memoized calculations with data integrity checks
- **Smart Filtering**: Automatic threshold-based contributor filtering

#### 7. Theme and UX
- **Light/Dark Mode**: Toggle in header with localStorage persistence
- **Responsive Design**: Mobile-optimized with touch-friendly interactions
- **Consistent Styling**: Typography-based design matching GitHub patterns
- **Loading States**: Smooth loading indicators and skeleton screens

## 🔧 Configuration

### Environment Variables

#### Required Variables (Server-Side Only)
| Variable | Description | Example |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token with required scopes | `ghp_xxxxxxxxxxxx` |
| `TARGET_ORGANIZATIONS` | Comma-separated list of GitHub organizations | `mycompany,opensource-org` |

#### Optional Server-Side Variables
| Variable | Description | Default | Example |
|----------|-------------|---------|----------|
| `GITHUB_API_URL` | GitHub GraphQL API endpoint | `https://api.github.com/graphql` | For GitHub Enterprise |
| `GITHUB_BASE_URL` | GitHub base URL | `https://github.com` | For GitHub Enterprise |
| `GITHUB_RAW_URL` | GitHub raw content URL | `https://raw.githubusercontent.com` | For GitHub Enterprise |
| `LOOK_BACK_DAYS` | Days of activity history to fetch | `5` | `7` |
| `CACHE_TTL_MINUTES` | Cache TTL in minutes | `15` | `30` |
| `FETCH_ALL_COMMITS` | Fetch all commits vs first 100 per branch | `true` | `false` |
| `EXCLUDE_BRANCH_PREFIXES` | Branch prefixes to exclude | `""` (empty) | `"temp,test,codegenie"` |
| `NODE_ENV` | Environment mode | `development` | `production` |

#### Optional Client-Side Variables
| Variable | Description | Default | Example |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_DEBUG_MODE` | Use mock data instead of GitHub API | `false` | `true` |
| `NEXT_PUBLIC_APP_NAME` | Application title | `"GitHub Dashboard"` | `"My Company Dashboard"` |
| `NEXT_PUBLIC_CACHE_TTL` | Cache TTL in milliseconds (for UI display) | `900000` (15 min) | `1800000` (30 min) |

#### Configuration Examples

**Performance Tuning Examples:**
```bash
# For large organizations with many repositories
LOOK_BACK_DAYS=7
CACHE_TTL_MINUTES=30

# For smaller teams with frequent updates
LOOK_BACK_DAYS=3
CACHE_TTL_MINUTES=5

# For development with minimal API usage
LOOK_BACK_DAYS=1
CACHE_TTL_MINUTES=60
```

#### Hardcoded Configuration (Cannot be changed via environment variables)
These values are hardcoded in `src/lib/constants.ts` and `src/components/`:
- **Chart Thresholds**: 25+ commits, 10+ PRs for chart display
- **Modal Pagination**: 50 items per page with lazy loading
- **Search Debounce**: 150ms (global search), 300ms (modal search)
- **Modal Size**: 50% width, 70% height

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
- Adjust cache TTL via `CACHE_TTL_MINUTES` environment variable
- Check token permissions and quotas

#### 3. No Data Showing
**Check**:
- GitHub token has access to target organizations
- Organizations exist and are spelled correctly
- Repositories have recent activity (within `LOOK_BACK_DAYS`, default 5)

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
- Adjust `LOOK_BACK_DAYS` in `.env.local`
- Increase `CACHE_TTL_MINUTES` for less frequent API calls
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
- Exclude auto-generated branches (e.g., from AI tools like Cursor)
- Filter out temporary/experimental branches
- Skip test/staging branches
- Reduce noise from development workflows
- Improve performance by reducing data processing

#### Interactive Features Configuration

**Chart Thresholds** (defined in `src/lib/constants.ts`):
- **Commit Charts**: Show contributors with 25+ commits
- **PR Charts**: Show contributors with 10+ pull requests
- **Modal Pagination**: Load 50 items at a time with scroll-based loading
- **Search Debounce**: 150ms (global search), 300ms (modal search) for optimal performance

**Modal Behavior**:
- **Size**: 50% width, 70% height for optimal viewing
- **Search Reset**: Automatically clears search when switching contributors
- **Lazy Loading**: Infinite scroll with loading indicators
- **Link Behavior**: All GitHub links open in new tabs

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

### Phase 3 (Completed) ✅
- [x] Interactive clickable charts with detailed modals
- [x] Advanced search with relevance scoring and highlighting
- [x] Contributor switching with autocomplete
- [x] Lazy loading and infinite scroll
- [x] Smart branch filtering and performance optimization
- [x] Consistent GitHub-style UI patterns

### Phase 4 (Future)
- [ ] Real-time updates with WebSockets  
- [ ] Advanced filtering options (date ranges, file types)
- [ ] Export functionality (CSV, PDF)
- [ ] Team analytics dashboard with insights
- [ ] Custom widget system and dashboard layouts
- [ ] Mobile app companion
- [ ] Advanced caching with Redis
- [ ] Multi-organization comparison views

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
