/**
 * SiteStack Public Web Platform — Technology Detail Page
 */

import { CatalogService } from '../catalog-service';
import { renderLayout, escapeHtml } from '../templates/layout';

const SIGNAL_LABEL_MAP: Record<string, string> = {
  dom_selector: 'DOM',
  dom_attribute: 'DOM Attribute',
  custom_element: 'Custom Element',
  global: 'Window',
  resource_url: 'Script',
  css_property: 'CSS',
  html_signature: 'Markup',
  header: 'Header',
  meta: 'Meta',
};

export function renderTechnologyDetailPage(techId: string): string {
  const service = new CatalogService();
  const tech = service.getTechnologyById(techId);

  if (!tech) {
    const notFoundHtml = `
    <section class="py-20 bg-white dark:bg-slate-950">
      <div class="max-w-2xl mx-auto px-4 text-center">
        <div class="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 font-mono font-bold text-xl">
          404
        </div>
        <h1 class="text-3xl font-black text-slate-950 dark:text-white mb-2">Technology Not Found</h1>
        <p class="text-slate-600 dark:text-slate-400 text-sm mb-6">No canonical definition exists in the SiteStack catalog for ID: <code class="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-400">${escapeHtml(techId)}</code>.</p>
        <a href="/catalog" class="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 transition">
          Return to Technology Catalog
        </a>
      </div>
    </section>
    `;

    return renderLayout({
      title: 'Technology Not Found',
      description: 'The requested technology definition could not be found.',
      currentPath: `/technologies/${techId}`,
      bodyHtml: notFoundHtml,
    });
  }

  // Dependencies HTML
  const dependenciesHtml = tech.relationships.dependencies.length > 0
    ? tech.relationships.dependencies.map((dep) => `
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
        <div class="flex items-center justify-between mb-1.5">
          <a href="/technologies/${dep.targetId}" class="font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-sm">
            ${escapeHtml(dep.targetId)}
          </a>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold uppercase tracking-wider">
            ${escapeHtml(dep.type)}
          </span>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${escapeHtml(dep.description)}</p>
      </div>
    `).join('')
    : '<div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 italic">No hard upstream dependencies declared in ontology.</div>';

  // Dependents HTML
  const dependentsHtml = tech.relationships.dependents.length > 0
    ? tech.relationships.dependents.map((dep) => `
      <div class="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
        <div class="flex items-center justify-between mb-1.5">
          <a href="/technologies/${dep.sourceId}" class="font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-sm">
            ${escapeHtml(dep.sourceId)}
          </a>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold uppercase tracking-wider">
            ${escapeHtml(dep.type)}
          </span>
        </div>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${escapeHtml(dep.description)}</p>
      </div>
    `).join('')
    : '<div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 italic">No declared downstream dependents in current catalog.</div>';

  // Signal badges
  const signalTypesHtml = tech.supportedSignalTypes.map((st) => `
    <span class="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
      ${escapeHtml(SIGNAL_LABEL_MAP[st.toLowerCase()] || st.toUpperCase())}
    </span>
  `).join('');

  // Semantic roles
  const rolesHtml = tech.semanticRoles.length > 0
    ? tech.semanticRoles.map((role) => `
      <span class="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        ${escapeHtml(role)}
      </span>
    `).join('')
    : '<span class="text-xs text-slate-400 dark:text-slate-500 italic">Default role</span>';

  const bodyHtml = `
  <!-- Breadcrumb -->
  <div class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
      <a href="/" class="hover:text-indigo-600 dark:hover:text-indigo-400">Home</a>
      <span>&rsaquo;</span>
      <a href="/catalog" class="hover:text-indigo-600 dark:hover:text-indigo-400">Catalog</a>
      <span>&rsaquo;</span>
      <a href="/catalog?category=${tech.category}" class="capitalize hover:text-indigo-600 dark:hover:text-indigo-400">${escapeHtml(tech.category)}</a>
      <span>&rsaquo;</span>
      <span class="font-bold text-slate-900 dark:text-white font-mono">${escapeHtml(tech.name)}</span>
    </div>
  </div>

  <!-- Hero Header -->
  <section class="py-12 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono">
              ${escapeHtml(tech.category)}
            </span>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-mono">${tech.fingerprintCount} verified fingerprints</span>
          </div>
          <h1 class="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">${escapeHtml(tech.name)}</h1>
          <p class="text-slate-600 dark:text-slate-300 mt-3 text-base sm:text-lg max-w-3xl leading-relaxed">
            ${escapeHtml(tech.description)}
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <a href="${escapeHtml(tech.website)}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-sm transition">
            <span>Official Website</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
          <a href="/catalog" class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition">
            &larr; Back to Catalog
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Technical Dossier Details -->
  <section class="py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      <!-- Grid 1: Verification Metadata & Signal Channels -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-mono">Canonical Identity</h2>
          <div class="font-mono text-sm text-slate-900 dark:text-white font-bold mb-1">${escapeHtml(tech.id)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Canonical key used across engine, schema v3, and API outputs.</div>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-mono">Detection Standard</h2>
          <div class="font-mono text-sm text-slate-900 dark:text-white font-bold mb-1">Multi-Signal Corroboration</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Evaluates independently across MAIN and ISOLATED browser contexts.</div>
        </div>

        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-mono">Semantic Role</h2>
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${rolesHtml}
          </div>
        </div>
      </div>

      <!-- Supported Signal Types -->
      <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 class="text-sm font-extrabold text-slate-900 dark:text-white mb-2">Supported Signal Channels</h2>
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-4">SiteStack collects evidence across multiple runtime signal channels to confirm this technology:</p>
        <div class="flex flex-wrap gap-2">
          ${signalTypesHtml}
        </div>
      </div>

      <!-- Architecture Relationships Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Upstream Dependencies -->
        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white">Upstream Dependencies &amp; Integrations</h2>
            <span class="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">${tech.relationships.dependencies.length} declared</span>
          </div>
          <div class="space-y-3">
            ${dependenciesHtml}
          </div>
        </div>

        <!-- Downstream Dependents -->
        <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white">Downstream Dependents</h2>
            <span class="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">${tech.relationships.dependents.length} declared</span>
          </div>
          <div class="space-y-3">
            ${dependentsHtml}
          </div>
        </div>
      </div>

      <!-- JSON Definition Drawer -->
      <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 class="text-sm font-extrabold text-slate-900 dark:text-white mb-2">Canonical Declarative Schema</h2>
        <p class="text-xs text-slate-600 dark:text-slate-400 mb-4">Read-only view of the canonical schema definition in the SiteStack engine:</p>
        <pre class="bg-slate-900 dark:bg-slate-950 text-indigo-300 dark:text-indigo-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">${escapeHtml(JSON.stringify(tech, null, 2))}</pre>
      </div>
    </div>
  </section>
  `;

  // Structured Data (JSON-LD) for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tech.name,
    applicationCategory: tech.category,
    description: tech.description,
    url: tech.website,
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return renderLayout({
    title: `${tech.name} — Website Technology Intelligence`,
    description: `Detection rules, supported runtime signal channels, and architectural dependency mapping for ${tech.name} in SiteStack.`,
    currentPath: `/technologies/${tech.id}`,
    bodyHtml,
    jsonLd,
  });
}
