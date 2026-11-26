/**
 * SiteStack Architecture Intelligence - Export System Types
 * Location: src/canvas/export/export-types.ts
 *
 * Strongly-typed contracts for vector SVG, raster PNG, and versioned JSON architecture exports.
 */

import {
  ArchitectureGraphMetrics,
  InferenceProvenance,
} from '../../engine/architecture/graph/types';
import { ConfidenceTier } from '../../engine/types';
import {
  ArchitectureEvidenceState,
  ArchitectureRelationshipType,
  RelationshipClassification,
} from '../../engine/architecture/types';

export type ArchitectureExportFormat = 'svg' | 'png' | 'json';
export type ArchitectureExportScope = 'complete' | 'filtered';

export interface ArchitectureExportOptions {
  /** Target export file format */
  readonly format: ArchitectureExportFormat;
  /** Whether to export the complete graph or only the active search/category filter */
  readonly scope?: ArchitectureExportScope;
  /** Resolution scale multiplier for PNG rasterization (1x, 2x, 3x; default 2x for Retina) */
  readonly scale?: number;
  /** Whether to render top metadata banner (domain, timestamp, metrics pill, legend) */
  readonly includeMetadata?: boolean;
  /** Visual color theme ('dark' | 'light'; default 'dark') */
  readonly theme?: 'dark' | 'light';
  /** Optional custom title override */
  readonly customTitle?: string;
}

export interface ArchitectureExportNode {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly version?: string;
  readonly versionMaturity?: string;
  readonly confidenceScore: number;
  readonly confidenceTier: ConfidenceTier;
  readonly detectionType: 'direct' | 'inferred';
  readonly semanticRoles: readonly string[];
  readonly primaryRole: string;
  readonly topologicalRank: number;
  readonly dependencyClusterId: number;
  readonly isStackFoundation: boolean;
  readonly isStackDependent: boolean;
  readonly isIndependent: boolean;
  readonly parentDependency?: string;
  readonly inferredProvenance?: InferenceProvenance;
  readonly website?: string;
  readonly description?: string;
  readonly evidenceSummary?: string;
  readonly evidenceDetails?: ReadonlyArray<{
    readonly type: string;
    readonly source: string;
    readonly weight: number;
  }>;
}

export interface ArchitectureExportEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceName: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly relationshipType: ArchitectureRelationshipType;
  readonly classification: RelationshipClassification;
  readonly evidenceState: ArchitectureEvidenceState;
  readonly isVerified: boolean;
  readonly isInferred: boolean;
  readonly isCoDetection: boolean;
  readonly label: string;
  readonly explanation: string;
  readonly supportingEvidence?: string;
}

export interface ArchitectureJsonExport {
  readonly schemaVersion: '1.0.0';
  readonly exportedAt: string;
  readonly generator: string;
  readonly site: {
    readonly domain: string;
    readonly url: string;
    readonly scanTimestamp: number;
  };
  readonly scanMetadata: {
    readonly stats: {
      readonly total: number;
      readonly high: number;
      readonly medium: number;
      readonly low: number;
    };
  };
  readonly graphMetrics: ArchitectureGraphMetrics;
  readonly technologies: readonly ArchitectureExportNode[];
  readonly relationships: readonly ArchitectureExportEdge[];
  readonly evidenceSummary: {
    readonly directlyObservedEdges: number;
    readonly inferredEdges: number;
    readonly coDetectionEdges: number;
    readonly totalDependencies: number;
    readonly connectedComponents: number;
    readonly maxTopologicalDepth: number;
  };
}

export interface ExportResult {
  readonly success: boolean;
  readonly filename: string;
  readonly format: ArchitectureExportFormat;
  readonly byteSize?: number;
  readonly error?: string;
}
