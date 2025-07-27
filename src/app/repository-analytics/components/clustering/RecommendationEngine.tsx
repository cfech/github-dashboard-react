'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Group,
  Schedule,
  GitHub,
  Star,
  Lightbulb,
  Psychology,
  Timeline
} from '@mui/icons-material';
import { GitHubCommit, GitHubUser } from '@/types/github';
import { ClusteringResult } from '../RepositoryClustering';

interface RecommendationEngineProps {
  clusteringResult: ClusteringResult;
  userInfo: GitHubUser;
  commits: GitHubCommit[];
}

interface Recommendation {
  type: 'similar_repo' | 'needs_help' | 'collaboration' | 'growth_opportunity';
  repository: string;
  repositoryUrl?: string;
  score: number;
  reason: string;
  details: string[];
  contributors?: string[];
  metrics: {
    commits: number;
    contributors: number;
    recentActivity: number;
    maturityScore: number;
  };
}

export default function RecommendationEngine({
  clusteringResult,
  userInfo,
  commits
}: RecommendationEngineProps) {
  
  const recommendations = useMemo(() => {
    // Handle case where userInfo might not be fully loaded
    if (!userInfo || !userInfo.login) {
      console.warn('UserInfo not available for recommendations');
      return {
        similar_repo: [],
        needs_help: [],
        collaboration: [],
        growth_opportunity: []
      };
    }
    
    const { repositoryData } = clusteringResult;
    const userCommits = commits.filter(c => c.author === userInfo.login);
    const userRepos = new Set(userCommits.map(c => c.repo));
    
    const recs: Recommendation[] = [];

    // 1. Similar Repository Recommendations
    // Find repositories similar to ones the user already contributes to
    userRepos.forEach(userRepo => {
      const userRepoData = repositoryData.find(r => r.repository.nameWithOwner === userRepo);
      if (userRepoData && userRepoData.similarityScores) {
        const similarRepos = Array.from(userRepoData.similarityScores.entries())
          .filter(([repo, similarity]) => 
            !userRepos.has(repo) && similarity > 0.5
          )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        similarRepos.forEach(([repoName, similarity]) => {
          const repoData = repositoryData.find(r => r.repository.nameWithOwner === repoName);
          if (repoData) {
            recs.push({
              type: 'similar_repo',
              repository: repoName,
              repositoryUrl: repoData.repository.url,
              score: similarity * 100,
              reason: `Similar to ${userRepo.split('/').pop()}`,
              details: [
                `${(similarity * 100).toFixed(0)}% similarity score`,
                `${repoData.contributors.length} active contributors`,
                `${repoData.commits.length} total commits`,
                `${repoData.recentActivity} recent commits`
              ],
              contributors: repoData.contributors.slice(0, 5),
              metrics: {
                commits: repoData.commits.length,
                contributors: repoData.contributors.length,
                recentActivity: repoData.recentActivity,
                maturityScore: repoData.maturityScore
              }
            });
          }
        });
      }
    });

    // 2. Repositories That Need Help (High knowledge concentration risk)
    repositoryData.forEach(repo => {
      if (userRepos.has(repo.repository.nameWithOwner)) return;

      const contributorCommits = new Map<string, number>();
      repo.commits.forEach(commit => {
        contributorCommits.set(commit.author, (contributorCommits.get(commit.author) || 0) + 1);
      });

      const totalCommits = repo.commits.length;
      const topContributor = Math.max(...Array.from(contributorCommits.values()));
      const concentrationRisk = totalCommits > 0 ? (topContributor / totalCommits) * 100 : 0;

      if (concentrationRisk > 60 && repo.recentActivity > 0) {
        const topContributorName = Array.from(contributorCommits.entries())
          .find(([_, count]) => count === topContributor)?.[0] || 'Unknown';

        recs.push({
          type: 'needs_help',
          repository: repo.repository.nameWithOwner,
          repositoryUrl: repo.repository.url,
          score: concentrationRisk,
          reason: 'High knowledge concentration risk',
          details: [
            `${concentrationRisk.toFixed(0)}% of commits by one person`,
            `${topContributorName} is the main contributor`,
            `${repo.contributors.length} total contributors`,
            `${repo.recentActivity} recent commits`
          ],
          contributors: repo.contributors,
          metrics: {
            commits: repo.commits.length,
            contributors: repo.contributors.length,
            recentActivity: repo.recentActivity,
            maturityScore: repo.maturityScore
          }
        });
      }
    });

    // 3. Collaboration Opportunities
    // Find repositories where user's existing collaborators are active
    const userCollaborators = new Set<string>();
    userRepos.forEach(userRepo => {
      const repoData = repositoryData.find(r => r.repository.nameWithOwner === userRepo);
      if (repoData) {
        repoData.contributors.forEach(contributor => {
          if (contributor !== userInfo.login) {
            userCollaborators.add(contributor);
          }
        });
      }
    });

    repositoryData.forEach(repo => {
      if (userRepos.has(repo.repository.nameWithOwner)) return;

      const sharedCollaborators = repo.contributors.filter(c => userCollaborators.has(c));
      if (sharedCollaborators.length > 0 && repo.recentActivity > 0) {
        const collaborationScore = (sharedCollaborators.length / repo.contributors.length) * 100;
        
        recs.push({
          type: 'collaboration',
          repository: repo.repository.nameWithOwner,
          repositoryUrl: repo.repository.url,
          score: collaborationScore,
          reason: `${sharedCollaborators.length} existing collaborators`,
          details: [
            `${sharedCollaborators.length} people you've worked with`,
            `${repo.contributors.length} total contributors`,
            `${repo.recentActivity} recent commits`,
            `Shared collaborators: ${sharedCollaborators.slice(0, 3).join(', ')}`
          ],
          contributors: repo.contributors,
          metrics: {
            commits: repo.commits.length,
            contributors: repo.contributors.length,
            recentActivity: repo.recentActivity,
            maturityScore: repo.maturityScore
          }
        });
      }
    });

    // 4. Growth Opportunities (Active, mature projects)
    repositoryData.forEach(repo => {
      if (userRepos.has(repo.repository.nameWithOwner)) return;

      const isHighActivity = repo.recentActivity > 10;
      const isMature = repo.maturityScore > 60;
      const isWelcoming = repo.contributors.length > 3; // More diverse contributor base

      if (isHighActivity && isMature && isWelcoming) {
        const growthScore = (repo.recentActivity * 2) + (repo.maturityScore / 2) + (repo.contributors.length);
        
        recs.push({
          type: 'growth_opportunity',
          repository: repo.repository.nameWithOwner,
          repositoryUrl: repo.repository.url,
          score: growthScore,
          reason: 'High-activity mature project',
          details: [
            `${repo.recentActivity} recent commits`,
            `${repo.maturityScore.toFixed(0)}/100 maturity score`,
            `${repo.contributors.length} active contributors`,
            `${repo.commits.length} total commits`
          ],
          contributors: repo.contributors,
          metrics: {
            commits: repo.commits.length,
            contributors: repo.contributors.length,
            recentActivity: repo.recentActivity,
            maturityScore: repo.maturityScore
          }
        });
      }
    });

    // Sort recommendations by score and limit each type
    const sortedRecs = recs.sort((a, b) => b.score - a.score);
    
    return {
      similar_repo: sortedRecs.filter(r => r.type === 'similar_repo').slice(0, 3),
      needs_help: sortedRecs.filter(r => r.type === 'needs_help').slice(0, 3),
      collaboration: sortedRecs.filter(r => r.type === 'collaboration').slice(0, 3),
      growth_opportunity: sortedRecs.filter(r => r.type === 'growth_opportunity').slice(0, 3)
    };
  }, [clusteringResult, userInfo, commits]);

  const getRecommendationIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'similar_repo': return <Star color="primary" />;
      case 'needs_help': return <Group color="warning" />;
      case 'collaboration': return <Psychology color="success" />;
      case 'growth_opportunity': return <TrendingUp color="info" />;
      default: return <Lightbulb />;
    }
  };

  const getRecommendationColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'similar_repo': return '#2196f3';
      case 'needs_help': return '#ff9800';
      case 'collaboration': return '#4caf50';
      case 'growth_opportunity': return '#00bcd4';
      default: return '#757575';
    }
  };

  const RecommendationCard = ({ rec }: { rec: Recommendation }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h4" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
              {rec.repository.split('/').pop()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rec.repository.split('/')[0]}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="View on GitHub">
              <IconButton size="small" onClick={() => window.open(rec.repositoryUrl, '_blank')}>
                <GitHub fontSize="small" />
              </IconButton>
            </Tooltip>
            {getRecommendationIcon(rec.type)}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip
            label={rec.reason}
            size="small"
            sx={{
              backgroundColor: `${getRecommendationColor(rec.type)}20`,
              color: getRecommendationColor(rec.type),
              fontWeight: 'bold',
              mb: 1
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">Recommendation Score</Typography>
            <Typography variant="body2" fontWeight="bold">
              {rec.score.toFixed(0)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, rec.score)}
            sx={{
              height: 6,
              mt: 0.5,
              '& .MuiLinearProgress-bar': {
                backgroundColor: getRecommendationColor(rec.type)
              }
            }}
          />
        </Box>

        <List dense>
          {rec.details.slice(0, 3).map((detail, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemText
                primary={detail}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>

        {rec.contributors && rec.contributors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Active Contributors
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {rec.contributors.slice(0, 3).map(contributor => (
                <Chip
                  key={contributor}
                  label={contributor}
                  size="small"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {rec.contributors.length > 3 && (
                <Chip
                  label={`+${rec.contributors.length - 3}`}
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
  );

  // Handle loading state or missing user info
  if (!userInfo || !userInfo.login) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            User Information Required
          </Typography>
          <Typography variant="body2">
            Recommendations require user profile data to be loaded. Please ensure you&apos;re authenticated and try refreshing the page.
          </Typography>
        </Alert>
      </Box>
    );
  }
  
  const totalRecommendations = Object.values(recommendations).flat().length;

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Personalized Repository Recommendations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover repositories based on your contribution patterns, collaboration network, and growth opportunities
        </Typography>
      </Box>

      {totalRecommendations === 0 ? (
        <Alert severity="info">
          <Typography variant="body2">
            No specific recommendations available. This could mean you&apos;re already contributing to most relevant repositories
            in your organizations, or there may not be enough data to generate meaningful suggestions.
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {/* Similar Repositories */}
          {recommendations.similar_repo.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Star color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Similar Repositories</Typography>
                  <Chip label={recommendations.similar_repo.length} size="small" sx={{ ml: 1 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Repositories similar to ones you already contribute to
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {recommendations.similar_repo.map((rec, index) => (
                  <Grid item xs={12} md={4} key={`${rec.repository}-${index}`}>
                    <RecommendationCard rec={rec} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

          {/* Repositories Needing Help */}
          {recommendations.needs_help.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Repositories Needing Help</Typography>
                  <Chip label={recommendations.needs_help.length} size="small" sx={{ ml: 1 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Active repositories with high knowledge concentration risk
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {recommendations.needs_help.map((rec, index) => (
                  <Grid item xs={12} md={4} key={`${rec.repository}-${index}`}>
                    <RecommendationCard rec={rec} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

          {/* Collaboration Opportunities */}
          {recommendations.collaboration.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Psychology color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Collaboration Opportunities</Typography>
                  <Chip label={recommendations.collaboration.length} size="small" sx={{ ml: 1 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Repositories where your existing collaborators are active
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {recommendations.collaboration.map((rec, index) => (
                  <Grid item xs={12} md={4} key={`${rec.repository}-${index}`}>
                    <RecommendationCard rec={rec} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

          {/* Growth Opportunities */}
          {recommendations.growth_opportunity.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Growth Opportunities</Typography>
                  <Chip label={recommendations.growth_opportunity.length} size="small" sx={{ ml: 1 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  High-activity mature projects for skill development
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {recommendations.growth_opportunity.map((rec, index) => (
                  <Grid item xs={12} md={4} key={`${rec.repository}-${index}`}>
                    <RecommendationCard rec={rec} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}