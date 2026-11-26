import React, { useMemo } from 'react';
import { SignalEvidence, SignalType } from '../../engine/types';
import { Info, ArrowUpRight, GitFork, Flag, CheckCircle2 } from 'lucide-react';

interface EvidenceDrawerProps {
  technologyId?: string;
  technologyName?: string;
  version?: string;
  evidence: SignalEvidence[];
  confidenceScore: number;
  isInferred?: boolean;
  parentDependency?: string;
  dependentTechnologies?: string[];
  confidenceReason?: string;
  website: string;
}

const TYPE_CONFIG: Record<
  SignalType,
  { label: string; title: string; explanation: string; color: string; badgeBg: string }
> = {
  global: {
    label: 'GLOBAL',
    title: 'Runtime JavaScript Globals',
    explanation: 'Active in-memory JavaScript runtime object on window',
    color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/15',
    badgeBg: 'bg-indigo-950/20 border-indigo-500/25',
  },
  dom: {
    label: 'DOM',
    title: 'DOM Elements & Selectors',
    explanation: 'Structural element, container ID, or framework attribute in markup',
    color: 'text-sky-300 border-sky-500/30 bg-sky-500/15',
    badgeBg: 'bg-sky-950/20 border-sky-500/25',
  },
  meta: {
    label: 'META',
    title: 'HTML Meta Tags',
    explanation: 'Generator or framework signature declared in HTML head',
    color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15',
    badgeBg: 'bg-emerald-950/20 border-emerald-500/25',
  },
  resource: {
    label: 'NETWORK',
    title: 'Scripts & Network Assets',
    explanation: 'Vendor script URL, client bundle, or CDN asset loaded by page',
    color: 'text-amber-300 border-amber-500/30 bg-amber-500/15',
    badgeBg: 'bg-amber-950/20 border-amber-500/25',
  },
  header: {
    label: 'HEADER',
    title: 'HTTP Response Headers',
    explanation: 'Server-side response header captured during initial request',
    color: 'text-purple-300 border-purple-500/30 bg-purple-500/15',
    badgeBg: 'bg-purple-950/20 border-purple-500/25',
  },
  inferred: {
    label: 'INFERRED',
    title: 'Architectural Prerequisite',
    explanation: 'Inferred via architectural hierarchy of a confirmed framework',
    color: 'text-violet-300 border-violet-500/30 bg-violet-500/20',
    badgeBg: 'bg-violet-950/25 border-violet-500/30',
  },
};

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  technologyId,
  technologyName,
  version,
  evidence,
  confidenceScore,
  isInferred,
  parentDependency,
  dependentTechnologies,
  confidenceReason,
  website,
}) => {
  // Group non-inferred evidence by signal category
  const groupedEvidence = useMemo(() => {
    const groups: Partial<Record<SignalType, SignalEvidence[]>> = {};
    for (const ev of evidence) {
      if (ev.type === 'inferred') continue;
      const type = ev.type in TYPE_CONFIG ? ev.type : 'resource';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type]!.push(ev);
    }
    return groups;
  }, [evidence]);

  const distinctClassCount = Object.keys(groupedEvidence).length;

  if (isInferred) {
    return (
      <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] text-[11px] font-mono space-y-2.5 bg-violet-950/20 rounded-lg p-2.5 border border-violet-500/20">
        <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-violet-300">
          <span className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-violet-400" />
            Architectural Dependency (Inferred)
          </span>
          <span className="text-violet-400 font-bold">
            Calibrated ({confidenceScore}%)
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-violet-500/30 text-[11px] text-zinc-300 leading-relaxed font-sans space-y-1.5">
          <div className="text-white font-medium flex items-center gap-1.5">
            <span>Inferred from {parentDependency || 'Parent Framework'}</span>
          </div>
          {confidenceReason ? (
            <p className="text-zinc-300 text-[10px] leading-relaxed">
              {confidenceReason}
            </p>
          ) : (
            <p className="text-zinc-400 text-[10px] leading-relaxed">
              This technology was inferred through its architectural relationship with <strong className="text-zinc-200">{parentDependency || 'detected framework'}</strong>. No direct browser signals were exposed in the client runtime.
            </p>
          )}
        </div>

        {evidence.filter((ev) => ev.type !== 'inferred').length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-violet-500/20">
            <span className="text-zinc-400 text-[9px] uppercase tracking-wider block font-semibold">
              Observed Supporting Signals:
            </span>
            {evidence
              .filter((ev) => ev.type !== 'inferred')
              .map((ev, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded bg-zinc-900/60 border border-violet-500/20 text-[10px]"
                >
                  <code className="text-zinc-300 truncate max-w-[200px]" title={ev.source}>
                    {ev.source}
                  </code>
                  <span className="text-violet-400 font-mono text-[9px]">+{ev.weight} pts</span>
                </div>
              ))}
          </div>
        )}

        <div className="pt-1 flex items-center justify-between text-[10px] font-sans border-t border-violet-500/20">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition-colors font-medium"
            >
              <span>Official Documentation</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </a>
          )}
          <a
            href={`https://github.com/Dushyant91/sitestack/issues/new?title=Detection+Feedback:+${encodeURIComponent(technologyId || 'inferred')}&labels=detection-feedback`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-[9px] transition-colors"
            title="Privately report an incorrect inference without sharing site data"
          >
            <Flag className="w-2.5 h-2.5" />
            <span>Report Feedback</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] text-[11px] font-mono space-y-2 bg-black/40 rounded-lg p-2.5 border border-white/[0.06]">
      {/* Dossier Header */}
      <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-indigo-400" />
          Direct Evidence Dossier ({evidence.length} {evidence.length === 1 ? 'Signal' : 'Signals'})
        </span>
        <span className="text-indigo-400 font-bold">
          Score: {confidenceScore}/100
        </span>
      </div>

      {/* Signal class corroboration count */}
      <div className="flex items-center justify-between text-[9px] text-zinc-400 font-sans px-1">
        <span>
          Corroborated across <strong className="text-zinc-200 font-mono">{distinctClassCount}</strong> signal {distinctClassCount === 1 ? 'class' : 'classes'}
        </span>
        <span className="text-zinc-500 font-mono">
          Threshold: &ge; 80 High | 50-79 Med
        </span>
      </div>

      {/* Detection Analysis Reason */}
      {confidenceReason && (
        <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/25 text-[10px] text-zinc-300 font-sans leading-relaxed">
          <span className="text-indigo-300 font-semibold block mb-0.5">Detection Analysis:</span>
          {confidenceReason}
        </div>
      )}

      {/* Version Transparency Note */}
      {!version && (
        <div className="p-2 rounded bg-zinc-900 border border-white/[0.08] text-[10px] text-zinc-400 font-sans leading-relaxed flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <span>
            {technologyId === 'nextjs'
              ? 'Next.js detected. The production build does not expose a reliable framework version, so SiteStack cannot determine the exact version.'
              : `Version not exposed: Production client assets for this technology do not expose a detectable version string. SiteStack avoids guessing versions.`}
          </span>
        </div>
      )}

      {/* Dependent Technologies Powers Notice */}
      {dependentTechnologies && dependentTechnologies.length > 0 && (
        <div className="p-1.5 rounded bg-violet-950/25 border border-violet-500/30 text-[10px] text-violet-300 font-sans flex items-center gap-1.5">
          <GitFork className="w-3 h-3 shrink-0 text-violet-400" />
          <span>Architecturally powers inferred: <strong className="text-white">{dependentTechnologies.join(', ')}</strong></span>
        </div>
      )}

      {/* Grouped Evidence Signals */}
      <div className="space-y-2.5 pt-1">
        {(Object.keys(groupedEvidence) as SignalType[]).map((type) => {
          const config = TYPE_CONFIG[type] || TYPE_CONFIG.resource;
          const items = groupedEvidence[type]!;
          return (
            <div key={type} className="space-y-1">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-zinc-400 px-0.5">
                <span className="font-semibold text-zinc-300 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-indigo-400" />
                  {config.title} ({items.length})
                </span>
                <span className="text-zinc-500 text-[8px] font-sans lowercase">{config.explanation}</span>
              </div>

              <div className="space-y-1">
                {items.map((ev, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-1.5 rounded bg-white/[0.02] border border-white/[0.05] text-[10px]"
                  >
                    <div className="flex items-start gap-1.5 min-w-0 flex-1">
                      <span
                        className={`px-1 py-0.5 rounded text-[8px] font-bold border shrink-0 uppercase font-mono ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <code className="text-zinc-200 font-bold block truncate max-w-[210px]" title={ev.source}>
                          {ev.source}
                        </code>
                        {ev.matchedValue && (
                          <span className="text-zinc-400 text-[9px] block truncate max-w-[210px]" title={ev.matchedValue}>
                            Matched: {ev.matchedValue}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-zinc-300 font-semibold font-mono text-[9px] shrink-0 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.08]">
                      +{ev.weight} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Documentation & Feedback Links */}
      <div className="pt-2 flex items-center justify-between text-[10px] font-sans border-t border-white/[0.06]">
        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors font-medium"
          >
            <span>Official Documentation</span>
            <ArrowUpRight className="w-2.5 h-2.5" />
          </a>
        ) : (
          <span className="text-zinc-500">Verified Catalog Rule</span>
        )}

        <a
          href={`https://github.com/Dushyant91/sitestack/issues/new?title=Detection+Report:+${encodeURIComponent(technologyName || technologyId || 'unknown')}&labels=detection-feedback`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-[9px] transition-colors"
          title="Privately report an incorrect detection on GitHub without sharing page content"
        >
          <Flag className="w-2.5 h-2.5" />
          <span>Report Misdetection</span>
        </a>
      </div>
    </div>
  );
};
