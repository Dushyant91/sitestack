/**
 * SiteStack Architecture Flow - Dependency Connector Component
 * Location: src/popup/components/architecture/DependencyConnector.tsx
 */

import React from 'react';
import { ArrowDown, ShieldCheck, GitFork } from 'lucide-react';
import { DependencyConnectorProps } from './types';

export const DependencyConnector: React.FC<DependencyConnectorProps> = ({
  edge,
  sourceName,
  targetName,
}) => {
  const isDirect = edge.evidenceState === 'directly_observed';
  const isInferred = edge.evidenceState === 'inferred';

  // Label text: e.g. "powers" or "depends on"
  const relationshipVerb =
    edge.relationshipType === 'extends'
      ? 'extended by'
      : 'powers / required by';

  return (
    <div
      role="separator"
      aria-label={`${targetName} is a verified dependency of ${sourceName} (${isDirect ? 'directly observed' : 'inferred'})`}
      className="flex flex-col items-center justify-center my-1 select-none"
    >
      {/* Top vertical guide segment */}
      <div
        className={`w-0.5 h-2 ${
          isDirect
            ? 'bg-emerald-500/40'
            : isInferred
              ? 'border-l border-dashed border-violet-500/50'
              : 'border-l border-dotted border-zinc-600'
        }`}
      />

      {/* Central Connector Pill */}
      <div
        className={`px-2 py-0.5 rounded-full text-[9px] font-mono flex items-center gap-1.5 shadow-sm border transition-colors ${
          isDirect
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
            : isInferred
              ? 'bg-violet-950/40 text-violet-300 border-violet-500/30'
              : 'bg-zinc-900/60 text-zinc-400 border-white/[0.08]'
        }`}
        title={edge.evidenceDescription}
      >
        {isDirect ? (
          <>
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wider text-[8px]">
              VERIFIED
            </span>
          </>
        ) : (
          <>
            <GitFork className="w-2.5 h-2.5 text-violet-400 shrink-0" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wider text-[8px]">
              INFERRED
            </span>
          </>
        )}

        <span className="text-zinc-500">·</span>
        <span className="text-[9px] text-zinc-300">{relationshipVerb}</span>
        <ArrowDown className="w-2.5 h-2.5 text-zinc-400 shrink-0" aria-hidden="true" />
      </div>

      {/* Bottom vertical guide segment */}
      <div
        className={`w-0.5 h-2 ${
          isDirect
            ? 'bg-emerald-500/40'
            : isInferred
              ? 'border-l border-dashed border-violet-500/50'
              : 'border-l border-dotted border-zinc-600'
        }`}
      />
    </div>
  );
};
