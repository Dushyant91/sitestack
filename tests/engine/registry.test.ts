import { describe, it, expect } from 'vitest';
import { ALL_RULES, validateRuleRegistry, getRuleById, getRulesByCategory } from '../../src/engine/rules/registry';

describe('Technology Rule Registry', () => {
  it('should pass registry integrity validation with zero schema errors', () => {
    const result = validateRuleRegistry(ALL_RULES);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should contain all required Tier-1 technologies across 8 categories', () => {
    const expectedIds = [
      'wordpress',
      'shopify',
      'webflow',
      'wix',
      'react',
      'nextjs',
      'vue',
      'angular',
      'jquery',
      'bootstrap',
      'tailwindcss',
      'google-analytics',
      'google-tag-manager',
      'hotjar',
      'meta-pixel',
      'hubspot',
      'intercom',
      'woocommerce',
      'stripe',
      'razorpay',
      'cloudflare',
      'vercel',
      'netlify',
    ];

    for (const id of expectedIds) {
      const rule = getRuleById(id);
      expect(rule, `Rule with id "${id}" should exist in ALL_RULES`).toBeDefined();
      expect(rule?.name).toBeTruthy();
      expect(rule?.category).toBeTruthy();
    }
  });

  it('should correctly filter rules by category', () => {
    const cmsRules = getRulesByCategory('cms');
    expect(cmsRules.length).toBeGreaterThanOrEqual(4);
    expect(cmsRules.some((r) => r.id === 'wordpress')).toBe(true);
    expect(cmsRules.some((r) => r.id === 'shopify')).toBe(true);

    const paymentRules = getRulesByCategory('payment');
    expect(paymentRules.length).toBeGreaterThanOrEqual(2);
    expect(paymentRules.some((r) => r.id === 'stripe')).toBe(true);
    expect(paymentRules.some((r) => r.id === 'razorpay')).toBe(true);
  });
});
