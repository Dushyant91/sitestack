import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';
import { classifyVersionMaturity, extractVersion } from '../../src/engine/version';
import { getRuleById } from '../../src/engine/rules/registry';
import {
  formatExportJson,
  formatExportCsv,
  formatMultiScanExportJson,
  formatMultiScanExportCsv,
} from '../../src/popup/utils/export';
import { sanitizeScanResult } from '../../src/extension/storage/history';

describe('Phase 8.5 Read-Only Audit & Deep Verification', () => {
  // =========================================================================
  // 1. VERCEL HOSTING VS ANALYTICS SCENARIOS
  // =========================================================================
  describe('1. Vercel Hosting vs Analytics Scenarios', () => {
    it('Scenario 1: window.va only', () => {
      const signals: HarvestedSignals = {
        url: 'https://example-external.com',
        globals: { va: () => {} },
        dom: [],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      console.log('Scenario 1 (va only):', {
        detected: !!vercel,
        score: vercel?.confidenceScore,
        tier: vercel?.confidenceTier,
        evidence: vercel?.evidence,
      });

      expect(vercel).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    it('Scenario 2: window.si only', () => {
      const signals: HarvestedSignals = {
        url: 'https://notion.com',
        globals: { si: () => {} },
        dom: [],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      console.log('Scenario 2 (si only):', {
        detected: !!vercel,
        score: vercel?.confidenceScore,
        tier: vercel?.confidenceTier,
        evidence: vercel?.evidence,
      });

      expect(vercel).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    it('Scenario 3: window.va + /_vercel/insights/', () => {
      const signals: HarvestedSignals = {
        url: 'https://external-aws-site.com',
        globals: { va: () => {} },
        dom: [],
        meta: [],
        resources: ['https://external-aws-site.com/_vercel/insights/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      console.log('Scenario 3 (va + insights):', {
        detected: !!vercel,
        score: vercel?.confidenceScore,
        tier: vercel?.confidenceTier,
        evidenceClasses: vercel?.evidence.map((e) => e.type),
        evidence: vercel?.evidence,
        confidenceReason: vercel?.confidenceReason,
      });

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
    });

    it('Scenario 4: window.si + /_vercel/insights/', () => {
      const signals: HarvestedSignals = {
        url: 'https://external-aws-site.com',
        globals: { si: () => {} },
        dom: [],
        meta: [],
        resources: ['https://external-aws-site.com/_vercel/insights/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      console.log('Scenario 4 (si + insights):', {
        detected: !!vercel,
        score: vercel?.confidenceScore,
        tier: vercel?.confidenceTier,
        evidenceClasses: vercel?.evidence.map((e) => e.type),
        evidence: vercel?.evidence,
      });

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
    });

    it('Scenario 5: Vercel deployment evidence without analytics globals', () => {
      // What if an app is deployed on Vercel or has /_vercel/insights/ without globals?
      const signals: HarvestedSignals = {
        url: 'https://actual-vercel.app',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://actual-vercel.app/_vercel/insights/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      console.log('Scenario 5 (resource without globals):', {
        detected: !!vercel,
        score: vercel?.confidenceScore,
        tier: vercel?.confidenceTier,
        evidence: vercel?.evidence,
      });

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(35);
      expect(vercel?.confidenceTier).toBe('low');
      expect(vercel?.confidenceReason).toContain('Indicates client-side telemetry or service integration, not confirmed server infrastructure hosting.');
    });

    it('Scenario 6: An externally hosted website using Vercel Analytics', () => {
      // E.g. A site hosted on Netlify or AWS using @vercel/analytics client package
      const signals: HarvestedSignals = {
        url: 'https://my-aws-app.com',
        globals: { va: () => {} },
        dom: [],
        meta: [],
        resources: [
          'https://my-aws-app.com/assets/bundle.js',
          'https://my-aws-app.com/_vercel/insights/script.js',
        ],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      console.log('Scenario 6 (external with Vercel analytics):', {
        detected: !!vercel,
        score: vercel?.confidenceScore,
        tier: vercel?.confidenceTier,
        evidenceClasses: vercel?.evidence.map((e) => e.type),
      });

      // Crucial safeguard: Capped at 69 (Medium), never claims High hosting
      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
    });
  });

  // =========================================================================
  // 2. VERSION MATURITY LIFECYCLE
  // =========================================================================
  describe('2. Version Maturity Lifecycle', () => {
    it('2.1. Classifies all version formats accurately', () => {
      // Stable
      expect(classifyVersionMaturity('7.1.4')).toBe('stable');
      expect(classifyVersionMaturity('18.3.1')).toBe('stable');
      expect(classifyVersionMaturity('6.0')).toBe('stable');
      expect(classifyVersionMaturity('1.12.4')).toBe('stable');
      expect(classifyVersionMaturity('2.0.0+build.123')).toBe('stable');

      // Prerelease
      expect(classifyVersionMaturity('14.0.0-rc.2')).toBe('prerelease');
      expect(classifyVersionMaturity('18.3.1-beta.0')).toBe('prerelease');
      expect(classifyVersionMaturity('5.0.0-alpha.1')).toBe('prerelease');
      expect(classifyVersionMaturity('1.0.0-preview.3')).toBe('prerelease');

      // Development
      expect(classifyVersionMaturity('11.4.0-dev.20261116')).toBe('development');
      expect(classifyVersionMaturity('1.0.0-dev')).toBe('development');
      expect(classifyVersionMaturity('2.1.0-canary.1')).toBe('development');
      expect(classifyVersionMaturity('0.5.0-nightly.20260101')).toBe('development');
      expect(classifyVersionMaturity('3.0.0-snapshot')).toBe('development');

      // Unknown
      expect(classifyVersionMaturity('GTM-XXXXXXX')).toBe('unknown');
      expect(classifyVersionMaturity('G-XXXXXXXXXX')).toBe('unknown');
      expect(classifyVersionMaturity('')).toBe('unknown');
      expect(classifyVersionMaturity(undefined)).toBe('unknown');
    });

    it('2.2. Traces versionMaturity through rule evaluation, DetectedTechnology, and ScanResult', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: {
          React: { version: '18.3.1-beta.0' },
        },
        dom: [{ selector: '[data-reactroot]' }],
        meta: [],
        resources: ['https://example.com/react.js'],
      };

      const result = evaluateSignals(signals);
      const react = result.technologies.find((t) => t.id === 'react');

      expect(react?.version).toBe('18.3.1-beta.0');
      expect(react?.versionMaturity).toBe('prerelease');
    });

    it('2.3. Traces versionMaturity through storage sanitization and handles legacy records without versionMaturity', () => {
      // Record WITH versionMaturity
      const modernRecord = {
        domain: 'example.com',
        url: 'https://example.com',
        timestamp: 1700000000000,
        scanDurationMs: 1.0,
        engineEvaluationDurationMs: 1.0,
        technologies: [
          {
            id: 'react',
            name: 'React',
            category: 'library',
            version: '18.3.1',
            versionMaturity: 'stable',
            confidenceScore: 90,
            confidenceTier: 'high',
            detectionType: 'direct',
            evidence: [],
          },
        ],
      };
      const sanitizedModern = sanitizeScanResult(modernRecord);
      expect(sanitizedModern?.technologies[0].versionMaturity).toBe('stable');

      // Legacy record WITHOUT versionMaturity
      const legacyRecord = {
        domain: 'legacy.com',
        url: 'https://legacy.com',
        timestamp: 1600000000000,
        scanDurationMs: 0.8,
        technologies: [
          {
            id: 'jquery',
            name: 'jQuery',
            category: 'library',
            version: '1.12.4',
            // No versionMaturity field
            confidenceScore: 80,
            confidenceTier: 'high',
            detectionType: 'direct',
            evidence: [],
          },
        ],
      };
      const sanitizedLegacy = sanitizeScanResult(legacyRecord);
      expect(sanitizedLegacy).not.toBeNull();
      expect(sanitizedLegacy?.technologies[0].version).toBe('1.12.4');
      expect(sanitizedLegacy?.technologies[0].versionMaturity).toBeUndefined(); // Gracefully handles omission
    });

    it('2.4. Explicitly inspects whether JSON and CSV export schemas include or omit versionMaturity', () => {
      const mockScan: ScanResult = {
        domain: 'example.com',
        url: 'https://example.com',
        timestamp: 1700000000000,
        scanDurationMs: 1.0,
        engineEvaluationDurationMs: 1.0,
        technologies: [
          {
            id: 'woocommerce',
            name: 'WooCommerce',
            category: 'ecommerce',
            version: '11.4.0-dev.20261116',
            versionMaturity: 'development',
            confidenceScore: 90,
            confidenceTier: 'high',
            detectionType: 'direct',
            evidence: [],
            website: 'https://woocommerce.com',
            icon: '',
            description: '',
          },
        ],
        stats: { total: 1, high: 1, medium: 0, low: 0 },
      };

      const jsonPayload = formatExportJson(mockScan);
      const csvString = formatExportCsv(mockScan);

      console.log('JSON export technology keys:', Object.keys(jsonPayload.technologies[0]));
      console.log('CSV header columns:', csvString.split('\r\n')[0]);

      // REPORT FINDING: ExportRecordJson now includes optional versionMaturity
      const jsonHasMaturity = 'versionMaturity' in jsonPayload.technologies[0];
      const csvHasMaturity = csvString.includes('versionMaturity');

      expect(jsonHasMaturity).toBe(true);
      expect(csvHasMaturity).toBe(false);

      // Verify that version itself is present
      expect(jsonPayload.technologies[0].version).toBe('11.4.0-dev.20261116');
      expect(csvString).toContain('11.4.0-dev.20261116');
    });
  });

  // =========================================================================
  // 3. WOOCOMMERCE REGRESSION
  // =========================================================================
  describe('3. WooCommerce Regression Suite', () => {
    const wooRule = getRuleById('woocommerce');

    it('3.1. Core version only', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { woocommerce_params: {} },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: [
          'https://example.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js?ver=7.1.4',
        ],
      };
      const version = extractVersion(wooRule?.versionExtraction, signals);
      expect(version).toBe('7.1.4');
      expect(classifyVersionMaturity(version)).toBe('stable');
    });

    it('3.2. Blocks development version only', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { woocommerce_params: {} },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: [
          'https://example.com/wp-content/plugins/woocommerce/packages/woocommerce-blocks/build/wc-blocks.js?ver=11.4.0-dev.20261116',
        ],
      };
      const version = extractVersion(wooRule?.versionExtraction, signals);
      expect(version).toBe('11.4.0-dev.20261116');
      expect(classifyVersionMaturity(version)).toBe('development');
    });

    it('3.3. Core and Blocks versions together (Blocks listed FIRST in resource order)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { woocommerce_params: {} },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: [
          'https://example.com/wp-content/plugins/woocommerce/packages/woocommerce-blocks/build/wc-blocks.js?ver=11.4.0-dev.20261116',
          'https://example.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js?ver=7.1.4',
        ],
      };
      const version = extractVersion(wooRule?.versionExtraction, signals);
      expect(version).toBe('7.1.4'); // Core version prioritized!
      expect(classifyVersionMaturity(version)).toBe('stable');
    });

    it('3.4. Multiple conflicting resource versions', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { woocommerce_params: {} },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: [
          'https://example.com/wp-content/plugins/woocommerce/packages/woocommerce-admin/dist/app/index.js?ver=3.3.0',
          'https://example.com/wp-content/plugins/woocommerce/packages/woocommerce-blocks/build/wc-blocks.js?ver=11.4.0-dev.20261116',
          'https://example.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js?ver=7.1.4',
        ],
      };
      const version = extractVersion(wooRule?.versionExtraction, signals);
      expect(version).toBe('7.1.4'); // Core version STILL prioritized!
      expect(classifyVersionMaturity(version)).toBe('stable');
    });

    it('3.5. Missing core version (falls back to auxiliary script version)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { woocommerce_params: {} },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: [
          'https://example.com/wp-content/plugins/woocommerce/packages/woocommerce-admin/dist/app/index.js?ver=3.3.0',
        ],
      };
      const version = extractVersion(wooRule?.versionExtraction, signals);
      expect(version).toBe('3.3.0');
      expect(classifyVersionMaturity(version)).toBe('stable');
    });
  });

  // =========================================================================
  // 4. BOOTSTRAP REGRESSION
  // =========================================================================
  describe('4. Bootstrap Regression Suite', () => {
    const bootstrapRule = getRuleById('bootstrap');

    it('Verifies all requested Bootstrap patterns and negative controls', () => {
      // 1. /bootstrap@5.3.0/
      const s1: HarvestedSignals = {
        url: 'https://example.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js'],
      };
      expect(extractVersion(bootstrapRule?.versionExtraction, s1)).toBe('5.3.0');

      // 2. /bootstrap-5.3.0/
      const s2: HarvestedSignals = {
        url: 'https://example.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://example.com/vendor/bootstrap-5.3.0/css/bootstrap.min.css'],
      };
      expect(extractVersion(bootstrapRule?.versionExtraction, s2)).toBe('5.3.0');

      // 3. /docs/6.0/dist/css/bootstrap.min.css
      const s3: HarvestedSignals = {
        url: 'https://getbootstrap.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://getbootstrap.com/docs/6.0/dist/css/bootstrap.min.css'],
      };
      expect(extractVersion(bootstrapRule?.versionExtraction, s3)).toBe('6.0');

      // 4. /docs/5.3/dist/js/bootstrap.bundle.min.js
      const s4: HarvestedSignals = {
        url: 'https://getbootstrap.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://getbootstrap.com/docs/5.3/dist/js/bootstrap.bundle.min.js'],
      };
      expect(extractVersion(bootstrapRule?.versionExtraction, s4)).toBe('5.3');

      // 5. /docs/latest/dist/css/bootstrap.min.css (Negative: no version)
      const s5: HarvestedSignals = {
        url: 'https://getbootstrap.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://getbootstrap.com/docs/latest/dist/css/bootstrap.min.css'],
      };
      expect(extractVersion(bootstrapRule?.versionExtraction, s5)).toBeUndefined();

      // 6. /docs/6.0/dist/css/custom.css (Negative: not bootstrap)
      const s6: HarvestedSignals = {
        url: 'https://getbootstrap.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://getbootstrap.com/docs/6.0/dist/css/custom.css'],
      };
      expect(extractVersion(bootstrapRule?.versionExtraction, s6)).toBeUndefined();
    });
  });

  // =========================================================================
  // 5. EXPORT REGRESSION
  // =========================================================================
  describe('5. Export Regression Suite', () => {
    it('5.1. JSON remains valid, parseable, and preserves all canonical and backward-compatible fields', () => {
      const mockScan: ScanResult = {
        domain: 'notion.com',
        url: 'https://notion.com/product/docs?utm_source=test#intro',
        timestamp: 1700000000000,
        engineEvaluationDurationMs: 1.45,
        scanDurationMs: 1.45,
        technologies: [
          {
            id: 'nextjs',
            name: 'Next.js',
            category: 'framework',
            version: '16.4.2',
            versionMaturity: 'stable',
            confidenceScore: 100,
            confidenceTier: 'high',
            detectionType: 'direct',
            confidenceReason: 'High confidence (Direct)',
            evidence: [{ type: 'resource', source: 'main-app.js', weight: 60 }],
            website: 'https://nextjs.org',
            icon: '/tech-icons/frameworks/nextjs.svg',
            description: 'React framework',
          },
        ],
        stats: { total: 1, high: 1, medium: 0, low: 0 },
      };

      const payload = formatExportJson(mockScan);
      const jsonStr = JSON.stringify(payload);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.scannedWebsite).toBe('notion.com');
      expect(parsed.domain).toBe('notion.com');
      expect(parsed.url).toBe('https://notion.com/product/docs');
      expect(parsed.engineEvaluationDurationMs).toBe(1.45);
      expect(parsed.scanDurationMs).toBe(1.45);

      const tech = parsed.technologies[0];
      expect(tech.scannedWebsite).toBe('notion.com');
      expect(tech.technology).toBe('Next.js');
      expect(tech.technologyWebsite).toBe('https://nextjs.org');
      expect(tech.website).toBe('https://nextjs.org');
    });

    it('5.2. CSV handles commas, quotation marks, and newlines in text fields', () => {
      const mockScanWithSpecialChars: ScanResult = {
        domain: 'special-chars.com',
        url: 'https://special-chars.com',
        timestamp: 1700000000000,
        engineEvaluationDurationMs: 0.5,
        scanDurationMs: 0.5,
        technologies: [
          {
            id: 'custom-tech',
            name: 'Custom, "Special" Tech',
            category: 'library',
            version: '1.0.0',
            confidenceScore: 75,
            confidenceTier: 'medium',
            detectionType: 'direct',
            confidenceReason: 'Verified by "custom, signal" with\r\nnewlines and commas.',
            evidence: [
              {
                type: 'global',
                source: 'window["custom,key"]',
                weight: 50,
                matchedValue: 'val with "quotes" and, commas\nnewline',
              },
            ],
            website: 'https://special-chars.com',
            icon: '',
            description: '',
          },
        ],
        stats: { total: 1, high: 0, medium: 1, low: 0 },
      };

      const csv = formatExportCsv(mockScanWithSpecialChars);
      const multiCsv = formatMultiScanExportCsv([mockScanWithSpecialChars]);

      // Verify that quotes inside values are escaped with double-double-quotes according to RFC 4180
      expect(csv).toContain('""Special""');
      expect(multiCsv).toContain('""Special""');
      expect(csv).toContain('""custom, signal""');
    });

    it('5.3. Empty scans export correctly in single and multi-scan modes', () => {
      const emptyScan: ScanResult = {
        domain: 'empty-site.com',
        url: 'https://empty-site.com/subpage?param=1#section',
        timestamp: 1700000000000,
        engineEvaluationDurationMs: 0.25,
        scanDurationMs: 0.25,
        technologies: [],
        stats: { total: 0, high: 0, medium: 0, low: 0 },
      };

      // Single scan JSON
      const json = formatExportJson(emptyScan);
      expect(json.scannedWebsite).toBe('empty-site.com');
      expect(json.technologies).toEqual([]);

      // Single scan CSV
      const csv = formatExportCsv(emptyScan);
      const csvLines = csv.trim().split('\r\n');
      expect(csvLines.length).toBe(1); // Only header row

      // Multi-scan JSON
      const multiJson = formatMultiScanExportJson([emptyScan]);
      expect(multiJson.totalScans).toBe(1);
      expect(multiJson.scans[0].technologies).toEqual([]);

      // Multi-scan CSV: Must emit exactly 1 row with 13 columns (domain, date, url, 10 empty tech fields)
      const multiCsv = formatMultiScanExportCsv([emptyScan]);
      const multiCsvLines = multiCsv.trim().split('\r\n');
      expect(multiCsvLines.length).toBe(2); // Header + 1 empty scan row
      const dataRowColumns = multiCsvLines[1].split(',');
      expect(dataRowColumns.length).toBe(13);
      expect(dataRowColumns[0]).toBe('"empty-site.com"');
      expect(dataRowColumns[2]).toBe('"https://empty-site.com/subpage?param=1"');
      expect(dataRowColumns[3]).toBe('""'); // Empty technology name
    });

    it('5.4. engineEvaluationDurationMs and scanDurationMs remain strictly consistent', () => {
      const signals: HarvestedSignals = {
        url: 'https://latency-check.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      expect(result.engineEvaluationDurationMs).toBe(result.scanDurationMs);

      const json = formatExportJson(result);
      expect(json.engineEvaluationDurationMs).toBe(json.scanDurationMs);
    });
  });
});
