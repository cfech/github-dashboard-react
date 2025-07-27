'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { Info } from '@mui/icons-material';
import {
  Warning,
  Error,
  CheckCircle,
  Person,
  Group,
  Schedule,
  Code,
  GitHub
} from '@mui/icons-material';
import { GitHubRepository } from '@/types/github';

interface RepositoryStats {
  repo: string;
  totalCommits: number;
  contributors: Map<string, number>;
  lastActivity: Date;
}

interface RiskAnalysisCardsProps {
  repositoryStats: RepositoryStats[];
  repositories: GitHubRepository[];
}

interface RiskAnalysis {
  repo: string;
  repoUrl?: string;
  totalCommits: number;
  contributorCount: number;
  topContributor: string;
  topContributorPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  lastActivity: Date;
  daysSinceLastActivity: number;
  contributorBreakdown: Array<{ name: string; commits: number; percentage: number }>;
}

export default function RiskAnalysisCards({ repositoryStats, repositories }: RiskAnalysisCardsProps) {
  const riskAnalysis = useMemo(() => {
    const repoMap = new Map(repositories.map(repo => [repo.nameWithOwner, repo]));
    const now = new Date();

    return repositoryStats.map(stats => {
      const contributors = Array.from(stats.contributors.entries())
        .map(([name, commits]) => ({
          name,
          commits,
          percentage: (commits / stats.totalCommits) * 100
        }))
        .sort((a, b) => b.commits - a.commits);

      const topContributor = contributors[0];
      const topContributorPercentage = topContributor?.percentage || 0;
      const contributorCount = contributors.length;
      
      // Calculate risk level based on concentration
      let riskLevel: RiskAnalysis['riskLevel'];
      let riskScore = topContributorPercentage;

      // Adjust risk based on contributor count and activity recency
      const daysSinceLastActivity = Math.floor(
        (now.getTime() - stats.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Increase risk for stale repositories
      if (daysSinceLastActivity > 30) {
        riskScore += 10;
      }
      if (daysSinceLastActivity > 90) {
        riskScore += 20;
      }

      // Decrease risk for more contributors
      if (contributorCount > 5) {
        riskScore -= 10;
      } else if (contributorCount > 3) {
        riskScore -= 5;
      }

      // Determine risk level
      if (riskScore >= 85) {
        riskLevel = 'critical';
      } else if (riskScore >= 70) {
        riskLevel = 'high';
      } else if (riskScore >= 50) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      const repoInfo = repoMap.get(stats.repo);

      return {
        repo: stats.repo,
        repoUrl: repoInfo?.url,
        totalCommits: stats.totalCommits,
        contributorCount,
        topContributor: topContributor?.name || 'Unknown',
        topContributorPercentage,
        riskLevel,
        riskScore: Math.min(100, Math.max(0, riskScore)),
        lastActivity: stats.lastActivity,
        daysSinceLastActivity,
        contributorBreakdown: contributors.slice(0, 5) // Top 5 contributors
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [repositoryStats, repositories]);

  const getRiskColor = (riskLevel: RiskAnalysis['riskLevel']) => {
    switch (riskLevel) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#fbc02d';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  const getRiskIcon = (riskLevel: RiskAnalysis['riskLevel']) => {
    switch (riskLevel) {
      case 'critical': return <Error color="error" />;
      case 'high': return <Warning color="warning" />;
      case 'medium': return <Warning style={{ color: '#fbc02d' }} />;
      case 'low': return <CheckCircle color="success" />;
      default: return <CheckCircle />;
    }
  };

  const getRiskLabel = (riskLevel: RiskAnalysis['riskLevel']) => {
    switch (riskLevel) {
      case 'critical': return 'Critical Risk';
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      default: return 'Unknown';
    }
  };

  const highRiskRepos = riskAnalysis.filter(repo => 
    repo.riskLevel === 'critical' || repo.riskLevel === 'high'
  );

  const riskCounts = {
    critical: riskAnalysis.filter(r => r.riskLevel === 'critical').length,
    high: riskAnalysis.filter(r => r.riskLevel === 'high').length,
    medium: riskAnalysis.filter(r => r.riskLevel === 'medium').length,
    low: riskAnalysis.filter(r => r.riskLevel === 'low').length
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Risk Summary Alert */}
      {highRiskRepos.length > 0 ? (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>{highRiskRepos.length}</strong> repositories have high knowledge concentration risk. 
            Consider encouraging broader contribution or implementing knowledge sharing practices.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="body2">
            ✓ Good knowledge distribution across all repositories! No high-risk concentration detected.
          </Typography>
        </Alert>
      )}

      {/* Risk Level Summary */}
      <Box sx={{ mb: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Warning color="action" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Knowledge Concentration Risk Distribution
          </Typography>
          <Tooltip title={
            <Box sx={{ p: 1, maxWidth: 400 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Risk Level Calculation Method
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Base Score:</strong> (Top Contributor Commits / Total Commits) × 100
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Staleness Penalty:</strong>
                • +10 points if no activity for 30-90 days
                • +20 points if no activity for {'>'}90 days
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Diversity Bonus:</strong>
                • -5 points if 3-5 contributors
                • -10 points if {'>'}5 contributors
              </Typography>
              <Typography variant="body2">
                <strong>Final Thresholds:</strong> Critical (85+), High (70-84), Medium (50-69), Low ({'<'}50)
              </Typography>
            </Box>
          }>
            <IconButton size="small">
              <Info color="action" fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 1, backgroundColor: '#d32f2f20' }}>
              <Typography variant="h4" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                {riskCounts.critical}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Critical Risk
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 1, backgroundColor: '#f57c0020' }}>
              <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                {riskCounts.high}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                High Risk
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 1, backgroundColor: '#fbc02d20' }}>
              <Typography variant="h4" sx={{ color: '#fbc02d', fontWeight: 'bold' }}>
                {riskCounts.medium}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Medium Risk
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 1, backgroundColor: '#388e3c20' }}>
              <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                {riskCounts.low}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Low Risk
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {riskAnalysis.map((analysis) => (
          <Grid item xs={12} sm={6} md={4} key={analysis.repo}>
            <Card 
              sx={{ 
                height: '100%',
                border: `2px solid ${getRiskColor(analysis.riskLevel)}40`,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${getRiskColor(analysis.riskLevel)}05 0%, transparent 100%)`,
                '&:hover': {
                  boxShadow: 8,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease-in-out',
                  border: `2px solid ${getRiskColor(analysis.riskLevel)}80`
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Tooltip title={`View repository: ${analysis.repo}`}>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          wordBreak: 'break-word',
                          cursor: analysis.repoUrl ? 'pointer' : 'default',
                          color: analysis.repoUrl ? 'primary.main' : 'text.primary',
                          '&:hover': analysis.repoUrl ? {
                            textDecoration: 'underline'
                          } : {}
                        }}
                        onClick={() => analysis.repoUrl && window.open(analysis.repoUrl, '_blank')}
                      >
                        {analysis.repo.split('/').pop()}
                      </Typography>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      {analysis.repo.split('/')[0]}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {analysis.repoUrl && (
                      <Tooltip title="View on GitHub">
                        <IconButton 
                          size="small" 
                          onClick={() => window.open(analysis.repoUrl, '_blank')}
                        >
                          <GitHub fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={getRiskLabel(analysis.riskLevel)}>
                      {getRiskIcon(analysis.riskLevel)}
                    </Tooltip>
                  </Box>
                </Box>

                {/* Risk Score */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Knowledge Concentration
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color={getRiskColor(analysis.riskLevel)}>
                      {analysis.topContributorPercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.topContributorPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#f5f5f5',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getRiskColor(analysis.riskLevel),
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>

                {/* Risk Level Chip */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={getRiskLabel(analysis.riskLevel)}
                    size="medium"
                    sx={{
                      backgroundColor: `${getRiskColor(analysis.riskLevel)}20`,
                      color: getRiskColor(analysis.riskLevel),
                      fontWeight: 'bold'
                    }}
                  />
                </Box>

                {/* Stats */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Code fontSize="small" color="action" />
                    <Typography variant="caption">
                      {analysis.totalCommits} commits
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Group fontSize="small" color="action" />
                    <Typography variant="caption">
                      {analysis.contributorCount} contributors
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="caption">
                      {analysis.daysSinceLastActivity}d ago
                    </Typography>
                  </Box>
                </Box>

                {/* Top Contributor */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Top Contributor
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2">
                      {analysis.topContributor}
                    </Typography>
                  </Box>
                </Box>

                {/* Contributor Breakdown */}
                <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Contribution Distribution
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {analysis.contributorBreakdown.slice(0, 3).map((contributor, index) => (
                      <Box key={contributor.name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          maxWidth: '60%',
                          fontWeight: index === 0 ? 'bold' : 'medium'
                        }}>
                          {index === 0 && '👑 '}{contributor.name}
                        </Typography>
                        <Typography variant="caption" fontWeight="medium">
                          {contributor.percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    ))}
                    {analysis.contributorBreakdown.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 0.5 }}>
                        +{analysis.contributorBreakdown.length - 3} more contributors
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {riskAnalysis.length === 0 && (
        <Alert severity="info">
          No repository data available for risk analysis. Ensure you have commit data for the selected time period.
        </Alert>
      )}
    </Box>
  );
}