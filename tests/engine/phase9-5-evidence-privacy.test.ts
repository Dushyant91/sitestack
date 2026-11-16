import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';
import {
  sanitizeResourceUrl,
  sanitizeResourceEvidenceString,
  isSensitiveQueryParam,
} from '../../src/shared/url';
import {
  sanitizeScanResult,
  normalizeStoredHistory,
} from '../../src/extension/storage/history';
import {
  formatExportJson,
  formatExportCsv,
  formatMultiScanExportCsv,
} from '../../src/popup/utils/export';

describe('Phase 9.5: Critical Evidence URL Privacy Remediation', () => {
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
      expect(sanitizeResourceUrl('https://example.com/css/bootstrap.min.css?v=5.3.0&session_id=SESS')).toBe(
        'https://example.com/css/bootstrap.min.css?v=5.3.0'
      );
      expect(sanitizeResourceUrl('https://www.googletagmanager.com/gtag/js?id=G-12345&utm_source=ad')).toBe(
        'https://www.googletagmanager.com/gtag/js?id=G-12345'
      );
      expect(sanitizeResourceUrl('https://www.googletagmanager.com/gtm.js?id=GTM-ABCDE&auth=SECRET_KEY')).toBe(
        'https://www.googletagmanager.com/gtm.js?id=GTM-ABCDE'
      );
    });

    it('1.3. Correctly handles edge cases: mixed-case, encoded, duplicate, empty values, and malformed URLs', () => {
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

      // Protocol-relative URLs
      const protoRel = '//cdn.example.com/lib.js?token=SECRET&v=1.0';
      expect(sanitizeResourceUrl(protoRel)).toBe('//cdn.example.com/lib.js?v=1.0');

      // Malformed URL fallback
      const malformed = 'not-a-valid-url?token=SECRET&session=XYZ&ver=1.0';
      expect(sanitizeResourceUrl(malformed)).toBe('not-a-valid-url?ver=1.0');

      // Strips hash fragments
      const withHash = 'https://example.com/app.js?token=SECRET#auth-token-hash';
      expect(sanitizeResourceUrl(withHash)).toBe('https://example.com/app.js');
    });

    it('1.4. Identifies sensitive parameter names accurately without false positives on legitimate words', () => {
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

      // Safe parameter checks
      expect(isSensitiveQueryParam('ver')).toBe(false);
      expect(isSensitiveQueryParam('v')).toBe(false);
      expect(isSensitiveQueryParam('version')).toBe(false);
      expect(isSensitiveQueryParam('id')).toBe(false);
      expect(isSensitiveQueryParam('tid')).toBe(false);
      expect(isSensitiveQueryParam('author')).toBe(false); // contains "auth", but not credential
      expect(isSensitiveQueryParam('page')).toBe(false);
      expect(isSensitiveQueryParam('lang')).toBe(false);
    });

    it('1.5. Sanitizes truncated evidence strings containing residual query parameters', () => {
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
  });

  // =========================================================================
  // 3. Storage Persistence & Legacy Record Sanitization (history.ts)
  // =========================================================================
  describe('3. Storage Sanitization & Legacy Migration (history.ts)', () => {
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

    it('3.2. Sanitizes legacy history records containing unsanitized evidence on read/migration', () => {
      // Construct a legacy scan result simulating pre-Phase-9.5 storage containing raw secrets
      const legacyDirtyScan = {
        id: 'legacy-scan-1',
        url: 'https://legacy-site.com/checkout?token=OLD_SECRET',
        domain: 'legacy-site.com',
        timestamp: Date.now() - 100000,
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
      };

      // When legacy records are read via normalizeStoredHistory
      const loadedHistory = normalizeStoredHistory([legacyDirtyScan]);
      expect(loadedHistory).toHaveLength(1);

      const cleanedScan = loadedHistory[0];
      const cleanedEv = cleanedScan.technologies[0].evidence[0];

      // Verify legacy evidence was sanitized upon hydration
      expect(cleanedEv.source).toBe('https://legacy-site.com/react.js?ver=18.3.1');
      expect(cleanedEv.source).not.toContain('DIRTY_TOKEN_123');
      expect(cleanedEv.source).not.toContain('DIRTY_SESS_456');

      expect(cleanedEv.matchedValue).toBe('https://legacy-site.com/react.js?ver=18.3.1');
      expect(cleanedEv.matchedValue).not.toContain('DIRTY_TOKEN_123');
      expect(cleanedEv.matchedValue).not.toContain('DIRTY_SESS_456');

      const fullString = JSON.stringify(cleanedScan);
      expect(fullString).not.toContain('DIRTY_TOKEN_123');
      expect(fullString).not.toContain('DIRTY_SESS_456');
      expect(fullString).not.toContain('OLD_SECRET');
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
          evidence: [
            {
              type: 'resource',
              source: 'https://example.com/react.js?token=SECRET123&session_id=SESSION456&ver=18.3.1',
              matchedValue: 'https://example.com/react.js?token=SECRET123&session_id=SESSION456&ver=18.3.1',
              weight: 35,
            },
          ],
          icon: '',
          description: '',
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
  });
});
