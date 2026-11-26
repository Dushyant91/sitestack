/**
 * SiteStack Architecture Intelligence Module - Deterministic Graph Engine
 * Location: src/engine/architecture/graph/build-graph.ts
 *
 * Pure, deterministic architecture graph builder:
 * 1. Accepts existing scan result or detected technology array.
 * 2. Matches detected technologies against canonical semantic profiles.
 * 3. Constructs nodes with preserved detection scores and inference provenance.
 * 4. Resolves hard dependencies (directly_observed vs inferred) with strict evidence grounding.
 * 5. Resolves contextual relationships strictly as unverified co-detection associations (isVerified: false).
 * 6. Completely excludes catalog-only relationships from active graph edges by default.
 * 7. Applies dynamic topological ranking and connected component layout preparation.
 * 8. Returns bit-exact deterministic output regardless of input array ordering.
 *
 * STRICT INVARIANTS:
 * - Read-only consumption of detection engine scan results.
 * - Zero modification of detection confidence scores or thresholds.
 * - Co-detection is NEVER presented as a verified integration or dependency.
 * - Zero external graph dependencies.
 */

import { DetectedTechnology, ScanResult } from '../../types';
import { CANONICAL_TECHNOLOGY_DEFINITIONS } from '../../schema/definitions';
import { CANONICAL_ARCHITECTURE_ONTOLOGY } from '../ontology';
import {
  ArchitectureOntology,
  ArchitectureRelationshipType,
  ArchitectureSemanticRole,
} from '../types';
import { prepareGraphLayout } from './layout';
import {
  ArchitectureGraph,
  ArchitectureGraphEdge,
  ArchitectureGraphMetrics,
  ArchitectureGraphNode,
  BuildArchitectureGraphInput,
  BuildGraphOptions,
  InferenceProvenance,
} from './types';
import { validateArchitectureGraph } from './validate-graph';

/**
 * Resolves a parent dependency reference (which may be a technology name like 'Next.js'
 * or an ID like 'nextjs') into a canonical technology ID.
 */
export function resolveParentTechnologyId(
  parentRef: string | undefined,
  detectedTechs: readonly { id: string; name?: string }[]
): string | undefined {
  if (!parentRef) return undefined;
  const normalized = parentRef.trim().toLowerCase();

  // 1. Direct ID match among detected technologies
  const matchById = detectedTechs.find((t) => t.id.toLowerCase() === normalized);
  if (matchById) return matchById.id;

  // 2. Direct Name match among detected technologies
  const matchByName = detectedTechs.find((t) => t.name?.toLowerCase() === normalized);
  if (matchByName) return matchByName.id;

  // 3. Match against canonical technology catalog
  const canonical = CANONICAL_TECHNOLOGY_DEFINITIONS.find(
    (t) => t.id.toLowerCase() === normalized || t.name.toLowerCase() === normalized
  );
  return canonical?.id;
}

/**
 * Formats a short, user-friendly relationship label for UI representation.
 */
function getRelationshipLabel(type: ArchitectureRelationshipType): string {
  switch (type) {
    case 'depends_on':
      return 'depends on';
    case 'extends':
      return 'extends';
    case 'hosted_on':
      return 'hosted on';
    case 'content_source':
      return 'content source';
    case 'styled_with':
      return 'styled with';
    case 'integrates':
      return 'integrates with';
    default:
      return type;
  }
}

/**
 * Extracts a concise human-readable evidence summary from a detected technology.
 */
function extractEvidenceSummary(tech: DetectedTechnology): string | undefined {
  if (tech.confidenceReason) {
    return tech.confidenceReason;
  }
  if (tech.evidence && tech.evidence.length > 0) {
    const primary = tech.evidence[0];
    return `Matched ${primary.type} signal: ${primary.source}`;
  }
  return undefined;
}

/**
 * Pure, deterministic function to construct an ArchitectureGraph from scan results.
 */
export function buildArchitectureGraph(
  input: ScanResult | BuildArchitectureGraphInput,
  options?: BuildGraphOptions
): ArchitectureGraph {
  // -------------------------------------------------------------------------
  // 1. Normalize Inputs
  // -------------------------------------------------------------------------
  let rawDetectedTechs: readonly DetectedTechnology[];
  let url: string | undefined;
  let domain: string | undefined;
  let timestamp: number;
  let ontology: ArchitectureOntology;

  if ('technologies' in input) {
    // ScanResult input
    rawDetectedTechs = input.technologies || [];
    url = input.url;
    domain = input.domain;
    timestamp = input.timestamp || Date.now();
    ontology = options?.ontology || CANONICAL_ARCHITECTURE_ONTOLOGY;
  } else {
    // BuildArchitectureGraphInput input
    rawDetectedTechs = input.detectedTechnologies || [];
    url = input.url;
    domain = input.domain;
    timestamp = input.timestamp || Date.now();
    ontology = options?.ontology || input.ontology || CANONICAL_ARCHITECTURE_ONTOLOGY;
  }

  // -------------------------------------------------------------------------
  // 2. Normalize and Deduplicate Detected Technologies
  // -------------------------------------------------------------------------
  // Invariant: Input array order must not affect output.
  // When duplicate technology IDs appear, keep the direct detection or higher confidence.
  const techMap = new Map<string, DetectedTechnology>();

  for (const tech of rawDetectedTechs) {
    if (!tech || !tech.id) continue;
    const normId = tech.id.trim().toLowerCase();

    if (!techMap.has(normId)) {
      techMap.set(normId, tech);
    } else {
      const existing = techMap.get(normId)!;
      // Prefer direct detection over inferred
      if (existing.detectionType === 'inferred' && tech.detectionType !== 'inferred') {
        techMap.set(normId, tech);
      } else if (
        existing.detectionType === tech.detectionType &&
        (tech.confidenceScore || 0) > (existing.confidenceScore || 0)
      ) {
        techMap.set(normId, tech);
      }
    }
  }

  // Deterministically sorted detected technologies by ID
  const sortedTechs = Array.from(techMap.values()).sort((a, b) => a.id.localeCompare(b.id));

  // Build index of canonical technology definitions and semantic profiles
  const profilesByTechId = new Map(ontology.profiles.map((p) => [p.technologyId, p]));
  const canonicalDefsById = new Map(CANONICAL_TECHNOLOGY_DEFINITIONS.map((c) => [c.id, c]));

  // -------------------------------------------------------------------------
  // 3. Construct Graph Nodes
  // -------------------------------------------------------------------------
  const nodes: ArchitectureGraphNode[] = [];
  const nodesById = new Map<string, ArchitectureGraphNode>();

  for (const tech of sortedTechs) {
    const normId = tech.id.trim().toLowerCase();
    const profile = profilesByTechId.get(normId);
    const canonicalDef = canonicalDefsById.get(normId);

    const roles: readonly ArchitectureSemanticRole[] =
      profile?.roles || [tech.category as ArchitectureSemanticRole];
    const primaryRole: ArchitectureSemanticRole =
      profile?.primaryRole || (tech.category as ArchitectureSemanticRole);

    const isDirect = tech.detectionType !== 'inferred';
    const isInferred = tech.detectionType === 'inferred';

    // Build inference provenance if the technology was synthesized
    let inferredProvenance: InferenceProvenance | undefined;
    if (isInferred) {
      const sourceTechId = resolveParentTechnologyId(tech.parentDependency, sortedTechs) || 'unknown';
      const sourceTechObj = sortedTechs.find((t) => t.id === sourceTechId);

      inferredProvenance = {
        sourceTechnologyId: sourceTechId,
        sourceTechnologyName: sourceTechObj?.name || tech.parentDependency,
        ruleId: `${sourceTechId}->${normId}:implies`,
        ruleReference: `implies rule in canonical technology definitions for ${sourceTechId}`,
        reason: tech.confidenceReason || `Inferred via ${sourceTechId} detection rule`,
        originalDetectedSource: tech.parentDependency || sourceTechId,
      };
    }

    const node: ArchitectureGraphNode = {
      id: normId,
      name: tech.name || canonicalDef?.name || normId,
      category: tech.category || canonicalDef?.category || 'library',
      roles,
      primaryRole,
      confidenceScore: tech.confidenceScore || 0,
      confidenceTier: tech.confidenceTier || 'low',
      detectionType: isInferred ? 'inferred' : 'direct',
      isDirect,
      isInferred,
      version: tech.version,
      versionMaturity: tech.versionMaturity,
      website: tech.website || canonicalDef?.website,
      icon: tech.icon || canonicalDef?.icon,
      description: tech.description || canonicalDef?.description || profile?.notes,
      evidenceSummary: extractEvidenceSummary(tech),
      inferredProvenance,
      topologicalRank: 0,
      dependencyClusterId: 0,
      connectedComponentId: 0,
      componentId: 0,
      isIsolated: true,
      isDependencyIsolated: true,
      inDegree: 0,
      outDegree: 0,
      dependencyInDegree: 0,
      dependencyOutDegree: 0,
    };

    nodes.push(node);
    nodesById.set(normId, node);
  }

  // -------------------------------------------------------------------------
  // 4. Construct Graph Edges with Strict Evidence Semantics
  // -------------------------------------------------------------------------
  const edges: ArchitectureGraphEdge[] = [];
  const includeCatalogOnly = options?.includeCatalogOnly === true;

  for (const rel of ontology.relationships) {
    const hasSource = nodesById.has(rel.sourceId);
    const hasTarget = nodesById.has(rel.targetId);

    // If one or both endpoints are missing from the scan
    if (!hasSource || !hasTarget) {
      if (includeCatalogOnly) {
        // Excluded by default; included only when reference catalog mode requested
        edges.push({
          id: rel.id,
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          relationshipType: rel.type,
          classification: rel.classification,
          evidenceState: 'catalog_only',
          evidenceDescription: 'Catalog reference relationship; one or both endpoints absent from scan.',
          isVerified: false,
          isInferred: false,
          isCoDetection: false,
          label: getRelationshipLabel(rel.type),
          explanation: rel.description,
        });
      }
      continue;
    }

    // Both source and target exist on the scanned page
    const sourceNode = nodesById.get(rel.sourceId)!;
    const targetNode = nodesById.get(rel.targetId)!;

    if (rel.classification === 'hard_dependency') {
      // ---------------------------------------------------------------------
      // 4.1 Hard Dependency: Verified Linkage (directly_observed or inferred)
      // ---------------------------------------------------------------------
      const isTargetInferredFromSource =
        targetNode.isInferred &&
        targetNode.inferredProvenance?.sourceTechnologyId === sourceNode.id;

      if (isTargetInferredFromSource && rel.confidenceSemantics.allowInferred) {
        // Target was actively synthesized via parent implies calibration rule
        edges.push({
          id: rel.id,
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          relationshipType: rel.type,
          classification: 'hard_dependency',
          evidenceState: 'inferred',
          evidenceDescription:
            rel.evidenceRequirements.inferredProofDescription ||
            `Synthesized via engine implies calibration rule when ${sourceNode.name} is detected.`,
          isVerified: true,
          isInferred: true,
          isCoDetection: false,
          label: getRelationshipLabel(rel.type),
          explanation: rel.description,
          supportingEvidence: targetNode.inferredProvenance?.reason,
        });
      } else if (rel.confidenceSemantics.allowDirectObservation) {
        // Both source and target were directly detected with verified signals
        edges.push({
          id: rel.id,
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          relationshipType: rel.type,
          classification: 'hard_dependency',
          evidenceState: 'directly_observed',
          evidenceDescription:
            rel.evidenceRequirements.directProofDescription ||
            `Direct runtime or architectural linkage verified on page.`,
          isVerified: true,
          isInferred: false,
          isCoDetection: false,
          label: getRelationshipLabel(rel.type),
          explanation: rel.description,
          supportingEvidence: sourceNode.evidenceSummary || targetNode.evidenceSummary,
        });
      }
    } else {
      // ---------------------------------------------------------------------
      // 4.2 Contextual Relationship: Unverified Co-Detection Association
      // ---------------------------------------------------------------------
      // STRICT INVARIANT:
      // Contextual relationships (hosted_on, content_source, integrates, styled_with)
      // have allowDirectObservation: false and allowInferred: false.
      // They MUST NOT be presented as verified integrations, dependencies, or links.
      edges.push({
        id: rel.id,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        relationshipType: rel.type,
        classification: 'contextual',
        evidenceState: 'co_detected',
        evidenceDescription:
          'Co-detected on webpage; contextual architectural pairing without client-side linkage proof.',
        isVerified: false, // Invariant: NEVER verified!
        isInferred: false, // Invariant: NEVER inferred!
        isCoDetection: true, // Invariant: strictly marked as co-detection association
        label: getRelationshipLabel(rel.type),
        explanation: rel.description,
        supportingEvidence: `Both ${sourceNode.name} and ${targetNode.name} detected on page`,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 5. Deterministic Layout & Topology Preparation
  // -------------------------------------------------------------------------
  const layoutResult = prepareGraphLayout(nodes, edges);

  // Update nodes with layout metadata
  const finalizedNodes: ArchitectureGraphNode[] = nodes.map((node) => ({
    ...node,
    topologicalRank: layoutResult.ranks.get(node.id) || 0,
    dependencyClusterId: layoutResult.dependencyClusterIds.get(node.id) || 0,
    connectedComponentId: layoutResult.connectedComponentIds.get(node.id) || 0,
    componentId: layoutResult.dependencyClusterIds.get(node.id) || 0,
    isIsolated: layoutResult.isolatedNodeIds.has(node.id),
    isDependencyIsolated: layoutResult.dependencyIsolatedNodeIds.has(node.id),
    inDegree: layoutResult.inDegrees.get(node.id) || 0,
    outDegree: layoutResult.outDegrees.get(node.id) || 0,
    dependencyInDegree: layoutResult.dependencyInDegrees.get(node.id) || 0,
    dependencyOutDegree: layoutResult.dependencyOutDegrees.get(node.id) || 0,
  }));

  // -------------------------------------------------------------------------
  // 6. Deterministic Sorting
  // -------------------------------------------------------------------------
  // Nodes: sort primary by topologicalRank asc, secondary by id asc
  finalizedNodes.sort((a, b) => {
    if (a.topologicalRank !== b.topologicalRank) {
      return a.topologicalRank - b.topologicalRank;
    }
    return a.id.localeCompare(b.id);
  });

  // Edges: sort primary by sourceId asc, secondary by targetId asc, tertiary by relationshipType asc
  edges.sort((a, b) => {
    if (a.sourceId !== b.sourceId) {
      return a.sourceId.localeCompare(b.sourceId);
    }
    if (a.targetId !== b.targetId) {
      return a.targetId.localeCompare(b.targetId);
    }
    return a.relationshipType.localeCompare(b.relationshipType);
  });

  // -------------------------------------------------------------------------
  // 7. Compute Summary Metrics
  // -------------------------------------------------------------------------
  const directlyObservedEdges = edges.filter((e) => e.evidenceState === 'directly_observed').length;
  const inferredEdges = edges.filter((e) => e.isInferred).length;
  const coDetectionEdges = edges.filter((e) => e.isCoDetection).length;

  const metrics: ArchitectureGraphMetrics = {
    totalNodes: finalizedNodes.length,
    totalEdges: edges.length,
    totalDependencies: directlyObservedEdges + inferredEdges,
    verifiedEdges: edges.filter((e) => e.isVerified).length,
    coDetectionEdges,
    inferredEdges,
    directlyObservedEdges,
    isolatedNodes: finalizedNodes.filter((n) => n.isIsolated).length,
    dependencyIsolatedNodes: finalizedNodes.filter((n) => n.isDependencyIsolated).length,
    dependencyClusters: layoutResult.totalDependencyClusters,
    connectedComponents: layoutResult.totalConnectedComponents,
    maxTopologicalDepth: layoutResult.maxDepth,
  };

  // -------------------------------------------------------------------------
  // 8. Validation Diagnostics
  // -------------------------------------------------------------------------
  let diagnostics: readonly import('./types').GraphDiagnostic[] = [];
  let valid = true;

  if (options?.validateGraph !== false) {
    const validationResult = validateArchitectureGraph({
      nodes: finalizedNodes,
      edges,
    });
    diagnostics = validationResult.errors;
    valid = validationResult.valid;
  }

  return {
    schemaVersion: '1.0.0',
    url,
    domain,
    timestamp,
    nodes: finalizedNodes,
    edges,
    metrics,
    diagnostics,
    valid,
  };
}
