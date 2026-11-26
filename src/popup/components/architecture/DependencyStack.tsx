/**
 * SiteStack Architecture Flow - Dependency Stack Container
 * Location: src/popup/components/architecture/DependencyStack.tsx
 */

import React from 'react';
import { ArchitectureNodeCard } from './ArchitectureNodeCard';
import { DependencyConnector } from './DependencyConnector';
import { DependencyStackProps } from './types';
import { ArchitectureGraphNode } from '../../../engine/architecture/graph/types';

export const DependencyStack: React.FC<DependencyStackProps> = ({
  clusterId,
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
}) => {
  // Sort nodes in dependency-first order: topologicalRank asc, then id asc
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.topologicalRank !== b.topologicalRank) {
      return a.topologicalRank - b.topologicalRank;
    }
    return a.id.localeCompare(b.id);
  });

  // Root platform or foundation name for stack title
  const foundationNode = sortedNodes.find((n) => n.topologicalRank === 0) || sortedNodes[0];
  const stackTitle = `${foundationNode.name} Stack`;

  // Group nodes by topologicalRank
  const ranks = Array.from(new Set(sortedNodes.map((n) => n.topologicalRank))).sort(
    (a, b) => a - b
  );

  const nodesByRank = new Map<number, ArchitectureGraphNode[]>();
  for (const rank of ranks) {
    nodesByRank.set(
      rank,
      sortedNodes.filter((n) => n.topologicalRank === rank)
    );
  }

  return (
    <div className="rounded-xl bg-white/[0.015] border border-white/[0.08] p-3 space-y-2 relative overflow-hidden">
      {/* Stack Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.05] text-[10px] select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-zinc-200 tracking-tight">{stackTitle}</span>
          <span className="text-zinc-500 font-mono text-[9px]">(Cluster #{clusterId})</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-400">
          {sortedNodes.length} {sortedNodes.length === 1 ? 'node' : 'nodes'}
        </span>
      </div>

      {/* Sequential Rank Flow */}
      <div className="space-y-1">
        {ranks.map((rank, rankIdx) => {
          const currentRankNodes = nodesByRank.get(rank) || [];

          return (
            <div key={rank} className="space-y-1">
              {/* Optional connector from previous rank */}
              {rankIdx > 0 && (
                <div>
                  {currentRankNodes.map((node) => {
                    // Find all parents of this node in previous ranks
                    const incomingEdges = edges.filter(
                      (e) =>
                        e.sourceId === node.id &&
                        e.classification === 'hard_dependency' &&
                        e.isVerified
                    );

                    if (incomingEdges.length === 0) {
                      return null;
                    }

                    return incomingEdges.map((edge) => {
                      const parentNode = sortedNodes.find((n) => n.id === edge.targetId);
                      return (
                        <DependencyConnector
                          key={edge.id}
                          edge={edge}
                          sourceName={node.name}
                          targetName={parentNode?.name || edge.targetId}
                        />
                      );
                    });
                  })}
                </div>
              )}

              {/* Node cards at current rank */}
              <div className="space-y-1.5">
                {currentRankNodes.map((node) => (
                  <ArchitectureNodeCard
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onClick={() => onSelectNode(node)}
                    showRoleBadge={true}
                    showTierBadge={true}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
