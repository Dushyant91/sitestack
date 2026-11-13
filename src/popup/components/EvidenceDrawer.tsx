import React from 'react';
import { SignalEvidence, SignalType } from '../../engine/types';
import { Info, ArrowUpRight, GitFork } from 'lucide-react';

interface EvidenceDrawerProps {
  evidence: SignalEvidence[];
  confidenceScore: number;
  isInferred?: boolean;
  parentDependency?: string;
  dependentTechnologies?: string[];
  confidenceReason?: string;
  website: string;
}

const TYPE_BADGES: Record<SignalType, { label: string; color: string }> = {
  global: { label: 'GLOBAL', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  meta: { label: 'META', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  dom: { label: 'DOM', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  resource: { label: 'NETWORK', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  header: { label: 'HEADER', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  inferred: { label: 'INFERRED', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
};

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  evidence,
  confidenceScore,
  isInferred,
  parentDependency,
  dependentTechnologies,
  confidenceReason,
  website,
}) => {
  if (isInferred) {
    return (
      <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 text-[11px] font-mono space-y-2.5 bg-violet-950/20 rounded-lg p-2.5 border border-violet-500/20">
        <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-violet-300">
          <span className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-violet-400" />
            Architectural Dependency
          </span>
          <span className="text-violet-400 font-bold">
            Calibrated ({confidenceScore}%)
          </span>
        </div>

        <div className="p-2 rounded bg-zinc-900/80 border border-violet-500/30 text-[11px] text-zinc-300 leading-relaxed font-sans space-y-1.5">
          <div className="text-white font-medium flex items-center gap-1.5">
            <span>Inferred from {parentDependency || 'Parent Framework'}</span>
          </div>
          {confidenceReason ? (
            <p className="text-zinc-300 text-[10px] leading-relaxed">
              {confidenceReason}
            </p>
          ) : (
            <p className="text-zinc-400 text-[10px]">
              This technology was inferred through its architectural relationship with <strong className="text-zinc-200">{parentDependency || 'detected framework'}</strong>. No direct browser signals were directly exposed in the client runtime.
            </p>
          )}
        </div>

        {website && (
          <div className="pt-1 flex items-center justify-between text-[10px] font-sans border-t border-violet-500/20">
            <span className="text-zinc-500">Official Website</span>
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors"
            >
              <span>Visit documentation</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 text-[11px] font-mono space-y-2 bg-zinc-950/60 rounded-lg p-2.5 border border-zinc-800/50">
      <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-indigo-400" />
          Direct Evidence Chain ({evidence.length} {evidence.length === 1 ? 'Signal' : 'Signals'})
        </span>
        <span className="text-indigo-400 font-bold">
          Score: {confidenceScore}/100
        </span>
      </div>

      {confidenceReason && (
        <div className="p-2 rounded bg-indigo-950/20 border border-indigo-500/25 text-[10px] text-zinc-300 font-sans leading-relaxed">
          <span className="text-indigo-300 font-semibold block mb-0.5">Detection Analysis:</span>
          {confidenceReason}
        </div>
      )}

      {dependentTechnologies && dependentTechnologies.length > 0 && (
        <div className="p-1.5 rounded bg-violet-950/25 border border-violet-500/30 text-[10px] text-violet-300 font-sans flex items-center gap-1.5">
          <GitFork className="w-3 h-3 shrink-0 text-violet-400" />
          <span>Architecturally powers inferred: <strong className="text-white">{dependentTechnologies.join(', ')}</strong></span>
        </div>
      )}

      <div className="space-y-1.5">
        {evidence.map((ev, idx) => {
          const badge = TYPE_BADGES[ev.type] || TYPE_BADGES.dom;
          return (
            <div
              key={idx}
              className="flex items-start justify-between gap-2 p-1.5 rounded bg-zinc-900/60 border border-zinc-800/40 text-[10px]"
            >
              <div className="flex items-start gap-1.5 min-w-0">
                <span
                  className={`px-1 py-0.2 rounded text-[8px] font-bold border shrink-0 uppercase ${badge.color}`}
                >
                  {badge.label}
                </span>
                <div className="min-w-0">
                  <code className="text-zinc-200 font-bold block truncate max-w-[200px]" title={ev.source}>
                    {ev.source}
                  </code>
                  {ev.matchedValue && (
                    <span className="text-zinc-500 text-[9px] block truncate max-w-[200px]" title={ev.matchedValue}>
                      Match: {ev.matchedValue}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-emerald-400 font-semibold font-mono text-[9px] shrink-0">
                +{ev.weight}
              </span>
            </div>
          );
        })}
      </div>

      {website && (
        <div className="pt-1 flex items-center justify-between text-[10px] font-sans border-t border-zinc-800/60">
          <span className="text-zinc-500">Official Website</span>
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
          >
            <span>Visit documentation</span>
            <ArrowUpRight className="w-2.5 h-2.5" />
          </a>
        </div>
      )}
    </div>
  );
};
