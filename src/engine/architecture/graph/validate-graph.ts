/**
 * SiteStack Architecture Intelligence Module - Deterministic Graph Validator
 * Location: src/engine/architecture/graph/validate-graph.ts
 *
 * Comprehensive static and runtime validation for constructed architecture graphs:
 * - Duplicate node and edge ID detection
 * - Missing endpoint and self-loop isolation
 * - Evidence state and verified/co-detection semantic invariants
 * - Inference provenance consistency
 * - Hard-dependency cycle detection via Tarjan's Strongly Connected Components (SCC)
 *
 * STRICT INVARIANTS:
 * 1. Read-only validation; zero mutation or silent edge dropping.
 * 2. Co-detection must NEVER be marked verified (CO_DETECTION_MARKED_VERIFIED).
 * 3. Contextual relationships must NEVER be marked inferred or directly observed.
 * 4. Actionable diagnostics detailing exact offending IDs, roles, and cycle paths.
 */

import {
  ArchitectureRelationshipType,
  RELATIONSHIP_TAXONOMY,
  VALID_EVIDENCE_STATES,
  VALID_RELATIONSHIP_TYPES,
} from '../types';
import {
  ArchitectureGraph,
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
  GraphDiagnostic,
  GraphValidationResult,
} from './types';

interface TarjanNodeState {
  index: number;
  lowlink: number;
  onStack: boolean;
}

/**
 * Traces a concrete cycle path within a strongly connected component.
 */
function reconstructGraphCyclePath(
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

  // Fallback: stable sorted members
  return [...Array.from(sccSet).sort(), startNode];
}

/**
 * Finds all circular dependencies among verified hard dependencies using Tarjan's algorithm.
 */
export function detectGraphHardDependencyCycles(
  nodes: readonly ArchitectureGraphNode[],
  edges: readonly ArchitectureGraphEdge[]
): GraphDiagnostic[] {
  const hardEdges = edges.filter(
    (e) => e.classification === 'hard_dependency' && e.isVerified
  );

  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of hardEdges) {
    if (!adjacency.has(edge.sourceId)) {
      adjacency.set(edge.sourceId, []);
    }
    adjacency.get(edge.sourceId)!.push(edge.targetId);
  }

  // Ensure deterministic neighbor order
  for (const neighbors of adjacency.values()) {
    neighbors.sort();
  }

  const sortedNodes = nodes.map((n) => n.id).sort();
  let currentIndex = 0;
  const stack: string[] = [];
  const nodeState = new Map<string, TarjanNodeState>();
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

      // Component is circular if > 1 node, or single node with a self-loop
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

  for (const nodeId of sortedNodes) {
    if (!nodeState.has(nodeId)) {
      strongConnect(nodeId);
    }
  }

  const diagnostics: GraphDiagnostic[] = [];
  for (const scc of sccs) {
    const sccSet = new Set(scc);
    const startNode = [...scc].sort()[0];
    const cyclePath = reconstructGraphCyclePath(startNode, sccSet, adjacency);

    diagnostics.push({
      code: 'HARD_DEPENDENCY_CYCLE',
      severity: 'error',
      message: `Circular hard dependency detected among verified technologies: ${cyclePath.join(' -> ')}. Hard dependencies must strictly form a DAG.`,
      nodeId: startNode,
      cyclePath,
    });
  }

  return diagnostics;
}

/**
 * Validates complete structural and evidence invariants on an ArchitectureGraph.
 */
export function validateArchitectureGraph(
  graph: Pick<ArchitectureGraph, 'nodes' | 'edges'>
): GraphValidationResult {
  const errors: GraphDiagnostic[] = [];
  const warnings: GraphDiagnostic[] = [];

  const seenNodeIds = new Set<string>();
  const nodesById = new Map<string, ArchitectureGraphNode>();

  // -------------------------------------------------------------------------
  // 1. Validate Nodes
  // -------------------------------------------------------------------------
  for (const node of graph.nodes) {
    if (seenNodeIds.has(node.id)) {
      errors.push({
        code: 'DUPLICATE_NODE_ID',
        severity: 'error',
        message: `Duplicate node ID detected in graph: "${node.id}".`,
        nodeId: node.id,
      });
    }
    seenNodeIds.add(node.id);
    nodesById.set(node.id, node);

    // Inferred node consistency
    if (node.detectionType === 'inferred') {
      if (!node.isInferred) {
        errors.push({
          code: 'INVALID_INFERRED_PROVENANCE',
          severity: 'error',
          message: `Node "${node.id}" has detectionType: 'inferred' but isInferred flag is false.`,
          nodeId: node.id,
        });
      }
      if (node.isDirect) {
        errors.push({
          code: 'INVALID_INFERRED_PROVENANCE',
          severity: 'error',
          message: `Node "${node.id}" has detectionType: 'inferred' but isDirect flag is true. Inferred targets must never be marked direct.`,
          nodeId: node.id,
        });
      }
      if (!node.inferredProvenance) {
        errors.push({
          code: 'INVALID_INFERRED_PROVENANCE',
          severity: 'error',
          message: `Node "${node.id}" is marked inferred but lacks inferredProvenance traceability metadata.`,
          nodeId: node.id,
        });
      }
    } else {
      if (node.isInferred) {
        errors.push({
          code: 'INVALID_INFERRED_PROVENANCE',
          severity: 'error',
          message: `Node "${node.id}" has detectionType: 'direct' but isInferred flag is true.`,
          nodeId: node.id,
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. Validate Edges
  // -------------------------------------------------------------------------
  const seenEdgeIds = new Set<string>();
  const validRelTypes = new Set<string>(VALID_RELATIONSHIP_TYPES);
  const validEvidenceStates = new Set<string>(VALID_EVIDENCE_STATES);

  for (const edge of graph.edges) {
    // Duplicate Edge ID
    if (seenEdgeIds.has(edge.id)) {
      errors.push({
        code: 'DUPLICATE_EDGE_ID',
        severity: 'error',
        message: `Duplicate edge ID detected in graph: "${edge.id}".`,
        edgeId: edge.id,
      });
    }
    seenEdgeIds.add(edge.id);

    // Self loop
    if (edge.sourceId === edge.targetId) {
      errors.push({
        code: 'SELF_LOOP',
        severity: 'error',
        message: `Edge "${edge.id}" is a self-loop (${edge.sourceId} -> ${edge.targetId}). Self-referencing edges are prohibited.`,
        edgeId: edge.id,
      });
    }

    // Missing Endpoints
    const sourceNode = nodesById.get(edge.sourceId);
    const targetNode = nodesById.get(edge.targetId);

    if (!sourceNode) {
      errors.push({
        code: 'MISSING_EDGE_ENDPOINT',
        severity: 'error',
        message: `Edge "${edge.id}" references source node "${edge.sourceId}" which is absent from graph nodes.`,
        edgeId: edge.id,
        nodeId: edge.sourceId,
      });
    }

    if (!targetNode) {
      errors.push({
        code: 'MISSING_EDGE_ENDPOINT',
        severity: 'error',
        message: `Edge "${edge.id}" references target node "${edge.targetId}" which is absent from graph nodes.`,
        edgeId: edge.id,
        nodeId: edge.targetId,
      });
    }

    // Relationship Type
    if (!validRelTypes.has(edge.relationshipType)) {
      errors.push({
        code: 'INVALID_RELATIONSHIP_TYPE',
        severity: 'error',
        message: `Edge "${edge.id}" declares invalid relationship type: "${edge.relationshipType}".`,
        edgeId: edge.id,
      });
    } else {
      const taxonomy = RELATIONSHIP_TAXONOMY[edge.relationshipType as ArchitectureRelationshipType];
      if (taxonomy && edge.classification !== taxonomy.classification) {
        errors.push({
          code: 'INVALID_RELATIONSHIP_CLASSIFICATION',
          severity: 'error',
          message: `Edge "${edge.id}" declares classification "${edge.classification}" but relationship type "${edge.relationshipType}" requires "${taxonomy.classification}".`,
          edgeId: edge.id,
        });
      }
    }

    // Evidence State
    if (!validEvidenceStates.has(edge.evidenceState)) {
      errors.push({
        code: 'INVALID_EVIDENCE_STATE',
        severity: 'error',
        message: `Edge "${edge.id}" declares invalid evidence state: "${edge.evidenceState}".`,
        edgeId: edge.id,
      });
    }

    // Catalog-only in active graph
    if (edge.evidenceState === 'catalog_only') {
      errors.push({
        code: 'CATALOG_ONLY_IN_ACTIVE_GRAPH',
        severity: 'error',
        message: `Edge "${edge.id}" has evidenceState "catalog_only". Catalog-only relationships must be excluded from active graph edges.`,
        edgeId: edge.id,
      });
    }

    // Co-detection marked verified (CRITICAL INVARIANT)
    if (edge.evidenceState === 'co_detected') {
      if (edge.isVerified) {
        errors.push({
          code: 'CO_DETECTION_MARKED_VERIFIED',
          severity: 'error',
          message: `Edge "${edge.id}" is marked co_detected but has isVerified: true. Co-detection must strictly remain an unverified association.`,
          edgeId: edge.id,
        });
      }
      if (!edge.isCoDetection) {
        errors.push({
          code: 'CO_DETECTION_MARKED_VERIFIED',
          severity: 'error',
          message: `Edge "${edge.id}" is marked co_detected but has isCoDetection: false.`,
          edgeId: edge.id,
        });
      }
      if (edge.isInferred) {
        errors.push({
          code: 'CONTEXTUAL_MARKED_INFERRED',
          severity: 'error',
          message: `Edge "${edge.id}" is marked co_detected but has isInferred: true. Co-detected associations cannot be inferred.`,
          edgeId: edge.id,
        });
      }
    }

    // Contextual relationship marked inferred or directly observed
    if (edge.classification === 'contextual') {
      if (edge.evidenceState === 'inferred' || edge.isInferred) {
        errors.push({
          code: 'CONTEXTUAL_MARKED_INFERRED',
          severity: 'error',
          message: `Contextual edge "${edge.id}" is marked inferred. Contextual relationships cannot be inferred.`,
          edgeId: edge.id,
        });
      }
      if (edge.evidenceState === 'directly_observed') {
        errors.push({
          code: 'INVALID_DIRECT_OBSERVATION',
          severity: 'error',
          message: `Contextual edge "${edge.id}" is marked directly_observed. Client probes do not harvest response headers or DOM containment to prove direct contextual linkage.`,
          edgeId: edge.id,
        });
      }
    }

    // Inferred edge provenance consistency
    if (edge.evidenceState === 'inferred') {
      if (!edge.isVerified) {
        errors.push({
          code: 'INVALID_INFERRED_PROVENANCE',
          severity: 'error',
          message: `Inferred edge "${edge.id}" must have isVerified: true.`,
          edgeId: edge.id,
        });
      }
      if (!edge.isInferred) {
        errors.push({
          code: 'INVALID_INFERRED_PROVENANCE',
          severity: 'error',
          message: `Inferred edge "${edge.id}" must have isInferred: true.`,
          edgeId: edge.id,
        });
      }
      if (edge.classification !== 'hard_dependency') {
        errors.push({
          code: 'CONTEXTUAL_MARKED_INFERRED',
          severity: 'error',
          message: `Inferred edge "${edge.id}" has classification "${edge.classification}". Only hard dependencies may be inferred.`,
          edgeId: edge.id,
        });
      }
      if (targetNode && targetNode.detectionType !== 'inferred') {
        errors.push({
          code: 'INVALID_INFERRED_PROVENANCE',
          severity: 'error',
          message: `Inferred edge "${edge.id}" targets node "${edge.targetId}" which has detectionType "${targetNode.detectionType}" instead of "inferred".`,
          edgeId: edge.id,
          nodeId: edge.targetId,
        });
      }
    }

    // Dependency-First Topological Rank Invariant: rank(source) > rank(target) for verified hard dependencies
    if (edge.classification === 'hard_dependency' && edge.isVerified && sourceNode && targetNode) {
      if (sourceNode.topologicalRank <= targetNode.topologicalRank) {
        errors.push({
          code: 'INVALID_TOPOLOGICAL_RANK',
          severity: 'error',
          message: `Hard dependency edge "${edge.id}" violates dependency-first ranking: dependent source "${sourceNode.id}" has rank ${sourceNode.topologicalRank}, but dependency target "${targetNode.id}" has rank ${targetNode.topologicalRank}. Dependent must have rank > dependency rank.`,
          edgeId: edge.id,
          nodeId: sourceNode.id,
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. Cycle Detection among Verified Hard Dependencies (Tarjan's SCC)
  // -------------------------------------------------------------------------
  const cycleDiagnostics = detectGraphHardDependencyCycles(graph.nodes, graph.edges);
  for (const diag of cycleDiagnostics) {
    errors.push(diag);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cycleDiagnostics,
  };
}
