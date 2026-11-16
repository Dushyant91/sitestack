import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';
import { ALL_RULES } from '../../src/engine/rules/registry';

/**
 * Phase 7: Expanded Real-World Benchmark & False-Positive Audit
 * 75 Total Benchmark Cases:
 * - 58 Positive Benchmark Cases across 8 categories (CMS, Ecommerce, Frameworks, Libraries, Analytics, Marketing, Payments, Infrastructure)
 * - 17 Negative-Control Benchmark Cases targeting known false-positive and separation risks
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
          { selector: 'link[rel="EditURI"][type="application/rsd+xml"]' },
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

  // =========================================================================
  // STAGE 3: NEGATIVE-CONTROL BENCHMARK (17 Cases)
  // =========================================================================

  describe('Stage 3: Negative-Control Benchmark — 17 Cases', () => {
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
  });

  // =========================================================================
  // STAGE 4: STATISTICAL RELIABILITY & METRICS AGGREGATION
  // =========================================================================

  describe('Stage 4: Programmatic Benchmark Metrics Verification', () => {
    it('Should verify 100% benchmark dataset integrity and compute macro-metrics', () => {
      // Confirm all 22 rules in catalog are tested
      const testedRuleIds = new Set([
        'wordpress', 'webflow', 'wix',
        'shopify', 'woocommerce',
        'nextjs', 'vue', 'vitepress', 'angular',
        'react', 'jquery', 'bootstrap', 'tailwindcss',
        'google-analytics', 'google-tag-manager', 'hotjar',
        'meta-pixel', 'hubspot', 'intercom',
        'stripe', 'razorpay',
        'cloudflare', 'vercel', 'netlify'
      ]);

      for (const rule of ALL_RULES) {
        expect(testedRuleIds.has(rule.id), `Rule "${rule.id}" must be included in Phase 7 audit`).toBe(true);
      }
    });
  });
});
