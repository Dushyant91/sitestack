import { ScanResult } from '../../engine/types';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportRecordJson {
  technology: string;
  category: string;
  version: string | null;
  confidenceScore: number;
  confidenceTier: string;
  detectionType: 'direct' | 'inferred';
  parentDependency: string | null;
  evidenceSummary: Array<{
    type: string;
    source: string;
    weight: number;
    matchedValue?: string;
  }>;
  website: string;
}

export interface StandardExportPayload {
  url: string;
  domain: string;
  timestamp: number;
  scanDurationMs: number;
  technologies: ExportRecordJson[];
}

export function formatExportJson(scanResult: ScanResult): StandardExportPayload {
  return {
    url: scanResult.url,
    domain: scanResult.domain,
    timestamp: scanResult.timestamp,
    scanDurationMs: scanResult.scanDurationMs,
    technologies: scanResult.technologies.map((t) => ({
      technology: t.name,
      category: t.category,
      version: t.version || null,
      confidenceScore: t.confidenceScore,
      confidenceTier: t.confidenceTier,
      detectionType: t.detectionType,
      parentDependency: t.parentDependency || null,
      evidenceSummary: t.evidence.map((e) => ({
        type: e.type,
        source: e.source,
        weight: e.weight,
        matchedValue: e.matchedValue,
      })),
      website: t.website,
    })),
  };
}

export function exportToJson(scanResult: ScanResult): void {
  const structuredData = formatExportJson(scanResult);
  const jsonContent = JSON.stringify(structuredData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const domainClean = scanResult.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dateStr = new Date(scanResult.timestamp).toISOString().slice(0, 10);
  triggerDownload(blob, `sitestack-${domainClean}-${dateStr}.json`);
}

export function exportToCsv(scanResult: ScanResult): void {
  const headers = [
    'technology',
    'category',
    'version',
    'confidenceScore',
    'confidenceTier',
    'detectionType',
    'parentDependency',
    'evidenceSummary',
    'website',
  ];

  const escapeCsv = (str: string | number | undefined | null): string => {
    if (str === undefined || str === null) return '""';
    const escaped = String(str).replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = scanResult.technologies.map((t) => {
    const evidenceSummary = t.evidence.map((e) => `${e.source} (${e.weight}pts)`).join('; ');
    return [
      escapeCsv(t.name),
      escapeCsv(t.category),
      escapeCsv(t.version || ''),
      escapeCsv(t.confidenceScore),
      escapeCsv(t.confidenceTier),
      escapeCsv(t.detectionType),
      escapeCsv(t.parentDependency || ''),
      escapeCsv(evidenceSummary),
      escapeCsv(t.website),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const domainClean = scanResult.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dateStr = new Date(scanResult.timestamp).toISOString().slice(0, 10);
  triggerDownload(blob, `sitestack-${domainClean}-${dateStr}.csv`);
}
