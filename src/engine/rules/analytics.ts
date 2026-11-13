import { TechRule } from '../types';

export const analyticsRules: TechRule[] = [
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    category: 'analytics',
    website: 'https://analytics.google.com',
    icon: '/tech-icons/analytics/google-analytics.svg',
    description: 'Enterprise web analytics service by Google tracking user traffic and events.',
    signals: {
      globals: [
        { path: 'gtag', weight: 50 },
        { path: 'gaGlobal', weight: 45 },
        { path: 'google_tag_data', weight: 45 },
      ],
      resources: [
        { urlRegex: /google-analytics\.com\/(?:g\/collect|analytics\.js|collect)/i, weight: 45 },
        { urlRegex: /googletagmanager\.com\/gtag\/js\?id=G-/i, weight: 50 },
      ],
    },
    versionExtraction: {
      fromResource: {
        urlRegex: /[?&](?:id|tid)=(G-[A-Z0-9]+)/i,
        captureGroup: 1,
      },
    },
  },
  {
    id: 'google-tag-manager',
    name: 'Google Tag Manager',
    category: 'analytics',
    website: 'https://tagmanager.google.com',
    icon: '/tech-icons/analytics/google-tag-manager.svg',
    description: 'Tag management system for updating tracking codes and analytics tags.',
    signals: {
      globals: [
        { path: 'google_tag_manager', weight: 60 },
        { path: 'dataLayer', weight: 25 }, // Supporting signal: gtag also uses dataLayer, so dataLayer alone must not trigger GTM
      ],
      resources: [
        { urlRegex: /googletagmanager\.com\/gtm\.js/i, weight: 45 },
      ],
      dom: [
        { selector: 'iframe[src*="googletagmanager.com/ns.html"]', weight: 40 },
      ],
    },
    versionExtraction: {
      fromResource: {
        urlRegex: /[?&]id=(GTM-[A-Z0-9]+)/i,
        captureGroup: 1,
      },
    },
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'analytics',
    website: 'https://hotjar.com',
    icon: '/tech-icons/analytics/hotjar.svg',
    description: 'Behavior analytics and user feedback platform with heatmaps and recordings.',
    signals: {
      globals: [
        { path: 'hj', weight: 60 },
        { path: '_hjSettings', weight: 60 },
      ],
      resources: [
        { urlRegex: /static\.hotjar\.com\/c\/hotjar-[\d.]+\.js/i, weight: 45 },
        { urlRegex: /script\.hotjar\.com\//i, weight: 40 },
      ],
    },
  },
];
