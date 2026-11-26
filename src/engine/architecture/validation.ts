/**
 * SiteStack Architecture Intelligence Module - Static Ontology Validator
 * Location: src/engine/architecture/validation.ts
 *
 * Comprehensive static validation and cycle detection (Tarjan's SCC)
 * for the declarative architecture ontology.
 *
 * STRICT INVARIANTS:
 * 1. Read-only validation; zero mutation or silent dropping of edges.
 * 2. Hard dependencies must strictly form a Directed Acyclic Graph (DAG).
 * 3. Contextual relationships are evaluated without falsely triggering cycle errors.
 * 4. Actionable diagnostics detailing exact offending IDs, roles, and cycle paths.
 */

import { CANONICAL_TECHNOLOGY_DEFINITIONS } from '../schema/definitions';
import {
  ArchitectureOntology,
  ArchitectureRelationshipType,
  OntologyDiagnostic,
  OntologyRelationshipDefinition,
  OntologyValidationResult,
  RELATIONSHIP_TAXONOMY,
  VALID_RELATIONSHIP_TYPES,
  VALID_SEMANTIC_ROLES,
} from './types';

export const CANONICAL_TECHNOLOGY_IDS: ReadonlySet<string> = new Set(
  CANONICAL_TECHNOLOGY_DEFINITIONS.map((tech) => tech.id)
);

// ---------------------------------------------------------------------------
// 1. Tarjan's Strongly Connected Components (SCC) for Cycle Detection
// ---------------------------------------------------------------------------

interface TarjanNode {
  index: number;
  lowlink: number;
  onStack: boolean;
}

/**
 * Traces a concrete cycle path within a strongly connected component.
 */
function reconstructCyclePath(
  startNode: string,
  sccSet: Set<string>,
  adjacency: Map<string, string[]>
): string[] {
  const queue: Array<{ current: string; path: string[] }> = [{ current: startNode, path: [startNode] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    const neighbors = adjacency.get(current) || [];

    for (const neighbor of neighbors) {
      if (!sccSet.has(neighbor)) continue;

      if (neighbor === startNode && path.length > 1) {
        return [...path, startNode];
      }

      const pathKey = `${current}->${neighbor}`;
      if (!visited.has(pathKey)) {
        visited.add(pathKey);
        queue.push({ current: neighbor, path: [...path, neighbor] });
      }
    }
  }

  // Fallback: return members in stable order
  return [...Array.from(sccSet).sort(), startNode];
}

/**
 * Finds all circular dependencies among hard dependencies using Tarjan's algorithm.
 */
export function detectHardDependencyCycles(
  relationships: readonly OntologyRelationshipDefinition[]
): OntologyDiagnostic[] {
  const hardRels = relationships.filter((rel) => rel.classification === 'hard_dependency');

  // Build adjacency list for hard dependencies
  const adjacency = new Map<string, string[]>();
  const edgeMap = new Map<string, string[]>(); // `${u}->${v}` => relationship IDs

  for (const rel of hardRels) {
    if (!adjacency.has(rel.sourceId)) {
      adjacency.set(rel.sourceId, []);
    }
    adjacency.get(rel.sourceId)!.push(rel.targetId);

    const edgeKey = `${rel.sourceId}->${rel.targetId}`;
    if (!edgeMap.has(edgeKey)) {
      edgeMap.set(edgeKey, []);
    }
    edgeMap.get(edgeKey)!.push(rel.id);
  }

  const nodes = Array.from(
    new Set([...hardRels.map((r) => r.sourceId), ...hardRels.map((r) => r.targetId)])
  ).sort();

  let currentIndex = 0;
  const stack: string[] = [];
  const nodeState = new Map<string, TarjanNode>();
  const sccs: string[][] = [];

  function strongConnect(u: string) {
    nodeState.set(u, {
      index: currentIndex,
      lowlink: currentIndex,
      onStack: true,
    });
    currentIndex++;
    stack.push(u);

    const neighbors = adjacency.get(u) || [];
    for (const v of neighbors) {
      if (!nodeState.has(v)) {
        strongConnect(v);
        const uState = nodeState.get(u)!;
        const vState = nodeState.get(v)!;
        uState.lowlink = Math.min(uState.lowlink, vState.lowlink);
      } else if (nodeState.get(v)!.onStack) {
        const uState = nodeState.get(u)!;
        const vState = nodeState.get(v)!;
        uState.lowlink = Math.min(uState.lowlink, vState.index);
      }
    }

    const uState = nodeState.get(u)!;
    if (uState.lowlink === uState.index) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        nodeState.get(w)!.onStack = false;
        scc.push(w);
      } while (w !== u);

      // A component is circular if it contains > 1 node, or a single node with a self-loop
      if (scc.length > 1) {
        sccs.push(scc);
      } else if (scc.length === 1) {
        const selfNeighbors = adjacency.get(scc[0]) || [];
        if (selfNeighbors.includes(scc[0])) {
          sccs.push(scc);
        }
      }
    }
  }

  for (const node of nodes) {
    if (!nodeState.has(node)) {
      strongConnect(node);
    }
  }

  // Convert SCCs into actionable diagnostics
  const cycleDiagnostics: OntologyDiagnostic[] = [];

  for (const scc of sccs) {
    const sccSet = new Set(scc);
    const startNode = [...scc].sort()[0];
    const cyclePath = scc.length === 1 && (adjacency.get(startNode) || []).includes(startNode)
      ? [startNode, startNode]
      : reconstructCyclePath(startNode, sccSet, adjacency);

    // Identify participating edges
    const participatingEdgeIds: string[] = [];
    for (let i = 0; i < cyclePath.length - 1; i++) {
      const edgeKey = `${cyclePath[i]}->${cyclePath[i + 1]}`;
      const edges = edgeMap.get(edgeKey) || [];
      participatingEdgeIds.push(...edges);
    }

    cycleDiagnostics.push({
      code: 'CIRCULAR_HARD_DEPENDENCY',
      severity: 'error',
      message: `Circular hard dependency detected: ${cyclePath.join(' -> ')} (Involved Edges: ${participatingEdgeIds.join(', ') || 'none'})`,
      technologyId: startNode,
      cyclePath,
    });
  }

  return cycleDiagnostics;
}

// ---------------------------------------------------------------------------
// 2. Comprehensive Static Ontology Validation
// ---------------------------------------------------------------------------

export interface OntologyValidationOptions {
  readonly knownTechnologyIds?: ReadonlySet<string> | readonly string[];
  readonly requireAllProfiles?: boolean;
}

export function validateArchitectureOntology(
  ontology: ArchitectureOntology,
  options?: OntologyValidationOptions
): OntologyValidationResult {
  const errors: OntologyDiagnostic[] = [];
  const warnings: OntologyDiagnostic[] = [];

  const knownIds: ReadonlySet<string> = options?.knownTechnologyIds
    ? options.knownTechnologyIds instanceof Set
      ? options.knownTechnologyIds
      : new Set(options.knownTechnologyIds)
    : CANONICAL_TECHNOLOGY_IDS;

  const validRelTypes = new Set<string>(VALID_RELATIONSHIP_TYPES);
  const validRoles = new Set<string>(VALID_SEMANTIC_ROLES);

  // -------------------------------------------------------------------------
  // A. Validate Semantic Profiles
  // -------------------------------------------------------------------------
  const seenProfileTechIds = new Set<string>();

  for (const profile of ontology.profiles) {
    // 1. Unknown Technology ID
    if (!knownIds.has(profile.technologyId)) {
      errors.push({
        code: 'UNKNOWN_TECHNOLOGY_ID',
        severity: 'error',
        message: `Semantic profile references unknown technology ID: "${profile.technologyId}".`,
        technologyId: profile.technologyId,
      });
    }

    // 2. Duplicate Profile
    if (seenProfileTechIds.has(profile.technologyId)) {
      errors.push({
        code: 'DUPLICATE_SEMANTIC_PROFILE',
        severity: 'error',
        message: `Duplicate semantic profile declared for technology: "${profile.technologyId}".`,
        technologyId: profile.technologyId,
      });
    }
    seenProfileTechIds.add(profile.technologyId);

    // 3. Empty Roles
    if (!profile.roles || profile.roles.length === 0) {
      errors.push({
        code: 'EMPTY_SEMANTIC_ROLES',
        severity: 'error',
        message: `Semantic profile for "${profile.technologyId}" has no roles declared.`,
        technologyId: profile.technologyId,
      });
    } else {
      // 4. Invalid Semantic Roles
      for (const role of profile.roles) {
        if (!validRoles.has(role)) {
          errors.push({
            code: 'INVALID_SEMANTIC_ROLE',
            severity: 'error',
            message: `Semantic profile for "${profile.technologyId}" contains invalid role: "${role}".`,
            technologyId: profile.technologyId,
          });
        }
      }

      // 5. Invalid Primary Role
      if (!profile.roles.includes(profile.primaryRole)) {
        errors.push({
          code: 'INVALID_PRIMARY_ROLE',
          severity: 'error',
          message: `Semantic profile for "${profile.technologyId}" specifies primaryRole "${profile.primaryRole}" which is not in its declared roles: [${profile.roles.join(', ')}].`,
          technologyId: profile.technologyId,
        });
      }
    }
  }

  // 6. Check for missing profiles among known technologies
  if (options?.requireAllProfiles !== false) {
    for (const techId of knownIds) {
      if (!seenProfileTechIds.has(techId)) {
        warnings.push({
          code: 'MISSING_SEMANTIC_PROFILE',
          severity: 'warning',
          message: `Canonical technology "${techId}" lacks an explicit semantic profile in the ontology.`,
          technologyId: techId,
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // B. Validate Relationships
  // -------------------------------------------------------------------------
  const seenRelationshipIds = new Set<string>();
  const seenRelationshipPairs = new Set<string>();

  for (const rel of ontology.relationships) {
    // 1. Duplicate Relationship ID
    if (seenRelationshipIds.has(rel.id)) {
      errors.push({
        code: 'DUPLICATE_RELATIONSHIP_ID',
        severity: 'error',
        message: `Duplicate relationship ID detected: "${rel.id}".`,
        relationshipId: rel.id,
      });
    }
    seenRelationshipIds.add(rel.id);

    // 2. Duplicate Source-Target-Type Triple
    const pairKey = `${rel.sourceId}->${rel.targetId}:${rel.type}`;
    if (seenRelationshipPairs.has(pairKey)) {
      errors.push({
        code: 'DUPLICATE_RELATIONSHIP_PAIR',
        severity: 'error',
        message: `Duplicate relationship pairing detected: "${pairKey}" is already declared.`,
        relationshipId: rel.id,
      });
    }
    seenRelationshipPairs.add(pairKey);

    // 3. Unknown Source / Target Technology IDs
    if (!knownIds.has(rel.sourceId)) {
      errors.push({
        code: 'UNKNOWN_TECHNOLOGY_ID',
        severity: 'error',
        message: `Relationship "${rel.id}" references unknown source technology ID: "${rel.sourceId}".`,
        relationshipId: rel.id,
        technologyId: rel.sourceId,
      });
    }

    if (!knownIds.has(rel.targetId)) {
      errors.push({
        code: 'UNKNOWN_TECHNOLOGY_ID',
        severity: 'error',
        message: `Relationship "${rel.id}" references unknown target technology ID: "${rel.targetId}".`,
        relationshipId: rel.id,
        technologyId: rel.targetId,
      });
    }

    // 4. Self-Referencing Loop
    if (rel.sourceId === rel.targetId) {
      errors.push({
        code: 'SELF_REFERENCING_RELATIONSHIP',
        severity: 'error',
        message: `Relationship "${rel.id}" is self-referencing (${rel.sourceId} -> ${rel.targetId}). Self-loops are prohibited.`,
        relationshipId: rel.id,
        technologyId: rel.sourceId,
      });
    }

    // 5. Invalid Relationship Type
    if (!validRelTypes.has(rel.type)) {
      errors.push({
        code: 'INVALID_RELATIONSHIP_TYPE',
        severity: 'error',
        message: `Relationship "${rel.id}" declares invalid relationship type: "${rel.type}".`,
        relationshipId: rel.id,
      });
    } else {
      // 6. Relationship Classification Alignment
      const taxonomyDef = RELATIONSHIP_TAXONOMY[rel.type as ArchitectureRelationshipType];
      if (taxonomyDef && rel.classification !== taxonomyDef.classification) {
        errors.push({
          code: 'INVALID_RELATIONSHIP_CLASSIFICATION',
          severity: 'error',
          message: `Relationship "${rel.id}" declares classification "${rel.classification}" but relationship type "${rel.type}" requires "${taxonomyDef.classification}".`,
          relationshipId: rel.id,
        });
      }
    }

    // 7. Missing or Empty Description
    if (!rel.description || rel.description.trim().length === 0) {
      errors.push({
        code: 'MISSING_DESCRIPTION',
        severity: 'error',
        message: `Relationship "${rel.id}" is missing an explanatory description.`,
        relationshipId: rel.id,
      });
    }

    // 8. Invalid Evidence Requirements
    if (
      !rel.evidenceRequirements ||
      !rel.evidenceRequirements.directProofDescription ||
      rel.evidenceRequirements.directProofDescription.trim().length === 0
    ) {
      errors.push({
        code: 'INVALID_EVIDENCE_REQUIREMENTS',
        severity: 'error',
        message: `Relationship "${rel.id}" lacks directProofDescription in evidenceRequirements.`,
        relationshipId: rel.id,
      });
    }

    // 9. Confidence Semantics Validation
    if (!rel.confidenceSemantics) {
      errors.push({
        code: 'INVALID_CONFIDENCE_SEMANTICS',
        severity: 'error',
        message: `Relationship "${rel.id}" is missing confidenceSemantics.`,
        relationshipId: rel.id,
      });
    } else {
      if (rel.confidenceSemantics.defaultState !== 'catalog_only') {
        errors.push({
          code: 'INVALID_CONFIDENCE_SEMANTICS',
          severity: 'error',
          message: `Relationship "${rel.id}" has defaultState "${rel.confidenceSemantics.defaultState}". All catalog relationships must default to "catalog_only".`,
          relationshipId: rel.id,
        });
      }

      if (rel.confidenceSemantics.allowInferred && rel.classification !== 'hard_dependency') {
        errors.push({
          code: 'INVALID_CONFIDENCE_SEMANTICS',
          severity: 'error',
          message: `Relationship "${rel.id}" has allowInferred: true, but classification is "${rel.classification}". Only hard dependencies may be inferred.`,
          relationshipId: rel.id,
        });
      }

      if (rel.confidenceSemantics.allowDirectObservation && rel.classification === 'contextual') {
        errors.push({
          code: 'INVALID_CONFIDENCE_SEMANTICS',
          severity: 'error',
          message: `Relationship "${rel.id}" has allowDirectObservation: true, but classification is "${rel.classification}". Contextual relationships cannot assert direct client observation without structural relationship probes; they must resolve to "co_detected".`,
          relationshipId: rel.id,
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // C. Hard Dependency Cycle Detection (Tarjan's SCC)
  // -------------------------------------------------------------------------
  const cycleDiagnostics = detectHardDependencyCycles(ontology.relationships);
  for (const cycleDiag of cycleDiagnostics) {
    errors.push(cycleDiag);
  }

  // -------------------------------------------------------------------------
  // D. Compute Summary Statistics
  // -------------------------------------------------------------------------
  const hardCount = ontology.relationships.filter((r) => r.classification === 'hard_dependency').length;
  const contextualCount = ontology.relationships.filter((r) => r.classification === 'contextual').length;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cycleDiagnostics,
    stats: {
      totalRelationships: ontology.relationships.length,
      hardDependencies: hardCount,
      contextualRelationships: contextualCount,
      totalProfiles: ontology.profiles.length,
      canonicalTechnologiesCovered: seenProfileTechIds.size,
    },
  };
}
