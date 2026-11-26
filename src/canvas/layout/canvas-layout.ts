/**
 * SiteStack Architecture Intelligence - Dedicated 2D Canvas Layout Engine
 * Location: src/canvas/layout/canvas-layout.ts
 *
 * Computes deterministic 2D coordinates for dependency stacks, independent tools,
 * and directional SVG Bezier curve edges on the full-screen canvas.
 */

import {
  ArchitectureGraph,
  ArchitectureGraphNode,
} from '../../engine/architecture/graph/types';
import {
  CANVAS_NODE_WIDTH,
  CANVAS_NODE_HEIGHT,
  CanvasNodeLayout,
  CanvasEdgeLayout,
  CanvasClusterLayout,
  CanvasGraphLayoutResult,
  CanvasFilterState,
} from '../types';

export const CLUSTER_PADDING = 36;
export const CLUSTER_HORIZONTAL_GAP = 72;
export const NODE_VERTICAL_GAP = 54;
export const NODE_HORIZONTAL_GAP = 32;

/**
 * Compute deterministic layout coordinates for all graph nodes and edges.
 */
export function computeCanvasGraphLayout(
  graph: ArchitectureGraph,
  filters?: Partial<CanvasFilterState>
): CanvasGraphLayoutResult {
  const nodeLayouts = new Map<string, CanvasNodeLayout>();
  const nodesById = new Map<string, ArchitectureGraphNode>(
    graph.nodes.map((n) => [n.id, n])
  );

  const effectiveFilters: CanvasFilterState = {
    searchQuery: filters?.searchQuery || '',
    showDirect: filters?.showDirect !== false,
    showInferred: filters?.showInferred !== false,
    showUnverified: filters?.showUnverified !== false,
    selectedClusterId: filters?.selectedClusterId ?? 'all',
    selectedCategory: filters?.selectedCategory || 'all',
  };

  // Filter matching node IDs if search is active
  const q = effectiveFilters.searchQuery.toLowerCase().trim();
  const searchMatchedNodeIds = new Set<string>();
  const isSearchActive = q.length > 0;

  for (const node of graph.nodes) {
    if (!isSearchActive) {
      searchMatchedNodeIds.add(node.id);
    } else {
      const match =
        node.name.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.category.toLowerCase().includes(q) ||
        node.roles.some((r) => r.toLowerCase().includes(q)) ||
        (node.version && node.version.toLowerCase().includes(q)) ||
        (node.description && node.description.toLowerCase().includes(q));
      if (match) {
        searchMatchedNodeIds.add(node.id);
      }
    }
  }

  // 1. Group nodes by dependencyClusterId
  const clustersMap = new Map<number, ArchitectureGraphNode[]>();
  const rawIndependentNodes: ArchitectureGraphNode[] = [];

  for (const node of graph.nodes) {
    if (effectiveFilters.selectedCategory !== 'all' && node.category !== effectiveFilters.selectedCategory) {
      continue;
    }

    if (node.dependencyClusterId > 0) {
      if (!clustersMap.has(node.dependencyClusterId)) {
        clustersMap.set(node.dependencyClusterId, []);
      }
      clustersMap.get(node.dependencyClusterId)!.push(node);
    } else {
      rawIndependentNodes.push(node);
    }
  }

  // Filter clusters if specific cluster selected
  const sortedClusterIds = Array.from(clustersMap.keys()).sort((a, b) => a - b);
  const clusterLayouts: CanvasClusterLayout[] = [];

  let currentClusterX = 60;
  const startY = 80;
  let maxClusterY = startY;

  for (const clusterId of sortedClusterIds) {
    if (effectiveFilters.selectedClusterId !== 'all' && effectiveFilters.selectedClusterId !== clusterId) {
      continue;
    }

    const clusterNodes = clustersMap.get(clusterId)!;
    // Group cluster nodes by rank
    const nodesByRank = new Map<number, ArchitectureGraphNode[]>();
    for (const node of clusterNodes) {
      if (!nodesByRank.has(node.topologicalRank)) {
        nodesByRank.set(node.topologicalRank, []);
      }
      nodesByRank.get(node.topologicalRank)!.push(node);
    }

    // Sort ranks ascending: Rank 0 (Foundation) at top/base
    const sortedRanks = Array.from(nodesByRank.keys()).sort((a, b) => a - b);
    let maxRankWidth = CANVAS_NODE_WIDTH;

    for (const rank of sortedRanks) {
      const rankNodes = nodesByRank.get(rank)!;
      const rankWidth = rankNodes.length * CANVAS_NODE_WIDTH + (rankNodes.length - 1) * NODE_HORIZONTAL_GAP;
      if (rankWidth > maxRankWidth) {
        maxRankWidth = rankWidth;
      }
    }

    const clusterContentWidth = maxRankWidth;
    const clusterBoxWidth = clusterContentWidth + CLUSTER_PADDING * 2;

    const clusterNodeLayouts: CanvasNodeLayout[] = [];
    let currentRankY = startY + CLUSTER_PADDING + 24; // +24 for cluster header

    // Find cluster foundation node (rank 0)
    const foundationNode = clusterNodes.find((n) => n.topologicalRank === 0) || null;
    const clusterTitle = foundationNode ? `${foundationNode.name} Stack Hierarchy` : `Cluster #${clusterId}`;

    for (const rank of sortedRanks) {
      const rankNodes = nodesByRank.get(rank)!;
      // Sort nodes deterministically by ID
      rankNodes.sort((a, b) => a.id.localeCompare(b.id));

      const rankTotalWidth = rankNodes.length * CANVAS_NODE_WIDTH + (rankNodes.length - 1) * NODE_HORIZONTAL_GAP;
      const rankStartX = currentClusterX + CLUSTER_PADDING + (clusterContentWidth - rankTotalWidth) / 2;

      rankNodes.forEach((node, index) => {
        const nodeX = rankStartX + index * (CANVAS_NODE_WIDTH + NODE_HORIZONTAL_GAP);
        const nodeY = currentRankY;

        const layout: CanvasNodeLayout = {
          node,
          x: nodeX,
          y: nodeY,
          width: CANVAS_NODE_WIDTH,
          height: CANVAS_NODE_HEIGHT,
          clusterId,
          isStackFoundation: node.topologicalRank === 0,
          isStackDependent: node.topologicalRank > 0,
          isIndependent: false,
        };

        nodeLayouts.set(node.id, layout);
        clusterNodeLayouts.push(layout);
      });

      currentRankY += CANVAS_NODE_HEIGHT + NODE_VERTICAL_GAP;
    }

    const clusterBoxHeight = currentRankY - startY + CLUSTER_PADDING - NODE_VERTICAL_GAP + 16;
    if (startY + clusterBoxHeight > maxClusterY) {
      maxClusterY = startY + clusterBoxHeight;
    }

    clusterLayouts.push({
      clusterId,
      title: clusterTitle,
      foundationNode,
      nodes: clusterNodeLayouts,
      x: currentClusterX,
      y: startY,
      width: clusterBoxWidth,
      height: clusterBoxHeight,
    });

    currentClusterX += clusterBoxWidth + CLUSTER_HORIZONTAL_GAP;
  }

  // 2. Position Independent Technologies
  // Arranged either below or to the right of clusters
  const independentLayouts: CanvasNodeLayout[] = [];
  const independentStartY = clusterLayouts.length > 0 ? maxClusterY + 70 : startY;
  const independentStartX = 60;
  const independentCols = Math.max(3, Math.min(6, Math.floor((Math.max(currentClusterX, 900) - 120) / (CANVAS_NODE_WIDTH + NODE_HORIZONTAL_GAP))));

  rawIndependentNodes.sort((a, b) => a.id.localeCompare(b.id));

  rawIndependentNodes.forEach((node, index) => {
    const col = index % independentCols;
    const row = Math.floor(index / independentCols);

    const nodeX = independentStartX + col * (CANVAS_NODE_WIDTH + NODE_HORIZONTAL_GAP);
    const nodeY = independentStartY + 50 + row * (CANVAS_NODE_HEIGHT + 24);

    const layout: CanvasNodeLayout = {
      node,
      x: nodeX,
      y: nodeY,
      width: CANVAS_NODE_WIDTH,
      height: CANVAS_NODE_HEIGHT,
      clusterId: 0,
      isStackFoundation: false,
      isStackDependent: false,
      isIndependent: true,
    };

    nodeLayouts.set(node.id, layout);
    independentLayouts.push(layout);
  });

  // 3. Compute Edge Trajectories
  const edgeLayouts: CanvasEdgeLayout[] = [];

  for (const edge of graph.edges) {
    // Check filter toggles
    if (edge.evidenceState === 'directly_observed' && !effectiveFilters.showDirect) continue;
    if (edge.evidenceState === 'inferred' && !effectiveFilters.showInferred) continue;
    if (edge.evidenceState === 'co_detected' && !effectiveFilters.showUnverified) continue;

    const sourceLayout = nodeLayouts.get(edge.sourceId);
    const targetLayout = nodeLayouts.get(edge.targetId);

    if (!sourceLayout || !targetLayout) continue;

    // Filter by cluster if active
    if (effectiveFilters.selectedClusterId !== 'all') {
      if (sourceLayout.clusterId !== effectiveFilters.selectedClusterId && targetLayout.clusterId !== effectiveFilters.selectedClusterId) {
        continue;
      }
    }

    const sourceNode = nodesById.get(edge.sourceId)!;
    const targetNode = nodesById.get(edge.targetId)!;

    // Determine curve geometry based on relative position
    let startX: number;
    let startY: number;
    let endX: number;
    let endY: number;
    let pathD: string;
    let labelX: number;
    let labelY: number;

    const isSameCluster = sourceLayout.clusterId > 0 && sourceLayout.clusterId === targetLayout.clusterId;

    if (isSameCluster) {
      // In dependency-first vertical stack:
      // Source A (e.g. Next.js, Rank 1) -> Target B (e.g. React, Rank 0)
      if (sourceLayout.y > targetLayout.y) {
        // Source is below target: connect top of source to bottom of target
        startX = sourceLayout.x + sourceLayout.width / 2;
        startY = sourceLayout.y;
        endX = targetLayout.x + targetLayout.width / 2;
        endY = targetLayout.y + targetLayout.height;

        const deltaY = startY - endY;
        const cy1 = startY - deltaY * 0.45;
        const cy2 = endY + deltaY * 0.45;

        pathD = `M ${startX} ${startY} C ${startX} ${cy1}, ${endX} ${cy2}, ${endX} ${endY}`;
        labelX = (startX + endX) / 2;
        labelY = (startY + endY) / 2;
      } else {
        // Source is above target: connect bottom of source to top of target
        startX = sourceLayout.x + sourceLayout.width / 2;
        startY = sourceLayout.y + sourceLayout.height;
        endX = targetLayout.x + targetLayout.width / 2;
        endY = targetLayout.y;

        const deltaY = endY - startY;
        const cy1 = startY + deltaY * 0.45;
        const cy2 = endY - deltaY * 0.45;

        pathD = `M ${startX} ${startY} C ${startX} ${cy1}, ${endX} ${cy2}, ${endX} ${endY}`;
        labelX = (startX + endX) / 2;
        labelY = (startY + endY) / 2;
      }
    } else {
      // Cross-cluster or contextual association: connect sides
      if (sourceLayout.x < targetLayout.x) {
        startX = sourceLayout.x + sourceLayout.width;
        startY = sourceLayout.y + sourceLayout.height / 2;
        endX = targetLayout.x;
        endY = targetLayout.y + targetLayout.height / 2;
      } else {
        startX = sourceLayout.x;
        startY = sourceLayout.y + sourceLayout.height / 2;
        endX = targetLayout.x + targetLayout.width;
        endY = targetLayout.y + targetLayout.height / 2;
      }

      const deltaX = Math.abs(endX - startX);
      const cx1 = startX < endX ? startX + deltaX * 0.5 : startX - deltaX * 0.5;
      const cx2 = startX < endX ? endX - deltaX * 0.5 : endX + deltaX * 0.5;

      pathD = `M ${startX} ${startY} C ${cx1} ${startY}, ${cx2} ${endY}, ${endX} ${endY}`;
      labelX = (startX + endX) / 2;
      labelY = (startY + endY) / 2;
    }

    edgeLayouts.push({
      edge,
      sourceNode,
      targetNode,
      startX,
      startY,
      endX,
      endY,
      pathD,
      labelX,
      labelY,
    });
  }

  // 4. Calculate overall bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (nodeLayouts.size === 0) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  } else {
    for (const layout of nodeLayouts.values()) {
      if (layout.x < minX) minX = layout.x;
      if (layout.y < minY) minY = layout.y;
      if (layout.x + layout.width > maxX) maxX = layout.x + layout.width;
      if (layout.y + layout.height > maxY) maxY = layout.y + layout.height;
    }
    for (const cluster of clusterLayouts) {
      if (cluster.x < minX) minX = cluster.x;
      if (cluster.y < minY) minY = cluster.y;
      if (cluster.x + cluster.width > maxX) maxX = cluster.x + cluster.width;
      if (cluster.y + cluster.height > maxY) maxY = cluster.y + cluster.height;
    }
  }

  // Add margin around bounding box
  minX = Math.max(0, minX - 60);
  minY = Math.max(0, minY - 60);
  maxX = maxX + 60;
  maxY = maxY + 80;

  return {
    nodeLayouts,
    edgeLayouts,
    clusterLayouts,
    independentLayouts,
    boundingBox: {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(800, maxX - minX),
      height: Math.max(600, maxY - minY),
    },
  };
}
