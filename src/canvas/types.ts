/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Types
 * Location: src/canvas/types.ts
 */

import { ArchitectureGraph, ArchitectureGraphNode, ArchitectureGraphEdge } from '../engine/architecture/graph/types';
import { ScanResult } from '../engine/types';

export const CANVAS_NODE_WIDTH = 220;
export const CANVAS_NODE_HEIGHT = 68;
export const CANVAS_MIN_ZOOM = 0.25;
export const CANVAS_MAX_ZOOM = 2.5;
export const CANVAS_DEFAULT_ZOOM = 1.0;

export interface CanvasNodeLayout {
  readonly node: ArchitectureGraphNode;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly clusterId: number;
  readonly isStackFoundation: boolean;
  readonly isStackDependent: boolean;
  readonly isIndependent: boolean;
}

export interface CanvasEdgeLayout {
  readonly edge: ArchitectureGraphEdge;
  readonly sourceNode: ArchitectureGraphNode;
  readonly targetNode: ArchitectureGraphNode;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly pathD: string;
  readonly labelX: number;
  readonly labelY: number;
}

export interface CanvasClusterLayout {
  readonly clusterId: number;
  readonly title: string;
  readonly foundationNode: ArchitectureGraphNode | null;
  readonly nodes: readonly CanvasNodeLayout[];
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CanvasGraphLayoutResult {
  readonly nodeLayouts: ReadonlyMap<string, CanvasNodeLayout>;
  readonly edgeLayouts: readonly CanvasEdgeLayout[];
  readonly clusterLayouts: readonly CanvasClusterLayout[];
  readonly independentLayouts: readonly CanvasNodeLayout[];
  readonly boundingBox: {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface CanvasViewport {
  readonly panX: number;
  readonly panY: number;
  readonly zoom: number;
}

export interface CanvasFilterState {
  readonly searchQuery: string;
  readonly showDirect: boolean;
  readonly showInferred: boolean;
  readonly showUnverified: boolean;
  readonly selectedClusterId: number | 'all';
  readonly selectedCategory: string | 'all';
}

export interface CanvasState {
  readonly scanResult: ScanResult | null;
  readonly graph: ArchitectureGraph | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly selectedNodeId: string | null;
  readonly hoveredNodeId: string | null;
  readonly filters: CanvasFilterState;
  readonly viewport: CanvasViewport;
}
