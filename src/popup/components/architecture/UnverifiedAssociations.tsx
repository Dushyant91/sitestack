/**
 * SiteStack Architecture Flow - Unverified Associations Component
 * Location: src/popup/components/architecture/UnverifiedAssociations.tsx
 *
 * STRICT INVARIANT:
 * Co-detected technologies must NEVER be described as verified integrations.
 * Explicitly labeled as "Both detected on page · Linkage unverified".
 */

import React, { useState } from 'react';
import { Link2, ChevronDown, AlertCircle } from 'lucide-react';
import { UnverifiedAssociationsProps } from './types';

export const UnverifiedAssociations: React.FC<UnverifiedAssociationsProps> = ({
  edges,
  nodesById,
  onSelectNode,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (edges.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white/[0.015] border border-white/[0.08] overflow-hidden select-none">
      {/* Section Header Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors border-b border-white/[0.05]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Link2 className="w-3.5 h-3.5 text-amber-400/80 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-zinc-200">Unverified Associations</span>
            <span className="text-[10px] text-zinc-400 font-mono ml-2">({edges.length})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Co-Detected
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-zinc-200' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-2.5 space-y-2 bg-[#090a0f]/40">
          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[10px] text-amber-200/90 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              These technologies were co-detected on this website. While common architectural patterns exist in the catalog, client-side scripts do not prove direct integration.
            </p>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {edges.map((edge) => {
              const sourceNode = nodesById.get(edge.sourceId);
              const targetNode = nodesById.get(edge.targetId);

              const sourceName = sourceNode?.name || edge.sourceId;
              const targetName = targetNode?.name || edge.targetId;

              return (
                <div
                  key={edge.id}
                  className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    {/* Pair display */}
                    <div className="flex items-center gap-1.5 font-medium text-white text-[11px] truncate">
                      <button
                        type="button"
                        onClick={() => sourceNode && onSelectNode?.(sourceNode)}
                        className="hover:text-indigo-300 hover:underline transition-colors truncate max-w-[100px]"
                        title={`Inspect ${sourceName}`}
                      >
                        {sourceName}
                      </button>
                      <span className="text-zinc-500 font-mono text-[9px] shrink-0">
                        +
                      </span>
                      <button
                        type="button"
                        onClick={() => targetNode && onSelectNode?.(targetNode)}
                        className="hover:text-indigo-300 hover:underline transition-colors truncate max-w-[100px]"
                        title={`Inspect ${targetName}`}
                      >
                        {targetName}
                      </button>
                    </div>

                    {/* Unverified Badge */}
                    <span className="text-[8px] font-mono uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300/90 border border-amber-500/20 shrink-0">
                      UNVERIFIED
                    </span>
                  </div>

                  {/* Relationship Label & Disclaimer */}
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span className="capitalize">{edge.label}</span>
                    <span className="text-[9px] text-zinc-500 italic">
                      Both detected · Linkage unverified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
