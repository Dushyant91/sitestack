/**
 * SiteStack Technology Definition Schema v2.0
 * Location: src/engine/schema/types.ts
 *
 * Strongly typed, validated technology-definition contracts establishing
 * declarative fingerprints, scoped scoring policies, and independent
 * relationship proof criteria without changing existing detection behavior.
 */

import { TechCategory, SignalType, SignalEvidence } from '../types';

/**
 * Reuses the existing 8-category enum exactly from v1.1.1 baseline.
 * Categories: 'cms' | 'framework' | 'library' | 'analytics' | 'marketing' | 'ecommerce' | 'payment' | 'infrastructure'
 */
export type TechnologyCategory = TechCategory;

/**
 * Fact scope established by an observed signal.
 * Differentiates runtime execution and DOM presence from generic telemetry and static CDN assets.
 */
export type ClaimScope =
  | 'runtime_execution'       // Active JavaScript execution in page context (window globals, runtime hooks)
  | 'dom_structure'           // Rendered DOM elements, components, or attributes
  | 'hosting_infrastructure'  // Authoritative origin server, edge reverse-proxy, or DNS provider
  | 'telemetry_integration'   // Client-side analytics, beacon, or tracking snippet
  | 'asset_delivery';         // Generic static asset, font, or public CDN script bundle

/**
 * Role of an observed signal in detection scoring and UI transparency.
 */
export type EvidenceRole = 'direct' | 'supporting' | 'telemetry' | 'subordinate';

/**
 * Collector identifier binding a fingerprint kind to its execution pipeline and security boundary.
 */
export type CollectorId =
  | 'collector:main:global'
  | 'collector:isolated:meta'
  | 'collector:isolated:dom'
  | 'collector:isolated:custom_element'
  | 'collector:isolated:css_property'
  | 'collector:isolated:html_signature'
  | 'collector:isolated:resource'
  | 'collector:background:header'; // Forward-compatibility hook; dormant in v1.1.1 runtime

/**
 * Kind of signal targeted by a fingerprint definition.
 */
export type FingerprintKind =
  | 'global'
  | 'meta'
  | 'dom_selector'
  | 'dom_attribute'
  | 'custom_element'
  | 'resource_url'
  | 'css_property'
  | 'html_signature'
  | 'header';

/**
 * Comparison operator for string/attribute matching.
 */
export type StringMatchOperator =
  | 'exists'
  | 'equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex';

/**
 * JSON-serializable representation of a regular expression pattern.
 * Enables static AST analysis, CI ReDoS testing, and cross-context serialization.
 */
export interface SerializableRegex {
  pattern: string;
  flags?: string;
}

// ---------------------------------------------------------------------------
// 1. Discriminated Union of Fingerprint Definitions
// ---------------------------------------------------------------------------

export interface BaseFingerprint {
  /**
   * Stable, catalog-wide unique identifier.
   * Convention: `${technologyId}:${fingerprintName}`
   */
  id: string;
  kind: FingerprintKind;
  collectorId: CollectorId;
  /** Configured base weight contribution (1 - 100) */
  weight: number;
  role: EvidenceRole;
  claimScope: ClaimScope;
  description?: string;
}

export interface GlobalFingerprint extends BaseFingerprint {
  kind: 'global';
  collectorId: 'collector:main:global';
  /** Dot-notation property path: e.g. 'React.version', 'wp', '__NEXT_DATA__' (max depth 3) */
  target: string;
  operator: 'exists' | 'equals' | 'regex';
  expectedValue?: string | number | boolean;
  regex?: SerializableRegex;
  extractVersion?: boolean;
}

export interface MetaFingerprint extends BaseFingerprint {
  kind: 'meta';
  collectorId: 'collector:isolated:meta';
  metaName?: string;
  metaProperty?: string;
  operator: StringMatchOperator;
  expectedContent?: string;
  regex?: SerializableRegex;
  extractVersion?: boolean;
}

export interface DomSelectorFingerprint extends BaseFingerprint {
  kind: 'dom_selector';
  collectorId: 'collector:isolated:dom';
  selector: string;
}

export interface DomAttributeFingerprint extends BaseFingerprint {
  kind: 'dom_attribute';
  collectorId: 'collector:isolated:dom';
  selector: string;
  attributeName: string;
  operator: StringMatchOperator;
  expectedValue?: string;
  regex?: SerializableRegex;
  extractVersion?: boolean;
}

export interface CustomElementFingerprint extends BaseFingerprint {
  kind: 'custom_element';
  collectorId: 'collector:isolated:custom_element';
  tagName: string;
}

export interface ResourceUrlFingerprint extends BaseFingerprint {
  kind: 'resource_url';
  collectorId: 'collector:isolated:resource';
  operator: 'contains' | 'starts_with' | 'regex';
  urlPattern?: string;
  regex?: SerializableRegex;
  extractVersion?: boolean;
}

export interface CssPropertyFingerprint extends BaseFingerprint {
  kind: 'css_property';
  collectorId: 'collector:isolated:css_property';
  needle: string;
}

export interface HtmlSignatureFingerprint extends BaseFingerprint {
  kind: 'html_signature';
  collectorId: 'collector:isolated:html_signature';
  signatureId: 'tailwind-utilities';
}

export interface HeaderFingerprint extends BaseFingerprint {
  kind: 'header';
  collectorId: 'collector:background:header';
  headerName: string; // Lowercase header name, e.g. 'cf-ray', 'x-vercel-id'
  operator: StringMatchOperator;
  expectedValue?: string;
  regex?: SerializableRegex;
  /** Explicitly true ONLY for approved proprietary edge/server headers */
  isAuthoritativeInfrastructure?: boolean;
}

export type FingerprintDefinition =
  | GlobalFingerprint
  | MetaFingerprint
  | DomSelectorFingerprint
  | DomAttributeFingerprint
  | CustomElementFingerprint
  | ResourceUrlFingerprint
  | CssPropertyFingerprint
  | HtmlSignatureFingerprint
  | HeaderFingerprint;

// ---------------------------------------------------------------------------
// 2. Version Extraction Policy
// ---------------------------------------------------------------------------

export interface VersionExtractionStep {
  fingerprintId: string;
  regex?: SerializableRegex;
}

export interface VersionPolicy {
  steps: VersionExtractionStep[];
  missingVersionNote?: string;
}

// ---------------------------------------------------------------------------
// 3. Scoring & Claim Scope Policy
// ---------------------------------------------------------------------------

export interface ClaimScopeScoringPolicy {
  maxConfidenceScore?: number;
  authoritativeScope: ClaimScope;
  minAuthoritativeScoreForHigh: number; // e.g. 60
  unverifiedScopeCeiling: number;        // e.g. 49 (Low tier)
  weakAuthoritativeCeiling: number;      // e.g. 69 (Medium tier)
  scopeRestrictionReason: string;
  authoritativeHeaderFingerprintIds?: string[];
  requireAuthoritativeScopeForHigh?: boolean;
}

// ---------------------------------------------------------------------------
// 4. Declarative Relationship Policy
// ---------------------------------------------------------------------------

export interface IndependentProofCriteria {
  minScoreThreshold?: number;
  qualifyingFingerprintIds?: string[];
  requireAllQualifying?: boolean;
  excludedFingerprintIds?: string[];
  excludedSourcePatterns?: string[];
}

export interface RelationshipDefinition {
  targetTechnologyId: string;
  relationshipType: 'implies' | 'requires' | 'extends';
  calibration: {
    parentHighThreshold: number;       // default 80
    parentHighInferredScore: number;   // default 75
    parentMediumThreshold: number;     // default 50
    parentMediumInferredScore: number; // default 50
    parentLowInferredScore: number;    // default 30
  };
  independentProof: IndependentProofCriteria;
  reasonTemplates: {
    purelyInferred: string;
    inferredWithSupportingDirect: string;
  };
}

// ---------------------------------------------------------------------------
// 5. Root Technology Definition
// ---------------------------------------------------------------------------

export interface TechnologyDefinition {
  schemaVersion: '2.0.0';
  id: string;
  name: string;
  category: TechnologyCategory;
  website: string;
  icon: string;
  description: string;
  fingerprints: FingerprintDefinition[];
  versionPolicy?: VersionPolicy;
  scoringPolicy: ClaimScopeScoringPolicy;
  relationships?: RelationshipDefinition[];
}

// ---------------------------------------------------------------------------
// 6. Normalized Evidence Contract
// ---------------------------------------------------------------------------

/**
 * Normalized evidence structure supporting provenance tracking, fingerprint correlation,
 * and scope enforcement while maintaining backward compatibility with SignalEvidence.
 */
export interface NormalizedEvidence {
  /** Fingerprint identifier that generated this evidence (e.g. 'nextjs:global:next-data') */
  fingerprintId?: string;
  /** Signal class grouping for multi-class corroboration scoring */
  type: SignalType;
  /** Human-readable source descriptor (e.g. 'window.React', 'meta[name="generator"]') */
  source: string;
  /** Actual harvested value that satisfied the match */
  matchedValue?: string;
  /** Configured base weight defined on the fingerprint definition (1 - 100) */
  baseWeight: number;
  /** Calculated effective score contribution after class caps and diminishing returns */
  effectiveWeight?: number;
  /** Evidence role distinguishing direct proof from supporting or subordinate signals */
  role: EvidenceRole;
  /** Fact scope established by this evidence */
  claimScope: ClaimScope;
  /** Collector that harvested this signal */
  collectorId: CollectorId;
}

/**
 * Converts a legacy SignalEvidence record into a NormalizedEvidence record.
 *
 * DIRECTIONAL CONVERSION CHARACTERISTICS:
 * - Up-conversion: SignalEvidence -> NormalizedEvidence -> SignalEvidence is completely LOSSLESS
 *   across all legacy fields (type, source, matchedValue, weight).
 * - Down-conversion: NormalizedEvidence -> SignalEvidence -> NormalizedEvidence is INTENTIONALLY LOSSY
 *   with respect to Schema v2 metadata. The legacy SignalEvidence contract has no fields for
 *   fingerprintId, role, claimScope, collectorId, or baseWeight. When converting back from
 *   SignalEvidence, default provenance values are synthesized according to signal type unless
 *   explicit overrides are provided.
 */
export function toNormalizedEvidence(
  legacy: SignalEvidence,
  overrides?: Partial<NormalizedEvidence>
): NormalizedEvidence {
  let defaultCollector: CollectorId = 'collector:isolated:dom';
  let defaultScope: ClaimScope = 'dom_structure';

  switch (legacy.type) {
    case 'global':
      defaultCollector = 'collector:main:global';
      defaultScope = 'runtime_execution';
      break;
    case 'meta':
      defaultCollector = 'collector:isolated:meta';
      defaultScope = 'dom_structure';
      break;
    case 'dom':
      defaultCollector = 'collector:isolated:dom';
      defaultScope = 'dom_structure';
      break;
    case 'resource':
      defaultCollector = 'collector:isolated:resource';
      defaultScope = 'asset_delivery';
      break;
    case 'header':
      defaultCollector = 'collector:background:header';
      defaultScope = 'hosting_infrastructure';
      break;
    case 'inferred':
      defaultCollector = 'collector:main:global';
      defaultScope = 'runtime_execution';
      break;
  }

  return {
    type: legacy.type,
    source: legacy.source,
    matchedValue: legacy.matchedValue,
    baseWeight: legacy.weight,
    effectiveWeight: overrides?.effectiveWeight ?? legacy.weight,
    role: overrides?.role ?? (legacy.type === 'inferred' ? 'subordinate' : 'direct'),
    claimScope: overrides?.claimScope ?? defaultScope,
    collectorId: overrides?.collectorId ?? defaultCollector,
    fingerprintId: overrides?.fingerprintId,
    ...overrides,
  };
}

/**
 * Projects a NormalizedEvidence record down to a legacy SignalEvidence record.
 * Uses effectiveWeight if defined, falling back to baseWeight. Schema v2 metadata
 * (fingerprintId, role, claimScope, collectorId) is omitted as SignalEvidence has no
 * slots for them.
 */
export function toSignalEvidence(normalized: NormalizedEvidence): SignalEvidence {
  return {
    type: normalized.type,
    source: normalized.source,
    matchedValue: normalized.matchedValue,
    weight: normalized.effectiveWeight ?? normalized.baseWeight,
  };
}

/**
 * Error thrown when a TechnologyDefinition fails schema or structural validation
 */
export class SchemaValidationError extends Error {
  public errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'SchemaValidationError';
    this.errors = errors;
  }
}
