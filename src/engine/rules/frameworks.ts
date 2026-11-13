import { TechRule } from '../types';

export const frameworkRules: TechRule[] = [
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'framework',
    website: 'https://nextjs.org',
    icon: '/tech-icons/frameworks/nextjs.svg',
    description: 'Production React framework featuring App Router, SSR, SSG, and edge routing.',
    implies: ['react'],
    signals: {
      globals: [
        { path: '__NEXT_DATA__', weight: 55 },
        { path: '__next_f', weight: 55 }, // App Router Flight stream array
        { path: 'next.version', weight: 55 },
      ],
      dom: [
        { selector: '#__next', weight: 35 },
        { selector: 'script#__NEXT_DATA__', weight: 40 },
        { selector: 'meta[name="next-head-count"]', weight: 35 },
        { selector: 'link[href*="/_next/static/"]', weight: 35 },
      ],
      resources: [
        { urlRegex: /\/_next\/static\/chunks\//i, weight: 35 },
        { urlRegex: /\/_next\/static\/css\//i, weight: 30 },
      ],
    },
    versionExtraction: {
      fromGlobal: 'next.version',
    },
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'framework',
    website: 'https://vuejs.org',
    icon: '/tech-icons/frameworks/vue.svg',
    description: 'Progressive JavaScript framework for building user interfaces.',
    signals: {
      globals: [
        { path: 'Vue', weight: 60 },
        { path: '__VUE__', weight: 60 },
      ],
      dom: [
        { selector: '[data-v-app]', weight: 45 },
        { selector: '*[data-v-]', weight: 35 },
      ],
      resources: [
        { urlRegex: /vue(?:\.runtime)?(?:\.global)?(?:\.prod|\.min)?\.js/i, weight: 35 },
      ],
    },
    versionExtraction: {
      fromGlobal: 'Vue.version',
      fromResource: {
        urlRegex: /vue@([\d.]+)/i,
        captureGroup: 1,
      },
    },
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'framework',
    website: 'https://angular.dev',
    icon: '/tech-icons/frameworks/angular.svg',
    description: 'TypeScript-based web application framework by Google.',
    signals: {
      globals: [
        { path: 'ng', weight: 60 },
        { path: 'getAllAngularRootElements', weight: 60 },
      ],
      dom: [
        { selector: '[ng-version]', weight: 55 },
        { selector: 'app-root', weight: 35 },
        { selector: '[ng-app]', weight: 40 },
      ],
      resources: [
        { urlRegex: /@angular\/core/i, weight: 40 },
      ],
    },
    versionExtraction: {
      fromDom: {
        selector: '[ng-version]',
        attribute: 'ng-version',
        regex: /([\d.]+)/,
      },
    },
  },
];
