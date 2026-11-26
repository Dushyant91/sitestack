/**
 * SiteStack Architecture Intelligence - Export Download & Sanitization Helpers
 * Location: src/canvas/export/download.ts
 */

import { ArchitectureExportFormat } from './export-types';

/**
 * Escapes unsafe XML/SVG characters in text nodes and attributes.
 */
export function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitizes a domain name for safe use in file systems across Windows, macOS, and Linux.
 */
export function sanitizeFilenamePart(name: string): string {
  if (!name || typeof name !== 'string') return 'unknown_host';
  const clean = name
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/[:/\\?*|"<>\s]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '');
  return clean || 'unknown_host';
}

/**
 * Generates standardized export filename:
 * e.g., sitestack-architecture-example_com-2026-11-24.svg
 */
export function generateArchitectureExportFilename(
  domain: string,
  format: ArchitectureExportFormat,
  timestamp?: number
): string {
  const rawClean = sanitizeFilenamePart(domain);
  const cleanDomain = rawClean.length > 64 ? rawClean.slice(0, 64) : rawClean;
  const dateStr = timestamp
    ? new Date(timestamp).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return `sitestack-architecture-${cleanDomain}-${dateStr}.${format}`;
}

/**
 * Triggers a native browser file download using a temporary object URL.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // Revoke object URL after a short timeout to ensure browser has started download stream
    setTimeout(() => {
      try {
        if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (e) {}
    }, 1000);
  }
}
