/**
 * SiteStack Architecture Intelligence Module - Graph Engine Types
 * Location: src/engine/architecture/graph/types.ts
 *
 * Strongly-typed data contracts for graph nodes, edges, inference provenance,
 * layout metrics, and deterministic graph validation diagnostics.
 *
 * STRICT INVARIANTS:
 * 1. Read-only consumption of canonical technology ontology and detection definitions.
 * 2. Zero modification of existing detection engine scoring or schema types.
 * 3. Categorical evidence states strictly preserved (directly_observed, co_detected, inferred, catalog_only).
 * 4. Co-detection is strictly non-verified: isVerified === false, isCoDetection === true.
 */

import { ConfidenceTier, DetectedTechnology } from '../../types';
import {
  ArchitectureEvidenceState,
  ArchitectureOntology,
  ArchitectureRelationshipType,
  ArchitectureSemanticRole,
  RelationshipClassification,
} from '../types';

// ---------------------------------------------------------------------------
// 1. Inference Provenance Contract
// ---------------------------------------------------------------------------

export interface InferenceProvenance {
  /** The detected parent technology ID that triggered the inference rule */
  readonly sourceTechnologyId: string;
  /** Human-readable display name of the parent technology */
  readonly sourceTechnologyName?: string;
  /** Unique ID of the inference rule (e.g. 'nextjs->react:implies') */
  readonly ruleId: string;
  /** Formal reference to the canonical schema implies definition */
  readonly ruleReference: string;
  /** Human-readable explanation of why this technology was inferred */
  readonly reason: string;
  /** Original raw detected source reference as reported by the scanner */
  readonly originalDetectedSource: string;
}

// ---------------------------------------------------------------------------
// 2. Graph Node Contract
// ---------------------------------------------------------------------------

export interface ArchitectureGraphNode {
  /** Stable technology ID matching the canonical catalog (e.g. 'nextjs') */
  readonly id: string;
  /** Technology display name (e.g. 'Next.js') */
  readonly name: string;
  /** Detection category from frozen engine (e.g. 'framework') */
  readonly category: string;
  /** Multi-role semantic classifications assigned by the ontology */
  readonly roles: readonly ArchitectureSemanticRole[];
  /** Primary semantic role for layout sorting and high-level categorization */
  readonly primaryRole: ArchitectureSemanticRole;
  /** Genuine detection confidence score (0 - 100) from frozen detection engine */
  readonly confidenceScore: number;
  /** Categorical confidence tier from detection engine ('high' | 'medium' | 'low') */
  readonly confidenceTier: ConfidenceTier;
  /** Whether the technology was directly detected via signals or inferred by engine */
  readonly detectionType: 'direct' | 'inferred';
  /** True if directly evidenced on the page */
  readonly isDirect: boolean;
  /** True if synthesized via an authorized parent implies rule */
  readonly isInferred: boolean;
  /** Optional detected or extracted version string */
  readonly version?: string;
  /** Classification of version maturity ('stable' | 'prerelease' | 'development' | 'unknown') */
  readonly versionMaturity?: string;
  /** Official technology website URL */
  readonly website?: string;
  /** Icon identifier or asset path */
  readonly icon?: string;
  /** Technology description from canonical registry */
  readonly description?: string;
  /** Human-readable summary of primary detection signal */
  readonly evidenceSummary?: string;
  /** Complete inference provenance chain if this node was inferred */
  readonly inferredProvenance?: InferenceProvenance;

  // Layout & Topology Metadata
  /**
   * Dependency-first topological hierarchy rank computed strictly from verified hard dependencies.
   * Rank 0 = Base foundation / core runtime / platform (e.g. React, Vue, WordPress).
   * Successive ranks = Dependent meta-frameworks / plugins / extensions (e.g. Next.js, Nuxt, WooCommerce).
   * STRICT INVARIANT: For every verified hard dependency A -> B, rank(A) > rank(B).
   */
  readonly topologicalRank: number;
  /**
   * Identifier of the hard-dependency cluster this node belongs to.
   * 1-based for multi-node dependency stacks; 0 if the node has no hard dependencies.
   * STRICT INVARIANT: Contextual associations never merge separate dependency clusters.
   */
  readonly dependencyClusterId: number;
  /**
   * Identifier of the connected component across all active edges (hard + contextual).
   * 1-based for multi-node connected components; 0 for completely isolated nodes.
   */
  readonly connectedComponentId: number;
  /**
   * Primary component identifier (alias to dependencyClusterId to preserve dependency stack isolation).
   */
  readonly componentId: number;
  /** True if the node has zero active edges of any kind in the active graph */
  readonly isIsolated: boolean;
  /** True if the node has zero verified hard dependencies in the active graph */
  readonly isDependencyIsolated: boolean;
  /** Total number of incoming active edges (hard + contextual) */
  readonly inDegree: number;
  /** Total number of outgoing active edges (hard + contextual) */
  readonly outDegree: number;
  /** Total number of incoming verified hard dependencies (nodes that depend on this node) */
  readonly dependencyInDegree: number;
  /** Total number of outgoing verified hard dependencies (nodes this node depends on) */
  readonly dependencyOutDegree: number;
}

// ---------------------------------------------------------------------------
// 3. Graph Edge Contract
// ---------------------------------------------------------------------------

export interface ArchitectureGraphEdge {
  /** Stable edge identifier: `${sourceId}->${targetId}:${relationshipType}` */
  readonly id: string;
  /** Source technology ID */
  readonly sourceId: string;
  /** Target technology ID */
  readonly targetId: string;
  /** Semantic relationship type */
  readonly relationshipType: ArchitectureRelationshipType;
  /** Hard dependency (strictly coupled) vs Contextual (co-occurring association) */
  readonly classification: RelationshipClassification;
  /** Categorical evidence verification state */
  readonly evidenceState: ArchitectureEvidenceState;
  /** Human-readable explanation of why this edge was formed and verified */
  readonly evidenceDescription: string;
  /**
   * True ONLY for 'directly_observed' and 'inferred' edges.
   * STRICT INVARIANT: Always false for 'co_detected' and 'catalog_only' edges.
   */
  readonly isVerified: boolean;
  /** True ONLY if the edge was formed via parent engine inference */
  readonly isInferred: boolean;
  /**
   * True ONLY if the edge reflects unverified co-detection on the same page.
   * STRICT INVARIANT: co-detection must never be presented as verified linkage.
   */
  readonly isCoDetection: boolean;
  /** Short human-readable edge label (e.g. 'depends on', 'extends', 'hosted on') */
  readonly label: string;
  /** Explanatory description from the architecture ontology */
  readonly explanation: string;
  /** Specific linking evidence string when available */
  readonly supportingEvidence?: string;
}

// ---------------------------------------------------------------------------
// 4. Graph Summary Metrics
// ---------------------------------------------------------------------------

export interface ArchitectureGraphMetrics {
  /** Total count of nodes in the graph */
  readonly totalNodes: number;
  /** Total count of edges in the active graph */
  readonly totalEdges: number;
  /**
   * Total count of all hard dependency edges (directlyObservedEdges + inferredEdges).
   * Represents total dependency linkages without conflating evidence states.
   */
  readonly totalDependencies: number;
  /**
   * @deprecated Ambiguous metric: conflates directly observed with inferred dependencies.
   * Maintained for backward compatibility. Equals `directlyObservedEdges + inferredEdges`.
   */
  readonly verifiedEdges: number;
  /** Total count of unverified co-detection associations */
  readonly coDetectionEdges: number;
  /** Total count of inferred dependency edges */
  readonly inferredEdges: number;
  /** Total count of directly observed edges */
  readonly directlyObservedEdges: number;
  /** Count of nodes with degree 0 across all active edges */
  readonly isolatedNodes: number;
  /** Count of nodes with zero verified hard dependencies */
  readonly dependencyIsolatedNodes: number;
  /** Count of distinct multi-node hard-dependency clusters */
  readonly dependencyClusters: number;
  /** Count of distinct multi-node connected components across all active edges */
  readonly connectedComponents: number;
  /** Maximum topological depth across all hard-dependency chains */
  readonly maxTopologicalDepth: number;
}

// ---------------------------------------------------------------------------
// 5. Validation Diagnostics Contract
// ---------------------------------------------------------------------------

export type GraphValidationErrorCode =
  | 'DUPLICATE_NODE_ID'
  | 'DUPLICATE_EDGE_ID'
  | 'MISSING_EDGE_ENDPOINT'
  | 'SELF_LOOP'
  | 'INVALID_RELATIONSHIP_TYPE'
  | 'INVALID_RELATIONSHIP_CLASSIFICATION'
  | 'INVALID_EVIDENCE_STATE'
  | 'INVALID_INFERRED_PROVENANCE'
  | 'INVALID_DIRECT_OBSERVATION'
  | 'CATALOG_ONLY_IN_ACTIVE_GRAPH'
  | 'CO_DETECTION_MARKED_VERIFIED'
  | 'CONTEXTUAL_MARKED_INFERRED'
  | 'INVALID_TOPOLOGICAL_RANK'
  | 'HARD_DEPENDENCY_CYCLE';

export interface GraphDiagnostic {
  readonly code: GraphValidationErrorCode;
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly nodeId?: string;
  readonly edgeId?: string;
  readonly cyclePath?: readonly string[];
}

export interface GraphValidationResult {
  readonly valid: boolean;
  readonly errors: readonly GraphDiagnostic[];
  readonly warnings: readonly GraphDiagnostic[];
  readonly cycleDiagnostics: readonly GraphDiagnostic[];
}

// ---------------------------------------------------------------------------
// 6. Complete Architecture Graph Contract
// ---------------------------------------------------------------------------

export interface ArchitectureGraph {
  /** Schema contract version */
  readonly schemaVersion: '1.0.0';
  /** Scanned URL if available */
  readonly url?: string;
  /** Scanned host domain if available */
  readonly domain?: string;
  /** Scan evaluation timestamp */
  readonly timestamp: number;
  /** Ordered list of graph nodes */
  readonly nodes: readonly ArchitectureGraphNode[];
  /** Ordered list of graph edges */
  readonly edges: readonly ArchitectureGraphEdge[];
  /** Aggregate summary metrics */
  readonly metrics: ArchitectureGraphMetrics;
  /** Static validation diagnostics */
  readonly diagnostics: readonly GraphDiagnostic[];
  /** True if the graph is strictly valid without any error diagnostics */
  readonly valid: boolean;
}

// ---------------------------------------------------------------------------
// 7. Graph Builder Input & Options
// ---------------------------------------------------------------------------

export interface BuildArchitectureGraphInput {
  /** Array of detected technology objects from scan evaluation */
  readonly detectedTechnologies: readonly DetectedTechnology[];
  /** Scanned URL */
  readonly url?: string;
  /** Scanned host domain */
  readonly domain?: string;
  /** Scan timestamp */
  readonly timestamp?: number;
  /** Optional custom ontology (defaults to CANONICAL_ARCHITECTURE_ONTOLOGY) */
  readonly ontology?: ArchitectureOntology;
}

export interface BuildGraphOptions {
  /** Optional custom ontology */
  readonly ontology?: ArchitectureOntology;
  /** Whether to retain catalog_only relationships in the edges array (default: false) */
  readonly includeCatalogOnly?: boolean;
  /** Whether to execute strict validation on the resulting graph (default: true) */
  readonly validateGraph?: boolean;
}

// ---------------------------------------------------------------------------
// 8. Layout Engine Result Contract
// ---------------------------------------------------------------------------

export interface GraphLayoutResult {
  /** Mapping of node ID -> dependency-first topological rank (0 = base foundation/dependency) */
  readonly ranks: ReadonlyMap<string, number>;
  /** Mapping of node ID -> hard-dependency cluster ID (1-based, 0 = no hard dependencies) */
  readonly dependencyClusterIds: ReadonlyMap<string, number>;
  /** Mapping of node ID -> connected component ID across all active edges (1-based, 0 = isolated) */
  readonly connectedComponentIds: ReadonlyMap<string, number>;
  /** Set of isolated node IDs across all active edges (total degree === 0) */
  readonly isolatedNodeIds: ReadonlySet<string>;
  /** Set of dependency-isolated node IDs (hard dependency degree === 0) */
  readonly dependencyIsolatedNodeIds: ReadonlySet<string>;
  /** Mapping of node ID -> inDegree count across all active edges */
  readonly inDegrees: ReadonlyMap<string, number>;
  /** Mapping of node ID -> outDegree count across all active edges */
  readonly outDegrees: ReadonlyMap<string, number>;
  /** Mapping of node ID -> incoming verified hard dependencies count */
  readonly dependencyInDegrees: ReadonlyMap<string, number>;
  /** Mapping of node ID -> outgoing verified hard dependencies count */
  readonly dependencyOutDegrees: ReadonlyMap<string, number>;
  /** Total number of distinct multi-node hard-dependency clusters */
  readonly totalDependencyClusters: number;
  /** Total number of distinct multi-node connected components across all active edges */
  readonly totalConnectedComponents: number;
  /** Maximum topological depth in the graph */
  readonly maxDepth: number;
}
