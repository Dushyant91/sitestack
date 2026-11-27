import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateScannableUrl } from '../../src/shared/messages';
import { harvestIsolatedSignals } from '../../src/extension/content/isolated-probe';
import { harvestMainSignals } from '../../src/extension/content/main-probe';
import { evaluateSignals } from '../../src/engine/evaluator';
import {
  saveScanToStorage,
  getCachedScan,
  getScanHistory,
  clearScanHistory,
  getDomainKey,
} from '../../src/extension/storage/history';

describe('Manifest V3 Extension Harness & Probes', () => {
  describe('URL Security & Restricted Scheme Validation', () => {
    it('should block internal Chrome, Edge, and browser system URLs with proper error codes', () => {
      const restricted = [
        'chrome://extensions',
        'chrome://settings',
        'chrome-extension://abcdefg/popup.html',
        'edge://flags',
        'about:blank',
        'devtools://devtools/bundled/inspector.html',
        'view-source:https://example.com',
      ];

      for (const url of restricted) {
        const val = validateScannableUrl(url);
        expect(val.scannable, `URL "${url}" should be blocked`).toBe(false);
        expect(val.code).toBe('RESTRICTED_URL');
        expect(val.message).toContain('Browser internal and system pages cannot be analyzed');
      }
    });

    it('should reject non-HTTP protocols (ftp, file, mailto, etc.)', () => {
      const unsupported = [
        'file:///C:/Users/test/index.html',
        'ftp://ftp.example.com',
        'mailto:support@sitestack.io',
        'data:text/html,<h1>Hello</h1>',
      ];

      for (const url of unsupported) {
        const val = validateScannableUrl(url);
        expect(val.scannable, `URL "${url}" should be unsupported`).toBe(false);
        expect(val.code).toBe('UNSUPPORTED_SCHEME');
      }
    });

    it('should allow valid HTTP and HTTPS websites', () => {
      const validUrls = [
        'https://vercel.com',
        'https://shopify.com/store',
        'http://localhost:3000',
        'http://127.0.0.1:8080/app',
        'https://sub.domain.example.co.uk/path?q=1',
      ];

      for (const url of validUrls) {
        const val = validateScannableUrl(url);
        expect(val.scannable, `URL "${url}" should be allowed`).toBe(true);
        expect(val.code).toBeUndefined();
      }
    });
  });

  describe('Signal Harvesting Probes: Six Real-World Website Scenarios', () => {
    const PROBE_KEYS = [
      '__NEXT_DATA__',
      'next',
      'React',
      'Vue',
      'ng',
      'Shopify',
      'ShopifyAnalytics',
      'wp',
      '_wpemojiSettings',
      'google_tag_manager',
      'dataLayer',
      'gtag',
      'hj',
      '_hjSettings',
      'Stripe',
      'Razorpay',
    ];

    beforeEach(() => {
      document.body.innerHTML = '';
      document.head.innerHTML = '';
      vi.restoreAllMocks();
      for (const k of PROBE_KEYS) {
        // @ts-expect-error Mock cleanup
        delete window[k];
      }
    });

    it('Scenario 1: Next.js website (Vercel) -> Probes harvest DOM, globals, resources -> Next.js + React detected', () => {
      // 1. Setup simulated Next.js DOM
      document.head.innerHTML = `
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/_next/static/css/styles.css">
      `;
      document.body.innerHTML = `
        <div id="__next">
          <h1>Next.js App</h1>
        </div>
        <script id="__NEXT_DATA__" type="application/json">{"buildId":"xyz123"}</script>
      `;

      // 2. Setup simulated window globals
      // @ts-expect-error Mocking window global
      window.__NEXT_DATA__ = { buildId: 'xyz123', page: '/' };
      // @ts-expect-error Mocking window global
      window.next = { version: '14.2.3' };

      // 3. Setup mock Resource Timing entries
      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { name: 'https://vercel.com/_next/static/chunks/main.js' } as PerformanceResourceTiming,
        { name: 'https://vercel.com/_next/static/chunks/framework.js' } as PerformanceResourceTiming,
      ]);

      // 4. Run Probes
      const isolated = harvestIsolatedSignals();
      const globals = harvestMainSignals();

      // Verify probe extractions
      expect(isolated.dom.some((d) => d.selector === '#__next')).toBe(true);
      expect(isolated.dom.some((d) => d.selector === 'script#__NEXT_DATA__')).toBe(true);
      expect(isolated.resources).toContain('https://vercel.com/_next/static/chunks/main.js');
      expect(globals.__NEXT_DATA__).toBeDefined();
      expect((globals.next as { version?: string })?.version).toBe('14.2.3');

      // 5. Evaluate combined signals
      const scanResult = evaluateSignals({
        url: 'https://vercel.com',
        meta: isolated.meta,
        dom: isolated.dom,
        resources: isolated.resources,
        globals,
      });

      const next = scanResult.technologies.find((t) => t.id === 'nextjs');
      expect(next).toBeDefined();
      expect(next?.confidenceTier).toBe('high');
      expect(next?.version).toBe('14.2.3');
      expect(next?.isInferred).toBe(false);

      const react = scanResult.technologies.find((t) => t.id === 'react');
      expect(react).toBeDefined();
      expect(react?.isInferred).toBe(true); // Explicitly marked as inferred dependency
    });

    it('Scenario 2: WordPress website -> Probes harvest meta, scripts, globals -> WordPress detected', () => {
      document.head.innerHTML = `
        <meta name="generator" content="WordPress 6.4.2">
        <link rel="https://api.w.org/" href="https://example.com/wp-json/">
      `;
      document.body.innerHTML = `<div>Blog content</div>`;

      // @ts-expect-error Mocking window global
      window.wp = {};
      // @ts-expect-error Mocking window global
      window._wpemojiSettings = { baseUrl: 'https://s.w.org/images/core/emoji/' };

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { name: 'https://example.com/wp-content/themes/twentytwentyfour/style.css' } as PerformanceResourceTiming,
        { name: 'https://example.com/wp-includes/js/wp-embed.min.js' } as PerformanceResourceTiming,
      ]);

      const isolated = harvestIsolatedSignals();
      const globals = harvestMainSignals();

      const scanResult = evaluateSignals({
        url: 'https://example.com',
        meta: isolated.meta,
        dom: isolated.dom,
        resources: isolated.resources,
        globals,
      });

      const wp = scanResult.technologies.find((t) => t.id === 'wordpress');
      expect(wp).toBeDefined();
      expect(wp?.version).toBe('6.4.2');
      expect(wp?.confidenceTier).toBe('high');
      expect(wp?.isInferred).toBe(false);
    });

    it('Scenario 3: Shopify storefront -> Probes harvest CDN assets, theme globals -> Shopify detected', () => {
      document.head.innerHTML = `
        <meta name="shopify-digital-wallet" content="/1234/digital_wallets/dialog">
        <link rel="stylesheet" href="https://cdn.shopify.com/s/files/1/01/t/1/assets/theme.css">
      `;
      document.body.innerHTML = `
        <input type="hidden" name="shopify-digital-wallet" value="1">
      `;

      // @ts-expect-error Mocking window global
      window.Shopify = { theme: { name: 'Dawn', version: '12.0.0' } };
      // @ts-expect-error Mocking window global
      window.ShopifyAnalytics = {};

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { name: 'https://cdn.shopify.com/s/files/1/01/t/1/assets/app.js' } as PerformanceResourceTiming,
        { name: 'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking.js' } as PerformanceResourceTiming,
      ]);

      const isolated = harvestIsolatedSignals();
      const globals = harvestMainSignals();

      const scanResult = evaluateSignals({
        url: 'https://brand-store.com',
        meta: isolated.meta,
        dom: isolated.dom,
        resources: isolated.resources,
        globals,
      });

      const shopify = scanResult.technologies.find((t) => t.id === 'shopify');
      expect(shopify).toBeDefined();
      expect(shopify?.version).toBe('12.0.0');
      expect(shopify?.confidenceTier).toBe('high');
      expect(shopify?.isInferred).toBe(false);
    });

    it('Scenario 4: Pure React SPA -> Probes harvest data-reactroot, React global -> React directly detected', () => {
      document.body.innerHTML = `
        <div id="root" data-reactroot="">
          <button>Click me</button>
        </div>
      `;

      // @ts-expect-error Mocking window global
      window.React = { version: '18.3.1' };

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { name: 'https://spa.com/static/js/bundle.js' } as PerformanceResourceTiming,
      ]);

      const isolated = harvestIsolatedSignals();
      const globals = harvestMainSignals();

      const scanResult = evaluateSignals({
        url: 'https://spa.com',
        meta: isolated.meta,
        dom: isolated.dom,
        resources: isolated.resources,
        globals,
      });

      const react = scanResult.technologies.find((t) => t.id === 'react');
      expect(react).toBeDefined();
      expect(react?.confidenceTier).toBe('high');
      expect(react?.version).toBe('18.3.1');
      expect(react?.isInferred).toBe(false); // Directly detected, NOT inferred!
    });

    it('Scenario 5: Plain HTML website -> Probes return empty frameworks -> Zero detections', () => {
      document.head.innerHTML = `
        <title>Plain Document</title>
        <meta name="description" content="Vanilla static page">
      `;
      document.body.innerHTML = `
        <header><h1>Welcome</h1></header>
        <p>Simple content with zero third-party tools.</p>
      `;

      // Clean window
      // @ts-expect-error Clean
      delete window.React;
      // @ts-expect-error Clean
      delete window.Shopify;
      // @ts-expect-error Clean
      delete window.wp;

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { name: 'https://plain.org/style.css' } as PerformanceResourceTiming,
      ]);

      const isolated = harvestIsolatedSignals();
      const globals = harvestMainSignals();

      const scanResult = evaluateSignals({
        url: 'https://plain.org',
        meta: isolated.meta,
        dom: isolated.dom,
        resources: isolated.resources,
        globals,
      });

      expect(scanResult.technologies).toEqual([]);
      expect(scanResult.stats.total).toBe(0);
    });

    it('Scenario 6: Multiple analytics scripts -> Probes harvest GA4, GTM, Hotjar -> All accurately detected with evidence', () => {
      document.body.innerHTML = `
        <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-12345"></iframe>
      `;

      // @ts-expect-error Mocking analytics globals
      window.google_tag_manager = {};
      // @ts-expect-error Mocking analytics globals
      window.dataLayer = [{ event: 'gtm.js' }];
      // @ts-expect-error Mocking analytics globals
      window.gtag = () => {};
      // @ts-expect-error Mocking analytics globals
      window.hj = () => {};
      // @ts-expect-error Mocking analytics globals
      window._hjSettings = { hjid: 123456 };

      vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
        { name: 'https://www.googletagmanager.com/gtm.js?id=GTM-12345' } as PerformanceResourceTiming,
        { name: 'https://www.google-analytics.com/g/collect?v=2' } as PerformanceResourceTiming,
        { name: 'https://static.hotjar.com/c/hotjar-123456.js?sv=6' } as PerformanceResourceTiming,
      ]);

      const isolated = harvestIsolatedSignals();
      const globals = harvestMainSignals();

      const scanResult = evaluateSignals({
        url: 'https://analytics-heavy.com',
        meta: isolated.meta,
        dom: isolated.dom,
        resources: isolated.resources,
        globals,
      });

      const ga = scanResult.technologies.find((t) => t.id === 'google-analytics');
      const gtm = scanResult.technologies.find((t) => t.id === 'google-tag-manager');
      const hotjar = scanResult.technologies.find((t) => t.id === 'hotjar');

      expect(ga).toBeDefined();
      expect(gtm).toBeDefined();
      expect(hotjar).toBeDefined();

      expect(ga?.confidenceTier).toBe('high');
      expect(gtm?.confidenceTier).toBe('high');
      expect(hotjar?.confidenceTier).toBe('high');
    });
  });

  describe('Storage & LRU Cache Lifecycle', () => {
    let mockStorage: Record<string, unknown> = {};

    beforeEach(() => {
      mockStorage = {};
      (global as unknown as { chrome: unknown }).chrome = {
        storage: {
          local: {
            get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
            set: vi.fn(async (obj: Record<string, unknown>) => {
              Object.assign(mockStorage, obj);
            }),
            remove: vi.fn(async (key: string) => {
              delete mockStorage[key];
            }),
          },
        },
      };
    });

    it('should save scan result and retrieve it from cache', async () => {
      const mockResult = {
        url: 'https://example.com/page',
        domain: 'example.com',
        timestamp: Date.now(),
        technologies: [],
        stats: { total: 0, high: 0, medium: 0, low: 0 },
        scanDurationMs: 0.5,
      };

      await saveScanToStorage(mockResult);

      const cached = await getCachedScan('https://example.com/another-page');
      expect(cached).toBeDefined();
      expect(cached?.domain).toBe('example.com');
    });

    it('should enforce 50-item LRU limit on history', async () => {
      // Insert 55 scans
      for (let i = 0; i < 55; i++) {
        await saveScanToStorage({
          url: `https://site-${i}.com`,
          domain: `site-${i}.com`,
          timestamp: Date.now() + i * 10,
          technologies: [],
          stats: { total: 0, high: 0, medium: 0, low: 0 },
          scanDurationMs: 0.1,
        });
      }

      const history = await getScanHistory();
      expect(history.length).toBe(50);
      // Most recent should be site-54
      expect(history[0].domain).toBe('site-54.com');
    });

    it('should clear history cleanly', async () => {
      await saveScanToStorage({
        url: 'https://temp.com',
        domain: 'temp.com',
        timestamp: Date.now(),
        technologies: [],
        stats: { total: 0, high: 0, medium: 0, low: 0 },
        scanDurationMs: 0.1,
      });

      await clearScanHistory();
      const history = await getScanHistory();
      expect(history).toEqual([]);
    });

    it('should normalize domains correctly', () => {
      expect(getDomainKey('https://WWW.Example.Com/path?arg=1')).toBe('www.example.com');
      expect(getDomainKey('shopify.com')).toBe('shopify.com');
    });
  });

  describe('Probe Serialization & Injection Self-Containment', () => {
    it('harvestIsolatedSignals should be 100% self-contained and execute from serialized string without closures', () => {
      // Chrome extensions convert func to string via Function.toString() and execute in target page context
      const fnString = harvestIsolatedSignals.toString();
      expect(fnString).toContain('function');

      // Execute in an isolated sandbox with no outer closure variables
      const isolatedRunner = new Function('return (' + fnString + ')()');
      const result = isolatedRunner();

      expect(result).toBeDefined();
      expect(Array.isArray(result.meta)).toBe(true);
      expect(Array.isArray(result.dom)).toBe(true);
      expect(Array.isArray(result.resources)).toBe(true);
      expect(typeof result.url).toBe('string');
    });

    it('harvestMainSignals should be 100% self-contained and execute from serialized string without closures', () => {
      const fnString = harvestMainSignals.toString();
      expect(fnString).toContain('function');

      // Mock a global on window
      (window as unknown as Record<string, unknown>).React = { version: '18.2.0' };
      (window as unknown as Record<string, unknown>).__next_f = [1, 2];

      const isolatedRunner = new Function('return (' + fnString + ')()');
      const result = isolatedRunner();

      expect(result).toBeDefined();
      expect(result.React).toEqual({ version: '18.2.0' });
      expect(result.__next_f).toEqual({ rscStream: true, chunkCount: 2 });
    });
  });

  describe('Probe Stylesheet Inspection & Security Resilience', () => {
    let originalStyleSheets: PropertyDescriptor | undefined;

    beforeEach(() => {
      originalStyleSheets = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets');
    });

    afterEach(() => {
      if (originalStyleSheets) {
        Object.defineProperty(Document.prototype, 'styleSheets', originalStyleSheets);
      } else {
        // @ts-expect-error cleanup
        delete document.styleSheets;
      }
      document.head.innerHTML = '';
      document.body.innerHTML = '';
    });

    it('harvests Tailwind signatures from accessible same-origin document.styleSheets', () => {
      const mockStyleSheet = {
        cssRules: [
          { cssText: '*,:after,:before{--tw-border-spacing-x:0;--tw-ring-offset-shadow:0 0 #0000;}' },
          { cssText: '@layer theme { :root { --default-font-family: Inter; } }' },
        ],
      };

      Object.defineProperty(document, 'styleSheets', {
        value: [mockStyleSheet],
        configurable: true,
      });

      const result = harvestIsolatedSignals();
      const selectors = result.dom.map((d) => d.selector);

      expect(selectors).toContain('style:has-text(--tw-)');
      expect(selectors).toContain('style:has-text(--tw-ring-offset-shadow)');
      expect(selectors).toContain('style:has-text(@layer theme)');
      expect(selectors).toContain('style:has-text(--default-font-family)');
    });

    it('preserves existing inline <style> tag detection', () => {
      const style = document.createElement('style');
      style.textContent = '*,:before{--tw-border-spacing-x:0;--tw-ring-offset-shadow:0 0 #0000;}';
      document.head.appendChild(style);

      const result = harvestIsolatedSignals();
      const selectors = result.dom.map((d) => d.selector);

      expect(selectors).toContain('style:has-text(--tw-)');
      expect(selectors).toContain('style:has-text(--tw-ring-offset-shadow)');
    });

    it('handles cross-origin SecurityError gracefully without crashing the probe', () => {
      const restrictedStyleSheet = {
        get cssRules(): CSSRuleList {
          throw new DOMException(
            "Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules",
            'SecurityError'
          );
        },
      };

      Object.defineProperty(document, 'styleSheets', {
        value: [restrictedStyleSheet],
        configurable: true,
      });

      // Must not throw and must return valid payload
      expect(() => {
        const result = harvestIsolatedSignals();
        expect(Array.isArray(result.dom)).toBe(true);
      }).not.toThrow();
    });

    it('deduplicates signatures across multiple stylesheets without producing duplicate DOM evidence', () => {
      const sheetA = {
        cssRules: [{ cssText: '*,:after{--tw-border-spacing-x:0;--tw-ring-offset-shadow:0 0 #0000;}' }],
      };
      const sheetB = {
        cssRules: [{ cssText: '.ring{--tw-ring-offset-shadow:0 0 #0000;--tw-border-spacing-x:0;}' }],
      };

      // Also add an inline style tag with the same needle
      const style = document.createElement('style');
      style.textContent = ':root{--tw-border-spacing-x:0;}';
      document.head.appendChild(style);

      Object.defineProperty(document, 'styleSheets', {
        value: [sheetA, sheetB],
        configurable: true,
      });

      const result = harvestIsolatedSignals();
      const twMatches = result.dom.filter((d) => d.selector === 'style:has-text(--tw-)');
      const twRingMatches = result.dom.filter((d) => d.selector === 'style:has-text(--tw-ring-offset-shadow)');

      // Must be deduplicated to exactly 1 match each
      expect(twMatches).toHaveLength(1);
      expect(twRingMatches).toHaveLength(1);
    });
  });
});
