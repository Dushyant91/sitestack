/**
 * SiteStack Architecture Flow - Node Card Component
 * Location: src/popup/components/architecture/ArchitectureNodeCard.tsx
 */

import React from 'react';
import { TechIcon } from '../TechIcon';
import { ArchitectureNodeCardProps } from './types';
import { ArchitectureSemanticRole } from '../../../engine/architecture/types';

const ROLE_LABELS: Record<ArchitectureSemanticRole, string> = {
  runtime: 'Runtime',
  platform: 'Platform',
  framework: 'Framework',
  library: 'Library',
  cms: 'CMS',
  ecommerce: 'Ecommerce',
  payment: 'Payments',
  analytics: 'Analytics',
  marketing: 'Marketing',
  hosting: 'Hosting',
  styling: 'Styling',
  infrastructure: 'Infra',
  hosted_platform: 'Hosted CMS',
};

const ROLE_STYLES: Record<ArchitectureSemanticRole, string> = {
  runtime: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  platform: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  framework: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  library: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  cms: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  ecommerce: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  payment: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  analytics: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  marketing: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
  hosting: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  styling: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  infrastructure: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  hosted_platform: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
};

export const ArchitectureNodeCard: React.FC<ArchitectureNodeCardProps> = ({
  node,
  isSelected = false,
  onClick,
  onKeyDown,
  showRoleBadge = true,
  showTierBadge = true,
  compact = false,
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  // Confidence styling
  const confidenceBadge = node.isInferred ? (
    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-violet-500/15 text-violet-300 border-violet-500/30 whitespace-nowrap">
      {node.confidenceScore}% INFERRED
    </span>
  ) : (
    <span
      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
        node.confidenceTier === 'high'
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          : node.confidenceTier === 'medium'
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-zinc-700/20 text-zinc-400 border-zinc-700/40'
      }`}
    >
      {node.confidenceScore}% {node.confidenceTier.toUpperCase()}
    </span>
  );

  // Topological Tier Badge (Foundation vs Dependent Framework vs Independent)
  const tierBadge = () => {
    if (!showTierBadge) return null;
    if (node.dependencyClusterId > 0) {
      if (node.topologicalRank === 0) {
        return (
          <span
            className="text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0"
            title="Stack Foundation: Base prerequisite at topological rank 0 of this dependency hierarchy"
          >
            Foundation
          </span>
        );
      }
      return (
        <span
          className="text-[8px] px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 shrink-0"
          title={`Dependent: Technology at topological rank ${node.topologicalRank} in this dependency hierarchy`}
        >
          Dependent (Rank {node.topologicalRank})
        </span>
      );
    }
    return (
      <span
        className="text-[8px] px-1.5 py-0.5 rounded font-mono font-medium bg-white/[0.04] text-zinc-400 border border-white/[0.07] shrink-0"
        title="Independent: Technology with no verified hard dependencies on this page"
      >
        Independent
      </span>
    );
  };

  const roleStyle = ROLE_STYLES[node.primaryRole] || ROLE_STYLES.library;
  const roleLabel = ROLE_LABELS[node.primaryRole] || node.primaryRole;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${node.name}, ${node.category}, confidence ${node.confidenceScore}%, ${node.isInferred ? 'inferred' : 'direct'}`}
      className={`rounded-xl p-2.5 transition-all duration-150 cursor-pointer select-none text-left border relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80 ${
        isSelected
          ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
          : node.isInferred
            ? 'bg-violet-950/15 border-dashed border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-950/25'
            : 'bg-white/[0.025] border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.045]'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: Icon + Tech Details */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <TechIcon id={node.id} name={node.name} className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} shrink-0 mt-0.5`} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-xs font-bold text-white truncate max-w-[170px]"
                title={node.name}
              >
                {node.name}
              </span>

              {node.version && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-mono font-medium bg-white/[0.06] text-zinc-300 border border-white/[0.1] shrink-0">
                  v{node.version}
                </span>
              )}

              {tierBadge()}

              {showRoleBadge && (
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-medium border shrink-0 ${roleStyle}`}
                >
                  {roleLabel}
                </span>
              )}
            </div>

            {!compact && node.description && (
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed line-clamp-1">
                {node.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Confidence Badge */}
        <div className="shrink-0 pt-0.5">
          {confidenceBadge}
        </div>
      </div>
    </div>
  );
};
