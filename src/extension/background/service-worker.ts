import { evaluateSignals } from '../../engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../engine/types';
import {
  ExtensionRequestMessage,
  ExtensionResponseMessage,
  validateScannableUrl,
} from '../../shared/messages';
import { harvestIsolatedSignals, IsolatedProbePayload } from '../content/isolated-probe';
import { harvestMainSignals } from '../content/main-probe';
import { saveScanToStorage, getCachedScan } from '../storage/history';

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
  // Check cache first if not forced fresh
  if (!forceFresh) {
    const cached = await getCachedScan(tabUrl);
    if (cached) {
      return cached;
    }
  }

  // Prevent concurrent scans on identical tab
  if (activeScanTabs.has(tabId)) {
    // Wait briefly if scan is already in progress
    await new Promise((resolve) => setTimeout(resolve, 300));
    const cached = await getCachedScan(tabUrl);
    if (cached) return cached;
  }

  activeScanTabs.add(tabId);

  try {
    // 1. Execute Isolated World Probe (DOM & ResourceTiming)
    let isolatedPayload: IsolatedProbePayload = {
      url: tabUrl,
      meta: [],
      dom: [],
      resources: [],
    };
    try {
      const isolatedResults = await chrome.scripting.executeScript({
        target: { tabId },
        func: harvestIsolatedSignals,
      });

      if (isolatedResults && isolatedResults[0]?.result) {
        isolatedPayload = isolatedResults[0].result as IsolatedProbePayload;
      }
    } catch (isolatedErr) {
      console.warn('[SiteStack ServiceWorker] Isolated-world probe notice:', isolatedErr);
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

    // 5. Persist to Local History Storage
    await saveScanToStorage(scanResult);

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
    if (message?.type === 'MSG_START_SCAN' || message?.type === 'MSG_GET_CACHED_SCAN') {
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
