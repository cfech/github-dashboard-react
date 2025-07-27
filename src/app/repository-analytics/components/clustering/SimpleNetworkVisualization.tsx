'use client';

import React, { useMemo, useState } from 'react';
import { Box, Typography, Card, CardContent, Chip, Tooltip } from '@mui/material';
import { ClusteringResult } from '../RepositoryClustering';

interface SimpleNetworkVisualizationProps {
  clusteringResult: ClusteringResult;
}

const CLUSTER_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', 
  '#00bcd4', '#795548', '#607d8b', '#f44336', '#ffeb3b'
];

interface Node {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  cluster: number;
  data: any;
}

interface Edge {
  from: string;
  to: string;
  strength: number;
  color: string;
}

export default function SimpleNetworkVisualization({ clusteringResult }: SimpleNetworkVisualizationProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { clusters, clusterLabels } = clusteringResult;

  // Stable positioning: prevents graph rotation by using consistent hash-based positioning
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Sort clusters and repositories for stable positioning
    const sortedClusters = clusters.map((cluster, clusterIndex) => ({
      cluster: [...cluster].sort((a, b) => a.repository.nameWithOwner.localeCompare(b.repository.nameWithOwner)),
      clusterIndex,
      label: clusterLabels[clusterIndex]
    })).sort((a, b) => a.label.localeCompare(b.label));
    
    // Create nodes positioned in clusters with stable positions
    sortedClusters.forEach((clusterData, sortedClusterIndex) => {
      const { cluster, clusterIndex } = clusterData;
      
      // Use a hash of cluster label for consistent angle (stable positioning)
      const clusterHash = clusterData.label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const clusterAngle = ((clusterHash % 360) / 360) * 2 * Math.PI; // Normalize to 0-2π radians
      const clusterRadius = Math.min(width, height) * 0.25;
      const clusterCenterX = centerX + Math.cos(clusterAngle) * clusterRadius;
      const clusterCenterY = centerY + Math.sin(clusterAngle) * clusterRadius;
      
      cluster.forEach((repo, repoIndex) => {
        // Use repository name hash for consistent positioning within cluster (stable positioning)
        const repoHash = repo.repository.nameWithOwner.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const repoAngle = ((repoHash % 360) / 360) * 2 * Math.PI; // Normalize to 0-2π radians
        const repoRadius = 40 + Math.min(cluster.length * 2, 80); // Cap radius growth
        const x = clusterCenterX + Math.cos(repoAngle) * repoRadius;
        const y = clusterCenterY + Math.sin(repoAngle) * repoRadius;
        
        nodes.push({
          id: repo.repository.nameWithOwner,
          x: Math.max(20, Math.min(width - 20, x)),
          y: Math.max(20, Math.min(height - 20, y)),
          size: Math.max(8, Math.min(20, repo.commits.length / 10 + repo.contributors.length)),
          color: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length],
          cluster: clusterIndex,
          data: repo
        });
      });
    });

    // Create edges within clusters using sorted data
    sortedClusters.forEach((clusterData) => {
      const { cluster, clusterIndex } = clusterData;
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          const repo1 = cluster[i];
          const repo2 = cluster[j];
          const similarity = repo1.similarityScores?.get(repo2.repository.nameWithOwner) || 0;
          
          if (similarity > 0.3) {
            edges.push({
              from: repo1.repository.nameWithOwner,
              to: repo2.repository.nameWithOwner,
              strength: similarity,
              color: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length] + '60'
            });
          }
        }
      }
    });

    // Add cross-cluster edges for high similarities using sorted data
    for (let i = 0; i < sortedClusters.length; i++) {
      for (let j = i + 1; j < sortedClusters.length; j++) {
        const cluster1Data = sortedClusters[i];
        const cluster2Data = sortedClusters[j];
        
        cluster1Data.cluster.forEach(repo1 => {
          cluster2Data.cluster.forEach(repo2 => {
            const similarity = repo1.similarityScores?.get(repo2.repository.nameWithOwner) || 0;
            
            if (similarity > 0.5) {
              edges.push({
                from: repo1.repository.nameWithOwner,
                to: repo2.repository.nameWithOwner,
                strength: similarity,
                color: '#75757560'
              });
            }
          });
        });
      }
    }

    return { nodes, edges };
  }, [clusters]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  const handleNodeClick = (node: Node) => {
    if (node.data?.repository?.url) {
      window.open(node.data.repository.url, '_blank');
    }
  };

  return (
    <Box>
      {/* Legend */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {clusterLabels.map((label, index) => (
          <Chip
            key={index}
            label={`${label} (${clusters[index]?.length || 0} repos)`}
            size="small"
            sx={{
              backgroundColor: `${CLUSTER_COLORS[index % CLUSTER_COLORS.length]}20`,
              color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
              fontWeight: 'bold',
              '& .MuiChip-label': {
                fontSize: '0.75rem'
              }
            }}
          />
        ))}
      </Box>

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
              {edges.map((edge) => {
                const fromNode = nodeMap.get(edge.from);
                const toNode = nodeMap.get(edge.to);
                if (!fromNode || !toNode) return null;

                // Create stable key from edge endpoints
                const edgeKey = [edge.from, edge.to].sort().join('-');

                return (
                  <line
                    key={edgeKey}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={edge.color}
                    strokeWidth={edge.strength * 3}
                    strokeDasharray={edge.color.includes('757575') ? '5,5' : 'none'}
                    opacity={0.7}
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
                        {node.data.repository.nameWithOwner}
                      </Typography>
                      <Typography variant="body2">
                        Cluster: {clusterLabels[node.cluster]}
                      </Typography>
                      <Typography variant="body2">
                        Commits: {node.data.commits.length}
                      </Typography>
                      <Typography variant="body2">
                        Contributors: {node.data.contributors.length}
                      </Typography>
                      <Typography variant="body2">
                        Maturity: {node.data.maturityScore.toFixed(0)}/100
                      </Typography>
                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                        Click to open repository
                      </Typography>
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
                      cursor: 'pointer',
                      filter: hoveredNode === node.id ? 'brightness(1.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => handleNodeClick(node)}
                  />
                </Tooltip>
              ))}

              {/* Repository labels */}
              {nodes.map((node) => (
                <text
                  key={`label-${node.id}`}
                  x={node.x}
                  y={node.y + node.size + 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#555"
                  style={{ 
                    pointerEvents: 'none',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: hoveredNode === node.id ? 'bold' : 'normal'
                  }}
                >
                  {node.id.split('/').pop()?.substring(0, 12)}
                  {(node.id.split('/').pop()?.length || 0) > 12 ? '...' : ''}
                </text>
              ))}
            </svg>
          </Box>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Interactive Network:</strong> 
          • Node size = repository activity level • 
          Line thickness = similarity strength • 
          Solid lines = same cluster • 
          Dashed lines = cross-cluster similarities • 
          Hover for details, click nodes to open repository
        </Typography>
      </Box>
    </Box>
  );
}