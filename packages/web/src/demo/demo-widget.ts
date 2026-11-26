/**
 * SiteStack Interactive Product Demo — Widget Template & Reactive Controller
 *
 * Implements the complete end-to-end interactive demo experience:
 * 1. Sample Archetype Selector (SaaS, E-Commerce, Media, Docs)
 * 2. View Mode Switcher (Stack & Signals, Architecture Graph, Executive Report)
 * 3. Categorized Technology Stack with Evidence Signals
 * 4. Interactive Technology Dossier Panel
 * 5. Vector SVG Architecture Dependency Graph
 * 6. Valid downloadable sample JSON/SVG report artifacts
 * 7. Prominent Chrome Web Store installation CTA
 */

import { DEMO_ARCHETYPES } from './demo-data';
import { renderDemoGraphSvg } from './demo-graph-svg';
import { escapeHtml } from '../templates/layout';
import { SITESTACK_ICON_128_DATA_URI } from '../../../../src/shared/logo-assets';
import { CHROME_WEB_STORE_URL } from '../constants';

export function renderDemoWidgetHtml(): string {
  const initialArchetype = DEMO_ARCHETYPES[0];

  const archetypeTabsHtml = DEMO_ARCHETYPES.map((arch, i) => `
    <button
      type="button"
      class="demo-archetype-tab px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
        i === 0
          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
      }"
      data-archetype-id="${arch.id}"
      role="tab"
      aria-selected="${i === 0 ? 'true' : 'false'}"
    >
      ${escapeHtml(arch.name)}
    </button>
  `).join('');

  return `
  <!-- ======================================================================= -->
  <!-- SiteStack Interactive Product Demo Section                              -->
  <!-- ======================================================================= -->
  <section id="demo" class="py-16 md:py-24 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 transition-colors duration-200 scroll-mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto mb-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <span class="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0"></span>
          Simulated Product Demo • 100% Deterministic Local Data
        </div>
        <h2 class="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">
          Experience SiteStack in Action
        </h2>
        <p class="mt-3 text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
          Select a sample website below to see how SiteStack deconstructs multi-signal runtime evidence, establishes detection confidence, and maps architectural dependency graphs.
        </p>
      </div>

      <!-- Demo Interactive Cockpit Container -->
      <div class="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
        
        <!-- Simulated Browser Address Bar -->
        <div class="px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-400/80"></span>
            <span class="w-3 h-3 rounded-full bg-amber-400/80"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-400/80"></span>
            <div class="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
              <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span id="demo-browser-url" class="font-bold font-mono">${escapeHtml(initialArchetype.displayUrl)}</span>
            </div>
          </div>

          <!-- Status Indicator Pill -->
          <div class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Local Engine Simulated Scan
            </span>
          </div>
        </div>

        <!-- Archetype Selector & View Mode Switcher -->
        <div class="p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Archetype Tabs -->
          <div class="flex flex-wrap items-center gap-2" role="tablist" aria-label="Sample Website Archetypes">
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-mono mr-1">Sample Sites:</span>
            ${archetypeTabsHtml}
          </div>

          <!-- View Mode Toggle (Segmented Control) -->
          <div class="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 self-start lg:self-auto select-none" role="tablist" aria-label="Demo Views">
            <button
              type="button"
              class="demo-view-toggle px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-sans"
              data-view="stack"
              role="tab"
              aria-selected="true"
            >
              Stack &amp; Signals
            </button>
            <button
              type="button"
              class="demo-view-toggle px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-sans"
              data-view="graph"
              role="tab"
              aria-selected="false"
            >
              Architecture Graph
            </button>
            <button
              type="button"
              class="demo-view-toggle px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-sans"
              data-view="report"
              role="tab"
              aria-selected="false"
            >
              Executive Report
            </button>
          </div>
        </div>

        <!-- Active View Panels Container -->
        <div class="p-4 sm:p-6 lg:p-8">
          
          <!-- VIEW 1: Stack & Signals Explorer -->
          <div id="demo-view-stack" class="demo-view-panel block">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <!-- Left Column: Detected Technology Cards List (7 Cols) -->
              <div class="lg:col-span-7 space-y-3">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    Detected Technologies (<span id="demo-tech-count">${initialArchetype.technologies.length}</span>)
                  </h3>
                  <span class="text-xs text-slate-400 dark:text-slate-500 italic">Click any card to inspect signals</span>
                </div>
                <div id="demo-tech-cards-container" class="space-y-2.5">
                  <!-- Rendered dynamically by client controller -->
                </div>
              </div>

              <!-- Right Column: Technology Evidence Dossier (5 Cols) -->
              <div class="lg:col-span-5">
                <div class="sticky top-24 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div id="demo-dossier-content">
                    <!-- Rendered dynamically by client controller -->
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- VIEW 2: Architecture Graph Canvas -->
          <div id="demo-view-graph" class="demo-view-panel hidden">
            <div class="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 class="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Architectural Dependency Graph</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      TOPOLOGY
                    </span>
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Directional links representing validated architectural dependency relationships. Click a node to view evidence.
                  </p>
                </div>
                <!-- Legend -->
                <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Framework</span>
                  <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Library</span>
                  <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Infrastructure</span>
                </div>
              </div>

              <!-- Interactive SVG Graph Container -->
              <div id="demo-graph-svg-container" class="w-full overflow-x-auto rounded-xl bg-slate-50 dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800/60">
                ${renderDemoGraphSvg(initialArchetype)}
              </div>
            </div>
          </div>

          <!-- VIEW 3: Executive Intelligence Report Preview -->
          <div id="demo-view-report" class="demo-view-panel hidden">
            <div class="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-2">
                    EXECUTIVE AUDIT REPORT (PREVIEW)
                  </div>
                  <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white" id="demo-report-title">
                    Technology Intelligence Dossier
                  </h3>
                  <div class="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1" id="demo-report-meta">
                    Target: ${escapeHtml(initialArchetype.displayUrl)} • Generated locally
                  </div>
                </div>

                <!-- Export Sample Buttons -->
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="demo-download-json-btn"
                    class="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download JSON
                  </button>
                  <button
                    type="button"
                    id="demo-download-svg-btn"
                    class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Download SVG Graph
                  </button>
                </div>
              </div>

              <!-- Report Body -->
              <div class="space-y-6 text-sm text-slate-700 dark:text-slate-300">
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-2">Executive Summary</h4>
                  <p id="demo-report-summary" class="leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm">
                    ${escapeHtml(initialArchetype.executiveSummary)}
                  </p>
                </div>

                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-3">Verified Component Inventory</h4>
                  <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table class="w-full text-left text-xs">
                      <thead class="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-600 dark:text-slate-400">
                        <tr>
                          <th class="py-2.5 px-4">Technology</th>
                          <th class="py-2.5 px-4">Category</th>
                          <th class="py-2.5 px-4">Version</th>
                          <th class="py-2.5 px-4">Confidence Tier</th>
                          <th class="py-2.5 px-4">Detection Mode</th>
                        </tr>
                      </thead>
                      <tbody id="demo-report-table-body" class="divide-y divide-slate-200 dark:divide-slate-800">
                        <!-- Populated dynamically -->
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Governance & Safety Statement -->
                <div class="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs space-y-1">
                  <div class="font-bold text-indigo-900 dark:text-indigo-300 font-mono">SiteStack Privacy &amp; Evidence Guarantee</div>
                  <div class="text-slate-600 dark:text-slate-400">
                    Sample report demonstrated using local deterministic datasets. In live operation, SiteStack evaluates DOM hierarchy, global APIs, script tags, and headers 100% inside your local browser. Zero browsing data is ever transmitted to remote servers.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Conversion Action Banner Footer -->
        <div class="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              src="${SITESTACK_ICON_128_DATA_URI}"
              alt="SiteStack Official Logo"
              width="36"
              height="36"
              class="w-9 h-9 rounded-xl shadow shrink-0 object-contain"
            />
            <div>
              <div class="font-bold text-sm tracking-tight text-white">
                Inspect any website live with SiteStack
              </div>
              <div class="text-xs text-indigo-200/80">
                1-Click Inspection • Zero Telemetry • Real-Time Architecture Graphs
              </div>
            </div>
          </div>

          <a
            href="${CHROME_WEB_STORE_URL}"
            target="_blank"
            rel="noopener noreferrer"
            class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm transition-all transform active:scale-95 shrink-0"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="21.17" y1="8" x2="12" y2="8"/>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
            </svg>
            <span>Add to Chrome — Free</span>
          </a>
        </div>

      </div>
    </div>
  </section>
  `;
}

export function renderDemoScript(): string {
  const archetypesJson = JSON.stringify(DEMO_ARCHETYPES);

  return `
  <script>
    (function() {
      var archetypes = ${archetypesJson};
      var currentArchetype = archetypes[0];
      var selectedTechId = currentArchetype.technologies[0].id;
      var activeView = 'stack';

      var browserUrlEl = document.getElementById('demo-browser-url');
      var techCountEl = document.getElementById('demo-tech-count');
      var techCardsContainer = document.getElementById('demo-tech-cards-container');
      var dossierContentEl = document.getElementById('demo-dossier-content');
      var graphSvgContainer = document.getElementById('demo-graph-svg-container');
      var reportTitleEl = document.getElementById('demo-report-title');
      var reportMetaEl = document.getElementById('demo-report-meta');
      var reportSummaryEl = document.getElementById('demo-report-summary');
      var reportTableBodyEl = document.getElementById('demo-report-table-body');
      var downloadJsonBtn = document.getElementById('demo-download-json-btn');
      var downloadSvgBtn = document.getElementById('demo-download-svg-btn');

      function escapeText(str) {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function renderTechCards() {
        if (!techCardsContainer) return;
        techCardsContainer.innerHTML = currentArchetype.technologies.map(function(t) {
          var isSelected = t.id === selectedTechId;
          var cardBgClass = isSelected
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 shadow-sm'
            : 'bg-white dark:bg-slate-950 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

          return [
            '<div',
            '  class="demo-tech-card p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ' + cardBgClass + '"',
            '  data-tech-id="' + escapeText(t.id) + '"',
            '  role="button"',
            '  tabindex="0"',
            '  aria-pressed="' + (isSelected ? 'true' : 'false') + '"',
            '>',
            '  <div class="flex items-center gap-3 min-w-0">',
            '    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">',
            '      ' + escapeText(t.name.slice(0, 2).toUpperCase()),
            '    </div>',
            '    <div class="min-w-0">',
            '      <div class="flex items-center gap-2">',
            '        <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">' + escapeText(t.name) + '</span>',
            '        ' + (t.version ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">v' + escapeText(t.version) + '</span>' : ''),
            '        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60">' + escapeText(t.categoryLabel) + '</span>',
            '      </div>',
            '      <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">',
            '        ' + escapeText(t.signals[0] ? t.signals[0].label + ': ' + t.signals[0].source : t.summary),
            '      </div>',
            '    </div>',
            '  </div>',
            '  <div class="flex items-center gap-2 shrink-0">',
            '    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ' +
              (t.confidenceTier === 'High'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60') +
            '    ">',
            '      ' + escapeText(t.confidenceTier) + ' Tier',
            '    </span>',
            '  </div>',
            '</div>'
          ].join('');
        }).join('');

        // Attach card click handlers
        var cards = techCardsContainer.querySelectorAll('.demo-tech-card');
        cards.forEach(function(card) {
          card.addEventListener('click', function() {
            var id = this.getAttribute('data-tech-id');
            if (id) {
              selectedTechId = id;
              renderTechCards();
              renderDossier();
            }
          });
          card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              var id = this.getAttribute('data-tech-id');
              if (id) {
                selectedTechId = id;
                renderTechCards();
                renderDossier();
              }
            }
          });
        });
      }

      function renderDossier() {
        if (!dossierContentEl) return;
        var tech = currentArchetype.technologies.find(function(t) { return t.id === selectedTechId; }) || currentArchetype.technologies[0];
        if (!tech) return;

        var signalsHtml = tech.signals.map(function(s) {
          return [
            '<div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">',
            '  <div class="flex items-center justify-between text-[11px] font-mono font-bold">',
            '    <span class="text-indigo-600 dark:text-indigo-400 uppercase">' + escapeText(s.label) + '</span>',
            '    <span class="text-slate-400 dark:text-slate-500 text-[10px]">Verified Channel</span>',
            '  </div>',
            '  <div class="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 break-all select-all">',
            '    ' + escapeText(s.source),
            '  </div>',
            '  <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">',
            '    ' + escapeText(s.description),
            '  </div>',
            '</div>'
          ].join('');
        }).join('');

        var depsHtml = tech.dependencies.length > 0
          ? tech.dependencies.map(function(d) {
              return '<li class="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">' +
                '<span><strong class="font-semibold">' + escapeText(d.targetName) + '</strong> (' + escapeText(d.type.replace('_', ' ')) + ')</span>' +
                '<span class="text-[10px] font-mono text-slate-400">Prerequisite</span>' +
              '</li>';
            }).join('')
          : '<li class="text-xs text-slate-400 italic py-1">No declared upstream prerequisites.</li>';

        dossierContentEl.innerHTML = [
          '<div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">',
          '  <div>',
          '    <div class="flex flex-wrap items-center gap-2 mb-1">',
          '      <span class="text-xs font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">' + escapeText(tech.categoryLabel) + '</span>',
          '      ' + (tech.version ? '<span class="text-xs font-mono text-slate-400">v' + escapeText(tech.version) + '</span>' : ''),
          '      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">' + escapeText(tech.confidenceTier) + ' Tier: Multi-Signal Verified</span>',
          '    </div>',
          '    <h4 class="text-xl font-black text-slate-900 dark:text-white">' + escapeText(tech.name) + '</h4>',
          '    <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">' + escapeText(tech.summary) + '</p>',
          '  </div>',
          '  <a href="' + escapeText(tech.website) + '" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition shrink-0" title="Visit official site">',
          '    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>',
          '  </a>',
          '</div>',
          '<div>',
          '  <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-2">Corroborated Evidence Signals</h5>',
          '  <div class="space-y-2">' + signalsHtml + '</div>',
          '</div>',
          '<div class="pt-2 border-t border-slate-200 dark:border-slate-800">',
          '  <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-2">Architecture Dependencies</h5>',
          '  <ul class="space-y-1">' + depsHtml + '</ul>',
          '</div>',
          '<div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 text-[11px] text-slate-600 dark:text-slate-400 font-mono">',
          '  <div class="font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">Detection Rationale:</div>',
          '  <div>' + escapeText(tech.confidenceExplanation) + '</div>',
          '</div>'
        ].join('');
      }

      function renderReport() {
        if (!reportTitleEl || !reportMetaEl || !reportSummaryEl || !reportTableBodyEl) return;
        reportTitleEl.textContent = 'Technology Audit: ' + currentArchetype.name;
        reportMetaEl.textContent = 'Target: ' + currentArchetype.displayUrl + ' • Simulated Local Report';
        reportSummaryEl.textContent = currentArchetype.executiveSummary;

        reportTableBodyEl.innerHTML = currentArchetype.technologies.map(function(t) {
          return [
            '<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">',
            '  <td class="py-2.5 px-4 font-bold text-slate-900 dark:text-white font-mono">' + escapeText(t.name) + '</td>',
            '  <td class="py-2.5 px-4 text-slate-600 dark:text-slate-400 uppercase font-mono text-[11px]">' + escapeText(t.categoryLabel) + '</td>',
            '  <td class="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">' + (t.version ? 'v' + escapeText(t.version) : '<span class="text-slate-400 italic">undetected</span>') + '</td>',
            '  <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">' + escapeText(t.confidenceTier) + '</span></td>',
            '  <td class="py-2.5 px-4 text-slate-500 dark:text-slate-400 capitalize">' + escapeText(t.detectionType) + '</td>',
            '</tr>'
          ].join('');
        }).join('');
      }

      function updateArchetype(id) {
        var found = archetypes.find(function(a) { return a.id === id; });
        if (!found) return;
        currentArchetype = found;
        selectedTechId = currentArchetype.technologies[0].id;

        if (browserUrlEl) browserUrlEl.textContent = currentArchetype.displayUrl;
        if (techCountEl) techCountEl.textContent = String(currentArchetype.technologies.length);

        // Update tabs styling
        var tabs = document.querySelectorAll('.demo-archetype-tab');
        tabs.forEach(function(t) {
          var match = t.getAttribute('data-archetype-id') === id;
          t.setAttribute('aria-selected', match ? 'true' : 'false');
          if (match) {
            t.className = 'demo-archetype-tab px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30';
          } else {
            t.className = 'demo-archetype-tab px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300';
          }
        });

        renderTechCards();
        renderDossier();
        renderReport();
        renderGraphNodes();
      }

      function setView(view) {
        activeView = view;
        var panels = {
          stack: document.getElementById('demo-view-stack'),
          graph: document.getElementById('demo-view-graph'),
          report: document.getElementById('demo-view-report')
        };

        Object.keys(panels).forEach(function(k) {
          if (panels[k]) {
            if (k === view) {
              panels[k].classList.remove('hidden');
              panels[k].classList.add('block');
            } else {
              panels[k].classList.remove('block');
              panels[k].classList.add('hidden');
            }
          }
        });

        var toggles = document.querySelectorAll('.demo-view-toggle');
        toggles.forEach(function(btn) {
          var match = btn.getAttribute('data-view') === view;
          btn.setAttribute('aria-selected', match ? 'true' : 'false');
          if (match) {
            btn.className = 'demo-view-toggle px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-sans';
          } else {
            btn.className = 'demo-view-toggle px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-sans';
          }
        });
      }

      function renderGraphNodes() {
        // Re-attach listeners to graph nodes inside SVG
        if (!graphSvgContainer) return;
        var nodes = graphSvgContainer.querySelectorAll('.demo-graph-node');
        nodes.forEach(function(node) {
          node.addEventListener('click', function() {
            var techId = this.getAttribute('data-node-id');
            if (techId) {
              selectedTechId = techId;
              setView('stack');
              renderTechCards();
              renderDossier();
            }
          });
          node.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              var techId = this.getAttribute('data-node-id');
              if (techId) {
                selectedTechId = techId;
                setView('stack');
                renderTechCards();
                renderDossier();
              }
            }
          });
        });
      }

      // Download sample JSON
      if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', function() {
          var payload = {
            simulatedReport: true,
            demoNotice: 'SiteStack Simulated Product Demo Artifact — Canonical Sample Data',
            generatedAt: new Date().toISOString(),
            website: currentArchetype.displayUrl,
            technologies: currentArchetype.technologies,
            relationships: currentArchetype.relationships
          };
          var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'sitestack-demo-report-' + currentArchetype.id + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        });
      }

      // Download sample SVG graph
      if (downloadSvgBtn) {
        downloadSvgBtn.addEventListener('click', function() {
          if (!graphSvgContainer) return;
          var svgEl = graphSvgContainer.querySelector('svg');
          if (!svgEl) return;
          var svgData = '<?xml version="1.0" encoding="UTF-8"?>\\n<!-- SiteStack Simulated Demo Architecture Graph -->\\n' + svgEl.outerHTML;
          var blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'sitestack-demo-graph-' + currentArchetype.id + '.svg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        });
      }

      // Initialize Tabs Listeners
      var archTabs = document.querySelectorAll('.demo-archetype-tab');
      archTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var id = this.getAttribute('data-archetype-id');
          if (id) updateArchetype(id);
        });
      });

      var viewToggles = document.querySelectorAll('.demo-view-toggle');
      viewToggles.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var view = this.getAttribute('data-view');
          if (view) setView(view);
        });
      });

      // Initial Mount
      renderTechCards();
      renderDossier();
      renderReport();
      renderGraphNodes();
    })();
  </script>
  `;
}
