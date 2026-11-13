import { describe, it, expect } from 'vitest';
import { evaluateSignals } from '../../src/engine/evaluator';
import { HarvestedSignals } from '../../src/engine/types';

describe('Expanded Negative Control & Misleading Signals Test Suite', () => {
  it('Control 1: Clean Vanilla HTML5 page should yield zero detections', () => {
    const vanillaSignals: HarvestedSignals = {
      url: 'https://example-clean.com',
      globals: {
        document: {},
        navigator: {},
      },
      dom: [
        { selector: 'header' },
        { selector: 'main' },
        { selector: 'footer' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A simple personal portfolio.' },
      ],
      resources: [
        'https://example-clean.com/style.css',
        'https://example-clean.com/main.js',
        'https://example-clean.com/avatar.jpg',
      ],
    };

    const result = evaluateSignals(vanillaSignals);
    expect(result.technologies).toEqual([]);
    expect(result.stats.total).toBe(0);
  });

  it('Control 2: Blog article discussing technologies should NOT trigger false positive keyword matches', () => {
    // In this scenario, the page text and headings mention React, Shopify, Next.js, and WordPress,
    // but no actual runtime globals, generator tags, or framework scripts exist.
    const blogArticleSignals: HarvestedSignals = {
      url: 'https://techblog.com/comparing-react-and-wordpress',
      globals: {},
      dom: [
        { selector: 'article' },
        { selector: 'h1' }, // "Why We Migrated from WordPress and Shopify to Next.js and React"
        { selector: 'p' },
        { selector: 'code' },
      ],
      meta: [
        {
          name: 'description',
          content: 'A comprehensive guide comparing React, Next.js, WordPress, Shopify, and Stripe for 2025.',
        },
        {
          name: 'keywords',
          content: 'react, nextjs, wordpress, shopify, stripe, razorpay, analytics',
        },
      ],
      resources: [
        'https://techblog.com/assets/blog.css',
        'https://techblog.com/assets/syntax-highlighter.js',
      ],
    };

    const result = evaluateSignals(blogArticleSignals);
    expect(result.technologies).toEqual([]);
    expect(result.stats.total).toBe(0);
  });

  it('Control 3: Misleading class names and IDs should NOT trigger false positives', () => {
    // Developers occasionally name classes with framework-like words
    const misleadingDomSignals: HarvestedSignals = {
      url: 'https://custom-built-site.com',
      globals: {},
      dom: [
        { selector: 'div.react-styled-card' },
        { selector: 'button.shopify-add-to-cart' },
        { selector: 'span.wordpress-post-tag' },
        { selector: '#fake-stripe-payment-modal' },
        { selector: 'section.tailwind-like-container' },
      ],
      meta: [
        { name: 'author', content: 'React & Shopify Consultant' },
      ],
      resources: [
        'https://custom-built-site.com/app.css',
        'https://custom-built-site.com/bundle.js',
      ],
    };

    const result = evaluateSignals(misleadingDomSignals);
    expect(result.technologies).toEqual([]);
    expect(result.stats.total).toBe(0);
  });

  it('Control 4: Stale comments and non-generator meta tags must be ignored', () => {
    const staleCommentsSignals: HarvestedSignals = {
      url: 'https://migrated-site.com',
      globals: {},
      dom: [],
      meta: [
        // NOT a generator tag
        { name: 'generator-info', content: 'Was WordPress in 2018' },
        { property: 'og:description', content: 'Check out our Shopify collection' },
      ],
      resources: [
        'https://migrated-site.com/static/style.css',
      ],
    };

    const result = evaluateSignals(staleCommentsSignals);
    expect(result.technologies).toEqual([]);
    expect(result.stats.total).toBe(0);
  });

  it('Control 5: Pure jQuery legacy site must NOT falsely report React, Next.js, or Vue', () => {
    const jqueryLegacySignals: HarvestedSignals = {
      url: 'https://legacy-site.org',
      globals: {
        jQuery: { fn: { jquery: '3.6.0' } },
        $: { fn: { jquery: '3.6.0' } },
      },
      dom: [
        { selector: 'script[src*="jquery"]' },
      ],
      meta: [],
      resources: [
        'https://code.jquery.com/jquery-3.6.0.min.js',
        'https://legacy-site.org/assets/script.js',
      ],
    };

    const result = evaluateSignals(jqueryLegacySignals);

    // Should detect ONLY jQuery
    expect(result.technologies.length).toBe(1);
    expect(result.technologies[0].id).toBe('jquery');
    expect(result.technologies[0].version).toBe('3.6.0');

    // Must NOT detect modern frameworks
    expect(result.technologies.some((t) => t.id === 'react')).toBe(false);
    expect(result.technologies.some((t) => t.id === 'nextjs')).toBe(false);
    expect(result.technologies.some((t) => t.id === 'vue')).toBe(false);
    expect(result.technologies.some((t) => t.id === 'angular')).toBe(false);
  });

  it('Control 6: Static payment badges and text mentions must NOT detect Stripe without actual scripts/globals', () => {
    const paymentBadgesSignals: HarvestedSignals = {
      url: 'https://merch-store.com',
      globals: {},
      dom: [
        { selector: 'img[alt="We accept Stripe and Razorpay"]' },
      ],
      meta: [],
      resources: [
        'https://merch-store.com/images/stripe-logo.svg',
        'https://merch-store.com/images/razorpay-badge.png',
      ],
    };

    const result = evaluateSignals(paymentBadgesSignals);
    expect(result.technologies.some((t) => t.id === 'stripe')).toBe(false);
    expect(result.technologies.some((t) => t.id === 'razorpay')).toBe(false);
    expect(result.stats.total).toBe(0);
  });
});
