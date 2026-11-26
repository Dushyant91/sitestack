/**
 * SiteStack Public Web Platform — Shared Layout Template
 *
 * Provides responsive navigation, complete Night Mode support with zero-flash
 * theme hydration, accessible semantic structure, local CSS bundling,
 * OpenGraph/Twitter Card meta tags, and structured JSON-LD data.
 */

import {
  SITESTACK_ICON_128_DATA_URI,
  SITESTACK_ICON_32_DATA_URI,
  SITESTACK_ICON_16_DATA_URI,
} from '../../../../src/shared/logo-assets';

export interface LayoutOptions {
  title: string;
  description: string;
  currentPath: string;
  bodyHtml: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  extraHead?: string;
  extraScripts?: string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderLayout(options: LayoutOptions): string {
  const {
    title,
    description,
    currentPath,
    bodyHtml,
    jsonLd,
    extraHead = '',
    extraScripts = '',
  } = options;

  const siteUrl = process.env.SITE_URL || (process.env.CF_PAGES_URL ? process.env.CF_PAGES_URL.replace(/\/$/, '') : 'https://sitestack.dev');
  const canonicalUrl = `${siteUrl}${currentPath === '/' ? '' : currentPath}`;
  const fullTitle = currentPath === '/' ? title : `${title} — SiteStack`;

  const navLinks = [
    { href: '/', label: 'Home', active: currentPath === '/' },
    { href: '/catalog', label: 'Catalog (80)', active: currentPath.startsWith('/catalog') || currentPath.startsWith('/technologies') },
    { href: '/categories', label: 'Architecture & Layers', active: currentPath.startsWith('/categories') },
    { href: '/docs', label: 'Documentation & FAQ', active: currentPath.startsWith('/docs') },
  ];

  const desktopNavHtml = navLinks.map((link) => `
    <a href="${link.href}" class="text-sm font-semibold transition-colors px-3 py-1.5 rounded-lg ${
      link.active
        ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/60 font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
    }">
      ${escapeHtml(link.label)}
    </a>
  `).join('');

  const mobileNavHtml = navLinks.map((link) => `
    <a href="${link.href}" class="block px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
      link.active
        ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/60 font-bold'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }">
      ${escapeHtml(link.label)}
    </a>
  `).join('');

  const jsonLdScript = jsonLd
    ? `\n  <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n  </script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- OpenGraph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="SiteStack">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">

  <!-- Theme Hydration: Zero-Flash Night Mode Script -->
  <script>
    (function() {
      try {
        var savedTheme = localStorage.getItem('sitestack_theme');
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  </script>

  <!-- Local Bundled Stylesheet (No runtime CDN) -->
  <link rel="stylesheet" href="/assets/style.css">

  <!-- SiteStack Official Brand Mark Favicon from public/icons/icon-32.png -->
  <link rel="icon" type="image/png" sizes="32x32" href="${SITESTACK_ICON_32_DATA_URI}">
  <link rel="icon" type="image/png" sizes="16x16" href="${SITESTACK_ICON_16_DATA_URI}">
  <link rel="shortcut icon" href="/icons/icon-32.png">
  ${jsonLdScript}
  ${extraHead}
</head>
<body class="min-h-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
  <!-- Skip to main content for accessibility -->
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg">
    Skip to main content
  </a>

  <!-- Top Navigation Bar -->
  <header class="bg-white/90 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Brand Logo & Title -->
      <a href="/" class="flex items-center gap-3 group" aria-label="SiteStack Home">
        <!-- Official SiteStack Brand Mark from public/icons/icon-128.png -->
        <img
          src="${SITESTACK_ICON_128_DATA_URI}"
          alt="SiteStack Logo"
          width="36"
          height="36"
          class="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-transform shrink-0 object-contain"
        />
        <div class="flex items-center gap-2">
          <span class="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">SiteStack</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60 font-mono">v1.1.2</span>
        </div>
      </a>

      <!-- Desktop Navigation Links -->
      <nav class="hidden lg:flex items-center gap-2" aria-label="Primary Navigation">
        ${desktopNavHtml}
      </nav>

      <!-- Desktop Action CTA & Theme Toggle -->
      <div class="hidden lg:flex items-center gap-3">
        <!-- Theme Toggle Button -->
        <button
          type="button"
          id="theme-toggle"
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
          aria-label="Toggle dark mode"
          title="Toggle color theme"
        >
          <!-- Moon icon (displayed in light mode) -->
          <svg id="theme-toggle-dark-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          <!-- Sun icon (displayed in dark mode) -->
          <svg id="theme-toggle-light-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </button>

        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all active:scale-95 whitespace-nowrap">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
            <line x1="21.17" y1="8" x2="12" y2="8"/>
            <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
            <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
          </svg>
          <span>Add to Chrome</span>
        </a>
      </div>

      <!-- Mobile Controls (Theme Toggle + Menu Toggle) -->
      <div class="flex lg:hidden items-center gap-2">
        <button
          type="button"
          id="mobile-theme-toggle"
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          aria-label="Toggle dark mode"
          title="Toggle color theme"
        >
          <svg id="mobile-theme-toggle-dark-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          <svg id="mobile-theme-toggle-light-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </button>

        <button type="button" id="mobile-menu-toggle" class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Open main menu" aria-expanded="false">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <div id="mobile-menu" class="hidden lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 transition-colors duration-200">
      ${mobileNavHtml}
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
        <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" class="block w-full text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm">
          Add to Chrome Extension
        </a>
      </div>
    </div>
  </header>

  <!-- Main Page Content -->
  <main id="main-content" class="flex-1">
    ${bodyHtml}
  </main>

  <!-- Global Footer -->
  <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200" aria-label="Site Footer">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <!-- Brand Summary -->
        <div class="md:col-span-1 space-y-4">
          <div class="flex items-center gap-2.5">
            <!-- Official SiteStack Brand Mark from public/icons/icon-128.png -->
            <img
              src="${SITESTACK_ICON_128_DATA_URI}"
              alt="SiteStack Logo"
              width="28"
              height="28"
              class="w-7 h-7 rounded-lg shadow-sm shrink-0 object-contain"
            />
            <span class="font-extrabold text-lg text-slate-900 dark:text-white">SiteStack</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            High-precision website technology intelligence engine. 100% local client-side evaluation with zero telemetry, zero analytics tracking, and full privacy isolation.
          </p>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Local-First • Zero Telemetry
            </span>
          </div>
        </div>

        <!-- Product Links -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Product</h3>
          <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><a href="/catalog" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">80-Technology Catalog</a></li>
            <li><a href="/categories" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">8 Functional Categories</a></li>
            <li><a href="/categories#ontology" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">41 Architectural Relationships</a></li>
            <li><a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Chrome Web Store Listing</a></li>
          </ul>
        </div>

        <!-- Resources -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Resources</h3>
          <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><a href="/docs" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Detection Methodology</a></li>
            <li><a href="/docs#privacy" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Privacy Architecture</a></li>
            <li><a href="/docs#faq" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Frequently Asked Questions</a></li>
            <li><a href="/docs#api-spec" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">API Specification Preview</a></li>
          </ul>
        </div>

        <!-- Governance -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Governance</h3>
          <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><span class="text-slate-500 dark:text-slate-400">Engine: Declarative Multi-Signal</span></li>
            <li><span class="text-slate-500 dark:text-slate-400">Permissions: activeTab, scripting, storage</span></li>
            <li><span class="text-slate-500 dark:text-slate-400">Remote Cloud Scanners: None</span></li>
            <li><span class="text-slate-500 dark:text-slate-400">External Crawlers: None</span></li>
          </ul>
        </div>
      </div>

      <div class="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          &copy; 2026 SiteStack. All rights reserved. Technology trademarks are the property of their respective owners.
        </div>
        <div class="flex items-center gap-6">
          <a href="/sitemap.xml" class="hover:text-slate-700 dark:hover:text-slate-200">Sitemap</a>
          <a href="/robots.txt" class="hover:text-slate-700 dark:hover:text-slate-200">Robots.txt</a>
          <a href="/docs#privacy" class="hover:text-slate-700 dark:hover:text-slate-200">Privacy Policy</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Vanilla JS for Client Interactions (Menu & Night Mode) -->
  <script>
    (function() {
      // Mobile Navigation Drawer Toggle
      const toggle = document.getElementById('mobile-menu-toggle');
      const menu = document.getElementById('mobile-menu');
      if (toggle && menu) {
        toggle.addEventListener('click', function() {
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', !isExpanded);
          menu.classList.toggle('hidden');
        });
      }

      // Theme Management (Light / Dark)
      const themeToggle = document.getElementById('theme-toggle');
      const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
      const darkIcons = [
        document.getElementById('theme-toggle-dark-icon'),
        document.getElementById('mobile-theme-toggle-dark-icon')
      ];
      const lightIcons = [
        document.getElementById('theme-toggle-light-icon'),
        document.getElementById('mobile-theme-toggle-light-icon')
      ];

      function updateThemeIcons() {
        const isDark = document.documentElement.classList.contains('dark');
        darkIcons.forEach(icon => {
          if (icon) {
            if (isDark) icon.classList.add('hidden');
            else icon.classList.remove('hidden');
          }
        });
        lightIcons.forEach(icon => {
          if (icon) {
            if (isDark) icon.classList.remove('hidden');
            else icon.classList.add('hidden');
          }
        });
        const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
        if (themeToggle) themeToggle.setAttribute('aria-label', label);
        if (mobileThemeToggle) mobileThemeToggle.setAttribute('aria-label', label);
      }

      function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('sitestack_theme', 'light');
        } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('sitestack_theme', 'dark');
        }
        updateThemeIcons();
      }

      if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
      if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);

      // Listen for system color scheme changes if user hasn't explicitly set a preference
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
          if (!localStorage.getItem('sitestack_theme')) {
            if (e.matches) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            updateThemeIcons();
          }
        });
      }

      // Initial icon synchronization
      updateThemeIcons();
    })();
  </script>
  ${extraScripts}
</body>
</html>`;
}
