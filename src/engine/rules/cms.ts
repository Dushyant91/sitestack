import { TechRule } from '../types';

export const cmsRules: TechRule[] = [
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'cms',
    website: 'https://wordpress.org',
    icon: '/tech-icons/cms/wordpress.svg',
    description: 'Open-source Content Management System powering over 40% of the web.',
    signals: {
      meta: [
        {
          name: 'generator',
          contentRegex: /WordPress\s*([\d.]+)?/i,
          weight: 55,
        },
      ],
      globals: [
        { path: 'wp', weight: 55 },
        { path: '_wpemojiSettings', weight: 50 },
      ],
      resources: [
        { urlRegex: /\/wp-content\/(?:themes|plugins|uploads)\//i, weight: 40 },
        { urlRegex: /\/wp-includes\/js\//i, weight: 35 },
      ],
      dom: [
        { selector: 'link[rel*="https://api.w.org/"]', weight: 40 },
        { selector: 'link[rel="EditURI"][type="application/rsd+xml"]', weight: 35 },
      ],
    },
    versionExtraction: {
      fromMeta: {
        name: 'generator',
        regex: /WordPress\s*([\d.]+)/i,
      },
      fromResource: {
        urlRegex: /\/wp-emoji-release\.min\.js\?ver=([\d.]+)/i,
        captureGroup: 1,
      },
    },
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'cms',
    website: 'https://webflow.com',
    icon: '/tech-icons/cms/webflow.svg',
    description: 'Visual web design platform, CMS, and hosting engine.',
    signals: {
      globals: [
        { path: 'Webflow', weight: 60 },
      ],
      dom: [
        { selector: 'html[data-wf-page]', weight: 50 },
        { selector: 'html[data-wf-site]', weight: 50 },
      ],
      meta: [
        {
          name: 'generator',
          contentRegex: /Webflow/i,
          weight: 50,
        },
      ],
      resources: [
        { urlRegex: /assets\.website-files\.com\//i, weight: 40 },
        { urlRegex: /assets\.webflow\.com\//i, weight: 40 },
      ],
    },
  },
  {
    id: 'wix',
    name: 'Wix',
    category: 'cms',
    website: 'https://wix.com',
    icon: '/tech-icons/cms/wix.svg',
    description: 'Cloud-based website creation and hosting platform.',
    signals: {
      globals: [
        { path: 'wixBiSession', weight: 60 },
        { path: 'wixPerformanceMeasurements', weight: 55 },
      ],
      meta: [
        {
          name: 'generator',
          contentRegex: /Wix\.com/i,
          weight: 50,
        },
      ],
      resources: [
        { urlRegex: /static\.wixstatic\.com\//i, weight: 40 },
        { urlRegex: /parastorage\.com\//i, weight: 40 },
      ],
    },
  },
];
