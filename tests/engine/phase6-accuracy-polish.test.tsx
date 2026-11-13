import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { harvestIsolatedSignals } from '../../src/extension/content/isolated-probe';
import { HarvestedSignals, DetectedTechnology } from '../../src/engine/types';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { EvidenceDrawer } from '../../src/popup/components/EvidenceDrawer';
import { TechCard } from '../../src/popup/components/TechCard';

describe('Phase 6: Targeted Engine Accuracy Polish Suite', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  // =========================================================================
  // Task 1: Tailwind CSS Detection
  // =========================================================================
  describe('Task 1: Tailwind CSS Detection', () => {
    it('1.1. Detects Tailwind CSS in compiled apps via distinctive DOM utility class patterns', () => {
      // Simulate DOM with distinctive Tailwind utility classes across elements
      document.body.innerHTML = `
        <div class="min-h-screen bg-slate-900 text-white flex flex-col p-4 sm:p-6 lg:p-8 space-y-4">
          <header class="border-b border-slate-700/60 pb-3 flex justify-between">
            <h1 class="text-xl font-bold tracking-tight text-emerald-400">Dashboard</h1>
            <button class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded ring-2 ring-indigo-400/50">Action</button>
          </header>
          <main class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-zinc-800 rounded-lg shadow-sm border border-zinc-700">Card 1</div>
          </main>
        </div>
      `;

      const isolated = harvestIsolatedSignals();
      expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(true);

      const signals: HarvestedSignals = {
        url: 'https://example-tailwind-app.com',
        globals: {},
        dom: isolated.dom,
        meta: [],
        resources: ['https://example-tailwind-app.com/_next/static/css/global.css'],
      };

      const result = evaluateSignals(signals);
      const tailwind = result.technologies.find((t) => t.id === 'tailwindcss');

      expect(tailwind).toBeDefined();
      expect(tailwind?.category).toBe('library');
      expect(tailwind?.detectionType).toBe('direct');
      // DOM class-name evidence alone is calibrated to Medium confidence (50 pts, <= 60 pts cap)
      expect(tailwind?.confidenceScore).toBe(50);
      expect(tailwind?.confidenceTier).toBe('medium');
    });

    it('1.2. Arbitrary values and ring focus utilities trigger Tailwind detection', () => {
      document.body.innerHTML = `
        <div class="w-[320px] max-w-[90vw] p-[16px] dark:bg-zinc-900">
          <input class="w-full ring-2 ring-offset-2 ring-emerald-500 focus:outline-none" />
          <span class="text-[13px] text-zinc-400">Help text</span>
        </div>
      `;

      const isolated = harvestIsolatedSignals();
      expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(true);

      const signals: HarvestedSignals = {
        url: 'https://example-app.com',
        globals: {},
        dom: isolated.dom,
        meta: [],
        resources: [],
      };

      const result = evaluateSignals(signals);
      const tailwind = result.technologies.find((t) => t.id === 'tailwindcss');
      expect(tailwind).toBeDefined();
      expect(tailwind?.confidenceTier).toBe('medium');
    });

    it('1.3. Negative Control: Generic CSS classes do NOT trigger Tailwind CSS detection', () => {
      // Sites using generic class names (Bootstrap, BEM, or custom styles) must not trigger Tailwind
      document.body.innerHTML = `
        <div class="flex grid hidden container card header row col active selected">
          <nav class="navbar navbar-expand-lg bg-light">
            <div class="container-fluid">
              <span class="navbar-brand">Generic Site</span>
            </div>
          </nav>
          <div class="card p-3 m-2">
            <h2 class="card-title">Generic Content</h2>
            <p class="card-text">Some text without any distinctive utility combinations.</p>
          </div>
        </div>
      `;

      const isolated = harvestIsolatedSignals();
      expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(false);

      const signals: HarvestedSignals = {
        url: 'https://generic-site.com',
        globals: {},
        dom: isolated.dom,
        meta: [],
        resources: ['https://generic-site.com/main.css'],
      };

      const result = evaluateSignals(signals);
      const tailwind = result.technologies.find((t) => t.id === 'tailwindcss');
      expect(tailwind).toBeUndefined();
    });

    it('1.4. Negative Control: Insufficient utility class usage (< 3 distinct matches) does not trigger Tailwind', () => {
      document.body.innerHTML = `
        <div class="hover:underline">
          <p>A simple link</p>
        </div>
      `;

      const isolated = harvestIsolatedSignals();
      expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(false);
    });

    it('1.5. Corroborated Tailwind CSS (DOM utilities + CDN script) reaches High confidence', () => {
      const signals: HarvestedSignals = {
        url: 'https://tailwind-play.com',
        globals: {},
        dom: [{ selector: 'dom:tailwind-utilities' }],
        meta: [],
        resources: ['https://cdn.tailwindcss.com/3.4.1'],
      };

      const result = evaluateSignals(signals);
      const tailwind = result.technologies.find((t) => t.id === 'tailwindcss');

      expect(tailwind).toBeDefined();
      // Corroborated across 2 distinct classes (dom + resource) with bonus multiplier
      expect(tailwind?.confidenceTier).toBe('high');
      expect(tailwind?.confidenceScore).toBeGreaterThanOrEqual(80);
    });
  });

  // =========================================================================
  // Task 2: WooCommerce -> WordPress Inference Elevation
  // =========================================================================
  describe('Task 2: WooCommerce -> WordPress Inference Elevation', () => {
    it('2.1. Elevates WordPress to 75 Medium Inferred when WooCommerce is High and direct WP evidence is weak (< 50)', () => {
      const signals: HarvestedSignals = {
        url: 'https://custom-woo-store.com',
        globals: {
          woocommerce_params: { ajax_url: '/wp-admin/admin-ajax.php' },
          wc_cart_fragments_params: {},
        },
        dom: [
          { selector: 'body.woocommerce' },
          { selector: 'body.woocommerce-page' },
        ],
        meta: [],
        resources: [
          // Single WooCommerce asset path under /wp-content/plugins/woocommerce/
          // Alone, this matches WordPress resource rule for 40 pts (< 50)
          'https://custom-woo-store.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js',
        ],
      };

      const result = evaluateSignals(signals);

      const woo = result.technologies.find((t) => t.id === 'woocommerce');
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      expect(woo).toBeDefined();
      expect(woo?.confidenceTier).toBe('high');
      expect(woo?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(woo?.dependentTechnologies).toContain('WordPress');

      // WordPress must be elevated to 75 Medium Inferred
      expect(wp).toBeDefined();
      expect(wp?.confidenceScore).toBe(75);
      expect(wp?.confidenceTier).toBe('medium');
      expect(wp?.detectionType).toBe('inferred');
      expect(wp?.isInferred).toBe(true);
      expect(wp?.parentDependency).toBe('WooCommerce');

      // Direct WooCommerce asset evidence is preserved alongside inferred dependency
      expect(wp?.evidence.length).toBe(2);
      expect(wp?.evidence[0].type).toBe('inferred');
      expect(wp?.evidence[0].weight).toBe(75);
      expect(wp?.evidence[1].type).toBe('resource');
      expect(wp?.evidence[1].source).toContain('plugins/woocommerce');
      expect(wp?.evidence[1].matchedValue).toContain('wp-content');

      // Explanation is transparent about architectural elevation and preserved asset
      expect(wp?.confidenceReason).toContain('Architectural dependency: Inferred with medium confidence (75 pts) because WooCommerce is built upon WordPress');
      expect(wp?.confidenceReason).toContain('supported by observed asset path');
      expect(wp?.confidenceReason).toContain('Direct WordPress core evidence was below the independent threshold');
    });

    it('2.2. Preserves WordPress as High Direct when strong independent direct evidence (>= 50) exists', () => {
      const signals: HarvestedSignals = {
        url: 'https://standard-wp-store.com',
        globals: {
          woocommerce_params: {},
          wp: { ajax_url: '/wp-admin/admin-ajax.php' },
        },
        dom: [
          { selector: 'body.woocommerce' },
          { selector: 'link[rel*="https://api.w.org/"]' },
        ],
        meta: [
          { name: 'generator', content: 'WordPress 6.4.3' },
          { name: 'generator', content: 'WooCommerce 8.6.0' },
        ],
        resources: [
          'https://standard-wp-store.com/wp-content/plugins/woocommerce/assets/client/blocks/wc-cart.js',
          'https://standard-wp-store.com/wp-includes/js/wp-embed.min.js',
        ],
      };

      const result = evaluateSignals(signals);

      const wp = result.technologies.find((t) => t.id === 'wordpress');
      expect(wp).toBeDefined();
      // Strong independent signals (generator + wp global + API link) keep WordPress High Direct
      expect(wp?.detectionType).toBe('direct');
      expect(wp?.isInferred).toBe(false);
      expect(wp?.confidenceTier).toBe('high');
      expect(wp?.confidenceScore).toBe(100);
      expect(wp?.version).toBe('6.4.3');
    });

    it('2.3. Does not alter WordPress when WooCommerce is low confidence (< 80)', () => {
      const signals: HarvestedSignals = {
        url: 'https://partial-store.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          // Only standalone WooCommerce asset (weight 40 for WooCommerce, weight 40 for WP)
          'https://partial-store.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js',
        ],
      };

      const result = evaluateSignals(signals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      // Both WooCommerce and WordPress remain Low Direct from single resource
      expect(woo?.confidenceScore).toBeLessThan(50);
      expect(wp?.confidenceScore).toBe(40);
      expect(wp?.detectionType).toBe('direct');
    });
  });

  // =========================================================================
  // Task 3: Cloudflare Turnstile Classification
  // =========================================================================
  describe('Task 3: Cloudflare Turnstile Classification', () => {
    it('3.1. Standalone Turnstile script on an AWS/Vercel host yields ZERO Cloudflare detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://auth-app.aws-infra.net',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          // A site hosted on AWS using Cloudflare Turnstile as a bot challenge widget
          'https://challenges.cloudflare.com/turnstile/v0/api.js',
          'https://auth-app.aws-infra.net/bundle.js',
        ],
      };

      const result = evaluateSignals(signals);
      const cloudflare = result.technologies.find((t) => t.id === 'cloudflare');

      expect(cloudflare).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    it('3.2. Rocket Loader global correctly establishes Cloudflare infrastructure', () => {
      const signals: HarvestedSignals = {
        url: 'https://cf-powered-site.com',
        globals: {
          __cfRLUnblockHandlers: true,
        },
        dom: [],
        meta: [],
        resources: [],
      };

      const result = evaluateSignals(signals);
      const cloudflare = result.technologies.find((t) => t.id === 'cloudflare');

      expect(cloudflare).toBeDefined();
      expect(cloudflare?.category).toBe('infrastructure');
      expect(cloudflare?.confidenceScore).toBe(50);
      expect(cloudflare?.detectionType).toBe('direct');
    });

    it('3.3. Cloudflare Web Analytics beacon correctly establishes Cloudflare infrastructure', () => {
      const signals: HarvestedSignals = {
        url: 'https://cf-beacon-site.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          'https://static.cloudflareinsights.com/beacon.min.js/v84a3a4012de94ce1a686ba8c167c359c1696973893317',
        ],
      };

      const result = evaluateSignals(signals);
      const cloudflare = result.technologies.find((t) => t.id === 'cloudflare');

      expect(cloudflare).toBeDefined();
      expect(cloudflare?.confidenceScore).toBe(45);
      expect(cloudflare?.detectionType).toBe('direct');
    });

    it('3.4. Multi-class Cloudflare signals (global + beacon) achieve High confidence', () => {
      const signals: HarvestedSignals = {
        url: 'https://enterprise-cloudflare.com',
        globals: {
          _cf_chl_opt: {},
        },
        dom: [],
        meta: [],
        resources: [
          'https://static.cloudflareinsights.com/beacon.min.js',
        ],
      };

      const result = evaluateSignals(signals);
      const cloudflare = result.technologies.find((t) => t.id === 'cloudflare');

      expect(cloudflare).toBeDefined();
      expect(cloudflare?.confidenceTier).toBe('high');
      expect(cloudflare?.confidenceScore).toBeGreaterThanOrEqual(80);
    });
  });

  // =========================================================================
  // Task 4: Next.js Version Transparency & UI Explanation
  // =========================================================================
  describe('Task 4: Next.js Version Transparency & UI Explanation', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    });

    const cleanup = () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    };

    it('4.1. Evaluator appends transparent Next.js missing version note when version is not exposed', () => {
      const signals: HarvestedSignals = {
        url: 'https://nextjs.org',
        globals: {
          __next_f: [],
          __NEXT_DATA__: { page: '/' },
        },
        dom: [
          { selector: '#__next' },
          { selector: 'script#__NEXT_DATA__' },
        ],
        meta: [],
        resources: [
          'https://nextjs.org/_next/static/chunks/main-app.js',
        ],
      };

      const result = evaluateSignals(signals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');

      expect(nextjs).toBeDefined();
      expect(nextjs?.version).toBeUndefined();
      expect(nextjs?.confidenceReason).toContain('Next.js detected. The production build does not expose a reliable framework version, so SiteStack cannot determine the exact version.');
    });

    it('4.2. Next.js with exposed version does NOT append the missing version note', () => {
      const signals: HarvestedSignals = {
        url: 'https://dev-nextjs.com',
        globals: {
          next: { version: '14.2.4' },
          __NEXT_DATA__: { page: '/' },
        },
        dom: [{ selector: '#__next' }],
        meta: [],
        resources: [],
      };

      const result = evaluateSignals(signals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');

      expect(nextjs).toBeDefined();
      expect(nextjs?.version).toBe('14.2.4');
      expect(nextjs?.confidenceReason).not.toContain('so SiteStack cannot determine the exact version');
    });

    it('4.3. EvidenceDrawer renders amber missing version notice when Next.js has no version', () => {
      const mockNextjs: DetectedTechnology = {
        id: 'nextjs',
        name: 'Next.js',
        category: 'framework',
        confidenceScore: 85,
        confidenceTier: 'high',
        detectionType: 'direct',
        isInferred: false,
        evidence: [
          { type: 'global', source: 'window.__next_f', weight: 55 },
          { type: 'dom', source: '#__next', weight: 35 },
        ],
        confidenceReason: 'High confidence (Direct): Corroborated across 2 independent signal classes.',
        website: 'https://nextjs.org',
        icon: '/tech-icons/frameworks/nextjs.svg',
        description: 'React Framework',
      };

      act(() => {
        root.render(<TechCard technology={mockNextjs} initiallyExpanded={true} />);
      });

      expect(container.textContent).toContain('Next.js');
      expect(container.textContent).toContain('Next.js detected. The production build does not expose a reliable framework version, so SiteStack cannot determine the exact version.');
      cleanup();
    });

    it('4.4. EvidenceDrawer does NOT render missing version notice when Next.js has an exposed version', () => {
      const mockNextjsWithVer: DetectedTechnology = {
        id: 'nextjs',
        name: 'Next.js',
        category: 'framework',
        version: '14.2.4',
        confidenceScore: 90,
        confidenceTier: 'high',
        detectionType: 'direct',
        isInferred: false,
        evidence: [
          { type: 'global', source: 'window.next.version', weight: 55 },
        ],
        confidenceReason: 'High confidence (Direct)',
        website: 'https://nextjs.org',
        icon: '/tech-icons/frameworks/nextjs.svg',
        description: 'React Framework',
      };

      act(() => {
        root.render(<TechCard technology={mockNextjsWithVer} initiallyExpanded={true} />);
      });

      expect(container.textContent).toContain('v14.2.4');
      expect(container.textContent).not.toContain('so SiteStack cannot determine the exact version');
      cleanup();
    });

    it('4.5. EvidenceDrawer renders preserved supporting signals for inferred WordPress elevated from WooCommerce', () => {
      const mockInferredWp: DetectedTechnology = {
        id: 'wordpress',
        name: 'WordPress',
        category: 'cms',
        confidenceScore: 75,
        confidenceTier: 'medium',
        detectionType: 'inferred',
        isInferred: true,
        parentDependency: 'WooCommerce',
        evidence: [
          {
            type: 'inferred',
            source: 'Architectural dependency of WooCommerce (WooCommerce requires WordPress)',
            weight: 75,
          },
          {
            type: 'resource',
            source: 'https://store.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js',
            weight: 40,
          },
        ],
        confidenceReason: 'Architectural dependency: Inferred with medium confidence (75 pts) because WooCommerce is built upon WordPress, supported by observed asset path.',
        website: 'https://wordpress.org',
        icon: '/tech-icons/cms/wordpress.svg',
        description: 'Content Management System',
      };

      act(() => {
        root.render(
          <EvidenceDrawer
            technologyId={mockInferredWp.id}
            version={mockInferredWp.version}
            evidence={mockInferredWp.evidence}
            confidenceScore={mockInferredWp.confidenceScore}
            isInferred={mockInferredWp.isInferred}
            parentDependency={mockInferredWp.parentDependency}
            confidenceReason={mockInferredWp.confidenceReason}
            website={mockInferredWp.website}
          />
        );
      });

      expect(container.textContent).toContain('Architectural Dependency');
      expect(container.textContent).toContain('Inferred from WooCommerce');
      expect(container.textContent).toContain('Observed Supporting Signals:');
      expect(container.textContent).toContain('wp-content/plugins/woocommerce');
      expect(container.textContent).toContain('+40');
      cleanup();
    });
  });
});
