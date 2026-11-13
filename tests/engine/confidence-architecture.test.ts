import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

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
    // Multiple independent signal types matched
    expect(nextjs?.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it('2. Direct detection with only one weak signal yields Low confidence', () => {
    // A site that only loads the external fbevents.js script but exposes no globals or pixel events
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
    expect(metaPixel?.isInferred).toBe(false);
    expect(metaPixel?.confidenceTier).toBe('low');
    expect(metaPixel?.confidenceScore).toBe(35); // Firmly in Low tier (35/100)
    expect(metaPixel?.evidence.length).toBe(1);
    expect(metaPixel?.evidence[0].type).toBe('resource');
  });

  it('3. Inferred React from Next.js strictly inherits and is bounded by parent confidence', () => {
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

    // CRITICAL: React must NOT be promoted to Medium (60) when Next.js is Low (35)
    expect(react?.confidenceScore).toBeLessThanOrEqual(nextjs!.confidenceScore);
    expect(react?.confidenceTier).toBe('low');
  });

  it('4. Inferred technologies contain NO accidental direct browser evidence', () => {
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

  it('5. Directly detected React is NOT marked as inferred even when Next.js is also present', () => {
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

  it('6. Technology categories adhere strictly to updated definitions', () => {
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
});
