'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { Network, DataSet } from 'vis-network/standalone';
import { ClusteringResult } from '../RepositoryClustering';

interface NetworkVisualizationProps {
  clusteringResult: ClusteringResult;
}

const CLUSTER_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', 
  '#00bcd4', '#795548', '#607d8b', '#f44336', '#ffeb3b'
];

export default function NetworkVisualization({ clusteringResult }: NetworkVisualizationProps) {
  const networkRef = useRef<HTMLDivElement>(null);
  const { clusters, clusterLabels } = clusteringResult;

  useEffect(() => {
    if (!networkRef.current) return;

    // Prepare nodes data
    const nodesData = clusters.flatMap((cluster, clusterIndex) => 
      cluster.map(repo => ({
        id: repo.repository.nameWithOwner,
        label: repo.repository.nameWithOwner.split('/').pop() || repo.repository.nameWithOwner,
        title: `${repo.repository.nameWithOwner}\n` +
               `Cluster: ${clusterLabels[clusterIndex]}\n` +
               `Commits: ${repo.commits.length}\n` +
               `Contributors: ${repo.contributors.length}\n` +
               `Maturity: ${repo.maturityScore.toFixed(0)}/100\n` +
               `Recent Activity: ${repo.recentActivity}`,
        group: clusterIndex.toString(),
        color: {
          background: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length],
          border: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length],
          highlight: {
            background: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length] + '80',
            border: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]
          }
        },
        size: Math.max(10, Math.min(40, repo.commits.length / 10 + repo.contributors.length * 2)),
        font: { color: 'white', size: 10, face: 'Arial' },
        borderWidth: 2,
        shadow: true
      }))
    );
    const nodes = new DataSet(nodesData);

    // Prepare edges data - connect repositories within same cluster and high similarity across clusters
    const edgesData: any[] = [];
    
    // Add intra-cluster connections
    clusters.forEach((cluster, clusterIndex) => {
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          const repo1 = cluster[i];
          const repo2 = cluster[j];
          const similarity = repo1.similarityScores?.get(repo2.repository.nameWithOwner) || 0;
          
          if (similarity > 0.3) {
            edgesData.push({
              from: repo1.repository.nameWithOwner,
              to: repo2.repository.nameWithOwner,
              width: similarity * 8,
              color: {
                color: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length] + '60',
                highlight: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length]
              },
              smooth: { type: 'continuous', enabled: true, roundness: 0.2 },
              title: `Similarity: ${(similarity * 100).toFixed(1)}%`
            });
          }
        }
      }
    });

    // Add high-similarity cross-cluster connections
    clusters.forEach((cluster1, clusterIndex1) => {
      clusters.forEach((cluster2, clusterIndex2) => {
        if (clusterIndex1 >= clusterIndex2) return;
        
        cluster1.forEach(repo1 => {
          cluster2.forEach(repo2 => {
            const similarity = repo1.similarityScores?.get(repo2.repository.nameWithOwner) || 0;
            
            if (similarity > 0.5) { // Only very high similarities across clusters
              edgesData.push({
                from: repo1.repository.nameWithOwner,
                to: repo2.repository.nameWithOwner,
                width: similarity * 4,
                color: {
                  color: '#757575',
                  highlight: '#424242'
                },
                dashes: true,
                smooth: { type: 'continuous', enabled: true, roundness: 0.2 },
                title: `Cross-cluster similarity: ${(similarity * 100).toFixed(1)}%`
              });
            }
          });
        });
      });
    });
    
    const edges = new DataSet(edgesData);

    // Network options
    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 10,
          max: 40,
        },
        font: {
          size: 12,
          face: 'Tahoma',
        },
      },
      edges: {
        width: 0.15,
        color: { inherit: 'from' },
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.2
        },
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
      },
      groups: Object.fromEntries(
        clusters.map((_, index) => [
          index,
          {
            color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
            font: { color: 'white' }
          }
        ])
      )
    };

    // Create network
    const network = new Network(networkRef.current, { nodes, edges }, options);

    // Add click handler
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const repo = clusters.flat().find(r => r.repository.nameWithOwner === nodeId);
        if (repo?.repository.url) {
          window.open(repo.repository.url, '_blank');
        }
      }
    });

    // Cleanup
    return () => {
      network.destroy();
    };
  }, [clusters, clusterLabels]);

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
        <CardContent sx={{ p: 0 }}>
          <Box 
            ref={networkRef} 
            sx={{ 
              height: 600, 
              width: '100%',
              '& canvas': {
                borderRadius: 2
              }
            }} 
          />
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
          Click nodes to open repository
        </Typography>
      </Box>
    </Box>
  );
}