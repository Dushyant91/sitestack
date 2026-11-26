/**
 * SiteStack Public Web Platform — Categories & Architecture Ontology Explorer
 */

import { CatalogService } from '../catalog-service';
import { renderLayout, escapeHtml } from '../templates/layout';

export function renderCategoriesPage(): string {
  const service = new CatalogService();
  const categories = service.getCategories();
  const relationships = service.getAllRelationships();
  const totalTechs = service.getAllTechnologies().length;

  const categoryBlocks = categories.map((cat) => {
    const techsInCat = service.getTechnologiesByCategory(cat.category);
    const techPills = techsInCat.map((t) => `
      <a href="/technologies/${t.id}" class="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 transition border border-slate-200 dark:border-slate-700">
        ${escapeHtml(t.name)}
      </a>
    `).join('');

    return `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">${escapeHtml(cat.displayName)}</h3>
        <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-100 dark:border-indigo-800/60">
          ${cat.count} Technologies
        </span>
      </div>
      <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">${escapeHtml(cat.description)}</p>

      <div>
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 font-mono">Catalog Members:</div>
        <div class="flex flex-wrap gap-1.5">
          ${techPills}
        </div>
      </div>

      <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <a href="/catalog?category=${cat.category}" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
          Browse ${escapeHtml(cat.displayName)} Directory &rarr;
        </a>
      </div>
    </div>
    `;
  }).join('');

  const relationshipRows = relationships.map((rel) => `
    <tr class="relationship-row border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
        data-source="${escapeHtml(rel.sourceName.toLowerCase())}"
        data-target="${escapeHtml(rel.targetName.toLowerCase())}"
        data-type="${escapeHtml(rel.type.toLowerCase())}">
      <td class="py-3 px-4 text-xs font-bold text-slate-900 dark:text-white font-mono">
        <a href="/technologies/${rel.sourceId}" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">${escapeHtml(rel.sourceName)}</a>
      </td>
      <td class="py-3 px-4">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
          rel.type === 'depends_on'
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
            : rel.type === 'hosted_on'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
        }">
          ${escapeHtml(rel.type)}
        </span>
      </td>
      <td class="py-3 px-4 text-xs font-bold text-slate-900 dark:text-white font-mono">
        <a href="/technologies/${rel.targetId}" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">${escapeHtml(rel.targetName)}</a>
      </td>
      <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        ${escapeHtml(rel.description)}
      </td>
    </tr>
  `).join('');

  const bodyHtml = `
  <section class="py-12 bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Ontology &amp; Taxonomy
        </div>
        <h1 class="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">Architecture Layers &amp; Ontology</h1>
        <p class="text-slate-600 dark:text-slate-300 mt-3 text-base leading-relaxed">
          SiteStack organizes ${totalTechs} technologies into 8 functional layers and connects them via ${relationships.length} validated architectural dependency rules.
        </p>
      </div>
    </div>
  </section>

  <!-- 8 Functional Layers -->
  <section class="py-12 bg-white dark:bg-slate-950 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Functional Hierarchy</h2>
        <p class="text-2xl font-extrabold text-slate-900 dark:text-white">8 Web Stack Categories</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${categoryBlocks}
      </div>
    </div>
  </section>

  <!-- Architecture Ontology Relationships -->
  <section id="ontology" class="py-12 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Graph Connections</h2>
          <p class="text-2xl font-extrabold text-slate-900 dark:text-white">41 Architectural Graph Relationships</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified directional dependencies, runtime embeddings, and infrastructure host associations.</p>
        </div>

        <!-- Filter Box -->
        <div class="relative w-full md:w-72">
          <input type="text" id="ontology-search" placeholder="Filter relationships (e.g. React)..."
                 class="block w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors">
        </div>
      </div>

      <div class="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              <th class="py-3 px-4">Upstream / Source</th>
              <th class="py-3 px-4">Relationship</th>
              <th class="py-3 px-4">Target Dependency</th>
              <th class="py-3 px-4">Architectural Rationale</th>
            </tr>
          </thead>
          <tbody id="relationships-tbody">
            ${relationshipRows}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  `;

  const extraScripts = `
  <script>
    (function() {
      const search = document.getElementById('ontology-search');
      const rows = document.querySelectorAll('.relationship-row');

      if (search) {
        search.addEventListener('input', function(e) {
          const q = e.target.value.toLowerCase().trim();
          rows.forEach(function(row) {
            const src = row.dataset.source;
            const tgt = row.dataset.target;
            const type = row.dataset.type;

            if (!q || src.includes(q) || tgt.includes(q) || type.includes(q)) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          });
        });
      }
    })();
  </script>
  `;

  return renderLayout({
    title: 'Architecture Categories & Ontology (41 Relationships)',
    description: 'Explore the 8 functional categories and 41 verified architectural dependencies connecting modern frameworks, libraries, and hosting platforms.',
    currentPath: '/categories',
    bodyHtml,
    extraScripts,
  });
}
