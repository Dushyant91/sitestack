import { ScanResult } from '../../engine/types';

const STORAGE_KEY_HISTORY = 'sitestack_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Normalizes URL or domain string to domain key
 */
export function getDomainKey(urlOrDomain: string): string {
  try {
    const url = new URL(urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`);
    return url.hostname.toLowerCase();
  } catch {
    return urlOrDomain.toLowerCase().trim();
  }
}

/**
 * Saves scan result to local Chrome storage with LRU limit
 */
export async function saveScanToStorage(scanResult: ScanResult): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

  const domain = getDomainKey(scanResult.domain || scanResult.url);

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    const history: Record<string, ScanResult> = data[STORAGE_KEY_HISTORY] || {};

    // Insert or update domain entry
    history[domain] = {
      ...scanResult,
      timestamp: scanResult.timestamp || Date.now(),
    };

    // Maintain LRU limit (delete oldest beyond MAX_HISTORY_ITEMS)
    const entries = Object.entries(history);
    if (entries.length > MAX_HISTORY_ITEMS) {
      entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
      const trimmed: Record<string, ScanResult> = {};
      for (let i = 0; i < MAX_HISTORY_ITEMS; i++) {
        trimmed[entries[i][0]] = entries[i][1];
      }
      await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: trimmed });
      return;
    }

    await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: history });
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to save scan result:', err);
  }
}

/**
 * Retrieves cached scan for a domain if scanned recently (e.g. within last 1 hour)
 */
export async function getCachedScan(
  urlOrDomain: string,
  maxAgeMs = 3600000
): Promise<ScanResult | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;

  const domain = getDomainKey(urlOrDomain);

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    const history: Record<string, ScanResult> = data[STORAGE_KEY_HISTORY] || {};
    const cached = history[domain];

    if (cached && Date.now() - cached.timestamp < maxAgeMs) {
      return cached;
    }
  } catch (err) {
    console.warn('[SiteStack Storage] Failed to read cached scan:', err);
  }

  return null;
}

/**
 * Retrieves full list of historical scans sorted by timestamp descending
 */
export async function getScanHistory(): Promise<ScanResult[]> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return [];

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    const history: Record<string, ScanResult> = data[STORAGE_KEY_HISTORY] || {};
    return Object.values(history).sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

/**
 * Clears all scan history
 */
export async function clearScanHistory(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  await chrome.storage.local.remove(STORAGE_KEY_HISTORY);
}
