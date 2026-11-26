/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Sidebar
 * Location: src/canvas/components/CanvasSidebar.tsx
 */

import React from 'react';
import {
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ArchitectureGraph, ArchitectureGraphNode } from '../../engine/architecture/graph/types';
import { CanvasFilterState } from '../types';

export interface CanvasSidebarProps {
  readonly graph: ArchitectureGraph | null;
  readonly filters: CanvasFilterState;
  readonly onFiltersChange: (newFilters: CanvasFilterState) => void;
  readonly onSelectNode: (node: ArchitectureGraphNode) => void;
  readonly selectedNodeId: string | null;
  readonly theme?: 'dark' | 'light';
}

export const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
  graph,
  filters,
  onFiltersChange,
  onSelectNode,
  selectedNodeId,
  theme = 'dark',
}) => {
  if (!graph) return null;

  const isLight = theme === 'light';

  // Extract clusters
  const clustersMap = new Map<number, ArchitectureGraphNode[]>();
  const independentNodes: ArchitectureGraphNode[] = [];

  for (const node of graph.nodes) {
    if (node.dependencyClusterId > 0) {
      if (!clustersMap.has(node.dependencyClusterId)) {
        clustersMap.set(node.dependencyClusterId, []);
      }
      clustersMap.get(node.dependencyClusterId)!.push(node);
    } else {
      independentNodes.push(node);
    }
  }

  const sortedClusterIds = Array.from(clustersMap.keys()).sort((a, b) => a - b);

  // Categories present in graph
  const categoriesMap = new Map<string, number>();
  for (const node of graph.nodes) {
    categoriesMap.set(node.category, (categoriesMap.get(node.category) || 0) + 1);
  }
  const categories = Array.from(categoriesMap.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <aside className={`w-64 flex flex-col shrink-0 overflow-y-auto select-none z-10 text-xs transition-colors duration-200 ${
      isLight ? 'bg-white border-r border-slate-200 text-slate-800' : 'bg-[#0b0d14] border-r border-white/[0.08] text-zinc-100'
    }`}>
      {/* 1. Connection Evidence Filters */}
      <div className={`p-3.5 border-b ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className={`flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[10px] mb-2.5 ${
          isLight ? 'text-slate-500' : 'text-zinc-400'
        }`}>
          <Filter className="w-3 h-3" />
          <span>Evidence Filters</span>
        </div>

        <div className="space-y-1.5">
          {/* Direct Dependencies Filter */}
          <label className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors ${
            isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.04]'
          }`}>
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.showDirect}
                onChange={(e) =>
                  onFiltersChange({ ...filters, showDirect: e.target.checked })
                }
                className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Direct Links</span>
              </span>
            </span>
            <span className="font-mono text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">
              {graph.metrics.directlyObservedEdges}
            </span>
          </label>

          {/* Inferred Dependencies Filter */}
          <label className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors ${
            isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.04]'
          }`}>
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.showInferred}
                onChange={(e) =>
                  onFiltersChange({ ...filters, showInferred: e.target.checked })
                }
                className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                <span>Inferred Links</span>
              </span>
            </span>
            <span className="font-mono text-[10px] text-purple-500 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20 font-semibold">
              {graph.metrics.inferredEdges}
            </span>
          </label>

          {/* Co-Detections / Unverified Links Filter */}
          <label className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors ${
            isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.04]'
          }`}>
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.showUnverified}
                onChange={(e) =>
                  onFiltersChange({ ...filters, showUnverified: e.target.checked })
                }
                className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-800' : 'text-zinc-200'}`}>
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Unverified Links</span>
              </span>
            </span>
            <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 font-semibold">
              {graph.metrics.coDetectionEdges}
            </span>
          </label>
        </div>
      </div>

      {/* 2. Architecture Clusters Navigation */}
      <div className={`p-3.5 border-b ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className={`flex items-center justify-between font-semibold uppercase tracking-wider text-[10px] mb-2.5 ${
          isLight ? 'text-slate-500' : 'text-zinc-400'
        }`}>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            <span>Dependency Stacks ({sortedClusterIds.length})</span>
          </div>
          <span className="font-mono">{sortedClusterIds.length}</span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => onFiltersChange({ ...filters, selectedClusterId: 'all' })}
            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
              filters.selectedClusterId === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span>All Clusters</span>
            <span className="font-mono text-[10px] opacity-75">{graph.nodes.length}</span>
          </button>

          {sortedClusterIds.map((cId) => {
            const clusterNodes = clustersMap.get(cId) || [];
            const foundation = clusterNodes.find((n) => n.topologicalRank === 0) || clusterNodes[0];
            const isSelected = filters.selectedClusterId === cId;

            return (
              <button
                key={cId}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    selectedClusterId: isSelected ? 'all' : cId,
                  })
                }
                className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <span className="truncate pr-2">
                  {foundation ? `${foundation.name} Stack` : `Cluster #${cId}`}
                </span>
                <span className="font-mono text-[10px] opacity-75 shrink-0">
                  {clusterNodes.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Category Filter List */}
      <div className={`p-3.5 border-b ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
        <div className={`flex items-center justify-between font-semibold uppercase tracking-wider text-[10px] mb-2.5 ${
          isLight ? 'text-slate-500' : 'text-zinc-400'
        }`}>
          <span>Categories</span>
          <span className="font-mono">{categories.length}</span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => onFiltersChange({ ...filters, selectedCategory: 'all' })}
            className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-colors flex items-center justify-between cursor-pointer ${
              filters.selectedCategory === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span>All Categories</span>
            <span className="font-mono text-[10px] opacity-75">{graph.nodes.length}</span>
          </button>

          {categories.map(([category, count]) => {
            const isSelected = filters.selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    selectedCategory: isSelected ? 'all' : category,
                  })
                }
                className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-colors flex items-center justify-between capitalize cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold'
                    : isLight
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <span>{category}</span>
                <span className="font-mono text-[10px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Detected Nodes Quick Navigator */}
      <div className="p-3.5 flex-1">
        <div className={`font-semibold uppercase tracking-wider text-[10px] mb-2.5 ${
          isLight ? 'text-slate-500' : 'text-zinc-400'
        }`}>
          <span>Node Navigator</span>
        </div>

        <div className="space-y-0.5">
          {graph.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      node.isDirect
                        ? 'bg-emerald-400'
                        : node.isInferred
                        ? 'bg-purple-400'
                        : 'bg-zinc-500'
                    }`}
                  />
                  <span className="truncate">{node.name}</span>
                </div>
                <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isLight ? 'text-slate-400' : 'text-zinc-500'
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
