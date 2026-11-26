/**
 * SiteStack Architecture Flow View - Component Props & UI Types
 * Location: src/popup/components/architecture/types.ts
 */

import { ArchitectureGraph, ArchitectureGraphNode, ArchitectureGraphEdge } from '../../../engine/architecture/graph/types';

export interface ArchitectureFlowViewProps {
  /** Complete validated architecture graph */
  readonly graph: ArchitectureGraph;
  /** Optional external search query */
  readonly searchQuery?: string;
  /** Optional search change callback */
  readonly onSearchChange?: (query: string) => void;
  /** Optional callback when a technology node is clicked */
  readonly onSelectTechnology?: (node: ArchitectureGraphNode) => void;
  /** Optional callback to open dedicated full-screen Architecture Canvas */
  readonly onOpenCanvas?: () => void;
  /** Custom class name */
  readonly className?: string;
}

export interface ArchitectureSummaryProps {
  /** Total count of detected technologies */
  readonly totalNodes: number;
  /**
   * Count of directly observed hard dependency edges (supported by relationship-specific direct evidence).
   * Takes precedence over `verifiedEdges`.
   */
  readonly directlyObservedEdges?: number;
  /** Optional alias for directlyObservedEdges */
  readonly directEdges?: number;
  /** Count of inferred hard dependency edges (generated via parent inference rules) */
  readonly inferredEdges?: number;
  /** Count of unverified contextual co-detections (co-occurring on page without linkage proof) */
  readonly coDetectionEdges?: number;
  /** Optional total dependency count (directly observed + inferred) */
  readonly totalDependencies?: number;
  /** Optional flag to render a dedicated "Total Deps" badge in the UI */
  readonly showTotalDependencies?: boolean;
  /**
   * @deprecated Legacy metric that conflated direct and inferred dependencies.
   * Maintained for backward compatibility. If directlyObservedEdges is omitted,
   * directlyObservedEdges falls back to Math.max(0, verifiedEdges - inferredEdges).
   */
  readonly verifiedEdges?: number;
}

export interface ArchitectureNodeCardProps {
  readonly node: ArchitectureGraphNode;
  readonly isSelected?: boolean;
  readonly onClick?: () => void;
  readonly onKeyDown?: (e: React.KeyboardEvent) => void;
  readonly showRoleBadge?: boolean;
  readonly showTierBadge?: boolean;
  readonly compact?: boolean;
  readonly className?: string;
}

export interface DependencyConnectorProps {
  readonly edge: ArchitectureGraphEdge;
  readonly sourceName: string;
  readonly targetName: string;
}

export interface DependencyStackProps {
  readonly clusterId: number;
  readonly nodes: readonly ArchitectureGraphNode[];
  readonly edges: readonly ArchitectureGraphEdge[];
  readonly selectedNodeId?: string;
  readonly onSelectNode: (node: ArchitectureGraphNode) => void;
}

export interface UnverifiedAssociationsProps {
  readonly edges: readonly ArchitectureGraphEdge[];
  readonly nodesById: ReadonlyMap<string, ArchitectureGraphNode>;
  readonly onSelectNode?: (node: ArchitectureGraphNode) => void;
}

export interface IndependentTechSectionProps {
  readonly nodes: readonly ArchitectureGraphNode[];
  readonly selectedNodeId?: string;
  readonly onSelectNode: (node: ArchitectureGraphNode) => void;
}

export interface TechnologyDetailDrawerProps {
  readonly node: ArchitectureGraphNode;
  readonly graph: ArchitectureGraph;
  readonly onClose: () => void;
  readonly onSelectRelatedNode?: (nodeId: string) => void;
}
