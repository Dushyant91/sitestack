import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals, ScanResult } from '../../src/engine/types';
import {
  formatExportJson,
  formatExportCsv,
  formatMultiScanExportCsv,
} from '../../src/popup/utils/export';

describe('SiteStack Phase 8.6: Vercel Telemetry Confidence Correction & Export Suite', () => {
  // =========================================================================
  // 1. COMPLETE VERCEL REGRESSION MATRIX (A through J)
  // =========================================================================
  describe('1. Vercel Signal Combinations Matrix (A through J)', () => {
    // Combination A: window.va only
    it('Combination A: window.va only is suppressed below noise floor (25 < 30)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { va: () => {} },
        dom: [],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    // Combination B: window.si only
    it('Combination B: window.si only is suppressed below noise floor (25 < 30)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { si: () => {} },
        dom: [],
        meta: [],
        resources: [],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeUndefined();
      expect(result.technologies.length).toBe(0);
    });

    // Combination C: Vercel Insights resource only
    it('Combination C: Vercel Insights resource only yields Low confidence (35)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://example.com/_vercel/insights/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(35);
      expect(vercel?.confidenceTier).toBe('low');
      expect(vercel?.confidenceReason).toContain('Indicates client-side telemetry or service integration, not confirmed server infrastructure hosting.');
    });

    // Combination D: Vercel Speed Insights resource only
    it('Combination D: Vercel Speed Insights resource only yields Low confidence (35)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: {},
        dom: [],
        meta: [],
        resources: ['https://example.com/_vercel/speed-insights/v1/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(35);
      expect(vercel?.confidenceTier).toBe('low');
      expect(vercel?.confidenceReason).toContain('Indicates client-side telemetry or service integration, not confirmed server infrastructure hosting.');
    });

    // Combination E: window.va + Insights resource
    it('Combination E: window.va + Insights resource yields Medium confidence (69)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { va: () => {} },
        dom: [],
        meta: [],
        resources: ['https://example.com/_vercel/insights/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
      expect(vercel?.confidenceReason).toContain('Medium confidence (Direct)');
    });

    // Combination F: window.si + Speed Insights resource
    it('Combination F: window.si + Speed Insights resource yields Medium confidence (69)', () => {
      const signals: HarvestedSignals = {
        url: 'https://example.com',
        globals: { si: () => {} },
        dom: [],
        meta: [],
        resources: ['https://example.com/_vercel/speed-insights/v1/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
      expect(vercel?.confidenceReason).toContain('Medium confidence (Direct)');
    });

    // Combination G: Both globals + both resource signals
    it('Combination G: Both globals + both resource signals is safely capped at Medium confidence (69)', () => {
      const signals: HarvestedSignals = {
        url: 'https://my-app.com',
        globals: {
          va: () => {},
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: [
          'https://my-app.com/_vercel/insights/script.js',
          'https://my-app.com/_vercel/speed-insights/v1/script.js',
        ],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      // Must NOT produce High confidence (>=80) based solely on client telemetry
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
    });

    // Combination H: Both globals + one resource
    it('Combination H: Both globals + one resource is safely capped at Medium confidence (69)', () => {
      const signals: HarvestedSignals = {
        url: 'https://my-app.com',
        globals: {
          va: () => {},
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: ['https://my-app.com/_vercel/insights/script.js'],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
    });

    // Combination I: Both resources without globals
    it('Combination I: Both resources without globals yields Low confidence (49)', () => {
      const signals: HarvestedSignals = {
        url: 'https://my-app.com',
        globals: {},
        dom: [],
        meta: [],
        resources: [
          'https://my-app.com/_vercel/insights/script.js',
          'https://my-app.com/_vercel/speed-insights/v1/script.js',
        ],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      // Primary (35) + Secondary (35 * 0.4 = 14) = 49 (within 50 resource cap)
      expect(vercel?.confidenceScore).toBe(49);
      expect(vercel?.confidenceTier).toBe('low');
    });

    // Combination J: External hosting with all available Vercel analytics signals
    it('Combination J: External hosting (AWS) with all Vercel analytics never claims High confidence hosting', () => {
      const signals: HarvestedSignals = {
        url: 'https://external-aws-host.com',
        globals: {
          va: () => {},
          si: () => {},
        },
        dom: [],
        meta: [],
        resources: [
          'https://external-aws-host.com/assets/app.js',
          'https://external-aws-host.com/_vercel/insights/script.js',
          'https://external-aws-host.com/_vercel/speed-insights/v1/script.js',
        ],
      };
      const result = evaluateSignals(signals);
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(vercel).toBeDefined();
      // Crucial Beta Requirement: Must NEVER produce High confidence for infrastructure hosting
      expect(vercel?.confidenceScore).toBe(69);
      expect(vercel?.confidenceTier).toBe('medium');
    });

    // Notion Regression
    it('Notion.com Regression: AWS-hosted site with Speed Insights global remains completely free of Vercel detections', () => {
      const notionSignals: HarvestedSignals = {
        url: 'https://www.notion.com',
        globals: {
          si: () => {},
          __next_f: [1, 2, 3],
          next: { version: '16.4.2' },
        },
        dom: [{ selector: '#__next' }],
        meta: [],
        resources: ['https://www.notion.com/_next/static/chunks/main-app.js'],
      };

      const result = evaluateSignals(notionSignals);
      const nextjs = result.technologies.find((t) => t.id === 'nextjs');
      const vercel = result.technologies.find((t) => t.id === 'vercel');

      expect(nextjs).toBeDefined();
      expect(nextjs?.confidenceTier).toBe('high');
      expect(vercel).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. EXPORT JSON DECISION (versionMaturity in JSON, CSV unchanged)
  // =========================================================================
  describe('2. Export Decision Verification (versionMaturity & CSV Schema)', () => {
    const multiMaturityScan: ScanResult = {
      domain: 'test-store.com',
      url: 'https://test-store.com/shop',
      timestamp: 1700000000000,
      engineEvaluationDurationMs: 1.1,
      scanDurationMs: 1.1,
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
          evidence: [],
          website: 'https://woocommerce.com',
          icon: '',
          description: '',
        },
        {
          id: 'nextjs',
          name: 'Next.js',
          category: 'framework',
          version: '15.0.0-rc.1',
          versionMaturity: 'prerelease',
          confidenceScore: 85,
          confidenceTier: 'high',
          detectionType: 'direct',
          evidence: [],
          website: 'https://nextjs.org',
          icon: '',
          description: '',
        },
        {
          id: 'react',
          name: 'React',
          category: 'library',
          version: '19.0.0-dev.2026',
          versionMaturity: 'development',
          confidenceScore: 75,
          confidenceTier: 'medium',
          detectionType: 'direct',
          evidence: [],
          website: 'https://react.dev',
          icon: '',
          description: '',
        },
        {
          id: 'google-tag-manager',
          name: 'Google Tag Manager',
          category: 'analytics',
          version: 'GTM-XXXXXXX',
          versionMaturity: 'unknown',
          confidenceScore: 90,
          confidenceTier: 'high',
          detectionType: 'direct',
          evidence: [],
          website: 'https://tagmanager.google.com',
          icon: '',
          description: '',
        },
        {
          id: 'legacy-lib',
          name: 'Legacy Library',
          category: 'library',
          version: '1.0.0',
          // versionMaturity omitted (simulating legacy scan record)
          confidenceScore: 50,
          confidenceTier: 'medium',
          detectionType: 'direct',
          evidence: [],
          website: 'https://legacy.org',
          icon: '',
          description: '',
        },
      ],
      stats: { total: 5, high: 3, medium: 2, low: 0 },
    };

    it('2.1. JSON export includes versionMaturity for all 4 maturity values and gracefully emits null for legacy records', () => {
      const json = formatExportJson(multiMaturityScan);

      expect(json.technologies[0].technology).toBe('WooCommerce');
      expect(json.technologies[0].version).toBe('7.1.4');
      expect(json.technologies[0].versionMaturity).toBe('stable');

      expect(json.technologies[1].technology).toBe('Next.js');
      expect(json.technologies[1].version).toBe('15.0.0-rc.1');
      expect(json.technologies[1].versionMaturity).toBe('prerelease');

      expect(json.technologies[2].technology).toBe('React');
      expect(json.technologies[2].version).toBe('19.0.0-dev.2026');
      expect(json.technologies[2].versionMaturity).toBe('development');

      expect(json.technologies[3].technology).toBe('Google Tag Manager');
      expect(json.technologies[3].version).toBe('GTM-XXXXXXX');
      expect(json.technologies[3].versionMaturity).toBe('unknown');

      // Legacy record without versionMaturity emits null
      expect(json.technologies[4].technology).toBe('Legacy Library');
      expect(json.technologies[4].versionMaturity).toBeNull();
    });

    it('2.2. Single-scan CSV schema remains strictly 11 columns (unchanged)', () => {
      const csv = formatExportCsv(multiMaturityScan);
      const lines = csv.trim().split('\r\n');
      const headers = lines[0].split(',');

      expect(headers.length).toBe(11);
      expect(headers).toEqual([
        'scannedWebsite',
        'technology',
        'category',
        'version',
        'confidenceScore',
        'confidenceTier',
        'detectionType',
        'parentDependency',
        'confidenceReason',
        'evidenceSummary',
        'technologyWebsite',
      ]);
      expect(headers.includes('versionMaturity')).toBe(false);
    });

    it('2.3. Multi-scan CSV schema remains strictly 13 columns (unchanged)', () => {
      const multiCsv = formatMultiScanExportCsv([multiMaturityScan]);
      const lines = multiCsv.trim().split('\r\n');
      const headers = lines[0].split(',');

      expect(headers.length).toBe(13);
      expect(headers).toEqual([
        'scannedWebsite',
        'scanDate',
        'url',
        'technology',
        'category',
        'version',
        'confidenceScore',
        'confidenceTier',
        'detectionType',
        'parentDependency',
        'confidenceReason',
        'evidenceSummary',
        'technologyWebsite',
      ]);
      expect(headers.includes('versionMaturity')).toBe(false);
    });
  });
});
