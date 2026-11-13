import React, { useState } from 'react';
import { Download, Check, FileJson, FileSpreadsheet } from 'lucide-react';
import { ScanResult } from '../../engine/types';
import { exportToJson, exportToCsv } from '../utils/export';

interface FooterActionsProps {
  scanResult: ScanResult | null;
  disabled?: boolean;
}

export const FooterActions: React.FC<FooterActionsProps> = ({ scanResult, disabled = false }) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const handleExport = (format: 'json' | 'csv') => {
    if (!scanResult) return;

    if (format === 'json') {
      exportToJson(scanResult);
    } else {
      exportToCsv(scanResult);
    }

    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  return (
    <footer className="px-3.5 py-2.5 bg-black/50 border-t border-white/[0.08] flex items-center justify-between text-xs shrink-0 select-none">
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span>SiteStack v1.0 Core</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-500 mr-1 flex items-center gap-1">
          <Download className="w-2.5 h-2.5" />
          Export:
        </span>

        <button
          onClick={() => handleExport('json')}
          disabled={disabled || !scanResult}
          title="Download full scan result as formatted JSON"
          className="px-2 py-0.8 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-[10px] font-mono font-medium border border-zinc-700/50 disabled:opacity-40 flex items-center gap-1"
        >
          {copiedFormat === 'json' ? (
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          ) : (
            <FileJson className="w-2.5 h-2.5 text-indigo-400" />
          )}
          <span>JSON</span>
        </button>

        <button
          onClick={() => handleExport('csv')}
          disabled={disabled || !scanResult}
          title="Download technology summary as CSV spreadsheet"
          className="px-2 py-0.8 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all text-[10px] font-mono font-medium border border-zinc-700/50 disabled:opacity-40 flex items-center gap-1"
        >
          {copiedFormat === 'csv' ? (
            <Check className="w-2.5 h-2.5 text-emerald-400" />
          ) : (
            <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-400" />
          )}
          <span>CSV</span>
        </button>
      </div>
    </footer>
  );
};
