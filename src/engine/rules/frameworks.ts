import { TechRule } from '../types';

export const frameworkRules: TechRule[] = [
  {
    id: 'react',
    name: 'React',
    category: 'framework',
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
    id: 'nextjs',
    name: 'Next.js',
    category: 'framework',
    website: 'https://nextjs.org',
    icon: '/tech-icons/frameworks/nextjs.svg',
    description: 'Production React framework featuring SSR, SSG, and edge routing.',
    implies: ['react'],
    signals: {
      globals: [
        { path: '__NEXT_DATA__', weight: 60 },
        { path: 'next.version', weight: 60 },
      ],
      dom: [
        { selector: '#__next', weight: 40 },
        { selector: 'script#__NEXT_DATA__', weight: 45 },
      ],
      resources: [
        { urlRegex: /\/_next\/static\//i, weight: 40 },
        { urlRegex: /\/_next\/static\/chunks\//i, weight: 40 },
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
