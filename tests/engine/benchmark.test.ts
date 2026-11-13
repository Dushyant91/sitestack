import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

describe('Performance & Execution Benchmark', () => {
  it('should benchmark scan evaluation latency across 100 iterations against a heavy site stack', () => {
    // Realistic multi-technology site signals (Next.js, React, Tailwind, Vercel, GA4, GTM, Stripe)
    const heavySiteSignals: HarvestedSignals = {
      url: 'https://high-traffic-ecommerce.com',
      globals: {
        __NEXT_DATA__: { buildId: 'prod_98765' },
        next: { version: '14.2.3' },
        React: { version: '18.3.1' },
        Stripe: {},
        google_tag_manager: {},
        dataLayer: [{ event: 'page_view' }],
        gtag: () => {},
      },
      dom: [
        { selector: '#__next' },
        { selector: 'script#__NEXT_DATA__' },
        { selector: '[data-reactroot]' },
        { selector: 'iframe[src*="js.stripe.com"]' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width' },
      ],
      resources: [
        'https://high-traffic-ecommerce.com/_next/static/chunks/main-app.js',
        'https://high-traffic-ecommerce.com/_next/static/chunks/framework.js',
        'https://high-traffic-ecommerce.com/_next/static/css/styles.css',
        'https://js.stripe.com/v3/',
        'https://www.googletagmanager.com/gtm.js?id=GTM-TEST123',
        'https://www.google-analytics.com/g/collect?v=2',
        'https://high-traffic-ecommerce.com/_vercel/insights/script.js',
      ],
      headers: {
        'x-vercel-id': 'fra1::abc12',
        server: 'Vercel',
      },
    };

    const ITERATIONS = 100;
    const durations: number[] = [];

    // Warm-up run
    evaluateSignals(heavySiteSignals);

    // Benchmarking loop
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const result = evaluateSignals(heavySiteSignals);
      const t1 = performance.now();
      durations.push(t1 - t0);

      // Sanity check detection correctness during benchmark
      expect(result.technologies.length).toBeGreaterThanOrEqual(5);
    }

    // Compute metrics
    durations.sort((a, b) => a - b);
    const min = durations[0];
    const max = durations[durations.length - 1];
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const avg = sum / durations.length;
    const p95 = durations[Math.floor(durations.length * 0.95)];

    // eslint-disable-next-line no-console
    console.log(`\n======================================================`);
    console.log(`[SiteStack Performance Benchmark Report - 100 Runs]`);
    console.log(`  Target Optimization Budget : <= 100.00 ms`);
    console.log(`  Actual Min Execution Time   : ${min.toFixed(3)} ms`);
    console.log(`  Actual Avg Execution Time   : ${avg.toFixed(3)} ms`);
    console.log(`  Actual P95 Execution Time   : ${p95.toFixed(3)} ms`);
    console.log(`  Actual Max Execution Time   : ${max.toFixed(3)} ms`);
    console.log(`======================================================\n`);

    // Strict validation against optimization goal (100ms)
    expect(p95).toBeLessThanOrEqual(100);
    // In fact, it should comfortably run in sub-10ms!
    expect(avg).toBeLessThan(20);
  });
});
