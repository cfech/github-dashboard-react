'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
// Simple network visualization without AFRAME dependencies
import { ZoomIn, ZoomOut, CenterFocusStrong } from '@mui/icons-material';
import { GitHubCommit, GitHubPR, GitHubRepository } from '@/types/github';

interface CollaborationNetworkProps {
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
  repositories: GitHubRepository[];
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'contributor' | 'repository';
  value: number; // For sizing nodes
  color: string;
  repositories?: string[]; // For contributors
  contributors?: string[]; // For repositories
}

interface NetworkLink {
  source: string;
  target: string;
  value: number; // For link thickness
  type: 'contribution' | 'collaboration';
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

type ViewMode = 'contributor-repo' | 'contributor-contributor' | 'repository-repository';

export default function CollaborationNetwork({ 
  commits, 
  pullRequests, 
  repositories 
}: CollaborationNetworkProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('contributor-repo');
  const handleViewModeChange = (event: SelectChangeEvent<ViewMode>) => {
    setViewMode(event.target.value as ViewMode);
  };

  const networkData = useMemo(() => {
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];
    const nodeMap = new Map<string, NetworkNode>();
    const linkMap = new Map<string, NetworkLink>();

    // Helper function to add or update a node
    const addNode = (id: string, name: string, type: 'contributor' | 'repository', value: number = 1) => {
      if (nodeMap.has(id)) {
        nodeMap.get(id)!.value += value;
      } else {
        const color = type === 'contributor' ? '#2196f3' : '#4caf50';
        const node: NetworkNode = {
          id,
          name,
          type,
          value,
          color,
          repositories: type === 'contributor' ? [] : undefined,
          contributors: type === 'repository' ? [] : undefined
        };
        nodeMap.set(id, node);
        nodes.push(node);
      }
    };

    // Helper function to add or update a link
    const addLink = (source: string, target: string, value: number = 1, type: 'contribution' | 'collaboration' = 'contribution') => {
      const linkId = `${source}-${target}`;
      const reverseLinkId = `${target}-${source}`;
      
      if (linkMap.has(linkId)) {
        linkMap.get(linkId)!.value += value;
      } else if (linkMap.has(reverseLinkId)) {
        linkMap.get(reverseLinkId)!.value += value;
      } else {
        const link: NetworkLink = {
          source,
          target,
          value,
          type
        };
        linkMap.set(linkId, link);
        links.push(link);
      }
    };

    if (viewMode === 'contributor-repo') {
      // Create contributor-repository network
      commits.forEach(commit => {
        addNode(commit.author, commit.author, 'contributor');
        addNode(commit.repo, commit.repo.split('/').pop() || commit.repo, 'repository');
        addLink(commit.author, commit.repo);
        
        // Track relationships
        const contributorNode = nodeMap.get(commit.author);
        const repoNode = nodeMap.get(commit.repo);
        
        if (contributorNode && !contributorNode.repositories!.includes(commit.repo)) {
          contributorNode.repositories!.push(commit.repo);
        }
        if (repoNode && !repoNode.contributors!.includes(commit.author)) {
          repoNode.contributors!.push(commit.author);
        }
      });

    } else if (viewMode === 'contributor-contributor') {
      // Create contributor-contributor collaboration network
      const repoContributors = new Map<string, Set<string>>();
      
      // Group contributors by repository
      commits.forEach(commit => {
        if (!repoContributors.has(commit.repo)) {
          repoContributors.set(commit.repo, new Set());
        }
        repoContributors.get(commit.repo)!.add(commit.author);
      });

      // Create contributor nodes
      const allContributors = new Set<string>();
      commits.forEach(commit => allContributors.add(commit.author));
      
      allContributors.forEach(contributor => {
        const contributorCommits = commits.filter(c => c.author === contributor).length;
        addNode(contributor, contributor, 'contributor', contributorCommits);
      });

      // Create collaboration links (contributors who worked on same repositories)
      repoContributors.forEach((contributors, repo) => {
        const contributorList = Array.from(contributors);
        for (let i = 0; i < contributorList.length; i++) {
          for (let j = i + 1; j < contributorList.length; j++) {
            const contributor1 = contributorList[i];
            const contributor2 = contributorList[j];
            addLink(contributor1, contributor2, 1, 'collaboration');
          }
        }
      });

    } else if (viewMode === 'repository-repository') {
      // Create repository-repository relationship network
      const contributorRepos = new Map<string, Set<string>>();
      
      // Group repositories by contributor
      commits.forEach(commit => {
        if (!contributorRepos.has(commit.author)) {
          contributorRepos.set(commit.author, new Set());
        }
        contributorRepos.get(commit.author)!.add(commit.repo);
      });

      // Create repository nodes
      const allRepos = new Set<string>();
      commits.forEach(commit => allRepos.add(commit.repo));
      
      allRepos.forEach(repo => {
        const repoCommits = commits.filter(c => c.repo === repo).length;
        addNode(repo, repo.split('/').pop() || repo, 'repository', repoCommits);
      });

      // Create relationship links (repositories with shared contributors)
      contributorRepos.forEach((repos, contributor) => {
        const repoList = Array.from(repos);
        for (let i = 0; i < repoList.length; i++) {
          for (let j = i + 1; j < repoList.length; j++) {
            const repo1 = repoList[i];
            const repo2 = repoList[j];
            addLink(repo1, repo2, 1, 'collaboration');
          }
        }
      });
    }

    return { nodes, links };
  }, [commits, viewMode]);

  // Calculate network statistics
  const networkStats = useMemo(() => {
    const contributors = new Set(commits.map(c => c.author));
    const repos = new Set(commits.map(c => c.repo));
    
    const collaborations = new Map<string, Set<string>>();
    commits.forEach(commit => {
      if (!collaborations.has(commit.author)) {
        collaborations.set(commit.author, new Set());
      }
      collaborations.get(commit.author)!.add(commit.repo);
    });

    const avgReposPerContributor = Array.from(collaborations.values())
      .reduce((sum, repos) => sum + repos.size, 0) / collaborations.size;

    return {
      totalContributors: contributors.size,
      totalRepositories: repos.size,
      totalConnections: networkData.links.length,
      avgReposPerContributor: avgReposPerContributor.toFixed(1)
    };
  }, [commits, networkData]);

  const handleZoomIn = () => {
    // Placeholder for zoom functionality
  };

  const handleZoomOut = () => {
    // Placeholder for zoom functionality
  };

  const handleCenter = () => {
    // Placeholder for center functionality
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel>View Mode</InputLabel>
              <Select
                value={viewMode}
                label="View Mode"
                onChange={handleViewModeChange}
              >
                <MenuItem value="contributor-repo">Contributors ↔ Repositories</MenuItem>
                <MenuItem value="contributor-contributor">Contributor Collaboration</MenuItem>
                <MenuItem value="repository-repository">Repository Relationships</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Zoom In">
                <IconButton onClick={handleZoomIn}>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton onClick={handleZoomOut}>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Center View">
                <IconButton onClick={handleCenter}>
                  <CenterFocusStrong />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {/* Network Statistics */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="primary">
                    {networkStats.totalContributors}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contributors
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="success.main">
                    {networkStats.totalRepositories}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Repositories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="warning.main">
                    {networkStats.totalConnections}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connections
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="info.main">
                    {networkStats.avgReposPerContributor}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Repos/Dev
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Network Visualization */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box 
                sx={{ 
                  height: 600, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2,
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Interactive Network Visualization
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                  This would show an interactive force-directed graph of your collaboration network. 
                  The visualization displays connections between contributors and repositories based on the selected view mode.
                </Typography>
                <Box sx={{ 
                  width: '100%', 
                  height: 200, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Network Graph Placeholder
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  A lightweight network visualization will be implemented in a future update
                </Typography>
              </Box>
              
              {/* Legend */}
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {viewMode === 'contributor-repo' && (
                  <>
                    <Chip
                      label="Contributors"
                      sx={{ backgroundColor: '#2196f320', color: '#2196f3' }}
                      size="small"
                    />
                    <Chip
                      label="Repositories"
                      sx={{ backgroundColor: '#4caf5020', color: '#4caf50' }}
                      size="small"
                    />
                  </>
                )}
                {viewMode === 'contributor-contributor' && (
                  <Chip
                    label="Contributors (connected by shared repositories)"
                    sx={{ backgroundColor: '#2196f320', color: '#2196f3' }}
                    size="small"
                  />
                )}
                {viewMode === 'repository-repository' && (
                  <Chip
                    label="Repositories (connected by shared contributors)"
                    sx={{ backgroundColor: '#4caf5020', color: '#4caf50' }}
                    size="small"
                  />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  Node size = activity level | Link thickness = collaboration strength
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}