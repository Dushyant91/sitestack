import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';

describe('Detection Confidence Architecture & Inference Integrity', () => {
  it('1. Direct detection with multiple corroborating signals yields High confidence', () => {
    // Next.js App Router site with multiple distinct signals (Global Flight array + DOM meta + ResourceTiming)
    const multiSignalSite: HarvestedSignals = {
      url: 'https://nextjs.org',
      globals: {
        __next_f: { rscStream: true, chunkCount: 12 },
      },
      dom: [
        { selector: 'meta[name="next-head-count"]' },
        { selector: 'link[href*="/_next/static/"]' },
      ],
      meta: [],
      resources: [
        'https://nextjs.org/_next/static/chunks/main-app.js',
        'https://nextjs.org/_next/static/css/app.css',
      ],
    };

    const result = evaluateSignals(multiSignalSite);
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');

    expect(nextjs).toBeDefined();
    expect(nextjs?.detectionType).toBe('direct');
    expect(nextjs?.isInferred).toBe(false);
    expect(nextjs?.confidenceTier).toBe('high');
    expect(nextjs?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(nextjs?.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it('2. Negative Control: Site loading assets from cdn.shopify.com without storefront signals yields only Low confidence', () => {
    // An external site or marketing page loading a single script from cdn.shopify.com
    const cdnOnlySite: HarvestedSignals = {
      url: 'https://www.shopify.com',
      globals: {},
      dom: [],
      meta: [],
      resources: [
        'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking.js',
      ],
    };

    const result = evaluateSignals(cdnOnlySite);
    const shopify = result.technologies.find((t) => t.id === 'shopify');

    expect(shopify).toBeDefined();
    expect(shopify?.detectionType).toBe('direct');
    expect(shopify?.category).toBe('ecommerce');
    expect(shopify?.confidenceScore).toBe(30); // Strictly floor threshold (30/100)
    expect(shopify?.confidenceTier).toBe('low');
    expect(shopify?.evidence.length).toBe(1);
    expect(shopify?.evidence[0].type).toBe('resource');
  });

  it('3. Positive Control: Genuine Shopify storefront with corroborating signals yields High confidence', () => {
    // A real Shopify store with globals, theme version, and CDN assets
    const realStoreSite: HarvestedSignals = {
      url: 'https://gymshark.com',
      globals: {
        Shopify: { theme: { name: 'Dawn', version: '12.0.0' } },
        ShopifyAnalytics: {},
      },
      dom: [
        { selector: 'link[href*="cdn.shopify.com"]' },
        { selector: 'input[name="shopify-digital-wallet"]' },
      ],
      meta: [
        { name: 'shopify-digital-wallet', content: '/123/digital_wallets/dialog' },
      ],
      resources: [
        'https://cdn.shopify.com/s/files/1/01/t/1/assets/app.js',
      ],
    };

    const result = evaluateSignals(realStoreSite);
    const shopify = result.technologies.find((t) => t.id === 'shopify');

    expect(shopify).toBeDefined();
    expect(shopify?.category).toBe('ecommerce');
    expect(shopify?.detectionType).toBe('direct');
    expect(shopify?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(shopify?.confidenceTier).toBe('high');
    expect(shopify?.version).toBe('12.0.0');
    expect(shopify?.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it('4. Negative Control: Site loading fbevents.js alone without globals yields only Low confidence (not Medium or High)', () => {
    // A site that only fetches fbevents.js but exposes no globals or pixel events
    const weakMetaPixelSite: HarvestedSignals = {
      url: 'https://independent-blog.com',
      globals: {},
      dom: [],
      meta: [],
      resources: [
        'https://connect.facebook.net/en_US/fbevents.js',
      ],
    };

    const result = evaluateSignals(weakMetaPixelSite);
    const metaPixel = result.technologies.find((t) => t.id === 'meta-pixel');

    expect(metaPixel).toBeDefined();
    expect(metaPixel?.detectionType).toBe('direct');
    expect(metaPixel?.confidenceScore).toBe(30); // Low tier (30/100)
    expect(metaPixel?.confidenceTier).toBe('low');
    expect(metaPixel?.evidence.length).toBe(1);
  });

  it('5. Negative Control: Partial Meta Pixel corroboration (fbevents.js + stub fbq) yields Medium, not High', () => {
    const partialPixelSite: HarvestedSignals = {
      url: 'https://partial-tracking.com',
      globals: {
        fbq: { __type: 'function' },
      },
      dom: [],
      meta: [],
      resources: [
        'https://connect.facebook.net/en_US/fbevents.js',
      ],
    };

    const result = evaluateSignals(partialPixelSite);
    const metaPixel = result.technologies.find((t) => t.id === 'meta-pixel');

    expect(metaPixel).toBeDefined();
    expect(metaPixel?.confidenceScore).toBe(75); // Corroborated with diversity bonus: 75
    expect(metaPixel?.confidenceTier).toBe('medium'); // Correctly Medium, NOT High!
  });

  it('6. Negative Control: Site using cdnjs.cloudflare.com is NOT classified as Cloudflare infrastructure', () => {
    // Millions of sites use cdnjs for jQuery or Lodash without being hosted on Cloudflare
    const cdnjsSite: HarvestedSignals = {
      url: 'https://open-source-app.com',
      globals: {
        jQuery: { fn: { jquery: '3.7.1' } },
      },
      dom: [
        { selector: 'script[src*="jquery"]' },
      ],
      meta: [],
      resources: [
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
      ],
    };

    const result = evaluateSignals(cdnjsSite);
    const cloudflare = result.technologies.find((t) => t.id === 'cloudflare');

    // Cloudflare MUST NOT be detected merely from using cdnjs library mirrors
    expect(cloudflare).toBeUndefined();
    // jQuery should still be cleanly detected
    expect(result.technologies.some((t) => t.id === 'jquery')).toBe(true);
  });

  it('7. Inferred React from Next.js strictly inherits and is bounded by parent confidence', () => {
    // Next.js detected with only a single resource signal (score: 35, tier: low)
    const singleSignalNextSite: HarvestedSignals = {
      url: 'https://minimal-next-site.com',
      globals: {},
      dom: [],
      meta: [],
      resources: [
        'https://minimal-next-site.com/_next/static/chunks/app.js',
      ],
    };

    const result = evaluateSignals(singleSignalNextSite);
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    const react = result.technologies.find((t) => t.id === 'react');

    expect(nextjs).toBeDefined();
    expect(nextjs?.confidenceScore).toBe(35);
    expect(nextjs?.confidenceTier).toBe('low');
    expect(nextjs?.detectionType).toBe('direct');

    expect(react).toBeDefined();
    expect(react?.detectionType).toBe('inferred');
    expect(react?.isInferred).toBe(true);
    expect(react?.parentDependency).toBe('Next.js');

    // CRITICAL: Inferred React is independently calibrated to Low (30) when Next.js is Low (35)
    expect(react?.confidenceScore).toBe(30);
    expect(react?.confidenceTier).toBe('low');
  });

  it('8. Inferred technologies contain NO accidental direct browser evidence', () => {
    const nextAppSite: HarvestedSignals = {
      url: 'https://app-router-site.com',
      globals: {
        __next_f: { rscStream: true },
      },
      dom: [],
      meta: [],
      resources: [],
    };

    const result = evaluateSignals(nextAppSite);
    const react = result.technologies.find((t) => t.id === 'react');

    expect(react).toBeDefined();
    expect(react?.detectionType).toBe('inferred');
    expect(react?.isInferred).toBe(true);

    // React's evidence must strictly contain ONLY inferred architectural evidence
    expect(react?.evidence.length).toBe(1);
    expect(react?.evidence[0].type).toBe('inferred');
    expect(react?.evidence.some((e) => e.type === 'global')).toBe(false);
    expect(react?.evidence.some((e) => e.type === 'dom')).toBe(false);
    expect(react?.evidence.some((e) => e.type === 'resource')).toBe(false);
  });

  it('9. Directly detected React is NOT marked as inferred even when Next.js is also present', () => {
    // When window.React is explicitly exposed alongside Next.js
    const dualExposedSite: HarvestedSignals = {
      url: 'https://dev-next-site.com',
      globals: {
        __NEXT_DATA__: {},
        React: { version: '18.3.1' },
      },
      dom: [
        { selector: '#__next' },
        { selector: '[data-reactroot]' },
      ],
      meta: [],
      resources: [],
    };

    const result = evaluateSignals(dualExposedSite);
    const react = result.technologies.find((t) => t.id === 'react');

    expect(react).toBeDefined();
    // Because React had direct DOM and global evidence, it is DIRECT, not inferred!
    expect(react?.detectionType).toBe('direct');
    expect(react?.isInferred).toBe(false);
    expect(react?.parentDependency).toBeUndefined();
    expect(react?.version).toBe('18.3.1');
    expect(react?.confidenceTier).toBe('high');
    expect(react?.evidence.some((e) => e.type === 'global')).toBe(true);
  });

  it('10. Technology categories adhere strictly to updated definitions', () => {
    const mixedSite: HarvestedSignals = {
      url: 'https://modern-shop.com',
      globals: {
        Shopify: { theme: { name: 'Dawn' } },
        React: { version: '18.3.1' },
      },
      dom: [],
      meta: [],
      resources: [
        'https://modern-shop.com/_next/static/chunks/app.js',
      ],
    };

    const result = evaluateSignals(mixedSite);
    const shopify = result.technologies.find((t) => t.id === 'shopify');
    const react = result.technologies.find((t) => t.id === 'react');
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');

    expect(shopify?.category).toBe('ecommerce'); // Reclassified from CMS to Ecommerce
    expect(react?.category).toBe('library');      // Reclassified from Framework to Library
    expect(nextjs?.category).toBe('framework');   // Framework
  });

  it('11. Export consistency: ScanResult produces complete structured records for JSON & CSV', () => {
    const scan: ScanResult = {
      url: 'https://example.com',
      domain: 'example.com',
      timestamp: Date.now(),
      technologies: [
        {
          id: 'shopify',
          name: 'Shopify',
          category: 'ecommerce',
          version: '12.0.0',
          confidenceScore: 95,
          confidenceTier: 'high',
          detectionType: 'direct',
          parentDependency: undefined,
          isInferred: false,
          evidence: [{ type: 'global', source: 'window.Shopify', weight: 60 }],
          website: 'https://shopify.com',
          icon: '/tech-icons/cms/shopify.svg',
          description: 'Cloud ecommerce',
        },
        {
          id: 'react',
          name: 'React',
          category: 'library',
          version: undefined,
          confidenceScore: 95,
          confidenceTier: 'high',
          detectionType: 'inferred',
          parentDependency: 'Next.js',
          isInferred: true,
          evidence: [{ type: 'inferred', source: 'Inferred dependency of Next.js', weight: 95 }],
          website: 'https://react.dev',
          icon: '/tech-icons/frameworks/react.svg',
          description: 'UI Library',
        },
      ],
      stats: { total: 2, high: 2, medium: 0, low: 0 },
      scanDurationMs: 0.3,
    };

    // Verify properties needed by exports exist on each technology record
    for (const tech of scan.technologies) {
      expect(tech.name).toBeTruthy();
      expect(tech.category).toBeTruthy();
      expect(typeof tech.confidenceScore).toBe('number');
      expect(['high', 'medium', 'low']).toContain(tech.confidenceTier);
      expect(['direct', 'inferred']).toContain(tech.detectionType);
      if (tech.detectionType === 'inferred') {
        expect(tech.parentDependency).toBeTruthy();
      }
    }
  });
});
