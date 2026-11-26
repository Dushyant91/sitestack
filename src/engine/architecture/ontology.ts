/**
 * SiteStack Architecture Intelligence Module - Declarative Ontology
 * Location: src/engine/architecture/ontology.ts
 *
 * Declarative relationship catalog and semantic profiles across the
 * 60 canonical technologies in the SiteStack catalog.
 *
 * STRICT INVARIANTS:
 * 1. Read-only references to canonical technology IDs.
 * 2. Zero mutation of frozen detection definitions, rules, or scores.
 * 3. Categorical evidence and confidence semantics only (no manufactured math).
 * 4. Tailwind CSS classified strictly under 'styling' (never 'runtime').
 * 5. All hard dependencies form a validated Acyclic Directed Graph (DAG).
 */

import {
  ArchitectureOntology,
  OntologyRelationshipDefinition,
  TechnologySemanticProfile,
} from './types';

// ---------------------------------------------------------------------------
// 1. Semantic Profiles (All 60 Canonical Technologies)
// ---------------------------------------------------------------------------

export const CANONICAL_SEMANTIC_PROFILES: readonly TechnologySemanticProfile[] = [
  // CMS & Publishing Platforms
  {
    technologyId: 'wordpress',
    roles: ['cms', 'platform'],
    primaryRole: 'cms',
    notes: 'Open-source PHP content management system and extensible publishing platform.',
  },
  {
    technologyId: 'webflow',
    roles: ['cms', 'platform', 'hosted_platform'],
    primaryRole: 'cms',
    notes: 'Visual site builder, managed CMS, and proprietary hosted platform.',
  },
  {
    technologyId: 'wix',
    roles: ['cms', 'platform', 'hosted_platform'],
    primaryRole: 'cms',
    notes: 'Hosted website builder and business website platform.',
  },
  {
    technologyId: 'drupal',
    roles: ['cms', 'platform'],
    primaryRole: 'cms',
    notes: 'Extensible open-source enterprise Content Management System.',
  },
  {
    technologyId: 'ghost',
    roles: ['cms', 'platform'],
    primaryRole: 'cms',
    notes: 'Modern Node.js publishing platform and headless content CMS.',
  },
  {
    technologyId: 'squarespace',
    roles: ['cms', 'platform', 'hosted_platform'],
    primaryRole: 'cms',
    notes: 'All-in-one hosted website building and ecommerce platform.',
  },
  {
    technologyId: 'joomla',
    roles: ['cms', 'platform'],
    primaryRole: 'cms',
    notes: 'Open-source Content Management System and portal engine.',
  },

  // Headless CMS & Content Platforms
  {
    technologyId: 'sanity',
    roles: ['cms', 'platform'],
    primaryRole: 'cms',
    notes: 'Platform for structured content with real-time editing and CDN delivery.',
  },
  {
    technologyId: 'contentful',
    roles: ['cms', 'platform'],
    primaryRole: 'cms',
    notes: 'Composable content platform and enterprise headless CMS.',
  },
  {
    technologyId: 'storyblok',
    roles: ['cms', 'platform'],
    primaryRole: 'cms',
    notes: 'Headless CMS with visual component editor for modern frontends.',
  },

  // Core UI Runtimes & Reactive Engines
  {
    technologyId: 'react',
    roles: ['runtime', 'library'],
    primaryRole: 'runtime',
    notes: 'Declarative component library and reactive UI runtime engine.',
  },
  {
    technologyId: 'vue',
    roles: ['runtime', 'framework'],
    primaryRole: 'runtime',
    notes: 'Progressive JavaScript runtime and reactive UI framework.',
  },
  {
    technologyId: 'svelte',
    roles: ['runtime', 'framework'],
    primaryRole: 'runtime',
    notes: 'Compiler-driven reactive component framework and minimal client runtime.',
  },
  {
    technologyId: 'solidjs',
    roles: ['runtime', 'library'],
    primaryRole: 'runtime',
    notes: 'Fine-grained reactive UI library and runtime without virtual DOM overhead.',
  },
  {
    technologyId: 'qwik',
    roles: ['runtime', 'framework'],
    primaryRole: 'runtime',
    notes: 'Resumable web framework delivering instant page loads via fine-grained hydration.',
  },
  {
    technologyId: 'preact',
    roles: ['runtime', 'library'],
    primaryRole: 'runtime',
    notes: 'Fast 3kB alternative to React with identical modern component API.',
  },
  {
    technologyId: 'lit',
    roles: ['library', 'runtime'],
    primaryRole: 'library',
    notes: 'Lightweight library for authoring fast, reactive Web Components.',
  },

  // Frameworks & Meta-Frameworks
  {
    technologyId: 'nextjs',
    roles: ['framework', 'platform'],
    primaryRole: 'framework',
    notes: 'React full-stack meta-framework for hybrid static/server rendering.',
  },
  {
    technologyId: 'remix',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Full-stack web framework built on React and Web Standards.',
  },
  {
    technologyId: 'nuxt',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Intuitive Vue full-stack framework for SSR and static generation.',
  },
  {
    technologyId: 'sveltekit',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Full-stack application framework for Svelte with routing and SSR.',
  },
  {
    technologyId: 'solidstart',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Meta-framework for SolidJS with SSR and isomorphic routing.',
  },
  {
    technologyId: 'qwik-city',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'App compiler and routing meta-framework for Qwik.',
  },
  {
    technologyId: 'angular',
    roles: ['framework', 'platform'],
    primaryRole: 'framework',
    notes: 'TypeScript-based enterprise application platform and framework.',
  },
  {
    technologyId: 'ember',
    roles: ['framework', 'platform'],
    primaryRole: 'framework',
    notes: 'Opinionated web framework for ambitious, productive web applications.',
  },
  {
    technologyId: 'stencil',
    roles: ['framework', 'library'],
    primaryRole: 'framework',
    notes: 'Compiler for generating standard-compliant Web Components.',
  },
  {
    technologyId: 'astro',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Content-focused multi-page application framework with island architecture.',
  },

  // Documentation Frameworks & Static Site Generators
  {
    technologyId: 'docusaurus',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Static documentation website generator built on React.',
  },
  {
    technologyId: 'vitepress',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Static documentation generator built on Vue and Vite.',
  },
  {
    technologyId: 'hugo',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Fast Go-based static site generator.',
  },
  {
    technologyId: 'jekyll',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Ruby-based blog-aware static site generator.',
  },
  {
    technologyId: 'eleventy',
    roles: ['framework'],
    primaryRole: 'framework',
    notes: 'Simpler JavaScript-based static site generator.',
  },

  // UI Libraries & DOM Helpers
  {
    technologyId: 'jquery',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Cross-platform DOM manipulation and utility JavaScript library.',
  },
  {
    technologyId: 'alpinejs',
    roles: ['library', 'runtime'],
    primaryRole: 'library',
    notes: 'Lightweight reactive DOM manipulation library for HTML markup.',
  },
  {
    technologyId: 'htmx',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'High-power HTML extension library enabling AJAX and SSE directly in markup.',
  },

  // Styling Systems & Design Frameworks
  {
    technologyId: 'tailwindcss',
    roles: ['styling'],
    primaryRole: 'styling',
    notes: 'Utility-first CSS styling system. Build-time compiler outputting atomic utility classes.',
  },
  {
    technologyId: 'bootstrap',
    roles: ['styling', 'library'],
    primaryRole: 'styling',
    notes: 'Responsive CSS component framework and styling system.',
  },

  // Ecommerce Platforms & Extensions
  {
    technologyId: 'shopify',
    roles: ['ecommerce', 'platform', 'hosted_platform'],
    primaryRole: 'ecommerce',
    notes: 'Hosted multi-channel commerce platform and storefront infrastructure.',
  },
  {
    technologyId: 'woocommerce',
    roles: ['ecommerce', 'platform'],
    primaryRole: 'ecommerce',
    notes: 'Open-source ecommerce extension built natively for WordPress.',
  },
  {
    technologyId: 'magento',
    roles: ['ecommerce', 'platform'],
    primaryRole: 'ecommerce',
    notes: 'Open-source enterprise ecommerce platform.',
  },
  {
    technologyId: 'bigcommerce',
    roles: ['ecommerce', 'platform', 'hosted_platform'],
    primaryRole: 'ecommerce',
    notes: 'Open SaaS ecommerce platform for mid-market and enterprise storefronts.',
  },
  {
    technologyId: 'prestashop',
    roles: ['ecommerce', 'platform'],
    primaryRole: 'ecommerce',
    notes: 'Open-source ecommerce solution for merchants and online stores.',
  },
  {
    technologyId: 'opencart',
    roles: ['ecommerce', 'platform'],
    primaryRole: 'ecommerce',
    notes: 'Open-source store management software for online stores.',
  },
  {
    technologyId: 'snipcart',
    roles: ['ecommerce', 'payment'],
    primaryRole: 'ecommerce',
    notes: 'Developer-first HTML/JS shopping cart and checkout platform.',
  },

  // Payment Gateways & Financial Services
  {
    technologyId: 'stripe',
    roles: ['payment'],
    primaryRole: 'payment',
    notes: 'Financial infrastructure and online payment processing SDK/elements.',
  },
  {
    technologyId: 'paypal',
    roles: ['payment'],
    primaryRole: 'payment',
    notes: 'Online payment processing system and checkout button provider.',
  },
  {
    technologyId: 'klarna',
    roles: ['payment'],
    primaryRole: 'payment',
    notes: 'Buy Now Pay Later (BNPL) payment services and checkout provider.',
  },
  {
    technologyId: 'razorpay',
    roles: ['payment'],
    primaryRole: 'payment',
    notes: 'Payment gateway and checkout integration provider.',
  },

  // Infrastructure, Cloud Hosting & CDN
  {
    technologyId: 'cloudflare',
    roles: ['infrastructure'],
    primaryRole: 'infrastructure',
    notes: 'Edge cloud platform, reverse proxy CDN, DNS, and security infrastructure.',
  },
  {
    technologyId: 'vercel',
    roles: ['hosting', 'infrastructure'],
    primaryRole: 'hosting',
    notes: 'Frontend cloud platform providing serverless and edge hosting.',
  },
  {
    technologyId: 'netlify',
    roles: ['hosting', 'infrastructure'],
    primaryRole: 'hosting',
    notes: 'Composable web platform for serverless hosting and CI/CD deployment.',
  },

  // Analytics & Product Telemetry
  {
    technologyId: 'google-analytics',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'Web and product behavioral analytics and reporting platform.',
  },
  {
    technologyId: 'hotjar',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'Behavioral analytics, heatmaps, and user session recording service.',
  },
  {
    technologyId: 'mixpanel',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'Product analytics and user event tracking platform.',
  },
  {
    technologyId: 'amplitude',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'Digital analytics and product intelligence platform.',
  },
  {
    technologyId: 'posthog',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'All-in-one open-source product analytics suite.',
  },

  // Marketing, Tag Management & CRM
  {
    technologyId: 'google-tag-manager',
    roles: ['analytics', 'marketing'],
    primaryRole: 'marketing',
    notes: 'Tag management system orchestrating tracking beacons and third-party scripts.',
  },
  {
    technologyId: 'meta-pixel',
    roles: ['marketing', 'analytics'],
    primaryRole: 'marketing',
    notes: 'Conversion tracking pixel and audience measurement tool for Meta advertising.',
  },
  {
    technologyId: 'hubspot',
    roles: ['marketing', 'platform'],
    primaryRole: 'marketing',
    notes: 'Inbound marketing, CRM, lead capture, and customer service widget.',
  },
  {
    technologyId: 'intercom',
    roles: ['marketing', 'platform'],
    primaryRole: 'marketing',
    notes: 'Conversational relationship platform and customer messaging widget.',
  },

  // Stage 2.9.4 Semantic Profiles (Technologies 61 to 80)
  {
    technologyId: 'gatsby',
    roles: ['framework', 'platform'],
    primaryRole: 'framework',
    notes: 'React-based static site generator with GraphQL data orchestration.',
  },
  {
    technologyId: 'threejs',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Hardware-accelerated 3D WebGL computer graphics rendering library.',
  },
  {
    technologyId: 'sentry',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'Real-time application performance monitoring and error telemetry SDK.',
  },
  {
    technologyId: 'segment',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'Customer data platform routing tracking telemetry across analytics tools.',
  },
  {
    technologyId: 'clerk',
    roles: ['infrastructure'],
    primaryRole: 'infrastructure',
    notes: 'Authentication and session management platform for modern web applications.',
  },
  {
    technologyId: 'datadog-rum',
    roles: ['analytics'],
    primaryRole: 'analytics',
    notes: 'Real user monitoring agent tracking frontend performance metrics and journeys.',
  },
  {
    technologyId: 'd3',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Bespoke data manipulation and document charting library.',
  },
  {
    technologyId: 'recaptcha',
    roles: ['infrastructure'],
    primaryRole: 'infrastructure',
    notes: 'Google automated abuse defense and human verification challenge system.',
  },
  {
    technologyId: 'lucide',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Consistent vector icon collection and component rendering toolkit.',
  },
  {
    technologyId: 'fontawesome',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Vector icon and CSS icon styling framework for web interfaces.',
  },
  {
    technologyId: 'prismjs',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Lightweight client-side code syntax highlighting engine.',
  },
  {
    technologyId: 'highlightjs',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Automatic syntax highlighting library with broad programming language support.',
  },
  {
    technologyId: 'swiper',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Touch-enabled responsive hardware-accelerated slider and carousel engine.',
  },
  {
    technologyId: 'gsap',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'High-performance JavaScript animation platform for rich web experiences.',
  },
  {
    technologyId: 'chartjs',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Canvas-based responsive data charting and visualization library.',
  },
  {
    technologyId: 'emotion',
    roles: ['styling', 'library'],
    primaryRole: 'styling',
    notes: 'CSS-in-JS style sheet management and component styling engine for React.',
  },
  {
    technologyId: 'styled-components',
    roles: ['styling', 'library'],
    primaryRole: 'styling',
    notes: 'Tagged template literal component styling library for React applications.',
  },
  {
    technologyId: 'mui',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Material Design component library and layout primitives for React.',
  },
  {
    technologyId: 'chakra-ui',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'Accessible modular component system and style layout library for React.',
  },
  {
    technologyId: 'lodash',
    roles: ['library'],
    primaryRole: 'library',
    notes: 'General-purpose JavaScript functional utility and data manipulation library.',
  },
];

// ---------------------------------------------------------------------------
// 2. Declarative Relationships Catalog
// ---------------------------------------------------------------------------

export const CANONICAL_RELATIONSHIPS: readonly OntologyRelationshipDefinition[] = [
  // -------------------------------------------------------------------------
  // 2.1 Framework & Meta-Framework Core Dependencies (depends_on - Hard Dependency)
  // -------------------------------------------------------------------------
  {
    id: 'nextjs->react:depends_on',
    sourceId: 'nextjs',
    targetId: 'react',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'Next.js requires React as its core UI rendering runtime and component model.',
    evidenceRequirements: {
      directProofDescription: 'Next.js bundled script chunks contain React symbols or window.React global.',
      qualifyingSignals: ['react:global:react', 'react:dom:data-reactroot', 'react:resource:runtime'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when Next.js is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
      notes: 'Direct observation requires React globals or bundles; engine inference applies if React lacks standalone signals.',
    },
  },
  {
    id: 'remix->react:depends_on',
    sourceId: 'remix',
    targetId: 'react',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'Remix requires React as its underlying component runtime and rendering engine.',
    evidenceRequirements: {
      directProofDescription: 'Remix client bundles contain React symbols or React globals.',
      qualifyingSignals: ['react:global:react', 'react:dom:data-reactroot', 'react:resource:runtime'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when Remix is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
      notes: 'Direct observation requires React signals; engine inference applies if React is unbundled.',
    },
  },
  {
    id: 'docusaurus->react:depends_on',
    sourceId: 'docusaurus',
    targetId: 'react',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'Docusaurus is built on React to render documentation templates and interactive client islands.',
    evidenceRequirements: {
      directProofDescription: 'Docusaurus scripts bundle React or reference window.React.',
      qualifyingSignals: ['react:global:react', 'react:dom:data-reactroot'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when Docusaurus is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
    },
  },
  {
    id: 'nuxt->vue:depends_on',
    sourceId: 'nuxt',
    targetId: 'vue',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'Nuxt requires Vue as its core reactive runtime and single-file component engine.',
    evidenceRequirements: {
      directProofDescription: 'Nuxt entry scripts initialize Vue globals or Vue DevTools hook.',
      qualifyingSignals: ['vue:global:vue', 'vue:global:vue-runtime', 'vue:global:vue-devtools-hook', 'vue:dom:data-v-app'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when Nuxt is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
    },
  },
  {
    id: 'vitepress->vue:depends_on',
    sourceId: 'vitepress',
    targetId: 'vue',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'VitePress requires Vue 3 as its core SSG runtime and documentation theme engine.',
    evidenceRequirements: {
      directProofDescription: 'VitePress application mounts Vue 3 application container data-v-app.',
      qualifyingSignals: ['vue:global:vue', 'vue:dom:data-v-app'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when VitePress is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
    },
  },
  {
    id: 'sveltekit->svelte:depends_on',
    sourceId: 'sveltekit',
    targetId: 'svelte',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'SvelteKit is the official fullstack application framework for the Svelte reactive runtime.',
    evidenceRequirements: {
      directProofDescription: 'SvelteKit hydrated DOM contains Svelte scoped classes or __svelte global.',
      qualifyingSignals: ['svelte:dom:scoped-class', 'svelte:global:svelte', 'svelte:resource:runtime'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when SvelteKit is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
    },
  },
  {
    id: 'solidstart->solidjs:depends_on',
    sourceId: 'solidstart',
    targetId: 'solidjs',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'SolidStart is the official meta-framework for SolidJS reactive components.',
    evidenceRequirements: {
      directProofDescription: 'SolidStart client assets contain SolidJS hydration symbols or devtools hook.',
      qualifyingSignals: ['solidjs:global:hy', 'solidjs:global:devtools'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when SolidStart is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
    },
  },
  {
    id: 'qwik-city->qwik:depends_on',
    sourceId: 'qwik-city',
    targetId: 'qwik',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'Qwik City is the routing and application compiler framework built specifically on Qwik resumable runtime.',
    evidenceRequirements: {
      directProofDescription: 'Qwik City pages render Qwik container attributes (q:container, q:version).',
      qualifyingSignals: ['qwik:dom:container', 'qwik:dom:version'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when Qwik City is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
    },
  },
  {
    id: 'gatsby->react:depends_on',
    sourceId: 'gatsby',
    targetId: 'react',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'Gatsby is an opinionated framework built directly on React component architecture.',
    evidenceRequirements: {
      directProofDescription: 'Gatsby runtime (__gatsby) mounting React component trees.',
      qualifyingSignals: ['gatsby:global:gatsby', 'react:global:react'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when Gatsby is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
      notes: 'Gatsby cannot execute without React runtime.',
    },
  },
  {
    id: 'mui->react:depends_on',
    sourceId: 'mui',
    targetId: 'react',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'MUI (Material UI) component library built natively for React.',
    evidenceRequirements: {
      directProofDescription: 'MUI component class elements rendering React component tree.',
      qualifyingSignals: ['mui:dom:button', 'react:global:react'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when MUI is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
      notes: 'MUI is a React component library and requires React runtime.',
    },
  },
  {
    id: 'chakra-ui->react:depends_on',
    sourceId: 'chakra-ui',
    targetId: 'react',
    type: 'depends_on',
    classification: 'hard_dependency',
    description: 'Chakra UI component library built natively for React.',
    evidenceRequirements: {
      directProofDescription: 'Chakra UI component elements rendering React component tree.',
      qualifyingSignals: ['chakra-ui:dom:button', 'react:global:react'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when Chakra UI is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
      notes: 'Chakra UI is a React component library and requires React runtime.',
    },
  },

  // -------------------------------------------------------------------------
  // 2.2 Platform Extensions (extends - Hard Dependency)
  // -------------------------------------------------------------------------
  {
    id: 'woocommerce->wordpress:extends',
    sourceId: 'woocommerce',
    targetId: 'wordpress',
    type: 'extends',
    classification: 'hard_dependency',
    description: 'WooCommerce is an open-source ecommerce plugin built natively and exclusively to extend WordPress.',
    evidenceRequirements: {
      directProofDescription: 'WooCommerce scripts/styles load from /wp-content/plugins/woocommerce/ directory path.',
      qualifyingSignals: ['wordpress:global:wp', 'wordpress:dom:wp-content'],
      inferredProofDescription: 'Synthesized via engine implies calibration rule when WooCommerce is detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: true,
      allowInferred: true,
      notes: 'WooCommerce cannot operate without WordPress; existence of WooCommerce directly proves WordPress presence.',
    },
  },

  // -------------------------------------------------------------------------
  // 2.3 Cloud Hosting & Edge Infrastructure (hosted_on - Contextual)
  // -------------------------------------------------------------------------
  {
    id: 'nextjs->vercel:hosted_on',
    sourceId: 'nextjs',
    targetId: 'vercel',
    type: 'hosted_on',
    classification: 'contextual',
    description: 'Next.js application deployed on or accelerated by Vercel edge infrastructure.',
    evidenceRequirements: {
      directProofDescription: 'Direct observation uncollected client-side under Manifest V3 (response headers x-vercel-id uncollected); resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Server response headers are uncollected by client content probes. When both technologies are detected, this relationship resolves deterministically to co_detected.',
    },
  },
  {
    id: 'nuxt->netlify:hosted_on',
    sourceId: 'nuxt',
    targetId: 'netlify',
    type: 'hosted_on',
    classification: 'contextual',
    description: 'Nuxt application deployed on Netlify composable cloud infrastructure.',
    evidenceRequirements: {
      directProofDescription: 'Direct observation uncollected client-side under Manifest V3 (response headers x-nf-request-id uncollected); resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Server response headers are uncollected by client content probes. When both technologies are detected, this relationship resolves deterministically to co_detected.',
    },
  },
  {
    id: 'astro->netlify:hosted_on',
    sourceId: 'astro',
    targetId: 'netlify',
    type: 'hosted_on',
    classification: 'contextual',
    description: 'Astro static or SSR application deployed on Netlify infrastructure.',
    evidenceRequirements: {
      directProofDescription: 'Direct observation uncollected client-side under Manifest V3 (response headers x-nf-request-id uncollected); resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Server response headers are uncollected by client content probes. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'astro->vercel:hosted_on',
    sourceId: 'astro',
    targetId: 'vercel',
    type: 'hosted_on',
    classification: 'contextual',
    description: 'Astro static or SSR application deployed on Vercel infrastructure.',
    evidenceRequirements: {
      directProofDescription: 'Direct observation uncollected client-side under Manifest V3 (response headers x-vercel-id uncollected); resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Server response headers are uncollected by client content probes. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'wordpress->cloudflare:hosted_on',
    sourceId: 'wordpress',
    targetId: 'cloudflare',
    type: 'hosted_on',
    classification: 'contextual',
    description: 'WordPress website routed through Cloudflare reverse proxy CDN and edge security.',
    evidenceRequirements: {
      directProofDescription: 'Reverse proxy edge routing cannot prove origin host configuration client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Reverse proxy edge routing cannot prove WordPress host configuration; marked co_detected when both present.',
    },
  },

  // -------------------------------------------------------------------------
  // 2.4 Headless CMS Content Integrations (content_source - Contextual)
  // -------------------------------------------------------------------------
  {
    id: 'nextjs->sanity:content_source',
    sourceId: 'nextjs',
    targetId: 'sanity',
    type: 'content_source',
    classification: 'contextual',
    description: 'Next.js frontend application rendering structured content sourced from Sanity headless CMS.',
    evidenceRequirements: {
      directProofDescription: 'CDN media delivery (cdn.sanity.io) proves asset delivery but is insufficient to prove framework content source; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Asset delivery alone cannot prove CMS content source architecture. When both technologies are detected, this relationship resolves deterministically to co_detected.',
    },
  },
  {
    id: 'nextjs->contentful:content_source',
    sourceId: 'nextjs',
    targetId: 'contentful',
    type: 'content_source',
    classification: 'contextual',
    description: 'Next.js frontend application rendering content sourced from Contentful composable content platform.',
    evidenceRequirements: {
      directProofDescription: 'CDN media delivery (ctfassets.net) proves asset delivery but is insufficient to prove framework content source; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Asset delivery alone cannot prove CMS content source architecture. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'nextjs->storyblok:content_source',
    sourceId: 'nextjs',
    targetId: 'storyblok',
    type: 'content_source',
    classification: 'contextual',
    description: 'Next.js frontend application rendering content sourced from Storyblok visual headless CMS.',
    evidenceRequirements: {
      directProofDescription: 'Client-side bridge script proves bridge inclusion but is insufficient to prove primary content architecture; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Bridge script detection alone does not prove full architectural dependency. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'astro->sanity:content_source',
    sourceId: 'astro',
    targetId: 'sanity',
    type: 'content_source',
    classification: 'contextual',
    description: 'Astro content site sourcing structured data and media from Sanity.',
    evidenceRequirements: {
      directProofDescription: 'CDN media delivery (cdn.sanity.io) proves asset delivery but is insufficient to prove content source; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Asset delivery alone cannot prove CMS content source architecture. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'astro->contentful:content_source',
    sourceId: 'astro',
    targetId: 'contentful',
    type: 'content_source',
    classification: 'contextual',
    description: 'Astro content site sourcing assets and data from Contentful.',
    evidenceRequirements: {
      directProofDescription: 'CDN media delivery (ctfassets.net) proves asset delivery but is insufficient to prove content source; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Asset delivery alone cannot prove CMS content source architecture. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'remix->sanity:content_source',
    sourceId: 'remix',
    targetId: 'sanity',
    type: 'content_source',
    classification: 'contextual',
    description: 'Remix application rendering content fetched from Sanity studio.',
    evidenceRequirements: {
      directProofDescription: 'CDN media delivery (cdn.sanity.io) proves asset delivery but is insufficient to prove content source; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Asset delivery alone cannot prove CMS content source architecture. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'nuxt->storyblok:content_source',
    sourceId: 'nuxt',
    targetId: 'storyblok',
    type: 'content_source',
    classification: 'contextual',
    description: 'Nuxt application rendering content sourced from Storyblok headless CMS.',
    evidenceRequirements: {
      directProofDescription: 'Client-side bridge script proves bridge inclusion but is insufficient to prove primary content architecture; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Bridge script detection alone does not prove full architectural dependency. Resolves strictly to co_detected.',
    },
  },

  // -------------------------------------------------------------------------
  // 2.5 Commerce & Payment Integrations (integrates - Contextual)
  // -------------------------------------------------------------------------
  {
    id: 'woocommerce->stripe:integrates',
    sourceId: 'woocommerce',
    targetId: 'stripe',
    type: 'integrates',
    classification: 'contextual',
    description: 'WooCommerce store integrating Stripe payment processing elements in checkout.',
    evidenceRequirements: {
      directProofDescription: 'Global Stripe script or iframe does not prove WooCommerce container hierarchy client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Client probes evaluate global element existence without DOM hierarchy containment. When both technologies are detected, this relationship resolves deterministically to co_detected.',
    },
  },
  {
    id: 'woocommerce->paypal:integrates',
    sourceId: 'woocommerce',
    targetId: 'paypal',
    type: 'integrates',
    classification: 'contextual',
    description: 'WooCommerce store integrating PayPal checkout buttons or payment gateway.',
    evidenceRequirements: {
      directProofDescription: 'Global PayPal checkout button does not prove WooCommerce container hierarchy client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global button existence does not prove DOM container containment. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'woocommerce->klarna:integrates',
    sourceId: 'woocommerce',
    targetId: 'klarna',
    type: 'integrates',
    classification: 'contextual',
    description: 'WooCommerce store integrating Klarna Buy Now Pay Later payment placement.',
    evidenceRequirements: {
      directProofDescription: 'Klarna SDK or placement custom element does not prove WooCommerce container hierarchy client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global custom element evaluation does not inspect container ancestry. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'shopify->paypal:integrates',
    sourceId: 'shopify',
    targetId: 'paypal',
    type: 'integrates',
    classification: 'contextual',
    description: 'Shopify storefront integrating PayPal Express checkout button.',
    evidenceRequirements: {
      directProofDescription: 'PayPal checkout iframe does not prove Shopify checkout container hierarchy client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global button existence does not prove storefront containment. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'shopify->klarna:integrates',
    sourceId: 'shopify',
    targetId: 'klarna',
    type: 'integrates',
    classification: 'contextual',
    description: 'Shopify storefront integrating Klarna payment options or on-site messaging badge.',
    evidenceRequirements: {
      directProofDescription: 'Klarna badge or script does not prove Shopify theme template containment client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global placement evaluation does not inspect template hierarchy. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'bigcommerce->stripe:integrates',
    sourceId: 'bigcommerce',
    targetId: 'stripe',
    type: 'integrates',
    classification: 'contextual',
    description: 'BigCommerce storefront integrating Stripe credit card payment processing.',
    evidenceRequirements: {
      directProofDescription: 'Stripe card element does not prove BigCommerce checkout frame containment client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global script evaluation does not verify checkout frame ancestry. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'bigcommerce->paypal:integrates',
    sourceId: 'bigcommerce',
    targetId: 'paypal',
    type: 'integrates',
    classification: 'contextual',
    description: 'BigCommerce storefront integrating PayPal checkout buttons.',
    evidenceRequirements: {
      directProofDescription: 'PayPal checkout button does not prove BigCommerce cart containment client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global button existence does not prove cart containment. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'magento->paypal:integrates',
    sourceId: 'magento',
    targetId: 'paypal',
    type: 'integrates',
    classification: 'contextual',
    description: 'Magento ecommerce storefront integrating PayPal payment gateway.',
    evidenceRequirements: {
      directProofDescription: 'PayPal radio/container does not prove Magento form containment client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global element matching does not verify Magento form ancestry. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'snipcart->stripe:integrates',
    sourceId: 'snipcart',
    targetId: 'stripe',
    type: 'integrates',
    classification: 'contextual',
    description: 'Snipcart shopping cart modal integrating Stripe as its credit card payment processor.',
    evidenceRequirements: {
      directProofDescription: 'Stripe Elements initialization does not prove Snipcart iframe containment client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Client probes evaluate global element existence without modal containment. Resolves strictly to co_detected.',
    },
  },

  // -------------------------------------------------------------------------
  // 2.6 Styling System Pairings (styled_with - Contextual)
  // -------------------------------------------------------------------------
  {
    id: 'nextjs->tailwindcss:styled_with',
    sourceId: 'nextjs',
    targetId: 'tailwindcss',
    type: 'styled_with',
    classification: 'contextual',
    description: 'Next.js application markup styled with Tailwind CSS utility classes.',
    evidenceRequirements: {
      directProofDescription: 'Tailwind CSS utility class patterns present in DOM markup alongside Next.js.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Co-detection is marked co_detected. Styling is compile-time; direct client linking is not asserted.',
    },
  },
  {
    id: 'astro->tailwindcss:styled_with',
    sourceId: 'astro',
    targetId: 'tailwindcss',
    type: 'styled_with',
    classification: 'contextual',
    description: 'Astro content site markup styled with Tailwind CSS utility classes.',
    evidenceRequirements: {
      directProofDescription: 'Tailwind CSS utility class tokens in DOM rendered by Astro pages.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Co-detection is marked co_detected.',
    },
  },
  {
    id: 'remix->tailwindcss:styled_with',
    sourceId: 'remix',
    targetId: 'tailwindcss',
    type: 'styled_with',
    classification: 'contextual',
    description: 'Remix application markup styled with Tailwind CSS utility classes.',
    evidenceRequirements: {
      directProofDescription: 'Tailwind CSS utility class tokens in DOM alongside Remix runtime.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Co-detection is marked co_detected.',
    },
  },
  {
    id: 'nuxt->tailwindcss:styled_with',
    sourceId: 'nuxt',
    targetId: 'tailwindcss',
    type: 'styled_with',
    classification: 'contextual',
    description: 'Nuxt application single-file components styled with Tailwind CSS.',
    evidenceRequirements: {
      directProofDescription: 'Tailwind CSS utility tokens in DOM alongside Nuxt runtime container.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Co-detection is marked co_detected.',
    },
  },
  {
    id: 'wordpress->bootstrap:styled_with',
    sourceId: 'wordpress',
    targetId: 'bootstrap',
    type: 'styled_with',
    classification: 'contextual',
    description: 'WordPress theme templates styled using Bootstrap CSS grid and component classes.',
    evidenceRequirements: {
      directProofDescription: 'Bootstrap CSS stylesheet loaded in WordPress theme head alongside Bootstrap classes.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Co-detection is marked co_detected.',
    },
  },

  // -------------------------------------------------------------------------
  // 2.7 Tag Management & Analytics Integrations (integrates - Contextual)
  // -------------------------------------------------------------------------
  {
    id: 'google-tag-manager->google-analytics:integrates',
    sourceId: 'google-tag-manager',
    targetId: 'google-analytics',
    type: 'integrates',
    classification: 'contextual',
    description: 'Google Tag Manager container orchestrating and firing Google Analytics (GA4) measurement tags.',
    evidenceRequirements: {
      directProofDescription: 'GTM container script evaluation does not inspect container tag dispatch client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Probes inspect script presence, not internal tag firing configuration. When both technologies are detected, this relationship resolves deterministically to co_detected.',
    },
  },
  {
    id: 'shopify->google-analytics:integrates',
    sourceId: 'shopify',
    targetId: 'google-analytics',
    type: 'integrates',
    classification: 'contextual',
    description: 'Shopify storefront integrating native Google Analytics tracking script.',
    evidenceRequirements: {
      directProofDescription: 'Shopify analytics loader evaluation does not inspect internal script dispatch client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Probes inspect script presence, not internal dispatch lineage. Resolves strictly to co_detected.',
    },
  },
  {
    id: 'woocommerce->google-analytics:integrates',
    sourceId: 'woocommerce',
    targetId: 'google-analytics',
    type: 'integrates',
    classification: 'contextual',
    description: 'WooCommerce storefront integrating Google Analytics ecommerce tracking plugin.',
    evidenceRequirements: {
      directProofDescription: 'Global Google Analytics script and WooCommerce plugin do not prove direct hook linkage client-side; resolves strictly to co_detected.',
    },
    confidenceSemantics: {
      defaultState: 'catalog_only',
      allowDirectObservation: false,
      allowInferred: false,
      notes: 'Global dataLayer evaluation does not trace hook lineage. Resolves strictly to co_detected.',
    },
  },
];

// ---------------------------------------------------------------------------
// 3. Canonical Architecture Ontology Singleton
// ---------------------------------------------------------------------------

export const CANONICAL_ARCHITECTURE_ONTOLOGY: ArchitectureOntology = {
  schemaVersion: '1.0.0',
  relationships: CANONICAL_RELATIONSHIPS,
  profiles: CANONICAL_SEMANTIC_PROFILES,
};
