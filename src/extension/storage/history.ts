import { ScanResult, DetectedTechnology, SignalEvidence } from '../../engine/types';
import {
  normalizeScanUrl,
  sanitizeResourceUrl,
  sanitizeResourceEvidenceString,
} from '../../shared/url';
import { ScanSnapshot } from '../../../packages/contracts/src/types';

export { normalizeScanUrl, sanitizeResourceUrl, sanitizeResourceEvidenceString };

export const STORAGE_KEY_HISTORY = 'sitestack_history';
export const STORAGE_KEY_TAB_SCANS = 'sitestack_tab_scans';
export const MAX_HISTORY_ITEMS = 50;
export const RESCAN_DUPLICATE_THRESHOLD_MS = 60000; // 60 seconds debounce window for duplicate rescans

/**
 * Converts a canonical ScanSnapshot into a backward-compatible ScanResult for storage & popup
 */
export function snapshotToStoredRecord(snapshot: ScanSnapshot): ScanResult {
  const url = snapshot.target?.canonicalUrl || (snapshot.target?.domain ? `https://${snapshot.target.domain}` : 'unknown');
  const domain = snapshot.target?.domain || 'unknown';
  const timing = snapshot.timing || { engineDurationMs: 0 };
  const scanDurationMs = typeof timing.totalDurationMs === 'number'
    ? timing.totalDurationMs
    : timing.engineDurationMs;

  const technologies = (snapshot.technologies || []).map((t) => ({
    ...t,
    isInferred: Boolean(t.detectionType === 'inferred'),
    confidenceReason:
      t.confidenceReason || `${t.confidenceTier.toUpperCase()} confidence based on observed signals.`,
    evidence: (t.evidence || []).map((ev) => ({
      ...ev,
      source: sanitizeResourceEvidenceString(ev.source),
      matchedValue: ev.matchedValue ? sanitizeResourceUrl(ev.matchedValue) : undefined,
    })),
  }));

  return {
    id: snapshot.id,
    url,
    domain,
    timestamp: snapshot.timestamp,
    stats: snapshot.stats,
    scanDurationMs,
    engineEvaluationDurationMs: timing.engineDurationMs,
    technologies: technologies as any,
  };
}

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
    const rawStored = data[STORAGE_KEY_HISTORY];
    const normalized = normalizeStoredHistory(rawStored);

    // Persist sanitized records back to storage if migration/sanitization cleaned up legacy records
    if (rawStored && JSON.stringify(rawStored) !== JSON.stringify(normalized)) {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: normalized });
      } catch (migrateErr) {
        console.warn('[SiteStack Storage] Legacy migration writeback notice:', migrateErr);
      }
    }

    return normalized;
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

      // Invalidate any active session tab scan referencing this deleted item
      try {
        const sessionStore = getSessionStorageArea();
        const tabScans = await getTabScansMap();
        let modified = false;
        for (const tabKey in tabScans) {
          const entry = tabScans[tabKey];
          if (
            entry.scanId === idOrTimestamp ||
            String(entry.timestamp) === String(idOrTimestamp) ||
            (typeof idOrTimestamp === 'number' && entry.timestamp === idOrTimestamp) ||
            entry.result?.domain === idOrTimestamp
          ) {
            delete tabScans[tabKey];
            modified = true;
          }
        }
        if (modified) {
          await sessionStore.set({ [STORAGE_KEY_TAB_SCANS]: tabScans });
        }
      } catch (tabErr) {
        console.warn('[SiteStack Storage] Failed to prune tab scans on delete:', tabErr);
      }

      return true;
    }
    return false;
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to delete scan:', err);
    return false;
  }
}

/**
 * Removes obsolete local-storage tab association keys from earlier versions.
 */
export async function cleanupLegacyLocalTabScans(): Promise<void> {
  if (typeof chrome !== 'undefined' && typeof chrome.storage?.local?.remove === 'function') {
    try {
      await chrome.storage.local.remove(STORAGE_KEY_TAB_SCANS);
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Clears all scan history and active session tab scan associations
 */
export async function clearScanHistory(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  try {
    await chrome.storage.local.remove(STORAGE_KEY_HISTORY);
    try {
      const sessionStore = getSessionStorageArea();
      await sessionStore.remove(STORAGE_KEY_TAB_SCANS);
    } catch {
      // Ignore if tab scans key doesn't exist
    }
    await cleanupLegacyLocalTabScans();
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to clear history:', err);
  }
}

export interface TabScanEntry {
  url: string;
  scanId: string;
  result: ScanResult;
  timestamp: number;
}

/**
 * In-memory fallback map if chrome.storage.session is not available in mock/test runtimes.
 * Never persists to disk, ensuring browser restart isolation is strictly preserved.
 */
const inMemorySessionFallback: Record<string, unknown> = {};

/**
 * Helper to access chrome.storage.session or an in-memory session fallback.
 * Strictly prevents writing temporary tab associations to persistent local disk storage.
 */
export function getSessionStorageArea(): {
  get: (keys?: string | string[]) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
} {
  if (
    typeof chrome !== 'undefined' &&
    chrome.storage?.session &&
    typeof chrome.storage.session.get === 'function' &&
    typeof chrome.storage.session.set === 'function' &&
    typeof chrome.storage.session.remove === 'function'
  ) {
    return chrome.storage.session;
  }

  return {
    async get(keys?: string | string[]) {
      if (typeof keys === 'string') {
        return { [keys]: inMemorySessionFallback[keys] };
      }
      if (Array.isArray(keys)) {
        const res: Record<string, unknown> = {};
        for (const k of keys) res[k] = inMemorySessionFallback[k];
        return res;
      }
      return { ...inMemorySessionFallback };
    },
    async set(items: Record<string, unknown>) {
      for (const k in items) {
        inMemorySessionFallback[k] = items[k];
      }
    },
    async remove(keys: string | string[]) {
      if (typeof keys === 'string') {
        delete inMemorySessionFallback[keys];
      } else if (Array.isArray(keys)) {
        for (const k of keys) delete inMemorySessionFallback[k];
      }
    },
  };
}

/**
 * Retrieves the raw map of active tab scans from session storage
 */
export async function getTabScansMap(): Promise<Record<string, TabScanEntry>> {
  try {
    const sessionStore = getSessionStorageArea();
    const data = await sessionStore.get(STORAGE_KEY_TAB_SCANS);
    return (data && (data[STORAGE_KEY_TAB_SCANS] as Record<string, TabScanEntry>)) || {};
  } catch {
    return {};
  }
}

/**
 * Retrieves the scan result specifically associated with a browser tab for this session.
 * Validates that the tab's current URL matches the URL that was scanned,
 * and ensures the scan record still exists in persistent history.
 */
export async function getTabScan(
  tabId: number,
  currentUrl: string
): Promise<ScanResult | null> {
  if (!tabId) return null;

  try {
    const sessionStore = getSessionStorageArea();
    const tabScans = await getTabScansMap();
    const entry = tabScans[String(tabId)];
    if (!entry) return null;

    // Check if the tab's current URL matches the URL that was scanned
    const normalizedScanned = normalizeScanUrl(entry.url);
    const normalizedCurrent = normalizeScanUrl(currentUrl);

    if (normalizedScanned !== normalizedCurrent) {
      // Tab navigated to a new URL -> invalidate stale tab scan in session
      delete tabScans[String(tabId)];
      await sessionStore.set({ [STORAGE_KEY_TAB_SCANS]: tabScans });
      return null;
    }

    // Check if the scan record still exists in history (was not deleted)
    const history = await getScanHistory();
    const stillExists = history.some(
      (h) => (h.id && h.id === entry.scanId) || h.timestamp === entry.result?.timestamp
    );

    if (!stillExists) {
      delete tabScans[String(tabId)];
      await sessionStore.set({ [STORAGE_KEY_TAB_SCANS]: tabScans });
      return null;
    }

    return entry.result;
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to get tab scan:', err);
    return null;
  }
}

/**
 * Associates a completed scan result with an active browser tab and exact URL in session storage.
 */
export async function setTabScan(
  tabId: number,
  currentUrl: string,
  result: ScanResult
): Promise<void> {
  if (!tabId) return;

  try {
    const sessionStore = getSessionStorageArea();
    const tabScans = await getTabScansMap();
    tabScans[String(tabId)] = {
      url: normalizeScanUrl(currentUrl),
      scanId: result.id || `${result.domain}_${result.timestamp}` || 'unknown',
      result,
      timestamp: result.timestamp || Date.now(),
    };
    await sessionStore.set({ [STORAGE_KEY_TAB_SCANS]: tabScans });
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to set tab scan:', err);
  }
}

/**
 * Invalidates and removes the scan association for a specific tab from session storage.
 */
export async function invalidateTabScan(tabId: number): Promise<void> {
  if (!tabId) return;

  try {
    const sessionStore = getSessionStorageArea();
    const tabScans = await getTabScansMap();
    if (tabScans[String(tabId)]) {
      delete tabScans[String(tabId)];
      await sessionStore.set({ [STORAGE_KEY_TAB_SCANS]: tabScans });
    }
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to invalidate tab scan:', err);
  }
}

/**
 * Invalidates a tab's scan association if the tab's URL changed.
 */
export async function invalidateTabScanIfUrlChanged(
  tabId: number,
  newUrl: string
): Promise<void> {
  if (!tabId) return;

  try {
    const sessionStore = getSessionStorageArea();
    const tabScans = await getTabScansMap();
    const entry = tabScans[String(tabId)];
    if (entry) {
      if (normalizeScanUrl(entry.url) !== normalizeScanUrl(newUrl)) {
        delete tabScans[String(tabId)];
        await sessionStore.set({ [STORAGE_KEY_TAB_SCANS]: tabScans });
      }
    }
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to check URL change for tab scan:', err);
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
