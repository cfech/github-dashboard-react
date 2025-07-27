'use client';

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  IconButton,
  Alert,
  Divider
} from '@mui/material';
import { GitHub, Group, Code, Schedule, Hub, Analytics, Info } from '@mui/icons-material';
import { ClusteringResult, RepositoryClusterData } from '../RepositoryClustering';
import dynamic from 'next/dynamic';
import SimpleNetworkVisualization from './SimpleNetworkVisualization';

// Try to load the advanced vis-network visualization, fallback to simple one
const NetworkVisualization = dynamic(
  () => import('./NetworkVisualization').catch(() => {
    // Fallback to simple visualization if vis-network fails
    console.warn('Advanced network visualization failed to load, using simple fallback');
    return import('./SimpleNetworkVisualization');
  }),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ 
        height: 600, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        borderRadius: 2
      }}>
        <Typography variant="body2" color="text.secondary">
          Loading network visualization...
        </Typography>
      </Box>
    )
  }
);

interface ClusterVisualizationProps {
  clusteringResult: ClusteringResult;
  viewType: 'cards' | 'network' | 'table';
}

const CLUSTER_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', 
  '#00bcd4', '#795548', '#607d8b', '#f44336', '#ffeb3b'
];

export default function ClusterVisualization({ 
  clusteringResult, 
  viewType 
}: ClusterVisualizationProps) {
  const { clusters, clusterLabels } = clusteringResult;

  const getClusterDescription = (clusterLabel: string, cluster: RepositoryClusterData[]) => {
    const avgMaturity = cluster.reduce((sum, repo) => sum + repo.maturityScore, 0) / cluster.length;
    const avgActivity = cluster.reduce((sum, repo) => sum + repo.recentActivity, 0) / cluster.length;
    const avgComplexity = cluster.reduce((sum, repo) => sum + repo.complexity, 0) / cluster.length;
    const totalCommits = cluster.reduce((sum, repo) => sum + repo.commits.length, 0);
    const uniqueContributors = new Set(cluster.flatMap(repo => repo.contributors)).size;

    const descriptions: { [key: string]: { description: string; characteristics: string[]; insights: string[] } } = {
      'Mature & Stable': {
        description: 'Well-established repositories with consistent, measured development patterns',
        characteristics: [
          `High maturity score (avg ${avgMaturity.toFixed(0)}/100)`,
          `Lower recent activity (avg ${avgActivity.toFixed(0)} commits)`,
          `${totalCommits} total commits across cluster`,
          `${uniqueContributors} unique contributors`
        ],
        insights: [
          'These repositories have reached a stable phase with fewer but more thoughtful changes',
          'Good candidates for maintenance work and code reviews',
          'May benefit from knowledge transfer documentation'
        ]
      },
      'High Activity': {
        description: 'Actively developed repositories with frequent commits and ongoing feature development',
        characteristics: [
          `Very high recent activity (avg ${avgActivity.toFixed(0)} commits)`,
          `Moderate maturity (avg ${avgMaturity.toFixed(0)}/100)`,
          `${totalCommits} total commits across cluster`,
          `${uniqueContributors} active contributors`
        ],
        insights: [
          'These repositories are in active development with frequent changes',
          'Good opportunities for immediate contribution and collaboration',
          'May require more coordination due to high change frequency'
        ]
      },
      'Complex Projects': {
        description: 'Sophisticated repositories with multiple contributors, branches, and high organizational complexity',
        characteristics: [
          `High complexity score (avg ${avgComplexity.toFixed(0)})`,
          `Multiple active contributors (${uniqueContributors} total)`,
          `${totalCommits} total commits across cluster`,
          `Advanced project structure and workflows`
        ],
        insights: [
          'These repositories require understanding of complex workflows and architecture',
          'Great for learning advanced development practices',
          'Consider starting with smaller issues before major contributions'
        ]
      },
      'New Projects': {
        description: 'Recently started repositories in early development phases with growing potential',
        characteristics: [
          `Lower maturity score (avg ${avgMaturity.toFixed(0)}/100)`,
          `Variable activity levels (avg ${avgActivity.toFixed(0)} commits)`,
          `${totalCommits} total commits across cluster`,
          `${uniqueContributors} early contributors`
        ],
        insights: [
          'These repositories are in their formative stages with opportunity for significant impact',
          'Excellent chance to influence architecture and establish patterns',
          'May have less documentation and established processes'
        ]
      }
    };

    return descriptions[clusterLabel] || {
      description: 'A group of repositories with similar development patterns and characteristics',
      characteristics: [
        `Average maturity: ${avgMaturity.toFixed(0)}/100`,
        `Average activity: ${avgActivity.toFixed(0)} recent commits`,
        `${totalCommits} total commits`,
        `${uniqueContributors} contributors`
      ],
      insights: [
        'This cluster groups repositories with similar development patterns',
        'Similarity is based on contributor overlap, activity patterns, and project characteristics'
      ]
    };
  };

  const renderCardsView = () => (
    <Box>
      {/* Clustering Methodology Explanation */}
      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Hub color="info" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Adaptive Clustering Methodology
          </Typography>
        </Box>
        <Typography variant="body2" paragraph>
          <strong>Why 3-6 clusters?</strong> Our algorithm dynamically determines the optimal number of clusters based on your repository count using the formula: min(6, max(3, ceil(repositories/4))). This ensures meaningful groupings - enough clusters to differentiate patterns, but not so many that individual clusters become too small to be useful.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" paragraph>
              <strong>📊 Clustering Process:</strong><br/>
              1. Calculate 6-factor similarity scores between all repository pairs<br/>
              2. Use hierarchical clustering with 0.3 minimum similarity threshold<br/>
              3. Start with highest-similarity repository as cluster seed<br/>
              4. Add similar repositories (similarity {'>'}30%) to each cluster
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" paragraph>
              <strong>🏷️ Cluster Labeling:</strong><br/>
              • <strong>Mature & Stable:</strong> High maturity (70+), low activity ({'<'}5)<br/>
              • <strong>High Activity:</strong> Recent activity {'>'}15 commits<br/>
              • <strong>Complex Projects:</strong> Complexity score {'>'}20<br/>
              • <strong>New Projects:</strong> Maturity {'<'}30
            </Typography>
          </Grid>
        </Grid>
      </Alert>
      {clusters.map((cluster, clusterIndex) => (
        <Paper 
          key={clusterIndex} 
          elevation={2}
          sx={{ 
            mb: 4, 
            p: 3, 
            borderRadius: 3,
            border: `3px solid ${CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]}40`,
            background: `linear-gradient(135deg, ${CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]}08 0%, transparent 100%)`
          }}
        >
          {/* Cluster Header with Enhanced Description */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                bgcolor: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length], 
                mr: 2,
                width: 40,
                height: 40,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                boxShadow: 2
              }}
            >
              {clusterIndex + 1}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
                  {clusterLabels[clusterIndex]}
                </Typography>
                <Tooltip title={
                  <Box sx={{ p: 1, maxWidth: 500 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Cluster Analysis: {clusterLabels[clusterIndex]}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Definition:</strong> {getClusterDescription(clusterLabels[clusterIndex], cluster).description}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Key Characteristics:</strong>
                    </Typography>
                    <Box sx={{ pl: 1 }}>
                      {getClusterDescription(clusterLabels[clusterIndex], cluster).characteristics.map((char, idx) => (
                        <Typography key={idx} variant="body2" sx={{ fontSize: '0.85rem' }}>• {char}</Typography>
                      ))}
                    </Box>
                    <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                      <strong>Strategic Insights:</strong>
                    </Typography>
                    <Box sx={{ pl: 1 }}>
                      {getClusterDescription(clusterLabels[clusterIndex], cluster).insights.map((insight, idx) => (
                        <Typography key={idx} variant="body2" sx={{ fontSize: '0.85rem' }}>• {insight}</Typography>
                      ))}
                    </Box>
                  </Box>
                }>
                  <IconButton size="small">
                    <Info color="action" fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {getClusterDescription(clusterLabels[clusterIndex], cluster).description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cluster {clusterIndex + 1} • Grouped by 6-factor similarity algorithm
              </Typography>
            </Box>
            <Chip 
              label={`${cluster.length} repositories`} 
              size="medium" 
              sx={{ 
                ml: 2,
                backgroundColor: `${CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]}20`,
                color: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length],
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* Cluster Summary Statistics */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.default', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics fontSize="small" color="primary" />
              Cluster Characteristics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {(cluster.reduce((sum, repo) => sum + repo.maturityScore, 0) / cluster.length).toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Maturity
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {(cluster.reduce((sum, repo) => sum + repo.recentActivity, 0) / cluster.length).toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Activity
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    {cluster.reduce((sum, repo) => sum + repo.commits.length, 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Commits
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {new Set(cluster.flatMap(repo => repo.contributors)).size}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unique Contributors
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Grid container spacing={3}>
            {cluster.map((repo) => (
              <Grid item xs={12} sm={6} md={4} key={repo.repository.nameWithOwner}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderRadius: 2,
                    border: `2px solid ${CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]}30`,
                    '&:hover': {
                      boxShadow: 8,
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease-in-out',
                      border: `2px solid ${CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]}80`
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Tooltip title={`View repository: ${repo.repository.nameWithOwner}`}>
                          <Typography 
                            variant="h6" 
                            component="h4" 
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              wordBreak: 'break-word',
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => window.open(repo.repository.url, '_blank')}
                          >
                            {repo.repository.nameWithOwner.split('/').pop()}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                          {repo.repository.nameWithOwner.split('/')[0]}
                        </Typography>
                      </Box>
                      
                      <Tooltip title="View on GitHub">
                        <IconButton 
                          size="small" 
                          onClick={() => window.open(repo.repository.url, '_blank')}
                        >
                          <GitHub fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Repository Stats */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      <Chip
                        icon={<Code />}
                        label={`${repo.commits.length} commits`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Group />}
                        label={`${repo.contributors.length} contributors`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Schedule />}
                        label={`${repo.recentActivity} recent`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Metrics */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Maturity</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {repo.maturityScore.toFixed(0)}/100
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Complexity</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {repo.complexity}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Top Contributors */}
                    {repo.contributors.length > 0 && (
                      <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Top Contributors
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {repo.contributors.slice(0, 3).map(contributor => (
                            <Chip
                              key={contributor}
                              label={contributor}
                              size="small"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                          {repo.contributors.length > 3 && (
                            <Chip
                              label={`+${repo.contributors.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
    </Box>
  );

  const renderNetworkView = () => {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>Interactive Repository Cluster Network:</strong> This visualization shows relationships between repositories based on similarity scores. 
            Repositories in the same cluster are connected with solid lines, while high cross-cluster similarities are shown with dashed lines.
            Node size represents activity level, and line thickness represents similarity strength.
          </Typography>
        </Alert>
        <Box>
          <NetworkVisualization clusteringResult={clusteringResult} />
        </Box>
      </Box>
    );
  };

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Repository</TableCell>
            <TableCell>Cluster</TableCell>
            <TableCell align="right">Commits</TableCell>
            <TableCell align="right">Contributors</TableCell>
            <TableCell align="right">Recent Activity</TableCell>
            <TableCell align="right">Maturity Score</TableCell>
            <TableCell align="right">Complexity</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clusters.flatMap((cluster, clusterIndex) =>
            cluster.map((repo) => (
              <TableRow key={repo.repository.nameWithOwner} hover>
                <TableCell>
                  <Box>
                    <Tooltip title={`View repository: ${repo.repository.nameWithOwner}`}>
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        sx={{
                          cursor: 'pointer',
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                        onClick={() => window.open(repo.repository.url, '_blank')}
                      >
                        {repo.repository.nameWithOwner.split('/').pop()}
                      </Typography>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      {repo.repository.nameWithOwner.split('/')[0]}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length], 
                        mr: 1,
                        width: 24,
                        height: 24,
                        fontSize: '0.75rem'
                      }}
                    >
                      {clusterIndex + 1}
                    </Avatar>
                    <Typography variant="body2">
                      {clusterLabels[clusterIndex]}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{repo.commits.length}</TableCell>
                <TableCell align="right">{repo.contributors.length}</TableCell>
                <TableCell align="right">{repo.recentActivity}</TableCell>
                <TableCell align="right">{repo.maturityScore.toFixed(0)}</TableCell>
                <TableCell align="right">{repo.complexity}</TableCell>
                <TableCell>
                  <Tooltip title="View on GitHub">
                    <IconButton 
                      size="small" 
                      onClick={() => window.open(repo.repository.url, '_blank')}
                    >
                      <GitHub fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {viewType === 'cards' && renderCardsView()}
      {viewType === 'network' && renderNetworkView()}
      {viewType === 'table' && renderTableView()}
    </Box>
  );
}