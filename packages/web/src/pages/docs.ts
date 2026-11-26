/**
 * SiteStack Public Web Platform — Documentation & FAQ Page
 */

import { renderLayout } from '../templates/layout';

export function renderDocsPage(): string {
  const bodyHtml = `
  <section class="py-12 bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
        Developer Guide &amp; Technical Manual
      </div>
      <h1 class="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight">SiteStack Documentation &amp; FAQ</h1>
      <p class="text-slate-600 dark:text-slate-300 mt-3 text-base leading-relaxed">
        Complete guide to SiteStack's local-first detection methodology, multi-signal evidence scoring, privacy architecture, and developer specifications.
      </p>
    </div>
  </section>

  <section class="py-12 bg-white dark:bg-slate-950 transition-colors duration-200">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <!-- Table of Contents -->
      <nav class="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800" aria-label="Documentation sections">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 font-mono">Documentation Sections</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <a href="#methodology" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">01.</span> Detection Methodology &amp; Probing
          </a>
          <a href="#scoring" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">02.</span> Multi-Signal Calibration &amp; Scoring
          </a>
          <a href="#privacy" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">03.</span> Privacy Architecture &amp; Zero Telemetry
          </a>
          <a href="#ontology-guide" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">04.</span> Architectural Graph Engine
          </a>
          <a href="#api-spec" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">05.</span> API Specification Preview
          </a>
          <a href="#faq" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">06.</span> Frequently Asked Questions (FAQ)
          </a>
        </div>
      </nav>

      <!-- Section 1: Methodology -->
      <article id="methodology" class="space-y-4">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">01.</span> Detection Methodology &amp; Isolated Probing
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Unlike legacy scrapers that fetch HTML pages from remote data center servers, SiteStack evaluates the authentic client-side state of the web page directly inside Google Chrome.
          This enables accurate detection of client-rendered Single-Page Applications (SPAs), micro-frontends, dynamically injected script tags, and runtime JavaScript singletons.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-slate-900 dark:text-white text-xs mb-1 font-mono text-indigo-700 dark:text-indigo-400">1. DOM Hierarchy &amp; Selectors</div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Inspects structural DOM elements, custom HTML tags, container attributes (e.g. <code>[data-reactroot]</code>, <code>#__next</code>), and meta generator tags.
            </p>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-slate-900 dark:text-white text-xs mb-1 font-mono text-indigo-700 dark:text-indigo-400">2. Runtime Window Globals</div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Injects an unprivileged probe into the main frame world to verify live JavaScript objects (e.g. <code>window.React</code>, <code>window.Shopify</code>, <code>window.__NUXT__</code>).
            </p>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-slate-900 dark:text-white text-xs mb-1 font-mono text-indigo-700 dark:text-indigo-400">3. Resource Deliveries &amp; Assets</div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Matches script <code>src</code> attributes, CDN origins, and CSS stylesheets against calibrated deterministic regular expressions.
            </p>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-slate-900 dark:text-white text-xs mb-1 font-mono text-indigo-700 dark:text-indigo-400">4. Response Headers</div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Extracts HTTP response headers (e.g. <code>x-powered-by</code>, <code>server</code>, <code>x-vercel-id</code>) captured during initial navigation when supported by the probe context.
            </p>
          </div>
        </div>
      </article>

      <!-- Section 2: Calibration & Scoring -->
      <article id="scoring" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">02.</span> Multi-Signal Calibration &amp; Scoring
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          SiteStack eliminates false positives through an evidence accumulation and confidence calibration model:
        </p>

        <div class="space-y-3">
          <div class="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-emerald-900 dark:text-emerald-200 text-xs">High Confidence Tier (90% – 100%)</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold uppercase">Deterministic</span>
            </div>
            <p class="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              Requires either an active runtime JavaScript global or multiple converging independent evidence vectors (e.g. DOM selector + versioned script asset).
            </p>
          </div>

          <div class="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-amber-900 dark:text-amber-200 text-xs">Medium Confidence Tier (70% – 89%)</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold uppercase">Probable</span>
            </div>
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Identified via a single deterministic script delivery or unique CSS namespace, but lacking live runtime memory proof.
            </p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-slate-900 dark:text-white text-xs">Low Confidence Tier (&lt; 70%)</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">Corroboration Only</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Isolated soft signal (e.g. generic CSS class). Never surfaced as a standalone detection without additional proof.
            </p>
          </div>
        </div>
      </article>

      <!-- Section 3: Privacy Guarantee -->
      <article id="privacy" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">03.</span> Privacy Architecture: Local-First Guarantee (Zero Telemetry)
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Most extensions monitor, log, or transmit the websites you visit to external analytics servers. SiteStack is architected from the foundation up with a strict zero-telemetry guarantee:
        </p>

        <div class="p-6 bg-slate-900 dark:bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
          <div class="flex items-center gap-2 text-emerald-400 font-bold">
            <span>✓</span> Local In-Memory Evaluation Only
          </div>
          <div class="text-slate-300 leading-relaxed font-sans">
            Evaluation happens in synchronous browser memory. Detection rules execute against harvested tokens without making network requests to third-party endpoints.
          </div>

          <div class="flex items-center gap-2 text-emerald-400 font-bold pt-2 border-t border-slate-800">
            <span>✓</span> Minimal Chrome Permissions
          </div>
          <div class="text-slate-300 leading-relaxed font-sans">
            SiteStack declares strictly <code>activeTab</code>, <code>scripting</code>, and <code>storage</code>. It does not request broad host permissions (<code>&lt;all_urls&gt;</code>) or background traffic eavesdropping.
          </div>

          <div class="flex items-center gap-2 text-emerald-400 font-bold pt-2 border-t border-slate-800">
            <span>✓</span> No User Accounts, Telemetry, or Analytics
          </div>
          <div class="text-slate-300 leading-relaxed font-sans">
            There are no tracking pixels, Google Analytics scripts, Mixpanel events, Sentry beacons, or user identification cookies embedded in SiteStack.
          </div>
        </div>
      </article>

      <!-- Section 4: Architectural Graph Engine -->
      <article id="ontology-guide" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">04.</span> Architectural Graph Engine &amp; Full-Screen Canvas
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          SiteStack features a full-screen interactive 2D Architecture Canvas that maps technology relationships visually. Stacks are organized into vertical dependency tiers and independent trays:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Directly Observed</div>
            <p class="text-slate-600 dark:text-slate-400 font-sans">Signals observed directly in the active browser DOM or runtime memory.</p>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-purple-600 dark:text-purple-400 mb-1">Inferred Foundations</div>
            <p class="text-slate-600 dark:text-slate-400 font-sans">Architecturally required dependencies (e.g. React inferred when Next.js is confirmed).</p>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-amber-600 dark:text-amber-400 mb-1">Unverified Association</div>
            <p class="text-slate-600 dark:text-slate-400 font-sans">Co-detected technologies that frequently integrate but lack explicit runtime binding.</p>
          </div>
        </div>
      </article>

      <!-- Section 5: API Specification Preview -->
      <article id="api-spec" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">05.</span> Developer API Specification Preview
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          For programmatic integration and CI/CD automated stack audits, SiteStack provides the <code>@sitestack/api</code> package:
        </p>

        <pre class="bg-slate-900 dark:bg-slate-950 text-indigo-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
import { DeclarativeEvaluator, buildArchitectureGraph } from '@sitestack/engine';

const evaluator = new DeclarativeEvaluator();
const scanResult = evaluator.evaluate({
  url: 'https://example.com',
  dom: ['div[data-reactroot]'],
  globals: { __NEXT_DATA__: {} },
  resources: ['/_next/static/chunks/main.js'],
  headers: { 'x-powered-by': 'Next.js' }
});

const graph = buildArchitectureGraph(scanResult);
console.log('Discovered ' + graph.nodes.length + ' nodes across ' + graph.clusters.length + ' clusters.');
</pre>
      </article>

      <!-- Section 6: FAQ -->
      <article id="faq" class="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">06.</span> Frequently Asked Questions (FAQ)
        </h2>

        <div class="space-y-4">
          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">How does SiteStack differ from Wappalyzer or BuiltWith?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              SiteStack evaluates websites locally inside your browser, enabling 100% accurate SPA inspection with zero telemetry. Other services either rely on remote HTML scraping (which misses dynamic SPAs) or track your navigation history for commercial data resale.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">Does SiteStack slow down my browsing?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No. SiteStack does not run continuously in the background on every tab. It only executes when you explicitly click the extension icon or trigger a scan, completing execution in under 5 milliseconds.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">Can SiteStack detect backend databases like PostgreSQL or MongoDB?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              SiteStack adheres strictly to empirical veracity. Because backend databases operate behind server firewalls and do not leak client runtime signals, SiteStack never fabricates or guesses backend databases without authentic client-exposed headers or telemetry.
            </p>
          </div>
        </div>
      </article>
    </div>
  </section>
  `;

  return renderLayout({
    title: 'Documentation & Technical FAQ',
    description: 'Learn how SiteStack performs authentic client-side technology detection, multi-signal evidence calibration, and privacy-first local evaluation.',
    currentPath: '/docs',
    bodyHtml,
  });
}
