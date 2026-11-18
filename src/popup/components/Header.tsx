import React from 'react';
import { RefreshCw, History, ArrowLeft, Clock, Play } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';
import { SiteStackLogo } from './SiteStackLogo';

interface HeaderProps {
  domain: string;
  isCached: boolean;
  isScanned?: boolean;
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
  isScanned = false,
  timestamp,
  isLoading,
  isHistoryMode = false,
  onExitHistoryMode,
  onRescan,
  onOpenHistory,
}) => {
  return (
    <header className="px-3.5 py-2.5 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-2.5 min-w-0 mr-2 flex-1">
        <SiteStackLogo size={24} className="shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-xs tracking-tight">SiteStack</span>
            {isHistoryMode ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-violet-950/50 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-violet-400" />
                History
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                v1.1
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono truncate">
            <span className="truncate">
              {domain || (isScanned || isHistoryMode ? 'Website' : 'Ready to scan')}
            </span>
            {(isCached || isHistoryMode) && timestamp && (
              <span className="text-[9px] text-zinc-500 shrink-0">
                ({formatRelativeTime(timestamp)})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isHistoryMode ? (
          <button
            onClick={onExitHistoryMode}
            title="Return to the active browser tab's live scan"
            className="px-2.5 py-1 rounded-md bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium border border-violet-500/30 active:scale-95"
          >
            <ArrowLeft className="w-3 h-3 text-violet-400" />
            <span className="text-[11px]">Active Tab</span>
          </button>
        ) : !isScanned ? (
          <button
            onClick={onRescan}
            disabled={isLoading}
            title="Scan website"
            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 text-xs font-medium shadow-md shadow-indigo-600/25 active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="text-[11px]">{isLoading ? 'Scanning' : 'Scan'}</span>
          </button>
        ) : (
          <button
            onClick={onRescan}
            disabled={isLoading}
            title="Force fresh rescan of website"
            className="px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium border border-white/[0.08] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="text-[11px]">{isLoading ? 'Scanning' : 'Rescan'}</span>
          </button>
        )}

        <button
          onClick={onOpenHistory}
          title="View recent website scan history"
          className={`p-1.5 rounded-md transition-colors border ${
            isHistoryMode
              ? 'text-violet-300 bg-violet-500/15 border-violet-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border-transparent hover:border-white/[0.08]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
