import React from 'react';
import { Layers, Search, ExternalLink, HelpCircle, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  isSearchEmpty?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  onRescan?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearchEmpty,
  searchQuery,
  onClearSearch,
  onRescan,
}) => {
  if (isSearchEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
          <Search className="w-5 h-5 text-zinc-400" />
        </div>
        <h3 className="text-xs font-bold text-white">No Matching Technologies</h3>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
          No detected technologies on this page matched &quot;{searchQuery}&quot;.
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="mt-3.5 min-h-[30px] px-3.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 text-[11px] font-medium border border-white/[0.08] transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            Clear Search Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none space-y-3">
      <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 shadow-inner">
        <Layers className="w-5 h-5 text-zinc-400" />
      </div>

      <div>
        <h3 className="text-xs font-bold text-white">No Supported Technologies Detected</h3>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-[270px] leading-relaxed">
          SiteStack scanned the active DOM, runtime globals, and network assets, but no technologies in the verified 80-technology catalog were confirmed.
        </p>
      </div>

      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] max-w-[290px] text-left space-y-1">
        <span className="text-[10px] text-zinc-300 font-semibold flex items-center gap-1 font-sans">
          <HelpCircle className="w-3 h-3 text-indigo-400" />
          Common Explanations:
        </span>
        <ul className="text-[10px] text-zinc-400 font-mono space-y-0.5 list-disc list-inside">
          <li>Custom or proprietary backend architecture</li>
          <li>Vanilla HTML, CSS &amp; vanilla JavaScript</li>
          <li>Technology outside the current 80-rule catalog</li>
        </ul>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {onRescan && (
          <button
            onClick={onRescan}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium transition-colors"
          >
            Rescan
          </button>
        )}

        <a
          href="https://sitestack.pages.dev/catalog/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-indigo-300 hover:text-white border border-white/[0.08] text-[10px] font-medium transition-colors inline-flex items-center gap-1"
        >
          <span>Supported Catalog</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>

        <a
          href="https://github.com/Dushyant91/sitestack/issues/new?title=Suggest+Technology+for+Catalog&labels=catalog-expansion"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-medium transition-colors inline-flex items-center gap-1"
        >
          <span>Suggest Tech</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
