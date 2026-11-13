import React, { useState } from 'react';
import { DetectedTechnology } from '../../engine/types';
import { TechIcon } from './TechIcon';
import { EvidenceDrawer } from './EvidenceDrawer';
import { ChevronDown } from 'lucide-react';

interface TechCardProps {
  technology: DetectedTechnology;
  initiallyExpanded?: boolean;
}

export const TechCard: React.FC<TechCardProps> = ({
  technology,
  initiallyExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initiallyExpanded);

  // Confidence Tier styling
  const tierBadges = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-zinc-700/20 text-zinc-400 border-zinc-700/40',
  };

  const tierBadgeStyle = tierBadges[technology.confidenceTier] || tierBadges.medium;

  return (
    <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.07] hover:border-zinc-700/70 transition-all duration-200 group">
      {/* Top Header Row (Clickable to toggle Evidence) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-start justify-between cursor-pointer select-none"
        title="Click to view evidence chain"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <TechIcon id={technology.id} name={technology.name} className="w-7 h-7 shrink-0 mt-0.5" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                {technology.name}
              </span>

              {technology.version && (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                  v{technology.version}
                </span>
              )}

              {technology.isInferred && (
                <span className="text-[8px] px-1 py-0.2 rounded font-mono uppercase font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                  Inferred
                </span>
              )}

              {technology.dependentTechnologies && technology.dependentTechnologies.length > 0 && (
                <span className="text-[8px] px-1 py-0.2 rounded font-mono font-medium bg-zinc-800/80 text-violet-300 border border-violet-500/20 shrink-0">
                  Powers {technology.dependentTechnologies.join(', ')}
                </span>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 truncate mt-0.5 max-w-[210px]">
              {technology.description}
            </p>
          </div>
        </div>

        {/* Confidence Tier Badge & Chevron Toggle */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {technology.isInferred ? (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-violet-500/15 text-violet-300 border-violet-500/30">
              {technology.confidenceScore}% INFERRED
            </span>
          ) : (
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${tierBadgeStyle}`}
            >
              {technology.confidenceScore}% {technology.confidenceTier.toUpperCase()}
            </span>
          )}

          <ChevronDown
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-zinc-300' : 'group-hover:text-zinc-400'
            }`}
          />
        </div>
      </div>

      {/* Expandable Evidence Drawer */}
      {isExpanded && (
        <EvidenceDrawer
          technologyId={technology.id}
          version={technology.version}
          evidence={technology.evidence}
          confidenceScore={technology.confidenceScore}
          isInferred={technology.isInferred}
          parentDependency={technology.parentDependency}
          dependentTechnologies={technology.dependentTechnologies}
          confidenceReason={technology.confidenceReason}
          website={technology.website}
        />
      )}
    </div>
  );
};
