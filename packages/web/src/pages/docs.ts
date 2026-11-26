/**
 * SiteStack Public Web Platform — Documentation & FAQ Page
 */

import { renderLayout } from '../templates/layout';
import { CHROME_WEB_STORE_URL } from '../constants';

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
          <a href="#install" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">01.</span> Installation &amp; Quickstart
          </a>
          <a href="#methodology" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">02.</span> Detection Methodology &amp; Probing
          </a>
          <a href="#scoring" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">03.</span> Multi-Signal Calibration &amp; Scoring
          </a>
          <a href="#privacy" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">04.</span> Privacy Architecture &amp; Zero Telemetry
          </a>
          <a href="#ontology-guide" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">05.</span> Architectural Graph Engine
          </a>
          <a href="#api-spec" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">06.</span> API Specification Preview
          </a>
          <a href="#faq" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">07.</span> Frequently Asked Questions (FAQ)
          </a>
          <a href="#feedback" class="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5">
            <span class="text-indigo-600 dark:text-indigo-400 font-mono">08.</span> Feedback &amp; Technology Requests
          </a>
        </div>
      </nav>

      <!-- Section 1: Installation & Quickstart -->
      <article id="install" class="space-y-4">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">01.</span> Installation &amp; Quickstart
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Getting started with SiteStack takes less than thirty seconds. SiteStack runs as a lightweight, privacy-preserving Google Chrome extension with zero background overhead.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">1</span>
              <span class="font-bold text-slate-900 dark:text-white text-xs font-mono">Install from Web Store</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Install SiteStack directly from the official Chrome Web Store. Requires standard Chromium permissions (<code>activeTab</code>, <code>scripting</code>, <code>storage</code>).
            </p>
            <div class="pt-2">
              <a href="${CHROME_WEB_STORE_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Add to Chrome Free &rarr;
              </a>
            </div>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">2</span>
              <span class="font-bold text-slate-900 dark:text-white text-xs font-mono">Pin to Toolbar</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Click Chrome's jigsaw puzzle icon in the top-right toolbar and click the pin icon next to SiteStack so the brand mark stays visible at all times.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">3</span>
              <span class="font-bold text-slate-900 dark:text-white text-xs font-mono">Inspect Any Website</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Navigate to any public website and click the SiteStack icon. In under 5ms, SiteStack inspects the active client state and reveals the complete technology stack.
            </p>
          </div>
        </div>
      </article>

      <!-- Section 2: Methodology -->
      <article id="methodology" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">02.</span> Detection Methodology &amp; Isolated Probing
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

      <!-- Section 3: Calibration & Scoring -->
      <article id="scoring" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">03.</span> Multi-Signal Calibration &amp; Scoring
        </h2>
        <div class="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <span class="font-bold text-indigo-900 dark:text-indigo-200">What does the confidence score represent?</span>
          <p class="mt-1">
            SiteStack's confidence percentage is a <strong>heuristic detection-confidence metric</strong> reflecting the quantity, independence, and weight of verifiable browser signals detected for that technology. It does <strong>NOT</strong> represent the percentage of the website's codebase written in that technology, and it is not a statistical probability.
          </p>
        </div>

        <div class="space-y-3">
          <div class="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-emerald-900 dark:text-emerald-200 text-xs font-mono">High Confidence Tier (&ge; 80%)</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold uppercase">Deterministic</span>
            </div>
            <p class="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Requires either an active isolated runtime JavaScript global (e.g. <code>window.Shopify</code>, <code>window.React</code>) or multiple converging independent evidence vectors (e.g. structural DOM selector + verified script asset).
            </p>
          </div>

          <div class="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-amber-900 dark:text-amber-200 text-xs font-mono">Medium Confidence Tier (50% – 79%)</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold uppercase">Corroborated</span>
            </div>
            <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Identified via a single deterministic script delivery or unique CSS namespace, but lacking live runtime memory proof.
            </p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-slate-900 dark:text-white text-xs font-mono">Low Confidence Tier (30% – 49%)</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">Corroboration Only</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Isolated soft signal (e.g. generic CSS class). Never surfaced as a standalone detection without additional proof.
            </p>
          </div>

          <div class="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/50">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-purple-900 dark:text-purple-200 text-xs font-mono">Inferred Foundation (30% – 75%)</span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-200/80 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 font-bold uppercase">Architectural Dependency</span>
            </div>
            <p class="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
              Architecturally required prerequisite logically deduced from a verified parent technology (e.g. Next.js strictly requires React). Rendered with a distinctive dashed border and capped confidence to indicate that direct browser globals were not directly inspected.
            </p>
          </div>

          <div class="p-3 bg-slate-100/70 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <strong>Noise Floor (&lt; 30%):</strong> Candidate detections scoring below 30% are suppressed to filter low-confidence noise and reduce false positives.
          </div>
        </div>
      </article>

      <!-- Section 4: Privacy Guarantee -->
      <article id="privacy" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">04.</span> Privacy Architecture: Local-First Guarantee (Zero Telemetry)
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

      <!-- Section 5: Architectural Graph Engine -->
      <article id="ontology-guide" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">05.</span> Architectural Graph Engine &amp; Full-Screen Canvas
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          SiteStack features a full-screen interactive 2D Architecture Canvas that maps technology relationships visually. Stacks are organized into vertical dependency tiers and independent trays:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Directly Observed</div>
            <p class="text-slate-600 dark:text-slate-400 font-sans">Signals observed directly in the active browser DOM or runtime memory. Displayed with a solid border.</p>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-purple-600 dark:text-purple-400 mb-1">Inferred Foundations</div>
            <p class="text-slate-600 dark:text-slate-400 font-sans">Architecturally required dependencies (e.g. React inferred when Next.js is confirmed). Displayed with a dashed border.</p>
          </div>
          <div class="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="font-bold text-amber-600 dark:text-amber-400 mb-1">Unverified Association</div>
            <p class="text-slate-600 dark:text-slate-400 font-sans">Co-detected technologies that frequently integrate but lack explicit runtime binding.</p>
          </div>
        </div>
      </article>

      <!-- Section 6: API Specification Preview -->
      <article id="api-spec" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">06.</span> Developer API Specification Preview
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

      <!-- Section 7: FAQ -->
      <article id="faq" class="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">07.</span> Frequently Asked Questions (FAQ)
        </h2>

        <div class="space-y-4">
          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">How does SiteStack differ from Wappalyzer or BuiltWith?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              SiteStack evaluates websites locally inside your browser, enabling direct client-side SPA inspection with zero telemetry. Other services either rely on remote HTML scraping (which misses dynamic SPAs) or track your navigation history for commercial data resale.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">Does SiteStack slow down my browsing?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No. SiteStack does not run continuously in the background on every tab. It only executes when you explicitly click the extension icon or trigger a scan, completing execution in under 5 milliseconds.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">What does an &ldquo;Inferred&rdquo; technology mean?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              An Inferred technology is a strictly required architectural prerequisite of a directly confirmed framework (for example, React is required by Next.js, and Vue is required by Nuxt). Because production bundles often minify, wrap, or isolate foundational globals, SiteStack logically infers the foundation with capped confidence to provide a complete architecture map without making ungrounded claims.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">Why is the version number unknown or missing for some technologies?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              SiteStack extracts version numbers only when they are explicitly and unambiguously exposed in client-accessible vectors (e.g. meta generator tags, versioned CDN URLs, or window globals like <code>window.React.version</code>). If a vendor does not expose a version string in the client bundle, SiteStack deliberately leaves it blank rather than hallucinating an arbitrary guess.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">Why is a technology missing or not detected?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              A technology might not appear for three common reasons:
              (1) The technology operates entirely on the server backend (like Python, Go, PostgreSQL) and leaves zero client-side headers or DOM signatures;
              (2) The website is built with vanilla HTML/CSS/JS without third-party frameworks; or
              (3) The technology is not yet part of SiteStack's curated 80-technology catalog.
            </p>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h3 class="font-extrabold text-slate-900 dark:text-white text-sm mb-1.5">Why doesn't SiteStack scan Chrome Web Store or internal browser pages?</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Google Chrome and Chromium browsers enforce strict security isolation: browser extensions are strictly forbidden from injecting scripts or inspecting internal browser URLs (<code>chrome://</code>, <code>chrome-extension://</code>), local settings, or the official Chrome Web Store. This is an intentional security boundary of the Chromium platform.
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

      <!-- Section 8: Feedback & Technology Requests -->
      <article id="feedback" class="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-2xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
          <span class="text-indigo-600 dark:text-indigo-400 font-mono">08.</span> Feedback, False Positives &amp; Technology Requests
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          SiteStack is developed with continuous accuracy audits. If you encounter a false positive, a missing technology, or an inaccurate version detection, we welcome your feedback.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="font-bold text-slate-900 dark:text-white text-xs font-mono text-indigo-700 dark:text-indigo-400">Report a False Positive or Bug</div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Found a misdetection or anomalous confidence score? Open an issue with the scanned URL and the conflicting evidence signals.
            </p>
            <div class="pt-2">
              <a href="https://github.com/Dushyant91/sitestack/issues/new?template=bug_report.md&title=[Bug]:+Detection+Issue" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Open GitHub Issue &rarr;
              </a>
            </div>
          </div>

          <div class="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div class="font-bold text-slate-900 dark:text-white text-xs font-mono text-indigo-700 dark:text-indigo-400">Request a New Technology</div>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Want SiteStack to recognize a new framework, library, or CMS? Submit a technology request with official documentation and verifiable client-side signals.
            </p>
            <div class="pt-2">
              <a href="https://github.com/Dushyant91/sitestack/issues/new?template=feature_request.md&title=[Tech+Request]:+[Technology+Name]" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Request Technology &rarr;
              </a>
            </div>
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
