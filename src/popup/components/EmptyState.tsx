import React from 'react';
import { Layers, Search } from 'lucide-react';

interface EmptyStateProps {
  isSearchEmpty?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearchEmpty,
  searchQuery,
  onClearSearch,
}) => {
  if (isSearchEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
          <Search className="w-5 h-5 text-zinc-400" />
        </div>
        <h3 className="text-xs font-bold text-white">No Matching Technologies</h3>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-[220px] leading-relaxed">
          No detected technologies matched &quot;{searchQuery}&quot;.
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="mt-3.5 px-3 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-[11px] font-medium border border-white/[0.08] transition-all active:scale-95"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
        <Layers className="w-5 h-5 text-zinc-400" />
      </div>
      <h3 className="text-xs font-bold text-white">No Supported Technologies Detected</h3>
      <p className="text-[11px] text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
        No supported technologies were detected using the available browser-visible evidence.
      </p>
      <div className="mt-4 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] max-w-[280px]">
        <span className="text-[10px] text-zinc-500 font-mono block leading-relaxed">
          Scan completed successfully. Technologies outside SiteStack&apos;s 24 supported definitions, server-rendered stacks, or proprietary frameworks will not appear.
        </span>
      </div>
    </div>
  );
};
