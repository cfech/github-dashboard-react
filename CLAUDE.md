# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Commands:**
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production (includes TypeScript checking)
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks only

**Debug Mode:**
Set `NEXT_PUBLIC_DEBUG_MODE=true` in `.env.local` to use comprehensive mock data and disable GitHub API calls during development.

## Architecture Overview

### Tech Stack
- **Next.js 14** with App Router
- **TypeScript** with strict mode
- **Material-UI v5** for components and theming
- **Chart.js + react-chartjs-2** for visualizations
- **GitHub GraphQL API** for data fetching

### Core Data Flow
1. **API Routes** (`src/app/api/github/`) - Server-side GitHub API integration
2. **Incremental Sync System** (`src/lib/incrementalSync.ts`) - Intelligent data fetching with caching
3. **File Cache** (`src/lib/fileCache.ts`) - Persistent storage with TTL
4. **Main Dashboard** (`src/app/page.tsx`) - Client-side orchestration

### Key Components Architecture

**Data Components:**
- `CommitStream` & `PRStream` - Real-time activity feeds with color coding
- `ActivityCharts` - Interactive bar charts with clickable modal details
- `ActivityHeatmap` - GitHub-style contribution heatmap
- `GlobalSearch` - Unified search across commits and PRs with relevance scoring

**Modal System:**
- `CommitDetailsModal` & `PRDetailsModal` - Detail views with search, lazy loading, and contributor switching
- Shared search hooks in `src/hooks/useSearch.ts`

### State Management Patterns
- **Local State**: Component-level useState for UI state
- **Context**: Theme provider for light/dark mode
- **Debug Mode**: Environment-driven mock data vs real API calls

## Environment Configuration

**Required Environment Variables:**
```bash
# Server-side only (NEVER expose to client)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TARGET_ORGANIZATIONS=org1,org2,org3

# Client-side safe
NEXT_PUBLIC_DEBUG_MODE=true  # Use mock data for development
```

**Optional Configuration:**
```bash
LOOK_BACK_DAYS=5           # Days of activity to fetch
CACHE_TTL_MINUTES=15       # Cache TTL in minutes
FETCH_ALL_COMMITS=true     # true=all commits, false=first 100 per branch
EXCLUDE_BRANCH_PREFIXES=temp,test  # Filter branches by prefix
```

## File Structure Patterns

### Component Organization
- **Streams**: `CommitStream.tsx`, `PRStream.tsx` - Activity feeds
- **Modals**: `*DetailsModal.tsx` - Detail views with search
- **Charts**: `ActivityCharts.tsx`, `ActivityHeatmap.tsx` - Visualizations
- **Core**: `Header.tsx`, `Sidebar.tsx`, `GlobalSearch.tsx` - Layout

### Utility Libraries
- `src/lib/githubApi.ts` - GitHub GraphQL client with API call tracking
- `src/lib/constants.ts` - Configuration, emojis, error messages
- `src/lib/theme.ts` - Material-UI theme with custom colors
- `src/utils/dateUtils.ts` - Date formatting and color coding

### Type Definitions
- `src/types/github.ts` - Core GitHub entities (User, Repository, Commit, PR)
- `src/types/profiling.ts` - Performance tracking and caching types

## Interactive Features

### Modal System
Both `CommitDetailsModal` and `PRDetailsModal` support:
- **Clickable Charts**: Click chart bars to open detailed views
- **Search**: Real-time search with debouncing and highlighting
- **Contributor Switching**: Searchable autocomplete dropdown
- **Lazy Loading**: Scroll-based pagination (50 items at a time)
- **Consistent UX**: Matches global search styling patterns

### Search Implementation
- **Global Search**: Unified search across all commits and PRs
- **Modal Search**: Filtered search within selected contributor's items
- **Search Hooks**: `useCommitSearch` and `usePRSearch` in `src/hooks/useSearch.ts`
- **Highlighting**: Search term highlighting with regex-based matching

### Color Coding System
Timeline-based colors defined in `src/lib/constants.ts`:
- **Purple** (`#9C27B0`) - Today's activity
- **Green** (`#43A047`) - Yesterday's activity  
- **Orange** (`#FB8C00`) - This week's activity
- **White** (`#FFFFFF`) - Older activity

## API Integration

### GitHub GraphQL Queries
Located in `src/lib/githubQueries.ts`:
- User info and organization access
- Repository discovery with pagination
- Commit fetching with branch traversal
- Pull request data with merge status

### Caching Strategy
- **File-based cache** with configurable TTL (default 15 minutes)
- **Incremental sync** for efficiency
- **Full sync** option for complete refresh
- **Debug mode** bypasses API entirely
- **Configuration**: Set `CACHE_TTL_MINUTES` environment variable

### Performance Tracking
Built-in API call tracking with timing metrics:
```typescript
console.group('🔍 GitHub API Performance');
console.log('📊 User Info Query: 234ms');
console.log('📦 Repository Discovery: 567ms');
```

## Theme System

### Material-UI Configuration
- Custom theme in `src/lib/theme.ts`
- Light/dark mode toggle with localStorage persistence
- Consistent color palette across components

### Color Standards
- **Chart Colors**: Defined in `PROJECT_COLORS` constant
- **Status Colors**: Success (green), warning (orange), error (red)
- **Timeline Colors**: Activity recency indicators

## Common Development Patterns

### Modal Components
When creating new modals, follow the established pattern:
1. Local search state + hook integration
2. Contributor switching via autocomplete
3. Lazy loading with scroll detection
4. Typography-based styling (avoid chips except for special indicators)

### Search Implementation
Use the established search hooks:
```typescript
const { searchTerm, searchResults, handleSearchChange, clearSearch } = useCommitSearch(commits);
```

### Error Handling
- Server-side errors return NextResponse.json with appropriate status codes
- Client-side errors use Material-UI Snackbar for user feedback
- Debug mode provides detailed console logging

## Testing & Building

**Type Safety:**
- All components use strict TypeScript
- Comprehensive type definitions for GitHub entities
- ESLint configuration with Next.js rules

**Build Verification:**
- `npm run build` includes TypeScript checking
- ESLint warnings for missing dependencies
- Production optimizations via Next.js

## Security Considerations

- **GitHub tokens are server-side only** - Never expose in client code
- **Environment variable prefixes**: `NEXT_PUBLIC_*` are exposed to client
- **API routes**: All GitHub API calls go through Next.js API routes
- **Input sanitization**: Search terms and user inputs are properly escaped