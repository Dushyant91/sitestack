import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

describe('SiteStack Schema Authoritative Scoring Policy Enforcement Suite', () => {
  // =========================================================================
  // 1. Google Tag Manager Weak-Authoritative Protection
  // =========================================================================
  it('1. GTM gtm.js + dataLayer without window.google_tag_manager is capped at weakAuthoritativeCeiling (69 Medium)', () => {
    const signals: HarvestedSignals = {
      url: 'https://client-portal.com',
      globals: { dataLayer: [] },
      resources: ['https://www.googletagmanager.com/gtm.js?id=GTM-CLIENT1'],
      dom: [],
      meta: [],
    };
    const result = evaluateSignals(signals);
    const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

    expect(gtm).toBeDefined();
    // Raw score was 81 (base 70 * 1.15 bonus), but capped at 69 Medium due to lack of direct authoritative runtime global
    expect(gtm?.confidenceScore).toBe(69);
    expect(gtm?.confidenceTier).toBe('medium');
    expect(gtm?.detectionType).toBe('direct');
    expect(gtm?.version).toBe('GTM-CLIENT1');
    expect(gtm?.confidenceReason).toContain('capped at 69 pts because Requires Google Tag Manager runtime global or script.');
  });

  // =========================================================================
  // 2. Google Tag Manager with Authoritative Runtime Evidence
  // =========================================================================
  it('2. GTM with authoritative runtime global window.google_tag_manager reaches High tier (100%)', () => {
    const signals: HarvestedSignals = {
      url: 'https://ecommerce-store.com',
      globals: {
        google_tag_manager: {},
        dataLayer: [],
      },
      resources: ['https://www.googletagmanager.com/gtm.js?id=GTM-ECOMM99'],
      dom: [{ selector: 'iframe[src*="googletagmanager.com/ns.html"]' }],
      meta: [],
    };
    const result = evaluateSignals(signals);
    const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

    expect(gtm).toBeDefined();
    expect(gtm?.confidenceScore).toBe(100);
    expect(gtm?.confidenceTier).toBe('high');
    expect(gtm?.version).toBe('GTM-ECOMM99');
  });

  // =========================================================================
  // 3. dataLayer Alone
  // =========================================================================
  it('3. dataLayer alone without container script or runtime global is suppressed below noise floor', () => {
    const signals: HarvestedSignals = {
      url: 'https://generic-site.com',
      globals: { dataLayer: [] },
      resources: [],
      dom: [],
      meta: [],
    };
    const result = evaluateSignals(signals);
    const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

    // Weight 25 < 30 noise floor -> suppressed
    expect(gtm).toBeUndefined();
  });

  // =========================================================================
  // 4. GA4 Standard Evidence Preserved
  // =========================================================================
  it('4. GA4 standard evidence preserves expected confidence and does not falsely trigger GTM', () => {
    const signals: HarvestedSignals = {
      url: 'https://ga4-only-app.com',
      globals: { gtag: () => {} },
      resources: ['https://www.googletagmanager.com/gtag/js?id=G-GA4MEASURE1'],
      dom: [],
      meta: [],
    };
    const result = evaluateSignals(signals);
    const ga4 = result.technologies.find((t) => t.id === 'google-analytics');
    const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

    expect(ga4).toBeDefined();
    expect(ga4?.version).toBe('G-GA4MEASURE1');
    expect(ga4?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(ga4?.confidenceTier).toBe('high');
    // GTM must remain undefined
    expect(gtm).toBeUndefined();
  });

  // =========================================================================
  // 5. WordPress Benchmark P02 & P03 Expectations Preserved
  // =========================================================================
  it('5. WordPress benchmark P02 and P03 patterns preserve High confidence tier', () => {
    // P03 pattern: make.wordpress.org with wp global (wt: 55) and generator meta (wt: 55)
    const p03Signals: HarvestedSignals = {
      url: 'https://make.wordpress.org',
      globals: { wp: {} },
      meta: [{ name: 'generator', content: 'WordPress 7.2-beta5-65440' }],
      dom: [],
      resources: [],
    };
    const p03Result = evaluateSignals(p03Signals);
    const wpP03 = p03Result.technologies.find((t) => t.id === 'wordpress');

    expect(wpP03).toBeDefined();
    expect(wpP03?.confidenceTier).toBe('high');
    expect(wpP03?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(wpP03?.version).toBe('7.2-beta5-65440');

    // P02 pattern: Enterprise WordPress VIP with _wpemojiSettings and REST API
    const p02Signals: HarvestedSignals = {
      url: 'https://techcrunch.com',
      globals: { _wpemojiSettings: {} },
      meta: [],
      dom: [{ selector: 'link[rel*="https://api.w.org/"]' }],
      resources: ['https://techcrunch.com/wp-content/themes/vip/style.css'],
    };
    const p02Result = evaluateSignals(p02Signals);
    const wpP02 = p02Result.technologies.find((t) => t.id === 'wordpress');

    expect(wpP02).toBeDefined();
    expect(wpP02?.confidenceTier).toBe('high');
    expect(wpP02?.confidenceScore).toBeGreaterThanOrEqual(80);
  });

  // =========================================================================
  // 6. Next.js Standard Runtime / Resource Evidence Preserved
  // =========================================================================
  it('6. Next.js standard runtime and resource evidence preserves High tier', () => {
    const signals: HarvestedSignals = {
      url: 'https://nextjs-showcase.com',
      globals: { __NEXT_DATA__: {} },
      resources: [
        'https://nextjs-showcase.com/_next/static/chunks/main-app.js',
        'https://nextjs-showcase.com/_next/static/css/app.css',
      ],
      dom: [{ selector: '#__next' }],
      meta: [],
    };
    const result = evaluateSignals(signals);
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');

    expect(nextjs).toBeDefined();
    expect(nextjs?.confidenceTier).toBe('high');
    expect(nextjs?.confidenceScore).toBeGreaterThanOrEqual(90);
  });

  // =========================================================================
  // 7. Non-Opted-In Technologies Maintain Unchanged Behavior
  // =========================================================================
  it('7. Technologies without requireAuthoritativeScopeForHigh (e.g. Hotjar) retain standard scoring', () => {
    const signals: HarvestedSignals = {
      url: 'https://hotjar-user.com',
      globals: { hj: () => {} },
      resources: ['https://static.hotjar.com/c/hotjar-777.js?sv=6'],
      dom: [],
      meta: [],
    };
    const result = evaluateSignals(signals);
    const hj = result.technologies.find((t) => t.id === 'hotjar');

    expect(hj).toBeDefined();
    expect(hj?.confidenceTier).toBe('high');
    expect(hj?.confidenceScore).toBeGreaterThanOrEqual(80);
  });
});
