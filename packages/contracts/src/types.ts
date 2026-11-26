/**
 * SiteStack Expansion v1 — Shared Data Contracts (Schema v3.0.0)
 *
 * Universal, strongly-typed domain models shared across:
 * - Chrome Extension (Popup, Canvas, Background Service Worker)
 * - Research & Comparison System
 * - Multi-Format Reporting Engine
 * - Technology Change Monitoring Service
 * - Public Web Platform & Developer REST API
 */

import { TechCategory, ConfidenceTier, VersionMaturity, SignalType } from '../../../src/engine/types';

export type { TechCategory, ConfidenceTier, VersionMaturity, SignalType };

// =============================================================================
// 1. WEBSITE IDENTITY
// =============================================================================

export interface WebsiteIdentity {
  /** Stable unique identifier, e.g. "site_wikipedia_org" */
  id: string;
  /** Normalized lowercase hostname, e.g. "en.wikipedia.org" */
  domain: string;
  /** Root/registered domain, e.g. "wikipedia.org" */
  rootDomain: string;
  /** Human-readable display label, e.g. "Wikipedia" */
  displayName: string;
  /** Canonical sanitised URL without sensitive query parameters */
  canonicalUrl: string;
  /** Optional favicon asset URL */
  faviconUrl?: string;
  /** Timestamp (epoch ms) when this domain was first observed */
  firstSeenTimestamp: number;
  /** Timestamp (epoch ms) of the most recent scan */
  lastScannedTimestamp: number;
}

// =============================================================================
// 2. EVIDENCE & DETECTED TECHNOLOGY
// =============================================================================

export interface EvidenceRecord {
  /** Signal class type: global, dom, meta, resource, header, or inferred */
  type: SignalType;
  /** Sanitized selector, property path, or relative asset path */
  source: string;
  /** Cleaned matched string or value (with tokens/secrets redacted) */
  matchedValue?: string;
  /** Evaluator base weight assigned to this signal */
  weight: number;
  /** Unique fingerprint ID if from declarative schema, e.g. "wordpress:meta:generator" */
  fingerprintId?: string;
  /** Architectural claim scope */
  claimScope?: 'runtime_execution' | 'dom_structure' | 'asset_delivery' | 'telemetry_integration';
}

export interface TechnologyResult {
  /** Canonical technology ID, e.g. "react", "nextjs", "wordpress" */
  id: string;
  /** Display name of the technology */
  name: string;
  /** One of 8 core categories */
  category: TechCategory;
  /** Cleaned version string if detected, e.g. "19.0.0" */
  version?: string;
  /** Semantic version maturity classification */
  versionMaturity?: VersionMaturity;
  /** Calibrated confidence score (0 - 100) */
  confidenceScore: number;
  /** Standard confidence tier */
  confidenceTier: ConfidenceTier;
  /** Direct signal harvest vs ontological inference */
  detectionType: 'direct' | 'inferred';
  /** If inferred, the parent technology that established proof (e.g. "nextjs") */
  parentDependency?: string;
  /** Explainable rationale string justifying the score and evidence */
  confidenceReason: string;
  /** List of supporting and direct evidence signals */
  evidence: EvidenceRecord[];
  /** Official project/vendor website */
  website: string;
  /** Technology SVG/PNG icon path */
  icon: string;
  /** Concise technology description */
  description: string;
}

// =============================================================================
// 3. ARCHITECTURE RELATIONSHIP
// =============================================================================

export type ArchitectureRelationshipType = 'hard_dependency' | 'contextual' | 'co_detected';

export interface ArchitectureRelationshipResult {
  /** Unique edge ID, e.g. "nextjs->react" */
  id: string;
  /** Source technology ID */
  sourceId: string;
  /** Target technology ID */
  targetId: string;
  /** Relationship taxonomy type */
  relationshipType: ArchitectureRelationshipType;
  /** Human-readable explanation of relationship */
  description: string;
  /** Relationship confidence score (0 - 100) */
  confidence: number;
}

// =============================================================================
// 4. SCAN SNAPSHOT (CANONICAL SCHEMA V3)
// =============================================================================

export type ScanScope = 'single_page' | 'site_wide' | 'extension_popup' | 'api_client';

export interface ScanSnapshot {
  /** Unique snapshot ID, e.g. "scan_en_wikipedia_org_1732521900000" */
  id: string;
  /** Schema specification version */
  schemaVersion: '3.0.0';
  /** Verified website identity */
  target: WebsiteIdentity;
  /** Epoch timestamp (ms) when scan was performed */
  timestamp: number;
  /** Scope of scan execution */
  scope: ScanScope;
  /** List of detected technologies */
  technologies: TechnologyResult[];
  /** Resolved architectural relationships */
  relationships: ArchitectureRelationshipResult[];
  /** Aggregate statistical counts */
  stats: {
    total: number;
    high: number;
    medium: number;
    low: number;
    inferred: number;
  };
  /** Execution timings */
  timing: {
    /** Detection engine rule evaluation time (ms) */
    engineDurationMs: number;
    /** Total roundtrip scan time including DOM/network harvesting if available */
    totalDurationMs?: number;
  };
  /** Sanitized scan metadata */
  metadata?: {
    sanitizedUrl: string;
    userAgent?: string;
    extensionVersion?: string;
  };
}

// =============================================================================
// 5. STACK COMPARISON
// =============================================================================

export type DiffItemStatus = 'added' | 'removed' | 'persisted';

export interface TechnologyDiffRecord {
  id: string;
  name: string;
  category: TechCategory;
  status: DiffItemStatus;
  base?: TechnologyResult;
  target?: TechnologyResult;
  versionChange?: {
    from?: string;
    to?: string;
    changed: boolean;
  };
  confidenceChange?: {
    from: number;
    to: number;
    delta: number;
    tierChanged: boolean;
  };
  evidenceDelta?: {
    addedCount: number;
    removedCount: number;
  };
}

export interface ComparisonResult {
  /** Unique comparison ID */
  id: string;
  /** Base scan snapshot ID */
  baseSnapshotId: string;
  /** Target scan snapshot ID */
  targetSnapshotId: string;
  /** Identity of base website */
  baseTarget: WebsiteIdentity;
  /** Identity of target website */
  targetTarget: WebsiteIdentity;
  /** True if comparing two different domains; false if comparing same domain across time */
  isCrossDomain: boolean;
  /** Timestamp when comparison was computed */
  comparedAt: number;
  /** Summary statistics */
  stats: {
    addedCount: number;
    removedCount: number;
    persistedCount: number;
    versionChangedCount: number;
    confidenceChangedCount: number;
  };
  /** Detailed technology-by-technology diffs */
  technologies: TechnologyDiffRecord[];
}

// =============================================================================
// 6. RESEARCH COLLECTIONS, TAGS & NOTES
// =============================================================================

export interface SavedWebsiteItem {
  /** Unique item ID within collection */
  id: string;
  /** Domain identifier */
  domain: string;
  /** User-defined or canonical display label */
  displayName: string;
  /** Reference to latest scan snapshot ID */
  latestSnapshotId: string;
  /** Embedded latest snapshot summary */
  latestSnapshot: ScanSnapshot;
  /** User annotations and research notes (Markdown supported) */
  notes: string;
  /** Categorization tags (e.g. ["ecommerce", "competitor", "headless"]) */
  tags: string[];
  /** Pinned/favorite flag */
  isFavorite: boolean;
  /** Star rating (1 - 5) */
  rating?: number;
  /** Timestamp added to collection */
  addedAt: number;
  /** Timestamp last modified */
  updatedAt: number;
}

export interface ResearchCollection {
  /** Unique collection ID, e.g. "col_ecommerce_leaders_2026" */
  id: string;
  /** Human-readable title */
  name: string;
  /** Detailed collection description or research goal */
  description: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
  /** Color theme token for UI (e.g. "blue", "indigo", "emerald", "amber") */
  colorTheme?: string;
  /** List of saved website entries */
  websites: SavedWebsiteItem[];
  /** Consolidated tags across websites in this collection */
  tags: string[];
}

// =============================================================================
// 7. MULTI-FORMAT REPORT MODEL
// =============================================================================

export type ReportType =
  | 'website_stack'
  | 'technology_inventory'
  | 'architecture_intelligence'
  | 'stack_comparison';

export interface ReportRedactionConfig {
  /** Strip URL query parameters (tokens, session IDs) */
  maskQueryTokens: boolean;
  /** Anonymize private enterprise hostnames (e.g. internal.corp -> redacted.com) */
  maskHostnames: boolean;
  /** Exclude Low-confidence (<50%) detections from final report */
  hideLowConfidence: boolean;
  /** Redact raw script URLs from evidence details */
  redactAssetUrls: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  summary?: string;
  contentHtml?: string;
  data?: Record<string, unknown>;
}

export interface ReportModel {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: number;
  author?: string;
  organization?: string;
  target: WebsiteIdentity;
  snapshot?: ScanSnapshot;
  comparison?: ComparisonResult;
  redactionConfig: ReportRedactionConfig;
  sections: ReportSection[];
}

// =============================================================================
// 8. TECHNOLOGY CHANGE MONITORING
// =============================================================================

export type ChangeEventType =
  | 'technology_added'
  | 'technology_removed'
  | 'version_changed'
  | 'confidence_shifted';

export interface TechnologyChangeEvent {
  id: string;
  profileId: string;
  domain: string;
  timestamp: number;
  type: ChangeEventType;
  technologyId: string;
  technologyName: string;
  category: TechCategory;
  details: {
    previousVersion?: string;
    newVersion?: string;
    previousConfidence?: number;
    newConfidence?: number;
  };
  snapshotId: string;
}

export interface MonitoringProfile {
  id: string;
  domain: string;
  url: string;
  createdAt: number;
  lastCheckedAt?: number;
  status: 'active' | 'paused' | 'error';
  checkIntervalHours: number;
  baselineSnapshotId: string;
  latestSnapshotId?: string;
  changeEventCount: number;
  notificationPreferences: {
    onAdd: boolean;
    onRemove: boolean;
    onVersionChange: boolean;
    emailNotification?: boolean;
    webhookUrl?: string;
  };
}
