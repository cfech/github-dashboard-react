'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Alert
} from '@mui/material';
import { Network, DataSet } from 'vis-network/standalone';
import { GitHubCommit, GitHubPR, GitHubRepository } from '@/types/github';

interface CollaborationNetworkVizProps {
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
  repositories: GitHubRepository[];
}

type NetworkType = 'contributor-repo' | 'contributor-collab' | 'repo-relations';

export default function CollaborationNetworkViz({ 
  commits, 
  pullRequests, 
  repositories 
}: CollaborationNetworkVizProps) {
  const networkRef = useRef<HTMLDivElement>(null);
  const [networkType, setNetworkType] = useState<NetworkType>('contributor-repo');

  const handleNetworkTypeChange = (event: SelectChangeEvent<NetworkType>) => {
    setNetworkType(event.target.value as NetworkType);
  };

  useEffect(() => {
    if (!networkRef.current) return;

    let nodes: any[] = [];
    let edges: any[] = [];

    if (networkType === 'contributor-repo') {
      // Contributors to Repositories network
      const contributorData = new Map<string, { commits: number; repos: Set<string> }>();
      const repoData = new Map<string, { commits: number; contributors: Set<string> }>();

      commits.forEach(commit => {
        // Track contributors
        if (!contributorData.has(commit.author)) {
          contributorData.set(commit.author, { commits: 0, repos: new Set() });
        }
        const contributor = contributorData.get(commit.author)!;
        contributor.commits++;
        contributor.repos.add(commit.repo);

        // Track repositories
        if (!repoData.has(commit.repo)) {
          repoData.set(commit.repo, { commits: 0, contributors: new Set() });
        }
        const repo = repoData.get(commit.repo)!;
        repo.commits++;
        repo.contributors.add(commit.author);
      });

      // Create contributor nodes
      contributorData.forEach((data, contributor) => {
        nodes.push({
          id: `contributor-${contributor}`,
          label: contributor,
          title: `Contributor: ${contributor}\\nCommits: ${data.commits}\\nRepositories: ${data.repos.size}`,
          group: 'contributor',
          size: Math.max(15, Math.min(50, data.commits / 5)),
          color: {
            background: '#2196f3',
            border: '#1976d2',
            highlight: { background: '#42a5f5', border: '#1976d2' }
          },
          shape: 'circle',
          font: { color: 'white', size: 10 }
        });
      });

      // Create repository nodes
      repoData.forEach((data, repo) => {
        const repoName = repo.split('/').pop() || repo;
        nodes.push({
          id: `repo-${repo}`,
          label: repoName,
          title: `Repository: ${repo}\\nCommits: ${data.commits}\\nContributors: ${data.contributors.size}`,
          group: 'repository',
          size: Math.max(20, Math.min(60, data.commits / 10)),
          color: {
            background: '#4caf50',
            border: '#388e3c',
            highlight: { background: '#66bb6a', border: '#388e3c' }
          },
          shape: 'box',
          font: { color: 'white', size: 12 }
        });
      });

      // Create edges between contributors and repositories
      commits.forEach(commit => {
        const edgeId = `${commit.author}-${commit.repo}`;
        const existingEdge = edges.find(e => e.id === edgeId);
        
        if (existingEdge) {
          existingEdge.width += 0.5;
          existingEdge.title = `Commits: ${Math.round(existingEdge.width * 2)}`;
        } else {
          edges.push({
            id: edgeId,
            from: `contributor-${commit.author}`,
            to: `repo-${commit.repo}`,
            width: 1,
            color: { color: '#90a4ae' },
            title: 'Commits: 1',
            smooth: { type: 'continuous', enabled: true, roundness: 0.2 }
          });
        }
      });

    } else if (networkType === 'contributor-collab') {
      // Contributor Collaboration network
      const contributorData = new Map<string, { commits: number; collaborators: Set<string> }>();
      const collaborations = new Map<string, number>();

      commits.forEach(commit => {
        if (!contributorData.has(commit.author)) {
          contributorData.set(commit.author, { commits: 0, collaborators: new Set() });
        }
        contributorData.get(commit.author)!.commits++;
      });

      // Find collaborations (contributors working on same repositories)
      const repoContributors = new Map<string, Set<string>>();
      commits.forEach(commit => {
        if (!repoContributors.has(commit.repo)) {
          repoContributors.set(commit.repo, new Set());
        }
        repoContributors.get(commit.repo)!.add(commit.author);
      });

      repoContributors.forEach(contributors => {
        const contributorList = Array.from(contributors);
        for (let i = 0; i < contributorList.length; i++) {
          for (let j = i + 1; j < contributorList.length; j++) {
            const contrib1 = contributorList[i];
            const contrib2 = contributorList[j];
            const collabKey = [contrib1, contrib2].sort().join('-');
            
            collaborations.set(collabKey, (collaborations.get(collabKey) || 0) + 1);
            contributorData.get(contrib1)?.collaborators.add(contrib2);
            contributorData.get(contrib2)?.collaborators.add(contrib1);
          }
        }
      });

      // Create contributor nodes
      contributorData.forEach((data, contributor) => {
        nodes.push({
          id: contributor,
          label: contributor,
          title: `Contributor: ${contributor}\\nCommits: ${data.commits}\\nCollaborators: ${data.collaborators.size}`,
          size: Math.max(15, Math.min(50, data.commits / 3)),
          color: {
            background: '#9c27b0',
            border: '#7b1fa2',
            highlight: { background: '#ba68c8', border: '#7b1fa2' }
          },
          font: { color: 'white', size: 11 }
        });
      });

      // Create collaboration edges
      collaborations.forEach((sharedRepos, collabKey) => {
        const [contrib1, contrib2] = collabKey.split('-');
        edges.push({
          from: contrib1,
          to: contrib2,
          width: Math.max(1, sharedRepos),
          color: { color: '#e1bee7' },
          title: `Shared repositories: ${sharedRepos}`,
          smooth: { type: 'continuous', enabled: true, roundness: 0.2 }
        });
      });

    } else if (networkType === 'repo-relations') {
      // Repository Relations network
      const repoData = new Map<string, { commits: number; contributors: Set<string> }>();
      const repoSimilarities = new Map<string, number>();

      commits.forEach(commit => {
        if (!repoData.has(commit.repo)) {
          repoData.set(commit.repo, { commits: 0, contributors: new Set() });
        }
        const repo = repoData.get(commit.repo)!;
        repo.commits++;
        repo.contributors.add(commit.author);
      });

      // Calculate repository similarities based on shared contributors
      const repos = Array.from(repoData.keys());
      for (let i = 0; i < repos.length; i++) {
        for (let j = i + 1; j < repos.length; j++) {
          const repo1 = repos[i];
          const repo2 = repos[j];
          const contributors1 = repoData.get(repo1)!.contributors;
          const contributors2 = repoData.get(repo2)!.contributors;
          
          const intersection = new Set(Array.from(contributors1).filter(x => contributors2.has(x)));
          const union = new Set([...Array.from(contributors1), ...Array.from(contributors2)]);
          const similarity = intersection.size / union.size;
          
          if (similarity > 0.1) { // Only show meaningful relationships
            repoSimilarities.set(`${repo1}-${repo2}`, similarity);
          }
        }
      }

      // Create repository nodes
      repoData.forEach((data, repo) => {
        const repoName = repo.split('/').pop() || repo;
        nodes.push({
          id: repo,
          label: repoName,
          title: `Repository: ${repo}\\nCommits: ${data.commits}\\nContributors: ${data.contributors.size}`,
          size: Math.max(20, Math.min(60, data.commits / 8)),
          color: {
            background: '#ff9800',
            border: '#f57c00',
            highlight: { background: '#ffb74d', border: '#f57c00' }
          },
          font: { color: 'white', size: 12 }
        });
      });

      // Create similarity edges
      repoSimilarities.forEach((similarity, repoKey) => {
        const [repo1, repo2] = repoKey.split('-');
        edges.push({
          from: repo1,
          to: repo2,
          width: similarity * 10,
          color: { color: '#ffcc02' },
          title: `Contributor overlap: ${(similarity * 100).toFixed(1)}%`,
          smooth: { type: 'continuous', enabled: true, roundness: 0.2 }
        });
      });
    }

    // Create vis.js datasets
    const nodesDataSet = new DataSet(nodes);
    const edgesDataSet = new DataSet(edges);

    // Network options
    const options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
        font: { face: 'Arial' }
      },
      edges: {
        color: { inherit: 'from' },
        smooth: { type: 'continuous', enabled: true, roundness: 0.2 }
      },
      physics: {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -26,
          centralGravity: 0.005,
          springLength: 230,
          springConstant: 0.18,
        },
        maxVelocity: 146,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150 },
      },
      interaction: {
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
        hideNodesOnDrag: false,
      }
    };

    // Create network
    const network = new Network(networkRef.current, { nodes: nodesDataSet, edges: edgesDataSet }, options);

    // Add click handler for repositories
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        if (nodeId.startsWith('repo-')) {
          const repoName = nodeId.replace('repo-', '');
          const repo = repositories.find(r => r.nameWithOwner === repoName);
          if (repo?.url) {
            window.open(repo.url, '_blank');
          }
        }
      }
    });

    // Cleanup
    return () => {
      network.destroy();
    };
  }, [commits, pullRequests, repositories, networkType]);

  const getNetworkDescription = (type: NetworkType) => {
    switch (type) {
      case 'contributor-repo':
        return 'Shows how contributors (blue circles) connect to repositories (green squares). Node size represents activity level.';
      case 'contributor-collab':
        return 'Visualizes collaboration relationships between contributors. Connected contributors work on shared repositories.';
      case 'repo-relations':
        return 'Displays relationships between repositories based on shared contributors. Line thickness shows overlap strength.';
    }
  };

  const getNetworkStats = () => {
    const uniqueContributors = new Set(commits.map(c => c.author)).size;
    const uniqueRepos = new Set(commits.map(c => c.repo)).size;
    const totalCommits = commits.length;
    
    return { uniqueContributors, uniqueRepos, totalCommits };
  };

  const stats = getNetworkStats();

  return (
    <Box>
      {/* Network Type Selector */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Collaboration Network Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getNetworkDescription(networkType)}
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Network Type</InputLabel>
          <Select
            value={networkType}
            label="Network Type"
            onChange={handleNetworkTypeChange}
          >
            <MenuItem value="contributor-repo">Contributors ↔ Repositories</MenuItem>
            <MenuItem value="contributor-collab">Contributor Collaboration</MenuItem>
            <MenuItem value="repo-relations">Repository Relationships</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Network Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="primary">{stats.uniqueContributors}</Typography>
              <Typography variant="caption" color="text.secondary">Contributors</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="success.main">{stats.uniqueRepos}</Typography>
              <Typography variant="caption" color="text.secondary">Repositories</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="warning.main">{stats.totalCommits}</Typography>
              <Typography variant="caption" color="text.secondary">Total Commits</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Network Visualization */}
      <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box 
            ref={networkRef} 
            sx={{ 
              height: 500, 
              width: '100%',
              '& canvas': {
                borderRadius: 2
              }
            }} 
          />
        </CardContent>
      </Card>

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Interactive Network:</strong> 
          • Drag nodes to explore relationships • 
          Hover for detailed information • 
          Click repository nodes to open on GitHub • 
          Switch network types to see different collaboration patterns
        </Typography>
      </Alert>
    </Box>
  );
}