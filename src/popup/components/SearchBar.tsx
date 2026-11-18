import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChange,
  resultCount,
  totalCount,
}) => {
  return (
    <div className="px-3 pt-2 pb-1 shrink-0 select-none">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search technologies, frameworks, categories..."
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/70 focus:bg-white/[0.06] transition-all"
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 text-zinc-400 hover:text-zinc-200 p-0.5 rounded transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {query && (
        <div className="text-[10px] text-zinc-400 font-mono mt-1.5 px-1 flex items-center justify-between">
          <span>Showing {resultCount} of {totalCount} detected</span>
          <button
            onClick={() => onChange('')}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
