'use client';

import React, { useMemo, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Alert,
  Tooltip
} from '@mui/material';
import { GitHubCommit, GitHubPR, GitHubRepository } from '@/types/github';

interface SimpleCollaborationNetworkProps {
  commits: GitHubCommit[];
  pullRequests: GitHubPR[];
  repositories: GitHubRepository[];
}

type NetworkType = 'contributor-repo' | 'contributor-collab' | 'repo-relations';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'contributor' | 'repository';
  data: any;
}

interface Edge {
  from: string;
  to: string;
  strength: number;
  color: string;
}

export default function SimpleCollaborationNetwork({ 
  commits, 
  pullRequests, 
  repositories 
}: SimpleCollaborationNetworkProps) {
  const [networkType, setNetworkType] = useState<NetworkType>('contributor-repo');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const handleNetworkTypeChange = (event: SelectChangeEvent<NetworkType>) => {
    setNetworkType(event.target.value as NetworkType);
  };

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const width = 600;
    const height = 400;
    
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

      // Position contributors on the left
      const contributors = Array.from(contributorData.entries()).slice(0, 15); // Limit for readability
      contributors.forEach(([contributor, data], index) => {
        nodes.push({
          id: `contributor-${contributor}`,
          label: contributor,
          x: 100,
          y: 50 + (index * (height - 100)) / Math.max(1, contributors.length - 1),
          size: Math.max(8, Math.min(16, data.commits / 10)),
          color: '#2196f3',
          type: 'contributor',
          data: { commits: data.commits, repos: data.repos.size }
        });
      });

      // Position repositories on the right
      const repos = Array.from(repoData.entries()).slice(0, 15); // Limit for readability
      repos.forEach(([repo, data], index) => {
        const repoName = repo.split('/').pop() || repo;
        nodes.push({
          id: `repo-${repo}`,
          label: repoName,
          x: 500,
          y: 50 + (index * (height - 100)) / Math.max(1, repos.length - 1),
          size: Math.max(10, Math.min(18, data.commits / 15)),
          color: '#4caf50',
          type: 'repository',
          data: { commits: data.commits, contributors: data.contributors.size, fullName: repo }
        });
      });

      // Create edges
      commits.forEach(commit => {
        if (!contributorData.has(commit.author) || !repoData.has(commit.repo)) return;
        
        const contributorNode = nodes.find(n => n.id === `contributor-${commit.author}`);
        const repoNode = nodes.find(n => n.id === `repo-${commit.repo}`);
        
        if (contributorNode && repoNode) {
          const existingEdge = edges.find(e => 
            e.from === contributorNode.id && e.to === repoNode.id
          );
          
          if (existingEdge) {
            existingEdge.strength += 0.1;
          } else {
            edges.push({
              from: contributorNode.id,
              to: repoNode.id,
              strength: 0.3,
              color: '#90a4ae'
            });
          }
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

      // Find collaborations
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

      // Position contributors in a circle
      const contributors = Array.from(contributorData.entries()).slice(0, 12); // Limit for readability
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.3;

      contributors.forEach(([contributor, data], index) => {
        const angle = (2 * Math.PI * index) / contributors.length;
        nodes.push({
          id: contributor,
          label: contributor,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          size: Math.max(8, Math.min(16, data.commits / 8)),
          color: '#9c27b0',
          type: 'contributor',
          data: { commits: data.commits, collaborators: data.collaborators.size }
        });
      });

      // Create collaboration edges
      collaborations.forEach((sharedRepos, collabKey) => {
        const [contrib1, contrib2] = collabKey.split('-');
        const node1 = nodes.find(n => n.id === contrib1);
        const node2 = nodes.find(n => n.id === contrib2);
        
        if (node1 && node2 && sharedRepos > 1) {
          edges.push({
            from: contrib1,
            to: contrib2,
            strength: Math.min(3, sharedRepos * 0.5),
            color: '#e1bee7'
          });
        }
      });

    } else if (networkType === 'repo-relations') {
      // Repository Relations network
      const repoData = new Map<string, { commits: number; contributors: Set<string> }>();

      commits.forEach(commit => {
        if (!repoData.has(commit.repo)) {
          repoData.set(commit.repo, { commits: 0, contributors: new Set() });
        }
        const repo = repoData.get(commit.repo)!;
        repo.commits++;
        repo.contributors.add(commit.author);
      });

      // Position repositories in a grid
      const repos = Array.from(repoData.entries()).slice(0, 16); // Limit for readability
      const gridSize = Math.ceil(Math.sqrt(repos.length));
      
      repos.forEach(([repo, data], index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const repoName = repo.split('/').pop() || repo;
        
        nodes.push({
          id: repo,
          label: repoName,
          x: 80 + (col * (width - 160)) / Math.max(1, gridSize - 1),
          y: 60 + (row * (height - 120)) / Math.max(1, gridSize - 1),
          size: Math.max(10, Math.min(18, data.commits / 12)),
          color: '#ff9800',
          type: 'repository',
          data: { commits: data.commits, contributors: data.contributors.size, fullName: repo }
        });
      });

      // Create similarity edges
      const repoList = Array.from(repoData.keys());
      for (let i = 0; i < repoList.length; i++) {
        for (let j = i + 1; j < repoList.length; j++) {
          const repo1 = repoList[i];
          const repo2 = repoList[j];
          const contributors1 = repoData.get(repo1)!.contributors;
          const contributors2 = repoData.get(repo2)!.contributors;
          
          const intersection = new Set(Array.from(contributors1).filter(x => contributors2.has(x)));
          const union = new Set([...Array.from(contributors1), ...Array.from(contributors2)]);
          const similarity = intersection.size / union.size;
          
          if (similarity > 0.2) {
            edges.push({
              from: repo1,
              to: repo2,
              strength: similarity * 3,
              color: '#ffcc02'
            });
          }
        }
      }
    }

    return { nodes, edges };
  }, [commits, networkType]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

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

  const handleNodeClick = (node: Node) => {
    if (node.type === 'repository' && node.data.fullName) {
      const repo = repositories.find(r => r.nameWithOwner === node.data.fullName);
      if (repo?.url) {
        window.open(repo.url, '_blank');
      }
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
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ position: 'relative', width: '100%', height: 450 }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 600 400"
              style={{ border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fafafa' }}
            >
              {/* Edges */}
              {edges.map((edge, index) => {
                const fromNode = nodeMap.get(edge.from);
                const toNode = nodeMap.get(edge.to);
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={index}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={edge.color}
                    strokeWidth={Math.max(1, edge.strength)}
                    opacity={0.6}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => (
                <Tooltip
                  key={node.id}
                  title={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {node.label}
                      </Typography>
                      <Typography variant="body2">
                        Type: {node.type === 'contributor' ? 'Contributor' : 'Repository'}
                      </Typography>
                      {node.type === 'contributor' && (
                        <>
                          <Typography variant="body2">
                            Commits: {node.data.commits}
                          </Typography>
                          <Typography variant="body2">
                            {networkType === 'contributor-collab' 
                              ? `Collaborators: ${node.data.collaborators}`
                              : `Repositories: ${node.data.repos}`
                            }
                          </Typography>
                        </>
                      )}
                      {node.type === 'repository' && (
                        <>
                          <Typography variant="body2">
                            Commits: {node.data.commits}
                          </Typography>
                          <Typography variant="body2">
                            Contributors: {node.data.contributors}
                          </Typography>
                          <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                            Click to open repository
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                  arrow
                  placement="top"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill={node.color}
                    stroke={hoveredNode === node.id ? '#000' : '#fff'}
                    strokeWidth={hoveredNode === node.id ? 3 : 2}
                    style={{ 
                      cursor: node.type === 'repository' ? 'pointer' : 'default',
                      filter: hoveredNode === node.id ? 'brightness(1.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                  />
                </Tooltip>
              ))}

              {/* Labels */}
              {nodes.map((node) => (
                <text
                  key={`label-${node.id}`}
                  x={node.x}
                  y={node.y + node.size + 12}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#555"
                  style={{ 
                    pointerEvents: 'none',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: hoveredNode === node.id ? 'bold' : 'normal'
                  }}
                >
                  {node.label.length > 10 ? node.label.substring(0, 8) + '...' : node.label}
                </text>
              ))}
            </svg>
          </Box>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Interactive Network:</strong> 
          • Node size represents activity level • 
          Line thickness shows relationship strength • 
          Hover for detailed information • 
          Click repository nodes to open on GitHub • 
          Switch network types to see different collaboration patterns
        </Typography>
      </Alert>
    </Box>
  );
}