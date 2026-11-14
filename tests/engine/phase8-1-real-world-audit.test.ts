import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';
import { normalizeScanUrl } from '../../src/extension/storage/history';
import { formatExportCsv, formatExportJson } from '../../src/popup/utils/export';

describe('Phase 8.1: Real Website Validation & Detection Engine Audit Suite', () => {

  // =========================================================================
  // 1. REACT DEVTOOLS CONTROLLED TESTS
  // =========================================================================
  // =========================================================================
  // 1. REACT DEVTOOLS CONTROLLED TESTS (5 SCENARIOS & EVIDENCE CLASSIFICATION)
  // =========================================================================
  describe('1. React DevTools Controlled Verification (5 Matrix Scenarios)', () => {
    // Scenario 1: Profile with React DevTools + React website -> React detected
    it('Scenario 1: Profile with React DevTools + React website -> React detected', () => {
      const reactDevSite: HarvestedSignals = {
        url: 'https://react.dev',
        globals: {
          React: { version: '18.3.1' },
          __REACT_DEVTOOLS_GLOBAL_HOOK__: { active: true },
        },
        dom: [{ selector: '[data-reactroot]' }],
        meta: [],
        resources: ['https://react.dev/react.production.min.js'],
      };

      const result = evaluateSignals(reactDevSite);
      const react = result.technologies.find((t) => t.id === 'react');

      expect(react).toBeDefined();
      expect(react?.detectionType).toBe('direct');
      expect(react?.version).toBe('18.3.1');
      expect(react?.confidenceTier).toBe('high');
      expect(react?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    // Scenario 2: Profile with React DevTools + non-React website -> React NOT detected
    it('Scenario 2: Profile with React DevTools + non-React website (Amazon.in) -> React NOT detected', () => {
      const amazonWithDevTools: HarvestedSignals = {
        url: 'https://www.amazon.in',
        globals: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: { active: true },
        },
        dom: [],
        meta: [],
        resources: [
          'https://images-eu.ssl-images-amazon.com/images/G/31/gno/sprites/nav-sprite-global.png',
        ],
      };

      const result = evaluateSignals(amazonWithDevTools);
      const react = result.technologies.find((t) => t.id === 'react');

      expect(react).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    // Scenario 3: Clean profile + React website -> React detected
    it('Scenario 3: Clean profile (no DevTools) + React website -> React detected', () => {
      const reactCleanProfile: HarvestedSignals = {
        url: 'https://react.dev',
        globals: {
          React: { version: '18.3.1' },
        },
        dom: [{ selector: '[data-reactroot]' }],
        meta: [],
        resources: ['https://react.dev/react.production.min.js'],
      };

      const result = evaluateSignals(reactCleanProfile);
      const react = result.technologies.find((t) => t.id === 'react');

      expect(react).toBeDefined();
      expect(react?.detectionType).toBe('direct');
      expect(react?.version).toBe('18.3.1');
      expect(react?.confidenceTier).toBe('high');
    });

    // Scenario 4: Clean profile + non-React website -> React NOT detected
    it('Scenario 4: Clean profile (no DevTools) + non-React website (Amazon.in) -> React NOT detected', () => {
      const amazonClean: HarvestedSignals = {
        url: 'https://www.amazon.in',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          'https://images-eu.ssl-images-amazon.com/images/G/31/gno/sprites/nav-sprite-global.png',
        ],
      };

      const result = evaluateSignals(amazonClean);
      expect(result.technologies.find((t) => t.id === 'react')).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    // Scenario 5: Profile with React DevTools + website with only React DevTools hook -> React NOT detected
    it('Scenario 5: Profile with React DevTools + website with only hook -> React NOT detected (suppressed below noise floor)', () => {
      const hookOnlySite: HarvestedSignals = {
        url: 'https://example-blog.org',
        globals: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: { renderers: {}, sub: () => {} },
        },
        dom: [],
        meta: [],
        resources: ['https://example-blog.org/style.css'],
      };

      const result = evaluateSignals(hookOnlySite);
      const react = result.technologies.find((t) => t.id === 'react');

      // Hook alone has weight 25 < 30 noise floor, so it MUST be suppressed to 0 detections
      expect(react).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    it('1.6. Medium.com with React DevTools hook yields ZERO React detections and preserves GA4 + Cloudflare', () => {
      const mediumSite: HarvestedSignals = {
        url: 'https://medium.com',
        globals: {
          __REACT_DEVTOOLS_GLOBAL_HOOK__: { active: true },
          gtag: () => {},
        },
        dom: [],
        meta: [],
        resources: [
          'https://www.googletagmanager.com/gtag/js?id=G-12345ABCDE',
          'https://static.cloudflareinsights.com/beacon.min.js',
        ],
      };

      const result = evaluateSignals(mediumSite);
      expect(result.technologies.find((t) => t.id === 'react')).toBeUndefined();
      expect(result.technologies.find((t) => t.id === 'google-analytics')).toBeDefined();
      expect(result.technologies.find((t) => t.id === 'cloudflare')).toBeDefined();
    });

    it('1.7. Notion.com: Next.js implies React at 75 Medium Inferred despite DevTools hook presence', () => {
      const notionSite: HarvestedSignals = {
        url: 'https://www.notion.com',
        globals: {
          __next_f: [1, 2, 3],
          next: { version: '16.4.2' },
          __REACT_DEVTOOLS_GLOBAL_HOOK__: { active: true },
        },
        dom: [
          { selector: '#__next' },
        ],
        meta: [],
        resources: [
          'https://www.notion.com/_next/static/chunks/main-app.js',
        ],
      };

      const result = evaluateSignals(notionSite);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      const react = result.technologies.find((t) => t.id === 'react');

      expect(nextjs).toBeDefined();
      expect(nextjs?.version).toBe('16.4.2');
      expect(nextjs?.confidenceTier).toBe('high');

      // React MUST be Inferred from Next.js, NOT reported as direct Low
      expect(react).toBeDefined();
      expect(react?.detectionType).toBe('inferred');
      expect(react?.isInferred).toBe(true);
      expect(react?.parentDependency).toBe('Next.js');
      expect(react?.confidenceScore).toBe(75);
      expect(react?.confidenceTier).toBe('medium');
    });

    it('1.8. Evidence Classification: Global properties are correctly described as runtime globals, not network assets', () => {
      const globalOnlySite: HarvestedSignals = {
        url: 'https://example.com',
        globals: {
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: [],
      };

      const result = evaluateSignals(globalOnlySite);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceTier).toBe('low');
      // Must NOT describe global as a "standalone network asset"
      expect(vercel?.confidenceReason).toContain('Identified via runtime global (window.si)');
      expect(vercel?.confidenceReason).not.toContain('standalone network asset');
    });
  });

  // =========================================================================
  // 2. INFRASTRUCTURE & PLATFORM EVIDENCE (CLOUDFLARE, VERCEL, SHOPIFY)
  // =========================================================================
  describe('2. Infrastructure & Platform Evidence Separation', () => {
    it('2.1. Cloudflare on Medium.com: Standalone beacon yields Low tier and clear telemetry disclaimer', () => {
      const mediumCloudflare: HarvestedSignals = {
        url: 'https://medium.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://static.cloudflareinsights.com/beacon.min.js'],
      };

      const result = evaluateSignals(mediumCloudflare);
      const cf = result.technologies.find((t) => t.id === 'cloudflare');

      expect(cf).toBeDefined();
      expect(cf?.confidenceScore).toBe(45);
      expect(cf?.confidenceTier).toBe('low');
      expect(cf?.confidenceReason).toContain('Identified via standalone network asset');
      expect(cf?.confidenceReason).toContain('without corroborating runtime globals or DOM elements');
      expect(cf?.confidenceReason).toContain('not confirmed Cloudflare hosting or DNS infrastructure');
    });

    it('2.2. Notion.com: window.si alone yields Low tier (45) with explicit telemetry non-hosting disclaimer', () => {
      const notionAmbiguousSi: HarvestedSignals = {
        url: 'https://www.notion.com',
        globals: {
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: [],
      };

      const result = evaluateSignals(notionAmbiguousSi);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(45);
      expect(vercel?.confidenceTier).toBe('low');
      expect(vercel?.confidenceReason).toContain('Identified via runtime global (window.si)');
      expect(vercel?.confidenceReason).toContain('indicates Vercel Speed Insights / Analytics telemetry, not confirmed Vercel deployment or cloud hosting');
    });

    it('2.3. Vercel with verified script and telemetry global achieves High confidence', () => {
      const verifiedVercelSite: HarvestedSignals = {
        url: 'https://my-app.vercel.app',
        globals: {
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: [
          'https://my-app.vercel.app/_vercel/speed-insights/v1/script.js',
        ],
      };

      const result = evaluateSignals(verifiedVercelSite);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceTier).toBe('high');
      expect(vercel?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('2.4. Shopify on Shopify.com: Standalone CDN asset yields Low tier with clear storefront disclaimer', () => {
      const shopifyMarketing: HarvestedSignals = {
        url: 'https://www.shopify.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets.js',
        ],
      };

      const result = evaluateSignals(shopifyMarketing);
      const shopify = result.technologies.find((t) => t.id === 'shopify');

      expect(shopify).toBeDefined();
      expect(shopify?.confidenceScore).toBe(30);
      expect(shopify?.confidenceTier).toBe('low');
      expect(shopify?.confidenceReason).toContain('Identified via standalone network asset');
      expect(shopify?.confidenceReason).toContain('without corroborating runtime globals or DOM elements');
      expect(shopify?.confidenceReason).toContain('Observed cdn.shopify.com asset indicates Shopify-hosted asset/CDN, not an active Shopify storefront');
    });
  });

  // =========================================================================
  // 3. OTHER DETECTIONS (GA4, GTM, WORDPRESS, JQUERY, YOUTUBE)
  // =========================================================================
  describe('3. Validation of Real-World Site Scans', () => {
    it('3.1. GA4 vs GTM: Does not confuse GA4 G- ID with GTM GTM- ID', () => {
      const ga4Only: HarvestedSignals = {
        url: 'https://example.com',
        globals: { gtag: () => {} },
        dom: [],
        meta: [],
        resources: ['https://www.googletagmanager.com/gtag/js?id=G-ABC123456'],
      };

      const result = evaluateSignals(ga4Only);
      const ga4 = result.technologies.find((t) => t.id === 'google-analytics');
      const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

      expect(ga4).toBeDefined();
      expect(ga4?.version).toBe('G-ABC123456');
      expect(gtm).toBeUndefined();
    });

    it('3.2. WordPress.com: Detects WordPress 100 High and jQuery 60 Medium with runtime version 1.12.4', () => {
      const wpSite: HarvestedSignals = {
        url: 'https://wordpress.com',
        globals: {
          wp: {},
          _wpemojiSettings: { baseUrl: 'https://s.w.org/images/core/emoji/' },
          jQuery: { fn: { jquery: '1.12.4' } },
        },
        meta: [{ name: 'generator', content: 'WordPress.com' }],
        dom: [{ selector: 'link[rel*="https://api.w.org/"]' }],
        resources: ['https://wordpress.com/wp-content/themes/pub/style.css'],
      };

      const result = evaluateSignals(wpSite);
      const wp = result.technologies.find((t) => t.id === 'wordpress');
      const jq = result.technologies.find((t) => t.id === 'jquery');

      expect(wp).toBeDefined();
      expect(wp?.confidenceTier).toBe('high');
      expect(wp?.confidenceScore).toBe(100);

      expect(jq).toBeDefined();
      expect(jq?.confidenceTier).toBe('medium');
      expect(jq?.version).toBe('1.12.4');
    });

    it('3.3. YouTube.com produces exactly ZERO detections (True Negative)', () => {
      const youtubeSignals: HarvestedSignals = {
        url: 'https://www.youtube.com',
        globals: {},
        dom: [],
        meta: [{ name: 'referrer', content: 'origin-when-cross-origin' }],
        resources: [
          'https://www.youtube.com/s/desktop/xyz/jsbin/desktop_polymer.js',
          'https://i.ytimg.com/generate_204',
        ],
      };

      const result = evaluateSignals(youtubeSignals);
      expect(result.technologies.length).toBe(0);
      expect(result.stats.total).toBe(0);
    });
  });

  // =========================================================================
  // 4. URL NORMALIZATION & PRIVACY AUDIT
  // =========================================================================
  describe('4. URL Normalization & Privacy Policy', () => {
    it('4.1. Strips tracking query parameters (utm_source=chatgpt.com, gclid, fbclid) while preserving path', () => {
      const raw = 'https://shopify.com/store/checkout?utm_source=chatgpt.com&utm_medium=referral&fbclid=IwAR123#payment-step';
      const clean = normalizeScanUrl(raw);
      expect(clean).toBe('https://shopify.com/store/checkout');
    });

    it('4.2. Strips sensitive token and auth parameters while preserving legitimate app query parameters', () => {
      const raw = 'https://example.com/app?page=2&token=secret123&session=abc456';
      const clean = normalizeScanUrl(raw);
      expect(clean).toBe('https://example.com/app?page=2');
    });

    it('4.3. Preserves clean origin and pathname for standard URLs', () => {
      const raw = 'https://nextjs.org/docs/app/building-your-application/routing';
      const clean = normalizeScanUrl(raw);
      expect(clean).toBe('https://nextjs.org/docs/app/building-your-application/routing');
    });
  });

  // =========================================================================
  // 5. EXPORT AUDIT: JSON & CSV VALIDATION
  // =========================================================================
  describe('5. JSON and CSV Export Implementation Audit', () => {
    const sampleScan: ScanResult = {
      url: 'https://shopify.com/store?utm_source=chatgpt.com#header',
      domain: 'shopify.com',
      timestamp: 1731580000000,
      scanDurationMs: 1.45,
      technologies: [
        {
          id: 'meta-pixel',
          name: 'Meta Pixel',
          category: 'marketing',
          confidenceScore: 91,
          confidenceTier: 'high',
          detectionType: 'direct',
          isInferred: false,
          confidenceReason: 'High confidence (Direct): Corroborated across 2 independent signal classes.',
          evidence: [
            { type: 'global', source: 'window.fbq', weight: 35, matchedValue: 'function()' },
            { type: 'resource', source: 'https://connect.facebook.net/en_US/fbevents.js', weight: 30 },
          ],
          website: 'https://www.facebook.com/business/tools/meta-pixel',
          icon: '',
          description: '',
        },
        {
          id: 'react',
          name: 'React',
          category: 'library',
          version: '18.3.1',
          confidenceScore: 75,
          confidenceTier: 'medium',
          detectionType: 'inferred',
          parentDependency: 'Next.js',
          isInferred: true,
          confidenceReason: 'Architectural dependency: Inferred because Next.js requires React.',
          evidence: [
            { type: 'inferred', source: 'Architectural dependency of Next.js', weight: 75 },
          ],
          website: 'https://react.dev',
          icon: '',
          description: '',
        },
      ],
      stats: { total: 2, high: 1, medium: 1, low: 0 },
    };

    it('5.1. CSV contains exactly 10 headers and every data row contains exactly 10 fields', () => {
      const csv = formatExportCsv(sampleScan);
      const lines = csv.split('\r\n').filter((l) => l.trim().length > 0);

      // Header row
      expect(lines.length).toBe(3); // 1 header + 2 technology rows
      const headerLine = lines[0];
      const headers = headerLine.split(',');

      expect(headers).toEqual([
        'technology',
        'category',
        'version',
        'confidenceScore',
        'confidenceTier',
        'detectionType',
        'parentDependency',
        'confidenceReason',
        'evidenceSummary',
        'website',
      ]);
      expect(headers.length).toBe(10);

      // Simple regex-based CSV row splitter respecting double quotes
      for (let i = 1; i < lines.length; i++) {
        // Match comma-separated values where values are quoted
        const matches = lines[i].match(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g);
        expect(matches).toBeDefined();
        expect(matches?.length).toBe(10);
      }
    });

    it('5.2. Handles commas, quotes, and newlines in CSV without delimiter corruption', () => {
      const trickyScan: ScanResult = {
        url: 'https://tricky.com',
        domain: 'tricky.com',
        timestamp: Date.now(),
        scanDurationMs: 0.8,
        technologies: [
          {
            id: 'custom-tech',
            name: 'Custom, "Tech" & Framework',
            category: 'library',
            version: '2.0, build "Alpha"',
            confidenceScore: 80,
            confidenceTier: 'high',
            detectionType: 'direct',
            isInferred: false,
            confidenceReason: 'Reason with "quotes", commas, and\nnewlines.',
            evidence: [
              { type: 'dom', source: 'div[data-role="banner, header"]', weight: 50 },
            ],
            website: 'https://example.com',
            icon: '',
            description: '',
          },
        ],
        stats: { total: 1, high: 1, medium: 0, low: 0 },
      };

      const csv = formatExportCsv(trickyScan);
      expect(csv).toContain('"Custom, ""Tech"" & Framework"');
      expect(csv).toContain('"2.0, build ""Alpha"""');
      expect(csv).toContain('"Reason with ""quotes"", commas, and\nnewlines."');
    });

    it('5.3. Empty scan exports valid CSV (10 headers, 0 data rows) and valid empty JSON array', () => {
      const emptyScan: ScanResult = {
        url: 'https://www.youtube.com',
        domain: 'youtube.com',
        timestamp: Date.now(),
        scanDurationMs: 0.45,
        technologies: [],
        stats: { total: 0, high: 0, medium: 0, low: 0 },
      };

      const csv = formatExportCsv(emptyScan);
      const csvLines = csv.split('\r\n').filter((l) => l.trim().length > 0);
      expect(csvLines.length).toBe(1); // Headers only
      expect(csvLines[0].split(',').length).toBe(10);

      const json = formatExportJson(emptyScan);
      expect(json.technologies).toEqual([]);
      expect(json.url).toBe('https://www.youtube.com/');
      const parsed = JSON.parse(JSON.stringify(json));
      expect(parsed.technologies).toEqual([]);
    });

    it('5.4. Exported evidence never contains placeholder "{...}"', () => {
      const scanWithObjectVal: ScanResult = {
        url: 'https://example.com',
        domain: 'example.com',
        timestamp: Date.now(),
        scanDurationMs: 1.0,
        technologies: [
          {
            id: 'shopify',
            name: 'Shopify',
            category: 'ecommerce',
            confidenceScore: 85,
            confidenceTier: 'high',
            detectionType: 'direct',
            isInferred: false,
            evidence: [
              { type: 'global', source: 'window.Shopify', weight: 60, matchedValue: '{"theme":{"name":"Dawn"}}' },
            ],
            website: 'https://shopify.com',
            icon: '',
            description: '',
          },
        ],
        stats: { total: 1, high: 1, medium: 0, low: 0 },
      };

      const json = formatExportJson(scanWithObjectVal);
      const jsonStr = JSON.stringify(json);
      expect(jsonStr).not.toContain('"{...}"');

      const csv = formatExportCsv(scanWithObjectVal);
      expect(csv).not.toContain('"{...}"');
    });

    it('5.5. JSON and CSV represent the exact same detections with matching counts and normalized URL', () => {
      const json = formatExportJson(sampleScan);
      const csv = formatExportCsv(sampleScan);

      expect(json.url).toBe('https://shopify.com/store'); // Stripped tracking query param
      expect(json.technologies.length).toBe(sampleScan.technologies.length);

      const csvRows = csv.split('\r\n').filter((l) => l.trim().length > 0);
      expect(csvRows.length - 1).toBe(sampleScan.technologies.length);

      for (let i = 0; i < sampleScan.technologies.length; i++) {
        expect(json.technologies[i].technology).toBe(sampleScan.technologies[i].name);
        expect(csvRows[i + 1]).toContain(`"${sampleScan.technologies[i].name}"`);
      }
    });
  });
});
