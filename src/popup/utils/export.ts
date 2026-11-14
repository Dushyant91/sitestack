import { ScanResult } from '../../engine/types';
import { normalizeScanUrl } from '../../extension/storage/history';

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function escapeCsv(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '""';
  const escaped = String(str).replace(/"/g, '""');
  return `"${escaped}"`;
}

export interface ExportRecordJson {
  technology: string;
  category: string;
  version: string | null;
  confidenceScore: number;
  confidenceTier: string;
  detectionType: 'direct' | 'inferred';
  parentDependency: string | null;
  confidenceReason: string | null;
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

export interface MultiScanExportPayload {
  exportedAt: string;
  totalScans: number;
  scans: StandardExportPayload[];
}

/**
 * Formats a single scan result into standard structured JSON payload
 */
export function formatExportJson(scanResult: ScanResult): StandardExportPayload {
  return {
    url: normalizeScanUrl(scanResult.url),
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
      confidenceReason: t.confidenceReason || null,
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

/**
 * Downloads a single scan result as structured JSON
 */
export function exportToJson(scanResult: ScanResult): void {
  const structuredData = formatExportJson(scanResult);
  const jsonContent = JSON.stringify(structuredData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const domainClean = scanResult.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dateStr = new Date(scanResult.timestamp).toISOString().slice(0, 10);
  triggerDownload(blob, `sitestack-${domainClean}-${dateStr}.json`);
}

/**
 * Formats a single scan result into a standard CSV string
 */
export function formatExportCsv(scanResult: ScanResult): string {
  const headers = [
    'technology',
    'category',
    'version',
    'confidenceScore',
    'confidenceTier',
    'detectionType',
    'parentDependency',
    'confidenceReason',
    'evidenceSummary',
    'website',
  ];

  const rows = scanResult.technologies.map((t) => {
    const rawSummary = t.evidence
      .map((e) => {
        const val = e.matchedValue && e.matchedValue !== 'present' ? ` [${e.matchedValue}]` : '';
        return `${e.source}${val} (${e.weight}pts)`;
      })
      .join('; ');
    const evidenceSummary = rawSummary.length > 250 ? rawSummary.slice(0, 247) + '...' : rawSummary;
    return [
      escapeCsv(t.name),
      escapeCsv(t.category),
      escapeCsv(t.version || ''),
      escapeCsv(t.confidenceScore),
      escapeCsv(t.confidenceTier),
      escapeCsv(t.detectionType),
      escapeCsv(t.parentDependency || ''),
      escapeCsv(t.confidenceReason || ''),
      escapeCsv(evidenceSummary),
      escapeCsv(t.website),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Downloads a single scan result as clean CSV spreadsheet
 */
export function exportToCsv(scanResult: ScanResult): void {
  const csvContent = formatExportCsv(scanResult);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const domainClean = scanResult.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dateStr = new Date(scanResult.timestamp).toISOString().slice(0, 10);
  triggerDownload(blob, `sitestack-${domainClean}-${dateStr}.csv`);
}

/**
 * Formats multiple historical scan results into combined multi-scan JSON payload
 */
export function formatMultiScanExportJson(scanResults: ScanResult[]): MultiScanExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    totalScans: scanResults.length,
    scans: scanResults.map((s) => formatExportJson(s)),
  };
}

/**
 * Downloads multiple selected historical scans as combined JSON
 */
export function exportMultiScanToJson(scanResults: ScanResult[], customFilename?: string): void {
  const structuredData = formatMultiScanExportJson(scanResults);
  const jsonContent = JSON.stringify(structuredData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, customFilename || `sitestack-history-export-${dateStr}.json`);
}

/**
 * Formats multiple historical scan results into a combined multi-scan CSV string
 * Includes website domain, scan date, and URL as leading columns for easy spreadsheet filtering
 */
export function formatMultiScanExportCsv(scanResults: ScanResult[]): string {
  const headers = [
    'domain',
    'scanDate',
    'url',
    'technology',
    'category',
    'version',
    'confidenceScore',
    'confidenceTier',
    'detectionType',
    'parentDependency',
    'confidenceReason',
    'evidenceSummary',
    'website',
  ];

  const rows: string[] = [];
  for (const scan of scanResults) {
    const scanDate = new Date(scan.timestamp).toISOString();
    for (const t of scan.technologies) {
      const rawSummary = t.evidence
        .map((e) => {
          const val = e.matchedValue && e.matchedValue !== 'present' ? ` [${e.matchedValue}]` : '';
          return `${e.source}${val} (${e.weight}pts)`;
        })
        .join('; ');
      const evidenceSummary = rawSummary.length > 250 ? rawSummary.slice(0, 247) + '...' : rawSummary;
      rows.push(
        [
          escapeCsv(scan.domain),
          escapeCsv(scanDate),
          escapeCsv(normalizeScanUrl(scan.url)),
          escapeCsv(t.name),
          escapeCsv(t.category),
          escapeCsv(t.version || ''),
          escapeCsv(t.confidenceScore),
          escapeCsv(t.confidenceTier),
          escapeCsv(t.detectionType),
          escapeCsv(t.parentDependency || ''),
          escapeCsv(t.confidenceReason || ''),
          escapeCsv(evidenceSummary),
          escapeCsv(t.website),
        ].join(',')
      );
    }
  }

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Downloads multiple historical scans as combined multi-scan CSV spreadsheet
 */
export function exportMultiScanToCsv(scanResults: ScanResult[], customFilename?: string): void {
  const csvContent = formatMultiScanExportCsv(scanResults);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, customFilename || `sitestack-history-export-${dateStr}.csv`);
}
