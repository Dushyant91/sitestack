/**
 * SiteStack Architecture Flow - Empty State Component
 * Location: src/popup/components/architecture/ArchitectureEmptyState.tsx
 */

import React from 'react';
import { Network, Search } from 'lucide-react';

interface ArchitectureEmptyStateProps {
  isSearchEmpty?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  message?: string;
}

export const ArchitectureEmptyState: React.FC<ArchitectureEmptyStateProps> = ({
  isSearchEmpty = false,
  searchQuery = '',
  onClearSearch,
  message,
}) => {
  if (isSearchEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
          <Search className="w-5 h-5 text-zinc-500" />
        </div>
        <h4 className="text-xs font-bold text-white mb-1">No Matching Technologies</h4>
        <p className="text-[11px] text-zinc-400 max-w-[240px] leading-relaxed mb-4">
          No technologies in this architecture graph match &ldquo;
          <span className="text-zinc-200 font-mono">{searchQuery}</span>&rdquo;.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-zinc-300 hover:text-white transition-colors border border-white/[0.08]"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
        <Network className="w-6 h-6" />
      </div>
      <h4 className="text-xs font-bold text-white mb-1">
        {message || 'No Architecture Flow Available'}
      </h4>
      <p className="text-[11px] text-zinc-400 max-w-[240px] leading-relaxed">
        Scan a webpage to discover framework dependencies, runtimes, platforms, and third-party integrations.
      </p>
    </div>
  );
};
