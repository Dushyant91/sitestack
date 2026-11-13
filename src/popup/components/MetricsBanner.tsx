import React from 'react';
import { ScanResult } from '../../engine/types';

interface MetricsBannerProps {
  stats: ScanResult['stats'];
  inferredCount: number;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats, inferredCount }) => {
  return (
    <div className="px-3.5 py-1.5 bg-black/40 border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400 text-[11px]">Stack:</span>
        <span className="font-bold font-mono text-[11px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-1.5 py-0.2 rounded">
          {stats.total} {stats.total === 1 ? 'Technology' : 'Technologies'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono">
        {stats.high > 0 && (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {stats.high} High
          </span>
        )}
        {stats.medium > 0 && (
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            {stats.medium} Med
          </span>
        )}
        {inferredCount > 0 && (
          <span className="flex items-center gap-1 text-violet-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
            {inferredCount} Inferred
          </span>
        )}
      </div>
    </div>
  );
};
