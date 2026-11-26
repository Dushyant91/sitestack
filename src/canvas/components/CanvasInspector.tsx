/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Inspector Panel
 * Location: src/canvas/components/CanvasInspector.tsx
 */

import React, { useEffect, useMemo } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  GitFork,
} from 'lucide-react';
import {
  ArchitectureGraph,
  ArchitectureGraphNode,
} from '../../engine/architecture/graph/types';

export interface CanvasInspectorProps {
  readonly node: ArchitectureGraphNode;
  readonly graph: ArchitectureGraph;
  readonly onClose: () => void;
  readonly onSelectRelatedNode?: (nodeId: string) => void;
  readonly theme?: 'dark' | 'light';
}

export const CanvasInspector: React.FC<CanvasInspectorProps> = ({
  node,
  graph,
  onClose,
  onSelectRelatedNode,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Escape key handler to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Nodes index
  const nodesById = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n])),
    [graph.nodes]
  );

  // Upstream prerequisites (nodes this node depends on)
  const prerequisites = useMemo(() => {
    return graph.edges
      .filter((e) => e.sourceId === node.id && (e.relationshipType === 'depends_on' || e.relationshipType === 'extends'))
      .map((e) => ({
        edge: e,
        targetNode: nodesById.get(e.targetId) || null,
      }))
      .filter((item) => item.targetNode !== null);
  }, [graph.edges, node.id, nodesById]);

  // Downstream dependents (nodes that depend on this node)
  const dependents = useMemo(() => {
    return graph.edges
      .filter((e) => e.targetId === node.id && (e.relationshipType === 'depends_on' || e.relationshipType === 'extends'))
      .map((e) => ({
        edge: e,
        sourceNode: nodesById.get(e.sourceId) || null,
      }))
      .filter((item) => item.sourceNode !== null);
  }, [graph.edges, node.id, nodesById]);

  // Contextual co-detections
  const contextualAssociations = useMemo(() => {
    return graph.edges
      .filter(
        (e) =>
          e.classification === 'contextual' &&
          (e.sourceId === node.id || e.targetId === node.id)
      )
      .map((e) => {
        const otherId = e.sourceId === node.id ? e.targetId : e.sourceId;
        return {
          edge: e,
          otherNode: nodesById.get(otherId) || null,
        };
      })
      .filter((item) => item.otherNode !== null);
  }, [graph.edges, node.id, nodesById]);

  const tierColors = {
    high: isLight
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: isLight
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: isLight
      ? 'text-slate-700 bg-slate-100 border-slate-200'
      : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  };

  return (
    <aside
      role="dialog"
      aria-label={`Inspection Dossier for ${node.name}`}
      className={`w-80 flex flex-col shrink-0 overflow-y-auto select-none z-10 text-xs shadow-2xl transition-colors duration-200 ${
        isLight ? 'bg-white border-l border-slate-200 text-slate-800' : 'bg-[#0d0f17] border-l border-white/[0.08] text-zinc-100'
      }`}
    >
      {/* Header */}
      <div className={`p-4 border-b flex items-start justify-between gap-3 ${
        isLight ? 'border-slate-200' : 'border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.06] border-white/[0.1]'
          }`}>
            {node.icon ? (
              <img src={node.icon} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <span className="font-bold text-xs text-indigo-500">
                {node.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className={`text-sm font-bold truncate leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {node.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                {node.category}
              </span>
              {node.version && (
                <span className="text-[10px] font-mono text-indigo-500 font-semibold">
                  v{node.version}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`p-1 rounded-md transition-colors ${
            isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Close inspector (Escape)"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-4">
        {/* Confidence Tier & Evidence Standard */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${tierColors[node.confidenceTier]}`}>
          <div className="flex items-center gap-2">
            {node.isDirect ? (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <GitFork className="w-4 h-4 text-purple-500" />
            )}
            <div>
              <span className={`text-[10px] uppercase font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'} block`}>
                Detection Confidence:
              </span>
              <span className="font-bold uppercase tracking-wider text-[11px]">
                {node.isDirect ? 'Directly Observed' : 'Inferred'}
              </span>
            </div>
          </div>
          <span className="font-mono font-bold text-xs">{node.confidenceScore}%</span>
        </div>

        {/* Architectural Role */}
        <div>
          <div className={`font-semibold uppercase tracking-wider text-[10px] mb-1.5 ${
            isLight ? 'text-slate-500' : 'text-zinc-400'
          }`}>
            Architecture Role
          </div>
          <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/[0.06] text-zinc-300'
          }`}>
            {node.isInferred ? (
              <span>
                <strong>Architectural Inference:</strong> Inferred from verified runtime parent dependency.
              </span>
            ) : node.dependencyClusterId > 0 && node.topologicalRank === 0 ? (
              <span>
                <strong>Stack Foundation:</strong> Serves as root framework or infrastructure for downstream dependencies.
              </span>
            ) : (
              <span>
                <strong>Direct Observation:</strong> Verified through active runtime globals, script assets, or DOM markers.
              </span>
            )}
          </div>
        </div>

        {/* Upstream Prerequisites */}
        {prerequisites.length > 0 && (
          <div>
            <div className={`font-semibold uppercase tracking-wider text-[10px] mb-1.5 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Upstream Prerequisites ({prerequisites.length})
            </div>
            <div className="space-y-1.5">
              {prerequisites.map(({ edge, targetNode }) => (
                <button
                  key={edge.id}
                  onClick={() => onSelectRelatedNode?.(targetNode!.id)}
                  className={`w-full p-2 rounded-lg border text-left transition-colors flex items-center justify-between group cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] text-zinc-300 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-medium text-xs group-hover:text-indigo-500 transition-colors">
                      {targetNode?.name}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                      {edge.explanation || edge.evidenceDescription}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 font-semibold uppercase">
                    {edge.label || edge.relationshipType}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Downstream Dependents */}
        {dependents.length > 0 && (
          <div>
            <div className={`font-semibold uppercase tracking-wider text-[10px] mb-1.5 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Downstream Dependents ({dependents.length})
            </div>
            <div className="space-y-1.5">
              {dependents.map(({ edge, sourceNode }) => (
                <button
                  key={edge.id}
                  onClick={() => onSelectRelatedNode?.(sourceNode!.id)}
                  className={`w-full p-2 rounded-lg border text-left transition-colors flex items-center justify-between group cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] text-zinc-300 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-medium text-xs group-hover:text-indigo-500 transition-colors">
                      {sourceNode?.name}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                      {edge.explanation || edge.evidenceDescription}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold uppercase ${
                    edge.isInferred
                      ? 'text-violet-300 bg-purple-500/20 border-purple-500/40'
                      : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    {edge.isInferred ? 'INFERRED' : (edge.label || edge.relationshipType)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contextual Associations */}
        {contextualAssociations.length > 0 && (
          <div>
            <div className={`font-semibold uppercase tracking-wider text-[10px] mb-1.5 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Contextual Co-Detections ({contextualAssociations.length})
            </div>
            <div className="space-y-1.5">
              {contextualAssociations.map(({ edge, otherNode }) => (
                <button
                  key={edge.id}
                  onClick={() => onSelectRelatedNode?.(otherNode!.id)}
                  className={`w-full p-2 rounded-lg border text-left transition-colors flex items-center justify-between group cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06] text-zinc-300 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-medium text-xs group-hover:text-indigo-500 transition-colors">
                      {otherNode?.name}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                      {edge.explanation || edge.evidenceDescription}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold uppercase">
                    Unverified
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detection Evidence */}
        {node.inferredProvenance ? (
          <div>
            <div className={`font-semibold uppercase tracking-wider text-[10px] mb-1.5 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Inference Provenance Chain
            </div>
            <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/[0.05] text-zinc-300'
            }`}>
              <div className="font-semibold text-purple-400 mb-1">
                Parent: {node.inferredProvenance.sourceTechnologyName || node.inferredProvenance.sourceTechnologyId}
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Rule: {node.inferredProvenance.ruleId}
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-zinc-300'} mt-1`}>
                Reason: {node.inferredProvenance.reason}
              </div>
            </div>
          </div>
        ) : node.evidenceSummary ? (
          <div>
            <div className={`font-semibold uppercase tracking-wider text-[10px] mb-1.5 ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}>
              Corroborating Signal
            </div>
            <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed font-mono ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.02] border-white/[0.05] text-zinc-300'
            }`}>
              <div className="text-emerald-500 font-bold uppercase text-[9px] mb-1">
                [Signal Detected]
              </div>
              <div>{node.evidenceSummary}</div>
            </div>
          </div>
        ) : null}

        {/* Website Link */}
        {node.website && (
          <div className={`pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/[0.08]'}`}>
            <a
              href={node.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
            >
              <span>Visit Official Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};
