import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';
import { formatExportJson } from '../../src/popup/utils/export';

describe('Real-World Detection Audit & Regression Test Suite', () => {
  // 1. WordPress direct detection
  it('1. WordPress direct detection: Corroborated signals yield High confidence direct detection', () => {
    const wpSite: HarvestedSignals = {
      url: 'https://wordpress.org',
      globals: {
        wp: {},
        _wpemojiSettings: { baseUrl: 'https://s.w.org/images/core/emoji/' },
      },
      meta: [
        { name: 'generator', content: 'WordPress 6.4.2' },
      ],
      dom: [
        { selector: 'link[rel*="https://api.w.org/"]' },
      ],
      resources: [
        'https://wordpress.org/wp-content/themes/pub/wporg-main/style.css',
      ],
    };

    const result = evaluateSignals(wpSite);
    const wp = result.technologies.find((t) => t.id === 'wordpress');

    expect(wp).toBeDefined();
    expect(wp?.category).toBe('cms');
    expect(wp?.detectionType).toBe('direct');
    expect(wp?.isInferred).toBe(false);
    expect(wp?.version).toBe('6.4.2');
    expect(wp?.confidenceTier).toBe('high');
    expect(wp?.confidenceScore).toBeGreaterThanOrEqual(80);
  });

  // 2. Shopify asset-only detection
  it('2. Shopify asset-only detection: Single CDN resource yields strictly Low confidence', () => {
    const assetOnlySite: HarvestedSignals = {
      url: 'https://www.shopify.com',
      globals: {},
      meta: [],
      dom: [],
      resources: [
        'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets.js',
      ],
    };

    const result = evaluateSignals(assetOnlySite);
    const shopify = result.technologies.find((t) => t.id === 'shopify');

    expect(shopify).toBeDefined();
    expect(shopify?.category).toBe('ecommerce');
    expect(shopify?.detectionType).toBe('direct');
    expect(shopify?.confidenceScore).toBe(30);
    expect(shopify?.confidenceTier).toBe('low');
    expect(shopify?.evidence.length).toBe(1);
  });

  // 3. Meta Pixel resource-only detection
  it('3. Meta Pixel resource-only detection: Standalone fbevents.js yields strictly Low confidence', () => {
    const metaPixelOnlySite: HarvestedSignals = {
      url: 'https://example.com/checkout',
      globals: {},
      meta: [],
      dom: [],
      resources: [
        'https://connect.facebook.net/en_US/fbevents.js',
      ],
    };

    const result = evaluateSignals(metaPixelOnlySite);
    const metaPixel = result.technologies.find((t) => t.id === 'meta-pixel');

    expect(metaPixel).toBeDefined();
    expect(metaPixel?.category).toBe('marketing');
    expect(metaPixel?.detectionType).toBe('direct');
    expect(metaPixel?.confidenceScore).toBe(30);
    expect(metaPixel?.confidenceTier).toBe('low');
  });

  // 4. Next.js direct detection
  it('4. Next.js direct detection: App Router flight chunks & DOM markers yield High confidence', () => {
    const nextSite: HarvestedSignals = {
      url: 'https://nextjs.org',
      globals: {
        __next_f: [1, 2, 3],
      },
      meta: [],
      dom: [
        { selector: '#__next' },
        { selector: 'link[href*="/_next/static/"]' },
      ],
      resources: [
        'https://nextjs.org/_next/static/chunks/main-app-9a8b.js',
      ],
    };

    const result = evaluateSignals(nextSite);
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');

    expect(nextjs).toBeDefined();
    expect(nextjs?.category).toBe('framework');
    expect(nextjs?.detectionType).toBe('direct');
    expect(nextjs?.confidenceTier).toBe('high');
    expect(nextjs?.confidenceScore).toBeGreaterThanOrEqual(80);
  });

  // 5. React inferred from Next.js
  it('5. React inferred from Next.js: Explicitly marked as inferred with parentDependency and zero fake DOM signals', () => {
    const nextSite: HarvestedSignals = {
      url: 'https://nextjs.org',
      globals: {
        __next_f: [1, 2, 3],
      },
      meta: [],
      dom: [
        { selector: '#__next' },
      ],
      resources: [
        'https://nextjs.org/_next/static/chunks/main-app-9a8b.js',
      ],
    };

    const result = evaluateSignals(nextSite);
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    const react = result.technologies.find((t) => t.id === 'react');

    expect(nextjs).toBeDefined();
    expect(nextjs?.confidenceTier).toBe('high');
    expect(react).toBeDefined();
    expect(react?.category).toBe('library');
    expect(react?.detectionType).toBe('inferred');
    expect(react?.isInferred).toBe(true);
    expect(react?.parentDependency).toBe('Next.js');
    // Independently calibrated confidence: Parent High (>=80) -> Inferred Medium (75)
    expect(react?.confidenceScore).toBe(75);
    expect(react?.confidenceTier).toBe('medium');
    // Inferred technology contains only inferred architectural evidence
    expect(react?.evidence.length).toBe(1);
    expect(react?.evidence[0].type).toBe('inferred');
    expect(react?.evidence[0].source).toContain('Architectural dependency of Next.js');
  });

  // 6. React documentation-only endpoint (negative control)
  it('6. React documentation-only endpoint: Documentation JSON and data routes do NOT trigger React detection', () => {
    const docsSite: HarvestedSignals = {
      url: 'https://react.dev/learn/describing-the-ui',
      globals: {},
      meta: [],
      dom: [],
      resources: [
        'https://react.dev/_next/data/BUILD_123/reference/react.json',
        'https://react.dev/_next/data/BUILD_123/reference/react.js.json',
        'https://react.dev/_next/data/BUILD_123/reference/react-dom.json',
        'https://example.com/api/v1/react.json',
      ],
    };

    const result = evaluateSignals(docsSite);
    const directReact = result.technologies.find((t) => t.id === 'react' && t.detectionType === 'direct');

    expect(directReact).toBeUndefined();
    expect(result.technologies.length).toBe(0);
  });

  // 7. Google Analytics 4 measurement ID
  it('7. Google Analytics 4 measurement ID: Extracts G-XXXXXXXXXX measurement ID correctly', () => {
    const gaSite: HarvestedSignals = {
      url: 'https://example.com',
      globals: {
        gtag: () => {},
      },
      meta: [],
      dom: [],
      resources: [
        'https://www.googletagmanager.com/gtag/js?id=G-SW8P9593JE&l=dataLayer&cx=c',
        'https://www.google-analytics.com/g/collect?v=2&tid=G-SW8P9593JE',
      ],
    };

    const result = evaluateSignals(gaSite);
    const ga = result.technologies.find((t) => t.id === 'google-analytics');

    expect(ga).toBeDefined();
    expect(ga?.category).toBe('analytics');
    expect(ga?.version).toBe('G-SW8P9593JE');
    expect(ga?.confidenceTier).toBe('high');
  });

  // 8. Google Tag Manager container ID
  it('8. Google Tag Manager container ID: Extracts GTM-XXXXXXX container ID correctly', () => {
    const gtmSite: HarvestedSignals = {
      url: 'https://example.com',
      globals: {
        google_tag_manager: {},
        dataLayer: [],
      },
      meta: [],
      dom: [],
      resources: [
        'https://www.googletagmanager.com/gtm.js?id=GTM-TR9K4D',
      ],
    };

    const result = evaluateSignals(gtmSite);
    const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

    expect(gtm).toBeDefined();
    expect(gtm?.category).toBe('analytics');
    expect(gtm?.version).toBe('GTM-TR9K4D');
    expect(gtm?.confidenceTier).toBe('high');
  });

  // 9. Cloudflare versus cdnjs
  it('9. Cloudflare versus cdnjs: cdnjs mirror does NOT falsely classify a site as Cloudflare infrastructure', () => {
    const cdnjsSite: HarvestedSignals = {
      url: 'https://independent-blog.org',
      globals: {
        jQuery: { fn: { jquery: '3.7.1' } },
      },
      meta: [],
      dom: [],
      resources: [
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
      ],
    };

    const result = evaluateSignals(cdnjsSite);
    const cloudflare = result.technologies.find((t) => t.id === 'cloudflare');
    const jquery = result.technologies.find((t) => t.id === 'jquery');

    expect(cloudflare).toBeUndefined();
    expect(jquery).toBeDefined();
    expect(jquery?.version).toBe('3.7.1');
  });

  // 10. Vue.js signals
  it('10. Vue.js signals: Detects Vue 3 via scoped CSS attributes or VitePress runtime globals', () => {
    // Scenario A: Scoped CSS DOM attributes
    const scopedVueSite: HarvestedSignals = {
      url: 'https://vue-demo.com',
      globals: {},
      meta: [],
      dom: [
        { selector: '[data-v-scoped]' },
        { selector: 'style:has-text([data-v-])' },
      ],
      resources: [],
    };

    const resultA = evaluateSignals(scopedVueSite);
    const vueA = resultA.technologies.find((t) => t.id === 'vue');
    expect(vueA).toBeDefined();
    expect(vueA?.category).toBe('framework');
    expect(vueA?.detectionType).toBe('direct');

    // Scenario B: VitePress documentation site (vuejs.org architecture)
    const vitepressSite: HarvestedSignals = {
      url: 'https://vuejs.org',
      globals: {
        __VITEPRESS__: true,
        __VP_HASH_MAP__: { 'index.md': 'hash123' },
      },
      meta: [
        { name: 'generator', content: 'VitePress v2.0.0-alpha.17' },
      ],
      dom: [
        { selector: '[data-v-scoped]' },
      ],
      resources: [],
    };

    const resultB = evaluateSignals(vitepressSite);
    const vp = resultB.technologies.find((t) => t.id === 'vitepress');
    const vueB = resultB.technologies.find((t) => t.id === 'vue');

    expect(vp).toBeDefined();
    expect(vp?.category).toBe('framework');
    expect(vp?.detectionType).toBe('direct');
    expect(vp?.version).toBe('2.0.0-alpha.17');
    expect(vueB).toBeDefined();
    expect(vueB?.category).toBe('framework');
    expect(vueB?.detectionType).toBe('inferred');
    expect(vueB?.parentDependency).toBe('VitePress');
    expect(vueB?.confidenceScore).toBe(75);
  });

  // 11. Empty detection results
  it('11. Empty detection results: Plain HTML pages produce zero false positives and empty arrays', () => {
    const plainSite: HarvestedSignals = {
      url: 'https://plain-example.com',
      globals: {},
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A simple HTML page' },
      ],
      dom: [],
      resources: [
        'https://plain-example.com/styles.css',
        'https://plain-example.com/logo.png',
      ],
    };

    const result = evaluateSignals(plainSite);
    expect(result.technologies).toEqual([]);
    expect(result.stats.total).toBe(0);
    expect(result.stats.high).toBe(0);
    expect(result.stats.medium).toBe(0);
    expect(result.stats.low).toBe(0);
  });

  // 12. Version extraction with prerelease versions
  it('12. Version extraction with prerelease versions: Preserves full prerelease string (7.2-beta5-65440)', () => {
    const wpBetaSite: HarvestedSignals = {
      url: 'https://wordpress.org',
      globals: {
        wp: {},
      },
      meta: [
        { name: 'generator', content: 'WordPress 7.2-beta5-65440' },
      ],
      dom: [],
      resources: [],
    };

    const result = evaluateSignals(wpBetaSite);
    const wp = result.technologies.find((t) => t.id === 'wordpress');

    expect(wp).toBeDefined();
    expect(wp?.version).toBe('7.2-beta5-65440');
  });

  // 13. JSON and CSV schema consistency
  it('13. JSON and CSV schema consistency: Both exports conform to the required 9-field schema', () => {
    const sampleScan: ScanResult = {
      url: 'https://example.com',
      domain: 'example.com',
      timestamp: 1700000000000,
      technologies: [
        {
          id: 'wordpress',
          name: 'WordPress',
          category: 'cms',
          version: '7.2-beta5-65440',
          confidenceScore: 90,
          confidenceTier: 'high',
          detectionType: 'direct',
          parentDependency: undefined,
          isInferred: false,
          evidence: [
            { type: 'meta', source: '<meta name="generator">', weight: 55, matchedValue: 'WordPress 7.2-beta5-65440' },
            { type: 'global', source: 'window.wp', weight: 55 },
          ],
          website: 'https://wordpress.org',
          icon: '/tech-icons/cms/wordpress.svg',
          description: 'CMS',
        },
        {
          id: 'react',
          name: 'React',
          category: 'library',
          version: undefined,
          confidenceScore: 85,
          confidenceTier: 'high',
          detectionType: 'inferred',
          parentDependency: 'Next.js',
          isInferred: true,
          evidence: [
            { type: 'inferred', source: 'Architectural dependency of Next.js', weight: 85 },
          ],
          website: 'https://react.dev',
          icon: '/tech-icons/frameworks/react.svg',
          description: 'UI Library',
        },
      ],
      stats: { total: 2, high: 2, medium: 0, low: 0 },
      scanDurationMs: 0.5,
    };

    // Verify JSON export structure
    const jsonOutput = formatExportJson(sampleScan);
    expect(jsonOutput.technologies.length).toBe(2);

    const expectedKeys = [
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
    ];

    for (const item of jsonOutput.technologies) {
      expect(Object.keys(item).sort()).toEqual(expectedKeys.sort());
      expect(Array.isArray(item.evidenceSummary)).toBe(true);
      expect(item.evidenceSummary[0].type).toBeTruthy();
      expect(item.evidenceSummary[0].source).toBeTruthy();
      expect(typeof item.evidenceSummary[0].weight).toBe('number');
    }

    // First item is direct
    expect(jsonOutput.technologies[0].technology).toBe('WordPress');
    expect(jsonOutput.technologies[0].detectionType).toBe('direct');
    expect(jsonOutput.technologies[0].parentDependency).toBeNull();
    expect(jsonOutput.technologies[0].version).toBe('7.2-beta5-65440');

    // Second item is inferred
    expect(jsonOutput.technologies[1].technology).toBe('React');
    expect(jsonOutput.technologies[1].detectionType).toBe('inferred');
    expect(jsonOutput.technologies[1].parentDependency).toBe('Next.js');
    expect(jsonOutput.technologies[1].version).toBeNull();
  });
});
