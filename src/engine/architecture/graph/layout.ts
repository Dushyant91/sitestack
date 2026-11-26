/**
 * SiteStack Architecture Intelligence Module - Deterministic Layout Engine
 * Location: src/engine/architecture/graph/layout.ts
 *
 * Pure, deterministic layout preparation and structural topology analysis:
 * 1. Dependency-First Topological Ranking:
 *    - Hard dependency edge A -> B means A depends on B (or A extends B).
 *    - Base foundation/dependency B has rank 0 (e.g. React, Vue, WordPress).
 *    - Dependent A has rank(A) > rank(B) (e.g. Next.js, Nuxt, WooCommerce have rank 1).
 *    - Invariant: For every verified hard dependency A -> B, rank(A) > rank(B).
 * 2. Strict Contextual Isolation:
 *    - Contextual associations (hosted_on, content_source, styled_with, integrates)
 *      are mathematically excluded from hard-dependency topological ranks.
 * 3. Component Separation:
 *    - dependencyClusterId: tracks connected components of verified hard dependencies only.
 *      Contextual edges NEVER merge separate dependency stacks.
 *    - connectedComponentId: tracks components across all active edges (hard + contextual).
 *    - isolatedNodeIds: degree 0 across all active edges.
 *    - dependencyIsolatedNodeIds: degree 0 in verified hard dependencies.
 *
 * STRICT INVARIANTS:
 * - Zero DOM, CSS, or rendering logic.
 * - Bit-exact reproducibility regardless of input node/edge order.
 * - Contextual edges never alter hard-dependency ranks or merge dependency clusters.
 */

import { ArchitectureGraphEdge, GraphLayoutResult } from './types';

export interface LayoutNodeStub {
  readonly id: string;
}

/**
 * Prepares deterministic structural layout metadata for graph nodes.
 */
export function prepareGraphLayout(
  nodes: readonly LayoutNodeStub[],
  edges: readonly ArchitectureGraphEdge[]
): GraphLayoutResult {
  // Sort node IDs deterministically
  const sortedNodeIds = nodes.map((n) => n.id).sort();
  const nodeSet = new Set(sortedNodeIds);

  // -------------------------------------------------------------------------
  // 1. Degree Calculations (All Active Edges)
  // -------------------------------------------------------------------------
  const inDegrees = new Map<string, number>();
  const outDegrees = new Map<string, number>();

  for (const id of sortedNodeIds) {
    inDegrees.set(id, 0);
    outDegrees.set(id, 0);
  }

  for (const edge of edges) {
    if (nodeSet.has(edge.sourceId) && nodeSet.has(edge.targetId)) {
      outDegrees.set(edge.sourceId, (outDegrees.get(edge.sourceId) || 0) + 1);
      inDegrees.set(edge.targetId, (inDegrees.get(edge.targetId) || 0) + 1);
    }
  }

  // Identify Completely Isolated Nodes (Total Active Degree === 0)
  const isolatedNodeIds = new Set<string>();
  for (const id of sortedNodeIds) {
    const totalDegree = (inDegrees.get(id) || 0) + (outDegrees.get(id) || 0);
    if (totalDegree === 0) {
      isolatedNodeIds.add(id);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Hard-Dependency Degree Calculations (Verified Hard Dependencies ONLY)
  // -------------------------------------------------------------------------
  // Invariant: Contextual associations must NOT influence hard-dependency ordering.
  const hardEdges = edges.filter(
    (e) => e.classification === 'hard_dependency' && e.isVerified && nodeSet.has(e.sourceId) && nodeSet.has(e.targetId)
  );

  const dependencyInDegrees = new Map<string, number>();
  const dependencyOutDegrees = new Map<string, number>();

  for (const id of sortedNodeIds) {
    dependencyInDegrees.set(id, 0);
    dependencyOutDegrees.set(id, 0);
  }

  // Edge u -> v: u is dependent (out), v is dependency (in)
  for (const edge of hardEdges) {
    dependencyOutDegrees.set(edge.sourceId, (dependencyOutDegrees.get(edge.sourceId) || 0) + 1);
    dependencyInDegrees.set(edge.targetId, (dependencyInDegrees.get(edge.targetId) || 0) + 1);
  }

  // Identify Dependency-Isolated Nodes (Hard Degree === 0)
  const dependencyIsolatedNodeIds = new Set<string>();
  for (const id of sortedNodeIds) {
    const hardTotalDegree = (dependencyInDegrees.get(id) || 0) + (dependencyOutDegrees.get(id) || 0);
    if (hardTotalDegree === 0) {
      dependencyIsolatedNodeIds.add(id);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Dependency-First Topological Ranking
  // -------------------------------------------------------------------------
  // Edge direction: A -> B where A depends on B (or A extends B).
  // In dependency-first ranking:
  // - Target B is the foundational dependency: rank(B) = 0 (if B depends on nothing).
  // - Source A is the dependent: rank(A) = 1 + max(rank(B) across all dependencies B).
  // - Invariant: rank(A) > rank(B) for every hard dependency A -> B.
  //
  // Algorithm: Kahn's algorithm on the reversed hard dependency graph (B -> A).
  // - In the reversed graph, edges point from dependency to dependent.
  // - In-degree in reversed graph of node A is the out-degree in original hard graph
  //   (i.e. number of dependencies that A depends on).
  // - Nodes with 0 dependencies (dependencyOutDegrees === 0, such as React, Vue, WordPress)
  //   have in-degree 0 in the reversed graph and start with rank = 0.
  const reversedHardAdj = new Map<string, string[]>();
  for (const id of sortedNodeIds) {
    reversedHardAdj.set(id, []);
  }

  for (const edge of hardEdges) {
    // Edge in reversed graph: dependency (targetId) -> dependent (sourceId)
    reversedHardAdj.get(edge.targetId)!.push(edge.sourceId);
  }

  for (const dependents of reversedHardAdj.values()) {
    dependents.sort();
  }

  const ranks = new Map<string, number>();
  for (const id of sortedNodeIds) {
    ranks.set(id, 0);
  }

  // Remaining dependencies to be processed for each dependent node A
  const remainingDependencies = new Map<string, number>(dependencyOutDegrees);

  // Foundations: nodes that depend on 0 other nodes
  const queue: string[] = [];
  for (const id of sortedNodeIds) {
    if (remainingDependencies.get(id) === 0) {
      queue.push(id);
    }
  }

  let processedCount = 0;
  let maxDepth = 0;

  while (queue.length > 0) {
    const foundation = queue.shift()!;
    processedCount++;
    const foundationRank = ranks.get(foundation)!;

    const dependents = reversedHardAdj.get(foundation) || [];
    for (const dependent of dependents) {
      const newRank = Math.max(ranks.get(dependent) || 0, foundationRank + 1);
      ranks.set(dependent, newRank);
      if (newRank > maxDepth) {
        maxDepth = newRank;
      }

      const remaining = remainingDependencies.get(dependent)! - 1;
      remainingDependencies.set(dependent, remaining);
      if (remaining === 0) {
        queue.push(dependent);
      }
    }
  }

  // Fallback for cyclic hard dependencies (if any exist before static validation)
  if (processedCount < sortedNodeIds.length) {
    const fallbackRank = maxDepth + 1;
    for (const id of sortedNodeIds) {
      if (remainingDependencies.get(id)! > 0) {
        ranks.set(id, fallbackRank);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. Hard Dependency Clusters (Verified Hard Dependencies ONLY)
  // -------------------------------------------------------------------------
  // INVARIANT: Contextual edges NEVER merge hard-dependency components.
  // Each independent stack (e.g. Next.js+React vs WooCommerce+WordPress)
  // retains a separate cluster ID.
  const hardUndirectedAdj = new Map<string, string[]>();
  for (const id of sortedNodeIds) {
    hardUndirectedAdj.set(id, []);
  }

  for (const edge of hardEdges) {
    hardUndirectedAdj.get(edge.sourceId)!.push(edge.targetId);
    hardUndirectedAdj.get(edge.targetId)!.push(edge.sourceId);
  }

  for (const neighbors of hardUndirectedAdj.values()) {
    neighbors.sort();
  }

  const hardVisited = new Set<string>();
  const dependencyClusterMap = new Map<string, number>();
  const multiNodeHardClusters: string[][] = [];

  for (const id of sortedNodeIds) {
    if (dependencyIsolatedNodeIds.has(id)) {
      dependencyClusterMap.set(id, 0);
      hardVisited.add(id);
      continue;
    }

    if (!hardVisited.has(id)) {
      const clusterMembers: string[] = [];
      const clusterQueue: string[] = [id];
      hardVisited.add(id);

      while (clusterQueue.length > 0) {
        const curr = clusterQueue.shift()!;
        clusterMembers.push(curr);

        const neighbors = hardUndirectedAdj.get(curr) || [];
        for (const neighbor of neighbors) {
          if (!hardVisited.has(neighbor)) {
            hardVisited.add(neighbor);
            clusterQueue.push(neighbor);
          }
        }
      }

      clusterMembers.sort();
      multiNodeHardClusters.push(clusterMembers);
    }
  }

  multiNodeHardClusters.sort((a, b) => a[0].localeCompare(b[0]));

  let clusterCounter = 1;
  for (const cluster of multiNodeHardClusters) {
    for (const member of cluster) {
      dependencyClusterMap.set(member, clusterCounter);
    }
    clusterCounter++;
  }

  // -------------------------------------------------------------------------
  // 5. Connected Components Across All Active Edges (Hard + Contextual)
  // -------------------------------------------------------------------------
  const totalUndirectedAdj = new Map<string, string[]>();
  for (const id of sortedNodeIds) {
    totalUndirectedAdj.set(id, []);
  }

  for (const edge of edges) {
    if (nodeSet.has(edge.sourceId) && nodeSet.has(edge.targetId)) {
      totalUndirectedAdj.get(edge.sourceId)!.push(edge.targetId);
      totalUndirectedAdj.get(edge.targetId)!.push(edge.sourceId);
    }
  }

  for (const neighbors of totalUndirectedAdj.values()) {
    neighbors.sort();
  }

  const totalVisited = new Set<string>();
  const connectedComponentMap = new Map<string, number>();
  const multiNodeTotalComponents: string[][] = [];

  for (const id of sortedNodeIds) {
    if (isolatedNodeIds.has(id)) {
      connectedComponentMap.set(id, 0);
      totalVisited.add(id);
      continue;
    }

    if (!totalVisited.has(id)) {
      const compMembers: string[] = [];
      const compQueue: string[] = [id];
      totalVisited.add(id);

      while (compQueue.length > 0) {
        const curr = compQueue.shift()!;
        compMembers.push(curr);

        const neighbors = totalUndirectedAdj.get(curr) || [];
        for (const neighbor of neighbors) {
          if (!totalVisited.has(neighbor)) {
            totalVisited.add(neighbor);
            compQueue.push(neighbor);
          }
        }
      }

      compMembers.sort();
      multiNodeTotalComponents.push(compMembers);
    }
  }

  multiNodeTotalComponents.sort((a, b) => a[0].localeCompare(b[0]));

  let compCounter = 1;
  for (const comp of multiNodeTotalComponents) {
    for (const member of comp) {
      connectedComponentMap.set(member, compCounter);
    }
    compCounter++;
  }

  return {
    ranks,
    dependencyClusterIds: dependencyClusterMap,
    connectedComponentIds: connectedComponentMap,
    isolatedNodeIds,
    dependencyIsolatedNodeIds,
    inDegrees,
    outDegrees,
    dependencyInDegrees,
    dependencyOutDegrees,
    totalDependencyClusters: multiNodeHardClusters.length,
    totalConnectedComponents: multiNodeTotalComponents.length,
    maxDepth,
  };
}
