/**
 * SiteStack Public Web Platform — Landing Page
 */

import { CatalogService } from '../catalog-service';
import { renderLayout, escapeHtml } from '../templates/layout';
import { renderDemoWidgetHtml, renderDemoScript } from '../demo/demo-widget';

export function renderLandingPage(): string {
  const catalog = new CatalogService();
  const techCount = catalog.getAllTechnologies().length;
  const relationshipCount = catalog.getAllRelationships().length;
  const categories = catalog.getCategories();

  const categoryCards = categories.map((cat) => `
    <a href="/catalog?category=${cat.category}" class="block p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg transition-all group">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-base">${escapeHtml(cat.displayName)}</h3>
        <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-100 dark:border-indigo-800/60">${cat.count}</span>
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${escapeHtml(cat.description)}</p>
      <div class="mt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
        Explore Category &rarr;
      </div>
    </a>
  `).join('');

  const bodyHtml = `
  <!-- Hero Section -->
  <section class="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
        <span class="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 animate-pulse"></span>
        Local-First Website Intelligence • Zero Telemetry
      </div>

      <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
        Know what is powering <br class="hidden sm:inline" />
        <span class="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 dark:from-indigo-400 dark:via-indigo-300 dark:to-indigo-200 bg-clip-text text-transparent">any website</span> with precision.
      </h1>

      <p class="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
        SiteStack inspects DOM hierarchy, runtime globals, script assets, and HTTP headers inside your browser. Multi-signal corroboration. No guessing, no tracking.
      </p>

      <div class="mt-10 flex flex-wrap justify-center items-center gap-4">
        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" class="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2 text-sm sm:text-base">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
            <line x1="21.17" y1="8" x2="12" y2="8"/>
            <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
            <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
          </svg>
          Add to Chrome — Free
        </a>
        <a href="#demo" class="px-7 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-all text-sm sm:text-base flex items-center gap-2">
          <span>Explore Live Demo</span>
          <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </a>
        <a href="/catalog" class="px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-sm transition-colors">
          Browse ${techCount} Technologies &rarr;
        </a>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="mt-16 pt-10 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left max-w-5xl mx-auto">
        <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Catalog Depth</div>
          <div class="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">${techCount} Technologies</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Across 8 functional layers</div>
        </div>
        <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Architecture Graph</div>
          <div class="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">${relationshipCount} Relationships</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Strict acyclic dependency graph</div>
        </div>
        <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Privacy Model</div>
          <div class="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">Zero Telemetry</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Runs 100% in your local browser</div>
        </div>
        <div class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm min-w-0">
          <div class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Evidence Standard</div>
          <div class="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">Multi-Signal</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Runtime proof required for High tier</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive SiteStack Product Demo -->
  ${renderDemoWidgetHtml()}

  <!-- Feature Pillars -->
  <section class="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">Disciplined Engineering</h2>
        <p class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Four pillars of authentic technology detection</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-4">
            01
          </div>
          <h3 class="font-extrabold text-slate-900 dark:text-white text-lg mb-2">Multi-Signal Corroboration</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Never trusts a single CSS class or meta tag. Requires converging proof across DOM selectors, window variables, script filenames, and response headers.
          </p>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-4">
            02
          </div>
          <h3 class="font-extrabold text-slate-900 dark:text-white text-lg mb-2">Architecture Ontology</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Encodes 41 verified architectural relationships. SiteStack understands that Next.js depends on React and Nuxt requires Vue, establishing logical stack cohesion.
          </p>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold mb-4">
            03
          </div>
          <h3 class="font-extrabold text-slate-900 dark:text-white text-lg mb-2">Zero-Telemetry Privacy</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Zero external servers. No remote cloud scrapers. Your browsing stays 100% private in your browser with standard Chrome Extension permissions.
          </p>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mb-4">
            04
          </div>
          <h3 class="font-extrabold text-slate-900 dark:text-white text-lg mb-2">Stack History &amp; Diff</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Preserve scan snapshots locally, organize sites in Research Collections, compare stacks side-by-side, and export professional PDF/HTML reports.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Categories Explorer -->
  <section class="py-16 md:py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">Functional Taxonomy</h2>
          <p class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">8 Technology Categories</p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Structured classification covering every layer of modern web infrastructure.</p>
        </div>
        <a href="/catalog" class="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
          View all ${techCount} technologies &rarr;
        </a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${categoryCards}
      </div>
    </div>
  </section>

  <!-- Installation CTA -->
  <section class="py-20 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <h2 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
        Ready to see what is under the hood?
      </h2>
      <p class="mt-5 text-base sm:text-lg text-indigo-200 max-w-2xl mx-auto leading-relaxed">
        Install the lightweight SiteStack Chrome extension. Open any website and discover its complete technology stack in milliseconds.
      </p>

      <div class="mt-8 flex flex-wrap justify-center items-center gap-4">
        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" class="px-8 py-4 bg-white hover:bg-slate-100 text-indigo-900 font-extrabold rounded-xl shadow-xl transition-all transform active:scale-95 text-base flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
            <line x1="21.17" y1="8" x2="12" y2="8"/>
            <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
            <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
          </svg>
          Add to Chrome — Free v1.1.2
        </a>
        <a href="/catalog" class="px-8 py-4 bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold rounded-xl border border-indigo-600/60 transition-all text-base">
          Explore Catalog Directory
        </a>
      </div>

      <div class="mt-8 text-xs text-indigo-300 font-medium">
        Requires Chrome 88+ • Manifest V3 • Zero Cloud Transmission
      </div>
    </div>
  </section>
  `;

  const extraScripts = `
  ${renderDemoScript()}
  `;

  return renderLayout({
    title: 'SiteStack — Website Technology Intelligence Engine',
    description: 'Discover the exact frameworks, libraries, CMS, analytics, and infrastructure powering any website with multi-signal precision and zero telemetry.',
    currentPath: '/',
    bodyHtml,
    extraScripts,
  });
}
