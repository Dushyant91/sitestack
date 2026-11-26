/**
 * SiteStack Architecture Intelligence - Architecture Summary Banner
 * Location: src/popup/components/architecture/ArchitectureSummary.tsx
 */

import React from 'react';
import { Layers, ShieldCheck, GitFork, Link2 } from 'lucide-react';
import { ArchitectureSummaryProps } from './types';

export const ArchitectureSummary: React.FC<ArchitectureSummaryProps> = ({
  totalNodes,
  directlyObservedEdges,
  directEdges,
  verifiedEdges,
  inferredEdges = 0,
  coDetectionEdges = 0,
  totalDependencies,
  showTotalDependencies = false,
}) => {
  // Sanitize and guard input counts safely against missing or malformed inputs
  const safeInferred = Number.isFinite(inferredEdges) ? Math.max(0, inferredEdges) : 0;
  const safeCoDetection = Number.isFinite(coDetectionEdges) ? Math.max(0, coDetectionEdges) : 0;
  const safeNodes = Number.isFinite(totalNodes) ? Math.max(0, totalNodes) : 0;

  // Resolve directly observed count with strict backward-compatible precedence:
  // 1. Explicit direct metric (directlyObservedEdges or directEdges) takes absolute precedence
  // 2. Legacy verifiedEdges fallback: verifiedEdges minus safeInferred
  // 3. Fallback to 0 if all are absent or non-finite
  const rawDirect =
    directlyObservedEdges ??
    directEdges ??
    (verifiedEdges !== undefined && Number.isFinite(verifiedEdges)
      ? Math.max(0, verifiedEdges - safeInferred)
      : 0);

  const directCount = Number.isFinite(rawDirect) ? Math.max(0, rawDirect) : 0;
  const totalDeps = Number.isFinite(totalDependencies)
    ? Math.max(0, totalDependencies!)
    : directCount + safeInferred;

  return (
    <div
      role="region"
      aria-label={`Architecture Graph Summary: ${safeNodes} technologies, ${totalDeps} total dependencies (${directCount} direct, ${safeInferred} inferred), ${safeCoDetection} unverified associations`}
      className="px-3.5 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0 select-none flex-wrap gap-y-1.5"
    >
      {/* Total Technologies */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Layers className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
        <span className="text-zinc-400 text-[11px] font-medium">Graph:</span>
        <span
          className="font-semibold font-mono text-[11px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded"
          title={`${safeNodes} detected technologies in the active architecture graph`}
          data-testid="summary-total-technologies"
        >
          {safeNodes} {safeNodes === 1 ? 'Technology' : 'Technologies'}
        </span>
      </div>

      {/* Connection Breakdown Metrics */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap">
        {/* Optional Total Dependencies Badge */}
        {showTotalDependencies && totalDeps > 0 && (
          <span
            className="flex items-center gap-1 text-sky-400 font-medium bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20"
            title={`${totalDeps} total dependencies (${directCount} directly observed + ${safeInferred} inferred)`}
            data-testid="summary-total-dependencies"
          >
            <span>{totalDeps} Total Deps</span>
          </span>
        )}

        {/* Directly Observed Hard Dependencies */}
        {directCount > 0 ? (
          <span
            className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
            title={`${directCount} directly observed dependency connections (supported by explicit direct evidence)`}
            data-testid="summary-direct-dependencies"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            <span>{directCount} Direct</span>
          </span>
        ) : (
          <span
            className="flex items-center gap-1 text-zinc-500 font-medium bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.05]"
            title="0 directly observed dependency connections"
            data-testid="summary-direct-dependencies-zero"
          >
            <ShieldCheck className="w-3 h-3 text-zinc-500" aria-hidden="true" />
            <span>0 Direct</span>
          </span>
        )}

        {/* Inferred Dependencies */}
        {safeInferred > 0 && (
          <span
            className="flex items-center gap-1 text-violet-300 font-medium bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20"
            title={`${safeInferred} inferred dependencies (generated via inference rules with provenance)`}
            data-testid="summary-inferred-dependencies"
          >
            <GitFork className="w-3 h-3 text-violet-400" aria-hidden="true" />
            <span>{safeInferred} Inferred</span>
          </span>
        )}

        {/* Unverified Co-Detections */}
        {safeCoDetection > 0 && (
          <span
            className="flex items-center gap-1 text-amber-400/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
            title={`${safeCoDetection} unverified co-detection associations (co-occurring without linkage proof)`}
            data-testid="summary-unverified-associations"
          >
            <Link2 className="w-3 h-3 text-amber-400/80" aria-hidden="true" />
            <span>{safeCoDetection} Unverified</span>
          </span>
        )}
      </div>
    </div>
  );
};
