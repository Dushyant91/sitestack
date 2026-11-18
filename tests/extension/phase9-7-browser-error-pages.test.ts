import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateScannableUrl, ScanError } from '../../src/shared/messages';
import { harvestIsolatedSignals, IsolatedProbePayload } from '../../src/extension/content/isolated-probe';
import { performTabScan } from '../../src/extension/background/service-worker';
import * as storageHistory from '../../src/extension/storage/history';

describe('Phase 9.7: Browser Error Page vs. Empty Scan Classification Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. URL Scheme & Pre-Validation Checks
  // =========================================================================
  describe('1. URL Pre-Validation (validateScannableUrl)', () => {
    it('1.1. Categorizes chrome-error:// and edge-error:// as PAGE_UNAVAILABLE instead of generic unsupported scheme', () => {
      const errorUrls = [
        'chrome-error://chromewebdata/',
        'chrome-error://chromewebdata/main',
        'edge-error://chromewebdata/',
        'brave-error://chromewebdata/',
      ];

      for (const url of errorUrls) {
        const result = validateScannableUrl(url);
        expect(result.scannable, `URL "${url}" should not be scannable`).toBe(false);
        expect(result.code).toBe('PAGE_UNAVAILABLE');
        expect(result.message).toContain('website failed to load or connection was lost');
      }
    });

    it('1.2. Categorizes chrome://, brave://, and browser internal pages as RESTRICTED_URL without injecting scripts', () => {
      const restrictedUrls = [
        'chrome://extensions/',
        'chrome://settings/',
        'chrome://flags/',
        'brave://extensions/',
        'brave://settings/',
        'brave://shields/',
        'chrome-extension://abcdefghijklmnop/popup.html',
        'about:blank',
        'edge://settings/',
        'https://chromewebstore.google.com/detail/sitestack',
        '',
        '   ',
      ];

      for (const url of restrictedUrls) {
        const result = validateScannableUrl(url);
        expect(result.scannable).toBe(false);
        expect(result.code).toBe('RESTRICTED_URL');
        expect(result.message).toContain('Browser internal and system pages cannot be analyzed');
        expect(result.message).toContain('SiteStack inspects regular websites');
      }

      // Undefined URL (e.g. when browser omits URL on protected page)
      const undefResult = validateScannableUrl(undefined);
      expect(undefResult.scannable).toBe(false);
      expect(undefResult.code).toBe('RESTRICTED_URL');
      expect(undefResult.message).toContain('SiteStack inspects regular websites');
    });

    it('1.3. Allows standard HTTP and HTTPS websites through pre-validation', () => {
      expect(validateScannableUrl('https://example.com').scannable).toBe(true);
      expect(validateScannableUrl('http://nonexistent-domain-12345.org').scannable).toBe(true);
      expect(validateScannableUrl('https://react.dev').scannable).toBe(true);
    });
  });

  // =========================================================================
  // 2. In-Page Error Document Detection (harvestIsolatedSignals)
  // =========================================================================
  describe('2. In-Page Error Document Detection (harvestIsolatedSignals)', () => {
    it('2.1. Returns clean payload on an ordinary HTML page without error markers', () => {
      // Simulate clean DOM
      document.body.innerHTML = `
        <header><h1>Welcome to Clean Site</h1></header>
        <main><p>A simple website with no known frameworks.</p></main>
      `;

      const payload = harvestIsolatedSignals();
      expect(payload.isErrorPage).toBeFalsy();
      expect(payload.errorCode).toBeUndefined();
      expect(payload.dom).toEqual([]);
    });

    it('2.2. Detects Chromium error page marker .error-code with DNS_PROBE_FINISHED_NXDOMAIN', () => {
      document.body.innerHTML = `
        <div id="main-frame-error" class="interstitial-wrapper">
          <div class="error-code">DNS_PROBE_FINISHED_NXDOMAIN</div>
        </div>
      `;

      const payload = harvestIsolatedSignals();
      expect(payload.isErrorPage).toBe(true);
      expect(payload.errorCode).toBe('DNS_PROBE_FINISHED_NXDOMAIN');
      expect(payload.meta).toEqual([]);
      expect(payload.dom).toEqual([]);
      expect(payload.resources).toEqual([]);
    });

    it('2.3. Detects Chromium error page marker .error-code with ERR_NAME_NOT_RESOLVED', () => {
      document.body.innerHTML = `
        <div id="main-frame-error">
          <div class="error-code">ERR_NAME_NOT_RESOLVED</div>
        </div>
      `;

      const payload = harvestIsolatedSignals();
      expect(payload.isErrorPage).toBe(true);
      expect(payload.errorCode).toBe('ERR_NAME_NOT_RESOLVED');
    });

    it('2.4. Detects Chromium offline connection error ERR_INTERNET_DISCONNECTED', () => {
      document.body.innerHTML = `
        <div id="main-frame-error">
          <div jscontent="errorCode" class="error-code">ERR_INTERNET_DISCONNECTED</div>
        </div>
      `;

      const payload = harvestIsolatedSignals();
      expect(payload.isErrorPage).toBe(true);
      expect(payload.errorCode).toBe('ERR_INTERNET_DISCONNECTED');
    });

    it('2.5. Detects Chromium TLS/SSL certificate security error ERR_CERT_COMMON_NAME_INVALID', () => {
      document.body.innerHTML = `
        <div id="main-frame-error">
          <div class="error-code">NET::ERR_CERT_COMMON_NAME_INVALID</div>
        </div>
      `;

      const payload = harvestIsolatedSignals();
      expect(payload.isErrorPage).toBe(true);
      expect(payload.errorCode).toBe('NET::ERR_CERT_COMMON_NAME_INVALID');
    });

    it('2.6. Detects generic main frame error container even if specific error code element is missing', () => {
      document.body.innerHTML = `
        <div id="main-frame-error">
          <p>This site can't be reached</p>
        </div>
      `;

      const payload = harvestIsolatedSignals();
      expect(payload.isErrorPage).toBe(true);
      expect(payload.errorCode).toBe('ERR_CONNECTION_FAILED');
    });
  });

  // =========================================================================
  // 3. Service Worker Scan Pipeline & Error vs. Empty Classification
  // =========================================================================
  describe('3. Service Worker Pipeline (performTabScan)', () => {
    it('3.1. Successfully loaded empty website: Returns successful ScanResult and saves to history', async () => {
      const mockTabId = 101;
      const mockUrl = 'https://empty-test-site.org/';

      const saveSpy = vi.spyOn(storageHistory, 'saveScanToStorage').mockResolvedValue();
      vi.spyOn(storageHistory, 'getCachedScan').mockResolvedValue(null);

      // Mock chrome.scripting.executeScript
      globalThis.chrome = {
        storage: { local: {} },
        scripting: {
          executeScript: vi.fn().mockImplementation((options: { world?: string }) => {
            if (options.world === 'MAIN') {
              return Promise.resolve([{ result: {} }]);
            }
            // Isolated probe returns valid non-error payload with 0 technologies
            const isolated: IsolatedProbePayload = {
              url: mockUrl,
              meta: [{ name: 'viewport', content: 'width=device-width' }],
              dom: [],
              resources: ['https://empty-test-site.org/style.css'],
            };
            return Promise.resolve([{ result: isolated }]);
          }),
        },
      } as unknown as typeof chrome;

      const result = await performTabScan(mockTabId, mockUrl, true);

      expect(result).toBeDefined();
      expect(result.url).toBe(mockUrl);
      expect(result.technologies).toEqual([]);
      expect(result.stats.total).toBe(0);

      // Successfully loaded empty site MUST be saved to history
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        url: mockUrl,
        technologies: [],
      }));
    });

    it('3.2. DNS resolution failure (chrome-error frame rejection): Throws PAGE_UNAVAILABLE and does NOT save to history', async () => {
      const mockTabId = 102;
      const deadHostUrl = 'http://nonexistent-dns-fail-12345.xyz';

      const saveSpy = vi.spyOn(storageHistory, 'saveScanToStorage').mockResolvedValue();
      vi.spyOn(storageHistory, 'getCachedScan').mockResolvedValue(null);

      // In Chrome MV3, executeScript on chrome-error:// frame throws an error
      globalThis.chrome = {
        storage: { local: {} },
        scripting: {
          executeScript: vi.fn().mockRejectedValue(
            new Error('Cannot access contents of url "chrome-error://chromewebdata/". Extension manifest must request permission to access the respective host.')
          ),
        },
      } as unknown as typeof chrome;

      let caughtError: ScanError | null = null;
      try {
        await performTabScan(mockTabId, deadHostUrl, true);
      } catch (err) {
        caughtError = err as ScanError;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError?.code).toBe('PAGE_UNAVAILABLE');
      expect(caughtError?.message).toContain('Website cannot be reached or failed to load');

      // CRITICAL: Must NEVER save an error page to history as an empty scan!
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('3.3. ERR_INTERNET_DISCONNECTED (error document rejection): Throws PAGE_UNAVAILABLE and does NOT save to history', async () => {
      const mockTabId = 103;
      const offlineUrl = 'https://react.dev';

      const saveSpy = vi.spyOn(storageHistory, 'saveScanToStorage').mockResolvedValue();
      vi.spyOn(storageHistory, 'getCachedScan').mockResolvedValue(null);

      globalThis.chrome = {
        storage: { local: {} },
        scripting: {
          executeScript: vi.fn().mockRejectedValue(
            new Error("The frame's document is an error document.")
          ),
        },
      } as unknown as typeof chrome;

      let caughtError: ScanError | null = null;
      try {
        await performTabScan(mockTabId, offlineUrl, true);
      } catch (err) {
        caughtError = err as ScanError;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError?.code).toBe('PAGE_UNAVAILABLE');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('3.4. Browser-generated TLS security error page: Throws PAGE_UNAVAILABLE and does NOT save to history', async () => {
      const mockTabId = 104;
      const tlsFailUrl = 'https://expired-cert-example.com';

      const saveSpy = vi.spyOn(storageHistory, 'saveScanToStorage').mockResolvedValue();
      vi.spyOn(storageHistory, 'getCachedScan').mockResolvedValue(null);

      // In-page probe ran and identified the TLS error page
      globalThis.chrome = {
        storage: { local: {} },
        scripting: {
          executeScript: vi.fn().mockImplementation((options: { world?: string }) => {
            if (options.world === 'MAIN') {
              return Promise.resolve([{ result: {} }]);
            }
            const isolated: IsolatedProbePayload = {
              url: 'chrome-error://chromewebdata/',
              meta: [],
              dom: [],
              resources: [],
              isErrorPage: true,
              errorCode: 'ERR_CERT_COMMON_NAME_INVALID',
            };
            return Promise.resolve([{ result: isolated }]);
          }),
        },
      } as unknown as typeof chrome;

      let caughtError: ScanError | null = null;
      try {
        await performTabScan(mockTabId, tlsFailUrl, true);
      } catch (err) {
        caughtError = err as ScanError;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError?.code).toBe('PAGE_UNAVAILABLE');
      expect(caughtError?.message).toContain('ERR_CERT_COMMON_NAME_INVALID');
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('3.5. Restricted chrome:// page: validateScannableUrl prevents execution before injection', () => {
      const restrictedUrl = 'chrome://extensions/';
      const validation = validateScannableUrl(restrictedUrl);

      expect(validation.scannable).toBe(false);
      expect(validation.code).toBe('RESTRICTED_URL');
      expect(validation.message).toContain('Browser internal and system pages cannot be analyzed');
    });

    it('3.6. Normal website with some failed resource requests: Scans gracefully without misclassification', async () => {
      const mockTabId = 105;
      const mockUrl = 'https://live-website-with-blocked-ads.com/';

      const saveSpy = vi.spyOn(storageHistory, 'saveScanToStorage').mockResolvedValue();
      vi.spyOn(storageHistory, 'getCachedScan').mockResolvedValue(null);

      // The HTML document is 200 OK and loaded React
      // Some third-party tracker resources failed or were blocked by adblockers, but the site itself is healthy
      globalThis.chrome = {
        storage: { local: {} },
        scripting: {
          executeScript: vi.fn().mockImplementation((options: { world?: string }) => {
            if (options.world === 'MAIN') {
              return Promise.resolve([{ result: { React: { version: '18.3.1' } } }]);
            }
            const isolated: IsolatedProbePayload = {
              url: mockUrl,
              meta: [{ name: 'generator', content: 'WordPress 6.4.2' }],
              dom: [{ selector: '[data-reactroot]' }],
              // Only 1 successful script was recorded; other ad/tracker scripts failed
              resources: ['https://live-website-with-blocked-ads.com/assets/app.js'],
            };
            return Promise.resolve([{ result: isolated }]);
          }),
        },
      } as unknown as typeof chrome;

      const result = await performTabScan(mockTabId, mockUrl, true);

      expect(result).toBeDefined();
      expect(result.url).toBe(mockUrl);

      // Technologies from successful document probes must be detected
      const reactTech = result.technologies.find((t) => t.id === 'react');
      expect(reactTech).toBeDefined();

      const wpTech = result.technologies.find((t) => t.id === 'wordpress');
      expect(wpTech).toBeDefined();

      // Must be saved to storage
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });
});
