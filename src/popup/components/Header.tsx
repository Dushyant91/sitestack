import React from 'react';
import { RefreshCw, History, ArrowLeft, Clock } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

interface HeaderProps {
  domain: string;
  isCached: boolean;
  timestamp?: number;
  isLoading: boolean;
  isHistoryMode?: boolean;
  onExitHistoryMode?: () => void;
  onRescan: () => void;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  domain,
  isCached,
  timestamp,
  isLoading,
  isHistoryMode = false,
  onExitHistoryMode,
  onRescan,
  onOpenHistory,
}) => {
  return (
    <header className="px-3.5 py-2.5 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-600/30 shrink-0">
          ⚡
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-xs tracking-tight">SiteStack</span>
            {isHistoryMode ? (
              <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-violet-950/40 text-violet-300 border border-violet-500/30 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5 text-violet-400" />
                History
              </span>
            ) : (
              <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                v1.0
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono truncate max-w-[170px]">
            <span className="truncate">{domain || 'Ready to scan'}</span>
            {(isCached || isHistoryMode) && timestamp && (
              <span className="text-[9px] text-zinc-500 shrink-0">
                ({formatRelativeTime(timestamp)})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isHistoryMode ? (
          <button
            onClick={onExitHistoryMode}
            title="Return to the active browser tab's live scan"
            className="px-2 py-1 rounded-md bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium border border-violet-500/30"
          >
            <ArrowLeft className="w-3 h-3 text-violet-400" />
            <span className="text-[11px]">Active Tab</span>
          </button>
        ) : (
          <button
            onClick={onRescan}
            disabled={isLoading}
            title="Force fresh rescan of website"
            className="px-2 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium border border-zinc-700/50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="text-[11px]">{isLoading ? 'Scanning' : 'Rescan'}</span>
          </button>
        )}

        <button
          onClick={onOpenHistory}
          title="View recent website scan history"
          className={`p-1 rounded-md transition-colors border ${
            isHistoryMode
              ? 'text-violet-300 bg-violet-500/15 border-violet-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-transparent hover:border-zinc-700/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
