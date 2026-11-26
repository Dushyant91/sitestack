/**
 * SiteStack Architecture Intelligence - Standalone Vector SVG Serializer
 * Location: src/canvas/export/export-svg.ts
 *
 * Generates standards-compliant, standalone vector SVG documents that render
 * independently in Figma, Illustrator, Inkscape, or any web browser without
 * external fonts, CSS, or image dependencies.
 */

import { ArchitectureGraph } from '../../engine/architecture/graph/types';
import { CanvasGraphLayoutResult, CanvasNodeLayout, CanvasEdgeLayout } from '../types';
import { ArchitectureExportOptions } from './export-types';
import { escapeXml, triggerBlobDownload, generateArchitectureExportFilename } from './download';
import { normalizeScanUrl } from '../../shared/url';
import { SITESTACK_ICON_128_DATA_URI } from '../../shared/logo-assets';

export interface SvgExportPayload {
  readonly svgString: string;
  readonly width: number;
  readonly height: number;
  readonly filename: string;
}

/**
 * Serializes an ArchitectureGraph and its 2D CanvasLayout into a standalone SVG string.
 */
export function generateArchitectureSvg(
  graph: ArchitectureGraph,
  layout: CanvasGraphLayoutResult,
  options?: Partial<ArchitectureExportOptions>
): SvgExportPayload {
  const domain = graph.domain || 'unknown_host';
  const rawUrl = graph.url || `https://${domain}`;
  const sanitizedUrl = normalizeScanUrl(rawUrl);
  const timestamp = graph.timestamp || Date.now();
  const dateStr = new Date(timestamp).toLocaleString();
  const exportTimestamp = new Date().toISOString();

  // Calculate overall canvas dimensions including top banner and padding
  const headerHeight = 110;
  const footerHeight = 40;
  const paddingX = 40;
  const paddingBottom = 40;

  const bb = layout.boundingBox;
  const contentWidth = Math.max(900, bb.width);
  const contentHeight = Math.max(400, bb.height);

  const totalWidth = contentWidth + paddingX * 2;
  const totalHeight = headerHeight + contentHeight + footerHeight + paddingBottom;

  // Horizontal and vertical offsets to align layout content below header
  const offsetX = paddingX - bb.minX;
  const offsetY = headerHeight - bb.minY + 20;

  // Active nodes and edges from layout
  const activeNodes: CanvasNodeLayout[] = Array.from(layout.nodeLayouts.values());
  const activeEdges: CanvasEdgeLayout[] = [...layout.edgeLayouts];
  const isFilteredScope = options?.scope === 'filtered';

  // SVG Definitions and embedded styles (zero external dependencies)
  const defs = `
  <defs>
    <style>
      .ss-text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
      .ss-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      .ss-bold { font-weight: 700; }
      .ss-medium { font-weight: 600; }
    </style>

    <!-- Directional Arrowhead Markers -->
    <marker id="arrow-direct" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
    </marker>
    <marker id="arrow-inferred" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#8b5cf6" />
    </marker>
    <marker id="arrow-unverified" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
    </marker>

    <!-- Subtle Background Grid -->
    <pattern id="export-grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255, 255, 255, 0.025)" stroke-width="1" />
    </pattern>
  </defs>`;

  // 1. Header Metadata Banner
  const displayDomain = domain.length > 36 ? `${domain.slice(0, 33)}...` : domain;
  const dateOffsetX = 48 + Math.round(displayDomain.length * 8.2) + 16;

  const headerSvg = `
  <!-- ==================== HEADER BANNER ==================== -->
  <g transform="translate(40, 24)">
    <!-- SiteStack Official Canonical Brand Mark from public/icons/icon-128.png -->
    <image href="${SITESTACK_ICON_128_DATA_URI}" x="0" y="0" width="36" height="36" preserveAspectRatio="xMidYMid meet" />

    <!-- Title & Domain -->
    <text x="48" y="18" fill="#ffffff" font-size="16" class="ss-text ss-bold">
      ${escapeXml(options?.customTitle || 'SiteStack Architecture Intelligence')}${isFilteredScope ? ' (Filtered)' : ''}
    </text>
    <text x="48" y="34" fill="#a5b4fc" font-size="13" class="ss-mono ss-medium">
      ${escapeXml(displayDomain)}
    </text>
    <text x="${dateOffsetX}" y="34" fill="#94a3b8" font-size="11" class="ss-mono">
      · Scanned: ${escapeXml(dateStr)}
    </text>
    <!-- Scanned target: ${escapeXml(sanitizedUrl)} -->

    <!-- Metrics Summary Pills -->
    <g transform="translate(0, 52)">
      <!-- Total Nodes -->
      <rect x="0" y="0" width="100" height="22" rx="6" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <text x="50" y="15" text-anchor="middle" fill="#e2e8f0" font-size="11" class="ss-mono ss-medium">
        ${graph.metrics.totalNodes} Techs
      </text>

      <!-- Directly Observed Edges -->
      <rect x="110" y="0" width="90" height="22" rx="6" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" stroke-width="1" />
      <text x="155" y="15" text-anchor="middle" fill="#10b981" font-size="11" class="ss-mono ss-bold">
        ${graph.metrics.directlyObservedEdges} Direct
      </text>

      <!-- Inferred Edges -->
      <rect x="210" y="0" width="90" height="22" rx="6" fill="rgba(139, 92, 246, 0.1)" stroke="rgba(139, 92, 246, 0.3)" stroke-width="1" />
      <text x="255" y="15" text-anchor="middle" fill="#a78bfa" font-size="11" class="ss-mono ss-bold">
        ${graph.metrics.inferredEdges} Inferred
      </text>

      <!-- Unverified Co-Detections -->
      <rect x="310" y="0" width="110" height="22" rx="6" fill="rgba(245, 158, 11, 0.1)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1" />
      <text x="365" y="15" text-anchor="middle" fill="#f59e0b" font-size="11" class="ss-mono ss-bold">
        ${graph.metrics.coDetectionEdges} Unverified
      </text>
    </g>

    <!-- Evidence Legend -->
    <g transform="translate(${totalWidth - 360}, 52)">
      <line x1="0" y1="11" x2="20" y2="11" stroke="#10b981" stroke-width="2.5" />
      <text x="26" y="15" fill="#cbd5e1" font-size="10" class="ss-text ss-medium">Direct</text>

      <line x1="80" y1="11" x2="100" y2="11" stroke="#8b5cf6" stroke-width="2.5" stroke-dasharray="4,3" />
      <text x="106" y="15" fill="#cbd5e1" font-size="10" class="ss-text ss-medium">Inferred</text>

      <line x1="165" y1="11" x2="185" y2="11" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="2,2" />
      <text x="191" y="15" fill="#cbd5e1" font-size="10" class="ss-text ss-medium">Unverified</text>
    </g>

    <!-- Header Divider Line -->
    <line x1="0" y1="84" x2="${totalWidth - 80}" y2="84" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />
  </g>`;

  // 2. Clusters SVG
  let clustersSvg = '';
  for (const cluster of layout.clusterLayouts) {
    const cx = cluster.x + offsetX;
    const cy = cluster.y + offsetY;
    clustersSvg += `
    <g class="ss-cluster" id="cluster-${cluster.clusterId}">
      <rect x="${cx}" y="${cy}" width="${cluster.width}" height="${cluster.height}" rx="14"
            fill="rgba(255, 255, 255, 0.015)" stroke="rgba(99, 102, 241, 0.25)" stroke-width="1.5" stroke-dasharray="4,4" />
      <text x="${cx + 18}" y="${cy + 24}" fill="#818cf8" font-size="12" class="ss-text ss-bold" letter-spacing="0.02em">
        ${escapeXml(cluster.title)}
      </text>
    </g>`;
  }

  // 3. Independent Tray Label SVG
  let independentLabelSvg = '';
  if (layout.independentLayouts.length > 0) {
    const labelX = 60 + offsetX;
    const labelY = layout.independentLayouts[0].y + offsetY - 18;
    independentLabelSvg = `
    <text x="${labelX}" y="${labelY}" fill="#94a3b8" font-size="11" class="ss-text ss-bold" letter-spacing="0.04em">
      OTHER DETECTED TECHNOLOGIES (INDEPENDENT)
    </text>`;
  }

  // 4. Edges SVG
  let edgesSvg = '';
  for (const edgeLayout of activeEdges) {
    const isDirect = edgeLayout.edge.evidenceState === 'directly_observed';
    const isInferred = edgeLayout.edge.evidenceState === 'inferred';
    const strokeColor = isDirect ? '#10b981' : isInferred ? '#8b5cf6' : '#f59e0b';
    const markerUrl = isDirect ? 'url(#arrow-direct)' : isInferred ? 'url(#arrow-inferred)' : 'url(#arrow-unverified)';
    const dashArray = isInferred ? '6,5' : !isDirect ? '3,3' : 'none';

    // Shift coordinates by offset
    const shiftedStartX = edgeLayout.startX + offsetX;
    const shiftedStartY = edgeLayout.startY + offsetY;
    const shiftedEndX = edgeLayout.endX + offsetX;
    const shiftedEndY = edgeLayout.endY + offsetY;

    // Shift Bezier control points
    const isSameCluster = edgeLayout.sourceNode.dependencyClusterId > 0 &&
      edgeLayout.sourceNode.dependencyClusterId === edgeLayout.targetNode.dependencyClusterId;

    let pathD: string;
    if (isSameCluster) {
      const deltaY = Math.abs(shiftedEndY - shiftedStartY);
      const cy1 = shiftedStartY < shiftedEndY ? shiftedStartY + deltaY * 0.45 : shiftedStartY - deltaY * 0.45;
      const cy2 = shiftedStartY < shiftedEndY ? shiftedEndY - deltaY * 0.45 : shiftedEndY + deltaY * 0.45;
      pathD = `M ${shiftedStartX} ${shiftedStartY} C ${shiftedStartX} ${cy1}, ${shiftedEndX} ${cy2}, ${shiftedEndX} ${shiftedEndY}`;
    } else {
      const deltaX = Math.abs(shiftedEndX - shiftedStartX);
      const cx1 = shiftedStartX < shiftedEndX ? shiftedStartX + deltaX * 0.5 : shiftedStartX - deltaX * 0.5;
      const cx2 = shiftedStartX < shiftedEndX ? shiftedEndX - deltaX * 0.5 : shiftedEndX + deltaX * 0.5;
      pathD = `M ${shiftedStartX} ${shiftedStartY} C ${cx1} ${shiftedStartY}, ${cx2} ${shiftedEndY}, ${shiftedEndX} ${shiftedEndY}`;
    }

    const lx = edgeLayout.labelX + offsetX;
    const ly = edgeLayout.labelY + offsetY;
    const labelWidth = Math.max(50, edgeLayout.edge.label.length * 6.5 + 14);
    const safeEdgeId = edgeLayout.edge.id.replace(/[:>]/g, '-');

    edgesSvg += `
    <g class="ss-edge" id="edge-${escapeXml(safeEdgeId)}">
      <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2"
            stroke-dasharray="${dashArray}" marker-end="${markerUrl}" />
      <rect x="${lx - labelWidth / 2}" y="${ly - 9}" width="${labelWidth}" height="18" rx="4"
            fill="#0d0f17" stroke="${strokeColor}" stroke-width="1" />
      <text x="${lx}" y="${ly + 4}" text-anchor="middle" fill="${strokeColor}" font-size="9" class="ss-mono ss-bold">
        ${escapeXml(edgeLayout.edge.label)}
      </text>
    </g>`;
  }

  // 5. Nodes SVG
  let nodesSvg = '';
  for (const nodeLayout of activeNodes) {
    const nx = nodeLayout.x + offsetX;
    const ny = nodeLayout.y + offsetY;
    const node = nodeLayout.node;

    const isDirect = node.isDirect;
    const isInferred = node.isInferred;
    const stripeColor = isDirect ? '#10b981' : isInferred ? '#8b5cf6' : '#64748b';

    const initials = node.name.slice(0, 2).toUpperCase();
    const displayName = node.name.length > 17 ? `${node.name.slice(0, 15)}...` : node.name;

    const catVerRaw = `${node.category}${node.version ? ` · v${node.version}` : ''}`;
    const displayCatVer = catVerRaw.length > 22 ? `${catVerRaw.slice(0, 20)}...` : catVerRaw;

    const badgeBg = nodeLayout.isStackFoundation ? '#312e81' : nodeLayout.isStackDependent ? '#1e293b' : '#18181b';
    const badgeColor = nodeLayout.isStackFoundation ? '#a5b4fc' : nodeLayout.isStackDependent ? '#94a3b8' : '#a1a1aa';
    const statusText = nodeLayout.isStackFoundation
      ? 'FOUNDATION'
      : nodeLayout.isStackDependent
      ? `DEPENDENT (R${node.topologicalRank})`
      : 'INDEPENDENT';
    const statusWidth = nodeLayout.isStackDependent ? 104 : 84;

    nodesSvg += `
    <g class="ss-node" id="node-${escapeXml(node.id)}" transform="translate(${nx}, ${ny})">
      <!-- Node Card Background -->
      <rect width="${nodeLayout.width}" height="${nodeLayout.height}" rx="10"
            fill="#0f121d" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" />

      <!-- Left Evidence Stripe -->
      <rect x="0" y="0" width="4" height="${nodeLayout.height}" rx="2" fill="${stripeColor}" />

      <!-- Technology Initials Square -->
      <rect x="12" y="12" width="28" height="28" rx="6"
            fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <text x="26" y="30" text-anchor="middle" fill="#818cf8" font-size="11" class="ss-text ss-bold">
        ${escapeXml(initials)}
      </text>

      <!-- Technology Display Name -->
      <text x="48" y="26" fill="#ffffff" font-size="12" class="ss-text ss-bold">
        ${escapeXml(displayName)}
      </text>

      <!-- Category & Version -->
      <text x="48" y="40" fill="#94a3b8" font-size="10" class="ss-mono">
        ${escapeXml(displayCatVer)}
      </text>

      <!-- Stack Role Status Pill -->
      <rect x="12" y="47" width="${statusWidth}" height="15" rx="3" fill="${badgeBg}" />
      <text x="${12 + statusWidth / 2}" y="58" text-anchor="middle" fill="${badgeColor}" font-size="8" class="ss-mono ss-bold">
        ${escapeXml(statusText)}
      </text>

      <!-- Confidence Score -->
      <text x="188" y="58" text-anchor="end" fill="#ffffff" font-size="10" class="ss-mono ss-bold">
        ${node.confidenceScore}%
      </text>
    </g>`;
  }

  // 6. Zero-State Fallback if graph is empty
  let emptyStateSvg = '';
  if (activeNodes.length === 0) {
    emptyStateSvg = `
    <g transform="translate(${totalWidth / 2}, ${headerHeight + 100})">
      <rect x="-180" y="-40" width="360" height="80" rx="12" fill="#0f121d" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
      <text x="0" y="-5" text-anchor="middle" fill="#ffffff" font-size="14" class="ss-text ss-bold">
        Empty Architecture Graph
      </text>
      <text x="0" y="20" text-anchor="middle" fill="#94a3b8" font-size="12" class="ss-text">
        No detected technologies found in this website scan.
      </text>
    </g>`;
  }

  // 7. Footer
  const footerSvg = `
  <!-- ==================== FOOTER ==================== -->
  <g transform="translate(40, ${totalHeight - 20})">
    <text x="0" y="0" fill="#64748b" font-size="10" class="ss-mono">
      Generated by SiteStack Architecture Intelligence · Offline Local Verification · Exported ${escapeXml(exportTimestamp.slice(0, 19))}Z
    </text>
  </g>`;

  // Complete Well-Formed Standalone SVG XML Document
  const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${totalWidth}"
     height="${totalHeight}"
     viewBox="0 0 ${totalWidth} ${totalHeight}">
  ${defs}
  <!-- Base Background -->
  <rect width="100%" height="100%" fill="#07090e" />
  <rect width="100%" height="100%" fill="url(#export-grid)" />

  ${headerSvg}
  ${clustersSvg}
  ${independentLabelSvg}
  ${edgesSvg}
  ${nodesSvg}
  ${emptyStateSvg}
  ${footerSvg}
</svg>`;

  const filename = generateArchitectureExportFilename(domain, 'svg', timestamp);

  return {
    svgString,
    width: totalWidth,
    height: totalHeight,
    filename,
  };
}

/**
 * Triggers a direct vector SVG export download in the browser.
 */
export function exportArchitectureToSvg(
  graph: ArchitectureGraph,
  layout: CanvasGraphLayoutResult,
  options?: Partial<ArchitectureExportOptions>
): SvgExportPayload {
  const result = generateArchitectureSvg(graph, layout, options);
  const blob = new Blob([result.svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerBlobDownload(blob, result.filename);
  return result;
}
