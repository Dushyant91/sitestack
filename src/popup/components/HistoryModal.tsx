import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Clock,
  ExternalLink,
  Layers,
  Search,
  FileJson,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { ScanResult } from '../../engine/types';
import {
  getScanHistory,
  clearScanHistory,
  deleteScanFromHistory,
} from '../../extension/storage/history';
import {
  exportMultiScanToJson,
  exportMultiScanToCsv,
} from '../utils/export';
import { formatRelativeTime } from '../utils/formatters';

interface HistoryModalProps {
  onClose: () => void;
  onSelectScan: (scan: ScanResult) => void;
  onHistoryModified?: (deletedId?: string | number, isAllCleared?: boolean) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  onClose,
  onSelectScan,
  onHistoryModified,
}) => {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getScanHistory();
      setHistory(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access local scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Filter history by search query (matches domain, url, or detected technology names)
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase().trim();
    return history.filter(
      (scan) =>
        scan.domain.toLowerCase().includes(q) ||
        scan.url.toLowerCase().includes(q) ||
        scan.technologies.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [history, searchQuery]);

  // Handle individual delete
  const handleDeleteItem = async (e: React.MouseEvent, scan: ScanResult) => {
    e.stopPropagation();
    const idToDelete = scan.id || scan.timestamp;
    const success = await deleteScanFromHistory(idToDelete);
    if (success) {
      setHistory((prev) => prev.filter((s) => (s.id || s.timestamp) !== idToDelete));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(idToDelete));
        return next;
      });
      onHistoryModified?.(idToDelete, false);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    if (window.confirm('Clear all local scan history? This action cannot be undone.')) {
      await clearScanHistory();
      setHistory([]);
      setSelectedIds(new Set());
      onHistoryModified?.(undefined, true);
    }
  };

  // Handle toggle selection for batch export
  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredHistory.length && filteredHistory.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredHistory.map((s) => String(s.id || s.timestamp)));
      setSelectedIds(allIds);
    }
  };

  // Batch delete selected
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} selected scan${selectedIds.size === 1 ? '' : 's'} from history?`)) {
      for (const id of Array.from(selectedIds)) {
        await deleteScanFromHistory(id);
      }
      setHistory((prev) => prev.filter((s) => !selectedIds.has(String(s.id || s.timestamp))));
      setSelectedIds(new Set());
    }
  };

  // Batch export JSON
  const handleBatchExportJson = () => {
    const scansToExport = selectedIds.size > 0
      ? history.filter((s) => selectedIds.has(String(s.id || s.timestamp)))
      : history;

    if (scansToExport.length === 0) return;
    exportMultiScanToJson(scansToExport);
    setExportFeedback(`Exported ${scansToExport.length} scans (JSON)`);
    setTimeout(() => setExportFeedback(null), 2000);
  };

  // Batch export CSV
  const handleBatchExportCsv = () => {
    const scansToExport = selectedIds.size > 0
      ? history.filter((s) => selectedIds.has(String(s.id || s.timestamp)))
      : history;

    if (scansToExport.length === 0) return;
    exportMultiScanToCsv(scansToExport);
    setExportFeedback(`Exported ${scansToExport.length} scans (CSV)`);
    setTimeout(() => setExportFeedback(null), 2000);
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
              onClick={handleClearAll}
              title="Clear all scan history"
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close history"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Batch Actions Toolbar */}
      {history.length > 0 && (
        <div className="px-3 py-2 bg-zinc-950/60 border-b border-white/[0.05] space-y-2 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by domain or technology..."
              className="w-full pl-7 pr-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selection & Export Action Row */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              {selectedIds.size === filteredHistory.length && filteredHistory.length > 0 ? (
                <CheckSquare className="w-3 h-3 text-indigo-400" />
              ) : (
                <Square className="w-3 h-3 text-zinc-500" />
              )}
              <span>
                {selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select All'}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  title="Delete selected scans"
                  className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Delete</span>
                </button>
              )}

              <button
                onClick={handleBatchExportJson}
                title="Export selected or all scans as JSON"
                className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all flex items-center gap-1"
              >
                <FileJson className="w-2.5 h-2.5 text-indigo-400" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleBatchExportCsv}
                title="Export selected or all scans as CSV spreadsheet"
                className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all flex items-center gap-1"
              >
                <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {exportFeedback && (
            <div className="text-[10px] text-emerald-400 font-mono text-center animate-in fade-in duration-150">
              ✓ {exportFeedback}
            </div>
          )}
        </div>
      )}

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {loading ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-zinc-500 text-xs font-mono">Loading saved scans...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 select-none px-4 space-y-2">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
            <p className="text-xs text-zinc-300 font-medium">Storage Error</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{error}</p>
            <button
              onClick={loadHistory}
              className="mt-2 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono inline-flex items-center gap-1 border border-zinc-700/60"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 select-none px-4">
            <Layers className="w-7 h-7 text-zinc-600 mx-auto mb-2.5" />
            <p className="text-xs text-zinc-300 font-medium">No Scan History Yet</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
              Websites inspected with SiteStack are automatically preserved locally on this device.
            </p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 select-none">
            <p className="text-xs text-zinc-400 font-medium">No matching scans found</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Try searching a different domain or technology.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          filteredHistory.map((scan) => {
            const scanKey = String(scan.id || scan.timestamp);
            const isSelected = selectedIds.has(scanKey);

            return (
              <div
                key={scanKey}
                onClick={() => {
                  onSelectScan(scan);
                  onClose();
                }}
                className={`p-2.5 rounded-xl bg-white/[0.02] border transition-all cursor-pointer group flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-950/20'
                    : 'border-white/[0.06] hover:border-indigo-500/40 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {/* Row Checkbox for Batch Selection */}
                  <button
                    onClick={(e) => toggleSelect(e, scanKey)}
                    title={isSelected ? 'Deselect scan' : 'Select for export'}
                    className="shrink-0 p-0.5 text-zinc-500 hover:text-white transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {scan.domain || scan.url}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-mono">
                      <span>{formatRelativeTime(scan.timestamp)}</span>
                      <span>·</span>
                      <span className="text-indigo-300 font-medium">
                        {scan.stats.total} {scan.stats.total === 1 ? 'technology' : 'technologies'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 text-[9px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {scan.stats.high} High
                    </span>
                    {scan.stats.medium > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {scan.stats.medium} Med
                      </span>
                    )}
                  </div>

                  {/* Individual Delete Button */}
                  <button
                    onClick={(e) => handleDeleteItem(e, scan)}
                    title="Delete this scan from history"
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-2 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500 font-mono shrink-0">
        <span>Stored locally in chrome.storage</span>
        <span>Max 50 scans</span>
      </div>
    </div>
  );
};
