import React, { useState } from 'react';
import { Download, Check, FileJson, FileSpreadsheet, FileText, Network } from 'lucide-react';
import { ScanResult } from '../../engine/types';
import { exportToJson, exportToCsv } from '../utils/export';
import { generateStackReport } from '../../../packages/reports/src/generators/stack-report';
import { generateArchitectureSvg } from '../../../packages/reports/src/generators/architecture-report';
import { migrateToScanSnapshot } from '../../../packages/contracts/src/migration';
import { ScanSnapshot } from '../../../packages/contracts/src/types';

interface FooterActionsProps {
  scanResult: ScanResult | ScanSnapshot | null;
  disabled?: boolean;
}

export const FooterActions: React.FC<FooterActionsProps> = ({ scanResult, disabled = false }) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const handleExport = (format: 'json' | 'csv' | 'html' | 'svg') => {
    if (!scanResult) return;

    if (format === 'json') {
      exportToJson(scanResult as ScanResult);
      setCopiedFormat('json');
    } else if (format === 'csv') {
      exportToCsv(scanResult as ScanResult);
      setCopiedFormat('csv');
    } else if (format === 'html') {
      try {
        const snapshot =
          (scanResult as unknown as Record<string, unknown>).schemaVersion === '3.0.0'
            ? (scanResult as ScanSnapshot)
            : migrateToScanSnapshot(scanResult as ScanResult);

        const { html } = generateStackReport(snapshot);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sitestack_report_${snapshot.target.domain.replace(/[^a-z0-9]/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setCopiedFormat('html');
      } catch (err) {
        console.warn('Failed to export HTML report:', err);
      }
    } else if (format === 'svg') {
      try {
        const snapshot =
          (scanResult as unknown as Record<string, unknown>).schemaVersion === '3.0.0'
            ? (scanResult as ScanSnapshot)
            : migrateToScanSnapshot(scanResult as ScanResult);

        const svg = generateArchitectureSvg(snapshot);
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sitestack_topology_${snapshot.target.domain.replace(/[^a-z0-9]/g, '_')}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setCopiedFormat('svg');
      } catch (err) {
        console.warn('Failed to export Architecture SVG:', err);
      }
    }

    setTimeout(() => setCopiedFormat(null), 1500);
  };

  return (
    <footer className="px-3 py-1.5 bg-[#090a0f]/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-between text-xs shrink-0 select-none">
      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></span>
          <span>v1.1</span>
        </span>
        <a
          href="https://github.com/Dushyant91/sitestack/issues/new?title=Extension+Feedback&labels=feedback"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 transition-colors font-sans text-[9px] underline"
          title="Privately report an issue or suggest a feature on GitHub"
        >
          Feedback
        </a>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-400 mr-0.5 flex items-center gap-1">
          <Download className="w-2.5 h-2.5" />
          Export:
        </span>

        <button
          onClick={() => handleExport('json')}
          disabled={disabled || !scanResult}
          title="Download full scan result as formatted JSON"
          aria-label="Export JSON"
          className="min-h-[26px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all text-[10px] font-mono font-medium border border-white/[0.08] disabled:opacity-30 active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          {copiedFormat === 'json' ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <FileJson className="w-3 h-3 text-indigo-400" />
          )}
          <span>JSON</span>
        </button>

        <button
          onClick={() => handleExport('csv')}
          disabled={disabled || !scanResult}
          title="Download technology summary as CSV spreadsheet"
          aria-label="Export CSV"
          className="min-h-[26px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all text-[10px] font-mono font-medium border border-white/[0.08] disabled:opacity-30 active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          {copiedFormat === 'csv' ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
          )}
          <span>CSV</span>
        </button>

        <button
          onClick={() => handleExport('html')}
          disabled={disabled || !scanResult}
          title="Generate executive HTML stack report • Print to PDF (via browser print dialog)"
          aria-label="Export HTML report"
          className="min-h-[26px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all text-[10px] font-mono font-medium border border-white/[0.08] disabled:opacity-30 active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          {copiedFormat === 'html' ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <FileText className="w-3 h-3 text-amber-400" />
          )}
          <span>HTML</span>
        </button>

        <button
          onClick={() => handleExport('svg')}
          disabled={disabled || !scanResult}
          title="Export standalone Architecture Topology diagram (SVG)"
          aria-label="Export SVG topology"
          className="min-h-[26px] px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all text-[10px] font-mono font-medium border border-white/[0.08] disabled:opacity-30 active:scale-95 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          {copiedFormat === 'svg' ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Network className="w-3 h-3 text-violet-400" />
          )}
          <span>SVG</span>
        </button>
      </div>
    </footer>
  );
};
