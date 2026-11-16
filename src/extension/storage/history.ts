import { ScanResult, DetectedTechnology, SignalEvidence } from '../../engine/types';
import {
  normalizeScanUrl,
  sanitizeResourceUrl,
  sanitizeResourceEvidenceString,
} from '../../shared/url';

export { normalizeScanUrl, sanitizeResourceUrl, sanitizeResourceEvidenceString };

export const STORAGE_KEY_HISTORY = 'sitestack_history';
export const MAX_HISTORY_ITEMS = 50;
export const RESCAN_DUPLICATE_THRESHOLD_MS = 60000; // 60 seconds debounce window for duplicate rescans

/**
 * Normalizes URL or domain string to a clean lowercased domain key
 */
export function getDomainKey(urlOrDomain: string): string {
  if (!urlOrDomain || typeof urlOrDomain !== 'string') return 'unknown';
  try {
    const url = new URL(urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`);
    return url.hostname.toLowerCase();
  } catch {
    return urlOrDomain.toLowerCase().trim();
  }
}

/**
 * Validates and safely sanitizes a scan record to guard against corrupted or older schema records
 */
export function sanitizeScanResult(raw: unknown): ScanResult | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;

  const rawUrl = typeof candidate.url === 'string' && candidate.url.trim() ? candidate.url.trim() : '';
  const rawDomain = typeof candidate.domain === 'string' && candidate.domain.trim() ? candidate.domain.trim() : '';

  if (!rawUrl && !rawDomain) return null;

  const domain = rawDomain ? getDomainKey(rawDomain) : getDomainKey(rawUrl);
  const normalizedUrl = normalizeScanUrl(rawUrl);
  const url = normalizedUrl || `https://${domain}`;

  if (!domain || domain === 'unknown') return null;

  const timestamp = typeof candidate.timestamp === 'number' && candidate.timestamp > 0
    ? candidate.timestamp
    : Date.now();

  const engineEvaluationDurationMs = typeof candidate.engineEvaluationDurationMs === 'number'
    ? candidate.engineEvaluationDurationMs
    : (typeof candidate.scanDurationMs === 'number' ? candidate.scanDurationMs : 0);
  const scanDurationMs = engineEvaluationDurationMs;

  // Validate technologies array
  const rawTechs = Array.isArray(candidate.technologies) ? candidate.technologies : [];
  const technologies: DetectedTechnology[] = [];

  for (const item of rawTechs) {
    if (item && typeof item === 'object') {
      const t = item as Record<string, unknown>;
      if (typeof t.id === 'string' && typeof t.name === 'string') {
        technologies.push({
          id: t.id,
          name: t.name,
          category: (typeof t.category === 'string' ? t.category : 'library') as DetectedTechnology['category'],
          version: typeof t.version === 'string' ? t.version : undefined,
          versionMaturity: typeof t.versionMaturity === 'string'
            ? (t.versionMaturity as DetectedTechnology['versionMaturity'])
            : undefined,
          confidenceScore: typeof t.confidenceScore === 'number' ? t.confidenceScore : 50,
          confidenceTier: (['high', 'medium', 'low'].includes(t.confidenceTier as string)
            ? t.confidenceTier
            : 'medium') as DetectedTechnology['confidenceTier'],
          detectionType: t.detectionType === 'inferred' ? 'inferred' : 'direct',
          parentDependency: typeof t.parentDependency === 'string' ? t.parentDependency : undefined,
          dependentTechnologies: Array.isArray(t.dependentTechnologies)
            ? (t.dependentTechnologies as string[])
            : undefined,
          confidenceReason: typeof t.confidenceReason === 'string' ? t.confidenceReason : undefined,
          isInferred: Boolean(t.isInferred || t.detectionType === 'inferred'),
          evidence: (Array.isArray(t.evidence) ? (t.evidence as SignalEvidence[]) : []).map((ev) => {
            if (ev && typeof ev === 'object' && ev.type === 'resource') {
              return {
                ...ev,
                source: sanitizeResourceEvidenceString(ev.source),
                matchedValue: ev.matchedValue ? sanitizeResourceUrl(ev.matchedValue) : undefined,
              };
            }
            return ev;
          }),
          website: typeof t.website === 'string' ? t.website : '',
          icon: typeof t.icon === 'string' ? t.icon : '',
          description: typeof t.description === 'string' ? t.description : '',
        });
      }
    }
  }

  // Calculate or validate stats
  const rawStats = candidate.stats as Record<string, unknown> | undefined;
  const high = typeof rawStats?.high === 'number'
    ? rawStats.high
    : technologies.filter((t) => t.confidenceTier === 'high').length;
  const medium = typeof rawStats?.medium === 'number'
    ? rawStats.medium
    : technologies.filter((t) => t.confidenceTier === 'medium').length;
  const low = typeof rawStats?.low === 'number'
    ? rawStats.low
    : technologies.filter((t) => t.confidenceTier === 'low').length;

  const id = typeof candidate.id === 'string' && candidate.id
    ? candidate.id
    : `${domain}_${timestamp}`;

  return {
    id,
    url: url || `https://${domain}`,
    domain,
    timestamp,
    engineEvaluationDurationMs,
    scanDurationMs,
    technologies,
    stats: {
      total: technologies.length,
      high,
      medium,
      low,
    },
  };
}

/**
 * Safely parses and normalizes stored history, supporting both array format and legacy record map
 */
export function normalizeStoredHistory(raw: unknown): ScanResult[] {
  if (!raw) return [];

  let candidates: unknown[] = [];
  if (Array.isArray(raw)) {
    candidates = raw;
  } else if (typeof raw === 'object') {
    candidates = Object.values(raw as Record<string, unknown>);
  }

  const results: ScanResult[] = [];
  for (const c of candidates) {
    const sanitized = sanitizeScanResult(c);
    if (sanitized) {
      results.push(sanitized);
    }
  }

  // Sort descending by timestamp (latest scans first)
  results.sort((a, b) => b.timestamp - a.timestamp);
  return results;
}

/**
 * Retrieves the full list of historical scans sorted by timestamp descending
 */
export async function getScanHistory(): Promise<ScanResult[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return [];

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    return normalizeStoredHistory(data[STORAGE_KEY_HISTORY]);
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to retrieve history:', err);
    return [];
  }
}

/**
 * Saves a completed scan result to local Chrome storage.
 * - Prevents duplicate history entries caused by repeated clicks or accidental rescans within 60s
 * - Places latest scans first
 * - Enforces LRU storage limit (MAX_HISTORY_ITEMS)
 * - Recovers gracefully from storage quota exceptions by pruning older entries
 */
export async function saveScanToStorage(scanResult: ScanResult): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

  const sanitized = sanitizeScanResult(scanResult);
  if (!sanitized) return;

  try {
    const existing = await getScanHistory();

    const targetDomainKey = getDomainKey(sanitized.domain || sanitized.url);

    // Check for duplicate recent scan (same domain within RESCAN_DUPLICATE_THRESHOLD_MS or identical tech list)
    const duplicateIndex = existing.findIndex((entry) => {
      if (getDomainKey(entry.domain || entry.url) !== targetDomainKey) return false;
      const timeDiff = Math.abs(sanitized.timestamp - entry.timestamp);
      if (timeDiff < RESCAN_DUPLICATE_THRESHOLD_MS) return true;

      // Check if tech fingerprint is identical
      if (entry.technologies.length === sanitized.technologies.length) {
        const entryIds = entry.technologies.map((t) => `${t.id}:${t.version || ''}`).sort().join(',');
        const newIds = sanitized.technologies.map((t) => `${t.id}:${t.version || ''}`).sort().join(',');
        if (entryIds === newIds && timeDiff < 300000) {
          return true; // Identical results within 5 minutes
        }
      }
      return false;
    });

    let updatedList: ScanResult[];

    if (duplicateIndex >= 0) {
      // Update existing entry with latest timestamp and scanDurationMs, moving it to the top
      const updatedEntry: ScanResult = {
        ...existing[duplicateIndex],
        ...sanitized,
        id: existing[duplicateIndex].id || sanitized.id,
        timestamp: sanitized.timestamp, // Keep freshest timestamp
      };

      updatedList = [
        updatedEntry,
        ...existing.slice(0, duplicateIndex),
        ...existing.slice(duplicateIndex + 1),
      ];
    } else {
      // Prepend fresh scan to top
      updatedList = [sanitized, ...existing];
    }

    // Maintain max history bounds
    if (updatedList.length > MAX_HISTORY_ITEMS) {
      updatedList = updatedList.slice(0, MAX_HISTORY_ITEMS);
    }

    try {
      await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: updatedList });
    } catch (setErr) {
      // Storage quota limit fallback: prune 50% oldest entries and retry
      console.warn('[SiteStack Storage] Storage set failed, attempting recovery prune:', setErr);
      const pruned = updatedList.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
      await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: pruned });
    }
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to save scan result:', err);
  }
}

/**
 * Deletes a single scan from history by ID or timestamp
 */
export async function deleteScanFromHistory(idOrTimestamp: string | number): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return false;

  try {
    const existing = await getScanHistory();
    const initialLen = existing.length;

    const filtered = existing.filter((item) => {
      if (typeof idOrTimestamp === 'number') {
        return item.timestamp !== idOrTimestamp;
      }
      return item.id !== idOrTimestamp && String(item.timestamp) !== idOrTimestamp && item.domain !== idOrTimestamp;
    });

    if (filtered.length !== initialLen) {
      await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: filtered });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to delete scan:', err);
    return false;
  }
}

/**
 * Clears all scan history
 */
export async function clearScanHistory(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  try {
    await chrome.storage.local.remove(STORAGE_KEY_HISTORY);
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to clear history:', err);
  }
}

/**
 * Retrieves cached scan for a domain if scanned recently (e.g. within maxAgeMs)
 */
export async function getCachedScan(
  urlOrDomain: string,
  maxAgeMs = 3600000
): Promise<ScanResult | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;

  const targetDomainKey = getDomainKey(urlOrDomain);

  try {
    const existing = await getScanHistory();
    const matched = existing.find(
      (entry) => getDomainKey(entry.domain || entry.url) === targetDomainKey
    );

    if (matched && Date.now() - matched.timestamp < maxAgeMs) {
      return matched;
    }
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to read cached scan:', err);
  }

  return null;
}
