import { TechRule } from '../types';

export const infrastructureRules: TechRule[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'infrastructure',
    website: 'https://cloudflare.com',
    icon: '/tech-icons/infrastructure/cloudflare.svg',
    description: 'Global cloud network providing CDN, DDoS protection, and edge compute.',
    signals: {
      globals: [
        { path: '__cfRLUnblockHandlers', weight: 50 },
        { path: '_cf_chl_opt', weight: 50 },
      ],
      resources: [
        { urlRegex: /static\.cloudflareinsights\.com\/beacon(?:\.min)?\.js/i, weight: 45 },
      ],
    },
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'infrastructure',
    website: 'https://vercel.com',
    icon: '/tech-icons/infrastructure/vercel.svg',
    description: 'Frontend cloud platform powering edge deployments and serverless functions.',
    signals: {
      globals: [
        { path: 'va', weight: 25 }, // Supporting signal: 2-letter global alone must not trigger Vercel without script corroboration
        { path: 'si', weight: 25 }, // Supporting signal: 2-letter global alone must not trigger Vercel without script corroboration
      ],
      resources: [
        { urlRegex: /\/_vercel\/insights\/script\.js/i, weight: 45 },
        { urlRegex: /\/_vercel\/speed-insights\/v1\/script\.js/i, weight: 45 },
      ],
    },
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'infrastructure',
    website: 'https://netlify.com',
    icon: '/tech-icons/infrastructure/netlify.svg',
    description: 'Cloud hosting platform for composable web architectures and JAMstack sites.',
    signals: {
      resources: [
        { urlRegex: /identity\.netlify\.com\/v\d+\/netlify-identity-widget\.js/i, weight: 45 },
        { urlRegex: /\/\.netlify\/functions\//i, weight: 45 },
      ],
    },
  },
];
