/**
 * SiteStack Architecture Flow - Technology Detail Drawer
 * Location: src/popup/components/architecture/TechnologyDetailDrawer.tsx
 *
 * Slide-over drawer providing transparent node dossier, provenance chain,
 * semantic roles, and active graph connections.
 */

import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, GitFork, ShieldCheck, Info } from 'lucide-react';
import { TechIcon } from '../TechIcon';
import { TechnologyDetailDrawerProps } from './types';

export const TechnologyDetailDrawer: React.FC<TechnologyDetailDrawerProps> = ({
  node,
  graph,
  onClose,
  onSelectRelatedNode,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key press & restore focus on unmount
  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [onClose]);

  // Find incoming & outgoing edges for this node
  const outgoingHardDeps = graph.edges.filter(
    (e) => e.sourceId === node.id && e.classification === 'hard_dependency' && e.isVerified
  );
  const incomingHardDeps = graph.edges.filter(
    (e) => e.targetId === node.id && e.classification === 'hard_dependency' && e.isVerified
  );
  const contextualEdges = graph.edges.filter(
    (e) => (e.sourceId === node.id || e.targetId === node.id) && e.classification === 'contextual'
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${node.name} architecture details`}
      className="absolute inset-0 z-50 flex flex-col bg-[#090a0f]/95 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Drawer Header */}
      <div className="px-3.5 py-2.5 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <TechIcon id={node.id} name={node.name} className="w-6 h-6 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{node.name}</h4>
            <span className="text-[10px] text-zinc-400 capitalize font-mono">
              {node.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {node.website && (
            <a
              href={node.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Official technology website"
              aria-label={`Visit official website for ${node.name}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Close details (Esc)"
            aria-label="Close details panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
        {/* Quick Confidence & Detection Badge Dossier */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono select-none">
          {/* Confidence Score */}
          <div className="p-2 rounded-lg bg-white/[0.025] border border-white/[0.07] flex flex-col justify-between">
            <span className="text-[9px] text-zinc-400 uppercase font-sans font-semibold tracking-wider">
              Confidence
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-sm font-bold text-white">{node.confidenceScore}%</span>
              <span className="text-[9px] uppercase text-zinc-400">
                ({node.confidenceTier})
              </span>
            </div>
            <span className="text-[8px] text-zinc-500 font-sans mt-0.5">
              Heuristic confidence (not code %)
            </span>
          </div>

          {/* Detection State */}
          <div className="p-2 rounded-lg bg-white/[0.025] border border-white/[0.07] flex flex-col justify-between">
            <span className="text-[9px] text-zinc-400 uppercase font-sans font-semibold tracking-wider">
              Detection Type
            </span>
            <div className="mt-1">
              {node.isInferred ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-300">
                  <GitFork className="w-3 h-3 text-violet-400" /> Inferred
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Direct
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inference Provenance Chain (If Inferred) */}
        {node.isInferred && node.inferredProvenance && (
          <div className="p-2.5 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-300 uppercase tracking-wider font-mono">
              <GitFork className="w-3.5 h-3.5 text-violet-400" />
              Inference Provenance Chain
            </div>
            <div className="text-[10px] space-y-1 font-mono text-zinc-300 bg-zinc-900/80 p-2 rounded-lg border border-violet-500/20">
              <div>
                <span className="text-zinc-500">Inferred from: </span>
                <span className="text-violet-300 font-bold">
                  {node.inferredProvenance.sourceTechnologyName}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Rule ID: </span>
                <span className="text-zinc-300">{node.inferredProvenance.ruleId}</span>
              </div>
              <p className="font-sans text-zinc-400 text-[10px] mt-1 leading-relaxed">
                {node.inferredProvenance.reason}
              </p>
            </div>
          </div>
        )}

        {/* Direct Detection Evidence Summary (If Direct) */}
        {!node.isInferred && node.evidenceSummary && (
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">
              <Info className="w-3 h-3 text-zinc-400" /> Evidence Summary
            </div>
            <p className="text-[10px] font-mono text-zinc-300 leading-relaxed bg-white/[0.02] p-1.5 rounded border border-white/[0.05]">
              {node.evidenceSummary}
            </p>
          </div>
        )}

        {/* Semantic Role Memberships */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block font-sans">
            Semantic Architecture Roles
          </span>
          <div className="flex flex-wrap gap-1">
            {node.roles.map((role) => (
              <span
                key={role}
                className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                  role === node.primaryRole
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold'
                    : 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                }`}
              >
                {role === node.primaryRole ? `★ ${role}` : role}
              </span>
            ))}
          </div>
        </div>

        {/* Active Graph Connections */}
        <div className="space-y-2 pt-1 border-t border-white/[0.06]">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block font-sans">
            Graph Connections
          </span>

          {/* Outgoing Hard Dependencies (This node depends on...) */}
          {outgoingHardDeps.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-400">Depends on (Prerequisites):</span>
                <span className="text-[8px] text-zinc-500 font-sans">Strict runtime prerequisite</span>
              </div>
              {outgoingHardDeps.map((e) => {
                const targetNode = graph.nodes.find((n) => n.id === e.targetId);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onSelectRelatedNode?.(e.targetId)}
                    className="w-full text-left p-1.5 rounded bg-white/[0.02] border border-emerald-500/20 flex items-center justify-between text-[10px] hover:border-emerald-500/40 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-emerald-400 block">{targetNode?.name || e.targetId}</span>
                      <span className="text-[8px] text-zinc-400 font-sans">{node.name} requires this foundation to run</span>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">
                      {e.evidenceState}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Incoming Hard Dependencies (Other nodes depend on this node) */}
          {incomingHardDeps.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-400">Powers (Dependents):</span>
                <span className="text-[8px] text-zinc-500 font-sans">Architectural foundation</span>
              </div>
              {incomingHardDeps.map((e) => {
                const sourceNode = graph.nodes.find((n) => n.id === e.sourceId);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onSelectRelatedNode?.(e.sourceId)}
                    className="w-full text-left p-1.5 rounded bg-white/[0.02] border border-indigo-500/20 flex items-center justify-between text-[10px] hover:border-indigo-500/40 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-indigo-300 block">{sourceNode?.name || e.sourceId}</span>
                      <span className="text-[8px] text-zinc-400 font-sans">Built on top of {node.name}</span>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">
                      {e.evidenceState}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Contextual Co-Detection */}
          {contextualEdges.length > 0 && (
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-zinc-400">Co-Detected Associations:</span>
              <div className="space-y-1 max-h-[90px] overflow-y-auto">
                {contextualEdges.map((e) => {
                  const otherId = e.sourceId === node.id ? e.targetId : e.sourceId;
                  const otherNode = graph.nodes.find((n) => n.id === otherId);
                  return (
                    <div
                      key={e.id}
                      className="p-1.5 rounded bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-[9px]"
                    >
                      <span className="text-zinc-300 font-mono">{otherNode?.name || otherId}</span>
                      <span className="text-[8px] text-amber-400/80 font-mono italic">
                        Unverified {e.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {outgoingHardDeps.length === 0 && incomingHardDeps.length === 0 && contextualEdges.length === 0 && (
            <p className="text-[10px] text-zinc-500 italic p-1">
              No active relationships connected to this technology on this website.
            </p>
          )}
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-2.5 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>
          {node.dependencyClusterId > 0
            ? node.topologicalRank === 0
              ? 'Rank 0 (Stack Base)'
              : `Rank ${node.topologicalRank} (Dependent)`
            : 'Rank 0 (Independent)'}
        </span>
        <span>{node.dependencyClusterId > 0 ? `Cluster #${node.dependencyClusterId}` : 'Cluster: None'}</span>
        <div className="flex items-center gap-2">
          <a
            href={`https://github.com/Dushyant91/sitestack/issues/new?title=Architecture+Feedback:+${encodeURIComponent(node.id)}&labels=detection-feedback`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 font-sans text-[9px] underline"
            title="Privately report feedback about this technology mapping"
          >
            Feedback
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
