import { VersionExtractor, HarvestedSignals, VersionMaturity } from './types';

/**
 * Standard semantic version regex: matches 1.2, 1.2.3, 1.2.3-alpha.1, 7.2-beta5-65440
 * Fully compliant with SemVer 2.0 prerelease identifiers and build metadata
 */
const SEMVER_REGEX = /(?:^|[^\d])v?([0-9]+(?:\.[0-9]+)+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)/i;

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
 * Cleans and standardizes extracted version string, preserving prerelease tags and tag IDs
 */
export function cleanVersion(rawVersion: string): string | undefined {
  if (!rawVersion || typeof rawVersion !== 'string') return undefined;

  const trimmed = rawVersion.trim();

  // 1. Tag Manager container IDs & Analytics Measurement IDs (e.g. GTM-XXXXXXX, G-XXXXXXXXXX)
  const tagIdMatch = trimmed.match(/^(G-[A-Z0-9]+|GTM-[A-Z0-9]+)$/i);
  if (tagIdMatch) {
    return tagIdMatch[1].toUpperCase();
  }

  // 2. Standard Semantic Version with optional prerelease (e.g. 7.2-beta5-65440, 18.3.1, 14.0.0-rc.2)
  const match = trimmed.match(SEMVER_REGEX);
  if (match && match[1]) {
    const cleaned = match[1].trim();
    // Validate that it contains at least one digit and a dot
    if (/^\d+(\.\d+)/.test(cleaned)) {
      return cleaned;
    }
  }

  // 3. Fallback: Direct clean semver
  const directMatch = trimmed.match(/^v?(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/);
  return directMatch ? directMatch[1] : undefined;
}

/**
 * Classifies the maturity of a detected software version string into:
 * - 'development': Unstable development builds, nightly releases, canaries, or commit snapshots (e.g. 11.4.0-dev.20261116, 1.0.0-nightly)
 * - 'prerelease': Feature-frozen pre-releases such as alphas, betas, release candidates, or preview builds (e.g. 14.0.0-rc.2, 18.3.1-beta.0)
 * - 'stable': Standard production release (e.g. 7.1.4, 18.3.1, 6.0)
 * - 'unknown': Non-semver identifiers, tracking tags (e.g. GTM-XXXX), or missing version strings
 */
export function classifyVersionMaturity(version?: string): VersionMaturity {
  if (!version || typeof version !== 'string') return 'unknown';

  const trimmed = version.trim();
  if (!trimmed) return 'unknown';

  // Tag Manager IDs or measurement IDs are not software release versions
  if (/^(?:G-[A-Z0-9]+|GTM-[A-Z0-9]+)$/i.test(trimmed)) {
    return 'unknown';
  }

  // Check for development indicators (dev, devel, canary, nightly, snapshot, git)
  if (/-(?:dev|devel|development|canary|nightly|snapshot|git)(?:[.-]|\d|$)/i.test(trimmed)) {
    return 'development';
  }

  // Check for prerelease indicators (alpha, beta, rc, preview, pre, next, ea)
  if (/-(?:alpha|beta|rc|preview|pre|next|ea)(?:[.-]|\d|$)/i.test(trimmed)) {
    return 'prerelease';
  }

  // Check for any other hyphen-delimited prerelease tag
  if (/-\w+/i.test(trimmed)) {
    return 'prerelease';
  }

  // Standard semantic version with digits and dots (optional build metadata with '+')
  if (/^\d+(?:\.\d+)+(?:\+[0-9A-Za-z.-]+)?$/.test(trimmed)) {
    return 'stable';
  }

  return 'unknown';
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
    // Pass 1: Try primary urlRegex (e.g. prioritized core runtime script)
    for (const url of signals.resources) {
      const match = url.match(extractor.fromResource.urlRegex);
      if (match) {
        const groupIndex = extractor.fromResource.captureGroup || 1;
        const captured = match[groupIndex] || match.slice(1).find((g) => Boolean(g));
        if (captured) {
          const cleaned = cleanVersion(captured);
          if (cleaned) return cleaned;
        }
      }
    }

    // Pass 2: Try optional fallbackUrlRegex (e.g. subpackage / secondary asset)
    if (extractor.fromResource.fallbackUrlRegex) {
      for (const url of signals.resources) {
        const match = url.match(extractor.fromResource.fallbackUrlRegex);
        if (match) {
          const captured = match.slice(1).find((g) => Boolean(g));
          if (captured) {
            const cleaned = cleanVersion(captured);
            if (cleaned) return cleaned;
          }
        }
      }
    }
  }

  return undefined;
}
