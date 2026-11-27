import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
// @ts-expect-error jsdom declaration
import { JSDOM } from 'jsdom';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

/**
 * Loads an HTML fixture into an isolated JSDOM instance,
 * parses meta, DOM, resources, and window globals, and evaluates the stack.
 */
function runFixtureScan(fixtureName: string): ReturnType<typeof evaluateSignals> {
  const filePath = path.resolve(__dirname, '../fixtures', fixtureName);
  const html = fs.readFileSync(filePath, 'utf-8');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://example.com/test-fixture',
  });

  const doc = dom.window.document;

  // 1. Extract meta tags
  const meta: HarvestedSignals['meta'] = [];
  doc.querySelectorAll('meta').forEach((el: Element) => {
    const name = el.getAttribute('name') || undefined;
    const property = el.getAttribute('property') || undefined;
    const content = el.getAttribute('content') || '';
    if (name || property) {
      meta.push({
        name: name ? name.toLowerCase() : undefined,
        property: property ? property.toLowerCase() : undefined,
        content,
      });
    }
  });

  // 2. Extract DOM probe selectors
  const PROBE_SELECTORS = [
    '#__next',
    'script#__NEXT_DATA__',
    'meta[name="next-head-count"]',
    'link[href*="/_next/static/"]',
    '[data-reactroot]',
    '[data-reactid]',
    '[data-react-checksum]',
    '[ng-version]',
    'app-root',
    'adev-root',
    '[ng-app]',
    '[ng-server-context]',
    '[data-v-app]',
    'body.woocommerce',
    'body.woocommerce-page',
    '.woocommerce',
    'html[data-wf-page]',
    'html[data-wf-site]',
    'link[href*="cdn.shopify.com"]',
    'link[rel*="https://api.w.org/"]',
    'link[rel="EditURI"][type="application/rsd+xml"]',
    'link[href*="bootstrap"]',
    'input[name="shopify-digital-wallet"]',
    'iframe[src*="js.stripe.com"]',
    'script[src*="js.stripe.com"]',
    'iframe[src*="checkout.razorpay.com"]',
    'iframe[src*="googletagmanager.com/ns.html"]',
    'script[src*="jquery"]',
  ];

  const harvestedDom: HarvestedSignals['dom'] = [];
  for (const sel of PROBE_SELECTORS) {
    const el = doc.querySelector(sel);
    if (el) {
      harvestedDom.push({
        selector: sel,
        attribute: sel === '[ng-version]' ? 'ng-version' : undefined,
        value: sel === '[ng-version]' ? el.getAttribute('ng-version') || undefined : undefined,
      });
    }
  }

  // Scoped CSS in style tags
  doc.querySelectorAll('style').forEach((st: Element) => {
    const text = st.textContent || '';
    if (text.includes('--tw-')) harvestedDom.push({ selector: 'style:has-text(--tw-)' });
    if (text.includes('--tw-ring-offset-shadow')) harvestedDom.push({ selector: 'style:has-text(--tw-ring-offset-shadow)' });
    if (/\[data-v-[a-f0-9]+\]/i.test(text)) harvestedDom.push({ selector: 'style:has-text([data-v-])' });
  });

  // Scoped CSS attributes on #app container
  const appContainer = doc.querySelector('#app, [id="__nuxt"], [data-v-app]');
  if (appContainer) {
    const attrs = Array.from(appContainer.attributes) as Attr[];
    const children = Array.from(appContainer.children) as Element[];
    const hasScoped = attrs.some((a) => a.name.startsWith('data-v-')) ||
      children.slice(0, 15).some((child) =>
        (Array.from(child.attributes) as Attr[]).some((a) => a.name.startsWith('data-v-'))
      );
    if (hasScoped) harvestedDom.push({ selector: '[data-v-scoped]' });
  }

  // 3. Extract resources from link and script elements
  const resources: string[] = [];
  doc.querySelectorAll('script[src], link[href]').forEach((el: Element) => {
    const src = el.getAttribute('src') || el.getAttribute('href');
    if (src && !src.startsWith('data:') && !src.startsWith('#')) {
      resources.push(src.startsWith('http') || src.startsWith('/') ? src : `https://example.com/${src}`);
    }
  });

  // 4. Harvest MAIN globals from dom.window
  const APPROVED_GLOBALS = [
    'wp', '_wpemojiSettings', 'Shopify', 'ShopifyAnalytics', 'BOOMR', 'Webflow',
    'wixBiSession', 'wixPerformanceMeasurements', '__NEXT_DATA__', '__next_f', '__next_p',
    'next', 'React', '__REACT_DEVTOOLS_GLOBAL_HOOK__', 'Vue', '__VUE__',
    '__VUE_DEVTOOLS_GLOBAL_HOOK__', '__VP_HASH_MAP__', '__VITEPRESS__', 'ng',
    'getAllAngularRootElements', 'jQuery', '$', 'bootstrap', 'gtag', 'gaGlobal',
    'google_tag_data', 'google_tag_manager', 'dataLayer', 'hj', '_hjSettings',
    'fbq', '_fbq', '_hsq', 'HubSpotConversations', 'Intercom', 'intercomSettings',
    'woocommerce_params', 'wc_cart_fragments_params', 'Stripe', 'Razorpay',
    '__cfRLUnblockHandlers', 'va', 'si'
  ];

  const globals: Record<string, unknown> = {};
  for (const k of APPROVED_GLOBALS) {
    const val = (dom.window as unknown as Record<string, unknown>)[k];
    if (val !== undefined && val !== null) {
      if (k === '__next_f') {
        globals[k] = { rscStream: true, chunkCount: Array.isArray(val) ? val.length : 1 };
      } else if (k === '__NEXT_DATA__') {
        globals[k] = val;
      } else if (k === 'React' || k === 'Vue' || k === 'next') {
        globals[k] = val;
      } else if (k === 'Shopify') {
        globals[k] = val;
      } else if (typeof val === 'function') {
        globals[k] = { __type: 'function' };
      } else {
        globals[k] = val;
      }
    }
  }

  const combinedSignals: HarvestedSignals = {
    url: 'https://example.com/test-fixture',
    meta,
    dom: harvestedDom,
    resources,
    globals,
  };

  return evaluateSignals(combinedSignals);
}

describe('15 Local HTML Fixture Validation Suite', () => {
  // Fixture 1: WordPress Core
  it('Fixture 1 (wordpress-core.html): Detects WordPress 6.4.2 without confusing Gutenberg plugin version', () => {
    const result = runFixtureScan('wordpress-core.html');
    const wp = result.technologies.find((t) => t.id === 'wordpress');

    expect(wp).toBeDefined();
    expect(wp?.category).toBe('cms');
    expect(wp?.version).toBe('6.4.2');
    expect(wp?.confidenceTier).toBe('high');
    expect(wp?.detectionType).toBe('direct');
  });

  // Fixture 2: WordPress Prerelease
  it('Fixture 2 (wordpress-prerelease.html): Extracts WordPress 7.2-beta5-65440 with full prerelease info', () => {
    const result = runFixtureScan('wordpress-prerelease.html');
    const wp = result.technologies.find((t) => t.id === 'wordpress');

    expect(wp).toBeDefined();
    expect(wp?.version).toBe('7.2-beta5-65440');
  });

  // Fixture 3: Shopify Storefront
  it('Fixture 3 (shopify-storefront.html): Detects genuine Shopify storefront with High confidence', () => {
    const result = runFixtureScan('shopify-storefront.html');
    const shopify = result.technologies.find((t) => t.id === 'shopify');

    expect(shopify).toBeDefined();
    expect(shopify?.category).toBe('ecommerce');
    expect(shopify?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(shopify?.confidenceTier).toBe('high');
  });

  // Fixture 4: Shopify Asset-Only
  it('Fixture 4 (shopify-asset-only.html): Brochure assets alone yield strictly Low confidence (30 pts)', () => {
    const result = runFixtureScan('shopify-asset-only.html');
    const shopify = result.technologies.find((t) => t.id === 'shopify');

    expect(shopify).toBeDefined();
    expect(shopify?.category).toBe('ecommerce');
    expect(shopify?.confidenceScore).toBe(30);
    expect(shopify?.confidenceTier).toBe('low');
  });

  // Fixture 5: Next.js App Router
  it('Fixture 5 (nextjs-app-router.html): Detects Next.js via __next_f and implies React without DOM claims', () => {
    const result = runFixtureScan('nextjs-app-router.html');
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');
    const react = result.technologies.find((t) => t.id === 'react');

    expect(nextjs).toBeDefined();
    expect(nextjs?.confidenceTier).toBe('high');
    expect(nextjs?.detectionType).toBe('direct');

    expect(react).toBeDefined();
    expect(react?.detectionType).toBe('inferred');
    expect(react?.parentDependency).toBe('Next.js');
    expect(react?.evidence[0].type).toBe('inferred');
  });

  // Fixture 6: Next.js Pages Router
  it('Fixture 6 (nextjs-pages-router.html): Detects Next.js 14.2.3 and does not use buildId as version', () => {
    const result = runFixtureScan('nextjs-pages-router.html');
    const nextjs = result.technologies.find((t) => t.id === 'nextjs');

    expect(nextjs).toBeDefined();
    expect(nextjs?.version).toBe('14.2.3');
    expect(nextjs?.version).not.toBe('prod-build-99');
  });

  // Fixture 7: React Standalone
  it('Fixture 7 (react-standalone.html): Directly detected React with version 18.3.1', () => {
    const result = runFixtureScan('react-standalone.html');
    const react = result.technologies.find((t) => t.id === 'react');

    expect(react).toBeDefined();
    expect(react?.detectionType).toBe('direct');
    expect(react?.isInferred).toBe(false);
    expect(react?.version).toBe('18.3.1');
    expect(react?.confidenceTier).toBe('high');
  });

  // Fixture 8: React Negative Docs
  it('Fixture 8 (react-negative-docs.html): Next.js data route react.js.json produces ZERO direct React detection', () => {
    const result = runFixtureScan('react-negative-docs.html');
    const directReact = result.technologies.find((t) => t.id === 'react' && t.detectionType === 'direct');

    expect(directReact).toBeUndefined();
    expect(result.technologies.length).toBe(0);
  });

  // Fixture 9: Vue 3 VitePress
  it('Fixture 9 (vue3-vitepress.html): Detects VitePress directly and Vue 3 as inferred dependency', () => {
    const result = runFixtureScan('vue3-vitepress.html');
    const vp = result.technologies.find((t) => t.id === 'vitepress');
    const vue = result.technologies.find((t) => t.id === 'vue');

    expect(vp).toBeDefined();
    expect(vp?.detectionType).toBe('direct');
    expect(vp?.version).toBe('2.0.0-alpha.17');
    expect(vp?.confidenceTier).toBe('high');

    expect(vue).toBeDefined();
    expect(vue?.category).toBe('framework');
    expect(vue?.detectionType).toBe('inferred');
    expect(vue?.parentDependency).toBe('VitePress');
    expect(vue?.confidenceTier).toBe('medium');
    expect(vue?.confidenceScore).toBe(75);
  });

  // Fixture 10: Angular Modern
  it('Fixture 10 (angular-modern.html): Detects Angular via adev-root with version 22.2.6+sha-22b7937', () => {
    const result = runFixtureScan('angular-modern.html');
    const angular = result.technologies.find((t) => t.id === 'angular');

    expect(angular).toBeDefined();
    expect(angular?.category).toBe('framework');
    expect(angular?.version).toBe('22.2.6+sha-22b7937');
    expect(angular?.confidenceTier).toBe('high');
  });

  // Fixture 11: Google Analytics 4 Only
  it('Fixture 11 (google-analytics-ga4.html): Detects GA4 with measurement ID G-SW8P9593JE and does NOT detect GTM', () => {
    const result = runFixtureScan('google-analytics-ga4.html');
    const ga4 = result.technologies.find((t) => t.id === 'google-analytics');
    const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

    expect(ga4).toBeDefined();
    expect(ga4?.version).toBe('G-SW8P9593JE');
    expect(gtm).toBeUndefined();
  });

  // Fixture 12: Google Tag Manager Only
  it('Fixture 12 (google-tag-manager-only.html): Detects GTM with container ID GTM-TR9K4D and does NOT detect GA4', () => {
    const result = runFixtureScan('google-tag-manager-only.html');
    const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');
    const ga4 = result.technologies.find((t) => t.id === 'google-analytics');

    expect(gtm).toBeDefined();
    expect(gtm?.version).toBe('GTM-TR9K4D');
    expect(ga4).toBeUndefined();
  });

  // Fixture 13: Multi-Tech Stack
  it('Fixture 13 (multi-tech-stack.html): Correctly detects Next.js, inferred React, Tailwind, GA4, and Cloudflare', () => {
    const result = runFixtureScan('multi-tech-stack.html');
    const techIds = result.technologies.map((t) => t.id);

    expect(techIds).toContain('nextjs');
    expect(techIds).toContain('react');
    expect(techIds).toContain('tailwindcss');
    expect(techIds).toContain('google-analytics');
    expect(techIds).toContain('cloudflare');
  });

  // Fixture 14: Empty Clean
  it('Fixture 14 (empty-clean.html): Clean semantic HTML produces 0 detected technologies', () => {
    const result = runFixtureScan('empty-clean.html');
    expect(result.technologies).toEqual([]);
    expect(result.stats.total).toBe(0);
  });

  // Fixture 15: Conflicting & Misleading Signals
  it('Fixture 15 (conflicting-misleading.html): cdnjs mirror and commented generators produce ZERO false positives', () => {
    const result = runFixtureScan('conflicting-misleading.html');
    const detectedIds = result.technologies.map((t) => t.id);

    // Negative controls: misleading comments, content text, and CDN hosts do not trigger false positives
    expect(detectedIds).not.toContain('cloudflare');
    expect(detectedIds).not.toContain('wordpress');
    expect(detectedIds).not.toContain('react');

    // Legitimate detection: authentic Lodash script bundle from cdnjs is recognized
    expect(detectedIds).toContain('lodash');
    const lodash = result.technologies.find((t) => t.id === 'lodash');
    expect(lodash?.category).toBe('library');
    expect(lodash?.confidenceTier).toBe('medium');
  });
});
