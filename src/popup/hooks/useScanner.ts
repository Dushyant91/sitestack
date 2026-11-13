import { useState, useEffect, useCallback } from 'react';
import { ScanResult } from '../../engine/types';
import {
  ExtensionRequestMessage,
  ExtensionResponseMessage,
  ScanError,
} from '../../shared/messages';

export interface UseScannerReturn {
  result: ScanResult | null;
  isLoading: boolean;
  error: ScanError | null;
  isCached: boolean;
  activeUrl: string;
  activeDomain: string;
  triggerScan: (forceFresh?: boolean) => Promise<void>;
}

export function useScanner(): UseScannerReturn {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ScanError | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [activeDomain, setActiveDomain] = useState<string>('');

  const executeScan = useCallback(async (forceFresh = false) => {
    setIsLoading(true);
    setError(null);

    // Development Environment Fallback (when previewed directly in a browser tab)
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      setTimeout(() => {
        setIsLoading(false);
        setActiveDomain('vercel.com');
        setActiveUrl('https://vercel.com');
      }, 500);
      return;
    }

    try {
      // 1. Query Active Tab
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

      // 2. Request Scan from Background Service Worker
      const message: ExtensionRequestMessage = {
        type: 'MSG_START_SCAN',
        tabId: tab.id,
        url: tab.url,
        forceFresh,
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

        if (response.type === 'MSG_SCAN_SUCCESS') {
          setResult(response.result);
          // Check if this result came from cache
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

  useEffect(() => {
    executeScan(false);
  }, [executeScan]);

  return {
    result,
    isLoading,
    error,
    isCached,
    activeUrl,
    activeDomain,
    triggerScan: executeScan,
  };
}
