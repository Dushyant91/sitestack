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
    <div className="px-3 pt-2 pb-1 shrink-0">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search technologies, frameworks, tags..."
          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 transition-colors font-sans"
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 text-zinc-500 hover:text-zinc-300 p-0.5"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {query && (
        <div className="text-[10px] text-zinc-500 font-mono mt-1 px-1">
          Showing {resultCount} of {totalCount} detected
        </div>
      )}
    </div>
  );
};
