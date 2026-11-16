import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';
import { classifyVersionMaturity, extractVersion } from '../../src/engine/version';
import { getRuleById } from '../../src/engine/rules/registry';
import { formatExportJson, formatMultiScanExportJson } from '../../src/popup/utils/export';

describe('SiteStack Phase 8.4: Real-World Detection Audit Verification', () => {
  // =========================================================================
  // 1. VERCEL CLASSIFICATION & TELEMETRY CALIBRATION
  // =========================================================================
  describe('1. Vercel Telemetry Calibration & Hosting Attribution Safeguards', () => {
    it('1.1. Standalone window.va (Vercel Analytics) is calibrated below noise floor (25 < 30) and does not detect Vercel', () => {
      const signals: HarvestedSignals = {
        url: 'https://example-external.com',
        globals: {
          va: () => {},
        },
        dom: [],
        meta: [],
        resources: [],
      };

      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      // Standalone client-side telemetry must not claim hosting
      expect(vercel).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    it('1.2. Standalone window.si (Vercel Speed Insights) is calibrated below noise floor (25 < 30) and does not detect Vercel on Notion.com', () => {
      const notionSignals: HarvestedSignals = {
        url: 'https://www.notion.com',
        globals: {
          si: () => {},
          __next_f: [1, 2],
        },
        dom: [{ selector: '#__next' }],
        meta: [],
        resources: ['https://www.notion.com/_next/static/chunks/main.js'],
      };

      const result = evaluateSignals(notionSignals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');

      // Next.js detected at High confidence
      expect(nextjs).toBeDefined();
      expect(nextjs?.confidenceTier).toBe('high');

      // Vercel hosting must NOT be falsely attributed to Notion (AWS-hosted) based solely on window.si
      expect(vercel).toBeUndefined();
    });

    it('1.3. Multi-class corroboration (telemetry global + vercel deployment script) elevates Vercel to High confidence', () => {
      const vercelSite: HarvestedSignals = {
        url: 'https://actual-vercel-site.com',
        globals: {
          va: () => {},
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: [
          'https://actual-vercel-site.com/_vercel/insights/script.js',
          'https://actual-vercel-site.com/_vercel/speed-insights/v1/script.js',
        ],
      };

      const result = evaluateSignals(vercelSite);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceTier).toBe('high');
      expect(vercel?.confidenceScore).toBeGreaterThanOrEqual(80);
      expect(vercel?.evidence.some((e) => e.source === 'window.va')).toBe(true);
      expect(vercel?.evidence.some((e) => e.source === 'window.si')).toBe(true);
      expect(vercel?.evidence.some((e) => e.source.includes('_vercel/insights'))).toBe(true);
    });
  });

  // =========================================================================
  // 2. BOOTSTRAP VERSION EXTRACTION (DOCUMENTATION & DIST PATHS)
  // =========================================================================
  describe('2. Bootstrap Version Extraction', () => {
    const bootstrapRule = getRuleById('bootstrap');

    it('2.1. Extracts version 6.0 from documentation/dist CSS path: /docs/6.0/dist/css/bootstrap.min.css', () => {
      const signals: HarvestedSignals = {
        url: 'https://getbootstrap.com/docs/6.0/',
        globals: {},
        dom: [{ selector: 'link[href*="bootstrap"]' }],
        meta: [],
        resources: ['https://getbootstrap.com/docs/6.0/dist/css/bootstrap.min.css'],
      };

      const version = extractVersion(bootstrapRule?.versionExtraction, signals);
      expect(version).toBe('6.0');

      const result = evaluateSignals(signals);
      const bs = result.technologies.find((t) => t.id === 'bootstrap');
      expect(bs).toBeDefined();
      expect(bs?.version).toBe('6.0');
      expect(bs?.versionMaturity).toBe('stable');
    });

    it('2.2. Extracts version 5.3 from documentation/dist JS bundle path: /docs/5.3/dist/js/bootstrap.bundle.min.js', () => {
      const signals: HarvestedSignals = {
        url: 'https://getbootstrap.com/docs/5.3/getting-started/introduction/',
        globals: {},
        dom: [{ selector: 'link[href*="bootstrap"]' }],
        meta: [],
        resources: ['https://getbootstrap.com/docs/5.3/dist/js/bootstrap.bundle.min.js'],
      };

      const version = extractVersion(bootstrapRule?.versionExtraction, signals);
      expect(version).toBe('5.3');
    });

    it('2.3. Continues to extract version from standard npm / CDN patterns (jsdelivr, cdnjs, unpkg)', () => {
      const cdnSignals: HarvestedSignals = {
        url: 'https://example.com',
        globals: {},
        dom: [{ selector: 'link[href*="bootstrap"]' }],
        meta: [],
        resources: [
          'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
        ],
      };

      const version = extractVersion(bootstrapRule?.versionExtraction, cdnSignals);
      expect(version).toBe('5.3.2');
    });

    it('2.4. Continues to extract version from hyphenated asset filename: bootstrap-4.6.0.min.js', () => {
      const hyphenSignals: HarvestedSignals = {
        url: 'https://example.com',
        globals: {},
        dom: [{ selector: 'link[href*="bootstrap"]' }],
        meta: [],
        resources: ['https://example.com/assets/bootstrap-4.6.0.min.js'],
      };

      const version = extractVersion(bootstrapRule?.versionExtraction, hyphenSignals);
      expect(version).toBe('4.6.0');
    });

    it('2.5. Negative: Does not extract version from non-versioned docs path: /docs/latest/dist/css/bootstrap.min.css', () => {
      const signals: HarvestedSignals = {
        url: 'https://getbootstrap.com/docs/latest/',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://getbootstrap.com/docs/latest/dist/css/bootstrap.min.css'],
      };

      const version = extractVersion(bootstrapRule?.versionExtraction, signals);
      expect(version).toBeUndefined();
    });

    it('2.6. Negative: Does not extract version for unrelated CSS in docs path: /docs/6.0/dist/css/custom.css', () => {
      const signals: HarvestedSignals = {
        url: 'https://getbootstrap.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://getbootstrap.com/docs/6.0/dist/css/custom.css'],
      };

      const version = extractVersion(bootstrapRule?.versionExtraction, signals);
      expect(version).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. WOOCOMMERCE CORE SCRIPT PRIORITIZATION & DEVELOPMENT VERSIONS
  // =========================================================================
  describe('3. WooCommerce Core Prioritization & Version Maturity Classification', () => {
    const wooRule = getRuleById('woocommerce');

    it('3.1. Prioritizes WooCommerce core script (7.1.4) over WooCommerce Blocks subpackage (11.4.0-dev.20261116)', () => {
      const signals: HarvestedSignals = {
        url: 'https://woocommerce.com/store',
        globals: {
          woocommerce_params: { ajax_url: '/wp-admin/admin-ajax.php' },
        },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: [
          // Blocks subpackage listed FIRST in resource order
          'https://woocommerce.com/wp-content/plugins/woocommerce/packages/woocommerce-blocks/build/wc-blocks.js?ver=11.4.0-dev.20261116',
          // Core frontend script listed second
          'https://woocommerce.com/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js?ver=7.1.4',
        ],
      };

      const version = extractVersion(wooRule?.versionExtraction, signals);
      expect(version).toBe('7.1.4');

      const result = evaluateSignals(signals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');
      expect(woo).toBeDefined();
      expect(woo?.version).toBe('7.1.4');
      expect(woo?.versionMaturity).toBe('stable');
    });

    it('3.2. Preserves raw development version and classifies maturity as development when only wc-blocks is present', () => {
      const headlessSignals: HarvestedSignals = {
        url: 'https://headless-store.com',
        globals: {
          woocommerce_params: { ajax_url: '/wp-admin/admin-ajax.php' },
        },
        dom: [{ selector: 'body.woocommerce' }],
        meta: [],
        resources: [
          'https://headless-store.com/wp-content/plugins/woocommerce/packages/woocommerce-blocks/build/wc-blocks.js?ver=11.4.0-dev.20261116',
        ],
      };

      const version = extractVersion(wooRule?.versionExtraction, headlessSignals);
      // Raw development tag MUST be completely preserved, NEVER truncated to 11.4.0
      expect(version).toBe('11.4.0-dev.20261116');

      const result = evaluateSignals(headlessSignals);
      const woo = result.technologies.find((t) => t.id === 'woocommerce');
      expect(woo).toBeDefined();
      expect(woo?.version).toBe('11.4.0-dev.20261116');
      expect(woo?.versionMaturity).toBe('development');
    });

    it('3.3. classifyVersionMaturity correctly distinguishes stable, prerelease, development, and unknown versions', () => {
      // Stable
      expect(classifyVersionMaturity('7.1.4')).toBe('stable');
      expect(classifyVersionMaturity('18.3.1')).toBe('stable');
      expect(classifyVersionMaturity('6.0')).toBe('stable');
      expect(classifyVersionMaturity('1.12.4')).toBe('stable');
      expect(classifyVersionMaturity('2.0.0+build.123')).toBe('stable');

      // Development
      expect(classifyVersionMaturity('11.4.0-dev.20261116')).toBe('development');
      expect(classifyVersionMaturity('1.0.0-dev')).toBe('development');
      expect(classifyVersionMaturity('2.1.0-canary.1')).toBe('development');
      expect(classifyVersionMaturity('0.5.0-nightly.20260101')).toBe('development');
      expect(classifyVersionMaturity('3.0.0-snapshot')).toBe('development');

      // Prerelease
      expect(classifyVersionMaturity('14.0.0-rc.2')).toBe('prerelease');
      expect(classifyVersionMaturity('18.3.1-beta.0')).toBe('prerelease');
      expect(classifyVersionMaturity('5.0.0-alpha.1')).toBe('prerelease');
      expect(classifyVersionMaturity('1.0.0-preview.3')).toBe('prerelease');

      // Unknown
      expect(classifyVersionMaturity('GTM-XXXXXXX')).toBe('unknown');
      expect(classifyVersionMaturity('G-XXXXXXXXXX')).toBe('unknown');
      expect(classifyVersionMaturity('')).toBe('unknown');
      expect(classifyVersionMaturity(undefined)).toBe('unknown');
    });
  });

  // =========================================================================
  // 4. JSON EXPORT COMPATIBILITY & DUAL-FIELD SUPPORT
  // =========================================================================
  describe('4. JSON Export Compatibility & Field Semantics', () => {
    const mockScan: ScanResult = {
      domain: 'woocommerce.com',
      url: 'https://woocommerce.com/store?utm_source=test#top',
      timestamp: 1700000000000,
      engineEvaluationDurationMs: 1.25,
      scanDurationMs: 1.25,
      technologies: [
        {
          id: 'woocommerce',
          name: 'WooCommerce',
          category: 'ecommerce',
          version: '7.1.4',
          versionMaturity: 'stable',
          confidenceScore: 90,
          confidenceTier: 'high',
          detectionType: 'direct',
          confidenceReason: 'High confidence (Direct)',
          evidence: [{ type: 'resource', source: 'woocommerce.min.js', weight: 60 }],
          website: 'https://woocommerce.com',
          icon: '/tech-icons/ecommerce/woocommerce.svg',
          description: 'Ecommerce platform for WordPress',
        },
      ],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    it('4.1. Single-scan JSON export provides both canonical technologyWebsite and deprecated website alias', () => {
      const payload = formatExportJson(mockScan);

      // Root-level fields
      expect(payload.scannedWebsite).toBe('woocommerce.com');
      expect(payload.domain).toBe('woocommerce.com'); // Backward compatibility
      expect(payload.url).toBe('https://woocommerce.com/store'); // Clean URL
      expect(payload.engineEvaluationDurationMs).toBe(1.25);
      expect(payload.scanDurationMs).toBe(1.25);

      // Technology-level fields
      const tech = payload.technologies[0];
      expect(tech.scannedWebsite).toBe('woocommerce.com');
      expect(tech.technology).toBe('WooCommerce');
      expect(tech.technologyWebsite).toBe('https://woocommerce.com');
      expect(tech.website).toBe('https://woocommerce.com'); // Backward-compatible alias
      expect(tech.version).toBe('7.1.4');
    });

    it('4.2. Multi-scan JSON export maintains dual technologyWebsite / website fields across all scans', () => {
      const multiPayload = formatMultiScanExportJson([mockScan]);

      expect(multiPayload.totalScans).toBe(1);
      const firstScan = multiPayload.scans[0];
      expect(firstScan.scannedWebsite).toBe('woocommerce.com');
      expect(firstScan.domain).toBe('woocommerce.com');
      expect(firstScan.engineEvaluationDurationMs).toBe(1.25);
      expect(firstScan.scanDurationMs).toBe(1.25);

      const tech = firstScan.technologies[0];
      expect(tech.technologyWebsite).toBe('https://woocommerce.com');
      expect(tech.website).toBe('https://woocommerce.com');
    });
  });

  // =========================================================================
  // 5. ENGINE EVALUATION DURATION SPECIFICATION
  // =========================================================================
  describe('5. Engine Evaluation Duration Metrics', () => {
    it('5.1. evaluateSignals populates engineEvaluationDurationMs equal to scanDurationMs', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [],
      };

      const result = evaluateSignals(signals);

      expect(typeof result.engineEvaluationDurationMs).toBe('number');
      expect(typeof result.scanDurationMs).toBe('number');
      expect(result.engineEvaluationDurationMs).toBe(result.scanDurationMs);
      expect(result.engineEvaluationDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('5.2. formatExportJson preserves engineEvaluationDurationMs when scanResult supplies it', () => {
      const scanWithBoth: ScanResult = {
        domain: 'example.com',
        url: 'https://example.com',
        timestamp: Date.now(),
        engineEvaluationDurationMs: 2.34,
        scanDurationMs: 2.34,
        technologies: [],
        stats: { total: 0, high: 0, medium: 0, low: 0 },
      };

      const exported = formatExportJson(scanWithBoth);
      expect(exported.engineEvaluationDurationMs).toBe(2.34);
      expect(exported.scanDurationMs).toBe(2.34);
    });
  });
});
