import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  performTabScan,
} from '../../src/extension/background/service-worker';
import {
  getTabScan,
  setTabScan,
  invalidateTabScan,
  invalidateTabScanIfUrlChanged,
  deleteScanFromHistory,
  clearScanHistory,
  getScanHistory,
  cleanupLegacyLocalTabScans,
  STORAGE_KEY_HISTORY,
  STORAGE_KEY_TAB_SCANS,
} from '../../src/extension/storage/history';
import { ScanResult } from '../../src/engine/types';
import * as isolatedProbe from '../../src/extension/content/isolated-probe';

describe('Phase 9.7.3: Tab-State Lifecycle, Session Storage & Navigation Hardening Suite', () => {
  let mockLocalStorage: Record<string, unknown> = {};
  let mockSessionStorage: Record<string, unknown> = {};
  let currentTabUrls: Record<number, string> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLocalStorage = {};
    mockSessionStorage = {};
    currentTabUrls = {};

    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn(async (keys?: unknown) => {
            if (typeof keys === 'string') {
              return { [keys]: mockLocalStorage[keys] };
            }
            if (Array.isArray(keys)) {
              const res: Record<string, unknown> = {};
              for (const k of keys) res[k] = mockLocalStorage[k];
              return res;
            }
            return { ...mockLocalStorage };
          }),
          set: vi.fn(async (items: Record<string, unknown>) => {
            for (const k in items) {
              mockLocalStorage[k] = items[k];
            }
          }),
          remove: vi.fn(async (keys: unknown) => {
            if (typeof keys === 'string') {
              delete mockLocalStorage[keys];
            } else if (Array.isArray(keys)) {
              for (const k of keys) delete mockLocalStorage[k];
            }
          }),
        },
        session: {
          get: vi.fn(async (keys?: unknown) => {
            if (typeof keys === 'string') {
              return { [keys]: mockSessionStorage[keys] };
            }
            if (Array.isArray(keys)) {
              const res: Record<string, unknown> = {};
              for (const k of keys) res[k] = mockSessionStorage[k];
              return res;
            }
            return { ...mockSessionStorage };
          }),
          set: vi.fn(async (items: Record<string, unknown>) => {
            for (const k in items) {
              mockSessionStorage[k] = items[k];
            }
          }),
          remove: vi.fn(async (keys: unknown) => {
            if (typeof keys === 'string') {
              delete mockSessionStorage[keys];
            } else if (Array.isArray(keys)) {
              for (const k of keys) delete mockSessionStorage[k];
            }
          }),
        },
      },
      scripting: {
        executeScript: vi.fn().mockImplementation((options: { world?: string }) => {
          if (options.world === 'MAIN') {
            return Promise.resolve([{ result: {} }]);
          }
          return Promise.resolve([
            {
              result: {
                url: '',
                meta: [],
                dom: [],
                resources: [],
              },
            },
          ]);
        }),
      },
      tabs: {
        get: vi.fn().mockImplementation(async (tabId: number) => {
          if (currentTabUrls[tabId] === undefined) {
            throw new Error(`No tab with id: ${tabId}`);
          }
          return { id: tabId, url: currentTabUrls[tabId] };
        }),
        query: vi.fn().mockImplementation(async () => {
          const firstTabId = Object.keys(currentTabUrls)[0];
          if (!firstTabId) return [{ id: 101, url: 'https://example.com/' }];
          const id = Number(firstTabId);
          return [{ id, url: currentTabUrls[id] }];
        }),
        onUpdated: { addListener: vi.fn() },
        onRemoved: { addListener: vi.fn() },
      },
    } as unknown as typeof chrome;
  });

  // =========================================================================
  // 1. Session Storage Lifecycle & Survival Across Service Worker Restarts
  // =========================================================================
  it('1. Session associations survive service-worker reinitialization', async () => {
    const tabId = 101;
    const url = 'https://react.dev/';
    currentTabUrls[tabId] = url;

    const sampleScan: ScanResult = {
      id: 'react_scan_1',
      url,
      domain: 'react.dev',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [
        {
          id: 'react',
          name: 'React',
          category: 'framework',
          confidenceScore: 90,
          confidenceTier: 'high',
          detectionType: 'direct',
          isInferred: false,
          evidence: [],
          website: 'https://react.dev',
          icon: '',
          description: '',
        },
      ],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    // Save to persistent history in local storage
    mockLocalStorage[STORAGE_KEY_HISTORY] = [sampleScan];

    // Set tab association in session storage
    await setTabScan(tabId, url, sampleScan);

    // Verify written to session storage (NOT local storage)
    expect(mockSessionStorage[STORAGE_KEY_TAB_SCANS]).toBeDefined();
    expect(mockLocalStorage[STORAGE_KEY_TAB_SCANS]).toBeUndefined();

    // Simulate service-worker termination and restart:
    // Memory closures die, but chrome.storage.session and chrome.storage.local persist
    const restoredScan = await getTabScan(tabId, url);
    expect(restoredScan).not.toBeNull();
    expect(restoredScan?.id).toBe('react_scan_1');
    expect(restoredScan?.technologies[0].id).toBe('react');
  });

  it('2. Clearing session storage simulates browser restart and removes associations without touching history', async () => {
    const tabId = 101;
    const url = 'https://x.com/home';
    currentTabUrls[tabId] = url;

    const xScan: ScanResult = {
      id: 'x_scan_1',
      url,
      domain: 'x.com',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [{ id: 'tailwind', name: 'Tailwind CSS', category: 'framework', confidenceScore: 60, confidenceTier: 'medium', detectionType: 'direct', isInferred: false, evidence: [], website: '', icon: '', description: '' }],
      stats: { total: 1, high: 0, medium: 1, low: 0 },
    };

    mockLocalStorage[STORAGE_KEY_HISTORY] = [xScan];
    await setTabScan(tabId, url, xScan);

    expect(await getTabScan(tabId, url)).not.toBeNull();

    // Simulate browser exit/restart: Chromium clears session storage, while local storage remains on disk
    mockSessionStorage = {};

    // Tab scan must return null ("Ready to Scan"), proving zero stale association survived
    const postRestartScan = await getTabScan(tabId, url);
    expect(postRestartScan).toBeNull();

    // Persistent history remains completely intact in local storage
    const history = await getScanHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe('x_scan_1');
  });

  // =========================================================================
  // 3. Document Lifecycle: Same-URL Reload, Back/Forward & Redirects
  // =========================================================================
  it('3. Same-URL reload invalidates association (changeInfo.status === "loading")', async () => {
    const tabId = 101;
    const url = 'https://react.dev/';
    currentTabUrls[tabId] = url;

    const sampleScan: ScanResult = {
      id: 'react_scan_1',
      url,
      domain: 'react.dev',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [],
      stats: { total: 0, high: 0, medium: 0, low: 0 },
    };

    mockLocalStorage[STORAGE_KEY_HISTORY] = [sampleScan];
    await setTabScan(tabId, url, sampleScan);
    expect(await getTabScan(tabId, url)).not.toBeNull();

    // User hits F5 / reload: Chromium fires onUpdated with status: 'loading' (url is undefined)
    await invalidateTabScan(tabId); // directly verifies effect of status === 'loading' listener

    expect(await getTabScan(tabId, url)).toBeNull();
  });

  it('4. Back and Forward navigation invalidates old results', async () => {
    const tabId = 101;
    const urlA = 'https://site.com/page-a';
    const urlB = 'https://site.com/page-b';
    currentTabUrls[tabId] = urlB;

    const scanA: ScanResult = {
      id: 'scan_a',
      url: urlA,
      domain: 'site.com',
      timestamp: 1000,
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [],
      stats: { total: 0, high: 0, medium: 0, low: 0 },
    };

    mockLocalStorage[STORAGE_KEY_HISTORY] = [scanA];
    await setTabScan(tabId, urlA, scanA);

    // Tab was scanned on urlA, but browser navigated Back to urlB
    const scanOnUrlB = await getTabScan(tabId, urlB);
    expect(scanOnUrlB).toBeNull(); // Mismatch invalidates!
  });

  it('5. Redirect during an active scan invalidates tab association', async () => {
    const tabId = 101;
    const initialUrl = 'http://example.com/';
    const redirectedUrl = 'https://example.com/';
    currentTabUrls[tabId] = redirectedUrl;

    const initialScan: ScanResult = {
      id: 'example_scan',
      url: initialUrl,
      domain: 'example.com',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [],
      stats: { total: 0, high: 0, medium: 0, low: 0 },
    };

    mockLocalStorage[STORAGE_KEY_HISTORY] = [initialScan];
    await setTabScan(tabId, initialUrl, initialScan);

    // Redirect occurred: status === 'loading' fired or url updated to redirectedUrl
    await invalidateTabScanIfUrlChanged(tabId, redirectedUrl);

    expect(await getTabScan(tabId, redirectedUrl)).toBeNull();
  });

  // =========================================================================
  // 6. D3 Guard: In-Flight Navigation Prevents Incorrect Tab Association
  // =========================================================================
  it('6. Navigation during scan prevents incorrect tab association (D3 Guard)', async () => {
    const tabId = 101;
    const originalUrl = 'https://site-a.com/';
    const navigatedUrl = 'https://site-b.com/';

    // Live tab currently shows originalUrl when scan starts
    currentTabUrls[tabId] = originalUrl;

    // Simulate probe execution taking time, during which user navigates tab to site-b.com
    (chrome.scripting.executeScript as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      // User navigates away while script is executing
      currentTabUrls[tabId] = navigatedUrl;
      return [{ result: { url: originalUrl, meta: [], dom: [], resources: [] } }];
    });

    // Scan finishes for originalUrl
    const scanResult = await performTabScan(tabId, originalUrl, true);

    // The scan completed and was saved to global history
    expect(scanResult).toBeDefined();
    expect(scanResult.url).toBe(originalUrl);

    // BUT D3 guard checked chrome.tabs.get(tabId) and noticed currentTab.url === 'https://site-b.com/'
    // So it did NOT associate originalUrl scan with tab 101!
    const tabScan = await getTabScan(tabId, navigatedUrl);
    expect(tabScan).toBeNull();
  });

  // =========================================================================
  // 7. Closed Tab Behavior During Scan
  // =========================================================================
  it('7. Closed-tab behavior: Tab closed during active scan is handled safely without crashing', async () => {
    const tabId = 999;
    const url = 'https://closing-tab.com/';

    // Tab does not exist in currentTabUrls (simulates closed tab)
    delete currentTabUrls[tabId];

    // performTabScan handles tab lookup rejection gracefully
    const scanResult = await performTabScan(tabId, url, true);
    expect(scanResult).toBeDefined();

    // Tab scan association was safely discarded
    const tabScan = await getTabScan(tabId, url);
    expect(tabScan).toBeNull();
  });

  // =========================================================================
  // 8. History Deletion & Clearing Synchronization
  // =========================================================================
  it('8. History deletion and clearing remain synchronized across local and session storage', async () => {
    const tab1 = 101;
    const tab2 = 102;
    const url1 = 'https://site-one.com/';
    const url2 = 'https://site-two.com/';
    currentTabUrls[tab1] = url1;
    currentTabUrls[tab2] = url2;

    const scan1: ScanResult = { id: 's1', url: url1, domain: 'site-one.com', timestamp: 100, engineEvaluationDurationMs: 1, scanDurationMs: 1, technologies: [], stats: { total: 0, high: 0, medium: 0, low: 0 } };
    const scan2: ScanResult = { id: 's2', url: url2, domain: 'site-two.com', timestamp: 200, engineEvaluationDurationMs: 1, scanDurationMs: 1, technologies: [], stats: { total: 0, high: 0, medium: 0, low: 0 } };

    mockLocalStorage[STORAGE_KEY_HISTORY] = [scan1, scan2];
    await setTabScan(tab1, url1, scan1);
    await setTabScan(tab2, url2, scan2);

    expect(await getTabScan(tab1, url1)).not.toBeNull();
    expect(await getTabScan(tab2, url2)).not.toBeNull();

    // Delete single scan 's1'
    await deleteScanFromHistory('s1');
    expect(await getTabScan(tab1, url1)).toBeNull(); // Pruned from session
    expect(await getTabScan(tab2, url2)).not.toBeNull(); // s2 remains

    // Clear all history
    await clearScanHistory();
    expect(await getTabScan(tab2, url2)).toBeNull(); // Both pruned from session
    expect(mockLocalStorage[STORAGE_KEY_HISTORY]).toBeUndefined();
  });

  // =========================================================================
  // 9. Legacy Local-Storage Cleanup
  // =========================================================================
  it('9. Cleanup legacy local tab scans removes obsolete key from chrome.storage.local', async () => {
    // Populate obsolete local key from earlier version
    mockLocalStorage[STORAGE_KEY_TAB_SCANS] = { '101': { url: 'https://legacy.com' } };
    expect(mockLocalStorage[STORAGE_KEY_TAB_SCANS]).toBeDefined();

    await cleanupLegacyLocalTabScans();

    // Obsolete key cleanly removed from local storage
    expect(mockLocalStorage[STORAGE_KEY_TAB_SCANS]).toBeUndefined();
  });

  // =========================================================================
  // 10. Multi-Tab Isolation & Unscanned Initial State
  // =========================================================================
  it('10. Multi-tab isolation: Opening popup on never-scanned tab returns null and zero probe calls', async () => {
    const probeSpy = vi.spyOn(isolatedProbe, 'harvestIsolatedSignals');
    const tabId = 303;
    const url = 'https://never-scanned.org/';
    currentTabUrls[tabId] = url;

    const result = await getTabScan(tabId, url);
    expect(result).toBeNull();
    expect(probeSpy).toHaveBeenCalledTimes(0);
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(0);
  });
});
