import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';
import { formatExportJson } from '../../src/popup/utils/export';

describe('Stage 3: Scoring & Evidence Deduplication Polish Suite', () => {
  // 1. Evidence Deduplication: Correlated resources from same origin/path
  it('1. Resource Deduplication: Multiple bundle chunks from same CDN origin do not stack arbitrarily', () => {
    // 10 different chunk URLs from the same Next.js static chunk directory
    const manyChunksSite: HarvestedSignals = {
      url: 'https://example.com',
      globals: {},
      dom: [],
      meta: [],
      resources: [
        'https://example.com/_next/static/chunks/main-1.js',
        'https://example.com/_next/static/chunks/main-2.js',
        'https://example.com/_next/static/chunks/main-3.js',
        'https://example.com/_next/static/chunks/main-4.js',
        'https://example.com/_next/static/chunks/main-5.js',
        'https://example.com/_next/static/chunks/main-6.js',
        'https://example.com/_next/static/chunks/main-7.js',
        'https://example.com/_next/static/chunks/main-8.js',
      ],
    };

    const result = evaluateSignals(manyChunksSite);
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');

    expect(nextjs).toBeDefined();
    // In Stage 3, resource class alone is capped at 50, and secondary URLs from same bundle base get diminished weight (+5 max)
    expect(nextjs?.confidenceScore).toBeLessThanOrEqual(50);
    // Standalone network assets without globals or DOM cannot achieve High confidence
    expect(nextjs?.confidenceTier).not.toBe('high');
    expect(nextjs?.confidenceReason).toContain('Low confidence');
  });

  // 2. High confidence strictly requires multi-class corroboration
  it('2. Multi-Class Corroboration: High confidence requires independent signal classes', () => {
    // Site with only 1 class (only globals: 2 globals)
    const globalsOnlySite: HarvestedSignals = {
      url: 'https://example.com',
      globals: {
        __NEXT_DATA__: {},
        __next_f: { rscStream: true },
      },
      dom: [],
      meta: [],
      resources: [],
    };

    const resultGlobalsOnly = evaluateSignals(globalsOnlySite);
    const nextGlobalsOnly = resultGlobalsOnly.technologies.find((t) => t.id === 'nextjs');

    expect(nextGlobalsOnly).toBeDefined();
    // A single class is capped at 60 points -> Medium tier, NOT High
    expect(nextGlobalsOnly?.confidenceScore).toBe(60);
    expect(nextGlobalsOnly?.confidenceTier).toBe('medium');

    // Now add a second independent signal class (DOM element)
    const multiClassSite: HarvestedSignals = {
      url: 'https://example.com',
      globals: {
        __NEXT_DATA__: {},
        __next_f: { rscStream: true },
      },
      dom: [
        { selector: '#__next' },
      ],
      meta: [],
      resources: [],
    };

    const resultMultiClass = evaluateSignals(multiClassSite);
    const nextMultiClass = resultMultiClass.technologies.find((t) => t.id === 'nextjs');

    expect(nextMultiClass).toBeDefined();
    // 60 (globals) + 35 (dom) = 95 -> High tier (>= 80)
    expect(nextMultiClass?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(nextMultiClass?.confidenceTier).toBe('high');
    expect(nextMultiClass?.confidenceReason).toContain('Corroborated across 2 independent signal classes');
  });

  // 3. Independent confidence calibration for inferred technologies
  it('3. Inferred Calibration: Inferred React does not equal parent Next.js score', () => {
    // High-confidence Next.js site (score >= 80)
    const highNextSite: HarvestedSignals = {
      url: 'https://nextjs.org',
      globals: {
        __next_f: { rscStream: true },
      },
      dom: [
        { selector: 'meta[name="next-head-count"]' },
      ],
      meta: [],
      resources: [
        'https://nextjs.org/_next/static/chunks/app.js',
      ],
    };

    const result = evaluateSignals(highNextSite);
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    const react = result.technologies.find((t) => t.id === 'react');

    expect(nextjs).toBeDefined();
    expect(nextjs?.confidenceTier).toBe('high');
    expect(nextjs?.detectionType).toBe('direct');

    expect(react).toBeDefined();
    expect(react?.detectionType).toBe('inferred');
    expect(react?.isInferred).toBe(true);
    // Inferred React is independently calibrated to Medium (75), NOT High (>=80)
    expect(react?.confidenceScore).toBe(75);
    expect(react?.confidenceTier).toBe('medium');
    expect(react?.parentDependency).toBe('Next.js');
    expect(nextjs?.dependentTechnologies).toContain('React');
    expect(react?.confidenceReason).toContain('Architectural dependency: Inferred with medium confidence (75 pts)');
  });

  // 4. VitePress and Vue inference vs direct
  it('4. VitePress & Vue: VitePress is directly detected and Vue is inferred unless independent Vue evidence exists', () => {
    // Case A: Pure VitePress site with scoped CSS (like vuejs.org)
    const vitepressOnlySite: HarvestedSignals = {
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

    const resultA = evaluateSignals(vitepressOnlySite);
    const vpA = resultA.technologies.find((t) => t.id === 'vitepress');
    const vueA = resultA.technologies.find((t) => t.id === 'vue');

    expect(vpA).toBeDefined();
    expect(vpA?.detectionType).toBe('direct');
    expect(vpA?.version).toBe('2.0.0-alpha.17');
    expect(vpA?.confidenceTier).toBe('high');

    expect(vueA).toBeDefined();
    expect(vueA?.detectionType).toBe('inferred');
    expect(vueA?.parentDependency).toBe('VitePress');
    expect(vueA?.confidenceScore).toBe(75);
    expect(vueA?.confidenceTier).toBe('medium');

    // Case B: Site with VitePress AND direct independent Vue runtime global
    const vitepressWithVueRuntime: HarvestedSignals = {
      url: 'https://custom-vue-docs.com',
      globals: {
        __VITEPRESS__: true,
        __VP_HASH_MAP__: {},
        Vue: { version: '3.5.12' },
      },
      meta: [
        { name: 'generator', content: 'VitePress v2.0.0' },
      ],
      dom: [],
      resources: [],
    };

    const resultB = evaluateSignals(vitepressWithVueRuntime);
    const vpB = resultB.technologies.find((t) => t.id === 'vitepress');
    const vueB = resultB.technologies.find((t) => t.id === 'vue');

    expect(vpB?.detectionType).toBe('direct');
    // Because Vue had direct window.Vue evidence, it is direct!
    expect(vueB?.detectionType).toBe('direct');
    expect(vueB?.isInferred).toBe(false);
    expect(vueB?.version).toBe('3.5.12');
  });

  // 5. Human-readable explainable confidence reasons
  it('5. Human-Readable Justifications: Populates confidenceReason for High, Medium, Low, and Inferred', () => {
    // 1. Direct Low
    const lowSite: HarvestedSignals = {
      url: 'https://shopify-cdn-user.com',
      globals: {},
      dom: [],
      meta: [],
      resources: ['https://cdn.shopify.com/s/files/1/01/script.js'],
    };
    const resLow = evaluateSignals(lowSite);
    const shopifyLow = resLow.technologies.find((t) => t.id === 'shopify');
    expect(shopifyLow?.confidenceReason).toMatch(/Low confidence \(Direct\)/);
    expect(shopifyLow?.confidenceReason).toContain('without corroborating runtime globals or DOM elements');

    // 2. Direct High
    const highSite: HarvestedSignals = {
      url: 'https://angular.dev',
      globals: {
        ng: {},
      },
      dom: [
        { selector: '[ng-version]', attribute: 'ng-version', value: '22.2.6+sha-22b7937' },
      ],
      meta: [],
      resources: [],
    };
    const resHigh = evaluateSignals(highSite);
    const angularHigh = resHigh.technologies.find((t) => t.id === 'angular');
    expect(angularHigh?.confidenceReason).toMatch(/High confidence \(Direct\)/);
    expect(angularHigh?.confidenceReason).toContain('Corroborated across 2 independent signal classes (global, dom)');

    // 3. Export formatting retains confidenceReason
    const jsonOutput = formatExportJson(resHigh);
    expect(jsonOutput.technologies[0].confidenceReason).toBe(angularHigh?.confidenceReason);
  });
});
