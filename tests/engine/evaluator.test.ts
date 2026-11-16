import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

describe('Detection Engine Evaluator', () => {
  it('should detect Next.js with high confidence, extract version, and imply React', () => {
    const signals: HarvestedSignals = {
      url: 'https://vercel.com',
      globals: {
        __NEXT_DATA__: { buildId: 'xyz123', page: '/' },
        next: { version: '14.2.3' },
        va: {},
      },
      dom: [
        { selector: '#__next' },
        { selector: 'script#__NEXT_DATA__' },
      ],
      meta: [],
      resources: [
        'https://vercel.com/_next/static/chunks/main-app-123.js',
        'https://vercel.com/_next/static/chunks/framework-456.js',
        'https://vercel.com/_vercel/insights/script.js',
        'https://vercel.com/_vercel/speed-insights/v1/script.js',
      ],
      headers: {
        'x-vercel-id': 'iad1::xyz',
        server: 'Vercel',
      },
    };

    const result = evaluateSignals(signals);

    // Verify Next.js detected
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    expect(nextjs).toBeDefined();
    expect(nextjs?.name).toBe('Next.js');
    expect(nextjs?.version).toBe('14.2.3');
    expect(nextjs?.confidenceTier).toBe('high');
    expect(nextjs?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(nextjs?.evidence.length).toBeGreaterThanOrEqual(3);

    // Verify React implied
    const react = result.technologies.find((t) => t.id === 'react');
    expect(react).toBeDefined();
    expect(react?.name).toBe('React');

    // Verify Vercel detected (safely capped at Medium tier for telemetry signals)
    const vercel = result.technologies.find((t) => t.id === 'vercel');
    expect(vercel).toBeDefined();
    expect(vercel?.name).toBe('Vercel');
    expect(vercel?.confidenceTier).toBe('medium');
    expect(vercel?.confidenceScore).toBe(69);
  });

  it('should detect WordPress and WooCommerce with versions and jQuery', () => {
    const signals: HarvestedSignals = {
      url: 'https://example-store.com',
      globals: {
        wp: {},
        _wpemojiSettings: { baseUrl: 'https://s.w.org/images/core/emoji/' },
        woocommerce_params: { ajax_url: '/wp-admin/admin-ajax.php' },
        jQuery: { fn: { jquery: '3.7.1' } },
      },
      dom: [
        { selector: 'body.woocommerce' },
        { selector: 'link[rel*="https://api.w.org/"]' },
      ],
      meta: [
        { name: 'generator', content: 'WordPress 6.4.2' },
        { name: 'generator', content: 'WooCommerce 8.5.1' },
      ],
      resources: [
        'https://example-store.com/wp-content/themes/storefront/style.css',
        'https://example-store.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js',
        'https://example-store.com/wp-includes/js/jquery/jquery.min.js',
      ],
    };

    const result = evaluateSignals(signals);

    const wp = result.technologies.find((t) => t.id === 'wordpress');
    expect(wp).toBeDefined();
    expect(wp?.version).toBe('6.4.2');
    expect(wp?.confidenceTier).toBe('high');

    const woo = result.technologies.find((t) => t.id === 'woocommerce');
    expect(woo).toBeDefined();
    expect(woo?.version).toBe('8.5.1');
    expect(woo?.confidenceTier).toBe('high');

    const jq = result.technologies.find((t) => t.id === 'jquery');
    expect(jq).toBeDefined();
    expect(jq?.version).toBe('3.7.1');
    expect(jq?.confidenceTier).toBe('high');
  });

  it('should detect Shopify with Stripe and Google Analytics 4', () => {
    const signals: HarvestedSignals = {
      url: 'https://allbirds.com',
      globals: {
        Shopify: { theme: { name: 'Dawn', version: '12.0.0' } },
        ShopifyAnalytics: {},
        Stripe: {},
        gtag: () => {},
      },
      dom: [
        { selector: 'link[href*="cdn.shopify.com"]' },
        { selector: 'iframe[src*="js.stripe.com"]' },
      ],
      meta: [
        { name: 'shopify-digital-wallet', content: '' },
      ],
      resources: [
        'https://cdn.shopify.com/s/files/1/0123/t/1/assets/app.js',
        'https://js.stripe.com/v3/',
        'https://www.google-analytics.com/g/collect?v=2&tid=G-12345',
      ],
    };

    const result = evaluateSignals(signals);

    expect(result.technologies.some((t) => t.id === 'shopify')).toBe(true);
    expect(result.technologies.some((t) => t.id === 'stripe')).toBe(true);
    expect(result.technologies.some((t) => t.id === 'google-analytics')).toBe(true);
  });

  it('should detect Angular with version from ng-version attribute', () => {
    const signals: HarvestedSignals = {
      url: 'https://angular.dev',
      globals: {
        getAllAngularRootElements: () => [],
      },
      dom: [
        { selector: '[ng-version]', attribute: 'ng-version', value: '17.3.0' },
        { selector: 'app-root' },
      ],
      meta: [],
      resources: [],
    };

    const result = evaluateSignals(signals);
    const angular = result.technologies.find((t) => t.id === 'angular');
    expect(angular).toBeDefined();
    expect(angular?.version).toBe('17.3.0');
    expect(angular?.confidenceTier).toBe('high');
  });

  it('should boost confidence with cross-signal corroboration', () => {
    // Single signal: only resource
    const singleSignal: HarvestedSignals = {
      url: 'https://test.com',
      globals: {},
      dom: [],
      meta: [],
      resources: ['https://js.stripe.com/v3/'],
    };
    const singleResult = evaluateSignals(singleSignal);
    const singleStripe = singleResult.technologies.find((t) => t.id === 'stripe');

    // Dual signals: resource + global
    const dualSignals: HarvestedSignals = {
      url: 'https://test.com',
      globals: { Stripe: {} },
      dom: [],
      meta: [],
      resources: ['https://js.stripe.com/v3/'],
    };
    const dualResult = evaluateSignals(dualSignals);
    const dualStripe = dualResult.technologies.find((t) => t.id === 'stripe');

    expect(singleStripe).toBeDefined();
    expect(dualStripe).toBeDefined();
    expect(dualStripe!.confidenceScore).toBeGreaterThan(singleStripe!.confidenceScore);
  });
});
