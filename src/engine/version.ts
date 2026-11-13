import { VersionExtractor, HarvestedSignals } from './types';

/**
 * Standard semantic version regex: matches 1.2, 1.2.3, 1.2.3-alpha.1
 */
const SEMVER_REGEX = /(?:^|[^\d])v?([0-9]+(?:\.[0-9]+)+(?:-[a-zA-Z0-9.]+)?)/i;

/**
 * Safely traverses an object path like 'next.version' or 'jQuery.fn.jquery'
 */
export function getNestedProperty(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;

  // Clean path: strip leading 'window.' if provided
  const normalizedPath = path.startsWith('window.') ? path.slice(7) : path;
  const parts = normalizedPath.split('.');

  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Cleans and standardizes extracted version string
 */
export function cleanVersion(rawVersion: string): string | undefined {
  if (!rawVersion || typeof rawVersion !== 'string') return undefined;

  const match = rawVersion.match(SEMVER_REGEX);
  if (match && match[1]) {
    const cleaned = match[1].trim();
    // Validate that it contains at least one digit and a dot
    if (/^\d+(\.\d+)/.test(cleaned)) {
      return cleaned;
    }
  }

  // Fallback: If it's already a clean semver like '14.2.3'
  const directMatch = rawVersion.trim().match(/^v?(\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?)$/);
  return directMatch ? directMatch[1] : undefined;
}

/**
 * Extracts version for a technology rule based on harvested signals
 */
export function extractVersion(
  extractor: VersionExtractor | undefined,
  signals: HarvestedSignals
): string | undefined {
  if (!extractor) return undefined;

  // 1. Try extracting from Global Window object
  if (extractor.fromGlobal) {
    const val = getNestedProperty(signals.globals, extractor.fromGlobal);
    if (typeof val === 'string' || typeof val === 'number') {
      const cleaned = cleanVersion(String(val));
      if (cleaned) return cleaned;
    }
  }

  // 2. Try extracting from Meta tags (search all matching meta tags)
  if (extractor.fromMeta) {
    const matchingMetas = signals.meta.filter(
      (m) => m.name?.toLowerCase() === extractor.fromMeta?.name.toLowerCase()
    );
    for (const targetMeta of matchingMetas) {
      if (targetMeta.content) {
        const match = targetMeta.content.match(extractor.fromMeta.regex);
        if (match && match[1]) {
          const cleaned = cleanVersion(match[1]);
          if (cleaned) return cleaned;
        }
      }
    }
  }

  // 3. Try extracting from DOM elements
  if (extractor.fromDom) {
    const targetEl = signals.dom.find(
      (el) => el.selector === extractor.fromDom?.selector && el.attribute === extractor.fromDom?.attribute
    );
    if (targetEl && targetEl.value) {
      const match = targetEl.value.match(extractor.fromDom.regex);
      if (match && match[1]) {
        const cleaned = cleanVersion(match[1]);
        if (cleaned) return cleaned;
      }
    }
  }

  // 4. Try extracting from Resource URLs
  if (extractor.fromResource) {
    for (const url of signals.resources) {
      const match = url.match(extractor.fromResource.urlRegex);
      if (match) {
        const groupIndex = extractor.fromResource.captureGroup || 1;
        if (match[groupIndex]) {
          const cleaned = cleanVersion(match[groupIndex]);
          if (cleaned) return cleaned;
        }
      }
    }
  }

  return undefined;
}
