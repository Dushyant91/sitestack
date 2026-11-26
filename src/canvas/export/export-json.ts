/**
 * SiteStack Architecture Intelligence - Versioned JSON Architecture Serializer
 * Location: src/canvas/export/export-json.ts
 *
 * Exports strongly-typed, schema-versioned architecture graph payloads with
 * strict evidence classification, inference provenance, and URL sanitization.
 */

import { ArchitectureGraph } from '../../engine/architecture/graph/types';
import { ScanResult } from '../../engine/types';
import {
  ArchitectureJsonExport,
  ArchitectureExportNode,
  ArchitectureExportEdge,
  ArchitectureExportOptions,
} from './export-types';
import { normalizeScanUrl, sanitizeResourceUrl, sanitizeResourceEvidenceString } from '../../shared/url';
import { triggerBlobDownload, generateArchitectureExportFilename } from './download';

/**
 * Formats an ArchitectureGraph and optional ScanResult into a versioned JSON architecture payload.
 */
export function formatArchitectureJson(
  graph: ArchitectureGraph,
  scanResult?: ScanResult | null
): ArchitectureJsonExport {
  const domain = graph.domain || scanResult?.domain || 'unknown_host';
  const rawUrl = graph.url || scanResult?.url || `https://${domain}`;
  const sanitizedUrl = normalizeScanUrl(rawUrl);
  const timestamp = graph.timestamp || scanResult?.timestamp || Date.now();

  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const scanTechById = new Map((scanResult?.technologies || []).map((t) => [t.id, t]));

  // 1. Technologies Array
  const technologies: ArchitectureExportNode[] = graph.nodes.map((node) => {
    const scanTech = scanTechById.get(node.id);
    const isStackFoundation = node.dependencyClusterId > 0 && node.topologicalRank === 0;
    const isStackDependent = node.dependencyClusterId > 0 && node.topologicalRank > 0;
    const isIndependent = node.isDependencyIsolated;

    // Sanitize node evidence to prevent secret/query parameter leakage
    const evidenceDetails = (scanTech?.evidence || []).map((ev) => {
      const isUrlOrQuery = ev.source && (ev.source.includes('?') || ev.source.includes('http'));
      return {
        type: ev.type,
        source: isUrlOrQuery ? sanitizeResourceEvidenceString(ev.source) : ev.source,
        weight: ev.weight,
      };
    });

    const parentDep =
      scanTech?.parentDependency ||
      node.inferredProvenance?.sourceTechnologyName ||
      node.inferredProvenance?.sourceTechnologyId;

    const rawSummary = node.evidenceSummary || scanTech?.confidenceReason;
    const cleanSummary =
      rawSummary && (rawSummary.includes('?') || rawSummary.includes('http'))
        ? sanitizeResourceEvidenceString(rawSummary)
        : rawSummary;

    return {
      id: node.id,
      name: node.name,
      category: node.category,
      version: node.version,
      versionMaturity: node.versionMaturity || scanTech?.versionMaturity,
      confidenceScore: node.confidenceScore,
      confidenceTier: node.confidenceTier,
      detectionType: node.detectionType,
      semanticRoles: node.roles || [],
      primaryRole: node.primaryRole,
      topologicalRank: node.topologicalRank,
      dependencyClusterId: node.dependencyClusterId,
      isStackFoundation,
      isStackDependent,
      isIndependent,
      parentDependency: parentDep,
      inferredProvenance: node.inferredProvenance,
      website: node.website || scanTech?.website,
      description: node.description || scanTech?.description,
      evidenceSummary: cleanSummary,
      evidenceDetails: evidenceDetails.length > 0 ? evidenceDetails : undefined,
    };
  });

  // 2. Active Relationships Array (Excludes catalog_only edges)
  const relationships: ArchitectureExportEdge[] = graph.edges
    .filter((edge) => edge.evidenceState !== 'catalog_only')
    .map((edge) => {
      const sourceNode = nodesById.get(edge.sourceId);
      const targetNode = nodesById.get(edge.targetId);

      // Sanitize supporting evidence string if it references resource URLs
      let cleanSupportingEvidence = edge.supportingEvidence;
      if (cleanSupportingEvidence && cleanSupportingEvidence.includes('http')) {
        cleanSupportingEvidence = sanitizeResourceUrl(cleanSupportingEvidence);
      }

      return {
        id: edge.id,
        sourceId: edge.sourceId,
        sourceName: sourceNode?.name || edge.sourceId,
        targetId: edge.targetId,
        targetName: targetNode?.name || edge.targetId,
        relationshipType: edge.relationshipType,
        classification: edge.classification,
        evidenceState: edge.evidenceState,
        isVerified: edge.isVerified,
        isInferred: edge.isInferred,
        isCoDetection: edge.isCoDetection,
        label: edge.label,
        explanation: edge.explanation,
        supportingEvidence: cleanSupportingEvidence,
      };
    });

  // 3. Scan Metadata
  const scanMetadata = {
    stats: scanResult?.stats || {
      total: graph.nodes.length,
      high: graph.nodes.filter((n) => n.confidenceTier === 'high').length,
      medium: graph.nodes.filter((n) => n.confidenceTier === 'medium').length,
      low: graph.nodes.filter((n) => n.confidenceTier === 'low').length,
    },
  };

  // 4. Evidence Summary Counts
  const evidenceSummary = {
    directlyObservedEdges: graph.metrics.directlyObservedEdges,
    inferredEdges: graph.metrics.inferredEdges,
    coDetectionEdges: graph.metrics.coDetectionEdges,
    totalDependencies: graph.metrics.totalDependencies,
    connectedComponents: graph.metrics.connectedComponents,
    maxTopologicalDepth: graph.metrics.maxTopologicalDepth,
  };

  return {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    generator: 'SiteStack Architecture Intelligence v1.1.1',
    site: {
      domain,
      url: sanitizedUrl,
      scanTimestamp: timestamp,
    },
    scanMetadata,
    graphMetrics: graph.metrics,
    technologies,
    relationships,
    evidenceSummary,
  };
}

/**
 * Downloads the complete Architecture Graph as a structured JSON file.
 */
export function exportArchitectureToJson(
  graph: ArchitectureGraph,
  scanResult?: ScanResult | null,
  _options?: Partial<ArchitectureExportOptions>
): ArchitectureJsonExport {
  const jsonPayload = formatArchitectureJson(graph, scanResult);
  const jsonString = JSON.stringify(jsonPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

  const domain = graph.domain || scanResult?.domain || 'unknown_host';
  const timestamp = graph.timestamp || scanResult?.timestamp || Date.now();
  const filename = generateArchitectureExportFilename(domain, 'json', timestamp);

  triggerBlobDownload(blob, filename);

  return jsonPayload;
}
