import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useScanner } from '../../src/popup/hooks/useScanner';
import { ScanResult } from '../../src/engine/types';

describe('Phase 9.7.3: useScanner Hook Lifecycle & Late-Response Guard Suite', () => {
  let container: HTMLDivElement;
  let root: Root;

  let mockSendMessage: ReturnType<typeof vi.fn>;
  let mockTabsQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockSendMessage = vi.fn();
    mockTabsQuery = vi.fn().mockResolvedValue([{ id: 101, url: 'https://react.dev/' }]);

    globalThis.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
        lastError: undefined,
      },
      tabs: {
        query: mockTabsQuery,
      },
    } as unknown as typeof chrome;
  });

  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    container.remove();
  };

  it('1. Popup mount sends MSG_GET_TAB_STATUS, never MSG_START_SCAN (zero auto-scan)', async () => {
    let hookResult: ReturnType<typeof useScanner> | undefined;

    const TestComponent = () => {
      hookResult = useScanner();
      return (
        <div>
          <span data-testid="isScanned">{String(hookResult.isScanned)}</span>
          <span data-testid="isLoading">{String(hookResult.isLoading)}</span>
          <span data-testid="domain">{hookResult.activeDomain}</span>
        </div>
      );
    };

    // When MSG_GET_TAB_STATUS is sent, reply with unscanned status
    mockSendMessage.mockImplementation((msg, callback) => {
      if (msg.type === 'MSG_GET_TAB_STATUS') {
        callback({ type: 'MSG_TAB_STATUS', isScanned: false, url: msg.url });
      }
    });

    await act(async () => {
      root.render(<TestComponent />);
    });

    // Check message sent
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'MSG_GET_TAB_STATUS', tabId: 101, url: 'https://react.dev/' }),
      expect.any(Function)
    );

    // MSG_START_SCAN was NEVER sent!
    const startScanCalls = mockSendMessage.mock.calls.filter((c) => c[0]?.type === 'MSG_START_SCAN');
    expect(startScanCalls.length).toBe(0);

    expect(hookResult?.isScanned).toBe(false);
    expect(hookResult?.result).toBeNull();
    cleanup();
  });

  it('2. Late scan response discarded when active tab navigated to a new URL while scan was in-flight (D4 Guard)', async () => {
    let hookResult: ReturnType<typeof useScanner> | undefined;

    const TestComponent = () => {
      hookResult = useScanner();
      return (
        <div>
          <button onClick={() => hookResult?.triggerScan(true)} data-testid="scan-btn">
            Scan
          </button>
          <span data-testid="isScanned">{String(hookResult?.isScanned)}</span>
        </div>
      );
    };

    let scanCallback: ((resp: unknown) => void) | undefined;
    mockSendMessage.mockImplementation((msg, callback) => {
      if (msg.type === 'MSG_GET_TAB_STATUS') {
        callback({ type: 'MSG_TAB_STATUS', isScanned: false, url: msg.url });
      } else if (msg.type === 'MSG_START_SCAN') {
        // Hold the callback to simulate in-flight scan
        scanCallback = callback;
      }
    });

    await act(async () => {
      root.render(<TestComponent />);
    });

    // User explicitly triggers scan on https://react.dev/
    await act(async () => {
      hookResult?.triggerScan(true);
    });

    expect(scanCallback).toBeDefined();

    // While scan is in flight, user navigates tab 101 to https://github.com/trending
    mockTabsQuery.mockResolvedValue([{ id: 101, url: 'https://github.com/trending' }]);

    // Late scan response arrives with results for https://react.dev/
    const staleScanResult: ScanResult = {
      id: 'react_scan',
      url: 'https://react.dev/',
      domain: 'react.dev',
      timestamp: Date.now(),
      engineEvaluationDurationMs: 1,
      scanDurationMs: 1,
      technologies: [{ id: 'react', name: 'React', category: 'framework', confidenceScore: 90, confidenceTier: 'high', detectionType: 'direct', isInferred: false, evidence: [], website: '', icon: '', description: '' }],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    await act(async () => {
      scanCallback?.({ type: 'MSG_SCAN_SUCCESS', result: staleScanResult });
    });

    // D4 Guard detects that tab's current URL (github.com/trending) does NOT match scanned URL (react.dev/)
    // Discards stale UI update and remains unscanned for the new URL!
    expect(hookResult?.isScanned).toBe(false);
    expect(hookResult?.result).toBeNull();
    cleanup();
  });

  it('3. Older scan response cannot overwrite a newer scan result (D4 Request ID Guard)', async () => {
    let hookResult: ReturnType<typeof useScanner> | undefined;

    const TestComponent = () => {
      hookResult = useScanner();
      return <div>Test</div>;
    };

    const scanCallbacks: ((resp: unknown) => void)[] = [];
    mockSendMessage.mockImplementation((msg, callback) => {
      if (msg.type === 'MSG_GET_TAB_STATUS') {
        callback({ type: 'MSG_TAB_STATUS', isScanned: false, url: msg.url });
      } else if (msg.type === 'MSG_START_SCAN') {
        scanCallbacks.push(callback);
      }
    });

    await act(async () => {
      root.render(<TestComponent />);
    });

    // First scan triggered (Request 1)
    await act(async () => {
      hookResult?.triggerScan(true);
    });

    // User triggers second scan immediately (Request 2)
    await act(async () => {
      hookResult?.triggerScan(true);
    });

    expect(scanCallbacks.length).toBe(2);

    const result1: ScanResult = { id: 'scan_1', url: 'https://react.dev/', domain: 'react.dev', timestamp: 100, engineEvaluationDurationMs: 1, scanDurationMs: 1, technologies: [], stats: { total: 0, high: 0, medium: 0, low: 0 } };
    const result2: ScanResult = { id: 'scan_2', url: 'https://react.dev/', domain: 'react.dev', timestamp: 200, engineEvaluationDurationMs: 1, scanDurationMs: 1, technologies: [], stats: { total: 0, high: 0, medium: 0, low: 0 } };

    // Request 2 completes first
    await act(async () => {
      scanCallbacks[1]({ type: 'MSG_SCAN_SUCCESS', result: result2 });
    });
    expect(hookResult?.result?.id).toBe('scan_2');

    // Stale Request 1 completes later
    await act(async () => {
      scanCallbacks[0]({ type: 'MSG_SCAN_SUCCESS', result: result1 });
    });

    // D4 Request ID guard drops Request 1 and preserves newer Request 2
    expect(hookResult?.result?.id).toBe('scan_2');
    cleanup();
  });

  it('4. Tab on brave://extensions classifies as RESTRICTED_URL, never claims TAB_NOT_FOUND, and dispatches zero scan messages', async () => {
    let hookResult: ReturnType<typeof useScanner> | undefined;

    const TestComponent = () => {
      hookResult = useScanner();
      return (
        <div>
          <span data-testid="error-code">{hookResult.error?.code || 'none'}</span>
          <span data-testid="error-msg">{hookResult.error?.message || 'none'}</span>
        </div>
      );
    };

    // Tab is on brave://extensions
    mockTabsQuery.mockResolvedValue([{ id: 102, url: 'brave://extensions/' }]);

    await act(async () => {
      root.render(<TestComponent />);
    });

    expect(hookResult?.error).toBeDefined();
    expect(hookResult?.error?.code).toBe('RESTRICTED_URL');
    expect(hookResult?.error?.code).not.toBe('TAB_NOT_FOUND');
    expect(hookResult?.error?.message).toContain('SiteStack inspects regular websites');
    expect(mockSendMessage).not.toHaveBeenCalled();
    cleanup();
  });

  it('5. Tab on chrome://extensions with browser-redacted URL classifies as RESTRICTED_URL instead of TAB_NOT_FOUND', async () => {
    let hookResult: ReturnType<typeof useScanner> | undefined;

    const TestComponent = () => {
      hookResult = useScanner();
      return <div>Test</div>;
    };

    // Browser returned valid tab ID but omitted url due to activeTab policy restriction
    mockTabsQuery.mockResolvedValue([{ id: 103, url: undefined, pendingUrl: undefined }]);

    await act(async () => {
      root.render(<TestComponent />);
    });

    expect(hookResult?.error).toBeDefined();
    expect(hookResult?.error?.code).toBe('RESTRICTED_URL');
    expect(hookResult?.error?.code).not.toBe('TAB_NOT_FOUND');
    expect(hookResult?.error?.message).toContain('SiteStack inspects regular websites');
    expect(mockSendMessage).not.toHaveBeenCalled();
    cleanup();
  });

  it('6. Genuinely absent tab (empty query array) accurately reports TAB_NOT_FOUND', async () => {
    let hookResult: ReturnType<typeof useScanner> | undefined;

    const TestComponent = () => {
      hookResult = useScanner();
      return <div>Test</div>;
    };

    // No tab returned at all
    mockTabsQuery.mockResolvedValue([]);

    await act(async () => {
      root.render(<TestComponent />);
    });

    expect(hookResult?.error).toBeDefined();
    expect(hookResult?.error?.code).toBe('TAB_NOT_FOUND');
    expect(hookResult?.error?.message).toBe('No active browser tab found to inspect.');
    expect(mockSendMessage).not.toHaveBeenCalled();
    cleanup();
  });
});
