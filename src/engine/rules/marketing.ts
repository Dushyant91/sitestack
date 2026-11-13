import { TechRule } from '../types';

export const marketingRules: TechRule[] = [
  {
    id: 'meta-pixel',
    name: 'Meta Pixel',
    category: 'marketing',
    website: 'https://www.facebook.com/business/tools/meta-pixel',
    icon: '/tech-icons/marketing/meta-pixel.svg',
    description: 'Conversion tracking and remarketing tool for Facebook & Instagram ads.',
    signals: {
      globals: [
        { path: 'fbq', weight: 60 },
        { path: '_fbq', weight: 55 },
      ],
      resources: [
        { urlRegex: /connect\.facebook\.net\/(?:[a-zA-Z_]+)\/fbevents\.js/i, weight: 35 },
      ],
    },
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'marketing',
    website: 'https://hubspot.com',
    icon: '/tech-icons/marketing/hubspot.svg',
    description: 'Inbound marketing, CRM, sales, and customer service platform.',
    signals: {
      globals: [
        { path: '_hsq', weight: 60 },
        { path: 'HubSpotConversations', weight: 60 },
      ],
      resources: [
        { urlRegex: /js\.hs-scripts\.com\//i, weight: 45 },
        { urlRegex: /js\.hs-analytics\.net\//i, weight: 45 },
      ],
    },
  },
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'marketing',
    website: 'https://intercom.com',
    icon: '/tech-icons/marketing/intercom.svg',
    description: 'Customer messaging platform for on-site live chat and support.',
    signals: {
      globals: [
        { path: 'Intercom', weight: 60 },
        { path: 'intercomSettings', weight: 55 },
      ],
      resources: [
        { urlRegex: /widget\.intercom\.io\/widget\//i, weight: 45 },
      ],
    },
  },
];
