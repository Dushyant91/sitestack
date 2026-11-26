/**
 * SiteStack Expansion v1 — Architecture Intelligence Report & SVG Generator
 *
 * Generates an architectural topology report with standalone, scalable
 * vector graphics (SVG) diagram depicting component hierarchy, relationships,
 * and data flows.
 */

import {
  ScanSnapshot,
  ReportModel,
  ReportRedactionConfig,
  ReportSection,
  ArchitectureRelationshipResult,
} from '../../../contracts/src/types';
import { redactSnapshot, DEFAULT_REDACTION_CONFIG } from '../redaction';

export interface GenerateArchitectureReportOptions {
  title?: string;
  author?: string;
  organization?: string;
  redaction?: Partial<ReportRedactionConfig>;
}

/**
 * Builds a standalone, valid SVG string representing the technology architecture graph.
 */
export function generateArchitectureSvg(snapshot: ScanSnapshot): string {
  const techs = snapshot.technologies;
  const relationships = snapshot.relationships || [];

  const width = 900;
  const height = Math.max(500, Math.ceil(techs.length / 3) * 140 + 160);

  // Group technologies by category
  const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    cms: { bg: '#FDF2F8', border: '#F472B6', text: '#9D174D' },
    framework: { bg: '#EFF6FF', border: '#60A5FA', text: '#1E40AF' },
    library: { bg: '#F5F3FF', border: '#A78BFA', text: '#5B21B6' },
    analytics: { bg: '#ECFDF5', border: '#34D399', text: '#065F46' },
    marketing: { bg: '#FFFBEB', border: '#FBBF24', text: '#92400E' },
    ecommerce: { bg: '#FEF2F2', border: '#F87171', text: '#991B1B' },
    payment: { bg: '#F0FDF4', border: '#4ADE80', text: '#166534' },
    infrastructure: { bg: '#F8FAFC', border: '#94A3B8', text: '#334155' },
  };

  // Node layout calculation (grid)
  const cols = 3;
  const colWidth = (width - 120) / cols;
  const rowHeight = 110;
  const startX = 60;
  const startY = 100;

  const nodePositions = new Map<string, { x: number; y: number; w: number; h: number }>();

  techs.forEach((t, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * colWidth;
    const y = startY + row * rowHeight;
    nodePositions.set(t.id, { x, y, w: colWidth - 30, h: 70 });
  });

  // Render edges
  let edgesSvg = '';
  relationships.forEach((rel) => {
    const source = nodePositions.get(rel.sourceId);
    const target = nodePositions.get(rel.targetId);
    if (source && target) {
      const x1 = source.x + source.w / 2;
      const y1 = source.y + source.h / 2;
      const x2 = target.x + target.w / 2;
      const y2 = target.y + target.h / 2;

      edgesSvg += `
        <g class="relationship-edge" opacity="0.75">
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6366F1" stroke-width="2" stroke-dasharray="4" marker-end="url(#arrow)" />
          <rect x="${(x1 + x2) / 2 - 40}" y="${(y1 + y2) / 2 - 10}" width="80" height="20" rx="4" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="1"/>
          <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 4}" fill="#4338CA" font-size="10" font-family="sans-serif" text-anchor="middle" font-weight="600">${escapeXml(rel.relationshipType)}</text>
        </g>
      `;
    }
  });

  // Render nodes
  let nodesSvg = '';
  techs.forEach((t) => {
    const pos = nodePositions.get(t.id);
    if (!pos) return;

    const colors = categoryColors[t.category] || { bg: '#F8FAFC', border: '#CBD5E1', text: '#334155' };
    const versionLabel = t.version ? `v${t.version}` : '';

    nodesSvg += `
      <g class="tech-node" transform="translate(${pos.x}, ${pos.y})">
        <rect width="${pos.w}" height="${pos.h}" rx="8" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1.5" filter="url(#drop-shadow)"/>
        <text x="14" y="26" font-family="sans-serif" font-size="13" font-weight="700" fill="${colors.text}">${escapeXml(t.name)}</text>
        ${versionLabel ? `<text x="${pos.w - 14}" y="26" font-family="monospace" font-size="11" fill="#64748B" text-anchor="end">${escapeXml(versionLabel)}</text>` : ''}
        <text x="14" y="46" font-family="sans-serif" font-size="10" text-transform="uppercase" letter-spacing="0.5" fill="#64748B">${escapeXml(t.category)}</text>
        <circle cx="${pos.w - 20}" cy="44" r="5" fill="${t.confidenceTier === 'high' ? '#10B981' : t.confidenceTier === 'medium' ? '#F59E0B' : '#94A3B8'}"/>
      </g>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <filter id="drop-shadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366F1" />
    </marker>
  </defs>

  <rect width="100%" height="100%" fill="#F8FAFC" rx="12"/>

  <!-- Title bar -->
  <g transform="translate(40, 45)">
    <text font-family="sans-serif" font-size="18" font-weight="800" fill="#0F172A">Architecture Topology: ${escapeXml(snapshot.target.domain)}</text>
    <text y="22" font-family="sans-serif" font-size="12" fill="#64748B">Detected components and functional dependencies</text>
  </g>

  <!-- Edges -->
  ${edgesSvg}

  <!-- Nodes -->
  ${nodesSvg}
</svg>`;
}

/**
 * Builds an Architecture Intelligence ReportModel and HTML presentation.
 */
export function generateArchitectureReport(
  rawSnapshot: ScanSnapshot,
  options: GenerateArchitectureReportOptions = {}
): { model: ReportModel; html: string; svg: string } {
  const redactionConfig: ReportRedactionConfig = {
    ...DEFAULT_REDACTION_CONFIG,
    ...options.redaction,
  };

  const snapshot = redactSnapshot(rawSnapshot, redactionConfig);
  const now = Date.now();
  const reportId = `rep_arch_${snapshot.target.domain.replace(/[^a-z0-9]/g, '_')}_${now}`;
  const title = options.title || `Architecture Intelligence Report — ${snapshot.target.displayName || snapshot.target.domain}`;

  const svg = generateArchitectureSvg(snapshot);

  const sections: ReportSection[] = [
    {
      id: 'sec_arch_summary',
      title: 'Architectural Hierarchy & Inferences',
      summary: `Discovered ${snapshot.relationships?.length || 0} architectural relationships between ${snapshot.technologies.length} components.`,
    },
    {
      id: 'sec_topology_graph',
      title: 'Topology Map',
      contentHtml: svg,
    },
  ];

  const model: ReportModel = {
    id: reportId,
    title,
    type: 'architecture_intelligence',
    generatedAt: now,
    author: options.author || 'SiteStack Architecture Intelligence',
    organization: options.organization || 'SiteStack',
    target: snapshot.target,
    snapshot,
    redactionConfig,
    sections,
  };

  const html = renderArchitectureReportHtml(model, svg);
  return { model, html, svg };
}

/**
 * Renders HTML view of Architecture Report with embedded SVG and relationships table.
 */
export function renderArchitectureReportHtml(report: ReportModel, svg: string): string {
  const snapshot = report.snapshot!;
  const relationships = snapshot.relationships || [];

  const relRows = relationships.map((rel: ArchitectureRelationshipResult) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td class="py-3 px-4 font-bold text-slate-900">${escapeXml(rel.sourceId)}</td>
      <td class="py-3 px-4">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          ${escapeXml(rel.relationshipType)}
        </span>
      </td>
      <td class="py-3 px-4 font-bold text-slate-900">${escapeXml(rel.targetId)}</td>
      <td class="py-3 px-4 text-xs text-slate-600">${escapeXml(rel.description)}</td>
      <td class="py-3 px-4 text-xs font-bold text-slate-700">${rel.confidence}%</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(report.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .no-print { display: none !important; }
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
            SiteStack Architecture Intelligence
          </div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">${escapeXml(report.title)}</h1>
          <p class="text-slate-300 text-sm mt-1">Domain: <span class="font-mono text-indigo-300">${escapeXml(report.target.domain)}</span></p>
        </div>
        <div class="no-print">
          <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition">
            Print / Save as PDF
          </button>
        </div>
      </div>
    </header>

    <!-- Topology Diagram Container -->
    <main class="p-6 md:p-8">
      <div class="mb-8">
        <h2 class="text-lg font-bold text-slate-900 mb-3">Architectural Topology Map</h2>
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner flex justify-center p-4">
          ${svg}
        </div>
      </div>

      <!-- Relationships Table -->
      <div class="mt-8">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Inter-Component Architectural Relationships</h2>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 font-semibold uppercase text-xs border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Source Component</th>
                <th class="py-3 px-4">Relationship</th>
                <th class="py-3 px-4">Target Component</th>
                <th class="py-3 px-4">Inference Description</th>
                <th class="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${relRows || '<tr><td colspan="5" class="py-6 text-center text-slate-400">No architecture relationships mapped.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-50 border-t border-slate-200 p-6 text-center text-xs text-slate-400">
      SiteStack Architecture Intelligence • Automatically synthesized from runtime and structural telemetry
    </footer>
  </div>
</body>
</html>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
