/**
 * SiteStack Architecture Intelligence - Interactive 2D SVG Canvas
 * Location: src/canvas/components/CanvasGraph.tsx
 *
 * Renders full-screen interactive SVG architecture graph with:
 * - Deterministic vertical dependency stacks and independent trays.
 * - Smooth pan and zoom with mouse wheel and drag.
 * - Directional Bezier edge connectors with distinct evidence styling.
 * - Interactive node selection, hover focus, and adjacent highlighting.
 */

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  ArchitectureGraph,
  ArchitectureGraphNode,
} from '../../engine/architecture/graph/types';
import {
  CanvasViewport,
  CanvasFilterState,
  CANVAS_MIN_ZOOM,
  CANVAS_MAX_ZOOM,
} from '../types';
import { computeCanvasGraphLayout } from '../layout/canvas-layout';

export interface CanvasGraphProps {
  readonly graph: ArchitectureGraph;
  readonly filters: CanvasFilterState;
  readonly viewport: CanvasViewport;
  readonly onViewportChange: (viewport: CanvasViewport) => void;
  readonly selectedNodeId: string | null;
  readonly onSelectNode: (node: ArchitectureGraphNode | null) => void;
  readonly theme?: 'dark' | 'light';
}

export const CanvasGraph: React.FC<CanvasGraphProps> = ({
  graph,
  filters,
  viewport,
  onViewportChange,
  selectedNodeId,
  onSelectNode,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute 2D coordinates deterministically
  const layout = useMemo(
    () => computeCanvasGraphLayout(graph, filters),
    [graph, filters]
  );

  // Set of nodes adjacent to the currently selected node
  const activeFocusIds = useMemo(() => {
    const focusNodeId = selectedNodeId || hoveredNodeId;
    if (!focusNodeId) return null;

    const set = new Set<string>([focusNodeId]);
    for (const edge of graph.edges) {
      if (edge.sourceId === focusNodeId) set.add(edge.targetId);
      if (edge.targetId === focusNodeId) set.add(edge.sourceId);
    }
    return set;
  }, [selectedNodeId, hoveredNodeId, graph.edges]);

  // Pan interaction
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Pan only on primary button click on background
      if (e.button !== 0) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
    },
    [viewport.panX, viewport.panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      onViewportChange({
        ...viewport,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y,
      });
    },
    [isPanning, panStart, viewport, onViewportChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom interaction via mouse wheel centered at cursor
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(
        CANVAS_MAX_ZOOM,
        Math.max(CANVAS_MIN_ZOOM, viewport.zoom * zoomFactor)
      );

      // Adjust pan so the point under cursor remains invariant
      const newPanX = cursorX - ((cursorX - viewport.panX) / viewport.zoom) * newZoom;
      const newPanY = cursorY - ((cursorY - viewport.panY) / viewport.zoom) * newZoom;

      onViewportChange({
        panX: newPanX,
        panY: newPanY,
        zoom: newZoom,
      });
    },
    [viewport, onViewportChange]
  );

  // Fit to screen helper
  const fitToScreen = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const bb = layout.boundingBox;
    const padding = 80;
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    const scaleX = availableWidth / bb.width;
    const scaleY = availableHeight / bb.height;
    const fitZoom = Math.min(CANVAS_MAX_ZOOM, Math.max(CANVAS_MIN_ZOOM, Math.min(scaleX, scaleY, 1.0)));

    const newPanX = (rect.width - bb.width * fitZoom) / 2 - bb.minX * fitZoom;
    const newPanY = (rect.height - bb.height * fitZoom) / 2 - bb.minY * fitZoom;

    onViewportChange({
      panX: newPanX,
      panY: newPanY,
      zoom: fitZoom,
    });
  }, [layout.boundingBox, onViewportChange]);

  // Initial fit on mount
  useEffect(() => {
    fitToScreen();
  }, []); // Run once on initial layout

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onViewportChange({ ...viewport, zoom: Math.min(CANVAS_MAX_ZOOM, viewport.zoom * 1.15) });
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onViewportChange({ ...viewport, zoom: Math.max(CANVAS_MIN_ZOOM, viewport.zoom * 0.85) });
      } else if (e.key === '0') {
        e.preventDefault();
        onViewportChange({ ...viewport, panX: 0, panY: 0, zoom: 1.0 });
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        fitToScreen();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onViewportChange({ ...viewport, panX: viewport.panX + 50 });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onViewportChange({ ...viewport, panX: viewport.panX - 50 });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onViewportChange({ ...viewport, panY: viewport.panY + 50 });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onViewportChange({ ...viewport, panY: viewport.panY - 50 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewport, onViewportChange, fitToScreen]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`flex-1 relative overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-slate-50' : 'bg-[#07090e]'
      } ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      <svg
        className="w-full h-full select-none"
        style={{ pointerEvents: 'auto' }}
        aria-label="Interactive Architecture Canvas"
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="canvas-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke={isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.025)'} strokeWidth="1" />
          </pattern>

          {/* Directional Arrowheads */}
          <marker id="arrow-direct" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
          </marker>
          <marker id="arrow-inferred" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#8b5cf6" />
          </marker>
          <marker id="arrow-unverified" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
          </marker>

          {/* Selected glow filters */}
          <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={isLight ? '#4f46e5' : '#6366f1'} floodOpacity={isLight ? '0.3' : '0.4'} />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill={isLight ? '#f8fafc' : '#07090e'} />
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />

        {/* Dynamic Zoom & Pan Group */}
        <g transform={`translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`}>
          {/* 1. Cluster Container Boxes */}
          {layout.clusterLayouts.map((cluster) => (
            <g key={cluster.clusterId}>
              <rect
                x={cluster.x}
                y={cluster.y}
                width={cluster.width}
                height={cluster.height}
                rx={14}
                fill={isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.015)'}
                stroke={isLight ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)'}
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              <text
                x={cluster.x + 18}
                y={cluster.y + 26}
                fill={isLight ? '#4f46e5' : '#818cf8'}
                fontSize={12}
                fontWeight={600}
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.02em"
              >
                {cluster.title}
              </text>
            </g>
          ))}

          {/* Independent Technologies Tray Header */}
          {layout.independentLayouts.length > 0 && (
            <g>
              <text
                x={60}
                y={layout.independentLayouts[0].y - 20}
                fill={isLight ? '#64748b' : '#94a3b8'}
                fontSize={12}
                fontWeight={600}
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.04em"
              >
                OTHER DETECTED TECHNOLOGIES (INDEPENDENT)
              </text>
            </g>
          )}

          {/* 2. Directional Edges */}
          {layout.edgeLayouts.map((edgeLayout) => {
            const isDirect = edgeLayout.edge.evidenceState === 'directly_observed';
            const isInferred = edgeLayout.edge.evidenceState === 'inferred';
            const isUnverified = edgeLayout.edge.evidenceState === 'co_detected';

            const isEdgeFocused =
              activeFocusIds !== null &&
              activeFocusIds.has(edgeLayout.edge.sourceId) &&
              activeFocusIds.has(edgeLayout.edge.targetId);

            const isEdgeDimmed = activeFocusIds !== null && !isEdgeFocused;

            const strokeColor = isDirect ? '#10b981' : isInferred ? '#8b5cf6' : '#f59e0b';
            const markerId = isDirect ? 'url(#arrow-direct)' : isInferred ? 'url(#arrow-inferred)' : 'url(#arrow-unverified)';

            return (
              <g
                key={edgeLayout.edge.id}
                className="transition-opacity duration-200"
                style={{ opacity: isEdgeDimmed ? 0.2 : 1.0 }}
              >
                {/* Edge Path */}
                <path
                  d={edgeLayout.pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isEdgeFocused ? 3 : 2}
                  strokeDasharray={isInferred ? '6,5' : isUnverified ? '3,3' : 'none'}
                  markerEnd={markerId}
                />

                {/* Edge Midpoint Label Pill */}
                <g transform={`translate(${edgeLayout.labelX}, ${edgeLayout.labelY})`}>
                  <rect
                    x={-42}
                    y={-10}
                    width={84}
                    height={20}
                    rx={6}
                    fill="#0d1017"
                    stroke={strokeColor}
                    strokeWidth={1}
                    strokeOpacity={0.4}
                  />
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    fill={strokeColor}
                    fontSize={9}
                    fontFamily="ui-monospace, monospace"
                    fontWeight={600}
                  >
                    {edgeLayout.edge.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 3. Node Cards */}
          {Array.from(layout.nodeLayouts.values()).map((nodeLayout) => {
            const isSelected = selectedNodeId === nodeLayout.node.id;
            const isHovered = hoveredNodeId === nodeLayout.node.id;
            const isFocused = activeFocusIds !== null && activeFocusIds.has(nodeLayout.node.id);

            const q = (filters.searchQuery || '').toLowerCase().trim();
            const isSearchMatch =
              q.length === 0 ||
              nodeLayout.node.name.toLowerCase().includes(q) ||
              nodeLayout.node.category.toLowerCase().includes(q) ||
              nodeLayout.node.id.toLowerCase().includes(q);

            const isDimmed = (activeFocusIds !== null && !isFocused) || !isSearchMatch;

            const isDirect = nodeLayout.node.isDirect;
            const isInferred = nodeLayout.node.isInferred;

            const cardBorderColor = isSelected
              ? (isLight ? '#4f46e5' : '#6366f1')
              : isHovered
              ? (isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)')
              : (isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)');

            const cardBgColor = isSelected
              ? (isLight ? '#eef2ff' : '#141829')
              : (isLight ? '#ffffff' : '#0f121d');

            const badgeBg = nodeLayout.isStackFoundation
              ? (isLight ? '#e0e7ff' : '#312e81')
              : nodeLayout.isStackDependent
              ? (isLight ? '#f1f5f9' : '#1e293b')
              : (isLight ? '#f4f4f5' : '#18181b');

            const badgeColor = nodeLayout.isStackFoundation
              ? (isLight ? '#4338ca' : '#a5b4fc')
              : nodeLayout.isStackDependent
              ? (isLight ? '#475569' : '#94a3b8')
              : (isLight ? '#52525b' : '#a1a1aa');

            const statusText = nodeLayout.isStackFoundation
              ? 'FOUNDATION'
              : nodeLayout.isStackDependent
              ? `DEPENDENT (R${nodeLayout.node.topologicalRank})`
              : 'INDEPENDENT';

            return (
              <g
                key={nodeLayout.node.id}
                data-node-id={nodeLayout.node.id}
                transform={`translate(${nodeLayout.x}, ${nodeLayout.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(isSelected ? null : nodeLayout.node);
                }}
                onMouseEnter={() => setHoveredNodeId(nodeLayout.node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer transition-opacity duration-200"
                style={{ opacity: isDimmed ? 0.25 : 1.0 }}
                filter={isSelected ? 'url(#glow-selected)' : undefined}
                role="button"
                tabIndex={0}
                aria-label={`${nodeLayout.node.name}, ${nodeLayout.node.category}, confidence ${nodeLayout.node.confidenceScore}%`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNode(isSelected ? null : nodeLayout.node);
                  }
                }}
              >
                {/* Node Box */}
                <rect
                  width={nodeLayout.width}
                  height={nodeLayout.height}
                  rx={10}
                  fill={cardBgColor}
                  stroke={cardBorderColor}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Left Evidence Indicator Stripe */}
                <rect
                  x={0}
                  y={0}
                  width={4}
                  height={nodeLayout.height}
                  rx={2}
                  fill={isDirect ? '#10b981' : isInferred ? '#8b5cf6' : '#64748b'}
                />

                {/* Technology Icon / Initials */}
                <rect
                  x={12}
                  y={12}
                  width={28}
                  height={28}
                  rx={6}
                  fill={isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)'}
                  stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'}
                  strokeWidth={1}
                />
                <text
                  x={26}
                  y={30}
                  textAnchor="middle"
                  fill={isLight ? '#4f46e5' : '#818cf8'}
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="system-ui, sans-serif"
                >
                  {nodeLayout.node.name.slice(0, 2).toUpperCase()}
                </text>

                {/* Technology Name */}
                <text
                  x={48}
                  y={26}
                  fill={isLight ? '#0f172a' : '#ffffff'}
                  fontSize={12}
                  fontWeight={600}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {nodeLayout.node.name.length > 17
                    ? `${nodeLayout.node.name.slice(0, 15)}...`
                    : nodeLayout.node.name}
                </text>

                {/* Category & Version */}
                <text
                  x={48}
                  y={40}
                  fill={isLight ? '#64748b' : '#94a3b8'}
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                >
                  {(() => {
                    const text = `${nodeLayout.node.category}${nodeLayout.node.version ? ` · v${nodeLayout.node.version}` : ''}`;
                    return text.length > 22 ? `${text.slice(0, 20)}...` : text;
                  })()}
                </text>

                {/* Status Pill (Foundation / Dependent / Independent) */}
                <rect
                  x={12}
                  y={47}
                  width={nodeLayout.isStackDependent ? 104 : 84}
                  height={15}
                  rx={4}
                  fill={badgeBg}
                />
                <text
                  x={16}
                  y={58}
                  fill={badgeColor}
                  fontSize={8}
                  fontWeight={700}
                  fontFamily="ui-monospace, monospace"
                  letterSpacing="0.04em"
                >
                  {statusText}
                </text>

                {/* Confidence Pill */}
                <rect
                  x={nodeLayout.width - 44}
                  y={47}
                  width={34}
                  height={15}
                  rx={4}
                  fill={isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)'}
                  stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}
                  strokeWidth={1}
                />
                <text
                  x={nodeLayout.width - 27}
                  y={58}
                  textAnchor="middle"
                  fill={nodeLayout.node.confidenceScore >= 80 ? (isLight ? '#059669' : '#34d399') : (isLight ? '#d97706' : '#fbbf24')}
                  fontSize={9}
                  fontWeight={600}
                  fontFamily="ui-monospace, monospace"
                >
                  {nodeLayout.node.confidenceScore}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
