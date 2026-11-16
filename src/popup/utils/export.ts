import { ScanResult, VersionMaturity } from '../../engine/types';
import {
  normalizeScanUrl,
  sanitizeResourceUrl,
  sanitizeResourceEvidenceString,
} from '../../shared/url';

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
  scannedWebsite: string;
  technology: string;
  category: string;
  version: string | null;
  /** Optional version maturity classification ('stable' | 'prerelease' | 'development' | 'unknown') */
  versionMaturity?: VersionMaturity | null;
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
  /** Canonical reference URL for the detected technology vendor or project */
  technologyWebsite: string;
  /** @deprecated Backward-compatible alias for technologyWebsite */
  website: string;
}

export interface StandardExportPayload {
  scannedWebsite: string;
  url: string;
  /** @deprecated Backward-compatible alias for scannedWebsite */
  domain: string;
  timestamp: number;
  /**
   * Synchronous detection engine evaluation latency in milliseconds (pure CPU time spent evaluating rules and scoring).
   * Does not include browser tab querying, probe script injection, or storage persistence.
   */
  engineEvaluationDurationMs: number;
  /**
   * @deprecated Backward-compatible alias for engineEvaluationDurationMs.
   * Pure synchronous rule-engine evaluation time in milliseconds.
   */
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
  const scannedDomain = scanResult.domain;
  const evalDuration = typeof scanResult.engineEvaluationDurationMs === 'number'
    ? scanResult.engineEvaluationDurationMs
    : scanResult.scanDurationMs;
  return {
    scannedWebsite: scannedDomain,
    url: normalizeScanUrl(scanResult.url),
    domain: scannedDomain,
    timestamp: scanResult.timestamp,
    engineEvaluationDurationMs: evalDuration,
    scanDurationMs: evalDuration,
    technologies: scanResult.technologies.map((t) => ({
      scannedWebsite: scannedDomain,
      technology: t.name,
      category: t.category,
      version: t.version || null,
      versionMaturity: t.versionMaturity || null,
      confidenceScore: t.confidenceScore,
      confidenceTier: t.confidenceTier,
      detectionType: t.detectionType,
      parentDependency: t.parentDependency || null,
      confidenceReason: t.confidenceReason || null,
      evidenceSummary: t.evidence.map((e) => ({
        type: e.type,
        source: e.type === 'resource' ? sanitizeResourceEvidenceString(e.source) : e.source,
        weight: e.weight,
        matchedValue: e.type === 'resource' && e.matchedValue
          ? sanitizeResourceUrl(e.matchedValue)
          : e.matchedValue,
      })),
      technologyWebsite: t.website,
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
    'scannedWebsite',
    'technology',
    'category',
    'version',
    'confidenceScore',
    'confidenceTier',
    'detectionType',
    'parentDependency',
    'confidenceReason',
    'evidenceSummary',
    'technologyWebsite',
  ];

  const rows = scanResult.technologies.map((t) => {
    const rawSummary = t.evidence
      .map((e) => {
        const cleanSource = e.type === 'resource' ? sanitizeResourceEvidenceString(e.source) : e.source;
        const cleanVal = e.type === 'resource' && e.matchedValue
          ? sanitizeResourceUrl(e.matchedValue)
          : e.matchedValue;
        const val = cleanVal && cleanVal !== 'present' ? ` [${cleanVal}]` : '';
        return `${cleanSource}${val} (${e.weight}pts)`;
      })
      .join('; ');
    const evidenceSummary = rawSummary.length > 250 ? rawSummary.slice(0, 247) + '...' : rawSummary;
    return [
      escapeCsv(scanResult.domain),
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
    'scannedWebsite',
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
    'technologyWebsite',
  ];

  const rows: string[] = [];
  for (const scan of scanResults) {
    const scanDate = new Date(scan.timestamp).toISOString();
    const normalizedUrl = normalizeScanUrl(scan.url);

    if (scan.technologies.length === 0) {
      // For a scan with zero technologies, emit one CSV row containing
      // scannedWebsite, scanDate, url, and 10 empty technology fields (13 columns total).
      rows.push(
        [
          escapeCsv(scan.domain),
          escapeCsv(scanDate),
          escapeCsv(normalizedUrl),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
          escapeCsv(''),
        ].join(',')
      );
    } else {
      for (const t of scan.technologies) {
        const rawSummary = t.evidence
          .map((e) => {
            const cleanSource = e.type === 'resource' ? sanitizeResourceEvidenceString(e.source) : e.source;
            const cleanVal = e.type === 'resource' && e.matchedValue
              ? sanitizeResourceUrl(e.matchedValue)
              : e.matchedValue;
            const val = cleanVal && cleanVal !== 'present' ? ` [${cleanVal}]` : '';
            return `${cleanSource}${val} (${e.weight}pts)`;
          })
          .join('; ');
        const evidenceSummary = rawSummary.length > 250 ? rawSummary.slice(0, 247) + '...' : rawSummary;
        rows.push(
          [
            escapeCsv(scan.domain),
            escapeCsv(scanDate),
            escapeCsv(normalizedUrl),
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
