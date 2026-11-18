import React from 'react';
import { ScanResult } from '../../engine/types';

interface MetricsBannerProps {
  stats: ScanResult['stats'];
  inferredCount: number;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats, inferredCount }) => {
  return (
    <div className="px-3.5 py-1.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0 select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400 text-[11px] font-medium">Stack:</span>
        <span className="font-semibold font-mono text-[11px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded">
          {stats.total} {stats.total === 1 ? 'Technology' : 'Technologies'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono">
        {stats.high > 0 && (
          <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"></span>
            {stats.high} High
          </span>
        )}
        {stats.medium > 0 && (
          <span className="flex items-center gap-1 text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"></span>
            {stats.medium} Med
          </span>
        )}
        {inferredCount > 0 && (
          <span className="flex items-center gap-1 text-violet-300 font-medium bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.5)]"></span>
            {inferredCount} Inferred
          </span>
        )}
      </div>
    </div>
  );
};
