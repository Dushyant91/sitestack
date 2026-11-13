import { TechRule } from '../types';

export const ecommerceRules: TechRule[] = [
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
        regex: /WooCommerce\s*([\d.]+)/i,
      },
      fromResource: {
        urlRegex: /\/plugins\/woocommerce\/.*?ver=([\d.]+)/i,
        captureGroup: 1,
      },
    },
  },
];
