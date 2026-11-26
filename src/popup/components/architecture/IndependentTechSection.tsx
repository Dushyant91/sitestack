/**
 * SiteStack Architecture Flow - Independent Technologies Section
 * Location: src/popup/components/architecture/IndependentTechSection.tsx
 *
 * Renders technologies with no hard-dependency connections (e.g. standalone analytics,
 * payment gateways, CDNs, independent CSS frameworks).
 */

import React, { useState } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { ArchitectureNodeCard } from './ArchitectureNodeCard';
import { IndependentTechSectionProps } from './types';

export const IndependentTechSection: React.FC<IndependentTechSectionProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (nodes.length === 0) {
    return null;
  }

  // Deterministic sort by primaryRole asc, then name asc
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.primaryRole !== b.primaryRole) {
      return a.primaryRole.localeCompare(b.primaryRole);
    }
    return a.name.localeCompare(b.name);
  });

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
          <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-zinc-200">Other Detected Technologies</span>
            <span className="text-[10px] text-zinc-400 font-mono ml-2">({nodes.length})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-mono text-zinc-400">
            No hard dependencies
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
        <div className="p-2.5 space-y-1.5 bg-[#090a0f]/40">
          <p className="text-[10px] text-zinc-400 leading-relaxed px-0.5 mb-1">
            These technologies operate independently or through client-side tags without proven framework dependency chains.
          </p>

          <div className="space-y-1.5">
            {sortedNodes.map((node) => (
              <ArchitectureNodeCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => onSelectNode(node)}
                showRoleBadge={true}
                showTierBadge={true}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
