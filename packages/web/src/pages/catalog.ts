/**
 * SiteStack Public Web Platform — Searchable Technology Catalog Directory
 */

import { CatalogService, TechCategory } from '../catalog-service';
import { renderLayout, escapeHtml } from '../templates/layout';

const CANONICAL_CATEGORY_LABELS: Record<TechCategory, string> = {
  framework: 'Frameworks',
  library: 'Libraries',
  cms: 'CMS',
  ecommerce: 'E-commerce',
  analytics: 'Analytics',
  marketing: 'Marketing',
  payment: 'Payments',
  infrastructure: 'Infrastructure',
};

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

export function renderCatalogPage(selectedCategory?: TechCategory, searchQuery?: string): string {
  const service = new CatalogService();
  const technologies = service.getAllTechnologies();
  const categories = service.getCategories();
  const totalCount = technologies.length;

  const categoryTabs = [
    { id: 'all', label: `All (${totalCount})`, active: !selectedCategory },
    ...categories.map((c) => ({
      id: c.category,
      label: `${CANONICAL_CATEGORY_LABELS[c.category] || c.displayName} (${c.count})`,
      active: selectedCategory === c.category,
    })),
  ].map((tab) => `
    <button type="button" class="category-filter-btn shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      tab.active
        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30 active-category'
        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }" data-category="${tab.id}">
      ${escapeHtml(tab.label)}
    </button>
  `).join('');

  const techCards = technologies.map((t) => {
    const signalBadges = t.supportedSignalTypes.map((st) => `
      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        ${escapeHtml(SIGNAL_LABEL_MAP[st.toLowerCase()] || st.toUpperCase())}
      </span>
    `).join('');

    return `
    <div class="tech-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between"
         data-id="${escapeHtml(t.id)}"
         data-name="${escapeHtml(t.name.toLowerCase())}"
         data-category="${escapeHtml(t.category)}"
         data-desc="${escapeHtml(t.description.toLowerCase())}">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100/80 dark:border-indigo-800/60 font-mono">
            ${escapeHtml(t.category)}
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">${t.fingerprintCount} signals</span>
        </div>
        <h3 class="font-extrabold text-lg text-slate-900 dark:text-white mb-1">
          <a href="/technologies/${t.id}" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">${escapeHtml(t.name)}</a>
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">${escapeHtml(t.description)}</p>

        <div class="flex flex-wrap gap-1 mb-4">
          ${signalBadges}
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <a href="${escapeHtml(t.website)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
          Official Site
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
        <a href="/technologies/${t.id}" class="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold flex items-center gap-1">
          View Detail &rarr;
        </a>
      </div>
    </div>
  `;
  }).join('');

  const bodyHtml = `
  <section class="py-12 bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
          Canonical Registry
        </div>
        <h1 class="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">Verified Technology Catalog</h1>
        <p class="text-slate-600 dark:text-slate-300 mt-3 text-base leading-relaxed">
          Explore all ${totalCount} software technologies verified by SiteStack. Filter by functional layer, inspect detection signals, and examine architectural dependencies.
        </p>
      </div>

      <!-- Search & Filter Controls -->
      <div class="mt-8 space-y-4">
        <!-- Search Input -->
        <div class="relative max-w-xl">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <input type="text" id="catalog-search" placeholder="Search technologies by name, keyword, or ID (e.g. React, Next.js, WordPress)..."
                 value="${searchQuery ? escapeHtml(searchQuery) : ''}"
                 class="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                 aria-label="Search technologies">
        </div>

        <!-- Category Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none" id="category-filter-container" role="toolbar" aria-label="Category filters">
          ${categoryTabs}
        </div>

        <!-- Results Counter -->
        <div class="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-2 font-mono">
          <span id="results-count" class="font-medium text-slate-700 dark:text-slate-200">Showing ${totalCount} of ${totalCount} verified technologies</span>
          <span class="text-slate-500 dark:text-slate-400">All rules verified client-side</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Catalog Grid -->
  <section class="py-12 bg-white dark:bg-slate-950 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${techCards}
      </div>

      <!-- Empty State -->
      <div id="catalog-empty-state" class="hidden text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 mt-4">
        <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">No technologies match your filter</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">Try adjusting your search query or selecting a different category layer.</p>
        <button type="button" id="reset-filters-btn" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 cursor-pointer">
          Reset All Filters
        </button>
      </div>
    </div>
  </section>
  `;

  const extraScripts = `
  <script>
    (function() {
      const searchInput = document.getElementById('catalog-search');
      const categoryButtons = document.querySelectorAll('.category-filter-btn');
      const cards = document.querySelectorAll('.tech-card');
      const countEl = document.getElementById('results-count');
      const emptyState = document.getElementById('catalog-empty-state');
      const resetBtn = document.getElementById('reset-filters-btn');

      let currentCategory = '${selectedCategory || 'all'}';
      let searchQuery = (searchInput.value || '').toLowerCase().trim();

      function filterCatalog() {
        let visibleCount = 0;
        cards.forEach(function(card) {
          const cardCat = card.dataset.category;
          const cardName = card.dataset.name;
          const cardId = card.dataset.id;
          const cardDesc = card.dataset.desc;

          const categoryMatches = (currentCategory === 'all' || cardCat === currentCategory);
          const searchMatches = !searchQuery ||
            cardName.includes(searchQuery) ||
            cardId.includes(searchQuery) ||
            cardDesc.includes(searchQuery);

          if (categoryMatches && searchMatches) {
            card.classList.remove('hidden');
            visibleCount++;
          } else {
            card.classList.add('hidden');
          }
        });

        countEl.textContent = 'Showing ' + visibleCount + ' of ' + cards.length + ' verified technologies';
        if (visibleCount === 0) {
          emptyState.classList.remove('hidden');
        } else {
          emptyState.classList.add('hidden');
        }
      }

      function updateCategoryButtons() {
        categoryButtons.forEach(btn => {
          const isSelected = btn.dataset.category === currentCategory;
          if (isSelected) {
            btn.className = 'category-filter-btn shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30 active-category';
          } else {
            btn.className = 'category-filter-btn shrink-0 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700';
          }
        });
      }

      searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value.toLowerCase().trim();
        filterCatalog();
      });

      categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          currentCategory = this.dataset.category;
          updateCategoryButtons();
          filterCatalog();

          // Sync URL params without reload
          const url = new URL(window.location);
          if (currentCategory === 'all') {
            url.searchParams.delete('category');
          } else {
            url.searchParams.set('category', currentCategory);
          }
          window.history.replaceState({}, '', url);
        });
      });

      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          currentCategory = 'all';
          searchQuery = '';
          searchInput.value = '';
          updateCategoryButtons();
          filterCatalog();
          const url = new URL(window.location);
          url.searchParams.delete('category');
          url.searchParams.delete('q');
          window.history.replaceState({}, '', url);
        });
      }

      // Initial state from URL
      const urlParams = new URLSearchParams(window.location.search);
      const paramCat = urlParams.get('category');
      const paramQ = urlParams.get('q');
      if (paramCat) {
        currentCategory = paramCat;
        updateCategoryButtons();
      }
      if (paramQ) {
        searchQuery = paramQ.toLowerCase().trim();
        searchInput.value = paramQ;
      }
      filterCatalog();
    })();
  </script>
  `;

  return renderLayout({
    title: 'Verified Technology Catalog (80 Technologies)',
    description: 'Complete directory of 80 verified frameworks, content management systems, analytics tools, and web infrastructure rules supported by SiteStack.',
    currentPath: '/catalog',
    bodyHtml,
    extraScripts,
  });
}
