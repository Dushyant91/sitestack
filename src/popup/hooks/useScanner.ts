import { useState, useEffect, useCallback, useRef } from 'react';
import { ScanResult } from '../../engine/types';
import {
  ExtensionRequestMessage,
  ExtensionResponseMessage,
  ScanError,
} from '../../shared/messages';
import { normalizeScanUrl } from '../../shared/url';

export interface UseScannerReturn {
  result: ScanResult | null;
  isLoading: boolean;
  error: ScanError | null;
  isCached: boolean;
  isScanned: boolean;
  activeUrl: string;
  activeDomain: string;
  triggerScan: (forceFresh?: boolean) => Promise<void>;
  clearActiveScan: () => void;
  refreshTabStatus: () => Promise<void>;
}

export function useScanner(): UseScannerReturn {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanned, setIsScanned] = useState<boolean>(false);
  const [error, setError] = useState<ScanError | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [activeDomain, setActiveDomain] = useState<string>('');
  const latestRequestIdRef = useRef<number>(0);

  /**
   * Read-only tab status query: Checks if the active tab has already been scanned
   * for its current URL. NEVER initiates probe injection or automated scanning.
   */
  const checkTabStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Development Environment Fallback (when previewed directly in a browser tab)
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      setTimeout(() => {
        setIsLoading(false);
        setActiveDomain('example.com');
        setActiveUrl('https://example.com');
        setIsScanned(false);
      }, 100);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url) {
        setIsLoading(false);
        setError({
          code: 'TAB_NOT_FOUND',
          message: 'No active browser tab found to inspect.',
        });
        return;
      }

      setActiveUrl(tab.url);
      try {
        const parsed = new URL(tab.url);
        setActiveDomain(parsed.hostname);
      } catch {
        setActiveDomain(tab.url);
      }

      const message: ExtensionRequestMessage = {
        type: 'MSG_GET_TAB_STATUS',
        tabId: tab.id,
        url: tab.url,
      };

      chrome.runtime.sendMessage(message, (response: ExtensionResponseMessage) => {
        setIsLoading(false);
        if (chrome.runtime.lastError) {
          setError({
            code: 'INJECTION_FAILED',
            message: chrome.runtime.lastError.message || 'Service worker connection failed.',
          });
          return;
        }

        if (!response) {
          setError({
            code: 'INJECTION_FAILED',
            message: 'No response received from detection service worker.',
          });
          return;
        }

        if (response.type === 'MSG_TAB_STATUS') {
          if (response.isScanned && response.result) {
            setResult(response.result);
            setIsScanned(true);
            const age = Date.now() - response.result.timestamp;
            setIsCached(age > 5000);
          } else {
            setResult(null);
            setIsScanned(false);
            setIsCached(false);
          }
        } else if (response.type === 'MSG_SCAN_ERROR') {
          setError(response.error);
          setIsScanned(false);
        }
      });
    } catch (err) {
      setIsLoading(false);
      setError({
        code: 'EVALUATION_ERROR',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  /**
   * Explicit user-triggered scan execution: Called ONLY when the user clicks Scan/Rescan.
   */
  const executeScan = useCallback(async (forceFresh = true) => {
    setIsLoading(true);
    setError(null);

    // Development Environment Fallback
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      setTimeout(() => {
        setIsLoading(false);
        setActiveDomain('example.com');
        setActiveUrl('https://example.com');
        setIsScanned(true);
      }, 500);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url) {
        setIsLoading(false);
        setError({
          code: 'TAB_NOT_FOUND',
          message: 'No active browser tab found to inspect.',
        });
        return;
      }

      setActiveUrl(tab.url);
      try {
        const parsed = new URL(tab.url);
        setActiveDomain(parsed.hostname);
      } catch {
        setActiveDomain(tab.url);
      }

      const requestId = ++latestRequestIdRef.current;

      const message: ExtensionRequestMessage = {
        type: 'MSG_START_SCAN',
        tabId: tab.id,
        url: tab.url,
        forceFresh,
      };

      chrome.runtime.sendMessage(message, async (response: ExtensionResponseMessage) => {
        // D4 Guard 1: Verify response belongs to the latest scan request
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setIsLoading(false);
        if (chrome.runtime.lastError) {
          setError({
            code: 'INJECTION_FAILED',
            message: chrome.runtime.lastError.message || 'Service worker connection failed.',
          });
          return;
        }

        if (!response) {
          setError({
            code: 'INJECTION_FAILED',
            message: 'No response received from detection service worker.',
          });
          return;
        }

        if (response.type === 'MSG_SCAN_SUCCESS') {
          // D4 Guard 2: Verify active tab ID and URL still match the scanned result
          try {
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (
              !currentTab ||
              currentTab.id !== tab.id ||
              !currentTab.url ||
              normalizeScanUrl(currentTab.url) !== normalizeScanUrl(response.result.url)
            ) {
              // Active tab navigated away or changed while scan was in-flight -> discard stale UI update
              setResult(null);
              setIsScanned(false);
              return;
            }
          } catch {
            setResult(null);
            setIsScanned(false);
            return;
          }

          setResult(response.result);
          setIsScanned(true);
          const age = Date.now() - response.result.timestamp;
          setIsCached(!forceFresh && age > 5000);
        } else if (response.type === 'MSG_SCAN_ERROR') {
          setError(response.error);
        }
      });
    } catch (err) {
      setIsLoading(false);
      setError({
        code: 'EVALUATION_ERROR',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const clearActiveScan = useCallback(() => {
    setResult(null);
    setIsScanned(false);
    setIsCached(false);
  }, []);

  // Popup mount: ONLY query read-only tab status, NEVER trigger automated scan!
  useEffect(() => {
    checkTabStatus();
  }, [checkTabStatus]);

  return {
    result,
    isLoading,
    error,
    isCached,
    isScanned,
    activeUrl,
    activeDomain,
    triggerScan: executeScan,
    clearActiveScan,
    refreshTabStatus: checkTabStatus,
  };
}
