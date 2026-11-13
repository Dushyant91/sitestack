import React, { useEffect, useState } from 'react';
import { X, Trash2, Clock, ExternalLink, Layers } from 'lucide-react';
import { ScanResult } from '../../engine/types';
import { getScanHistory, clearScanHistory } from '../../extension/storage/history';
import { formatRelativeTime } from '../utils/formatters';

interface HistoryModalProps {
  onClose: () => void;
  onSelectScan: (scan: ScanResult) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, onSelectScan }) => {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadHistory = async () => {
    setLoading(true);
    const items = await getScanHistory();
    setHistory(items);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    if (confirm('Clear all local scan history?')) {
      await clearScanHistory();
      setHistory([]);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#090a0f] flex flex-col animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <h2 className="text-xs font-bold text-white">Scan History</h2>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {history.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              onClick={handleClear}
              title="Clear all scan history"
              className="p-1 rounded text-zinc-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close history"
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-mono">
            Loading past scans...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 select-none">
            <Layers className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No Scan History Yet</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 max-w-[200px] mx-auto">
              Websites you inspect with SiteStack will be securely stored here.
            </p>
          </div>
        ) : (
          history.map((scan, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectScan(scan);
                onClose();
              }}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/50 hover:bg-zinc-900/60 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {scan.domain || scan.url}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400 font-mono">
                  <span>{formatRelativeTime(scan.timestamp)}</span>
                  <span>·</span>
                  <span className="text-indigo-400 font-medium">
                    {scan.stats.total} {scan.stats.total === 1 ? 'tech' : 'techs'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] font-mono shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {scan.stats.high} High
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-2 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500 font-mono shrink-0">
        <span>Stored locally in chrome.storage</span>
        <span>Max 50 domains (LRU)</span>
      </div>
    </div>
  );
};
