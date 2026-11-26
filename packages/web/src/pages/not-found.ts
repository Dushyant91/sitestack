/**
 * SiteStack Public Web Platform — 404 Not Found Page
 */

import { renderLayout } from '../templates/layout';

export function renderNotFoundPage(): string {
  const bodyHtml = `
  <section class="py-24 sm:py-32 text-center transition-colors">
    <div class="max-w-2xl mx-auto px-4 sm:px-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
        404 • Page Not Found
      </div>
      <h1 class="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
        Lost in the Stack
      </h1>
      <p class="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
        The requested URL was not found on the SiteStack public intelligence catalog.
      </p>
      <div class="mt-8 flex flex-wrap justify-center items-center gap-4">
        <a href="/" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm">
          Return to Home
        </a>
        <a href="/catalog" class="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-all text-sm">
          Browse 80 Technologies
        </a>
      </div>
    </div>
  </section>
  `;

  return renderLayout({
    title: '404 Page Not Found',
    description: 'The requested page was not found on SiteStack.',
    currentPath: '/404',
    bodyHtml,
  });
}
