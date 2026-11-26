/**
 * SiteStack Architecture Intelligence Module - Schema & Type Definitions
 * Location: src/engine/architecture/types.ts
 *
 * Additive, independent type definitions for technology relationships,
 * semantic roles, evidence states, and ontology validation contracts.
 *
 * STRICT INVARIANT: This module is decoupled from the detection engine.
 * It references canonical technology IDs without mutating detection schemas.
 */

// ---------------------------------------------------------------------------
// 1. Relationship Types & Taxonomy
// ---------------------------------------------------------------------------

export type ArchitectureRelationshipType =
  | 'depends_on'
  | 'extends'
  | 'content_source'
  | 'hosted_on'
  | 'styled_with'
  | 'integrates';

export const VALID_RELATIONSHIP_TYPES: readonly ArchitectureRelationshipType[] = [
  'depends_on',
  'extends',
  'content_source',
  'hosted_on',
  'styled_with',
  'integrates',
] as const;

export type RelationshipClassification = 'hard_dependency' | 'contextual';

export interface RelationshipTaxonomyDefinition {
  readonly type: ArchitectureRelationshipType;
  readonly directionality: 'source_to_target';
  readonly meaning: string;
  readonly supportedEvidence: readonly string[];
  readonly nonProofClarification: string;
  readonly classification: RelationshipClassification;
}

export const RELATIONSHIP_TAXONOMY: Record<ArchitectureRelationshipType, RelationshipTaxonomyDefinition> = {
  depends_on: {
    type: 'depends_on',
    directionality: 'source_to_target',
    meaning: 'Source technology has a strict runtime, compilation, or execution prerequisite on Target. Source cannot function without Target.',
    supportedEvidence: [
      'Bundled runtime chunks containing target globals or symbols',
      'Direct runtime execution hooks or framework container hooks',
      'Engine implies rule triggered with verified parent runtime',
    ],
    nonProofClarification: 'Does not prove Target cannot run independently. Target is typically a standalone runtime or library.',
    classification: 'hard_dependency',
  },
  extends: {
    type: 'extends',
    directionality: 'source_to_target',
    meaning: 'Source technology is a modular plugin, theme, or architectural extension built specifically to run inside Target platform.',
    supportedEvidence: [
      'Source assets located in Target platform plugin or theme directory structure (e.g. /wp-content/plugins/)',
      'Source client hooks registered with Target platform runtime object',
    ],
    nonProofClarification: 'Does not prove Target platform was installed exclusively for Source. Target platform operates independently without Source.',
    classification: 'hard_dependency',
  },
  content_source: {
    type: 'content_source',
    directionality: 'source_to_target',
    meaning: 'Source frontend application sources, renders, or hydrates content delivered by Target headless CMS or content API.',
    supportedEvidence: [
      'DOM asset URLs or media endpoints pointing to Target content CDN (e.g. cdn.sanity.io, ctfassets.net)',
      'Client-side preview bridges or editor script tags (e.g. window.storyblok)',
    ],
    nonProofClarification: 'Does not prove Source is exclusively powered by Target; does not prove Target is a runtime dependency.',
    classification: 'contextual',
  },
  hosted_on: {
    type: 'hosted_on',
    directionality: 'source_to_target',
    meaning: 'Source application assets, SSR runtime, or static pages are hosted on or edge-routed through Target infrastructure.',
    supportedEvidence: [
      'Platform deployment response headers (e.g. x-vercel-id, x-nf-request-id)',
      'Platform-specific asset paths or analytics bundles (e.g. /_vercel/insights/)',
    ],
    nonProofClarification: 'Does not prove Source source code is hosted on Target. Target may act purely as an edge reverse proxy or CDN.',
    classification: 'contextual',
  },
  styled_with: {
    type: 'styled_with',
    directionality: 'source_to_target',
    meaning: 'Source frontend markup or component templates are styled using Target CSS utility system or design framework.',
    supportedEvidence: [
      'DOM element class attributes matching Target utility class syntax',
      'Target CSS stylesheet references in document head',
    ],
    nonProofClarification: 'Does not prove Source framework maintains an executable or runtime dependency on Target styling.',
    classification: 'contextual',
  },
  integrates: {
    type: 'integrates',
    directionality: 'source_to_target',
    meaning: 'Source application initializes, embeds, or communicates with Target third-party service, payment modal, or analytics client.',
    supportedEvidence: [
      'Checkout container or payment iframe placed inside Source storefront DOM',
      'Framework-specific integration SDK or custom component tags',
    ],
    nonProofClarification: 'Does not prove deep server-side integration or mandatory operational dependency.',
    classification: 'contextual',
  },
};

// ---------------------------------------------------------------------------
// 2. Evidence & Verification States
// ---------------------------------------------------------------------------

export type ArchitectureEvidenceState =
  | 'directly_observed'
  | 'co_detected'
  | 'inferred'
  | 'catalog_only';

export const VALID_EVIDENCE_STATES: readonly ArchitectureEvidenceState[] = [
  'directly_observed',
  'co_detected',
  'inferred',
  'catalog_only',
] as const;

export interface EvidenceStateDefinition {
  readonly state: ArchitectureEvidenceState;
  readonly isObservation: boolean;
  readonly description: string;
  readonly requiresRelationshipEvidence: boolean;
}

export const EVIDENCE_STATE_DEFINITIONS: Record<ArchitectureEvidenceState, EvidenceStateDefinition> = {
  directly_observed: {
    state: 'directly_observed',
    isObservation: true,
    description: 'Both technologies detected on the active webpage, with specific harvested signals proving direct architectural linkage.',
    requiresRelationshipEvidence: true,
  },
  co_detected: {
    state: 'co_detected',
    isObservation: true,
    description: 'Both technologies detected on the webpage; pairing is architecturally plausible, but direct client-side linkage is unverified.',
    requiresRelationshipEvidence: false,
  },
  inferred: {
    state: 'inferred',
    isObservation: true,
    description: 'Target technology was not directly detected via signals, but was synthesized via a verified parent inference rule.',
    requiresRelationshipEvidence: false,
  },
  catalog_only: {
    state: 'catalog_only',
    isObservation: false,
    description: 'Known architectural relationship documented in the ontology catalog; one or both technologies absent from the active webpage.',
    requiresRelationshipEvidence: false,
  },
};

// ---------------------------------------------------------------------------
// 3. Semantic Roles (Multi-Role Capable)
// ---------------------------------------------------------------------------

export type ArchitectureSemanticRole =
  | 'framework'
  | 'platform'
  | 'cms'
  | 'runtime'
  | 'library'
  | 'styling'
  | 'hosting'
  | 'hosted_platform'
  | 'infrastructure'
  | 'analytics'
  | 'marketing'
  | 'payment'
  | 'ecommerce';

export const VALID_SEMANTIC_ROLES: readonly ArchitectureSemanticRole[] = [
  'framework',
  'platform',
  'cms',
  'runtime',
  'library',
  'styling',
  'hosting',
  'hosted_platform',
  'infrastructure',
  'analytics',
  'marketing',
  'payment',
  'ecommerce',
] as const;

export interface SemanticRoleDefinition {
  readonly role: ArchitectureSemanticRole;
  readonly name: string;
  readonly definition: string;
  readonly inclusionCriteria: string;
  readonly representativeExamples: readonly string[];
}

export const SEMANTIC_ROLE_DEFINITIONS: Record<ArchitectureSemanticRole, SemanticRoleDefinition> = {
  framework: {
    role: 'framework',
    name: 'Application Framework',
    definition: 'Application-level orchestrator controlling routing, component rendering, page lifecycle, and build-time/runtime data fetching.',
    inclusionCriteria: 'Technology defines the primary code architecture, execution model, or compilation target for the web application.',
    representativeExamples: ['Next.js', 'Nuxt', 'Astro', 'Angular', 'SvelteKit'],
  },
  platform: {
    role: 'platform',
    name: 'Extensible Platform',
    definition: 'Extensible software foundation providing an ecosystem of plugins, themes, modules, webhooks, or public developer APIs.',
    inclusionCriteria: 'Technology exposes an extension architecture allowing third-party code or plugins to execute within its operational boundaries.',
    representativeExamples: ['WordPress', 'Shopify', 'Drupal', 'Magento', 'Next.js'],
  },
  cms: {
    role: 'cms',
    name: 'Content Management System',
    definition: 'System dedicated to authoring, storing, managing, and delivering structured digital content and media.',
    inclusionCriteria: 'Technology provides editorial content workflows, database-backed article/page publishing, or headless content APIs.',
    representativeExamples: ['WordPress', 'Sanity', 'Contentful', 'Ghost', 'Drupal'],
  },
  runtime: {
    role: 'runtime',
    name: 'Core UI Runtime',
    definition: 'Client-side reactive engine or virtual DOM runtime managing component state, reactivity, and DOM reconciliation in the browser.',
    inclusionCriteria: 'Executable client runtime executing on the user device to reconcile UI state and dispatch DOM events.',
    representativeExamples: ['React', 'Vue', 'Svelte', 'SolidJS', 'Preact'],
  },
  library: {
    role: 'library',
    name: 'Modular Library',
    definition: 'Modular JavaScript utility or component set imported to provide discrete capabilities without controlling top-level application routing.',
    inclusionCriteria: 'Helper functions, UI widgets, or DOM manipulation utilities consumed within a broader application runtime.',
    representativeExamples: ['jQuery', 'Alpine.js', 'HTMX', 'Lit', 'Bootstrap JS'],
  },
  styling: {
    role: 'styling',
    name: 'Styling & Design System',
    definition: 'CSS design tokens, utility classes, or pre-built visual component stylesheets defining appearance and layout.',
    inclusionCriteria: 'Style-level presentation framework (CSS or compiled atomic classes) without standalone application runtime semantics.',
    representativeExamples: ['Tailwind CSS', 'Bootstrap CSS'],
  },
  hosting: {
    role: 'hosting',
    name: 'Application Hosting & Compute',
    definition: 'Cloud hosting, serverless functions, or compute platform where external application code is deployed, executed, and served.',
    inclusionCriteria: 'Accepts, builds, and executes user-authored application code repositories on cloud or edge infrastructure.',
    representativeExamples: ['Vercel', 'Netlify'],
  },
  hosted_platform: {
    role: 'hosted_platform',
    name: 'Managed Hosted SaaS Platform',
    definition: 'Multi-tenant commercial SaaS service that unifies application logic (storefront, site builder, CMS) and managed cloud hosting as a single, inseparable service.',
    inclusionCriteria: 'Proprietary platform that cannot be self-hosted on arbitrary servers; vendor provisions and manages hosting inherently.',
    representativeExamples: ['Shopify', 'Webflow', 'Wix', 'Squarespace', 'BigCommerce'],
  },
  infrastructure: {
    role: 'infrastructure',
    name: 'Edge & Network Infrastructure',
    definition: 'Global edge network, reverse-proxy CDN, DNS resolution, and security infrastructure routing and accelerating web traffic.',
    inclusionCriteria: 'Operates at the network, DNS, or reverse-proxy boundary in front of or beneath origin application servers.',
    representativeExamples: ['Cloudflare'],
  },
  analytics: {
    role: 'analytics',
    name: 'Behavioral Analytics & Telemetry',
    definition: 'Client-side telemetry client capturing user events, page views, behavioral funnels, heatmaps, or product analytics.',
    inclusionCriteria: 'Beacons, pixels, or analytics SDKs reporting usage data to an analytics back-end.',
    representativeExamples: ['Google Analytics (GA4)', 'Mixpanel', 'Hotjar', 'PostHog'],
  },
  marketing: {
    role: 'marketing',
    name: 'Marketing & Tag Management',
    definition: 'Advertising conversion tracking pixels, customer messaging widgets, tag management orchestration, or CRM lead capture.',
    inclusionCriteria: 'Third-party marketing integrations, ad tracking pixels, live chat widgets, or tag managers.',
    representativeExamples: ['Google Tag Manager', 'Meta Pixel', 'HubSpot', 'Intercom'],
  },
  payment: {
    role: 'payment',
    name: 'Payment Gateway & Checkout',
    definition: 'Financial transaction processing SDK, payment modal, tokenized credit card iframe, or Buy Now Pay Later checkout widget.',
    inclusionCriteria: 'Client-side payment authorization, card tokenization, or digital wallet payment buttons.',
    representativeExamples: ['Stripe', 'PayPal', 'Klarna', 'Razorpay'],
  },
  ecommerce: {
    role: 'ecommerce',
    name: 'Ecommerce & Storefront Platform',
    definition: 'Commercial catalog, shopping cart, inventory management, checkout flow, and merchant order management engine.',
    inclusionCriteria: 'Specialized ecommerce platform or extension enabling online transactions and product catalogs.',
    representativeExamples: ['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Snipcart'],
  },
};

/**
 * Returns true if the evidence state reflects an actual on-page observation or engine inference.
 * Returns false for catalog-only reference knowledge.
 */
export function isObservationState(state: ArchitectureEvidenceState): boolean {
  return EVIDENCE_STATE_DEFINITIONS[state].isObservation;
}

/**
 * Validates whether a specific evidence state is semantically authorized for a given relationship.
 */
export function isValidEvidenceStateForRelationship(
  rel: OntologyRelationshipDefinition,
  state: ArchitectureEvidenceState
): boolean {
  switch (state) {
    case 'catalog_only':
      return true; // Always permitted as baseline catalog knowledge
    case 'inferred':
      return rel.confidenceSemantics.allowInferred;
    case 'directly_observed':
      return rel.confidenceSemantics.allowDirectObservation;
    case 'co_detected':
      return true; // Co-detection is permitted for any relationship if both endpoints are observed
    default:
      return false;
  }
}

export interface TechnologySemanticProfile {
  readonly technologyId: string;
  readonly roles: readonly ArchitectureSemanticRole[];
  readonly primaryRole: ArchitectureSemanticRole;
  readonly notes?: string;
}

// ---------------------------------------------------------------------------
// 4. Declarative Ontology Types
// ---------------------------------------------------------------------------

export interface RelationshipEvidenceRequirements {
  readonly directProofDescription: string;
  readonly qualifyingSignals?: readonly string[];
  readonly inferredProofDescription?: string;
}

export interface RelationshipConfidenceSemantics {
  readonly defaultState: ArchitectureEvidenceState;
  readonly allowDirectObservation: boolean;
  readonly allowInferred: boolean;
  readonly notes?: string;
}

export interface OntologyRelationshipDefinition {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: ArchitectureRelationshipType;
  readonly classification: RelationshipClassification;
  readonly description: string;
  readonly evidenceRequirements: RelationshipEvidenceRequirements;
  readonly confidenceSemantics: RelationshipConfidenceSemantics;
}

export interface ArchitectureOntology {
  readonly schemaVersion: '1.0.0';
  readonly relationships: readonly OntologyRelationshipDefinition[];
  readonly profiles: readonly TechnologySemanticProfile[];
}

// ---------------------------------------------------------------------------
// 5. Validation & Diagnostic Types
// ---------------------------------------------------------------------------

export type OntologyValidationSeverity = 'error' | 'warning';

export type OntologyValidationErrorCode =
  | 'UNKNOWN_TECHNOLOGY_ID'
  | 'DUPLICATE_RELATIONSHIP_ID'
  | 'DUPLICATE_RELATIONSHIP_PAIR'
  | 'INVALID_RELATIONSHIP_TYPE'
  | 'INVALID_RELATIONSHIP_CLASSIFICATION'
  | 'INVALID_SEMANTIC_ROLE'
  | 'SELF_REFERENCING_RELATIONSHIP'
  | 'MISSING_DESCRIPTION'
  | 'INVALID_EVIDENCE_REQUIREMENTS'
  | 'INVALID_DIRECTIONALITY'
  | 'CIRCULAR_HARD_DEPENDENCY'
  | 'MISSING_SEMANTIC_PROFILE'
  | 'DUPLICATE_SEMANTIC_PROFILE'
  | 'EMPTY_SEMANTIC_ROLES'
  | 'INVALID_PRIMARY_ROLE'
  | 'INVALID_CONFIDENCE_SEMANTICS';

export interface OntologyDiagnostic {
  readonly code: OntologyValidationErrorCode;
  readonly severity: OntologyValidationSeverity;
  readonly message: string;
  readonly relationshipId?: string;
  readonly technologyId?: string;
  readonly cyclePath?: readonly string[];
}

export interface OntologyValidationStats {
  readonly totalRelationships: number;
  readonly hardDependencies: number;
  readonly contextualRelationships: number;
  readonly totalProfiles: number;
  readonly canonicalTechnologiesCovered: number;
}

export interface OntologyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly OntologyDiagnostic[];
  readonly warnings: readonly OntologyDiagnostic[];
  readonly cycleDiagnostics: readonly OntologyDiagnostic[];
  readonly stats: OntologyValidationStats;
}
