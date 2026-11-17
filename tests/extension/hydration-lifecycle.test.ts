import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { harvestIsolatedSignals } from '../../src/extension/content/isolated-probe';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

/**
 * SiteStack — Hydration Lifecycle Test Suite
 *
 * Verifies how DOM probe signal harvesting behaves across client-side hydration lifecycles.
 * Validates that on-demand scans accurately capture post-hydration state without needing
 * continuous background DOM polling or speculative pre-rendering.
 */
describe('SiteStack Hydration Lifecycle & On-Demand Scan Semantics', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '<head></head><body><div id="root"></div></body>';
  });

  afterEach(() => {
    document.documentElement.innerHTML = '<head></head><body></body>';
  });

  it('1. Pre-Hydration: Server skeleton without utility classes produces 0 Tailwind detections', () => {
    // Initial server-rendered skeleton before client-side hydration mounts
    document.body.innerHTML = `
      <div id="root">
        <div class="app-skeleton">
          <div class="skeleton-header">Loading Header...</div>
          <div class="skeleton-content">Loading Content...</div>
        </div>
      </div>
    `;

    const isolated = harvestIsolatedSignals();
    expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(false);

    const signals: HarvestedSignals = {
      url: 'https://ssr-spa-app.internal/dashboard',
      globals: {},
      dom: isolated.dom,
      meta: isolated.meta,
      resources: ['https://ssr-spa-app.internal/bundle.js'],
    };

    const result = evaluateSignals(signals);
    const tw = result.technologies.find((t) => t.id === 'tailwindcss');
    expect(tw).toBeUndefined();
  });

  it('2. Post-Hydration: Dynamically mounted Tailwind markup is accurately captured on scan', () => {
    // Phase A: Initial server skeleton
    document.body.innerHTML = `
      <div id="root">
        <div class="loading-spinner">Initializing Client Engine...</div>
      </div>
    `;

    // Verify initial probe produces nothing
    const preHydration = harvestIsolatedSignals();
    expect(preHydration.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(false);

    // Phase B: Simulate React/Vue client component hydration mounting into #root
    const rootEl = document.getElementById('root');
    expect(rootEl).not.toBeNull();

    rootEl!.innerHTML = `
      <div class="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-4">
        <header class="border-b border-slate-800 pb-4 flex justify-between items-center">
          <h1 class="text-xl font-bold tracking-tight text-emerald-400">Hydrated Dashboard</h1>
          <button class="px-3.5 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg ring-2 ring-indigo-400/40">
            Action
          </button>
        </header>
        <main class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">Card 1</div>
          <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl">Card 2</div>
        </main>
      </div>
    `;

    // Phase C: On-demand scan triggered by user on settled page
    const postHydration = harvestIsolatedSignals();
    expect(postHydration.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(true);

    const signals: HarvestedSignals = {
      url: 'https://ssr-spa-app.internal/dashboard',
      globals: {},
      dom: postHydration.dom,
      meta: postHydration.meta,
      resources: ['https://ssr-spa-app.internal/bundle.js'],
    };

    const result = evaluateSignals(signals);
    const tw = result.technologies.find((t) => t.id === 'tailwindcss');

    expect(tw).toBeDefined();
    expect(tw?.confidenceScore).toBe(50);
    expect(tw?.confidenceTier).toBe('medium');
    expect(tw?.detectionType).toBe('direct');
  });

  it('3. Delayed Partial Hydration: Preserves zero false positives if classes remain sparse', () => {
    // Client mounts only a few basic components without full Tailwind utility density
    document.body.innerHTML = `
      <div id="root">
        <header class="header">
          <a href="/login" class="hover:underline">Login</a>
        </header>
      </div>
    `;

    const isolated = harvestIsolatedSignals();
    expect(isolated.dom.some((d) => d.selector === 'dom:tailwind-utilities')).toBe(false);

    const signals: HarvestedSignals = {
      url: 'https://ssr-spa-app.internal/login',
      globals: {},
      dom: isolated.dom,
      meta: isolated.meta,
      resources: [],
    };

    const result = evaluateSignals(signals);
    expect(result.technologies.find((t) => t.id === 'tailwindcss')).toBeUndefined();
  });
});
