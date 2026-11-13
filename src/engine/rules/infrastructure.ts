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
      headers: [
        { name: 'server', valueRegex: /cloudflare/i, weight: 50 },
        { name: 'cf-ray', valueRegex: /.+/, weight: 50 },
      ],
      globals: [
        { path: '__cfRLUnblockHandlers', weight: 50 },
      ],
      resources: [
        { urlRegex: /static\.cloudflareinsights\.com\/beacon(?:\.min)?\.js/i, weight: 45 },
        { urlRegex: /cdnjs\.cloudflare\.com\//i, weight: 30 },
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
      headers: [
        { name: 'x-vercel-id', valueRegex: /.+/, weight: 55 },
        { name: 'server', valueRegex: /Vercel/i, weight: 50 },
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
      headers: [
        { name: 'server', valueRegex: /Netlify/i, weight: 50 },
        { name: 'x-nf-request-id', valueRegex: /.+/, weight: 50 },
      ],
      resources: [
        { urlRegex: /identity\.netlify\.com\/v\d+\/netlify-identity-widget\.js/i, weight: 45 },
      ],
    },
  },
];
