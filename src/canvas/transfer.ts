/**
 * SiteStack Architecture Intelligence - Active Scan Transfer Protocol
 * Location: src/canvas/transfer.ts
 *
 * Implements bounded, isolated transfer of scan results between the extension popup
 * and dedicated full-screen Architecture Canvas tabs.
 *
 * STRICT INVARIANTS:
 * 1. Each canvas launch receives a unique cryptographically random launchId.
 * 2. Never uses a single unqualified global storage key (prevents tab collisions).
 * 3. Records have strict TTL expiration (default 15 minutes) and bounded total count.
 * 4. Payloads are strictly validated before hydration.
 * 5. Does NOT make network requests or inspect host websites.
 */

import { ScanResult, DetectedTechnology } from '../engine/types';

export const CANVAS_TRANSFER_PREFIX = 'sitestack_canvas_transfer_';
export const CANVAS_TRANSFER_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
export const MAX_STORED_LAUNCH_RECORDS = 20;

export interface CanvasTransferPayload {
  readonly schemaVersion: '1.0.0';
  readonly launchId: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly url: string;
  readonly domain: string;
  readonly scanTimestamp: number;
  readonly technologies: readonly DetectedTechnology[];
  readonly stats: ScanResult['stats'];
}

/**
 * Generate a cryptographically strong unique launch ID.
 */
export function generateLaunchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `launch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validate that an unknown object adheres to the CanvasTransferPayload contract.
 */
export function validateCanvasTransferPayload(data: unknown): CanvasTransferPayload | null {
  if (!data || typeof data !== 'object') return null;

  const candidate = data as Partial<CanvasTransferPayload>;

  if (candidate.schemaVersion !== '1.0.0') return null;
  if (!candidate.launchId || typeof candidate.launchId !== 'string') return null;
  if (typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt)) return null;
  if (typeof candidate.expiresAt !== 'number' || !Number.isFinite(candidate.expiresAt)) return null;
  if (typeof candidate.url !== 'string' || candidate.url.trim().length === 0) return null;
  if (typeof candidate.domain !== 'string' || candidate.domain.trim().length === 0) return null;
  if (typeof candidate.scanTimestamp !== 'number' || !Number.isFinite(candidate.scanTimestamp)) return null;
  if (!Array.isArray(candidate.technologies)) return null;
  if (!candidate.stats || typeof candidate.stats !== 'object') return null;

  return candidate as CanvasTransferPayload;
}

/**
 * Prune expired or excessive canvas launch records from chrome.storage.local.
 */
export async function pruneExpiredLaunchRecords(): Promise<number> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return 0;
  }

  return new Promise<number>((resolve) => {
    chrome.storage.local.get(null, (allData) => {
      if (chrome.runtime?.lastError || !allData) {
        resolve(0);
        return;
      }

      const now = Date.now();
      const transferKeys: { key: string; createdAt: number; expiresAt: number }[] = [];
      const keysToRemove: string[] = [];

      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith(CANVAS_TRANSFER_PREFIX)) {
          const validated = validateCanvasTransferPayload(value);
          if (!validated || validated.expiresAt <= now) {
            keysToRemove.push(key);
          } else {
            transferKeys.push({
              key,
              createdAt: validated.createdAt,
              expiresAt: validated.expiresAt,
            });
          }
        }
      }

      // If active records exceed bound, drop the oldest records
      if (transferKeys.length > MAX_STORED_LAUNCH_RECORDS) {
        transferKeys.sort((a, b) => a.createdAt - b.createdAt);
        const excessCount = transferKeys.length - MAX_STORED_LAUNCH_RECORDS;
        for (let i = 0; i < excessCount; i++) {
          keysToRemove.push(transferKeys[i].key);
        }
      }

      if (keysToRemove.length === 0) {
        resolve(0);
        return;
      }

      chrome.storage.local.remove(keysToRemove, () => {
        resolve(keysToRemove.length);
      });
    });
  });
}

/**
 * Package and store an active scan result for canvas launch in chrome.storage.local.
 * Returns the unique launchId to append as a URL parameter.
 */
export async function createCanvasLaunchRecord(scanResult: ScanResult): Promise<string> {
  if (!scanResult || !Array.isArray(scanResult.technologies)) {
    throw new Error('Invalid ScanResult provided for canvas launch');
  }

  // Prune any expired records in background
  pruneExpiredLaunchRecords().catch(() => {});

  const launchId = generateLaunchId();
  const now = Date.now();

  const payload: CanvasTransferPayload = {
    schemaVersion: '1.0.0',
    launchId,
    createdAt: now,
    expiresAt: now + CANVAS_TRANSFER_TTL_MS,
    url: scanResult.url,
    domain: scanResult.domain,
    scanTimestamp: scanResult.timestamp,
    technologies: scanResult.technologies,
    stats: scanResult.stats,
  };

  const key = `${CANVAS_TRANSFER_PREFIX}${launchId}`;

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ [key]: payload }, () => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  } else {
    // Fallback for non-extension environments (mock/test/local preview)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(payload));
    }
  }

  return launchId;
}

/**
 * Retrieve and validate a canvas launch record by its launchId.
 */
export async function getCanvasLaunchRecord(launchId: string): Promise<CanvasTransferPayload | null> {
  if (!launchId || typeof launchId !== 'string') return null;

  const key = `${CANVAS_TRANSFER_PREFIX}${launchId}`;

  let rawData: unknown = null;

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    rawData = await new Promise<unknown>((resolve) => {
      chrome.storage.local.get([key], (items) => {
        if (chrome.runtime?.lastError || !items) {
          resolve(null);
        } else {
          resolve(items[key] || null);
        }
      });
    });
  } else if (typeof sessionStorage !== 'undefined') {
    const item = sessionStorage.getItem(key);
    if (item) {
      try {
        rawData = JSON.parse(item);
      } catch {
        rawData = null;
      }
    }
  }

  const payload = validateCanvasTransferPayload(rawData);
  if (!payload) return null;

  // Check TTL expiration
  if (Date.now() > payload.expiresAt) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove([key], () => {});
    }
    return null;
  }

  return payload;
}

/**
 * Optional fallback: retrieve the most recent scan from extension history.
 */
export async function getFallbackHistoryScan(targetDomain?: string): Promise<ScanResult | null> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return null;
  }

  return new Promise<ScanResult | null>((resolve) => {
    chrome.storage.local.get(['sitestack_history'], (items) => {
      if (chrome.runtime?.lastError || !items || !Array.isArray(items.sitestack_history)) {
        resolve(null);
        return;
      }

      const history = items.sitestack_history as ScanResult[];
      if (history.length === 0) {
        resolve(null);
        return;
      }

      if (targetDomain) {
        const match = history.find(
          (s) => s.domain?.toLowerCase() === targetDomain.toLowerCase()
        );
        if (match) {
          resolve(match);
          return;
        }
        // If a specific targetDomain was requested but not found in history,
        // do NOT substitute an arbitrary different domain.
        resolve(null);
        return;
      }

      // Return most recent overall only if no targetDomain was specified
      resolve(history[0] || null);
    });
  });
}
