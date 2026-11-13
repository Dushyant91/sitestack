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

export function exportToJson(scanResult: ScanResult): void {
  const jsonContent = JSON.stringify(scanResult, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const domainClean = scanResult.domain.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dateStr = new Date(scanResult.timestamp).toISOString().slice(0, 10);
  triggerDownload(blob, `sitestack-${domainClean}-${dateStr}.json`);
}

export function exportToCsv(scanResult: ScanResult): void {
  const headers = [
    'Technology',
    'Category',
    'Version',
    'Confidence Score',
    'Confidence Tier',
    'Detection Type',
    'Parent Dependency',
    'Evidence Summary',
    'Website',
  ];

  const escapeCsv = (str: string | undefined): string => {
    if (!str) return '""';
    const escaped = String(str).replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = scanResult.technologies.map((t) => {
    const evidenceSummary = t.evidence.map((e) => `${e.source} (${e.weight}pts)`).join('; ');
    return [
      escapeCsv(t.name),
      escapeCsv(t.category),
      escapeCsv(t.version || 'N/A'),
      escapeCsv(String(t.confidenceScore)),
      escapeCsv(t.confidenceTier.toUpperCase()),
      escapeCsv(t.detectionType === 'inferred' ? 'Inferred' : 'Direct'),
      escapeCsv(t.parentDependency || 'None'),
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
