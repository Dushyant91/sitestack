/**
 * SiteStack Expansion v1 — Website Stack Report Generator
 *
 * Compiles a ScanSnapshot into an executive, publication-ready
 * Technology Stack Report conforming to ReportModel Schema v3.0.0.
 */

import {
  ScanSnapshot,
  ReportModel,
  ReportRedactionConfig,
  ReportSection,
} from '../../../contracts/src/types';
import { redactSnapshot, DEFAULT_REDACTION_CONFIG } from '../redaction';

export interface GenerateStackReportOptions {
  title?: string;
  author?: string;
  organization?: string;
  redaction?: Partial<ReportRedactionConfig>;
}

/**
 * Builds a ReportModel and HTML presentation for a website stack audit.
 */
export function generateStackReport(
  rawSnapshot: ScanSnapshot,
  options: GenerateStackReportOptions = {}
): { model: ReportModel; html: string } {
  const redactionConfig: ReportRedactionConfig = {
    ...DEFAULT_REDACTION_CONFIG,
    ...options.redaction,
  };

  const snapshot = redactSnapshot(rawSnapshot, redactionConfig);
  const now = Date.now();
  const reportId = `rep_stack_${snapshot.target.domain.replace(/[^a-z0-9]/g, '_')}_${now}`;
  const title = options.title || `Technology Stack Report — ${snapshot.target.displayName || snapshot.target.domain}`;

  // Categorize technologies
  const categoriesMap = new Map<string, typeof snapshot.technologies>();
  for (const tech of snapshot.technologies) {
    const list = categoriesMap.get(tech.category) || [];
    list.push(tech);
    categoriesMap.set(tech.category, list);
  }

  const sections: ReportSection[] = [
    {
      id: 'sec_summary',
      title: 'Executive Summary',
      summary: `Identified ${snapshot.stats.total} total technologies on ${snapshot.target.domain} (${snapshot.stats.high} High confidence, ${snapshot.stats.medium} Medium confidence, ${snapshot.stats.inferred} Inferred architectural relationships).`,
    },
    {
      id: 'sec_technologies',
      title: 'Technology Inventory',
      summary: `Categorized across ${categoriesMap.size} distinct functional layers.`,
    },
  ];

  const model: ReportModel = {
    id: reportId,
    title,
    type: 'website_stack',
    generatedAt: now,
    author: options.author || 'SiteStack Automated Intelligence',
    organization: options.organization || 'SiteStack',
    target: snapshot.target,
    snapshot,
    redactionConfig,
    sections,
  };

  const html = renderStackReportHtml(model);
  return { model, html };
}

/**
 * Renders publication-ready HTML with responsive layout and PDF print styles.
 */
export function renderStackReportHtml(report: ReportModel): string {
  const snapshot = report.snapshot!;
  const target = report.target;

  // Render technology categories
  const categoriesMap = new Map<string, typeof snapshot.technologies>();
  for (const tech of snapshot.technologies) {
    const list = categoriesMap.get(tech.category) || [];
    list.push(tech);
    categoriesMap.set(tech.category, list);
  }

  let categoriesHtml = '';
  for (const [category, techs] of Array.from(categoriesMap.entries()).sort()) {
    const techCards = techs.map((t) => {
      const tierBadge =
        t.confidenceTier === 'high'
          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
          : t.confidenceTier === 'medium'
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-700 border-slate-200';

      const evidenceItems = t.evidence
        .map(
          (ev) => `
            <div class="text-xs text-slate-600 bg-slate-50 rounded p-2 border border-slate-100 font-mono break-all">
              <span class="font-semibold text-slate-800 uppercase text-[10px] tracking-wider px-1 py-0.5 rounded bg-slate-200 mr-1.5">${escapeHtml(ev.type)}</span>
              ${escapeHtml(ev.source)}
              ${ev.matchedValue ? `<span class="text-indigo-600 font-bold ml-1">→ ${escapeHtml(ev.matchedValue)}</span>` : ''}
            </div>
          `
        )
        .join('');

      return `
        <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div>
              <h4 class="font-bold text-slate-900 text-base flex items-center gap-2">
                ${escapeHtml(t.name)}
                ${t.version ? `<span class="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">v${escapeHtml(t.version)}</span>` : ''}
              </h4>
              <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(t.description || '')}</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${tierBadge}">
              ${t.confidenceTier} • ${t.confidenceScore}%
            </span>
          </div>

          <div class="text-xs text-slate-500 mb-2 italic">
            ${escapeHtml(t.confidenceReason || '')}
          </div>

          ${t.evidence.length > 0 ? `
            <div class="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detection Signals (${t.evidence.length})</div>
              ${evidenceItems}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    categoriesHtml += `
      <section class="mb-8">
        <h3 class="text-base font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          ${escapeHtml(category)} <span class="text-xs font-normal text-slate-500">(${techs.length})</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${techCards}
        </div>
      </section>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(report.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: #fff !important; color: #000 !important; font-size: 12pt; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .shadow-sm, .shadow { box-shadow: none !important; }
      .border { border-color: #e2e8f0 !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen font-sans antialiased p-6 md:p-12">
  <div class="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <!-- Header -->
    <header class="bg-slate-900 text-white p-6 md:p-8">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-medium uppercase tracking-wider mb-2">
            SiteStack Technology Stack Report
          </div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">${escapeHtml(report.title)}</h1>
          <p class="text-slate-300 text-sm mt-1">
            Target: <a href="${escapeHtml(target.canonicalUrl)}" class="text-indigo-300 underline font-mono">${escapeHtml(target.domain)}</a>
          </p>
        </div>
        <div class="no-print">
          <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition">
            Print / Save as PDF
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
        <div class="bg-white/5 rounded-lg p-3">
          <div class="text-xs text-slate-400">Total Tech</div>
          <div class="text-xl font-bold text-white">${snapshot.stats.total}</div>
        </div>
        <div class="bg-white/5 rounded-lg p-3">
          <div class="text-xs text-slate-400">High Confidence</div>
          <div class="text-xl font-bold text-emerald-400">${snapshot.stats.high}</div>
        </div>
        <div class="bg-white/5 rounded-lg p-3">
          <div class="text-xs text-slate-400">Medium Confidence</div>
          <div class="text-xl font-bold text-amber-300">${snapshot.stats.medium}</div>
        </div>
        <div class="bg-white/5 rounded-lg p-3">
          <div class="text-xs text-slate-400">Low Confidence</div>
          <div class="text-xl font-bold text-slate-400">${snapshot.stats.low}</div>
        </div>
        <div class="bg-white/5 rounded-lg p-3">
          <div class="text-xs text-slate-400">Inferred Architecture</div>
          <div class="text-xl font-bold text-indigo-300">${snapshot.stats.inferred}</div>
        </div>
      </div>
    </header>

    <!-- Meta details -->
    <div class="bg-slate-100 border-b border-slate-200 px-6 md:px-8 py-3 text-xs text-slate-600 flex flex-wrap justify-between gap-2">
      <div><strong>Generated:</strong> ${new Date(report.generatedAt).toUTCString()}</div>
      <div><strong>Engine Duration:</strong> ${snapshot.timing.engineDurationMs}ms</div>
      <div><strong>Author:</strong> ${escapeHtml(report.author || 'SiteStack')}</div>
      <div><strong>Report ID:</strong> <span class="font-mono">${escapeHtml(report.id)}</span></div>
    </div>

    <!-- Content Sections -->
    <main class="p-6 md:p-8">
      <div class="mb-8">
        <h2 class="text-lg font-bold text-slate-900 mb-2">Executive Summary</h2>
        <p class="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
          This report documents the client-side, runtime, and architectural technologies detected on
          <strong class="text-slate-900">${escapeHtml(target.domain)}</strong>.
          SiteStack evaluated DOM elements, runtime JavaScript execution namespaces, resource scripts, and HTTP response headers.
          No uncorroborated single-signal detections are classified as High confidence.
        </p>
      </div>

      <div class="border-t border-slate-200 pt-6">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Detected Technology Layers</h2>
        ${categoriesHtml || '<p class="text-slate-500 italic">No technologies detected.</p>'}
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-50 border-t border-slate-200 p-6 text-center text-xs text-slate-400">
      Report generated by SiteStack Technology Intelligence Engine • Local-first privacy guaranteed
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
