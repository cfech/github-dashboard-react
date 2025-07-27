'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import { Info, Functions, Assessment, Compare } from '@mui/icons-material';
import { ClusteringResult } from '../RepositoryClustering';

interface SimilarityMetricsProps {
  clusteringResult: ClusteringResult;
}

export default function SimilarityMetrics({ clusteringResult }: SimilarityMetricsProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  
  const { repositoryData, similarityMatrix } = clusteringResult;

  const handleRepoChange = (event: SelectChangeEvent<string>) => {
    setSelectedRepo(event.target.value);
  };

  // Calculate overall similarity statistics
  const similarityStats = React.useMemo(() => {
    const allSimilarities: number[] = [];
    
    for (let i = 0; i < similarityMatrix.length; i++) {
      for (let j = i + 1; j < similarityMatrix[i].length; j++) {
        allSimilarities.push(similarityMatrix[i][j]);
      }
    }

    const avg = allSimilarities.reduce((sum, val) => sum + val, 0) / allSimilarities.length;
    const sorted = allSimilarities.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = Math.min(...allSimilarities);
    const max = Math.max(...allSimilarities);
    
    // Calculate distribution
    const lowSim = allSimilarities.filter(s => s < 0.3).length;
    const mediumSim = allSimilarities.filter(s => s >= 0.3 && s < 0.7).length;
    const highSim = allSimilarities.filter(s => s >= 0.7).length;

    return {
      avg,
      median,
      min,
      max,
      total: allSimilarities.length,
      distribution: {
        low: { count: lowSim, percentage: (lowSim / allSimilarities.length) * 100 },
        medium: { count: mediumSim, percentage: (mediumSim / allSimilarities.length) * 100 },
        high: { count: highSim, percentage: (highSim / allSimilarities.length) * 100 }
      }
    };
  }, [similarityMatrix]);

  // Get similarity breakdown for selected repository
  const selectedRepoSimilarities = React.useMemo(() => {
    if (!selectedRepo) return [];

    const selectedIndex = repositoryData.findIndex(r => r.repository.nameWithOwner === selectedRepo);
    if (selectedIndex === -1) return [];

    return repositoryData
      .map((repo, index) => ({
        repositoryName: repo.repository.nameWithOwner,
        similarity: similarityMatrix[selectedIndex][index],
        ...repo
      }))
      .filter(item => item.repositoryName !== selectedRepo)
      .sort((a, b) => b.similarity - a.similarity);
  }, [selectedRepo, repositoryData, similarityMatrix]);

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return '#4caf50'; // High similarity - green
    if (similarity >= 0.3) return '#ff9800'; // Medium similarity - orange  
    return '#f44336'; // Low similarity - red
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.7) return 'High';
    if (similarity >= 0.3) return 'Medium';
    return 'Low';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Similarity Analysis & Algorithm Breakdown
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Functions color="info" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Six-Factor Weighted Similarity Algorithm
          </Typography>
        </Box>
        <Typography variant="body2" paragraph>
          Our clustering algorithm calculates repository similarity using a weighted combination of six factors. Each factor is normalized to 0-1 scale:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" paragraph>
              <strong>👥 Contributor Overlap (25%):</strong><br/>
              Jaccard Index: |shared_contributors| / |total_unique_contributors|<br/>
              <em>Measures how many developers work on both repositories</em>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>📈 Activity Pattern (20%):</strong><br/>
              Pearson correlation of weekly commit patterns<br/>
              <em>Compares when teams are most active during the week</em>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>🌱 Repository Maturity (15%):</strong><br/>
              1 - |maturity_A - maturity_B| / max(maturity_A, maturity_B)<br/>
              <em>Compares repository age and development lifecycle stage</em>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" paragraph>
              <strong>⚡ Recent Activity (15%):</strong><br/>
              Normalized difference in commits from last 30 days<br/>
              <em>Measures current development intensity alignment</em>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>📊 Scale Similarity (15%):</strong><br/>
              Normalized difference in total commit volume<br/>
              <em>Compares overall project size and scope</em>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>🌐 Complexity (10%):</strong><br/>
              (contributors × 2) + branches + PRs similarity<br/>
              <em>Measures project organizational complexity</em>
            </Typography>
          </Grid>
        </Grid>
      </Alert>

      <Grid container spacing={4}>
        {/* Overall Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Assessment color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Global Similarity Statistics
                </Typography>
                <Tooltip title={
                  <Box sx={{ p: 1, maxWidth: 400 }}>
                    <Typography variant="body2" paragraph>
                      <strong>Analysis scope:</strong> {similarityStats.total} unique repository pairs
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Score interpretation:</strong>
                      • 0.0-0.3: Low similarity (different teams/tech)
                      • 0.3-0.7: Medium similarity (some overlap)
                      • 0.7-1.0: High similarity (very similar patterns)
                    </Typography>
                    <Typography variant="body2">
                      <strong>Statistical measures:</strong> These metrics help understand the overall similarity landscape across your organization&apos;s repositories.
                    </Typography>
                  </Box>
                }>
                  <IconButton size="small">
                    <Info color="action" fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {(similarityStats.avg * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Similarity
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {(similarityStats.median * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Median Similarity
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {(similarityStats.min * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minimum
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {(similarityStats.max * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Maximum
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Similarity Distribution */}
              <Typography variant="h6" gutterBottom>
                Similarity Distribution
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Low Similarity (0-30%)</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {similarityStats.distribution.low.count} pairs
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={similarityStats.distribution.low.percentage}
                      sx={{ 
                        height: 8,
                        '& .MuiLinearProgress-bar': { backgroundColor: '#f44336' }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {similarityStats.distribution.low.percentage.toFixed(1)}% of all pairs
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Medium Similarity (30-70%)</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {similarityStats.distribution.medium.count} pairs
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={similarityStats.distribution.medium.percentage}
                      sx={{ 
                        height: 8,
                        '& .MuiLinearProgress-bar': { backgroundColor: '#ff9800' }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {similarityStats.distribution.medium.percentage.toFixed(1)}% of all pairs
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">High Similarity (70%+)</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {similarityStats.distribution.high.count} pairs
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={similarityStats.distribution.high.percentage}
                      sx={{ 
                        height: 8,
                        '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {similarityStats.distribution.high.percentage.toFixed(1)}% of all pairs
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Repository-Specific Analysis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Repository Similarity Analysis
                </Typography>
                
                <FormControl sx={{ minWidth: 300 }}>
                  <InputLabel>Select Repository</InputLabel>
                  <Select
                    value={selectedRepo}
                    label="Select Repository"
                    onChange={handleRepoChange}
                  >
                    {repositoryData.map(repo => (
                      <MenuItem key={repo.repository.nameWithOwner} value={repo.repository.nameWithOwner}>
                        {repo.repository.nameWithOwner}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {selectedRepo ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Repository</TableCell>
                        <TableCell align="right">Similarity Score</TableCell>
                        <TableCell>Similarity Level</TableCell>
                        <TableCell align="right">Shared Contributors</TableCell>
                        <TableCell align="right">Their Commits</TableCell>
                        <TableCell align="right">Their Contributors</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedRepoSimilarities.map((item) => {
                        const selectedRepoData = repositoryData.find(r => r.repository.nameWithOwner === selectedRepo);
                        const sharedContributors = selectedRepoData 
                          ? item.contributors.filter(c => selectedRepoData.contributors.includes(c)).length
                          : 0;

                        return (
                          <TableRow key={item.repositoryName} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {item.repositoryName.split('/').pop()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.repositoryName.split('/')[0]}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Box sx={{ width: 100, mr: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={item.similarity * 100}
                                    sx={{
                                      height: 6,
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: getSimilarityColor(item.similarity)
                                      }
                                    }}
                                  />
                                </Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {(item.similarity * 100).toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getSimilarityLabel(item.similarity)}
                                size="small"
                                sx={{
                                  backgroundColor: `${getSimilarityColor(item.similarity)}20`,
                                  color: getSimilarityColor(item.similarity),
                                  fontWeight: 'bold'
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">{sharedContributors}</TableCell>
                            <TableCell align="right">{item.commits.length}</TableCell>
                            <TableCell align="right">{item.contributors.length}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Select a repository to view its similarity analysis with other repositories
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}