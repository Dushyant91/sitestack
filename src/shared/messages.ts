import { ScanResult } from '../engine/types';

export type MessageType =
  | 'MSG_START_SCAN'
  | 'MSG_SCAN_SUCCESS'
  | 'MSG_SCAN_ERROR'
  | 'MSG_GET_CACHED_SCAN'
  | 'MSG_CLEAR_SCAN_CACHE';

export type ScanErrorCode =
  | 'RESTRICTED_URL'
  | 'UNSUPPORTED_SCHEME'
  | 'PAGE_UNAVAILABLE'
  | 'TAB_NOT_FOUND'
  | 'INJECTION_FAILED'
  | 'EVALUATION_ERROR';

export interface ScanError {
  code: ScanErrorCode;
  message: string;
  url?: string;
}

export interface StartScanRequest {
  type: 'MSG_START_SCAN';
  tabId?: number;
  url?: string;
  forceFresh?: boolean;
}

export interface GetCachedScanRequest {
  type: 'MSG_GET_CACHED_SCAN';
  tabId?: number;
  url?: string;
}

export interface ScanSuccessResponse {
  type: 'MSG_SCAN_SUCCESS';
  result: ScanResult;
}

export interface ScanErrorResponse {
  type: 'MSG_SCAN_ERROR';
  error: ScanError;
}

export type ExtensionRequestMessage = StartScanRequest | GetCachedScanRequest;
export type ExtensionResponseMessage = ScanSuccessResponse | ScanErrorResponse;

/**
 * Validates if a target URL can be safely scanned
 */
export function validateScannableUrl(url: string | undefined): {
  scannable: boolean;
  code?: ScanErrorCode;
  message?: string;
} {
  if (!url || typeof url !== 'string') {
    return {
      scannable: false,
      code: 'UNSUPPORTED_SCHEME',
      message: 'No valid URL detected on active tab.',
    };
  }

  const trimmed = url.trim().toLowerCase();

  // Browser network and connection error pages
  if (
    trimmed.startsWith('chrome-error://') ||
    trimmed.startsWith('edge-error://') ||
    trimmed.startsWith('brave-error://')
  ) {
    return {
      scannable: false,
      code: 'PAGE_UNAVAILABLE',
      message: 'This page cannot be analyzed because the website failed to load or connection was lost.',
    };
  }

  if (
    trimmed.startsWith('chrome://') ||
    trimmed.startsWith('chrome-extension://') ||
    trimmed.startsWith('devtools://') ||
    trimmed.startsWith('edge://') ||
    trimmed.startsWith('brave://') ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('view-source:')
  ) {
    return {
      scannable: false,
      code: 'RESTRICTED_URL',
      message: 'Browser internal and system pages cannot be analyzed by extension security policy.',
    };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      scannable: false,
      code: 'UNSUPPORTED_SCHEME',
      message: `Unsupported protocol (${trimmed.split(':')[0]}://). SiteStack analyzes HTTP and HTTPS websites.`,
    };
  }

  return { scannable: true };
}
