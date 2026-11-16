import { TechRule } from '../types';

export const ecommerceRules: TechRule[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    website: 'https://shopify.com',
    icon: '/tech-icons/cms/shopify.svg',
    description: 'Cloud-based commerce platform and online store engine.',
    signals: {
      globals: [
        { path: 'Shopify', weight: 60 },
        { path: 'ShopifyAnalytics', weight: 55 },
        { path: 'BOOMR.themeName', weight: 45 },
      ],
      meta: [
        {
          name: 'shopify-digital-wallet',
          weight: 50,
        },
      ],
      resources: [
        { urlRegex: /cdn\.shopify\.com\/s\/files\//i, weight: 30 },
        { urlRegex: /cdn\.shopify\.com\/shopifycloud\//i, weight: 30 },
        { urlRegex: /monorail-edge\.shopifysvc\.com/i, weight: 30 },
      ],
      dom: [
        { selector: 'input[name="shopify-digital-wallet"]', weight: 35 },
      ],
    },
    versionExtraction: {
      fromGlobal: 'Shopify.theme.version',
    },
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    website: 'https://woocommerce.com',
    icon: '/tech-icons/ecommerce/woocommerce.svg',
    description: 'Customizable, open-source ecommerce platform built on WordPress.',
    implies: ['wordpress'],
    signals: {
      globals: [
        { path: 'woocommerce_params', weight: 60 },
        { path: 'wc_cart_fragments_params', weight: 60 },
      ],
      dom: [
        { selector: 'body.woocommerce', weight: 45 },
        { selector: 'body.woocommerce-page', weight: 45 },
        { selector: '.woocommerce', weight: 35 },
      ],
      meta: [
        {
          name: 'generator',
          contentRegex: /WooCommerce\s*([\d.]+)?/i,
          weight: 50,
        },
      ],
      resources: [
        { urlRegex: /\/plugins\/woocommerce\//i, weight: 40 },
        { urlRegex: /woocommerce(?:\.min)?\.js/i, weight: 35 },
      ],
    },
    versionExtraction: {
      fromMeta: {
        name: 'generator',
        regex: /WooCommerce\s*([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)/i,
      },
      fromResource: {
        // Priority 1: WooCommerce Core frontend script (e.g. assets/js/frontend/woocommerce.min.js?ver=7.1.4)
        urlRegex: /\/plugins\/woocommerce\/(?:assets\/(?:js\/frontend\/)?woocommerce(?:\.min)?\.js.*?ver=)([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/i,
        captureGroup: 1,
        // Priority 2 / Fallback: Any other WooCommerce asset script if core script is not loaded
        fallbackUrlRegex: /\/plugins\/woocommerce\/.*?ver=([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?)/i,
      },
    },
  },
];
