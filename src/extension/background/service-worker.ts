import { evaluateSignals } from '../../engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../engine/types';
import {
  ExtensionRequestMessage,
  ExtensionResponseMessage,
  validateScannableUrl,
  ScanError,
} from '../../shared/messages';
import { harvestIsolatedSignals, IsolatedProbePayload } from '../content/isolated-probe';
import { harvestMainSignals } from '../content/main-probe';
import {
  saveScanToStorage,
  getCachedScan,
  getTabScan,
  setTabScan,
  invalidateTabScan,
  invalidateTabScanIfUrlChanged,
} from '../storage/history';

/**
 * Tracks tabs currently being scanned to avoid race conditions
 */
const activeScanTabs = new Set<number>();

/**
 * Orchestrates a complete website technology scan on the specified tab
 */
export async function performTabScan(
  tabId: number,
  tabUrl: string,
  forceFresh = false
): Promise<ScanResult> {
  // Check tab-specific session cache first if not forced fresh
  if (!forceFresh) {
    const cached = await getTabScan(tabId, tabUrl);
    if (cached) {
      return cached;
    }
  }

  // Prevent concurrent scans on identical tab
  if (activeScanTabs.has(tabId)) {
    // Wait briefly if scan is already in progress
    await new Promise((resolve) => setTimeout(resolve, 300));
    const cached = await getTabScan(tabId, tabUrl);
    if (cached) return cached;
  }

  activeScanTabs.add(tabId);

  try {
    // 1. Execute Isolated World Probe (DOM & ResourceTiming)
    let isolatedPayload: IsolatedProbePayload;
    try {
      const isolatedResults = await chrome.scripting.executeScript({
        target: { tabId },
        func: harvestIsolatedSignals,
      });

      if (isolatedResults && isolatedResults[0]?.result) {
        isolatedPayload = isolatedResults[0].result as IsolatedProbePayload;
      } else {
        throw new Error('No probe result returned from active tab.');
      }
    } catch (isolatedErr) {
      const errStr = String(isolatedErr);

      // Check if error indicates a browser-generated error document or chrome-error:// frame
      if (
        errStr.includes('chrome-error://') ||
        errStr.includes('edge-error://') ||
        errStr.includes('brave-error://') ||
        errStr.includes('error document') ||
        errStr.includes('Cannot access a chrome-error') ||
        errStr.includes('Cannot access contents of url "chrome-error')
      ) {
        const error: ScanError = {
          code: 'PAGE_UNAVAILABLE',
          message: 'Website cannot be reached or failed to load. Check your network connection or the website address.',
          url: tabUrl,
        };
        throw error;
      }

      // Check if tab was closed or invalid
      if (errStr.includes('No tab with id') || errStr.includes('tab was closed')) {
        const error: ScanError = {
          code: 'TAB_NOT_FOUND',
          message: 'The tab was closed or could not be found.',
          url: tabUrl,
        };
        throw error;
      }

      console.warn('[SiteStack ServiceWorker] Isolated-world probe notice:', isolatedErr);
      const error: ScanError = {
        code: 'INJECTION_FAILED',
        message: 'Failed to inspect website. Ensure page is fully loaded and retry.',
        url: tabUrl,
      };
      throw error;
    }

    // Check if probe inside page identified a browser error page
    if (isolatedPayload.isErrorPage) {
      const error: ScanError = {
        code: 'PAGE_UNAVAILABLE',
        message: `Website cannot be reached (${isolatedPayload.errorCode || 'Connection Error'}). Check your network connection or the website address.`,
        url: tabUrl,
      };
      throw error;
    }

    // 2. Execute MAIN World Probe (Window Globals Allowlist)
    let globalSignals: Record<string, unknown> = {};
    try {
      const mainResults = await chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: harvestMainSignals,
      });

      if (mainResults && mainResults[0]?.result) {
        globalSignals = mainResults[0].result as Record<string, unknown>;
      }
    } catch (mainErr) {
      // MAIN world injection might fail on some strict pages; fallback gracefully
      console.warn('[SiteStack ServiceWorker] MAIN-world probe notice:', mainErr);
    }

    // 3. Assemble Harvested Signals
    const combinedSignals: HarvestedSignals = {
      url: isolatedPayload.url || tabUrl,
      meta: isolatedPayload.meta || [],
      dom: isolatedPayload.dom || [],
      resources: isolatedPayload.resources || [],
      globals: globalSignals,
    };

    // 4. Run Pure Detection Engine
    const scanResult = evaluateSignals(combinedSignals);

    // 5. Persist to Local History Storage & Tab Session Association
    await saveScanToStorage(scanResult);
    await setTabScan(tabId, tabUrl, scanResult);

    return scanResult;
  } finally {
    activeScanTabs.delete(tabId);
  }
}

/**
 * Resolves active tab and handles scan requests
 */
async function handleScanMessage(
  request: ExtensionRequestMessage
): Promise<ExtensionResponseMessage> {
  let targetTabId = request.tabId;
  let targetUrl = request.url;

  // If tab info wasn't provided, query currently active tab
  if (!targetTabId || !targetUrl) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id || !activeTab.url) {
      return {
        type: 'MSG_SCAN_ERROR',
        error: {
          code: 'TAB_NOT_FOUND',
          message: 'Could not detect an active browser tab.',
        },
      };
    }
    targetTabId = activeTab.id;
    targetUrl = activeTab.url;
  }

  // Validate URL scheme & security restrictions
  const urlValidation = validateScannableUrl(targetUrl);
  if (!urlValidation.scannable) {
    return {
      type: 'MSG_SCAN_ERROR',
      error: {
        code: urlValidation.code || 'RESTRICTED_URL',
        message: urlValidation.message || 'Cannot scan restricted page.',
        url: targetUrl,
      },
    };
  }

  // Handle Read-Only Tab Status Query (Does NOT trigger any scanning)
  if (request.type === 'MSG_GET_TAB_STATUS') {
    const tabScan = await getTabScan(targetTabId, targetUrl);
    if (tabScan) {
      return {
        type: 'MSG_TAB_STATUS',
        isScanned: true,
        result: tabScan,
        url: targetUrl,
      };
    }
    return {
      type: 'MSG_TAB_STATUS',
      isScanned: false,
      url: targetUrl,
    };
  }

  // Handle Cache-only Request
  if (request.type === 'MSG_GET_CACHED_SCAN') {
    const cached = await getCachedScan(targetUrl);
    if (cached) {
      return {
        type: 'MSG_SCAN_SUCCESS',
        result: cached,
      };
    }
  }

  // Execute Fresh Scan
  try {
    const forceFresh = request.type === 'MSG_START_SCAN' ? Boolean(request.forceFresh) : false;
    const result = await performTabScan(targetTabId, targetUrl, forceFresh);
    return {
      type: 'MSG_SCAN_SUCCESS',
      result,
    };
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
      return {
        type: 'MSG_SCAN_ERROR',
        error: err as ScanError,
      };
    }
    console.error('[SiteStack ServiceWorker] Scan execution error:', err);
    return {
      type: 'MSG_SCAN_ERROR',
      error: {
        code: 'INJECTION_FAILED',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to inspect website. Ensure page is fully loaded and retry.',
        url: targetUrl,
      },
    };
  }
}

// Background Message Listener
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (
      message?.type === 'MSG_START_SCAN' ||
      message?.type === 'MSG_GET_CACHED_SCAN' ||
      message?.type === 'MSG_GET_TAB_STATUS'
    ) {
      handleScanMessage(message as ExtensionRequestMessage)
        .then((response) => sendResponse(response))
        .catch((err) => {
          sendResponse({
            type: 'MSG_SCAN_ERROR',
            error: {
              code: 'EVALUATION_ERROR',
              message: String(err),
            },
          });
        });
      return true; // Keep channel open for async response
    }
  });
}

// Invalidate tab scan when navigation occurs in a tab
if (typeof chrome !== 'undefined' && chrome.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
      invalidateTabScanIfUrlChanged(tabId, changeInfo.url).catch(() => {});
    }
  });
}

// Invalidate tab scan when a tab is closed
if (typeof chrome !== 'undefined' && chrome.tabs?.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    invalidateTabScan(tabId).catch(() => {});
  });
}
