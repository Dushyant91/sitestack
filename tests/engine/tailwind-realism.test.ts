import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { harvestIsolatedSignals } from '../../src/extension/content/isolated-probe';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

/**
 * SiteStack — Tailwind CSS Test Realism & Coverage Suite
 *
 * Verifies end-to-end detection behavior connecting the isolated DOM content probe
 * (`harvestIsolatedSignals`) to the scoring evaluator (`evaluateSignals`) using authentic,
 * local HTML fixtures.
 *
 * Note on Test Realism:
 * - Production-bundled fixture uses authentic minified CSS compiled offline via Tailwind CLI v3.4.19.
 * - CDN tests distinguish JSDOM simulated ResourceTiming entries from live browser network capture.
 * - Zero production code or scoring logic is modified; detection rules remain frozen.
 */
describe('SiteStack Tailwind CSS Detection Realism Suite', () => {
  let originalGetEntriesByType: typeof performance.getEntriesByType | undefined;

  beforeEach(() => {
    document.documentElement.innerHTML = '<head></head><body></body>';
    originalGetEntriesByType = performance.getEntriesByType;
  });

  afterEach(() => {
    if (originalGetEntriesByType) {
      performance.getEntriesByType = originalGetEntriesByType;
    }
    document.documentElement.innerHTML = '<head></head><body></body>';
  });

  // Helper to load fixture HTML directly into document
  function loadFixture(fixtureName: string): string {
    const filePath = path.resolve(__dirname, '../fixtures', fixtureName);
    const html = fs.readFileSync(filePath, 'utf-8');
    document.documentElement.innerHTML = html;
    return html;
  }

  // =========================================================================
  // 1. Production-Built Tailwind Application (End-to-End Probe -> Evaluator)
  // =========================================================================
  it('1. Detects production-built Tailwind app via DOM probe and verifies 50% Medium calibration', () => {
    loadFixture('tailwind-production-app.html');

    // Run the unmocked isolated content script probe
    const isolated = harvestIsolatedSignals();

    // Verify probe output
    expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(true);

    // Build signals payload representing a production bundled app
    const signals: HarvestedSignals = {
      url: 'https://cloudpulse-analytics.internal/dashboard',
      globals: {},
      dom: isolated.dom,
      meta: isolated.meta,
      resources: ['https://cloudpulse-analytics.internal/assets/tailwind-built.css'],
    };

    // Run evaluator
    const result = evaluateSignals(signals);
    const tw = result.technologies.find((t) => t.id === 'tailwindcss');

    expect(tw).toBeDefined();
    expect(tw?.category).toBe('library');
    expect(tw?.detectionType).toBe('direct');
    // In production bundled apps, hashed CSS filename does not match /tailwind...css/,
    // so detection relies strictly on DOM utility patterns calibrated to 50 pts (Medium).
    expect(tw?.confidenceScore).toBe(50);
    expect(tw?.confidenceTier).toBe('medium');
    expect(tw?.confidenceReason).toContain('Verified by dom:tailwind-utilities, but lacks multi-class corroboration');
  });

  // =========================================================================
  // 2. Tailwind CDN Resource Detection (Simulated ResourceTiming -> Evaluator)
  // =========================================================================
  it('2. Detects Tailwind CDN runtime script via ResourceTiming and achieves 100% High confidence', () => {
    loadFixture('tailwind-play-cdn.html');

    // JSDOM Test Harness Distinction:
    // In a live browser, performance.getEntriesByType('resource') is populated by the browser network stack.
    // In JSDOM, we provide the PerformanceResourceTiming entry to the performance object,
    // and verify that harvestIsolatedSignals() harvests and deduplicates it without modification.
    const mockResourceEntry = {
      name: 'https://cdn.tailwindcss.com/3.4.1',
      entryType: 'resource',
      startTime: 12.5,
      duration: 35.2,
    } as PerformanceResourceTiming;

    performance.getEntriesByType = ((type: string) => {
      if (type === 'resource') {
        return [mockResourceEntry];
      }
      return [];
    }) as unknown as typeof performance.getEntriesByType;

    // Run probe
    const isolated = harvestIsolatedSignals();

    // Verify both DOM utility extraction and resource extraction in probe
    expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(true);
    expect(isolated.resources).toContain('https://cdn.tailwindcss.com/3.4.1');

    // Evaluate signals directly from probe output
    const signals: HarvestedSignals = {
      url: 'https://play.tailwindcss.internal',
      globals: {},
      dom: isolated.dom,
      meta: isolated.meta,
      resources: isolated.resources,
    };

    const result = evaluateSignals(signals);
    const tw = result.technologies.find((t) => t.id === 'tailwindcss');

    expect(tw).toBeDefined();
    // Multi-class corroboration: dom (50) + resource (50) * 1.15 multiplier = 115 -> capped at 100% High
    expect(tw?.confidenceScore).toBe(100);
    expect(tw?.confidenceTier).toBe('high');
    expect(tw?.detectionType).toBe('direct');
    expect(tw?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'dom', source: 'dom:tailwind-utilities' }),
        expect.objectContaining({ type: 'resource', source: 'https://cdn.tailwindcss.com/3.4.1' }),
      ])
    );
  });

  // =========================================================================
  // 3. Combined Inline CSS Variables and DOM Utility Classes (SSR Critical CSS)
  // =========================================================================
  it('3. Extracts inline CSS variables (--tw-) and utility classes, enforcing the 60pt single-class ceiling', () => {
    loadFixture('tailwind-inline-ssr.html');

    // Run probe
    const isolated = harvestIsolatedSignals();

    // Verify probe captured all three DOM signals from style tags and markup
    const selectors = isolated.dom.map((d) => d.selector);
    expect(selectors).toContain('style:has-text(--tw-)');
    expect(selectors).toContain('style:has-text(--tw-ring-offset-shadow)');
    expect(selectors).toContain('dom:tailwind-utilities');

    const signals: HarvestedSignals = {
      url: 'https://ssr-tailwind-app.internal',
      globals: {},
      dom: isolated.dom,
      meta: isolated.meta,
      resources: isolated.resources,
    };

    const result = evaluateSignals(signals);
    const tw = result.technologies.find((t) => t.id === 'tailwindcss');

    expect(tw).toBeDefined();
    // Calculation: Primary (55) + Secondary (50 + 45) * 0.4 = 93 -> capped at CLASS_CAPS.dom (60)
    expect(tw?.confidenceScore).toBe(60);
    expect(tw?.confidenceTier).toBe('medium');
    expect(tw?.detectionType).toBe('direct');
  });

  // =========================================================================
  // 4. Negative Control: Clean Bootstrap 5.3 Site
  // =========================================================================
  it('4. Negative Control: Bootstrap 5.3 site produces ZERO Tailwind false positives', () => {
    loadFixture('negative-control-bootstrap5.html');

    const isolated = harvestIsolatedSignals();

    // Assert isolated probe rejects generic utility markup
    expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(false);

    const signals: HarvestedSignals = {
      url: 'https://bootstrap-portal.internal',
      globals: {},
      dom: isolated.dom,
      meta: isolated.meta,
      resources: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'],
    };

    const result = evaluateSignals(signals);
    const tw = result.technologies.find((t) => t.id === 'tailwindcss');
    const bs = result.technologies.find((t) => t.id === 'bootstrap');

    // Bootstrap must be detected, Tailwind must be completely absent
    expect(bs).toBeDefined();
    expect(tw).toBeUndefined();
  });

  // =========================================================================
  // 5. Negative Control: Sparse Tailwind-like Classes (< 3 matches)
  // =========================================================================
  it('5. Negative Control: Sparse utility classes (< 3 distinct matches) do not trigger Tailwind', () => {
    loadFixture('negative-control-sparse-tw.html');

    const isolated = harvestIsolatedSignals();

    // Insufficient utility density must not emit signal
    expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(false);

    const signals: HarvestedSignals = {
      url: 'https://editorial-magazine.internal',
      globals: {},
      dom: isolated.dom,
      meta: isolated.meta,
      resources: isolated.resources,
    };

    const result = evaluateSignals(signals);
    const tw = result.technologies.find((t) => t.id === 'tailwindcss');
    expect(tw).toBeUndefined();
  });
});
