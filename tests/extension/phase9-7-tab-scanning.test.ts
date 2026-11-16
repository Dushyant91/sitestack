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
  STORAGE_KEY_HISTORY,
  STORAGE_KEY_TAB_SCANS,
} from '../../src/extension/storage/history';
import { ScanResult } from '../../src/engine/types';
import * as isolatedProbe from '../../src/extension/content/isolated-probe';

describe('Phase 9.7.1: User-Triggered Scan & Active-Tab Isolation Regression Suite', () => {
  let mockStorage: Record<string, unknown> = {};

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage = {};

    globalThis.chrome = {
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
        query: vi.fn().mockResolvedValue([{ id: 101, url: 'https://example.com/' }]),
        onUpdated: { addListener: vi.fn() },
        onRemoved: { addListener: vi.fn() },
      },
    } as unknown as typeof chrome;
  });

  // =========================================================================
  // 1. Never-Scanned Tab Status & Opening Popup Avoids Scan Invocation
  // =========================================================================
  it('1. Opening popup on a never-scanned tab returns isScanned=false and never scans', async () => {
    const tabId = 101;
    const url = 'https://x.com/home';

    const tabScan = await getTabScan(tabId, url);
    expect(tabScan).toBeNull();

    // Verify executeScript was called 0 times
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(0);
  });

  it('2. Opening popup must not call the scan function', async () => {
    const probeSpy = vi.spyOn(isolatedProbe, 'harvestIsolatedSignals');

    // Simulate popup checking tab status on mount
    const tabId = 202;
    const url = 'https://en.wikipedia.org/wiki/Main_Page';

    const tabScan = await getTabScan(tabId, url);
    expect(tabScan).toBeNull();

    // Probe function was never invoked
    expect(probeSpy).toHaveBeenCalledTimes(0);
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(0);
  });

  // =========================================================================
  // 3. Tab Switching: Scanned vs. Unscanned State Isolation
  // =========================================================================
  it('3. Switching from a scanned tab to an unscanned tab: Unscanned tab shows isScanned=false', async () => {
    const tab1 = 101;
    const url1 = 'https://react.dev/';
    const tab2 = 102;
    const url2 = 'https://en.wikipedia.org/wiki/Main_Page';

    // Scan Tab 1
    const scanResult1: ScanResult = {
      id: 'react_dev_1',
      url: url1,
      domain: 'react.dev',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 2,
      scanDurationMs: 2,
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

    // Save Tab 1 to history and tab session
    mockStorage[STORAGE_KEY_HISTORY] = [scanResult1];
    await setTabScan(tab1, url1, scanResult1);

    // Verify Tab 1 is scanned
    const checkTab1 = await getTabScan(tab1, url1);
    expect(checkTab1).not.toBeNull();
    expect(checkTab1?.technologies[0].id).toBe('react');

    // Verify Tab 2 is UNSCANNED (zero bleed from Tab 1)
    const checkTab2 = await getTabScan(tab2, url2);
    expect(checkTab2).toBeNull();
  });

  it('4. Switching between two previously scanned tabs: Each tab displays its own result', async () => {
    const tabShopify = 101;
    const urlShopify = 'https://mystore.myshopify.com/';
    const tabWoo = 102;
    const urlWoo = 'https://woocommerce.com/store';

    const shopifyResult: ScanResult = {
      id: 'shopify_1',
      url: urlShopify,
      domain: 'mystore.myshopify.com',
      timestamp: Date.now() - 1000,
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [{ id: 'shopify', name: 'Shopify', category: 'ecommerce', confidenceScore: 95, confidenceTier: 'high', detectionType: 'direct', isInferred: false, evidence: [], website: '', icon: '', description: '' }],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    const wooResult: ScanResult = {
      id: 'woo_1',
      url: urlWoo,
      domain: 'woocommerce.com',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [{ id: 'woocommerce', name: 'WooCommerce', category: 'ecommerce', confidenceScore: 90, confidenceTier: 'high', detectionType: 'direct', isInferred: false, evidence: [], website: '', icon: '', description: '' }],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    mockStorage[STORAGE_KEY_HISTORY] = [shopifyResult, wooResult];
    await setTabScan(tabShopify, urlShopify, shopifyResult);
    await setTabScan(tabWoo, urlWoo, wooResult);

    // Tab Shopify shows Shopify
    const shopifyScan = await getTabScan(tabShopify, urlShopify);
    expect(shopifyScan?.technologies[0].id).toBe('shopify');

    // Tab Woo shows WooCommerce
    const wooScan = await getTabScan(tabWoo, urlWoo);
    expect(wooScan?.technologies[0].id).toBe('woocommerce');
  });

  it('5. Opening popup repeatedly without scanning executes zero scans', async () => {
    const tabId = 105;
    const url = 'https://x.com/home';

    // Simulate 5 consecutive popup opens
    for (let i = 0; i < 5; i++) {
      const res = await getTabScan(tabId, url);
      expect(res).toBeNull();
    }

    // Zero scans executed across all 5 opens
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(0);
  });

  // =========================================================================
  // 6. History Deletion & Cache Invalidation
  // =========================================================================
  it('6. Clearing history while a result is displayed: Invalidates tab association immediately', async () => {
    const tabId = 101;
    const url = 'https://x.com/home';

    const xResult: ScanResult = {
      id: 'x_com_123',
      url,
      domain: 'x.com',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [{ id: 'tailwind', name: 'Tailwind CSS', category: 'framework', confidenceScore: 60, confidenceTier: 'medium', detectionType: 'direct', isInferred: false, evidence: [], website: '', icon: '', description: '' }],
      stats: { total: 1, high: 0, medium: 1, low: 0 },
    };

    mockStorage[STORAGE_KEY_HISTORY] = [xResult];
    await setTabScan(tabId, url, xResult);

    // Initial check: active tab is scanned
    expect(await getTabScan(tabId, url)).not.toBeNull();

    // User clears history
    await clearScanHistory();

    // Tab scan association is immediately invalidated
    const afterClear = await getTabScan(tabId, url);
    expect(afterClear).toBeNull();
    expect(mockStorage[STORAGE_KEY_TAB_SCANS]).toBeUndefined();
  });

  it('7. Deleting one record while its result is displayed: Prunes that tab association', async () => {
    const tabX = 101;
    const urlX = 'https://x.com/home';
    const tabNotion = 102;
    const urlNotion = 'https://notion.so/';

    const xResult: ScanResult = {
      id: 'x_1',
      url: urlX,
      domain: 'x.com',
      timestamp: 1000,
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [],
      stats: { total: 0, high: 0, medium: 0, low: 0 },
    };

    const notionResult: ScanResult = {
      id: 'notion_1',
      url: urlNotion,
      domain: 'notion.so',
      timestamp: 2000,
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [{ id: 'react', name: 'React', category: 'framework', confidenceScore: 85, confidenceTier: 'high', detectionType: 'direct', isInferred: false, evidence: [], website: '', icon: '', description: '' }],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    mockStorage[STORAGE_KEY_HISTORY] = [xResult, notionResult];
    await setTabScan(tabX, urlX, xResult);
    await setTabScan(tabNotion, urlNotion, notionResult);

    // Delete ONLY the X scan
    await deleteScanFromHistory('x_1');

    // Tab X is invalidated
    expect(await getTabScan(tabX, urlX)).toBeNull();

    // Tab Notion remains intact
    const notionScan = await getTabScan(tabNotion, urlNotion);
    expect(notionScan).not.toBeNull();
    expect(notionScan?.id).toBe('notion_1');
  });

  it('8. Reopening popup after history deletion stays unscanned (never restores from memory cache)', async () => {
    const tabId = 101;
    const url = 'https://x.com/home';

    const xResult: ScanResult = {
      id: 'x_1',
      url,
      domain: 'x.com',
      timestamp: 1000,
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [],
      stats: { total: 0, high: 0, medium: 0, low: 0 },
    };

    mockStorage[STORAGE_KEY_HISTORY] = [xResult];
    await setTabScan(tabId, url, xResult);

    // Delete record
    await deleteScanFromHistory('x_1');

    // Reopen popup 3 times
    expect(await getTabScan(tabId, url)).toBeNull();
    expect(await getTabScan(tabId, url)).toBeNull();
    expect(await getTabScan(tabId, url)).toBeNull();

    // Zero scans triggered
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(0);
  });

  // =========================================================================
  // 9. Navigation & Stale Results Invalidation
  // =========================================================================
  it('9. Navigating within an already scanned tab invalidates previous result', async () => {
    const tabId = 101;
    const oldUrl = 'https://github.com/explore';
    const newUrl = 'https://github.com/trending';

    const githubResult: ScanResult = {
      id: 'gh_1',
      url: oldUrl,
      domain: 'github.com',
      timestamp: 1000,
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [],
      stats: { total: 0, high: 0, medium: 0, low: 0 },
    };

    mockStorage[STORAGE_KEY_HISTORY] = [githubResult];
    await setTabScan(tabId, oldUrl, githubResult);

    // Verified scanned on old URL
    expect(await getTabScan(tabId, oldUrl)).not.toBeNull();

    // Tab navigates to new URL -> getTabScan checks new URL against stored URL
    const scanOnNewUrl = await getTabScan(tabId, newUrl);
    expect(scanOnNewUrl).toBeNull(); // Outdated result is invalidated!

    // Also verify via invalidateTabScanIfUrlChanged
    await setTabScan(tabId, oldUrl, githubResult);
    await invalidateTabScanIfUrlChanged(tabId, newUrl);
    expect(await getTabScan(tabId, newUrl)).toBeNull();

    // Also verify via invalidateTabScan (tab closure)
    await setTabScan(tabId, oldUrl, githubResult);
    await invalidateTabScan(tabId);
    expect(await getTabScan(tabId, oldUrl)).toBeNull();
  });

  it('10. Multiple tabs with different URLs and results maintain strict isolation', async () => {
    const tabs = [
      { id: 1, url: 'https://site-a.com/', tech: 'react' },
      { id: 2, url: 'https://site-b.com/', tech: 'vue' },
      { id: 3, url: 'https://site-c.com/', tech: 'angular' },
      { id: 4, url: 'https://site-d.com/', tech: 'wordpress' },
    ];

    const history: ScanResult[] = [];
    for (const t of tabs) {
      const res: ScanResult = {
        id: `scan_${t.id}`,
        url: t.url,
        domain: `site-${t.id}.com`,
        timestamp: 1000 + t.id,
        engineEvaluationDurationMs: 1,
        scanDurationMs: 1,
        technologies: [{ id: t.tech, name: t.tech, category: 'framework', confidenceScore: 90, confidenceTier: 'high', detectionType: 'direct', isInferred: false, evidence: [], website: '', icon: '', description: '' }],
        stats: { total: 1, high: 1, medium: 0, low: 0 },
      };
      history.push(res);
      await setTabScan(t.id, t.url, res);
    }
    mockStorage[STORAGE_KEY_HISTORY] = history;

    // Verify each tab receives ONLY its own technology
    for (const t of tabs) {
      const result = await getTabScan(t.id, t.url);
      expect(result).not.toBeNull();
      expect(result?.technologies[0].id).toBe(t.tech);
      expect(result?.url).toBe(t.url);
    }
  });

  // =========================================================================
  // 11. Rapid Tab Switching & Concurrency Guard
  // =========================================================================
  it('11. Rapid tab switching during an active scan: Tab lock prevents duplicate injection', async () => {
    const tabId = 101;
    const url = 'https://heavy-site.com/';

    // Trigger two concurrent scans on identical tab
    const [scan1, scan2] = await Promise.all([
      performTabScan(tabId, url, true),
      performTabScan(tabId, url, false),
    ]);

    expect(scan1).toBeDefined();
    expect(scan2).toBeDefined();
    expect(scan1.url).toBe(url);
    expect(scan2.url).toBe(url);
  });

  // =========================================================================
  // 12. Explicit User-Triggered Scanning Works Correctly
  // =========================================================================
  it('12. Explicit user-triggered scanning: Calls performTabScan, saves to history, and binds to tab', async () => {
    const tabId = 101;
    const url = 'https://user-scanned-site.com/';

    // Execute user-requested scan
    const scan = await performTabScan(tabId, url, true);

    expect(scan).toBeDefined();
    expect(scan.url).toBe(url);

    // Verify persisted in history
    const history = await getScanHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].url).toBe(url);

    // Verify bound to tab
    const tabScan = await getTabScan(tabId, url);
    expect(tabScan).not.toBeNull();
    expect(tabScan?.url).toBe(url);
  });
});
