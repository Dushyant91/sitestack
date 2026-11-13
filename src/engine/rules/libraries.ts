import { TechRule } from '../types';

export const libraryRules: TechRule[] = [
  {
    id: 'jquery',
    name: 'jQuery',
    category: 'library',
    website: 'https://jquery.com',
    icon: '/tech-icons/libraries/jquery.svg',
    description: 'Fast, small, and feature-rich JavaScript utility library.',
    signals: {
      globals: [
        { path: 'jQuery.fn.jquery', weight: 60 },
        { path: '$.fn.jquery', weight: 60 },
      ],
      resources: [
        { urlRegex: /jquery(?:-([\d.]+))?(?:\.slim|\.min)?\.js/i, weight: 35 },
      ],
    },
    versionExtraction: {
      fromGlobal: 'jQuery.fn.jquery',
      fromResource: {
        urlRegex: /jquery-([\d.]+)(?:\.min)?\.js/i,
        captureGroup: 1,
      },
    },
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'library',
    website: 'https://getbootstrap.com',
    icon: '/tech-icons/libraries/bootstrap.svg',
    description: 'Popular HTML, CSS, and JS framework for responsive frontends.',
    signals: {
      globals: [
        { path: 'bootstrap.Tooltip.VERSION', weight: 60 },
        { path: 'bootstrap', weight: 45 },
      ],
      resources: [
        { urlRegex: /bootstrap(?:-([\d.]+))?(?:\.bundle)?(?:\.min)?\.(?:js|css)/i, weight: 35 },
      ],
      dom: [
        { selector: 'link[href*="bootstrap"]', weight: 30 },
      ],
    },
    versionExtraction: {
      fromGlobal: 'bootstrap.Tooltip.VERSION',
      fromResource: {
        urlRegex: /bootstrap[/-]([\d.]+)/i,
        captureGroup: 1,
      },
    },
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'library',
    website: 'https://tailwindcss.com',
    icon: '/tech-icons/libraries/tailwindcss.svg',
    description: 'Utility-first CSS framework for rapid UI development.',
    signals: {
      dom: [
        // Verified Tailwind CSS internal CSS custom property footprints
        { selector: 'style:has-text(--tw-)', weight: 45 },
        { selector: 'style:has-text(--tw-ring-offset-shadow)', weight: 55 },
      ],
      resources: [
        { urlRegex: /tailwind(?:css)?(?:\.min)?\.css/i, weight: 40 },
        { urlRegex: /cdn\.tailwindcss\.com/i, weight: 50 },
      ],
    },
  },
];
