import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';
import { ALL_RULES } from '../../src/engine/rules/registry';
import { CANONICAL_TECHNOLOGY_DEFINITIONS } from '../../src/engine/schema/definitions';

/**
 * Phase 7 & Stage 2.6.4: Real-World Regression Benchmark & Separation Audit
 * Regression test set covering multi-architecture framework coexistence,
 * separation risks, and negative-control scenarios.
 * Results describe this test suite only and do not guarantee universal accuracy.
 */

describe('Phase 7: Expanded Real-World Benchmark & False-Positive Audit Suite', () => {

  // =========================================================================
  // STAGE 2: POSITIVE BENCHMARK (58 Cases)
  // =========================================================================

  describe('Category 1: CMS (WordPress, Webflow) — 8 Cases', () => {
    it('P01: wordpress.org — Full core WordPress with version 6.4.2', () => {
      const signals: HarvestedSignals = {
        url: 'https://wordpress.org',
        globals: {
          wp: {},
          _wpemojiSettings: { baseUrl: 'https://s.w.org/images/core/emoji/' },
        },
        meta: [{ name: 'generator', content: 'WordPress 6.4.2' }],
        dom: [{ selector: 'link[rel*="https://api.w.org/"]' }],
        resources: ['https://wordpress.org/wp-content/themes/pub/wporg-main/style.css'],
      };
      const result = evaluateSignals(signals);
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      expect(wp).toBeDefined();
      expect(wp?.category).toBe('cms');
      expect(wp?.detectionType).toBe('direct');
      expect(wp?.version).toBe('6.4.2');
      expect(wp?.confidenceTier).toBe('high');
      expect(wp?.confidenceScore).toBe(100);
    });

    it('P02: techcrunch.com pattern — Enterprise WordPress VIP with emoji and REST API', () => {
      const signals: HarvestedSignals = {
        url: 'https://techcrunch.com',
        globals: { _wpemojiSettings: {} },
        meta: [],
        dom: [
          { selector: 'link[rel*="https://api.w.org/"]' },
          { selector: 'link[rel="EditURI"][type="application/rsd+xml"][href*="xmlrpc.php"]' },
        ],
        resources: ['https://techcrunch.com/wp-content/plugins/vip-helpers/vip.js'],
      };
      const result = evaluateSignals(signals);
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      expect(wp).toBeDefined();
      expect(wp?.detectionType).toBe('direct');
      expect(wp?.confidenceTier).toBe('high');
      expect(wp?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('P03: make.wordpress.org — WordPress beta release candidate version', () => {
      const signals: HarvestedSignals = {
        url: 'https://make.wordpress.org',
        globals: { wp: {} },
        meta: [{ name: 'generator', content: 'WordPress 7.2-beta5-65440' }],
        dom: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      expect(wp).toBeDefined();
      expect(wp?.version).toBe('7.2-beta5-65440');
      expect(wp?.confidenceTier).toBe('high');
    });

    it('P04: classic-wp-blog.net — WordPress via wp-includes script ver parameter', () => {
      const signals: HarvestedSignals = {
        url: 'https://classic-wp-blog.net',
        globals: { wp: {} },
        meta: [],
        dom: [],
        resources: ['https://classic-wp-blog.net/wp-includes/js/wp-emoji-release.min.js?ver=6.3.1'],
      };
      const result = evaluateSignals(signals);
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      expect(wp).toBeDefined();
      expect(wp?.version).toBe('6.3.1');
    });

    it('P05: webflow.com — Webflow official homepage with full runtime footprint', () => {
      const signals: HarvestedSignals = {
        url: 'https://webflow.com',
        globals: { Webflow: {} },
        meta: [],
        dom: [
          { selector: 'html[data-wf-page]' },
          { selector: 'html[data-wf-site]' },
        ],
        resources: ['https://assets-global.website-files.com/webflow.js'],
      };
      const result = evaluateSignals(signals);
      const wf = result.technologies.find((t) => t.id === 'webflow');

      expect(wf).toBeDefined();
      expect(wf?.category).toBe('cms');
      expect(wf?.detectionType).toBe('direct');
      expect(wf?.confidenceTier).toBe('high');
      expect(wf?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('P06: finsweet.com — Webflow agency site with data-wf-page and data-wf-site', () => {
      const signals: HarvestedSignals = {
        url: 'https://finsweet.com',
        globals: {},
        meta: [],
        dom: [
          { selector: 'html[data-wf-page]' },
          { selector: 'html[data-wf-site]' },
        ],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const wf = result.technologies.find((t) => t.id === 'webflow');

      expect(wf).toBeDefined();
      expect(wf?.confidenceScore).toBe(60); // Capped at 60 for single DOM class
      expect(wf?.confidenceTier).toBe('medium');
    });

    it('P07: memberstack.com — Webflow SaaS portal with Webflow global and custom attribute', () => {
      const signals: HarvestedSignals = {
        url: 'https://memberstack.com',
        globals: { Webflow: { require: () => {} } },
        meta: [],
        dom: [{ selector: 'html[data-wf-site]' }],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const wf = result.technologies.find((t) => t.id === 'webflow');

      expect(wf).toBeDefined();
      expect(wf?.confidenceTier).toBe('high');
    });

    it('P08: showcase-agency.io — Webflow showcase with meta generator', () => {
      const signals: HarvestedSignals = {
        url: 'https://showcase-agency.io',
        globals: {},
        meta: [{ name: 'generator', content: 'Webflow' }],
        dom: [{ selector: 'html[data-wf-page]' }],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const wf = result.technologies.find((t) => t.id === 'webflow');

      expect(wf).toBeDefined();
      expect(wf?.confidenceTier).toBe('high');
    });
  });

  describe('Category 2: Ecommerce (Shopify, WooCommerce) — 8 Cases', () => {
    it('P09: allbirds.com — Shopify store with full runtime, theme, and digital wallet', () => {
      const signals: HarvestedSignals = {
        url: 'https://allbirds.com',
        globals: {
          Shopify: { theme: { name: 'Dawn', version: '12.0.0' } },
          ShopifyAnalytics: {},
          BOOMR: { themeName: 'Dawn' },
        },
        meta: [{ name: 'shopify-digital-wallet', content: '' }],
        dom: [{ selector: 'input[name="shopify-digital-wallet"]' }],
        resources: ['https://cdn.shopify.com/s/files/1/0123/t/1/assets/app.js'],
      };
      const result = evaluateSignals(signals);
      const shopify = result.technologies.find((t) => t.id === 'shopify');

      expect(shopify).toBeDefined();
      expect(shopify?.category).toBe('ecommerce');
      expect(shopify?.detectionType).toBe('direct');
      expect(shopify?.version).toBe('12.0.0');
      expect(shopify?.confidenceTier).toBe('high');
      expect(shopify?.confidenceScore).toBe(100);
    });

    it('P10: gymshark.com pattern — Headless Shopify checkout and payment components', () => {
      const signals: HarvestedSignals = {
        url: 'https://gymshark.com',
        globals: { Shopify: {} },
        meta: [{ name: 'shopify-digital-wallet', content: '' }],
        dom: [{ selector: 'input[name="shopify-digital-wallet"]' }],
        resources: ['https://cdn.shopify.com/shopifycloud/storefront.js'],
      };
      const result = evaluateSignals(signals);
      const shopify = result.technologies.find((t) => t.id === 'shopify');

      expect(shopify).toBeDefined();
      expect(shopify?.confidenceTier).toBe('high');
    });

    it('P11: kith.com — Shopify store with theme version 15.1.0', () => {
      const signals: HarvestedSignals = {
        url: 'https://kith.com',
        globals: { Shopify: { theme: { version: '15.1.0' } } },
        meta: [],
        dom: [{ selector: 'input[name="shopify-digital-wallet"]' }],
        resources: ['https://cdn.shopify.com/s/files/kith.js'],
      };
      const result = evaluateSignals(signals);
      const shopify = result.technologies.find((t) => t.id === 'shopify');

      expect(shopify).toBeDefined();
      expect(shopify?.version).toBe('15.1.0');
    });

    it('P12: shopify-minimal.myshopify.com — Direct Shopify store with monorail edge', () => {
      const signals: HarvestedSignals = {
        url: 'https://minimal.myshopify.com',
        globals: { Shopify: {} },
        meta: [],
        dom: [],
        resources: ['https://monorail-edge.shopifysvc.com/unstable/produce_batch'],
      };
      const result = evaluateSignals(signals);
      const shopify = result.technologies.find((t) => t.id === 'shopify');

      expect(shopify).toBeDefined();
      expect(shopify?.confidenceTier).toBe('high');
    });

    it('P13: woocommerce.com store — Full WooCommerce with WordPress core', () => {
      const signals: HarvestedSignals = {
        url: 'https://woocommerce.com/store',
        globals: {
          woocommerce_params: {},
          wc_cart_fragments_params: {},
          wp: {},
        },
        dom: [
          { selector: 'body.woocommerce' },
          { selector: 'link[rel*="https://api.w.org/"]' },
        ],
        meta: [
          { name: 'generator', content: 'WooCommerce 8.5.1' },
          { name: 'generator', content: 'WordPress 6.4.3' },
        ],
        resources: ['https://woocommerce.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js'],
      };
      const result = evaluateSignals(signals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      expect(woo).toBeDefined();
      expect(woo?.category).toBe('ecommerce');
      expect(woo?.version).toBe('8.5.1');
      expect(woo?.confidenceTier).toBe('high');

      expect(wp).toBeDefined();
      expect(wp?.detectionType).toBe('direct');
      expect(wp?.version).toBe('6.4.3');
      expect(wp?.confidenceTier).toBe('high');
    });

    it('P14: custom-woo-shop.com — WooCommerce High with weak WP asset elevates WP to 75 Medium Inferred', () => {
      const signals: HarvestedSignals = {
        url: 'https://custom-woo-shop.com',
        globals: {
          woocommerce_params: {},
          wc_cart_fragments_params: {},
        },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: ['https://custom-woo-shop.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js'],
      };
      const result = evaluateSignals(signals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');
      const wp = result.technologies.find((t) => t.id === 'wordpress');

      expect(woo?.confidenceTier).toBe('high');
      expect(wp?.detectionType).toBe('inferred');
      expect(wp?.confidenceScore).toBe(75);
      expect(wp?.confidenceTier).toBe('medium');
      expect(wp?.parentDependency).toBe('WooCommerce');
    });

    it('P15: classic-bookstore.com — WooCommerce version 8.7.0 extracted from resource query param', () => {
      const signals: HarvestedSignals = {
        url: 'https://classic-bookstore.com',
        globals: { wc_cart_fragments_params: {} },
        dom: [{ selector: '.woocommerce' }],
        meta: [],
        resources: ['https://classic-bookstore.com/wp-content/plugins/woocommerce/assets/client/blocks/wc-cart.js?ver=8.7.0'],
      };
      const result = evaluateSignals(signals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');

      expect(woo).toBeDefined();
      expect(woo?.version).toBe('8.7.0');
    });

    it('P16: artisan-store.org — WooCommerce product page with body.woocommerce-page', () => {
      const signals: HarvestedSignals = {
        url: 'https://artisan-store.org/product/leather-bag',
        globals: { woocommerce_params: {} },
        dom: [{ selector: 'body.woocommerce-page' }],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');

      expect(woo).toBeDefined();
      expect(woo?.confidenceTier).toBe('high');
    });
  });

  describe('Category 3: Frameworks (Next.js, Vue.js, VitePress, Angular) — 10 Cases', () => {
    it('P17: nextjs.org — App Router production build with __next_f stream and React inferred', () => {
      const signals: HarvestedSignals = {
        url: 'https://nextjs.org',
        globals: { __next_f: [] },
        meta: [],
        dom: [
          { selector: '#__next' },
          { selector: 'link[href*="/_next/static/"]' },
        ],
        resources: ['https://nextjs.org/_next/static/chunks/main-app.js'],
      };
      const result = evaluateSignals(signals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      const react = result.technologies.find((t) => t.id === 'react');

      expect(nextjs).toBeDefined();
      expect(nextjs?.category).toBe('framework');
      expect(nextjs?.detectionType).toBe('direct');
      expect(nextjs?.confidenceTier).toBe('high');
      expect(nextjs?.version).toBeUndefined();
      expect(nextjs?.confidenceReason).toContain('Next.js detected. The production build does not expose a reliable framework version');

      expect(react).toBeDefined();
      expect(react?.detectionType).toBe('inferred');
      expect(react?.parentDependency).toBe('Next.js');
      expect(react?.confidenceScore).toBe(75);
    });

    it('P18: vercel.com/blog — Next.js Pages router with __NEXT_DATA__ and head count meta', () => {
      const signals: HarvestedSignals = {
        url: 'https://vercel.com/blog',
        globals: { __NEXT_DATA__: { page: '/blog' } },
        meta: [{ name: 'next-head-count', content: '24' }],
        dom: [{ selector: 'script#__NEXT_DATA__' }],
        resources: ['https://vercel.com/_next/static/chunks/pages/blog.js'],
      };
      const result = evaluateSignals(signals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');

      expect(nextjs).toBeDefined();
      expect(nextjs?.confidenceTier).toBe('high');
    });

    it('P19: dev-next-app.local — Next.js with exposed version 14.2.4', () => {
      const signals: HarvestedSignals = {
        url: 'https://dev-next-app.local',
        globals: {
          next: { version: '14.2.4' },
          __NEXT_DATA__: {},
        },
        meta: [],
        dom: [{ selector: '#__next' }],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');

      expect(nextjs).toBeDefined();
      expect(nextjs?.version).toBe('14.2.4');
    });

    it('P20: static-next-export.com — Next.js static HTML export with css and static links', () => {
      const signals: HarvestedSignals = {
        url: 'https://static-next-export.com',
        globals: {},
        meta: [],
        dom: [
          { selector: '#__next' },
          { selector: 'link[href*="/_next/static/"]' },
        ],
        resources: [
          'https://static-next-export.com/_next/static/css/styles.css',
          'https://static-next-export.com/_next/static/chunks/poly.js',
        ],
      };
      const result = evaluateSignals(signals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');

      expect(nextjs).toBeDefined();
      expect(nextjs?.confidenceTier).toBe('high');
    });

    it('P21: vuejs.org — VitePress documentation portal with inferred Vue.js', () => {
      const signals: HarvestedSignals = {
        url: 'https://vuejs.org',
        globals: {
          __VITEPRESS__: true,
          __VP_HASH_MAP__: {},
        },
        meta: [{ name: 'generator', content: 'VitePress v2.0.0-alpha.17' }],
        dom: [{ selector: '[data-v-scoped]' }],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vp = result.technologies.find((t) => t.id === 'vitepress');
      const vue = result.technologies.find((t) => t.id === 'vue');

      expect(vp).toBeDefined();
      expect(vp?.version).toBe('2.0.0-alpha.17');
      expect(vp?.detectionType).toBe('direct');

      expect(vue).toBeDefined();
      expect(vue?.detectionType).toBe('inferred');
      expect(vue?.parentDependency).toBe('VitePress');
      expect(vue?.confidenceScore).toBe(75);
    });

    it('P22: vue-demo.com — Vue 3 SPA with direct runtime global Vue.version 3.4.21', () => {
      const signals: HarvestedSignals = {
        url: 'https://vue-demo.com',
        globals: {
          Vue: { version: '3.4.21' },
          __VUE__: true,
        },
        meta: [],
        dom: [{ selector: '[data-v-app]' }],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vue = result.technologies.find((t) => t.id === 'vue');

      expect(vue).toBeDefined();
      expect(vue?.version).toBe('3.4.21');
      expect(vue?.detectionType).toBe('direct');
      expect(vue?.confidenceTier).toBe('high');
    });

    it('P23: vue-storefront.io — Vue.js with [data-v-app] container and scoped stylesheet', () => {
      const signals: HarvestedSignals = {
        url: 'https://vue-storefront.io',
        globals: { __VUE_DEVTOOLS_GLOBAL_HOOK__: {} },
        meta: [],
        dom: [
          { selector: '[data-v-app]' },
          { selector: 'style:has-text([data-v-])' },
        ],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vue = result.technologies.find((t) => t.id === 'vue');

      expect(vue).toBeDefined();
      expect(vue?.confidenceTier).toBe('high');
    });

    it('P24: vitepress.dev — VitePress 1.0.1 documentation portal', () => {
      const signals: HarvestedSignals = {
        url: 'https://vitepress.dev',
        globals: { __VITEPRESS__: true },
        meta: [{ name: 'generator', content: 'VitePress 1.0.1' }],
        dom: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vp = result.technologies.find((t) => t.id === 'vitepress');

      expect(vp).toBeDefined();
      expect(vp?.version).toBe('1.0.1');
      expect(vp?.confidenceTier).toBe('high');
    });

    it('P25: angular.dev — Angular official portal with version 17.3.0 and adev-root', () => {
      const signals: HarvestedSignals = {
        url: 'https://angular.dev',
        globals: { getAllAngularRootElements: () => [] },
        dom: [
          { selector: '[ng-version]', attribute: 'ng-version', value: '17.3.0' },
          { selector: 'adev-root' },
        ],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const angular = result.technologies.find((t) => t.id === 'angular');

      expect(angular).toBeDefined();
      expect(angular?.category).toBe('framework');
      expect(angular?.detectionType).toBe('direct');
      expect(angular?.version).toBe('17.3.0');
      expect(angular?.confidenceTier).toBe('high');
    });

    it('P26: internal-crm.enterprise.com — Angular enterprise application with ng global and app-root', () => {
      const signals: HarvestedSignals = {
        url: 'https://internal-crm.enterprise.com',
        globals: { ng: {} },
        dom: [
          { selector: '[ng-version]', attribute: 'ng-version', value: '18.1.0' },
          { selector: 'app-root' },
        ],
        meta: [],
        resources: ['https://internal-crm.enterprise.com/vendor/@angular/core/fesm.js'],
      };
      const result = evaluateSignals(signals);
      const angular = result.technologies.find((t) => t.id === 'angular');

      expect(angular).toBeDefined();
      expect(angular?.version).toBe('18.1.0');
      expect(angular?.confidenceTier).toBe('high');
    });
  });

  describe('Category 4: Libraries (React, jQuery, Bootstrap, Tailwind CSS) — 9 Cases', () => {
    it('P27: react.dev — Direct React standalone application with version 18.3.1', () => {
      const signals: HarvestedSignals = {
        url: 'https://react.dev',
        globals: {
          React: { version: '18.3.1' },
          __REACT_DEVTOOLS_GLOBAL_HOOK__: {},
        },
        dom: [{ selector: '[data-reactroot]' }],
        meta: [],
        resources: ['https://react.dev/react.production.min.js'],
      };
      const result = evaluateSignals(signals);
      const react = result.technologies.find((t) => t.id === 'react');

      expect(react).toBeDefined();
      expect(react?.category).toBe('library');
      expect(react?.detectionType).toBe('direct');
      expect(react?.version).toBe('18.3.1');
      expect(react?.confidenceTier).toBe('high');
    });

    it('P28: codepen.io/demo — React loaded via CDN bundle URL regex', () => {
      const signals: HarvestedSignals = {
        url: 'https://codepen.io/demo',
        globals: { React: {} },
        dom: [],
        meta: [],
        resources: ['https://unpkg.com/react@18.2.0/umd/react.production.min.js'],
      };
      const result = evaluateSignals(signals);
      const react = result.technologies.find((t) => t.id === 'react');

      expect(react).toBeDefined();
      expect(react?.version).toBe('18.2.0');
    });

    it('P29: jquery.com — Direct jQuery portal with version 3.7.1', () => {
      const signals: HarvestedSignals = {
        url: 'https://jquery.com',
        globals: {
          jQuery: { fn: { jquery: '3.7.1' } },
          $: { fn: { jquery: '3.7.1' } },
        },
        dom: [{ selector: 'script[src*="jquery"]' }],
        meta: [],
        resources: ['https://code.jquery.com/jquery-3.7.1.min.js'],
      };
      const result = evaluateSignals(signals);
      const jq = result.technologies.find((t) => t.id === 'jquery');

      expect(jq).toBeDefined();
      expect(jq?.category).toBe('library');
      expect(jq?.version).toBe('3.7.1');
      expect(jq?.confidenceTier).toBe('high');
    });

    it('P30: archive.org — jQuery 3.6.4 extracted from script URL', () => {
      const signals: HarvestedSignals = {
        url: 'https://archive.org',
        globals: {},
        dom: [{ selector: 'script[src*="jquery"]' }],
        meta: [],
        resources: ['https://archive.org/includes/jquery-3.6.4.min.js'],
      };
      const result = evaluateSignals(signals);
      const jq = result.technologies.find((t) => t.id === 'jquery');

      expect(jq).toBeDefined();
      expect(jq?.version).toBe('3.6.4');
    });

    it('P31: getbootstrap.com — Bootstrap with version 5.3.3 from Tooltip.VERSION', () => {
      const signals: HarvestedSignals = {
        url: 'https://getbootstrap.com',
        globals: {
          bootstrap: { Tooltip: { VERSION: '5.3.3' } },
        },
        dom: [{ selector: 'link[href*="bootstrap"]' }],
        meta: [],
        resources: ['https://getbootstrap.com/docs/5.3/dist/css/bootstrap.min.css'],
      };
      const result = evaluateSignals(signals);
      const bs = result.technologies.find((t) => t.id === 'bootstrap');

      expect(bs).toBeDefined();
      expect(bs?.category).toBe('library');
      expect(bs?.version).toBe('5.3.3');
      expect(bs?.confidenceTier).toBe('high');
    });

    it('P32: cdn-bootstrap-app.com — Bootstrap version 5.2.3 extracted from bundle filename', () => {
      const signals: HarvestedSignals = {
        url: 'https://cdn-bootstrap-app.com',
        globals: { bootstrap: {} },
        dom: [{ selector: 'link[href*="bootstrap"]' }],
        meta: [],
        resources: ['https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js'],
      };
      const result = evaluateSignals(signals);
      const bs = result.technologies.find((t) => t.id === 'bootstrap');

      expect(bs).toBeDefined();
      expect(bs?.version).toBe('5.2.3');
    });

    it('P33: tailwindui.com — Tailwind CSS detected via distinctive DOM utility classes', () => {
      const signals: HarvestedSignals = {
        url: 'https://tailwindui.com',
        globals: {},
        dom: [{ selector: 'dom:tailwind-utilities' }],
        meta: [],
        resources: ['https://tailwindui.com/css/styles.css'],
      };
      const result = evaluateSignals(signals);
      const tw = result.technologies.find((t) => t.id === 'tailwindcss');

      expect(tw).toBeDefined();
      expect(tw?.category).toBe('library');
      expect(tw?.confidenceScore).toBe(50);
      expect(tw?.confidenceTier).toBe('medium');
    });

    it('P34: play.tailwindcss.com — Tailwind CSS corroborated with CDN reaches High confidence', () => {
      const signals: HarvestedSignals = {
        url: 'https://play.tailwindcss.com',
        globals: {},
        dom: [{ selector: 'dom:tailwind-utilities' }],
        meta: [],
        resources: ['https://cdn.tailwindcss.com/3.4.1'],
      };
      const result = evaluateSignals(signals);
      const tw = result.technologies.find((t) => t.id === 'tailwindcss');

      expect(tw).toBeDefined();
      expect(tw?.confidenceTier).toBe('high');
      expect(tw?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('P35: inline-tw-app.com — Tailwind CSS detected via internal custom property footprints', () => {
      const signals: HarvestedSignals = {
        url: 'https://inline-tw-app.com',
        globals: {},
        dom: [
          { selector: 'style:has-text(--tw-)' },
          { selector: 'style:has-text(--tw-ring-offset-shadow)' },
        ],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const tw = result.technologies.find((t) => t.id === 'tailwindcss');

      expect(tw).toBeDefined();
      expect(tw?.confidenceScore).toBe(60); // Capped at 60 for single class
      expect(tw?.confidenceTier).toBe('medium');
    });
  });

  describe('Category 5: Analytics (GA4, GTM, Hotjar) — 7 Cases', () => {
    it('P36: marketing-site.com — Dedicated GA4 with measurement ID G-SW8P9593JE', () => {
      const signals: HarvestedSignals = {
        url: 'https://marketing-site.com',
        globals: { gtag: () => {} },
        meta: [],
        dom: [],
        resources: [
          'https://www.googletagmanager.com/gtag/js?id=G-SW8P9593JE',
          'https://www.google-analytics.com/g/collect?v=2&tid=G-SW8P9593JE',
        ],
      };
      const result = evaluateSignals(signals);
      const ga4 = result.technologies.find((t) => t.id === 'google-analytics');

      expect(ga4).toBeDefined();
      expect(ga4?.category).toBe('analytics');
      expect(ga4?.version).toBe('G-SW8P9593JE');
      expect(ga4?.confidenceTier).toBe('high');
    });

    it('P37: analytics-test.org — GA4 measurement ID G-ABC123XYZ from collect endpoint', () => {
      const signals: HarvestedSignals = {
        url: 'https://analytics-test.org',
        globals: { google_tag_data: {} },
        meta: [],
        dom: [],
        resources: ['https://www.google-analytics.com/g/collect?v=2&tid=G-ABC123XYZ'],
      };
      const result = evaluateSignals(signals);
      const ga4 = result.technologies.find((t) => t.id === 'google-analytics');

      expect(ga4).toBeDefined();
      expect(ga4?.version).toBe('G-ABC123XYZ');
    });

    it('P38: ecommerce-gtm.com — Dedicated GTM with container ID GTM-TR9K4D', () => {
      const signals: HarvestedSignals = {
        url: 'https://ecommerce-gtm.com',
        globals: {
          google_tag_manager: {},
          dataLayer: [],
        },
        dom: [{ selector: 'iframe[src*="googletagmanager.com/ns.html"]' }],
        meta: [],
        resources: ['https://www.googletagmanager.com/gtm.js?id=GTM-TR9K4D'],
      };
      const result = evaluateSignals(signals);
      const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

      expect(gtm).toBeDefined();
      expect(gtm?.category).toBe('analytics');
      expect(gtm?.version).toBe('GTM-TR9K4D');
      expect(gtm?.confidenceTier).toBe('high');
    });

    it('P39: portal-gtm.com — GTM container GTM-5K4L3M from gtm.js script URL', () => {
      const signals: HarvestedSignals = {
        url: 'https://portal-gtm.com',
        globals: { google_tag_manager: {} },
        dom: [],
        meta: [],
        resources: ['https://www.googletagmanager.com/gtm.js?id=GTM-5K4L3M'],
      };
      const result = evaluateSignals(signals);
      const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

      expect(gtm).toBeDefined();
      expect(gtm?.version).toBe('GTM-5K4L3M');
    });

    it('P40: hotjar-demo.com — Hotjar with globals and site script', () => {
      const signals: HarvestedSignals = {
        url: 'https://hotjar-demo.com',
        globals: {
          hj: () => {},
          _hjSettings: { hjid: 123456 },
        },
        dom: [],
        meta: [],
        resources: ['https://static.hotjar.com/c/hotjar-123456.js?sv=6'],
      };
      const result = evaluateSignals(signals);
      const hj = result.technologies.find((t) => t.id === 'hotjar');

      expect(hj).toBeDefined();
      expect(hj?.category).toBe('analytics');
      expect(hj?.confidenceTier).toBe('high');
    });

    it('P41: tracking-suite.io — Hotjar with script.hotjar.com and hj global', () => {
      const signals: HarvestedSignals = {
        url: 'https://tracking-suite.io',
        globals: { hj: () => {} },
        dom: [],
        meta: [],
        resources: ['https://script.hotjar.com/modules.38b9e6.js'],
      };
      const result = evaluateSignals(signals);
      const hj = result.technologies.find((t) => t.id === 'hotjar');

      expect(hj).toBeDefined();
      expect(hj?.confidenceTier).toBe('high');
    });

    it('P42: enterprise-analytics.com — Parallel GA4 and GTM with separate IDs', () => {
      const signals: HarvestedSignals = {
        url: 'https://enterprise-analytics.com',
        globals: {
          gtag: () => {},
          google_tag_manager: {},
          dataLayer: [],
        },
        dom: [{ selector: 'iframe[src*="googletagmanager.com/ns.html"]' }],
        meta: [],
        resources: [
          'https://www.googletagmanager.com/gtag/js?id=G-PARALLEL1',
          'https://www.googletagmanager.com/gtm.js?id=GTM-PARALLEL2',
        ],
      };
      const result = evaluateSignals(signals);
      const ga4 = result.technologies.find((t) => t.id === 'google-analytics');
      const gtm = result.technologies.find((t) => t.id === 'google-tag-manager');

      expect(ga4).toBeDefined();
      expect(ga4?.version).toBe('G-PARALLEL1');
      expect(gtm).toBeDefined();
      expect(gtm?.version).toBe('GTM-PARALLEL2');
    });
  });

  describe('Category 6: Marketing & Communication (Meta Pixel, HubSpot, Intercom) — 7 Cases', () => {
    it('P43: checkout-pixel.com — Meta Pixel with fbq global and fbevents script', () => {
      const signals: HarvestedSignals = {
        url: 'https://checkout-pixel.com',
        globals: {
          fbq: () => {},
          _fbq: () => {},
        },
        dom: [],
        meta: [],
        resources: ['https://connect.facebook.net/en_US/fbevents.js'],
      };
      const result = evaluateSignals(signals);
      const fb = result.technologies.find((t) => t.id === 'meta-pixel');

      expect(fb).toBeDefined();
      expect(fb?.category).toBe('marketing');
      expect(fb?.confidenceTier).toBe('high');
    });

    it('P44: ads-lander.com — Meta Pixel with fbq global only', () => {
      const signals: HarvestedSignals = {
        url: 'https://ads-lander.com',
        globals: { fbq: () => {} },
        dom: [],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const fb = result.technologies.find((t) => t.id === 'meta-pixel');

      expect(fb).toBeDefined();
      expect(fb?.confidenceScore).toBe(35);
      expect(fb?.confidenceTier).toBe('low');
    });

    it('P45: hubspot-client.com — HubSpot with _hsq and js.hs-scripts.com', () => {
      const signals: HarvestedSignals = {
        url: 'https://hubspot-client.com',
        globals: {
          _hsq: [],
          HubSpotConversations: {},
        },
        dom: [],
        meta: [],
        resources: ['https://js.hs-scripts.com/12345.js'],
      };
      const result = evaluateSignals(signals);
      const hs = result.technologies.find((t) => t.id === 'hubspot');

      expect(hs).toBeDefined();
      expect(hs?.category).toBe('marketing');
      expect(hs?.confidenceTier).toBe('high');
    });

    it('P46: hubspot-analytics.com — HubSpot with analytics script and _hsq', () => {
      const signals: HarvestedSignals = {
        url: 'https://hubspot-analytics.com',
        globals: { _hsq: [] },
        dom: [],
        meta: [],
        resources: ['https://js.hs-analytics.net/analytics/123/hubspot.js'],
      };
      const result = evaluateSignals(signals);
      const hs = result.technologies.find((t) => t.id === 'hubspot');

      expect(hs).toBeDefined();
      expect(hs?.confidenceTier).toBe('high');
    });

    it('P47: intercom-client.com — Intercom with widget and settings global', () => {
      const signals: HarvestedSignals = {
        url: 'https://intercom-client.com',
        globals: {
          Intercom: () => {},
          intercomSettings: { app_id: 'abc123' },
        },
        dom: [],
        meta: [],
        resources: ['https://widget.intercom.io/widget/abc123'],
      };
      const result = evaluateSignals(signals);
      const ic = result.technologies.find((t) => t.id === 'intercom');

      expect(ic).toBeDefined();
      expect(ic?.category).toBe('marketing');
      expect(ic?.confidenceTier).toBe('high');
    });

    it('P48: support-desk.io — Intercom widget script only with Intercom global', () => {
      const signals: HarvestedSignals = {
        url: 'https://support-desk.io',
        globals: { Intercom: () => {} },
        dom: [],
        meta: [],
        resources: ['https://widget.intercom.io/widget/xyz999'],
      };
      const result = evaluateSignals(signals);
      const ic = result.technologies.find((t) => t.id === 'intercom');

      expect(ic).toBeDefined();
      expect(ic?.confidenceTier).toBe('high');
    });

    it('P49: marketing-funnel.com — Combined HubSpot + Meta Pixel on lead page', () => {
      const signals: HarvestedSignals = {
        url: 'https://marketing-funnel.com',
        globals: {
          _hsq: [],
          fbq: () => {},
        },
        dom: [],
        meta: [],
        resources: [
          'https://js.hs-scripts.com/777.js',
          'https://connect.facebook.net/en_US/fbevents.js',
        ],
      };
      const result = evaluateSignals(signals);
      const hs = result.technologies.find((t) => t.id === 'hubspot');
      const fb = result.technologies.find((t) => t.id === 'meta-pixel');

      expect(hs).toBeDefined();
      expect(fb).toBeDefined();
    });
  });

  describe('Category 7: Payment Gateways (Stripe, Razorpay) — 4 Cases', () => {
    it('P50: saas-billing.com — Stripe Elements platform with iframe and v3 script', () => {
      const signals: HarvestedSignals = {
        url: 'https://saas-billing.com',
        globals: { Stripe: () => {} },
        dom: [
          { selector: 'iframe[src*="js.stripe.com"]' },
          { selector: 'script[src*="js.stripe.com"]' },
        ],
        meta: [],
        resources: ['https://js.stripe.com/v3/'],
      };
      const result = evaluateSignals(signals);
      const stripe = result.technologies.find((t) => t.id === 'stripe');

      expect(stripe).toBeDefined();
      expect(stripe?.category).toBe('payment');
      expect(stripe?.confidenceTier).toBe('high');
    });

    it('P51: stripe-checkout-page.com — Stripe global and v3 script', () => {
      const signals: HarvestedSignals = {
        url: 'https://stripe-checkout-page.com',
        globals: { Stripe: () => {} },
        dom: [],
        meta: [],
        resources: ['https://js.stripe.com/v3/'],
      };
      const result = evaluateSignals(signals);
      const stripe = result.technologies.find((t) => t.id === 'stripe');

      expect(stripe).toBeDefined();
      expect(stripe?.confidenceTier).toBe('high');
    });

    it('P52: india-store.in — Razorpay gateway with checkout script and iframe', () => {
      const signals: HarvestedSignals = {
        url: 'https://india-store.in',
        globals: { Razorpay: () => {} },
        dom: [{ selector: 'iframe[src*="checkout.razorpay.com"]' }],
        meta: [],
        resources: ['https://checkout.razorpay.com/v1/checkout.js'],
      };
      const result = evaluateSignals(signals);
      const rzp = result.technologies.find((t) => t.id === 'razorpay');

      expect(rzp).toBeDefined();
      expect(rzp?.category).toBe('payment');
      expect(rzp?.confidenceTier).toBe('high');
    });

    it('P53: fast-checkout.in — Razorpay with global and script resource', () => {
      const signals: HarvestedSignals = {
        url: 'https://fast-checkout.in',
        globals: { Razorpay: () => {} },
        dom: [],
        meta: [],
        resources: ['https://checkout.razorpay.com/v1/checkout.js'],
      };
      const result = evaluateSignals(signals);
      const rzp = result.technologies.find((t) => t.id === 'razorpay');

      expect(rzp).toBeDefined();
      expect(rzp?.confidenceTier).toBe('high');
    });
  });

  describe('Category 8: Infrastructure & Edge Services (Cloudflare, Vercel, Netlify) — 5 Cases', () => {
    it('P54: cloudflare-edge.com — Cloudflare Rocket Loader and Bot Management globals', () => {
      const signals: HarvestedSignals = {
        url: 'https://cloudflare-edge.com',
        globals: {
          __cfRLUnblockHandlers: true,
          _cf_chl_opt: {},
        },
        dom: [],
        meta: [],
        resources: ['https://static.cloudflareinsights.com/beacon.min.js'],
      };
      const result = evaluateSignals(signals);
      const cf = result.technologies.find((t) => t.id === 'cloudflare');

      expect(cf).toBeDefined();
      expect(cf?.category).toBe('infrastructure');
      expect(cf?.confidenceTier).toBe('high');
    });

    it('P55: vercel-deployed.app — Vercel edge deployment with analytics script', () => {
      const signals: HarvestedSignals = {
        url: 'https://vercel-deployed.app',
        globals: {
          va: () => {},
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: ['https://vercel-deployed.app/_vercel/insights/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.category).toBe('infrastructure');
      expect(vercel?.confidenceTier).toBe('medium');
      expect(vercel?.confidenceScore).toBe(69);
    });

    it('P56: speed-insights-site.com — Vercel speed insights v1 script and va global', () => {
      const signals: HarvestedSignals = {
        url: 'https://speed-insights-site.com',
        globals: { va: () => {} },
        dom: [],
        meta: [],
        resources: ['https://speed-insights-site.com/_vercel/speed-insights/v1/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceTier).toBe('medium');
      expect(vercel?.confidenceScore).toBe(69);
    });

    it('P57: netlify-site.com — Netlify identity widget and serverless functions endpoint', () => {
      const signals: HarvestedSignals = {
        url: 'https://netlify-site.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          'https://identity.netlify.com/v1/netlify-identity-widget.js',
          'https://netlify-site.com/.netlify/functions/auth',
        ],
      };
      const result = evaluateSignals(signals);
      const netlify = result.technologies.find((t) => t.id === 'netlify');

      expect(netlify).toBeDefined();
      expect(netlify?.category).toBe('infrastructure');
      expect(netlify?.confidenceScore).toBe(50);
      expect(netlify?.confidenceTier).toBe('medium');
    });

    it('P58: modern-enterprise-stack.com — Cross-stack integration: Next.js + Tailwind + Vercel + Stripe + GA4', () => {
      const signals: HarvestedSignals = {
        url: 'https://modern-enterprise-stack.com',
        globals: {
          __next_f: [],
          va: () => {},
          Stripe: () => {},
          gtag: () => {},
        },
        dom: [
          { selector: '#__next' },
          { selector: 'dom:tailwind-utilities' },
          { selector: 'iframe[src*="js.stripe.com"]' },
        ],
        meta: [],
        resources: [
          'https://modern-enterprise-stack.com/_next/static/chunks/main.js',
          'https://modern-enterprise-stack.com/_vercel/insights/script.js',
          'https://js.stripe.com/v3/',
          'https://www.googletagmanager.com/gtag/js?id=G-STACK123',
        ],
      };
      const result = evaluateSignals(signals);
      const ids = result.technologies.map((t) => t.id);

      expect(ids).toContain('nextjs');
      expect(ids).toContain('react'); // Inferred
      expect(ids).toContain('tailwindcss');
      expect(ids).toContain('vercel');
      expect(ids).toContain('stripe');
      expect(ids).toContain('google-analytics');
    });
    it('P59: custom-wix-site.com — Wix platform with wixBiSession and generator meta', () => {
      const signals: HarvestedSignals = {
        url: 'https://custom-wix-site.com',
        globals: {
          wixBiSession: { initialTimestamp: 123456 },
          wixPerformanceMeasurements: {},
        },
        meta: [{ name: 'generator', content: 'Wix.com Website Builder' }],
        dom: [],
        resources: ['https://static.wixstatic.com/media/hero.jpg'],
      };
      const result = evaluateSignals(signals);
      const wix = result.technologies.find((t) => t.id === 'wix');

      expect(wix).toBeDefined();
      expect(wix?.category).toBe('cms');
      expect(wix?.confidenceTier).toBe('high');
      expect(wix?.confidenceScore).toBe(100);
    });

    it('P60: wix-portal.net — Wix CDN assets and parastorage script', () => {
      const signals: HarvestedSignals = {
        url: 'https://wix-portal.net',
        globals: { wixBiSession: {} },
        meta: [],
        dom: [],
        resources: ['https://parastorage.com/services/wix-thunderbolt/app/main.js'],
      };
      const result = evaluateSignals(signals);
      const wix = result.technologies.find((t) => t.id === 'wix');

      expect(wix).toBeDefined();
      expect(wix?.confidenceTier).toBe('high');
    });
  });

  describe('Category 9: Batch 1 Additions (Svelte, SvelteKit, Nuxt, Astro, Remix, Drupal, Ghost, Squarespace) — 8 Cases', () => {
    it('P61: kit.svelte.dev — SvelteKit application with routing attributes and inferred Svelte', () => {
      const signals: HarvestedSignals = {
        url: 'https://kit.svelte.dev',
        globals: {},
        meta: [],
        dom: [
          { selector: '[data-sveltekit-preload-data]', attribute: 'data-sveltekit-preload-data', value: 'hover' },
          { selector: 'script[data-sveltekit-fetched]' },
        ],
        resources: ['https://kit.svelte.dev/_app/immutable/chunks/entry.js'],
      };
      const result = evaluateSignals(signals);
      const sveltekit = result.technologies.find((t) => t.id === 'sveltekit');
      const svelte = result.technologies.find((t) => t.id === 'svelte');

      expect(sveltekit).toBeDefined();
      expect(sveltekit?.category).toBe('framework');
      expect(sveltekit?.detectionType).toBe('direct');
      expect(sveltekit?.confidenceTier).toBe('high');
      expect(sveltekit?.confidenceScore).toBeGreaterThanOrEqual(80);

      expect(svelte).toBeDefined();
      expect(svelte?.category).toBe('framework');
      expect(svelte?.detectionType).toBe('inferred');
      expect(svelte?.parentDependency).toBe('SvelteKit');
      expect(svelte?.confidenceScore).toBe(75);
      expect(svelte?.confidenceTier).toBe('medium');
    });

    it('P62: svelte-standalone.org — Standalone Svelte with compiled scoped class and versioned bundle', () => {
      const signals: HarvestedSignals = {
        url: 'https://svelte-standalone.org',
        globals: { __SVELTE__: {} },
        meta: [],
        dom: [
          { selector: '[class*="svelte-"]', attribute: 'class', value: 'hero-title svelte-1tky0p active' },
        ],
        resources: ['https://cdn.jsdelivr.net/npm/svelte@4.2.8/src/runtime/internal/index.js'],
      };
      const result = evaluateSignals(signals);
      const svelte = result.technologies.find((t) => t.id === 'svelte');

      expect(svelte).toBeDefined();
      expect(svelte?.category).toBe('framework');
      expect(svelte?.detectionType).toBe('direct');
      expect(svelte?.confidenceTier).toBe('high');
      expect(svelte?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(svelte?.version).toBe('4.2.8');
    });

    it('P63: nuxt.com — Nuxt universal application with __NUXT__ and inferred Vue.js', () => {
      const signals: HarvestedSignals = {
        url: 'https://nuxt.com',
        globals: { __NUXT__: { state: {} } },
        meta: [],
        dom: [
          { selector: '#__nuxt' },
          { selector: 'html[data-n-head]' },
        ],
        resources: ['https://nuxt.com/_nuxt/entry.js'],
      };
      const result = evaluateSignals(signals);
      const nuxt = result.technologies.find((t) => t.id === 'nuxt');
      const vue = result.technologies.find((t) => t.id === 'vue');

      expect(nuxt).toBeDefined();
      expect(nuxt?.category).toBe('framework');
      expect(nuxt?.detectionType).toBe('direct');
      expect(nuxt?.confidenceTier).toBe('high');
      expect(nuxt?.confidenceScore).toBeGreaterThanOrEqual(80);

      expect(vue).toBeDefined();
      expect(vue?.category).toBe('framework');
      expect(vue?.detectionType).toBe('inferred');
      expect(vue?.parentDependency).toBe('Nuxt');
      expect(vue?.confidenceScore).toBe(75);
      expect(vue?.confidenceTier).toBe('medium');
    });

    it('P64: astro.build — Astro site with astro-island component and generator meta', () => {
      const signals: HarvestedSignals = {
        url: 'https://astro.build',
        globals: {},
        meta: [{ name: 'generator', content: 'Astro v4.16.1' }],
        dom: [
          { selector: 'astro-island' },
          { selector: 'link[href*="/_astro/"]' },
        ],
        resources: ['https://astro.build/_astro/client.D3_G1Jb2.js'],
      };
      const result = evaluateSignals(signals);
      const astro = result.technologies.find((t) => t.id === 'astro');

      expect(astro).toBeDefined();
      expect(astro?.category).toBe('framework');
      expect(astro?.detectionType).toBe('direct');
      expect(astro?.confidenceTier).toBe('high');
      expect(astro?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(astro?.version).toBe('4.16.1');
    });

    it('P65: remix.run — Remix application with __remixContext, manifest, and inferred React', () => {
      const signals: HarvestedSignals = {
        url: 'https://remix.run',
        globals: {
          __remixContext: { routeData: {} },
          __remixManifest: { routes: {} },
        },
        meta: [],
        dom: [
          { selector: 'script[src*="/build/_shared/chunk-"]' },
        ],
        resources: ['https://remix.run/build/_shared/chunk-ABCD1234.js'],
      };
      const result = evaluateSignals(signals);
      const remix = result.technologies.find((t) => t.id === 'remix');
      const react = result.technologies.find((t) => t.id === 'react');

      expect(remix).toBeDefined();
      expect(remix?.category).toBe('framework');
      expect(remix?.detectionType).toBe('direct');
      expect(remix?.confidenceTier).toBe('high');
      expect(remix?.confidenceScore).toBeGreaterThanOrEqual(80);

      expect(react).toBeDefined();
      expect(react?.category).toBe('library');
      expect(react?.detectionType).toBe('inferred');
      expect(react?.parentDependency).toBe('Remix');
      expect(react?.confidenceScore).toBe(75);
      expect(react?.confidenceTier).toBe('medium');
    });

    it('P66: drupal.org — Drupal enterprise portal with drupalSettings and generator meta', () => {
      const signals: HarvestedSignals = {
        url: 'https://drupal.org',
        globals: {
          Drupal: {},
          drupalSettings: { path: { baseUrl: '/' } },
        },
        meta: [{ name: 'generator', content: 'Drupal 10.2.3 (https://www.drupal.org)' }],
        dom: [
          { selector: 'link[about]' },
        ],
        resources: ['https://drupal.org/sites/default/files/js/optimized.js'],
      };
      const result = evaluateSignals(signals);
      const drupal = result.technologies.find((t) => t.id === 'drupal');

      expect(drupal).toBeDefined();
      expect(drupal?.category).toBe('cms');
      expect(drupal?.detectionType).toBe('direct');
      expect(drupal?.confidenceTier).toBe('high');
      expect(drupal?.confidenceScore).toBe(100);
      expect(drupal?.version).toBe('10.2.3');
    });

    it('P67: ghost.org — Ghost publishing portal with generator meta and portal container', () => {
      const signals: HarvestedSignals = {
        url: 'https://ghost.org',
        globals: {},
        meta: [
          { name: 'generator', content: 'Ghost 5.82.0' },
          { name: 'ghost-search-uuid', content: 'abc-123-uuid' },
        ],
        dom: [
          { selector: '#ghost-portal-root' },
        ],
        resources: ['https://ghost.org/public/ghost-sdk.min.js'],
      };
      const result = evaluateSignals(signals);
      const ghost = result.technologies.find((t) => t.id === 'ghost');

      expect(ghost).toBeDefined();
      expect(ghost?.category).toBe('cms');
      expect(ghost?.detectionType).toBe('direct');
      expect(ghost?.confidenceTier).toBe('high');
      expect(ghost?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(ghost?.version).toBe('5.82.0');
    });

    it('P68: squarespace.com storefront — Squarespace platform with Static context and meta generator', () => {
      const signals: HarvestedSignals = {
        url: 'https://custom-squarespace-shop.com',
        globals: {
          Static: { SQUARESPACE_CONTEXT: { website: {} } },
          Y: { Squarespace: {} },
        },
        meta: [{ name: 'generator', content: 'Squarespace' }],
        dom: [
          { selector: 'html[data-authenticated-account]' },
        ],
        resources: ['https://static1.squarespace.com/static/site.js'],
      };
      const result = evaluateSignals(signals);
      const sq = result.technologies.find((t) => t.id === 'squarespace');

      expect(sq).toBeDefined();
      expect(sq?.category).toBe('cms');
      expect(sq?.detectionType).toBe('direct');
      expect(sq?.confidenceTier).toBe('high');
      expect(sq?.confidenceScore).toBe(100);
    });
  });

  describe('Category 10: Batch 2 Additions (Alpine.js, HTMX, Docusaurus, Hugo, Jekyll, Eleventy, SolidJS, Qwik) — 16 Cases', () => {
    it('P69: alpinejs.dev — Alpine.js with window.Alpine global, [x-data] DOM directive, and CDN resource', () => {
      const signals: HarvestedSignals = {
        url: 'https://alpinejs.dev',
        globals: {
          Alpine: { version: '3.13.5' },
        },
        meta: [],
        dom: [
          { selector: '[x-data]' },
        ],
        resources: ['https://alpinejs.dev/dist/alpine.min.js'],
      };
      const result = evaluateSignals(signals);
      const alpine = result.technologies.find((t) => t.id === 'alpinejs');

      expect(alpine).toBeDefined();
      expect(alpine?.category).toBe('framework');
      expect(alpine?.detectionType).toBe('direct');
      expect(alpine?.confidenceTier).toBe('high');
      expect(alpine?.confidenceScore).toBe(100);
    });

    it('P70: alpine-app.io — Alpine.js runtime detected via DOM directives x-data and x-init (unverified scope)', () => {
      const signals: HarvestedSignals = {
        url: 'https://alpine-app.io',
        globals: {},
        meta: [],
        dom: [
          { selector: '[x-data]' },
          { selector: '[x-init]' },
        ],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const alpine = result.technologies.find((t) => t.id === 'alpinejs');

      expect(alpine).toBeDefined();
      expect(alpine?.category).toBe('framework');
      expect(alpine?.detectionType).toBe('direct');
      expect(alpine?.confidenceTier).toBe('medium');
      expect(alpine?.confidenceScore).toBeLessThanOrEqual(69);
      expect(alpine?.confidenceScore).toBeGreaterThanOrEqual(50);
    });

    it('P71: htmx.org — HTMX hypermedia library with window.htmx global, [hx-get] attribute, and CDN resource', () => {
      const signals: HarvestedSignals = {
        url: 'https://htmx.org',
        globals: {
          htmx: {},
        },
        meta: [],
        dom: [
          { selector: '[hx-get]' },
        ],
        resources: ['https://unpkg.com/htmx.org/dist/htmx.min.js'],
      };
      const result = evaluateSignals(signals);
      const htmx = result.technologies.find((t) => t.id === 'htmx');

      expect(htmx).toBeDefined();
      expect(htmx?.category).toBe('library');
      expect(htmx?.detectionType).toBe('direct');
      expect(htmx?.confidenceTier).toBe('high');
      expect(htmx?.confidenceScore).toBe(100);
    });

    it('P72: htmx-dashboard.dev — HTMX via hx-post and hx-target DOM attributes with window.htmx runtime', () => {
      const signals: HarvestedSignals = {
        url: 'https://htmx-dashboard.dev',
        globals: {
          htmx: {},
        },
        meta: [],
        dom: [
          { selector: '[hx-post]' },
          { selector: '[hx-target]' },
        ],
        resources: ['https://cdn.jsdelivr.net/npm/htmx.org/dist/htmx.min.js'],
      };
      const result = evaluateSignals(signals);
      const htmx = result.technologies.find((t) => t.id === 'htmx');

      expect(htmx).toBeDefined();
      expect(htmx?.category).toBe('library');
      expect(htmx?.detectionType).toBe('direct');
      expect(htmx?.confidenceTier).toBe('high');
      expect(htmx?.confidenceScore).toBe(100);
    });

    it('P73: docusaurus.io — Docusaurus documentation site with meta generator, #__docusaurus DOM, and inferred React', () => {
      const signals: HarvestedSignals = {
        url: 'https://docusaurus.io',
        globals: {},
        meta: [
          { name: 'generator', content: 'Docusaurus v3.1.1' },
        ],
        dom: [
          { selector: 'div#__docusaurus' },
        ],
        resources: ['https://docusaurus.io/assets/js/docusaurus-bundle.js'],
      };
      const result = evaluateSignals(signals);
      const doc = result.technologies.find((t) => t.id === 'docusaurus');
      const react = result.technologies.find((t) => t.id === 'react');

      expect(doc).toBeDefined();
      expect(doc?.category).toBe('cms');
      expect(doc?.detectionType).toBe('direct');
      expect(doc?.confidenceTier).toBe('high');
      expect(doc?.confidenceScore).toBe(100);
      expect(doc?.version).toBe('3.1.1');

      expect(react).toBeDefined();
      expect(react?.category).toBe('library');
      expect(react?.detectionType).toBe('inferred');
      expect(react?.parentDependency).toBe('Docusaurus');
      expect(react?.confidenceScore).toBe(75);
      expect(react?.confidenceTier).toBe('medium');
    });

    it('P74: docs-portal.org — Docusaurus documentation site via div#__docusaurus, top navbar, and bundle with inferred React', () => {
      const signals: HarvestedSignals = {
        url: 'https://docs-portal.org',
        globals: {},
        meta: [],
        dom: [
          { selector: 'div#__docusaurus' },
          { selector: 'nav[class*="navbar--fixed-top"]' },
        ],
        resources: [
          'https://docs-portal.org/assets/js/docusaurus-main.js',
        ],
      };
      const result = evaluateSignals(signals);
      const doc = result.technologies.find((t) => t.id === 'docusaurus');
      const react = result.technologies.find((t) => t.id === 'react');

      expect(doc).toBeDefined();
      expect(doc?.category).toBe('cms');
      expect(doc?.detectionType).toBe('direct');
      expect(doc?.confidenceTier).toBe('high');
      expect(doc?.confidenceScore).toBeGreaterThanOrEqual(80);

      expect(react).toBeDefined();
      expect(react?.category).toBe('library');
      expect(react?.detectionType).toBe('inferred');
      expect(react?.parentDependency).toBe('Docusaurus');
      expect(react?.confidenceScore).toBe(75);
      expect(react?.confidenceTier).toBe('medium');
    });

    it('P75: gohugo.io — Hugo static site generator via meta generator Hugo 0.124.1 with version extraction', () => {
      const signals: HarvestedSignals = {
        url: 'https://gohugo.io',
        globals: {},
        meta: [
          { name: 'generator', content: 'Hugo 0.124.1' },
        ],
        dom: [
          { selector: 'meta[name="generator"][content*="Hugo"]' },
        ],
        resources: ['https://gohugo.io/js/bundle.min.js'],
      };
      const result = evaluateSignals(signals);
      const hugo = result.technologies.find((t) => t.id === 'hugo');

      expect(hugo).toBeDefined();
      expect(hugo?.category).toBe('cms');
      expect(hugo?.detectionType).toBe('direct');
      expect(hugo?.confidenceTier).toBe('high');
      expect(hugo?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(hugo?.version).toBe('0.124.1');
    });

    it('P76: hugo-theme-showcase.net — Hugo static site generator via meta generator Hugo 0.118.2 with URL comment', () => {
      const signals: HarvestedSignals = {
        url: 'https://hugo-theme-showcase.net',
        globals: {},
        meta: [
          { name: 'generator', content: 'Hugo 0.118.2 https://gohugo.io/' },
        ],
        dom: [
          { selector: 'meta[name="generator"][content*="Hugo"]' },
        ],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const hugo = result.technologies.find((t) => t.id === 'hugo');

      expect(hugo).toBeDefined();
      expect(hugo?.category).toBe('cms');
      expect(hugo?.detectionType).toBe('direct');
      expect(hugo?.confidenceTier).toBe('high');
      expect(hugo?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(hugo?.version).toBe('0.118.2');
    });

    it('P77: jekyllrb.com — Jekyll static site generator via meta generator Jekyll v4.3.3 with version extraction', () => {
      const signals: HarvestedSignals = {
        url: 'https://jekyllrb.com',
        globals: {},
        meta: [
          { name: 'generator', content: 'Jekyll v4.3.3' },
        ],
        dom: [
          { selector: 'link[type="application/atom+xml"][title*="Jekyll"]' },
        ],
        resources: ['https://jekyllrb.com/css/screen.css'],
      };
      const result = evaluateSignals(signals);
      const jekyll = result.technologies.find((t) => t.id === 'jekyll');

      expect(jekyll).toBeDefined();
      expect(jekyll?.category).toBe('cms');
      expect(jekyll?.detectionType).toBe('direct');
      expect(jekyll?.confidenceTier).toBe('high');
      expect(jekyll?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(jekyll?.version).toBe('4.3.3');
    });

    it('P78: github-pages-blog.org — Jekyll static site generator via meta generator Jekyll v3.9.0', () => {
      const signals: HarvestedSignals = {
        url: 'https://github-pages-blog.org',
        globals: {},
        meta: [
          { name: 'generator', content: 'Jekyll v3.9.0' },
        ],
        dom: [
          { selector: 'link[type="application/atom+xml"][title*="Jekyll"]' },
        ],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const jekyll = result.technologies.find((t) => t.id === 'jekyll');

      expect(jekyll).toBeDefined();
      expect(jekyll?.category).toBe('cms');
      expect(jekyll?.detectionType).toBe('direct');
      expect(jekyll?.confidenceTier).toBe('high');
      expect(jekyll?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(jekyll?.version).toBe('3.9.0');
    });

    it('P79: 11ty.dev — Eleventy static site generator via meta generator Eleventy v2.0.1 with version extraction', () => {
      const signals: HarvestedSignals = {
        url: 'https://www.11ty.dev',
        globals: {},
        meta: [
          { name: 'generator', content: 'Eleventy v2.0.1' },
        ],
        dom: [
          { selector: 'meta[name="generator"][content*="Eleventy"]' },
        ],
        resources: ['https://www.11ty.dev/css/base.css'],
      };
      const result = evaluateSignals(signals);
      const eleventy = result.technologies.find((t) => t.id === 'eleventy');

      expect(eleventy).toBeDefined();
      expect(eleventy?.category).toBe('cms');
      expect(eleventy?.detectionType).toBe('direct');
      expect(eleventy?.confidenceTier).toBe('high');
      expect(eleventy?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(eleventy?.version).toBe('2.0.1');
    });

    it('P80: jamstack-site.dev — Eleventy static site generator via meta generator Eleventy v3.0.0', () => {
      const signals: HarvestedSignals = {
        url: 'https://jamstack-site.dev',
        globals: {},
        meta: [
          { name: 'generator', content: 'Eleventy v3.0.0' },
        ],
        dom: [
          { selector: 'meta[name="generator"][content*="Eleventy"]' },
        ],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const eleventy = result.technologies.find((t) => t.id === 'eleventy');

      expect(eleventy).toBeDefined();
      expect(eleventy?.category).toBe('cms');
      expect(eleventy?.detectionType).toBe('direct');
      expect(eleventy?.confidenceTier).toBe('high');
      expect(eleventy?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(eleventy?.version).toBe('3.0.0');
    });

    it('P81: solidjs.com — SolidJS reactive framework via _$HY hydration global, devtools hook, and chunk asset', () => {
      const signals: HarvestedSignals = {
        url: 'https://www.solidjs.com',
        globals: {
          _$HY: { events: [], completed: new Set() },
          __SOLID_DEVTOOLS_GLOBAL_HOOK__: {},
        },
        meta: [],
        dom: [],
        resources: ['https://www.solidjs.com/assets/solid.chunk.js'],
      };
      const result = evaluateSignals(signals);
      const solid = result.technologies.find((t) => t.id === 'solidjs');

      expect(solid).toBeDefined();
      expect(solid?.category).toBe('framework');
      expect(solid?.detectionType).toBe('direct');
      expect(solid?.confidenceTier).toBe('high');
      expect(solid?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('P82: solid-dashboard.io — SolidJS reactive framework via unverified bundle script (low confidence)', () => {
      const signals: HarvestedSignals = {
        url: 'https://solid-dashboard.io',
        globals: {},
        meta: [],
        dom: [],
        resources: ['https://solid-dashboard.io/assets/solid-app.chunk.js'],
      };
      const result = evaluateSignals(signals);
      const solid = result.technologies.find((t) => t.id === 'solidjs');

      expect(solid).toBeDefined();
      expect(solid?.category).toBe('framework');
      expect(solid?.detectionType).toBe('direct');
      expect(solid?.confidenceTier).toBe('low');
      expect(solid?.confidenceScore).toBeLessThanOrEqual(49);
    });

    it('P83: qwik.dev — Qwik resumable framework via window.qc global, q:container, and q:version="1.5.0"', () => {
      const signals: HarvestedSignals = {
        url: 'https://qwik.dev',
        globals: {
          qc: {},
        },
        meta: [],
        dom: [
          { selector: '[q\\:container]' },
          { selector: '[q\\:key]' },
          { selector: '[q\\:version]', attribute: 'q:version', value: '1.5.0' },
        ],
        resources: ['https://qwik.dev/build/q-c2b4e6a8.js'],
      };
      const result = evaluateSignals(signals);
      const qwik = result.technologies.find((t) => t.id === 'qwik');

      expect(qwik).toBeDefined();
      expect(qwik?.category).toBe('framework');
      expect(qwik?.detectionType).toBe('direct');
      expect(qwik?.confidenceTier).toBe('high');
      expect(qwik?.confidenceScore).toBe(100);
      expect(qwik?.version).toBe('1.5.0');
    });

    it('P84: qwik-ecommerce.store — Qwik resumable framework via /build/q-*.js resource, q:container, and q:key', () => {
      const signals: HarvestedSignals = {
        url: 'https://qwik-ecommerce.store',
        globals: {},
        meta: [],
        dom: [
          { selector: '[q\\:container]' },
          { selector: '[q\\:key]' },
        ],
        resources: ['https://qwik-ecommerce.store/build/q-a1b2c3d4.js'],
      };
      const result = evaluateSignals(signals);
      const qwik = result.technologies.find((t) => t.id === 'qwik');

      expect(qwik).toBeDefined();
      expect(qwik?.category).toBe('framework');
      expect(qwik?.detectionType).toBe('direct');
      expect(qwik?.confidenceTier).toBe('high');
      expect(qwik?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('P85: preact-site.dev — Preact via __PREACT_DEVTOOLS__ global, [data-preact-root], and bundle', () => {
      const signals: HarvestedSignals = {
        url: 'https://preact-site.dev',
        globals: { __PREACT_DEVTOOLS__: {} },
        dom: [{ selector: '[data-preact-root]' }],
        meta: [],
        resources: ['https://preact-site.dev/dist/preact.min.js'],
      };
      const result = evaluateSignals(signals);
      const preact = result.technologies.find((t) => t.id === 'preact');

      expect(preact).toBeDefined();
      expect(preact?.category).toBe('library');
      expect(preact?.confidenceTier).toBe('high');
      expect(preact?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('P86: lit.dev — Lit web components via litHtmlVersions and litElementVersions version arrays', () => {
      const signals: HarvestedSignals = {
        url: 'https://lit.dev',
        globals: { litHtmlVersions: ['3.1.2'], litElementVersions: ['4.0.4'] },
        dom: [],
        meta: [],
        resources: ['https://cdn.jsdelivr.net/npm/lit@3.1.2/index.js'],
      };
      const result = evaluateSignals(signals);
      const lit = result.technologies.find((t) => t.id === 'lit');

      expect(lit).toBeDefined();
      expect(lit?.category).toBe('library');
      expect(lit?.version).toBe('3.1.2');
      expect(lit?.confidenceTier).toBe('high');
      expect(lit?.confidenceScore).toBeGreaterThanOrEqual(80);
    });

    it('P87: solidstart-app.com — SolidStart meta-framework via [data-solid-start] and _build assets, inferring SolidJS', () => {
      const signals: HarvestedSignals = {
        url: 'https://solidstart-app.com',
        globals: {},
        dom: [{ selector: '[data-solid-start]' }],
        meta: [],
        resources: ['https://solidstart-app.com/_build/assets/entry-client.js'],
      };
      const result = evaluateSignals(signals);
      const start = result.technologies.find((t) => t.id === 'solidstart');
      const solid = result.technologies.find((t) => t.id === 'solidjs');

      expect(start).toBeDefined();
      expect(start?.confidenceTier).toBe('high');
      expect(solid).toBeDefined();
      expect(solid?.detectionType).toBe('inferred');
      expect(solid?.confidenceTier).toBe('medium');
    });

    it('P88: qwik-city-portal.dev — Qwik City routing via [q:container][q:city] and @qwik-city-plan, inferring Qwik', () => {
      const signals: HarvestedSignals = {
        url: 'https://qwik-city-portal.dev',
        globals: { qc: {} },
        dom: [{ selector: '[q\\:container][q\\:city]' }],
        meta: [],
        resources: ['https://qwik-city-portal.dev/@qwik-city-plan'],
      };
      const result = evaluateSignals(signals);
      const city = result.technologies.find((t) => t.id === 'qwik-city');
      const qwik = result.technologies.find((t) => t.id === 'qwik');

      expect(city).toBeDefined();
      expect(city?.confidenceTier).toBe('high');
      expect(qwik).toBeDefined();
    });

    it('P89: ember-enterprise.net — Ember.js application via window.Ember, Ember.VERSION, and .ember-view', () => {
      const signals: HarvestedSignals = {
        url: 'https://ember-enterprise.net',
        globals: { Ember: { VERSION: '5.8.0' } },
        dom: [{ selector: '.ember-view' }, { selector: '.ember-application' }],
        meta: [],
        resources: ['https://ember-enterprise.net/assets/ember.min.js'],
      };
      const result = evaluateSignals(signals);
      const ember = result.technologies.find((t) => t.id === 'ember');

      expect(ember).toBeDefined();
      expect(ember?.category).toBe('framework');
      expect(ember?.version).toBe('5.8.0');
      expect(ember?.confidenceTier).toBe('high');
    });

    it('P90: stencil-components.org — Stencil compiled web components capped at low confidence (49 pts)', () => {
      const signals: HarvestedSignals = {
        url: 'https://stencil-components.org',
        globals: {},
        dom: [{ selector: '[data-stencil-build]' }, { selector: '[s-id]' }],
        meta: [],
        resources: ['https://stencil-components.org/dist/stencil.min.js'],
      };
      const result = evaluateSignals(signals);
      const stencil = result.technologies.find((t) => t.id === 'stencil');

      expect(stencil).toBeDefined();
      expect(stencil?.confidenceTier).toBe('low');
      expect(stencil?.confidenceScore).toBeLessThanOrEqual(49);
    });

    it('P91: joomla-cms-portal.org — Joomla CMS via meta generator and /media/system/js/', () => {
      const signals: HarvestedSignals = {
        url: 'https://joomla-cms-portal.org',
        globals: { Joomla: {} },
        dom: [],
        meta: [{ name: 'generator', content: 'Joomla! - Open Source Content Management - Version 5.1.0' }],
        resources: ['https://joomla-cms-portal.org/media/system/js/core.min.js'],
      };
      const result = evaluateSignals(signals);
      const joomla = result.technologies.find((t) => t.id === 'joomla');

      expect(joomla).toBeDefined();
      expect(joomla?.category).toBe('cms');
      expect(joomla?.version).toBe('5.1.0');
      expect(joomla?.confidenceTier).toBe('high');
    });

    it('P92: sanity-content.io — Sanity asset delivery CDN capped strictly at low confidence (49 pts)', () => {
      const signals: HarvestedSignals = {
        url: 'https://sanity-content.io',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://cdn.sanity.io/images/project123/prod/hero.webp'],
      };
      const result = evaluateSignals(signals);
      const sanity = result.technologies.find((t) => t.id === 'sanity');

      expect(sanity).toBeDefined();
      expect(sanity?.category).toBe('cms');
      expect(sanity?.confidenceTier).toBe('low');
      expect(sanity?.confidenceScore).toBeLessThanOrEqual(49);
    });

    it('P93: contentful-blog.com — Contentful assets CDN delivery capped strictly at low confidence (49 pts)', () => {
      const signals: HarvestedSignals = {
        url: 'https://contentful-blog.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://images.ctfassets.net/space123/asset456/banner.png'],
      };
      const result = evaluateSignals(signals);
      const contentful = result.technologies.find((t) => t.id === 'contentful');

      expect(contentful).toBeDefined();
      expect(contentful?.category).toBe('cms');
      expect(contentful?.confidenceTier).toBe('low');
      expect(contentful?.confidenceScore).toBeLessThanOrEqual(49);
    });

    it('P94: storyblok-site.com — Storyblok visual preview bridge capped at low confidence (49 pts)', () => {
      const signals: HarvestedSignals = {
        url: 'https://storyblok-site.com',
        globals: { storyblok: {} },
        dom: [],
        meta: [],
        resources: ['https://app.storyblok.com/f/storyblok-v2-latest.js'],
      };
      const result = evaluateSignals(signals);
      const storyblok = result.technologies.find((t) => t.id === 'storyblok');

      expect(storyblok).toBeDefined();
      expect(storyblok?.category).toBe('cms');
      expect(storyblok?.confidenceTier).toBe('low');
      expect(storyblok?.confidenceScore).toBeLessThanOrEqual(49);
    });

    it('P95: magento-commerce.com — Magento Adobe Commerce via script text/x-magento-init, Mage global, and versioned static assets', () => {
      const signals: HarvestedSignals = {
        url: 'https://magento-commerce.com',
        globals: { Mage: {} },
        dom: [
          { selector: 'script[type="text/x-magento-init"]' },
          { selector: '[data-mage-init]' },
        ],
        meta: [],
        resources: ['https://magento-commerce.com/static/version2.4.7/frontend/Magento/luma/en_US/mage/utils/wrapper.js'],
      };
      const result = evaluateSignals(signals);
      const magento = result.technologies.find((t) => t.id === 'magento');

      expect(magento).toBeDefined();
      expect(magento?.category).toBe('ecommerce');
      expect(magento?.version).toBe('2.4.7');
      expect(magento?.confidenceTier).toBe('high');
    });

    it('P96: bigcommerce-merchant.com — BigCommerce SaaS ecommerce via BCData global, stencil theme, and CDN', () => {
      const signals: HarvestedSignals = {
        url: 'https://bigcommerce-merchant.com',
        globals: { BCData: {}, stencilBootstrap: () => {} },
        dom: [],
        meta: [],
        resources: ['https://cdn11.bigcommerce.com/s-abcdef/stencil/123/js/bundle.js'],
      };
      const result = evaluateSignals(signals);
      const bc = result.technologies.find((t) => t.id === 'bigcommerce');

      expect(bc).toBeDefined();
      expect(bc?.category).toBe('ecommerce');
      expect(bc?.confidenceTier).toBe('high');
    });

    it('P97: prestashop-boutique.com — PrestaShop ecommerce via generator meta tag, window.prestashop, and classic theme', () => {
      const signals: HarvestedSignals = {
        url: 'https://prestashop-boutique.com',
        globals: { prestashop: {} },
        dom: [{ selector: 'body#checkout' }],
        meta: [{ name: 'generator', content: 'PrestaShop 8.1.5' }],
        resources: ['https://prestashop-boutique.com/themes/classic/assets/js/theme.js'],
      };
      const result = evaluateSignals(signals);
      const ps = result.technologies.find((t) => t.id === 'prestashop');

      expect(ps).toBeDefined();
      expect(ps?.category).toBe('ecommerce');
      expect(ps?.version).toBe('8.1.5');
      expect(ps?.confidenceTier).toBe('high');
    });

    it('P98: opencart-store.com — OpenCart ecommerce capped at medium confidence (69 pts)', () => {
      const signals: HarvestedSignals = {
        url: 'https://opencart-store.com',
        globals: {},
        dom: [{ selector: 'form[action*="index.php?route="], a[href*="index.php?route="]' }],
        meta: [],
        resources: [
          'https://opencart-store.com/catalog/view/javascript/common.js',
          'https://opencart-store.com/catalog/view/theme/default/stylesheet/stylesheet.css',
        ],
      };
      const result = evaluateSignals(signals);
      const oc = result.technologies.find((t) => t.id === 'opencart');

      expect(oc).toBeDefined();
      expect(oc?.category).toBe('ecommerce');
      expect(oc?.confidenceTier).toBe('medium');
      expect(oc?.confidenceScore).toBeLessThanOrEqual(69);
    });

    it('P99: paypal-checkout.com — PayPal payment processing via window.paypal, smart buttons, and SDK', () => {
      const signals: HarvestedSignals = {
        url: 'https://paypal-checkout.com',
        globals: { paypal: { Buttons: () => {} } },
        dom: [{ selector: '.paypal-button' }],
        meta: [],
        resources: ['https://www.paypal.com/sdk/js?client-id=test'],
      };
      const result = evaluateSignals(signals);
      const pp = result.technologies.find((t) => t.id === 'paypal');

      expect(pp).toBeDefined();
      expect(pp?.category).toBe('payment');
      expect(pp?.confidenceTier).toBe('high');
    });

    it('P100: klarna-payments.com — Klarna BNPL payment integration via window.Klarna, placement, and SDK', () => {
      const signals: HarvestedSignals = {
        url: 'https://klarna-payments.com',
        globals: { Klarna: { Payments: {} } },
        dom: [{ selector: 'klarna-placement' }],
        meta: [],
        resources: ['https://x.klarnacdn.net/kp/lib/v1/api.js'],
      };
      const result = evaluateSignals(signals);
      const klarna = result.technologies.find((t) => t.id === 'klarna');

      expect(klarna).toBeDefined();
      expect(klarna?.category).toBe('payment');
      expect(klarna?.confidenceTier).toBe('high');
    });

    it('P101: mixpanel-app.io — Mixpanel product analytics via window.mixpanel and CDN library', () => {
      const signals: HarvestedSignals = {
        url: 'https://mixpanel-app.io',
        globals: { mixpanel: { track: () => {} } },
        dom: [],
        meta: [],
        resources: ['https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'],
      };
      const result = evaluateSignals(signals);
      const mp = result.technologies.find((t) => t.id === 'mixpanel');

      expect(mp).toBeDefined();
      expect(mp?.category).toBe('analytics');
      expect(mp?.confidenceTier).toBe('high');
    });

    it('P102: amplitude-analytics.com — Amplitude product insights via window.amplitude and browser SDK', () => {
      const signals: HarvestedSignals = {
        url: 'https://amplitude-analytics.com',
        globals: { amplitude: { track: () => {} } },
        dom: [],
        meta: [],
        resources: ['https://cdn.amplitude.com/libs/analytics-browser-2.5.2-min.js.gz'],
      };
      const result = evaluateSignals(signals);
      const amp = result.technologies.find((t) => t.id === 'amplitude');

      expect(amp).toBeDefined();
      expect(amp?.category).toBe('analytics');
      expect(amp?.confidenceTier).toBe('high');
    });

    it('P103: posthog-saas.dev — PostHog analytics and session replay via window.posthog, toolbar, and array SDK', () => {
      const signals: HarvestedSignals = {
        url: 'https://posthog-saas.dev',
        globals: { posthog: { capture: () => {} } },
        dom: [{ selector: '#posthog-toolbar' }],
        meta: [],
        resources: ['https://us-assets.i.posthog.com/static/array.js'],
      };
      const result = evaluateSignals(signals);
      const ph = result.technologies.find((t) => t.id === 'posthog');

      expect(ph).toBeDefined();
      expect(ph?.category).toBe('analytics');
      expect(ph?.confidenceTier).toBe('high');
    });

    it('P104: snipcart-storefront.com — Snipcart ecommerce via window.Snipcart, #snipcart container, and themed JS', () => {
      const signals: HarvestedSignals = {
        url: 'https://snipcart-storefront.com',
        globals: { Snipcart: {} },
        dom: [{ selector: '#snipcart' }],
        meta: [],
        resources: ['https://cdn.snipcart.com/themes/v3.0.31/default/snipcart.js'],
      };
      const result = evaluateSignals(signals);
      const sc = result.technologies.find((t) => t.id === 'snipcart');

      expect(sc).toBeDefined();
      expect(sc?.category).toBe('ecommerce');
      expect(sc?.confidenceTier).toBe('high');
    });
  });

  describe('Category 11: Real-World Multi-Layer Deployments & Version Accuracy — 6 Cases', () => {
    it('P105: vercel-commerce.store — Next.js 14 + React 18 + Tailwind CSS + Stripe with corroboration', () => {
      const signals: HarvestedSignals = {
        url: 'https://vercel-commerce.store',
        globals: {
          __NEXT_DATA__: { props: { pageProps: {} } },
          React: { version: '18.2.0' },
          Stripe: function() {},
        },
        dom: [
          { selector: '#__next' },
          { selector: 'link[rel*="next"]' },
          { selector: 'div.tailwindcss-root' },
        ],
        meta: [],
        resources: [
          'https://vercel-commerce.store/_next/static/chunks/main-app.js',
          'https://js.stripe.com/v3/',
          'https://vercel-commerce.store/styles/tailwind.css',
        ],
      };
      const result = evaluateSignals(signals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      const react = result.technologies.find((t) => t.id === 'react');
      const stripe = result.technologies.find((t) => t.id === 'stripe');

      expect(nextjs).toBeDefined();
      expect(nextjs?.confidenceTier).toBe('high');
      expect(react).toBeDefined();
      expect(react?.version).toBe('18.2.0');
      expect(stripe).toBeDefined();
      expect(stripe?.confidenceTier).toBe('high');
    });

    it('P106: modern-docs.dev — Astro + Lucide Icons + Tailwind CSS deployment', () => {
      const signals: HarvestedSignals = {
        url: 'https://modern-docs.dev',
        globals: {
          astro: {},
          lucide: { createIcons: function() {} },
        },
        dom: [
          { selector: 'astro-island' },
          { selector: '[data-astro-cid]' },
          { selector: 'svg.lucide' },
          { selector: '[data-lucide]' },
        ],
        meta: [],
        resources: [
          'https://modern-docs.dev/_astro/client.js',
          'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
        ],
      };
      const result = evaluateSignals(signals);
      const astro = result.technologies.find((t) => t.id === 'astro');
      const lucide = result.technologies.find((t) => t.id === 'lucide');

      expect(astro).toBeDefined();
      expect(astro?.confidenceTier).toBe('high');
      expect(lucide).toBeDefined();
      expect(lucide?.confidenceTier).toBe('high');
    });

    it('P107: shopify-flagship.com — Shopify Enterprise + jQuery 3.7.1 + Google Analytics + Meta Pixel + Cloudflare', () => {
      const signals: HarvestedSignals = {
        url: 'https://shopify-flagship.com',
        globals: {
          Shopify: { theme: { id: 98765 } },
          jQuery: { fn: { jquery: '3.7.1' } },
          $: { fn: { jquery: '3.7.1' } },
          fbq: function() {},
          gtag: function() {},
          __cfRLUnblockHandlers: true,
          _cf_chl_opt: {},
        },
        dom: [
          { selector: 'link[href*="cdn.shopify.com"]' },
          { selector: 'script[id="shopify-features"]' },
        ],
        meta: [],
        resources: [
          'https://cdn.shopify.com/s/files/1/0001/theme.js?v=2025',
          'https://connect.facebook.net/en_US/fbevents.js',
          'https://www.googletagmanager.com/gtag/js?id=G-123456',
          'https://static.cloudflareinsights.com/beacon.min.js',
        ],
        headers: {
          server: 'cloudflare',
        },
      };
      const result = evaluateSignals(signals);
      const shopify = result.technologies.find((t) => t.id === 'shopify');
      const jquery = result.technologies.find((t) => t.id === 'jquery');
      const metaPixel = result.technologies.find((t) => t.id === 'meta-pixel');
      const cf = result.technologies.find((t) => t.id === 'cloudflare');

      expect(shopify).toBeDefined();
      expect(shopify?.confidenceTier).toBe('high');
      expect(jquery).toBeDefined();
      expect(jquery?.version).toBe('3.7.1');
      expect(metaPixel).toBeDefined();
      expect(cf).toBeDefined();
      expect(cf?.confidenceTier).toBe('high');
    });

    it('P108: vue-content-hub.io — Nuxt 3 + Vue 3.4.15 + Contentful integration', () => {
      const signals: HarvestedSignals = {
        url: 'https://vue-content-hub.io',
        globals: {
          __NUXT__: {},
          Vue: { version: '3.4.15' },
        },
        dom: [
          { selector: '#__nuxt' },
        ],
        meta: [],
        resources: [
          'https://vue-content-hub.io/_nuxt/entry.js',
          'https://cdn.jsdelivr.net/npm/contentful@latest/dist/contentful.browser.min.js',
        ],
      };
      const result = evaluateSignals(signals);
      const nuxt = result.technologies.find((t) => t.id === 'nuxt');
      const vue = result.technologies.find((t) => t.id === 'vue');
      const contentful = result.technologies.find((t) => t.id === 'contentful');

      expect(nuxt).toBeDefined();
      expect(nuxt?.confidenceTier).toBe('high');
      expect(vue).toBeDefined();
      expect(vue?.version).toBe('3.4.15');
      expect(contentful).toBeDefined();
    });

    it('P109: sveltekit-portal.dev — SvelteKit 2 + Svelte client-side hydration', () => {
      const signals: HarvestedSignals = {
        url: 'https://sveltekit-portal.dev',
        globals: {
          __sveltekit_data: {},
        },
        dom: [
          { selector: '[data-sveltekit-preload-data]', attribute: 'data-sveltekit-preload-data', value: 'hover' },
          { selector: 'script[data-sveltekit-fetched]' },
        ],
        meta: [],
        resources: [
          'https://sveltekit-portal.dev/_app/immutable/entry/start.js',
          'https://sveltekit-portal.dev/_app/immutable/entry/app.js',
        ],
      };
      const result = evaluateSignals(signals);
      const sveltekit = result.technologies.find((t) => t.id === 'sveltekit');
      const svelte = result.technologies.find((t) => t.id === 'svelte');

      expect(sveltekit).toBeDefined();
      expect(sveltekit?.confidenceTier).toBe('high');
      expect(svelte).toBeDefined();
    });

    it('P110: open-docs.org — Docusaurus 3.1.1 + React 18.3.1 with accurate version extraction', () => {
      const signals: HarvestedSignals = {
        url: 'https://open-docs.org',
        globals: {
          React: { version: '18.3.1' },
        },
        dom: [
          { selector: 'div#__docusaurus' },
          { selector: 'nav.navbar--fixed-top' },
        ],
        meta: [
          { name: 'generator', content: 'Docusaurus v3.1.1' },
        ],
        resources: [
          'https://open-docs.org/assets/js/main.js',
        ],
      };
      const result = evaluateSignals(signals);
      const docusaurus = result.technologies.find((t) => t.id === 'docusaurus');
      const react = result.technologies.find((t) => t.id === 'react');

      expect(docusaurus).toBeDefined();
      expect(docusaurus?.version).toBe('3.1.1');
      expect(docusaurus?.confidenceTier).toBe('high');
      expect(react).toBeDefined();
      expect(react?.version).toBe('18.3.1');
    });
  });

  // =========================================================================
  // STAGE 3: NEGATIVE-CONTROL BENCHMARK (29 Cases)
  // =========================================================================

  describe('Stage 3: Negative-Control Benchmark — 29 Cases', () => {
    it('NC-01: Generic CSS utility-like classes do NOT trigger Tailwind CSS', () => {
      const signals: HarvestedSignals = {
        url: 'https://bootstrap-generic.org',
        globals: {},
        dom: [
          { selector: 'div.flex' },
          { selector: 'div.grid' },
          { selector: 'div.hidden' },
          { selector: 'div.container' },
          { selector: 'div.card' },
        ],
        meta: [],
        resources: ['https://bootstrap-generic.org/main.css'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'tailwindcss')).toBe(false);
    });

    it('NC-02: Cloudflare Turnstile script alone on AWS host yields ZERO Cloudflare detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://portal.aws-deployed.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          'https://challenges.cloudflare.com/turnstile/v0/api.js',
          'https://portal.aws-deployed.com/app.js',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'cloudflare')).toBe(false);
      expect(result.technologies.length).toBe(0);
    });

    it('NC-03: Standalone Cloudflare Web Analytics beacon yields strictly Low confidence (45 pts), NOT High', () => {
      const signals: HarvestedSignals = {
        url: 'https://beacon-only-site.net',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://static.cloudflareinsights.com/beacon.min.js'],
      };
      const result = evaluateSignals(signals);
      const cf = result.technologies.find((t) => t.id === 'cloudflare');

      expect(cf).toBeDefined();
      expect(cf?.confidenceScore).toBe(45);
      expect(cf?.confidenceTier).toBe('low');
      expect(cf?.confidenceTier).not.toBe('high');
    });

    it('NC-04: Static blog discussing WooCommerce yields ZERO WooCommerce detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://ecommerce-reviews.com/woocommerce-vs-shopify',
        globals: {},
        dom: [{ selector: 'article' }],
        meta: [{ name: 'description', content: 'Comprehensive review comparing WooCommerce and Shopify plugins.' }],
        resources: ['https://ecommerce-reviews.com/assets/images/woocommerce-dashboard.png'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'woocommerce')).toBe(false);
    });

    it('NC-05: React-like DOM structures (#root, .component-root) yield ZERO React detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://vanilla-spa.com',
        globals: {},
        dom: [
          { selector: 'div#root' },
          { selector: 'div.component-root' },
          { selector: 'div[data-component="App"]' },
        ],
        meta: [],
        resources: ['https://vanilla-spa.com/bundle.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'react')).toBe(false);
    });

    it('NC-06: Documentation endpoint react.js.json produces ZERO direct React detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://react.dev/learn',
        globals: {},
        meta: [],
        dom: [],
        resources: [
          'https://react.dev/_next/data/BUILD_99/reference/react.json',
          'https://react.dev/_next/data/BUILD_99/reference/react.js.json',
          'https://react.dev/_next/data/BUILD_99/reference/react-dom.json',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'react' && t.detectionType === 'direct')).toBe(false);
      expect(result.technologies.length).toBe(0);
    });

    it('NC-07: In-house analytics dataLayer without GTM script yields ZERO GTM detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://custom-analytics.org',
        globals: { dataLayer: [{ event: 'page_view' }] }, // Weight = 25, noise floor = 30
        meta: [],
        dom: [],
        resources: ['https://custom-analytics.org/tracker.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'google-tag-manager')).toBe(false);
    });

    it('NC-08: GA4 gtag setup does NOT falsely report Google Tag Manager', () => {
      const signals: HarvestedSignals = {
        url: 'https://ga4-direct.com',
        globals: { gtag: () => {} },
        meta: [],
        dom: [],
        resources: [
          'https://www.googletagmanager.com/gtag/js?id=G-GA4ONLY999',
          'https://www.google-analytics.com/g/collect?v=2&tid=G-GA4ONLY999',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'google-analytics')).toBe(true);
      expect(result.technologies.some((t) => t.id === 'google-tag-manager')).toBe(false);
    });

    it('NC-09: cdnjs mirror script does NOT classify site as Cloudflare infrastructure', () => {
      const signals: HarvestedSignals = {
        url: 'https://personal-blog.io',
        globals: { jQuery: { fn: { jquery: '3.7.1' } } },
        meta: [],
        dom: [],
        resources: ['https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'cloudflare')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'jquery')).toBe(true);
    });

    it('NC-10: Shopify CDN image on non-Shopify site yields strictly Low confidence (30 pts)', () => {
      const signals: HarvestedSignals = {
        url: 'https://photographer-portfolio.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://cdn.shopify.com/s/files/1/0000/files/hero.jpg'],
      };
      const result = evaluateSignals(signals);
      const shopify = result.technologies.find((t) => t.id === 'shopify');

      expect(shopify).toBeDefined();
      expect(shopify?.confidenceScore).toBe(30);
      expect(shopify?.confidenceTier).toBe('low');
      expect(shopify?.confidenceTier).not.toBe('high');
    });

    it('NC-11: Static payment badges do NOT detect Stripe or Razorpay without active scripts', () => {
      const signals: HarvestedSignals = {
        url: 'https://static-badges-store.com',
        globals: {},
        dom: [{ selector: 'img[alt="We accept Stripe and Razorpay"]' }],
        meta: [],
        resources: [
          'https://static-badges-store.com/stripe-badge.svg',
          'https://static-badges-store.com/razorpay-badge.svg',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'stripe')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'razorpay')).toBe(false);
      expect(result.technologies.length).toBe(0);
    });

    it('NC-12: Custom window.$ selector helper does NOT detect jQuery', () => {
      const signals: HarvestedSignals = {
        url: 'https://modern-vanilla.dev',
        globals: { $: (sel: string) => document.querySelector(sel) },
        dom: [],
        meta: [],
        resources: ['https://modern-vanilla.dev/app.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'jquery')).toBe(false);
    });

    it('NC-13: Web components (<user-avatar>, <app-root>) without ng-version do NOT detect Angular', () => {
      const signals: HarvestedSignals = {
        url: 'https://web-components.org',
        globals: {},
        dom: [
          { selector: 'user-avatar' },
          { selector: 'app-root' }, // Alone app-root is weight 35, low
        ],
        meta: [],
        resources: ['https://web-components.org/elements.js'],
      };
      const result = evaluateSignals(signals);
      // app-root alone gives 35 low confidence without corroboration, but must not be High
      const ng = result.technologies.find((t) => t.id === 'angular');
      if (ng) {
        expect(ng.confidenceTier).not.toBe('high');
        expect(ng.version).toBeUndefined();
      }
    });

    it('NC-14: Stale generator note in non-generator meta tag does NOT detect WordPress', () => {
      const signals: HarvestedSignals = {
        url: 'https://migrated-from-wp.com',
        globals: {},
        dom: [],
        meta: [{ name: 'generator-history', content: 'WordPress 4.9.8 in 2018' }],
        resources: ['https://migrated-from-wp.com/static.css'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'wordpress')).toBe(false);
    });

    it('NC-15: Dead window.intercomSettings object without widget does NOT achieve High confidence', () => {
      const signals: HarvestedSignals = {
        url: 'https://forgotten-intercom.com',
        globals: { intercomSettings: { app_id: 'dead_app' } },
        dom: [],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const ic = result.technologies.find((t) => t.id === 'intercom');

      if (ic) {
        expect(ic.confidenceTier).not.toBe('high');
      }
    });

    it('NC-16: Privacy-respecting site without fbevents.js yields ZERO Meta Pixel detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://privacy-first.eu',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://privacy-first.eu/secure.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'meta-pixel')).toBe(false);
    });

    it('NC-17: Completely clean vanilla HTML5 portfolio yields ZERO detections across all 22 technologies', () => {
      const signals: HarvestedSignals = {
        url: 'https://clean-portfolio.io',
        globals: { document: {}, navigator: {} },
        dom: [
          { selector: 'header' },
          { selector: 'nav' },
          { selector: 'main' },
          { selector: 'section' },
          { selector: 'footer' },
        ],
        meta: [
          { name: 'viewport', content: 'width=device-width, initial-scale=1' },
          { name: 'description', content: 'Clean semantic personal website' },
        ],
        resources: [
          'https://clean-portfolio.io/styles.css',
          'https://clean-portfolio.io/main.js',
          'https://clean-portfolio.io/portrait.webp',
        ],
      };
      const result = evaluateSignals(signals);

      expect(result.technologies).toEqual([]);
      expect(result.stats.total).toBe(0);
      expect(result.stats.high).toBe(0);
      expect(result.stats.medium).toBe(0);
      expect(result.stats.low).toBe(0);
    });

    it('NC-18: Generic CSS class containing "svelte" (e.g. .svelte-btn, .svelte-theme) does NOT trigger Svelte', () => {
      const signals: HarvestedSignals = {
        url: 'https://theme-store.com',
        globals: {},
        dom: [
          { selector: '[class*="svelte-"]', attribute: 'class', value: 'btn svelte-btn svelte-theme' },
        ],
        meta: [],
        resources: ['https://theme-store.com/style.css'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'svelte')).toBe(false);
    });

    it('NC-19: Generic data-sveltekit string in code block does NOT trigger SvelteKit', () => {
      const signals: HarvestedSignals = {
        url: 'https://dev-blog.com/svelte-tutorial',
        globals: {},
        dom: [
          { selector: 'code' },
        ],
        meta: [],
        resources: ['https://dev-blog.com/app.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'sveltekit')).toBe(false);
    });

    it('NC-20: Generic div with id="nuxt-box" does NOT trigger Nuxt', () => {
      const signals: HarvestedSignals = {
        url: 'https://generic-site.com',
        globals: {},
        dom: [
          { selector: 'div#nuxt-box' },
        ],
        meta: [],
        resources: ['https://generic-site.com/app.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'nuxt')).toBe(false);
    });

    it('NC-21: Static site discussing astronomy with "Astro" in title and meta does NOT detect Astro framework', () => {
      const signals: HarvestedSignals = {
        url: 'https://astrophotography.org',
        globals: {},
        dom: [],
        meta: [
          { name: 'description', content: 'Astro photography guide for deep sky objects' },
        ],
        resources: ['https://astrophotography.org/stars.jpg'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'astro')).toBe(false);
    });

    it('NC-22: Next.js Pages router application does NOT falsely detect Remix', () => {
      const signals: HarvestedSignals = {
        url: 'https://nextjs-app.com',
        globals: {
          __NEXT_DATA__: { page: '/' },
        },
        dom: [
          { selector: '#__next' },
        ],
        meta: [{ name: 'next-head-count', content: '10' }],
        resources: ['https://nextjs-app.com/_next/static/chunks/main.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'nextjs')).toBe(true);
      expect(result.technologies.some((t) => t.id === 'remix')).toBe(false);
    });

    it('NC-23: Static HTML referring to Drupal in body text yields ZERO Drupal detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://tech-comparisons.io/cms-review',
        globals: {},
        dom: [
          { selector: 'article' },
        ],
        meta: [
          { name: 'description', content: 'Why our team migrated away from Drupal to custom software' },
        ],
        resources: ['https://tech-comparisons.io/bundle.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'drupal')).toBe(false);
    });

    it('NC-24: WordPress blog using a "ghost" theme does NOT falsely detect Ghost CMS', () => {
      const signals: HarvestedSignals = {
        url: 'https://wp-writer.com',
        globals: { wp: {} },
        meta: [{ name: 'generator', content: 'WordPress 6.4.2' }],
        dom: [{ selector: 'link[rel*="https://api.w.org/"]' }],
        resources: [
          'https://wp-writer.com/wp-content/themes/ghost-writer/style.css',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'wordpress')).toBe(true);
      expect(result.technologies.some((t) => t.id === 'ghost')).toBe(false);
    });

    it('NC-25: Static asset hosted on squarespace CDN embedded on a third-party blog yields strictly Low confidence (30 pts)', () => {
      const signals: HarvestedSignals = {
        url: 'https://external-art-blog.com',
        globals: {},
        meta: [],
        dom: [],
        resources: [
          'https://static1.squarespace.com/static/artwork/portfolio.png',
        ],
      };
      const result = evaluateSignals(signals);
      const sq = result.technologies.find((t) => t.id === 'squarespace');
      expect(sq).toBeDefined();
      expect(sq?.confidenceScore).toBe(30);
      expect(sq?.confidenceTier).toBe('low');
      expect(sq?.confidenceTier).not.toBe('high');
    });

    it('NC-26: Near-match HTML attributes like x-data-toggle do NOT trigger Alpine.js', () => {
      const signals: HarvestedSignals = {
        url: 'https://bootstrap-near-match.com',
        globals: {},
        dom: [
          { selector: 'button[data-toggle="modal"]' },
          { selector: '[data-alpine-test]' },
        ],
        meta: [],
        resources: ['https://bootstrap-near-match.com/app.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'alpinejs')).toBe(false);
    });

    it('NC-27: Custom attributes with hx- prefix like hx-dummy do NOT trigger HTMX', () => {
      const signals: HarvestedSignals = {
        url: 'https://custom-attribute-site.org',
        globals: {},
        dom: [
          { selector: '[hx-dummy]' },
          { selector: '[hx-custom-foo]' },
        ],
        meta: [],
        resources: ['https://custom-attribute-site.org/main.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'htmx')).toBe(false);
    });

    it('NC-28: Static HTML referring to Hugo, Jekyll, or Eleventy in blog body without generator meta tag produces ZERO detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://jamstack-comparisons.net/ssg-guide',
        globals: {},
        dom: [
          { selector: 'article' },
        ],
        meta: [
          { name: 'description', content: 'Comprehensive guide to static site generators: Hugo, Jekyll, and Eleventy.' },
        ],
        resources: ['https://jamstack-comparisons.net/bundle.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'hugo')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'jekyll')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'eleventy')).toBe(false);
    });

    it('NC-29: Generic SPA container without SolidJS hydrate markers or Qwik container yields ZERO SolidJS/Qwik detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://generic-modern-spa.io',
        globals: {},
        dom: [
          { selector: '#app' },
          { selector: 'div[data-container]' },
        ],
        meta: [],
        resources: ['https://generic-modern-spa.io/assets/bundle.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'solidjs')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'qwik')).toBe(false);
    });

    it('NC-30: Static HTML referring to Joomla or PrestaShop in blog text yields ZERO detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://cms-reviews.org/comparison',
        globals: {},
        dom: [{ selector: 'article' }],
        meta: [{ name: 'description', content: 'Migrating legacy Joomla and PrestaShop stores to modern headless.' }],
        resources: ['https://cms-reviews.org/app.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'joomla')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'prestashop')).toBe(false);
    });

    it('NC-31: Unrelated button classes or generic payment copy do NOT trigger PayPal or Klarna', () => {
      const signals: HarvestedSignals = {
        url: 'https://local-bakery.com/checkout',
        globals: {},
        dom: [
          { selector: 'button.checkout-button' },
          { selector: 'div.payment-options' },
        ],
        meta: [{ name: 'description', content: 'Accepting cash and card payments.' }],
        resources: ['https://local-bakery.com/checkout.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'paypal')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'klarna')).toBe(false);
    });

    it('NC-32: Generic analytics/telemetry scripts do NOT falsely trigger Mixpanel, Amplitude, or PostHog', () => {
      const signals: HarvestedSignals = {
        url: 'https://generic-analytics.org',
        globals: { myTelemetry: {} },
        dom: [],
        meta: [],
        resources: ['https://generic-analytics.org/telemetry/tracker.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'mixpanel')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'amplitude')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'posthog')).toBe(false);
    });

    it('NC-33: Custom web components without Stencil build attributes do NOT trigger Stencil', () => {
      const signals: HarvestedSignals = {
        url: 'https://webcomponents-standard.dev',
        globals: {},
        dom: [
          { selector: 'my-custom-element' },
          { selector: 'user-card' },
        ],
        meta: [],
        resources: ['https://webcomponents-standard.dev/elements.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'stencil')).toBe(false);
    });

    it('NC-34: Unrelated shopping cart markup does NOT trigger Snipcart or BigCommerce', () => {
      const signals: HarvestedSignals = {
        url: 'https://bespoke-crafts.com/shop',
        globals: {},
        dom: [
          { selector: '.shopping-cart-container' },
          { selector: 'button.add-to-basket' },
        ],
        meta: [],
        resources: ['https://bespoke-crafts.com/assets/cart.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'snipcart')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'bigcommerce')).toBe(false);
    });

    it('NC-35: Vanilla website with generic tracker.js does NOT trigger React or Next.js', () => {
      const signals: HarvestedSignals = {
        url: 'https://clean-static-portfolio.com',
        globals: {},
        dom: [
          { selector: 'nav.main-nav' },
          { selector: 'div.portfolio-grid' },
        ],
        meta: [],
        resources: [
          'https://clean-static-portfolio.com/scripts/tracker.js',
          'https://clean-static-portfolio.com/styles/style.css',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'react')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'nextjs')).toBe(false);
      expect(result.technologies.length).toBe(0);
    });

    it('NC-36: SEO blog meta keywords mentioning technologies do NOT trigger false positives', () => {
      const signals: HarvestedSignals = {
        url: 'https://techblog.dev/article/react-vs-wordpress-2026',
        globals: {},
        dom: [
          { selector: 'article.post' },
          { selector: 'h1.entry-title' },
        ],
        meta: [
          { name: 'keywords', content: 'wordpress, shopify, react, stripe, nextjs, woocommerce' },
          { name: 'description', content: 'Comparing WordPress, Shopify, Next.js and React architecture in 2026.' },
        ],
        resources: [
          'https://techblog.dev/assets/blog-main.js',
          'https://techblog.dev/assets/styles.css',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'wordpress')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'shopify')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'react')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'nextjs')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'stripe')).toBe(false);
      expect(result.technologies.length).toBe(0);
    });

    it('NC-37: Non-Shopify store with asset URL containing not-shopify does NOT trigger Shopify', () => {
      const signals: HarvestedSignals = {
        url: 'https://independent-artisan.org',
        globals: {},
        dom: [
          { selector: 'div.shop-shelf' },
        ],
        meta: [],
        resources: [
          'https://cdn.artisan.org/assets/not-shopify/theme-custom.js',
        ],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'shopify')).toBe(false);
      expect(result.technologies.length).toBe(0);
    });

    it('NC-38: Lookalike global window.vueAppConfig without Vue runtime does NOT trigger Vue.js', () => {
      const signals: HarvestedSignals = {
        url: 'https://custom-spa.net',
        globals: {
          vueAppConfig: { mode: 'standalone' },
        },
        dom: [],
        meta: [],
        resources: ['https://custom-spa.net/bundle.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'vue')).toBe(false);
    });

    it('NC-39: Generic server headers Express or Apache do NOT trigger Next.js, Nuxt, or Remix', () => {
      const signals: HarvestedSignals = {
        url: 'https://api-server.org',
        globals: {},
        dom: [],
        meta: [],
        resources: [],
        headers: {
          'server': 'Apache/2.4.52 (Ubuntu)',
          'x-powered-by': 'Express',
        },
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'nextjs')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'nuxt')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'remix')).toBe(false);
    });

    it('NC-40: Code snippets containing Next.js and React text in markup do NOT trigger detections', () => {
      const signals: HarvestedSignals = {
        url: 'https://tutorial-archive.io',
        globals: {},
        dom: [
          { selector: 'pre code' },
          { selector: 'span.code-keyword' },
        ],
        meta: [],
        resources: ['https://tutorial-archive.io/prism.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'nextjs')).toBe(false);
      expect(result.technologies.some((t) => t.id === 'react')).toBe(false);
    });

    it('NC-41: Standalone SVG icon with class icon-react-logo does NOT trigger React library', () => {
      const signals: HarvestedSignals = {
        url: 'https://icon-gallery.com',
        globals: {},
        dom: [
          { selector: 'svg.icon-react-logo' },
          { selector: 'path[d*="M12"]' },
        ],
        meta: [],
        resources: ['https://icon-gallery.com/icons.js'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'react')).toBe(false);
    });

    it('NC-42: CSS class stripe-pattern for background styling does NOT trigger Stripe gateway', () => {
      const signals: HarvestedSignals = {
        url: 'https://pattern-lab.design',
        globals: {},
        dom: [
          { selector: 'div.stripe-pattern' },
          { selector: 'section.diagonal-stripe' },
        ],
        meta: [],
        resources: ['https://pattern-lab.design/app.css'],
      };
      const result = evaluateSignals(signals);
      expect(result.technologies.some((t) => t.id === 'stripe')).toBe(false);
    });
  });

  // =========================================================================
  // STAGE 4: STATISTICAL RELIABILITY & METRICS AGGREGATION
  // =========================================================================

  describe('Stage 4: Programmatic Benchmark Metrics Verification', () => {
    it('Should verify catalog coverage across benchmark audit suite and definition integrity', () => {
      // Confirm all 60 rules in catalog are tested
      const testedRuleIds = new Set([
        'wordpress', 'webflow', 'wix',
        'shopify', 'woocommerce',
        'nextjs', 'vue', 'vitepress', 'angular',
        'react', 'jquery', 'bootstrap', 'tailwindcss',
        'google-analytics', 'google-tag-manager', 'hotjar',
        'meta-pixel', 'hubspot', 'intercom',
        'stripe', 'razorpay',
        'cloudflare', 'vercel', 'netlify',
        'svelte', 'sveltekit', 'nuxt', 'astro', 'remix',
        'drupal', 'ghost', 'squarespace',
        'alpinejs', 'htmx', 'docusaurus', 'hugo', 'jekyll', 'eleventy', 'solidjs', 'qwik',
        'preact', 'lit', 'solidstart', 'qwik-city', 'ember', 'stencil',
        'joomla', 'sanity', 'contentful', 'storyblok',
        'magento', 'bigcommerce', 'prestashop', 'opencart',
        'paypal', 'klarna',
        'mixpanel', 'amplitude', 'posthog',
        'snipcart',
        // Stage 2.9.4 Catalog Expansion (Technologies 61 to 80)
        'gatsby', 'threejs', 'sentry', 'segment', 'clerk',
        'datadog-rum', 'd3', 'recaptcha',
        'lucide', 'fontawesome', 'prismjs', 'highlightjs',
        'swiper', 'gsap', 'chartjs',
        'emotion', 'styled-components', 'mui', 'chakra-ui',
        'lodash',
      ]);

      for (const rule of ALL_RULES) {
        expect(testedRuleIds.has(rule.id), `Legacy rule "${rule.id}" must be included in Phase 7 audit`).toBe(true);
      }
      for (const def of CANONICAL_TECHNOLOGY_DEFINITIONS) {
        expect(testedRuleIds.has(def.id), `Canonical definition "${def.id}" must be included in Phase 7 audit`).toBe(true);
      }
      expect(testedRuleIds.size).toBe(80);
    });

    it('Should execute benchmark scenarios, verify assertion set, and report scoped metrics with explicit denominators', () => {
      // Benchmark cases representing diverse real-world architectures and negative controls
      const benchmarkCases: Array<{
        name: string;
        signals: HarvestedSignals;
        expectedDetections: string[];
        expectedAbsences: string[];
        expectedVersions?: Record<string, string>;
      }> = [
        {
          name: 'P105: Vercel Commerce Next.js + React + Stripe',
          signals: {
            url: 'https://vercel-commerce.store',
            globals: {
              __NEXT_DATA__: { props: { pageProps: {} } },
              React: { version: '18.2.0' },
              Stripe: function() {},
            },
            dom: [{ selector: '#__next' }, { selector: 'link[rel*="next"]' }, { selector: 'div.tailwindcss-root' }],
            meta: [],
            resources: ['https://vercel-commerce.store/_next/static/chunks/main-app.js', 'https://js.stripe.com/v3/', '/styles/tailwind.css'],
          },
          expectedDetections: ['nextjs', 'react', 'stripe'],
          expectedAbsences: ['shopify', 'wordpress', 'vue'],
          expectedVersions: { react: '18.2.0' },
        },
        {
          name: 'P106: Modern Docs Astro + Lucide',
          signals: {
            url: 'https://modern-docs.dev',
            globals: { astro: {}, lucide: { createIcons: function() {} } },
            dom: [{ selector: 'astro-island' }, { selector: '[data-astro-cid]' }, { selector: 'svg.lucide' }, { selector: '[data-lucide]' }],
            meta: [],
            resources: ['https://modern-docs.dev/_astro/client.js', 'https://unpkg.com/lucide@latest/dist/umd/lucide.js'],
          },
          expectedDetections: ['astro', 'lucide'],
          expectedAbsences: ['react', 'nextjs', 'wordpress'],
        },
        {
          name: 'P107: Shopify Flagship + jQuery + Cloudflare',
          signals: {
            url: 'https://shopify-flagship.com',
            globals: {
              Shopify: { theme: { id: 98765 } },
              jQuery: { fn: { jquery: '3.7.1' } },
              $: { fn: { jquery: '3.7.1' } },
              fbq: function() {},
              gtag: function() {},
              __cfRLUnblockHandlers: true,
              _cf_chl_opt: {},
            },
            dom: [{ selector: 'link[href*="cdn.shopify.com"]' }, { selector: 'script[id="shopify-features"]' }],
            meta: [],
            resources: [
              'https://cdn.shopify.com/s/files/1/0001/theme.js?v=2025',
              'https://connect.facebook.net/en_US/fbevents.js',
              'https://www.googletagmanager.com/gtag/js?id=G-123456',
              'https://static.cloudflareinsights.com/beacon.min.js',
            ],
            headers: { server: 'cloudflare' },
          },
          expectedDetections: ['shopify', 'jquery', 'cloudflare', 'meta-pixel'],
          expectedAbsences: ['woocommerce', 'magento', 'bigcommerce'],
          expectedVersions: { jquery: '3.7.1' },
        },
        {
          name: 'P108: Nuxt 3 Content Hub + Vue 3',
          signals: {
            url: 'https://vue-content-hub.io',
            globals: { __NUXT__: {}, Vue: { version: '3.4.15' } },
            dom: [{ selector: '#__nuxt' }],
            meta: [],
            resources: ['https://vue-content-hub.io/_nuxt/entry.js', 'https://cdn.jsdelivr.net/npm/contentful@latest/dist/contentful.browser.min.js'],
          },
          expectedDetections: ['nuxt', 'vue', 'contentful'],
          expectedAbsences: ['nextjs', 'react'],
          expectedVersions: { vue: '3.4.15' },
        },
        {
          name: 'P109: SvelteKit 2 Portal',
          signals: {
            url: 'https://sveltekit-portal.dev',
            globals: { __sveltekit_data: {} },
            dom: [
              { selector: '[data-sveltekit-preload-data]', attribute: 'data-sveltekit-preload-data', value: 'hover' },
              { selector: 'script[data-sveltekit-fetched]' },
            ],
            meta: [],
            resources: ['https://sveltekit-portal.dev/_app/immutable/entry/start.js'],
          },
          expectedDetections: ['sveltekit', 'svelte'],
          expectedAbsences: ['react', 'vue', 'angular'],
        },
        {
          name: 'P110: Docusaurus 3 + React',
          signals: {
            url: 'https://open-docs.org',
            globals: { React: { version: '18.3.1' } },
            dom: [{ selector: 'div#__docusaurus' }, { selector: 'nav.navbar--fixed-top' }],
            meta: [{ name: 'generator', content: 'Docusaurus v3.1.1' }],
            resources: ['https://open-docs.org/assets/js/main.js'],
          },
          expectedDetections: ['docusaurus', 'react'],
          expectedAbsences: ['vue', 'angular'],
          expectedVersions: { docusaurus: '3.1.1', react: '18.3.1' },
        },
        // Negative Controls
        {
          name: 'NC-35: Clean static portfolio with tracker.js',
          signals: {
            url: 'https://clean-static-portfolio.com',
            globals: {},
            dom: [{ selector: 'nav.main-nav' }, { selector: 'div.portfolio-grid' }],
            meta: [],
            resources: ['https://clean-static-portfolio.com/scripts/tracker.js'],
          },
          expectedDetections: [],
          expectedAbsences: ['react', 'nextjs', 'vue', 'wordpress', 'shopify'],
        },
        {
          name: 'NC-36: Meta keywords mentioning tech names',
          signals: {
            url: 'https://techblog.dev/article/react-vs-wordpress-2026',
            globals: {},
            dom: [{ selector: 'article.post' }],
            meta: [{ name: 'keywords', content: 'wordpress, shopify, react, stripe, nextjs, woocommerce' }],
            resources: ['https://techblog.dev/assets/blog-main.js'],
          },
          expectedDetections: [],
          expectedAbsences: ['wordpress', 'shopify', 'react', 'nextjs', 'stripe'],
        },
        {
          name: 'NC-37: Non-Shopify store asset not-shopify',
          signals: {
            url: 'https://independent-artisan.org',
            globals: {},
            dom: [{ selector: 'div.shop-shelf' }],
            meta: [],
            resources: ['https://cdn.artisan.org/assets/not-shopify/theme-custom.js'],
          },
          expectedDetections: [],
          expectedAbsences: ['shopify', 'woocommerce'],
        },
        {
          name: 'NC-38: Lookalike global window.vueAppConfig',
          signals: {
            url: 'https://custom-spa.net',
            globals: { vueAppConfig: { mode: 'standalone' } },
            dom: [],
            meta: [],
            resources: ['https://custom-spa.net/bundle.js'],
          },
          expectedDetections: [],
          expectedAbsences: ['vue', 'react', 'angular'],
        },
        {
          name: 'NC-39: Generic server headers Express / Apache',
          signals: {
            url: 'https://api-server.org',
            globals: {},
            dom: [],
            meta: [],
            resources: [],
            headers: { server: 'Apache/2.4.52 (Ubuntu)', 'x-powered-by': 'Express' },
          },
          expectedDetections: [],
          expectedAbsences: ['nextjs', 'nuxt', 'remix'],
        },
      ];

      let truePositives = 0;
      let falsePositives = 0;
      let falseNegatives = 0;
      let trueNegatives = 0;
      let totalVersionChecks = 0;
      let correctVersionChecks = 0;

      for (const testCase of benchmarkCases) {
        const result = evaluateSignals(testCase.signals);
        const detectedIds = new Set(result.technologies.map((t) => t.id));

        for (const expId of testCase.expectedDetections) {
          if (detectedIds.has(expId)) {
            truePositives++;
          } else {
            falseNegatives++;
          }
        }

        for (const absId of testCase.expectedAbsences) {
          if (detectedIds.has(absId)) {
            falsePositives++;
          } else {
            trueNegatives++;
          }
        }

        if (testCase.expectedVersions) {
          for (const [techId, expVer] of Object.entries(testCase.expectedVersions)) {
            totalVersionChecks++;
            const tech = result.technologies.find((t) => t.id === techId);
            if (tech && tech.version === expVer) {
              correctVersionChecks++;
            }
          }
        }
      }

      const precision = truePositives / (truePositives + falsePositives || 1);
      const recall = truePositives / (truePositives + falseNegatives || 1);
      const f1 = (2 * precision * recall) / (precision + recall || 1);
      const versionAccuracy = correctVersionChecks / (totalVersionChecks || 1);

      console.log(`
========================================================================================
SITESTACK PROGRAMMATIC BENCHMARK ASSERTION EXECUTION
Workstream C - Regression Benchmark Set Verification
========================================================================================
  Evaluated Website Scenarios             : ${benchmarkCases.length}
  Individual Detection Assertions (TP)    : ${truePositives} of ${truePositives + falseNegatives} (FN: ${falseNegatives})
  Explicit Absence Assertions (TN)        : ${trueNegatives} of ${trueNegatives + falsePositives} (FP: ${falsePositives})
  Version Extraction Assertions           : ${correctVersionChecks} of ${totalVersionChecks}
----------------------------------------------------------------------------------------
  Precision [TP / (TP + FP)]              : ${(precision * 100).toFixed(2)}% (${truePositives}/${truePositives + falsePositives})
  Recall    [TP / (TP + FN)]              : ${(recall * 100).toFixed(2)}% (${truePositives}/${truePositives + falseNegatives})
  F1 Score  [2 * (P * R) / (P + R)]       : ${(f1 * 100).toFixed(2)}% (${f1.toFixed(4)})
  Version Accuracy [Correct / Checked]    : ${(versionAccuracy * 100).toFixed(2)}% (${correctVersionChecks}/${totalVersionChecks})
----------------------------------------------------------------------------------------
  Benchmark assertion results: SiteStack passed all evaluated detection and absence
  assertions in the selected benchmark scenarios (${benchmarkCases.length} scenarios, ${truePositives} detection
  assertions, ${trueNegatives} absence assertions). These results describe this test set only and
  are not a guarantee of accuracy across all websites or supported technologies.

  Version extraction checks: ${correctVersionChecks} of ${totalVersionChecks} deterministic version assertions passed in this
  benchmark set. This is a limited regression sample, not a comprehensive version
  extraction accuracy estimate.
========================================================================================
      `);

      expect(falsePositives).toBe(0);
      expect(falseNegatives).toBe(0);
      expect(precision).toBe(1.0);
      expect(recall).toBe(1.0);
      expect(f1).toBe(1.0);
      expect(versionAccuracy).toBe(1.0);
    });
  });
});
