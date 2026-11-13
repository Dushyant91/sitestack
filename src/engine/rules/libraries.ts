import { TechRule } from '../types';

export const libraryRules: TechRule[] = [
  {
    id: 'react',
    name: 'React',
    category: 'library',
    website: 'https://react.dev',
    icon: '/tech-icons/frameworks/react.svg',
    description: 'Component-based declarative UI library developed by Meta.',
    signals: {
      globals: [
        { path: 'React', weight: 60 },
        { path: '__REACT_DEVTOOLS_GLOBAL_HOOK__', weight: 40 },
      ],
      dom: [
        { selector: '[data-reactroot]', weight: 45 },
        { selector: '[data-reactid]', weight: 40 },
        { selector: '[data-react-checksum]', weight: 40 },
      ],
      resources: [
        { urlRegex: /react(?:\.production|\.development)?(?:\.min)?\.js/i, weight: 35 },
        { urlRegex: /react-dom(?:\.production|\.development)?(?:\.min)?\.js/i, weight: 35 },
      ],
    },
    versionExtraction: {
      fromGlobal: 'React.version',
      fromResource: {
        urlRegex: /react@([\d.]+)/i,
        captureGroup: 1,
      },
    },
  },
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
