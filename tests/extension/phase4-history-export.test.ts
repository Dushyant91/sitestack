import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveScanToStorage,
  getScanHistory,
  deleteScanFromHistory,
  clearScanHistory,
  getCachedScan,
  normalizeStoredHistory,
  sanitizeScanResult,
  MAX_HISTORY_ITEMS,
} from '../../src/extension/storage/history';
import {
  formatExportJson,
  formatExportCsv,
  formatMultiScanExportJson,
  formatMultiScanExportCsv,
} from '../../src/popup/utils/export';
import { ScanResult } from '../../src/engine/types';
import { evaluateSignals } from '../../src/engine/evaluator';

// In-memory mock storage for chrome.storage.local
const mockStorage: Record<string, unknown> = {};

beforeEach(() => {
  for (const k in mockStorage) {
    delete mockStorage[k];
  }

  // Set up chrome.storage.local mock
  (globalThis as unknown as Record<string, unknown>).chrome = {
    storage: {
      local: {
        get: vi.fn(async (keys?: unknown) => {
          if (typeof keys === 'string') {
            return { [keys]: mockStorage[keys] };
          }
          if (Array.isArray(keys)) {
            const res: Record<string, unknown> = {};
            for (const k of keys) res[k] = mockStorage[k];
            return res;
          }
          return { ...mockStorage };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const k in items) {
            mockStorage[k] = items[k];
          }
        }),
        remove: vi.fn(async (keys: unknown) => {
          if (typeof keys === 'string') {
            delete mockStorage[keys];
          } else if (Array.isArray(keys)) {
            for (const k of keys) delete mockStorage[k];
          }
        }),
      },
    },
  };
});

function createMockScan(domain: string, timestamp: number, totalTechs = 2): ScanResult {
  return {
    id: `${domain}_${timestamp}`,
    url: `https://${domain}/`,
    domain,
    timestamp,
    scanDurationMs: 1.25,
    stats: { total: totalTechs, high: 1, medium: 1, low: 0 },
    technologies: [
      {
        id: 'nextjs',
        name: 'Next.js',
        category: 'framework',
        version: '14.2.3',
        confidenceScore: 100,
        confidenceTier: 'high',
        detectionType: 'direct',
        confidenceReason: 'High confidence (Direct): Corroborated across 3 independent signal classes.',
        isInferred: false,
        evidence: [{ type: 'global', source: 'window.__next_f', weight: 55 }],
        website: 'https://nextjs.org',
        icon: '/tech-icons/frameworks/nextjs.svg',
        description: 'React Framework',
      },
      {
        id: 'react',
        name: 'React',
        category: 'library',
        confidenceScore: 75,
        confidenceTier: 'medium',
        detectionType: 'inferred',
        parentDependency: 'Next.js',
        confidenceReason: 'Architectural dependency: Inferred with medium confidence (75 pts).',
        isInferred: true,
        evidence: [{ type: 'inferred', source: 'Architectural dependency of Next.js', weight: 75 }],
        website: 'https://react.dev',
        icon: '/tech-icons/frameworks/react.svg',
        description: 'UI Library',
      },
    ],
  };
}

describe('Phase 4: Local Scan History & Advanced Export UI Suite', () => {
  // 1. Creation and Retrieval
  it('1. History Creation & Retrieval: Successfully saves and retrieves full scan result with all metadata', async () => {
    const scan = createMockScan('vercel.com', 1700000000000);
    await saveScanToStorage(scan);

    const history = await getScanHistory();
    expect(history.length).toBe(1);

    const retrieved = history[0];
    expect(retrieved.domain).toBe('vercel.com');
    expect(retrieved.url).toBe('https://vercel.com/');
    expect(retrieved.timestamp).toBe(1700000000000);
    expect(retrieved.technologies.length).toBe(2);

    // Verify evidence, versions, confidence tier, and reasons are preserved
    expect(retrieved.technologies[0].name).toBe('Next.js');
    expect(retrieved.technologies[0].version).toBe('14.2.3');
    expect(retrieved.technologies[0].confidenceScore).toBe(100);
    expect(retrieved.technologies[0].confidenceReason).toContain('High confidence');
    expect(retrieved.technologies[1].name).toBe('React');
    expect(retrieved.technologies[1].detectionType).toBe('inferred');
    expect(retrieved.technologies[1].parentDependency).toBe('Next.js');
  });

  // 2. Sorting: Latest scans first
  it('2. History Sorting: Always presents most recent scans first', async () => {
    const scanOld = createMockScan('old-site.com', 1000);
    const scanMid = createMockScan('mid-site.com', 2000);
    const scanNew = createMockScan('new-site.com', 3000);

    // Save in arbitrary order
    await saveScanToStorage(scanOld);
    await saveScanToStorage(scanNew);
    await saveScanToStorage(scanMid);

    const history = await getScanHistory();
    expect(history.length).toBe(3);
    expect(history[0].domain).toBe('new-site.com');
    expect(history[1].domain).toBe('mid-site.com');
    expect(history[2].domain).toBe('old-site.com');
  });

  // 3. Rescan & Accidental Duplicate Prevention
  it('3. Duplicate Prevention: Repeated clicks or accidental rescans update existing entry rather than duplicating', async () => {
    const baseTime = 1700000000000;
    const initialScan = createMockScan('github.com', baseTime);
    await saveScanToStorage(initialScan);

    expect((await getScanHistory()).length).toBe(1);

    // User clicks rescan 4 seconds later
    const quickRescan = createMockScan('github.com', baseTime + 4000);
    await saveScanToStorage(quickRescan);

    const afterRescan = await getScanHistory();
    // Must NOT have 2 duplicate entries for github.com
    expect(afterRescan.length).toBe(1);
    expect(afterRescan[0].domain).toBe('github.com');
    expect(afterRescan[0].timestamp).toBe(baseTime + 4000);

    // Different domain should cleanly create a second entry
    const differentSite = createMockScan('gitlab.com', baseTime + 8000);
    await saveScanToStorage(differentSite);

    const afterDiff = await getScanHistory();
    expect(afterDiff.length).toBe(2);
    expect(afterDiff[0].domain).toBe('gitlab.com');
    expect(afterDiff[1].domain).toBe('github.com');
  });

  // 4. Individual Deletion
  it('4. Individual Deletion: Removes targeted scan without affecting other records', async () => {
    const scanA = createMockScan('site-a.com', 1000);
    const scanB = createMockScan('site-b.com', 2000);
    const scanC = createMockScan('site-c.com', 3000);

    await saveScanToStorage(scanA);
    await saveScanToStorage(scanB);
    await saveScanToStorage(scanC);

    expect((await getScanHistory()).length).toBe(3);

    // Delete Site B by its ID
    const deleted = await deleteScanFromHistory(scanB.id!);
    expect(deleted).toBe(true);

    const remaining = await getScanHistory();
    expect(remaining.length).toBe(2);
    expect(remaining.some((s) => s.domain === 'site-b.com')).toBe(false);
    expect(remaining[0].domain).toBe('site-c.com');
    expect(remaining[1].domain).toBe('site-a.com');
  });

  // 5. Clear All History
  it('5. Clear All: Completely empties local history', async () => {
    await saveScanToStorage(createMockScan('site-1.com', 1000));
    await saveScanToStorage(createMockScan('site-2.com', 2000));

    expect((await getScanHistory()).length).toBe(2);

    await clearScanHistory();
    const history = await getScanHistory();
    expect(history).toEqual([]);
  });

  // 6. LRU Trimming and Storage Failure Recovery
  it('6. Storage Limits & Recovery: Enforces LRU max bounds and recovers from quota exceptions', async () => {
    // Fill storage past MAX_HISTORY_ITEMS
    for (let i = 1; i <= MAX_HISTORY_ITEMS + 10; i++) {
      await saveScanToStorage(createMockScan(`sub-${i}.com`, 1000 + i));
    }

    const history = await getScanHistory();
    expect(history.length).toBe(MAX_HISTORY_ITEMS);
    // Most recent should be at index 0
    expect(history[0].domain).toBe(`sub-${MAX_HISTORY_ITEMS + 10}.com`);

    // Storage failure simulation: mock chrome.storage.local.set throwing QUOTA_EXCEEDED
    let attempts = 0;
    (chrome.storage.local as unknown as Record<string, unknown>).set = vi.fn(async (items: Record<string, unknown>) => {
      attempts++;
      if (attempts === 1) {
        throw new Error('QUOTA_BYTES quota exceeded');
      }
      mockStorage['sitestack_history'] = items['sitestack_history'];
    });

    // Should catch the quota error, prune older records, and recover without throwing
    const newScan = createMockScan('recovery-site.com', 99999);
    await expect(saveScanToStorage(newScan)).resolves.not.toThrow();
    expect(attempts).toBe(2); // Retried after pruning
  });

  // 7. Corrupted & Legacy Stored Records Handling
  it('7. Schema Resilience: Safely handles corrupted, null, and legacy object formats', () => {
    // Legacy format from earlier v1 iterations: keyed by domain instead of array
    const legacyStorageFormat = {
      'legacy1.com': createMockScan('legacy1.com', 5000),
      'legacy2.com': createMockScan('legacy2.com', 6000),
    };

    const normalizedLegacy = normalizeStoredHistory(legacyStorageFormat);
    expect(normalizedLegacy.length).toBe(2);
    expect(normalizedLegacy[0].domain).toBe('legacy2.com');
    expect(normalizedLegacy[1].domain).toBe('legacy1.com');

    // Corrupted entries
    const corruptedData = [
      null,
      undefined,
      'just a string',
      { missing: 'everything' },
      { url: 'https://valid-corrupt.com', timestamp: 1234, technologies: 'not-an-array' },
      createMockScan('pure-valid.com', 8000),
    ];

    const normalizedCorrupt = normalizeStoredHistory(corruptedData);
    expect(normalizedCorrupt.length).toBe(2); // valid-corrupt (with sanitized tech array) and pure-valid
    expect(normalizedCorrupt[0].domain).toBe('pure-valid.com');

    // Test sanitizeScanResult directly
    expect(sanitizeScanResult(null)).toBeNull();
    expect(sanitizeScanResult(123)).toBeNull();
  });

  // 8. Advanced Export: Single Scan JSON & CSV
  it('8. Single Scan Export: Generates complete structured JSON and clean spreadsheet CSV', () => {
    const scan = createMockScan('shopify-store.com', 1700000000000);

    // JSON export payload verification
    const jsonPayload = formatExportJson(scan);
    expect(jsonPayload.domain).toBe('shopify-store.com');
    expect(jsonPayload.url).toBe('https://shopify-store.com/');
    expect(jsonPayload.technologies.length).toBe(2);
    expect(jsonPayload.technologies[0].technology).toBe('Next.js');
    expect(jsonPayload.technologies[0].confidenceReason).toBeTruthy();
    expect(jsonPayload.technologies[1].parentDependency).toBe('Next.js');

    // CSV string format verification
    const csvString = formatExportCsv(scan);
    const lines = csvString.split('\r\n');
    expect(lines.length).toBe(3); // 1 header + 2 technologies

    expect(lines[0]).toBe(
      'technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,website'
    );
    expect(lines[1]).toContain('"Next.js"');
    expect(lines[1]).toContain('"14.2.3"');
    expect(lines[1]).toContain('"100"');
    expect(lines[2]).toContain('"React"');
    expect(lines[2]).toContain('"inferred"');
  });

  // 9. Advanced Export: Multi-Scan JSON & CSV
  it('9. Multi-Scan Export: Generates aggregated multi-scan JSON and multi-site spreadsheet CSV', () => {
    const scan1 = createMockScan('site-one.com', 1700000000000);
    const scan2 = createMockScan('site-two.com', 1700005000000);

    // Multi-scan JSON
    const multiJson = formatMultiScanExportJson([scan1, scan2]);
    expect(multiJson.totalScans).toBe(2);
    expect(multiJson.exportedAt).toBeTruthy();
    expect(multiJson.scans.length).toBe(2);
    expect(multiJson.scans[0].domain).toBe('site-one.com');
    expect(multiJson.scans[1].domain).toBe('site-two.com');

    // Multi-scan CSV (includes domain, scanDate, url leading columns)
    const multiCsv = formatMultiScanExportCsv([scan1, scan2]);
    const lines = multiCsv.split('\r\n');
    expect(lines[0]).toBe(
      'domain,scanDate,url,technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,website'
    );
    expect(lines.length).toBe(5); // 1 header + 2 techs for scan1 + 2 techs for scan2
    expect(lines[1]).toContain('"site-one.com"');
    expect(lines[3]).toContain('"site-two.com"');
  });

  // 10. Cached Scan Retrieval
  it('10. Cache Retrieval: getCachedScan respects age threshold', async () => {
    const now = Date.now();
    const freshScan = createMockScan('fresh.com', now - 10000); // 10s old
    const expiredScan = createMockScan('expired.com', now - 7200000); // 2 hours old

    await saveScanToStorage(freshScan);
    await saveScanToStorage(expiredScan);

    // Fresh scan should be returned within 1 hour cache
    const freshCached = await getCachedScan('fresh.com', 3600000);
    expect(freshCached).toBeDefined();
    expect(freshCached?.domain).toBe('fresh.com');

    // Expired scan should return null
    const expiredCached = await getCachedScan('expired.com', 3600000);
    expect(expiredCached).toBeNull();
  });

  // 11. Scoring & Confidence Integrity Boundary Check
  it('11. Scoring Engine Integrity: Detection engine scores and calibration remain strictly untouched', () => {
    // Verify that Phase 4 introduced zero changes to detection rules or scoring thresholds
    const nextSite = evaluateSignals({
      url: 'https://nextjs.org',
      globals: {
        __next_f: { rscStream: true },
      },
      dom: [{ selector: 'meta[name="next-head-count"]' }],
      meta: [],
      resources: ['https://nextjs.org/_next/static/chunks/app.js'],
    });

    const nextjs = nextSite.technologies.find((t) => t.id === 'nextjs');
    const react = nextSite.technologies.find((t) => t.id === 'react');

    expect(nextjs?.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(nextjs?.confidenceTier).toBe('high');
    expect(react?.confidenceScore).toBe(75);
    expect(react?.confidenceTier).toBe('medium');
    expect(react?.detectionType).toBe('inferred');
  });
});
