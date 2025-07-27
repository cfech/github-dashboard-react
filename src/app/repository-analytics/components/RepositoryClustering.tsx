'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import { ViewModule, AccountTree, Info, Hub, Analytics } from '@mui/icons-material';
import { GitHubCommit, GitHubPR, GitHubRepository, GitHubUser } from '@/types/github';
import ClusterVisualization from './clustering/ClusterVisualization';
import SimilarityMetrics from './clustering/SimilarityMetrics';

interface RepositoryClusteringProps {
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
  repositories: GitHubRepository[];
  userInfo: GitHubUser;
}

type ViewType = 'cards' | 'table';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`clustering-tabpanel-${index}`}
      aria-labelledby={`clustering-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 4 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `clustering-tab-${index}`,
    'aria-controls': `clustering-tabpanel-${index}`,
  };
}

export interface RepositoryClusterData {
  repository: GitHubRepository;
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
  contributors: string[];
  activityPattern: number[]; // Weekly activity pattern
  maturityScore: number;
  recentActivity: number;
  complexity: number;
  clusterId?: number;
  similarityScores?: Map<string, number>;
}

export interface ClusteringResult {
  clusters: RepositoryClusterData[][];
  repositoryData: RepositoryClusterData[];
  similarityMatrix: number[][];
  clusterLabels: string[];
}

export default function RepositoryClustering({
  commits,
  pullRequests,
  repositories,
  userInfo
}: RepositoryClusteringProps) {
  const [viewType, setViewType] = useState<ViewType>('cards');
  const [tabValue, setTabValue] = useState(0);

  const handleViewTypeChange = (event: SelectChangeEvent<ViewType>) => {
    setViewType(event.target.value as ViewType);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Process repository data for clustering
  const clusteringData = useMemo(() => {
    const repositoryData: RepositoryClusterData[] = repositories.map(repo => {
      const repoCommits = commits.filter(c => c.repo === repo.nameWithOwner);
      const repoPRs = pullRequests.filter(pr => pr.repo === repo.nameWithOwner);
      const contributors = Array.from(new Set(repoCommits.map(c => c.author)));

      // Calculate weekly activity pattern (7 days)
      const activityPattern = new Array(7).fill(0);
      repoCommits.forEach(commit => {
        const date = new Date(commit.date);
        const dayOfWeek = date.getDay();
        activityPattern[dayOfWeek]++;
      });

      // Calculate maturity score (based on age and commit frequency)
      const now = new Date();
      const firstCommit = repoCommits.length > 0 
        ? new Date(Math.min(...repoCommits.map(c => new Date(c.date).getTime())))
        : now;
      const ageInMonths = Math.max(1, (now.getTime() - firstCommit.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const commitsPerMonth = repoCommits.length / ageInMonths;
      const maturityScore = Math.min(100, commitsPerMonth * 10 + Math.min(50, ageInMonths));

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentCommits = repoCommits.filter(c => new Date(c.date) > thirtyDaysAgo);
      const recentActivity = recentCommits.length;

      // Calculate complexity (contributors + branches + PRs)
      const uniqueBranches = Array.from(new Set(repoCommits.map(c => c.branch_name)));
      const complexity = contributors.length * 2 + uniqueBranches.length + repoPRs.length;

      return {
        repository: repo,
        commits: repoCommits,
        pullRequests: repoPRs,
        contributors,
        activityPattern,
        maturityScore,
        recentActivity,
        complexity
      };
    });

    // Calculate similarity matrix
    const similarityMatrix: number[][] = [];
    for (let i = 0; i < repositoryData.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < repositoryData.length; j++) {
        if (i === j) {
          similarityMatrix[i][j] = 1;
        } else {
          similarityMatrix[i][j] = calculateSimilarity(repositoryData[i], repositoryData[j]);
        }
      }
    }

    // Add similarity scores to repository data
    repositoryData.forEach((repo, index) => {
      repo.similarityScores = new Map();
      repositoryData.forEach((otherRepo, otherIndex) => {
        if (index !== otherIndex) {
          repo.similarityScores!.set(otherRepo.repository.nameWithOwner, similarityMatrix[index][otherIndex]);
        }
      });
    });

    // Perform clustering using simple k-means approach
    const clusters = performClustering(repositoryData, similarityMatrix);

    return {
      clusters,
      repositoryData,
      similarityMatrix,
      clusterLabels: generateClusterLabels(clusters)
    };
  }, [commits, pullRequests, repositories]);

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Repository Clustering
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Discover repository relationships and similarity patterns using advanced clustering algorithms
          </Typography>
        </Box>
      </Box>

      {/* Comprehensive Clustering Methodology Overview */}
      <Box sx={{ mb: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Hub color="primary" />
          Advanced Repository Clustering & Analysis
        </Typography>
        <Typography variant="body2" paragraph>
          Our intelligent clustering system groups your organization&apos;s repositories using advanced similarity algorithms to reveal hidden patterns and collaboration opportunities.
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" paragraph>
              <strong>🧠 Adaptive Cluster Count:</strong><br/>
              Dynamically determines 3-6 clusters using formula: min(6, max(3, ceil(repos/4)))<br/>
              • Small teams: 3-4 focused groups<br/>
              • Medium teams: 4-5 balanced clusters<br/>
              • Large teams: Up to 6 specialized groups<br/>
              <em>Why this works:</em> Prevents over-fragmentation while maintaining meaningful distinctions
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" paragraph>
              <strong>⚡ Real-time Similarity Engine:</strong><br/>
              6-factor weighted algorithm analyzing:<br/>
              • Contributor networks (25%)<br/>
              • Activity timing patterns (20%)<br/>
              • Project maturity & scale (30%)<br/>
              • Complexity & recent activity (25%)<br/>
              <em>Result:</em> 0-100% similarity scores with 30% clustering threshold
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" paragraph>
              <strong>📊 Visual Analysis:</strong><br/>
              Multiple visualization modes:<br/>
              • Card layout (detailed overview)<br/>
              • Data table (tabular view)<br/>
              • Similarity metrics (detailed analysis)<br/>
              <em>Interactive:</em> Click to explore repository details and GitHub links
            </Typography>
          </Grid>
        </Grid>
      </Box>

      <Paper elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 80,
              fontSize: '1rem',
              fontWeight: 'medium',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            },
            '& .Mui-selected': {
              fontWeight: 'bold'
            }
          }}
        >
          <Tab 
            icon={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ViewModule sx={{ fontSize: 28 }} />
                <Tooltip title={
                  <Box sx={{ p: 1, maxWidth: 600 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Adaptive Repository Clustering System
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Why 3-6 clusters?</strong> The optimal cluster count is dynamically calculated using min(6, max(3, ceil(repositories/4))). This ensures:
                      • Small orgs (≤12 repos): 3-4 focused clusters for clear patterns
                      • Medium orgs (13-24 repos): 4-6 clusters balancing granularity and clarity
                      • Large orgs (25+ repos): Maximum 6 clusters to prevent over-fragmentation
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>6-Factor similarity algorithm:</strong>
                      • Contributor Overlap (25%): Jaccard index of shared developers
                      • Activity Pattern (20%): Pearson correlation of weekly commit timing
                      • Maturity Alignment (15%): Age and development stage similarity
                      • Recent Activity (15%): Similar current development intensity
                      • Complexity Match (10%): Organizational complexity similarity
                      • Scale Similarity (15%): Total commit volume alignment
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Hierarchical clustering process:</strong>
                      1. Calculate pairwise similarity matrix (all repo combinations)
                      2. Identify highest-similarity repository as cluster seed
                      3. Group repositories with {'>'}30% similarity threshold
                      4. Assign remaining repositories to most similar clusters
                      5. Generate descriptive labels based on cluster characteristics
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cluster labeling logic:</strong> Mature & Stable (high maturity, low activity), High Activity ({'>'}15 recent commits), Complex Projects ({'>'}20 complexity score), New Projects ({'<'}30 maturity).
                    </Typography>
                  </Box>
                }>
                  <Info color="action" fontSize="small" />
                </Tooltip>
              </Box>
            }
            label="Cluster Visualization" 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics sx={{ fontSize: 28 }} />
                <Tooltip title={
                  <Box sx={{ p: 1, maxWidth: 450 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Similarity Metrics Deep Dive
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Six-factor similarity algorithm breakdown:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>1. Contributor Overlap (25%):</strong> Jaccard similarity of contributor sets
                      Formula: |A ∩ B| / |A ∪ B|
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>2. Activity Pattern (20%):</strong> Pearson correlation of weekly commit patterns
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>3-6. Maturity, Activity, Complexity, Scale (45%):</strong> Normalized difference scores
                      Formula: 1 - |metric_A - metric_B| / max(metric_A, metric_B)
                    </Typography>
                    <Typography variant="body2">
                      <strong>Final score:</strong> Weighted sum of all factors (0-1 scale)
                    </Typography>
                  </Box>
                }>
                  <Info color="action" fontSize="small" />
                </Tooltip>
              </Box>
            }
            label="Similarity Metrics" 
            {...a11yProps(1)} 
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Hub color="primary" sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Repository Clusters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {clusteringData.clusters.length} clusters identified using 6-factor similarity analysis
                </Typography>
              </Box>
            </Box>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>View Type</InputLabel>
              <Select
                value={viewType}
                label="View Type"
                onChange={handleViewTypeChange}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="cards">Card Layout</MenuItem>
                <MenuItem value="table">Data Table</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <ClusterVisualization 
            clusteringResult={clusteringData}
            viewType={viewType}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <SimilarityMetrics 
            clusteringResult={clusteringData}
          />
        </TabPanel>

      </Paper>
    </Box>
  );
}

// Calculate similarity between two repositories
function calculateSimilarity(repo1: RepositoryClusterData, repo2: RepositoryClusterData): number {
  let similarity = 0;

  // 1. Contributor Overlap Score (25%)
  const contributors1 = new Set(repo1.contributors);
  const contributors2 = new Set(repo2.contributors);
  const intersection = new Set(Array.from(contributors1).filter(x => contributors2.has(x)));
  const union = new Set([...Array.from(contributors1), ...Array.from(contributors2)]);
  const contributorOverlap = union.size > 0 ? intersection.size / union.size : 0;
  similarity += contributorOverlap * 0.25;

  // 2. Activity Pattern Correlation (20%)
  const pattern1 = repo1.activityPattern;
  const pattern2 = repo2.activityPattern;
  const correlation = calculateCorrelation(pattern1, pattern2);
  similarity += Math.max(0, correlation) * 0.20;

  // 3. Repository Maturity Similarity (15%)
  const maturityDiff = Math.abs(repo1.maturityScore - repo2.maturityScore);
  const maxMaturity = Math.max(repo1.maturityScore, repo2.maturityScore, 1);
  const maturitySimilarity = 1 - (maturityDiff / maxMaturity);
  similarity += maturitySimilarity * 0.15;

  // 4. Recent Activity Alignment (15%)
  const activityDiff = Math.abs(repo1.recentActivity - repo2.recentActivity);
  const maxActivity = Math.max(repo1.recentActivity, repo2.recentActivity, 1);
  const activitySimilarity = 1 - (activityDiff / maxActivity);
  similarity += activitySimilarity * 0.15;

  // 5. Complexity Similarity (10%)
  const complexityDiff = Math.abs(repo1.complexity - repo2.complexity);
  const maxComplexity = Math.max(repo1.complexity, repo2.complexity, 1);
  const complexitySimilarity = 1 - (complexityDiff / maxComplexity);
  similarity += complexitySimilarity * 0.10;

  // 6. Scale Similarity (15%)
  const commits1 = repo1.commits.length;
  const commits2 = repo2.commits.length;
  const commitsDiff = Math.abs(commits1 - commits2);
  const maxCommits = Math.max(commits1, commits2, 1);
  const scaleSimilarity = 1 - (commitsDiff / maxCommits);
  similarity += scaleSimilarity * 0.15;

  return Math.min(1, Math.max(0, similarity));
}

// Calculate correlation between two arrays
function calculateCorrelation(arr1: number[], arr2: number[]): number {
  const n = arr1.length;
  if (n === 0 || n !== arr2.length) return 0;

  const sum1 = arr1.reduce((a, b) => a + b, 0);
  const sum2 = arr2.reduce((a, b) => a + b, 0);
  const mean1 = sum1 / n;
  const mean2 = sum2 / n;

  let numerator = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    sum1Sq += diff1 * diff1;
    sum2Sq += diff2 * diff2;
  }

  const denominator = Math.sqrt(sum1Sq * sum2Sq);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Simple clustering algorithm
function performClustering(
  repositoryData: RepositoryClusterData[], 
  similarityMatrix: number[][]
): RepositoryClusterData[][] {
  const numRepos = repositoryData.length;
  if (numRepos <= 3) {
    // Too few repositories to cluster meaningfully
    return [repositoryData];
  }

  // Determine optimal number of clusters (3-6 based on repository count)
  const numClusters = Math.min(6, Math.max(3, Math.ceil(numRepos / 4)));
  
  // Simple hierarchical clustering approach
  const clusters: RepositoryClusterData[][] = [];
  const assigned = new Set<number>();
  
  for (let clusterIdx = 0; clusterIdx < numClusters && assigned.size < numRepos; clusterIdx++) {
    const cluster: RepositoryClusterData[] = [];
    
    // Find unassigned repository with highest average similarity to unassigned repos
    let bestRepo = -1;
    let bestScore = -1;
    
    for (let i = 0; i < numRepos; i++) {
      if (assigned.has(i)) continue;
      
      let avgSimilarity = 0;
      let count = 0;
      for (let j = 0; j < numRepos; j++) {
        if (i !== j && !assigned.has(j)) {
          avgSimilarity += similarityMatrix[i][j];
          count++;
        }
      }
      
      if (count > 0) {
        avgSimilarity /= count;
        if (avgSimilarity > bestScore) {
          bestScore = avgSimilarity;
          bestRepo = i;
        }
      }
    }
    
    if (bestRepo >= 0) {
      const seedRepo = { ...repositoryData[bestRepo], clusterId: clusterIdx };
      cluster.push(seedRepo);
      assigned.add(bestRepo);
      
      // Add similar repositories to this cluster
      const similarities: Array<{ index: number; similarity: number }> = [];
      for (let i = 0; i < numRepos; i++) {
        if (!assigned.has(i)) {
          similarities.push({
            index: i,
            similarity: similarityMatrix[bestRepo][i]
          });
        }
      }
      
      // Sort by similarity and add top matches
      similarities.sort((a, b) => b.similarity - a.similarity);
      const clusterSize = Math.max(1, Math.floor((numRepos - assigned.size + cluster.length) / (numClusters - clusterIdx)));
      
      for (let i = 0; i < Math.min(clusterSize - 1, similarities.length); i++) {
        if (similarities[i].similarity > 0.3) { // Minimum similarity threshold
          const repoWithCluster = { ...repositoryData[similarities[i].index], clusterId: clusterIdx };
          cluster.push(repoWithCluster);
          assigned.add(similarities[i].index);
        }
      }
    }
    
    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }
  
  // Assign any remaining repositories to the most similar existing cluster
  for (let i = 0; i < numRepos; i++) {
    if (!assigned.has(i)) {
      let bestCluster = 0;
      let bestSimilarity = -1;
      
      clusters.forEach((cluster, clusterIdx) => {
        let avgSimilarity = 0;
        cluster.forEach(repo => {
          const repoIndex = repositoryData.findIndex(r => r.repository.nameWithOwner === repo.repository.nameWithOwner);
          if (repoIndex >= 0) {
            avgSimilarity += similarityMatrix[i][repoIndex];
          }
        });
        avgSimilarity /= cluster.length;
        
        if (avgSimilarity > bestSimilarity) {
          bestSimilarity = avgSimilarity;
          bestCluster = clusterIdx;
        }
      });
      
      const repoWithCluster = { ...repositoryData[i], clusterId: bestCluster };
      clusters[bestCluster].push(repoWithCluster);
    }
  }
  
  return clusters.filter(cluster => cluster.length > 0);
}

// Generate descriptive labels for clusters
function generateClusterLabels(clusters: RepositoryClusterData[][]): string[] {
  return clusters.map((cluster, index) => {
    if (cluster.length === 0) return `Cluster ${index + 1}`;
    
    // Analyze cluster characteristics
    const avgMaturity = cluster.reduce((sum, repo) => sum + repo.maturityScore, 0) / cluster.length;
    const avgActivity = cluster.reduce((sum, repo) => sum + repo.recentActivity, 0) / cluster.length;
    const avgComplexity = cluster.reduce((sum, repo) => sum + repo.complexity, 0) / cluster.length;
    
    // Generate descriptive label based on characteristics
    if (avgMaturity > 70 && avgActivity < 5) {
      return 'Mature & Stable';
    } else if (avgActivity > 15) {
      return 'High Activity';
    } else if (avgComplexity > 20) {
      return 'Complex Projects';
    } else if (avgMaturity < 30) {
      return 'New Projects';
    } else {
      return `Cluster ${index + 1}`;
    }
  });
}