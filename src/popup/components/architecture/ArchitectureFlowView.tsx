/**
 * SiteStack Architecture Flow - Main View Component
 * Location: src/popup/components/architecture/ArchitectureFlowView.tsx
 *
 * Implements the Architecture Flow experience:
 * 1. Architecture Summary banner
 * 2. Dependency Flow stacks (dependency-first ordering)
 * 3. Unverified Associations (co-detected pairings)
 * 4. Other Detected Technologies (independent tools)
 * 5. Slide-over Technology Detail Drawer
 */

import React, { useState, useMemo } from 'react';
import { Maximize2 } from 'lucide-react';
import { ArchitectureSummary } from './ArchitectureSummary';
import { DependencyStack } from './DependencyStack';
import { UnverifiedAssociations } from './UnverifiedAssociations';
import { IndependentTechSection } from './IndependentTechSection';
import { TechnologyDetailDrawer } from './TechnologyDetailDrawer';
import { ArchitectureEmptyState } from './ArchitectureEmptyState';
import { ArchitectureFlowViewProps } from './types';
import { ArchitectureGraphNode } from '../../../engine/architecture/graph/types';

export const ArchitectureFlowView: React.FC<ArchitectureFlowViewProps> = ({
  graph,
  searchQuery = '',
  onSearchChange,
  onSelectTechnology,
  onOpenCanvas,
  className = '',
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'inferred'>('all');

  // Map of nodes by ID for fast lookup
  const nodesById = useMemo(() => {
    const map = new Map<string, ArchitectureGraphNode>();
    for (const node of graph.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [graph.nodes]);

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodesById.get(selectedNodeId) || null;
  }, [selectedNodeId, nodesById]);

  // Filter nodes by search query if present
  const matchingNodeIds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null; // Null means all match

    const matching = new Set<string>();
    for (const node of graph.nodes) {
      const match =
        node.name.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.category.toLowerCase().includes(q) ||
        node.roles.some((r) => r.toLowerCase().includes(q)) ||
        (node.description && node.description.toLowerCase().includes(q)) ||
        (node.version && node.version.toLowerCase().includes(q));

      if (match) {
        matching.add(node.id);
      }
    }
    return matching;
  }, [graph.nodes, searchQuery]);

  // Filtered nodes
  const displayNodes = useMemo(() => {
    let list = matchingNodeIds ? graph.nodes.filter((n) => matchingNodeIds.has(n.id)) : graph.nodes;
    if (filterType === 'direct') {
      list = list.filter((n) => !n.isInferred);
    } else if (filterType === 'inferred') {
      list = list.filter((n) => n.isInferred);
    }
    return list;
  }, [graph.nodes, matchingNodeIds, filterType]);

  // Group nodes by dependencyClusterId
  const { dependencyClusters, independentNodes } = useMemo(() => {
    const clustersMap = new Map<number, ArchitectureGraphNode[]>();
    const independent: ArchitectureGraphNode[] = [];

    for (const node of displayNodes) {
      if (node.dependencyClusterId > 0) {
        if (!clustersMap.has(node.dependencyClusterId)) {
          clustersMap.set(node.dependencyClusterId, []);
        }
        clustersMap.get(node.dependencyClusterId)!.push(node);
      } else {
        independent.push(node);
      }
    }

    // Sort cluster keys deterministically
    const clusterIds = Array.from(clustersMap.keys()).sort((a, b) => a - b);
    const clusters = clusterIds.map((cid) => ({
      clusterId: cid,
      nodes: clustersMap.get(cid)!,
    }));

    return { dependencyClusters: clusters, independentNodes: independent };
  }, [displayNodes]);

  // Active contextual edges (filtered if searching)
  const displayContextualEdges = useMemo(() => {
    const contextual = graph.edges.filter((e) => e.classification === 'contextual');
    if (!matchingNodeIds) return contextual;
    return contextual.filter(
      (e) => matchingNodeIds.has(e.sourceId) || matchingNodeIds.has(e.targetId)
    );
  }, [graph.edges, matchingNodeIds]);

  const handleSelectNode = (node: ArchitectureGraphNode) => {
    setSelectedNodeId(node.id);
    onSelectTechnology?.(node);
  };

  const handleSelectRelatedNode = (nodeId: string) => {
    const target = nodesById.get(nodeId);
    if (target) {
      setSelectedNodeId(target.id);
      onSelectTechnology?.(target);
    }
  };

  // Zero-state handling
  if (graph.nodes.length === 0) {
    return <ArchitectureEmptyState />;
  }

  // Search produced zero results
  if (displayNodes.length === 0 && searchQuery.trim().length > 0) {
    return (
      <ArchitectureEmptyState
        isSearchEmpty={true}
        searchQuery={searchQuery}
        onClearSearch={() => onSearchChange?.('')}
      />
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 relative ${className}`}>
      {/* Top Architecture Summary Banner */}
      <ArchitectureSummary
        totalNodes={graph.metrics.totalNodes}
        directlyObservedEdges={graph.metrics.directlyObservedEdges}
        inferredEdges={graph.metrics.inferredEdges}
        coDetectionEdges={graph.metrics.coDetectionEdges}
        totalDependencies={graph.metrics.totalDependencies}
        verifiedEdges={graph.metrics.verifiedEdges}
      />

      {/* Full-Screen Canvas Launch Action Banner */}
      {onOpenCanvas && (
        <div className="px-3.5 py-1.5 bg-indigo-950/30 border-b border-indigo-500/20 flex items-center justify-between text-[11px] shrink-0">
          <span className="text-zinc-300 font-medium text-[10px]">
            Explore 2D visual layout in a full-screen tab
          </span>
          <button
            onClick={onOpenCanvas}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] shadow-sm shadow-indigo-600/30 transition-all active:scale-[0.98]"
            title="Open dedicated Architecture Canvas in new tab"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Open Canvas</span>
          </button>
        </div>
      )}

      {/* Filter Bar: All / Direct / Inferred */}
      {graph.nodes.some((n) => n.isInferred) && (
        <div className="px-3.5 py-1.5 bg-white/[0.015] border-b border-white/[0.06] flex items-center justify-between text-[10px] shrink-0">
          <span className="text-zinc-400 font-medium">Filter View:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded font-mono text-[9px] transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.04]'
              }`}
            >
              All ({graph.nodes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('direct')}
              className={`px-2 py-0.5 rounded font-mono text-[9px] transition-colors ${
                filterType === 'direct'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-300 bg-white/[0.04]'
              }`}
            >
              Direct ({graph.nodes.filter((n) => !n.isInferred).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('inferred')}
              className={`px-2 py-0.5 rounded font-mono text-[9px] transition-colors ${
                filterType === 'inferred'
                  ? 'bg-violet-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-violet-300 bg-white/[0.04]'
              }`}
            >
              Inferred ({graph.nodes.filter((n) => n.isInferred).length})
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Flow Canvas */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3">
        {/* Section 1: Hard Dependency Hierarchies */}
        {dependencyClusters.length > 0 && (
          <div className="space-y-2.5">
            {dependencyClusters.map(({ clusterId, nodes }) => (
              <DependencyStack
                key={clusterId}
                clusterId={clusterId}
                nodes={nodes}
                edges={graph.edges}
                selectedNodeId={selectedNodeId || undefined}
                onSelectNode={handleSelectNode}
              />
            ))}
          </div>
        )}

        {/* Section 2: Unverified Contextual Associations */}
        {displayContextualEdges.length > 0 && (
          <UnverifiedAssociations
            edges={displayContextualEdges}
            nodesById={nodesById}
            onSelectNode={handleSelectNode}
          />
        )}

        {/* Section 3: Other Detected Technologies (Independent) */}
        {independentNodes.length > 0 && (
          <IndependentTechSection
            nodes={independentNodes}
            selectedNodeId={selectedNodeId || undefined}
            onSelectNode={handleSelectNode}
          />
        )}
      </div>

      {/* Slide-over Technology Detail Drawer */}
      {selectedNode && (
        <TechnologyDetailDrawer
          node={selectedNode}
          graph={graph}
          onClose={() => setSelectedNodeId(null)}
          onSelectRelatedNode={handleSelectRelatedNode}
        />
      )}
    </div>
  );
};
