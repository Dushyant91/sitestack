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
        <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-400 mb-2.5">
          <Search className="w-5 h-5 text-zinc-400" />
        </div>
        <h3 className="text-xs font-bold text-white">No Matching Technologies</h3>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-[220px]">
          No detected technologies matched &quot;{searchQuery}&quot;.
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="mt-3 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-400 mb-2.5">
        <Layers className="w-5 h-5 text-zinc-400" />
      </div>
      <h3 className="text-xs font-bold text-white">No Supported Technologies Detected</h3>
      <p className="text-[11px] text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
        No supported technologies were detected using the available browser-visible evidence.
      </p>
      <span className="mt-3 text-[10px] text-zinc-500 font-mono">
        Scan completed successfully. Unlisted technologies outside SiteStack&apos;s 24 supported definitions, server-rendered stacks, or proprietary frameworks will not appear.
      </span>
    </div>
  );
};
