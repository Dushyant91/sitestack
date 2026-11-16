import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';
import {
  sanitizeResourceUrl,
  sanitizeResourceEvidenceString,
  isSensitiveQueryParam,
} from '../../src/shared/url';
import {
  sanitizeScanResult,
  getScanHistory,
  STORAGE_KEY_HISTORY,
} from '../../src/extension/storage/history';
import {
  formatExportJson,
  formatExportCsv,
  formatMultiScanExportCsv,
} from '../../src/popup/utils/export';

describe('Phase 9.5 & 9.6: Critical Evidence Privacy Remediation & Verification', () => {
  const SYNTHETIC_DIRTY_URL =
    'https://example.com/assets/react.production.min.js?token=SECRET123&session_id=SESSION456&utm_source=test&ver=18.3.1';

  // =========================================================================
  // 1. Core Sanitization Utility Tests
  // =========================================================================
  describe('1. Shared URL Sanitization Utility (url.ts)', () => {
    it('1.1. Strips tokens, session IDs, and tracking params while preserving version params', () => {
      const sanitized = sanitizeResourceUrl(SYNTHETIC_DIRTY_URL);
      expect(sanitized).toBe('https://example.com/assets/react.production.min.js?ver=18.3.1');
      expect(sanitized).not.toContain('SECRET123');
      expect(sanitized).not.toContain('SESSION456');
      expect(sanitized).not.toContain('utm_source');
      expect(sanitized).toContain('ver=18.3.1');
    });

    it('1.2. Handles version extraction parameters correctly across frameworks', () => {
      expect(sanitizeResourceUrl('https://example.com/js/jquery.min.js?ver=3.7.1&token=SECRET')).toBe(
        'https://example.com/js/jquery.min.js?ver=3.7.1'
      );
      // 'v' parameter is stripped as no production rule relies on it
      expect(sanitizeResourceUrl('https://example.com/css/bootstrap.min.css?v=5.3.0&session_id=SESS')).toBe(
        'https://example.com/css/bootstrap.min.css'
      );
      expect(sanitizeResourceUrl('https://www.googletagmanager.com/gtag/js?id=G-12345&utm_source=ad')).toBe(
        'https://www.googletagmanager.com/gtag/js?id=G-12345'
      );
      expect(sanitizeResourceUrl('https://www.googletagmanager.com/gtm.js?id=GTM-ABCDE&auth=SECRET_KEY')).toBe(
        'https://www.googletagmanager.com/gtm.js?id=GTM-ABCDE'
      );
      expect(sanitizeResourceUrl('https://www.google-analytics.com/g/collect?tid=G-99999&session_id=123')).toBe(
        'https://www.google-analytics.com/g/collect?tid=G-99999'
      );
    });

    it('1.3. Restricts generic id and tid parameters to confirmed public measurement container IDs', () => {
      // Arbitrary user / account / transaction IDs must be stripped
      expect(sanitizeResourceUrl('https://example.com/script.js?id=user_secret_12345&ver=2.0')).toBe(
        'https://example.com/script.js?ver=2.0'
      );
      expect(sanitizeResourceUrl('https://example.com/script.js?id=987654321')).toBe(
        'https://example.com/script.js'
      );
      // 'v' parameter and invalid tid are both stripped
      expect(sanitizeResourceUrl('https://example.com/payment.js?tid=txn_checkout_888&v=1.2')).toBe(
        'https://example.com/payment.js'
      );

      // Public GTM and GA4 measurement container tags must be preserved
      expect(sanitizeResourceUrl('https://example.com/tag.js?id=GTM-TEST123')).toBe(
        'https://example.com/tag.js?id=GTM-TEST123'
      );
      expect(sanitizeResourceUrl('https://example.com/collect?tid=G-MEASURE456')).toBe(
        'https://example.com/collect?tid=G-MEASURE456'
      );
      expect(sanitizeResourceUrl('https://example.com/analytics.js?id=UA-12345-1')).toBe(
        'https://example.com/analytics.js?id=UA-12345-1'
      );
    });

    it('1.4. Correctly handles edge cases: mixed-case, encoded, duplicate, empty values, and malformed URLs', () => {
      // Mixed-case parameter names
      const mixedCase = 'https://example.com/script.js?TOKEN=SECRET&Session_ID=S123&UTM_SOURCE=t&ver=2.0';
      expect(sanitizeResourceUrl(mixedCase)).toBe('https://example.com/script.js?ver=2.0');

      // Encoded parameter names (%74oken = token)
      const encoded = 'https://example.com/script.js?%74oken=SECRET&session%5fid=S456&ver=2.0';
      expect(sanitizeResourceUrl(encoded)).toBe('https://example.com/script.js?ver=2.0');

      // Duplicate parameters (strips both occurrences of sensitive param)
      const duplicate = 'https://example.com/script.js?token=SEC1&ver=2.0&token=SEC2';
      expect(sanitizeResourceUrl(duplicate)).toBe('https://example.com/script.js?ver=2.0');

      // Empty parameter values
      const emptyVal = 'https://example.com/script.js?token=&session_id=&ver=2.0';
      expect(sanitizeResourceUrl(emptyVal)).toBe('https://example.com/script.js?ver=2.0');

      // Relative URLs
      const relative = '/assets/vendor/react.min.js?token=SECRET123&ver=18.3.1';
      expect(sanitizeResourceUrl(relative)).toBe('/assets/vendor/react.min.js?ver=18.3.1');

      // Bare relative URLs without leading slash
      const bareRelative = 'assets/vendor/react.min.js?token=SECRET123&ver=18.3.1';
      expect(sanitizeResourceUrl(bareRelative)).toBe('assets/vendor/react.min.js?ver=18.3.1');

      // Protocol-relative URLs with valid SemVer
      const protoRel = '//cdn.example.com/lib.js?token=SECRET&ver=1.0';
      expect(sanitizeResourceUrl(protoRel)).toBe('//cdn.example.com/lib.js?ver=1.0');

      // Malformed URL fallback
      const malformed = 'not-a-valid-url?token=SECRET&session=XYZ&ver=1.0';
      expect(sanitizeResourceUrl(malformed)).toBe('not-a-valid-url?ver=1.0');

      // Strips hash fragments
      const withHash = 'https://example.com/app.js?token=SECRET#auth-token-hash';
      expect(sanitizeResourceUrl(withHash)).toBe('https://example.com/app.js');
    });

    it('1.5. Identifies sensitive parameter names accurately without false positives on legitimate words', () => {
      // Sensitive checks
      expect(isSensitiveQueryParam('token')).toBe(true);
      expect(isSensitiveQueryParam('access_token')).toBe(true);
      expect(isSensitiveQueryParam('user_token')).toBe(true);
      expect(isSensitiveQueryParam('app_secret')).toBe(true);
      expect(isSensitiveQueryParam('api_key')).toBe(true);
      expect(isSensitiveQueryParam('session_id')).toBe(true);
      expect(isSensitiveQueryParam('password')).toBe(true);
      expect(isSensitiveQueryParam('fbclid')).toBe(true);
      expect(isSensitiveQueryParam('gclid')).toBe(true);
      expect(isSensitiveQueryParam('utm_campaign')).toBe(true);

      // Phase 9.6.2: 'v' is stripped unconditionally; 'ver' requires valid version value
      expect(isSensitiveQueryParam('v')).toBe(true);
      expect(isSensitiveQueryParam('v', '5.3.0')).toBe(true);
      expect(isSensitiveQueryParam('v', 'SECRET_TOKEN')).toBe(true);
      expect(isSensitiveQueryParam('ver')).toBe(true);
      expect(isSensitiveQueryParam('ver', '')).toBe(true);
      expect(isSensitiveQueryParam('ver', 'user_session_SECRET123')).toBe(true);
      expect(isSensitiveQueryParam('ver', '6.4.2')).toBe(false);
      expect(isSensitiveQueryParam('ver', '11.4.0-dev.20261116')).toBe(false);

      // Non-sensitive arbitrary keys
      expect(isSensitiveQueryParam('version')).toBe(false);
      expect(isSensitiveQueryParam('author')).toBe(false); // contains "auth", but not credential
      expect(isSensitiveQueryParam('page')).toBe(false);
      expect(isSensitiveQueryParam('lang')).toBe(false);
    });

    it('1.6. Sanitizes truncated evidence strings containing residual query parameters', () => {
      const truncatedSource = 'https://example.com/assets/react.min.js?token=SECRET123&session_id=SES...';
      const clean = sanitizeResourceEvidenceString(truncatedSource);
      expect(clean).toBe('https://example.com/assets/react.min.js');
      expect(clean).not.toContain('SECRET123');
      expect(clean).not.toContain('session_id');

      const truncatedWithVer = 'https://example.com/assets/react.min.js?ver=18.3.1&token=SECRET123&session_id=SES...';
      const cleanWithVer = sanitizeResourceEvidenceString(truncatedWithVer);
      expect(cleanWithVer).toBe('https://example.com/assets/react.min.js?ver=18.3.1');
      expect(cleanWithVer).not.toContain('SECRET123');
    });

    it('1.7. Phase 9.6.2: Strictly validates version query parameter (ver) and strips unvalidated v parameter', () => {
      // 1. Preserves valid SemVer and release version strings under ?ver=
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=6.4.2')).toBe(
        'https://example.com/asset.js?ver=6.4.2'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=11.4.0-dev.20261116')).toBe(
        'https://example.com/asset.js?ver=11.4.0-dev.20261116'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=3.7.1')).toBe(
        'https://example.com/asset.js?ver=3.7.1'
      );

      // 2. Strips arbitrary, non-version, or session/token values under ?ver=
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=user_session_SECRET123')).toBe(
        'https://example.com/asset.js'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=token_ABC123')).toBe(
        'https://example.com/asset.js'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=account_private_identifier')).toBe(
        'https://example.com/asset.js'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=')).toBe(
        'https://example.com/asset.js'
      );

      // 3. Strips ?v= unconditionally (no production detection rule relies on it)
      expect(sanitizeResourceUrl('https://example.com/asset.css?v=5.3.0')).toBe(
        'https://example.com/asset.css'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?v=account_private_identifier')).toBe(
        'https://example.com/asset.js'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?v=SECRET_TOKEN')).toBe(
        'https://example.com/asset.js'
      );

      // 4. Mixed-case VER and V parameters
      expect(sanitizeResourceUrl('https://example.com/asset.js?VER=6.4.2')).toBe(
        'https://example.com/asset.js?VER=6.4.2'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?VER=user_session_SECRET123')).toBe(
        'https://example.com/asset.js'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.css?V=5.3.0')).toBe(
        'https://example.com/asset.css'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?V=SECRET_TOKEN')).toBe(
        'https://example.com/asset.js'
      );

      // 5. URL-encoded parameter names and values
      expect(sanitizeResourceUrl('https://example.com/asset.js?%76%65%72=6.4.2')).toBe(
        'https://example.com/asset.js?ver=6.4.2'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=6%2E4%2E2')).toBe(
        'https://example.com/asset.js?ver=6.4.2'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=11%2E4%2E0%2Ddev%2E20261116')).toBe(
        'https://example.com/asset.js?ver=11.4.0-dev.20261116'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?%76%65%72=user%5Fsession%5FSECRET123')).toBe(
        'https://example.com/asset.js'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?%76=5.3.0')).toBe(
        'https://example.com/asset.js'
      );
      expect(sanitizeResourceUrl('https://example.com/asset.js?v=SECRET%5FTOKEN')).toBe(
        'https://example.com/asset.js'
      );

      // 6. Duplicate ver parameters containing both safe and unsafe values
      const dupMixed = sanitizeResourceUrl('https://example.com/asset.js?ver=6.4.2&ver=SECRET_TOKEN');
      expect(dupMixed).toContain('ver=6.4.2');
      expect(dupMixed).not.toContain('SECRET_TOKEN');

      expect(sanitizeResourceUrl('https://example.com/asset.js?ver=SECRET1&ver=SECRET2')).toBe(
        'https://example.com/asset.js'
      );

      const dupValid = sanitizeResourceUrl('https://example.com/asset.js?ver=6.4.2&ver=11.4.0');
      expect(dupValid).toContain('ver=6.4.2');
      expect(dupValid).toContain('ver=11.4.0');

      // 7. Fallback parser on malformed URLs
      const malformedDup = sanitizeResourceUrl('not-a-valid-url?ver=6.4.2&ver=SECRET_TOKEN');
      expect(malformedDup).toContain('ver=6.4.2');
      expect(malformedDup).not.toContain('SECRET_TOKEN');

      expect(sanitizeResourceUrl('not-a-valid-url?v=5.3.0')).toBe('not-a-valid-url');
    });
  });

  // =========================================================================
  // 2. Detection Engine Evaluation Lifecycle (evaluator.ts)
  // =========================================================================
  describe('2. Detection Engine Evidence Creation (evaluator.ts)', () => {
    it('2.1. Sanitizes both source and matchedValue in evidence during evaluation', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com/dashboard?token=PAGE_TOKEN',
        meta: [],
        dom: [{ selector: '[data-reactroot]' }],
        resources: [SYNTHETIC_DIRTY_URL],
        globals: {
          React: { version: '18.3.1' },
        },
      };

      const result = evaluateSignals(signals);
      expect(result).toBeDefined();

      const react = result.technologies.find((t) => t.id === 'react');
      expect(react).toBeDefined();
      expect(react?.confidenceTier).toBe('high');

      const resourceEvidence = react?.evidence.find((e) => e.type === 'resource');
      expect(resourceEvidence).toBeDefined();

      // Verify source is sanitized
      expect(resourceEvidence?.source).not.toContain('SECRET123');
      expect(resourceEvidence?.source).not.toContain('SESSION456');
      expect(resourceEvidence?.source).not.toContain('utm_source');
      expect(resourceEvidence?.source).toContain('ver=18.3.1');

      // Verify matchedValue is sanitized
      expect(resourceEvidence?.matchedValue).not.toContain('SECRET123');
      expect(resourceEvidence?.matchedValue).not.toContain('SESSION456');
      expect(resourceEvidence?.matchedValue).not.toContain('utm_source');
      expect(resourceEvidence?.matchedValue).toBe('https://example.com/assets/react.production.min.js?ver=18.3.1');
    });

    it('2.2. Preserves version extraction accuracy when secrets are present in resource URLs', () => {
      const wpSignals: HarvestedSignals = {
        url: 'https://example-wp.com/store?auth=WP_AUTH',
        meta: [],
        dom: [],
        resources: [
          'https://example-wp.com/wp-includes/js/wp-emoji-release.min.js?ver=6.4.2&token=SECRET_EMOJI_TOKEN',
        ],
        globals: {
          wp: {},
        },
      };

      const wpResult = evaluateSignals(wpSignals);
      const wp = wpResult.technologies.find((t) => t.id === 'wordpress');
      expect(wp).toBeDefined();
      expect(wp?.version).toBe('6.4.2');

      const emojiEvidence = wp?.evidence.find((e) => e.type === 'resource');
      expect(emojiEvidence?.source).not.toContain('SECRET_EMOJI_TOKEN');
      expect(emojiEvidence?.matchedValue).toBe(
        'https://example-wp.com/wp-includes/js/wp-emoji-release.min.js?ver=6.4.2'
      );
    });

    it('2.3. Audits all non-resource evidence types (DOM, global, meta, header, inferred) to ensure zero URL leakage', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com/app?token=SECRET_PAGE',
        resources: [],
        meta: [{ name: 'generator', content: 'WordPress 6.4.2' }],
        dom: [{ selector: '[ng-version]', attribute: 'ng-version', value: '17.2.1' }],
        globals: {
          wp: {},
          React: { version: '18.3.1' },
        },
        headers: {
          server: 'Vercel',
        },
      };

      const result = evaluateSignals(signals);
      expect(result).toBeDefined();

      for (const tech of result.technologies) {
        for (const ev of tech.evidence) {
          if (ev.type !== 'resource') {
            // Non-resource source must be structural selector, global path, or meta tag
            expect(ev.source).not.toContain('http://');
            expect(ev.source).not.toContain('https://');
            expect(ev.source).not.toContain('token=');
            expect(ev.source).not.toContain('SECRET');

            // Non-resource matchedValue must not contain URLs or query parameters
            if (ev.matchedValue) {
              expect(ev.matchedValue).not.toContain('http://');
              expect(ev.matchedValue).not.toContain('https://');
              expect(ev.matchedValue).not.toContain('?');
            }
          }
        }
      }
    });

    it('2.4. End-to-end verification: Unsafe ver and v values are stripped from evidence.source and evidence.matchedValue without corrupting version extraction', () => {
      const wooSignals: HarvestedSignals = {
        url: 'https://example-woo.com/shop?v=UNSAFE_PAGE_V',
        meta: [],
        dom: [{ selector: 'body.woocommerce' }],
        resources: [
          'https://example-woo.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js?ver=11.4.0-dev.20261116&token=SECRET_TOKEN',
          'https://example-woo.com/wp-content/themes/storefront/style.css?v=5.3.0&session_id=SECRET_SESSION',
        ],
        globals: {
          woocommerce_params: {},
        },
      };

      const result = evaluateSignals(wooSignals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');
      expect(woo).toBeDefined();
      expect(woo?.version).toBe('11.4.0-dev.20261116');

      const coreEv = woo?.evidence.find(
        (e) => e.type === 'resource' && e.source.includes('woocommerce.min.js')
      );
      expect(coreEv).toBeDefined();
      expect(coreEv?.source).toContain('ver=11.4.0-dev.20261116');
      expect(coreEv?.source).not.toContain('SECRET_TOKEN');
      expect(coreEv?.matchedValue).toBe(
        'https://example-woo.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js?ver=11.4.0-dev.20261116'
      );
      expect(coreEv?.matchedValue).not.toContain('SECRET_TOKEN');

      // Unsafe ver in emoji script does not leak into evidence or corrupt version extraction
      const unsafeWpSignals: HarvestedSignals = {
        url: 'https://example-wp.com?ver=user_session_SECRET123',
        meta: [],
        dom: [],
        resources: [
          'https://example-wp.com/wp-includes/js/wp-emoji-release.min.js?ver=user_session_SECRET123',
        ],
        globals: {
          wp: {},
        },
      };
      const unsafeWpResult = evaluateSignals(unsafeWpSignals);
      const unsafeWp = unsafeWpResult.technologies.find((t) => t.id === 'wordpress');
      expect(unsafeWp).toBeDefined();
      // Version must NOT be extracted as user_session_SECRET123
      expect(unsafeWp?.version).toBeUndefined();

      const unsafeEv = unsafeWp?.evidence.find((e) => e.type === 'resource');
      expect(unsafeEv?.source).not.toContain('user_session_SECRET123');
      expect(unsafeEv?.matchedValue).not.toContain('user_session_SECRET123');
      expect(unsafeEv?.matchedValue).toBe('https://example-wp.com/wp-includes/js/wp-emoji-release.min.js');
    });
  });

  // =========================================================================
  // 3. Storage Persistence & Legacy Record Sanitization (history.ts)
  // =========================================================================
  describe('3. Storage Sanitization & Legacy Migration (history.ts)', () => {
    let mockStorage: Record<string, unknown> = {};

    beforeEach(() => {
      mockStorage = {};
      (global as unknown as { chrome: unknown }).chrome = {
        storage: {
          local: {
            get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
            set: vi.fn(async (obj: Record<string, unknown>) => {
              Object.assign(mockStorage, obj);
            }),
          },
        },
      };
    });

    it('3.1. Strips sensitive parameters during sanitizeScanResult for fresh records', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com/app?token=SECRET_PAGE',
        meta: [],
        dom: [{ selector: '[data-reactroot]' }],
        resources: [SYNTHETIC_DIRTY_URL],
        globals: { React: { version: '18.3.1' } },
      };

      const freshScan = evaluateSignals(signals);
      const sanitized = sanitizeScanResult(freshScan);
      expect(sanitized).toBeDefined();

      const serialized = JSON.stringify(sanitized);
      expect(serialized).not.toContain('SECRET123');
      expect(serialized).not.toContain('SESSION456');
      expect(serialized).not.toContain('utm_source');
      expect(serialized).not.toContain('SECRET_PAGE');
    });

    it('3.2. Sanitizes legacy history records and persists them back to chrome.storage.local', async () => {
      // Simulate raw legacy storage containing pre-Phase-9.5 unsanitized data
      const legacyDirtyScan = {
        id: 'legacy-scan-1',
        url: 'https://legacy-site.com/checkout?token=OLD_SECRET',
        domain: 'legacy-site.com',
        timestamp: 1700000000000,
        scanDurationMs: 2,
        technologies: [
          {
            id: 'react',
            name: 'React',
            category: 'library',
            version: '18.3.1',
            confidenceScore: 100,
            confidenceTier: 'high',
            detectionType: 'direct',
            icon: '',
            description: '',
            evidence: [
              {
                type: 'resource',
                source: 'https://legacy-site.com/react.js?token=DIRTY_TOKEN_123&session_id=DIRTY_SESS_456&ver=18.3.1',
                matchedValue: 'https://legacy-site.com/react.js?token=DIRTY_TOKEN_123&session_id=DIRTY_SESS_456&ver=18.3.1',
                weight: 35,
              },
            ],
            website: 'https://react.dev',
          },
        ],
        stats: { total: 1, high: 1, medium: 0, low: 0 },
      };

      mockStorage[STORAGE_KEY_HISTORY] = [legacyDirtyScan];

      // Call getScanHistory()
      const retrieved = await getScanHistory();
      expect(retrieved).toHaveLength(1);

      const cleanedScan = retrieved[0];
      const cleanedEv = cleanedScan.technologies[0].evidence[0];

      // 1. In-memory returned data is sanitized
      expect(cleanedEv.source).toBe('https://legacy-site.com/react.js?ver=18.3.1');
      expect(cleanedEv.source).not.toContain('DIRTY_TOKEN_123');
      expect(cleanedEv.matchedValue).toBe('https://legacy-site.com/react.js?ver=18.3.1');
      expect(cleanedEv.matchedValue).not.toContain('DIRTY_TOKEN_123');

      // 2. Proves sanitized records were persisted back to chrome.storage.local
      const storedAfter = mockStorage[STORAGE_KEY_HISTORY] as ScanResult[];
      expect(storedAfter).toBeDefined();
      const storedString = JSON.stringify(storedAfter);
      expect(storedString).not.toContain('DIRTY_TOKEN_123');
      expect(storedString).not.toContain('DIRTY_SESS_456');
      expect(storedString).not.toContain('OLD_SECRET');
      expect(storedString).toContain('ver=18.3.1');

      // 3. Re-reading history returns clean data without restoring old values
      const secondRead = await getScanHistory();
      const secondString = JSON.stringify(secondRead);
      expect(secondString).not.toContain('DIRTY_TOKEN_123');

      // 4. Non-sensitive scan metadata remains completely intact
      expect(secondRead[0].domain).toBe('legacy-site.com');
      expect(secondRead[0].timestamp).toBe(1700000000000);
      expect(secondRead[0].technologies[0].name).toBe('React');
      expect(secondRead[0].technologies[0].version).toBe('18.3.1');
      expect(secondRead[0].stats?.total).toBe(1);
    });
  });

  // =========================================================================
  // 4. Export Sanitization & RFC 4180 Integrity (export.ts)
  // =========================================================================
  describe('4. Export Utilities Sanitization (export.ts)', () => {
    const dirtyScan: ScanResult = {
      id: 'scan-export-test',
      url: 'https://example.com/app?token=PAGE_SECRET',
      domain: 'example.com',
      timestamp: 1700000000000,
      engineEvaluationDurationMs: 1.5,
      scanDurationMs: 1.5,
      technologies: [
        {
          id: 'react',
          name: 'React',
          category: 'library',
          version: '18.3.1',
          confidenceScore: 100,
          confidenceTier: 'high',
          detectionType: 'direct',
          confidenceReason: 'High confidence direct proof',
          isInferred: false,
          icon: '',
          description: '',
          evidence: [
            {
              type: 'resource',
              source: 'https://example.com/react.js?token=SECRET123&session_id=SESSION456&ver=18.3.1',
              matchedValue: 'https://example.com/react.js?token=SECRET123&session_id=SESSION456&ver=18.3.1',
              weight: 35,
            },
          ],
          website: 'https://react.dev',
        },
      ],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    it('4.1. Single-scan JSON export (formatExportJson) sanitizes evidenceSummary', () => {
      const jsonExport = formatExportJson(dirtyScan);
      expect(jsonExport).toBeDefined();

      const tech = jsonExport.technologies[0];
      expect(tech.evidenceSummary[0].source).toBe('https://example.com/react.js?ver=18.3.1');
      expect(tech.evidenceSummary[0].matchedValue).toBe('https://example.com/react.js?ver=18.3.1');

      const jsonStr = JSON.stringify(jsonExport);
      expect(jsonStr).not.toContain('SECRET123');
      expect(jsonStr).not.toContain('SESSION456');
      expect(jsonStr).not.toContain('PAGE_SECRET');
      expect(jsonStr).toContain('ver=18.3.1');
    });

    it('4.2. Single-scan CSV export (formatExportCsv) sanitizes evidenceSummary column with RFC 4180 compliance', () => {
      const csvExport = formatExportCsv(dirtyScan);
      expect(csvExport).toBeDefined();

      // Check header row: exactly 11 columns
      const lines = csvExport.split('\r\n');
      expect(lines).toHaveLength(2);
      expect(lines[0].split(',')).toHaveLength(11);

      // Verify row content
      const row = lines[1];
      expect(row).not.toContain('SECRET123');
      expect(row).not.toContain('SESSION456');
      expect(row).not.toContain('PAGE_SECRET');
      expect(row).toContain('ver=18.3.1');

      // Verify RFC 4180 quotation
      expect(row.startsWith('"example.com"')).toBe(true);
      expect(row.endsWith('"https://react.dev"')).toBe(true);
    });

    it('4.3. Multi-scan CSV export (formatMultiScanExportCsv) sanitizes evidenceSummary across normal and empty scans', () => {
      const emptyScan: ScanResult = {
        id: 'empty-scan-test',
        url: 'https://google.com?token=SEARCH_TOKEN&q=test',
        domain: 'google.com',
        timestamp: 1700000001000,
        engineEvaluationDurationMs: 0.5,
        scanDurationMs: 0.5,
        technologies: [],
        stats: { total: 0, high: 0, medium: 0, low: 0 },
      };

      const multiCsv = formatMultiScanExportCsv([dirtyScan, emptyScan]);
      expect(multiCsv).toBeDefined();

      const lines = multiCsv.split('\r\n');
      expect(lines).toHaveLength(3); // Header + React row + Empty row

      // Headers: exactly 13 columns
      expect(lines[0].split(',')).toHaveLength(13);

      // Row 1 (React): secrets absent, ver=18.3.1 present
      const reactRow = lines[1];
      expect(reactRow).not.toContain('SECRET123');
      expect(reactRow).not.toContain('SESSION456');
      expect(reactRow).not.toContain('PAGE_SECRET');
      expect(reactRow).toContain('ver=18.3.1');

      // Row 2 (Empty scan): SEARCH_TOKEN stripped from URL column
      const emptyRow = lines[2];
      expect(emptyRow).not.toContain('SEARCH_TOKEN');
      expect(emptyRow).toContain('https://google.com/?q=test');
    });
  });

  // =========================================================================
  // 5. End-to-End Synthetic Secret Eradication
  // =========================================================================
  describe('5. End-to-End Synthetic Secret Eradication Verification', () => {
    it('5.1. Proves that all tested synthetic secrets are completely absent from every lifecycle phase', () => {
      const dirtySignals: HarvestedSignals = {
        url: 'https://example.com/page?token=SECRET123&session_id=SESSION456&utm_source=test',
        meta: [],
        dom: [{ selector: '[data-reactroot]' }],
        resources: [SYNTHETIC_DIRTY_URL],
        globals: { React: { version: '18.3.1' } },
      };

      // 1. Evaluation
      const result = evaluateSignals(dirtySignals);

      // 2. Storage sanitize
      const stored = sanitizeScanResult(result);

      // 3. JSON export
      const json = formatExportJson(result);

      // 4. CSV exports
      const csv = formatExportCsv(result);
      const multiCsv = formatMultiScanExportCsv([result]);

      const testTargets = [
        { name: 'ScanResult', data: JSON.stringify(result) },
        { name: 'Storage (sanitizeScanResult)', data: JSON.stringify(stored) },
        { name: 'JSON Export', data: JSON.stringify(json) },
        { name: 'Single CSV Export', data: csv },
        { name: 'Multi CSV Export', data: multiCsv },
      ];

      const forbiddenTokens = ['SECRET123', 'SESSION456', 'utm_source'];

      for (const target of testTargets) {
        for (const token of forbiddenTokens) {
          expect(
            target.data.includes(token),
            `Secret token "${token}" leaked into ${target.name}!`
          ).toBe(false);
        }
      }
    });

    it('5.2. Phase 9.6.2: Proves unsafe ver and v parameters are completely absent from all 8 lifecycle phases', () => {
      const unsafeUrl1 = 'https://example.com/asset.js?ver=user_session_SECRET123';
      const unsafeUrl2 = 'https://example.com/style.css?v=account_private_identifier';
      const safeUrl = 'https://example.com/react.js?ver=18.3.1';

      // 1. Sanitized resource URLs
      const san1 = sanitizeResourceUrl(unsafeUrl1);
      const san2 = sanitizeResourceUrl(unsafeUrl2);
      const sanSafe = sanitizeResourceUrl(safeUrl);
      expect(san1).toBe('https://example.com/asset.js');
      expect(san1).not.toContain('user_session_SECRET123');
      expect(san2).toBe('https://example.com/style.css');
      expect(san2).not.toContain('account_private_identifier');
      expect(sanSafe).toBe('https://example.com/react.js?ver=18.3.1');

      const signals: HarvestedSignals = {
        url: 'https://example.com/page?ver=PAGE_VER_SECRET&v=PAGE_V_SECRET',
        meta: [],
        dom: [{ selector: '[data-reactroot]' }],
        resources: [unsafeUrl1, unsafeUrl2, safeUrl],
        globals: { React: { version: '18.3.1' } },
      };

      // 2. Evaluation / In-memory ScanResult
      const scanResult = evaluateSignals(signals);

      // Verify evidence.source and evidence.matchedValue
      for (const t of scanResult.technologies) {
        for (const e of t.evidence) {
          if (e.type === 'resource') {
            // 2. evidence.source
            expect(e.source).not.toContain('user_session_SECRET123');
            expect(e.source).not.toContain('account_private_identifier');
            // 3. evidence.matchedValue
            if (e.matchedValue) {
              expect(e.matchedValue).not.toContain('user_session_SECRET123');
              expect(e.matchedValue).not.toContain('account_private_identifier');
            }
          }
        }
      }

      // 4. In-memory ScanResult stringified
      const resultStr = JSON.stringify(scanResult);
      expect(resultStr).not.toContain('user_session_SECRET123');
      expect(resultStr).not.toContain('account_private_identifier');
      expect(resultStr).not.toContain('PAGE_VER_SECRET');
      expect(resultStr).not.toContain('PAGE_V_SECRET');

      // 5. Chrome local storage (sanitizeScanResult)
      const stored = sanitizeScanResult(scanResult);
      const storedStr = JSON.stringify(stored);
      expect(storedStr).not.toContain('user_session_SECRET123');
      expect(storedStr).not.toContain('account_private_identifier');
      expect(storedStr).not.toContain('PAGE_VER_SECRET');
      expect(storedStr).not.toContain('PAGE_V_SECRET');

      // 6. Single-scan JSON export
      const jsonExport = formatExportJson(scanResult);
      const jsonStr = JSON.stringify(jsonExport);
      expect(jsonStr).not.toContain('user_session_SECRET123');
      expect(jsonStr).not.toContain('account_private_identifier');
      expect(jsonStr).not.toContain('PAGE_VER_SECRET');
      expect(jsonStr).not.toContain('PAGE_V_SECRET');

      // 7. Single-scan CSV export
      const csvExport = formatExportCsv(scanResult);
      expect(csvExport).not.toContain('user_session_SECRET123');
      expect(csvExport).not.toContain('account_private_identifier');

      // 8. Multi-scan CSV export
      const multiCsv = formatMultiScanExportCsv([scanResult]);
      expect(multiCsv).not.toContain('user_session_SECRET123');
      expect(multiCsv).not.toContain('account_private_identifier');
      expect(multiCsv).not.toContain('PAGE_VER_SECRET');
      expect(multiCsv).not.toContain('PAGE_V_SECRET');
    });
  });
});
