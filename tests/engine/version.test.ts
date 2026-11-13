import { describe, it, expect } from 'vitest';
import { cleanVersion, getNestedProperty, extractVersion } from '../../src/engine/version';
import { HarvestedSignals, VersionExtractor } from '../../src/engine/types';

describe('Dedicated Version Extraction Engine', () => {
  describe('cleanVersion()', () => {
    it('should normalize standard semantic version strings', () => {
      expect(cleanVersion('14.2.3')).toBe('14.2.3');
      expect(cleanVersion('v18.3.1')).toBe('18.3.1');
      expect(cleanVersion('WordPress 6.4.2')).toBe('6.4.2');
      expect(cleanVersion('3.7.1-beta.1')).toBe('3.7.1-beta.1');
      expect(cleanVersion('2.0.0-rc.3')).toBe('2.0.0-rc.3');
    });

    it('should reject malformed or non-numeric version strings', () => {
      // @ts-expect-error Testing invalid input
      expect(cleanVersion(null)).toBeUndefined();
      // @ts-expect-error Testing invalid input
      expect(cleanVersion(undefined)).toBeUndefined();
      expect(cleanVersion('')).toBeUndefined();
      expect(cleanVersion('latest')).toBeUndefined();
      expect(cleanVersion('canary')).toBeUndefined();
      expect(cleanVersion('undefined')).toBeUndefined();
      expect(cleanVersion('production-build')).toBeUndefined();
      expect(cleanVersion('v')).toBeUndefined();
    });

    it('should handle version prefixes and dirty surroundings', () => {
      expect(cleanVersion('release-v1.2.3-final')).toBe('1.2.3-final');
      expect(cleanVersion('jquery-3.7.1.min.js')).toBe('3.7.1');
    });
  });

  describe('getNestedProperty()', () => {
    it('should safely traverse deep nested object paths', () => {
      const obj = {
        Shopify: {
          theme: {
            version: '12.0.0',
          },
        },
        React: {
          version: '18.3.1',
        },
      };

      expect(getNestedProperty(obj, 'Shopify.theme.version')).toBe('12.0.0');
      expect(getNestedProperty(obj, 'window.Shopify.theme.version')).toBe('12.0.0');
      expect(getNestedProperty(obj, 'React.version')).toBe('18.3.1');
    });

    it('should return undefined safely for missing or non-object paths without throwing', () => {
      const obj = {
        Shopify: null,
        str: 'hello',
      };

      expect(getNestedProperty(obj, 'Shopify.theme.version')).toBeUndefined();
      expect(getNestedProperty(obj, 'str.length.value')).toBeUndefined();
      expect(getNestedProperty(null, 'any.path')).toBeUndefined();
      expect(getNestedProperty(undefined, 'any.path')).toBeUndefined();
      expect(getNestedProperty({}, 'nonexistent')).toBeUndefined();
    });
  });

  describe('extractVersion() edge cases & ambiguous evidence', () => {
    const baseSignals: HarvestedSignals = {
      url: 'https://test.com',
      globals: {},
      dom: [],
      meta: [],
      resources: [],
    };

    it('should return undefined when no VersionExtractor is provided', () => {
      expect(extractVersion(undefined, baseSignals)).toBeUndefined();
    });

    it('should resolve version from Global Window objects', () => {
      const extractor: VersionExtractor = {
        fromGlobal: 'next.version',
      };
      const signals: HarvestedSignals = {
        ...baseSignals,
        globals: { next: { version: '14.2.3' } },
      };
      expect(extractVersion(extractor, signals)).toBe('14.2.3');
    });

    it('should resolve version from Meta tags among multiple conflicting meta tags (ambiguous evidence)', () => {
      const extractor: VersionExtractor = {
        fromMeta: {
          name: 'generator',
          regex: /WordPress\s*([\d.]+)/i,
        },
      };
      const signals: HarvestedSignals = {
        ...baseSignals,
        meta: [
          { name: 'generator', content: 'CustomCMS' },
          { name: 'generator', content: 'WordPress 6.4.2' },
          { name: 'generator', content: 'WooCommerce 8.5.0' },
        ],
      };
      expect(extractVersion(extractor, signals)).toBe('6.4.2');
    });

    it('should resolve version from Resource URLs with capture groups', () => {
      const extractor: VersionExtractor = {
        fromResource: {
          urlRegex: /jquery-([\d.]+)(?:\.min)?\.js/i,
          captureGroup: 1,
        },
      };
      const signals: HarvestedSignals = {
        ...baseSignals,
        resources: [
          'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
          'https://code.jquery.com/jquery-3.7.1.min.js',
        ],
      };
      expect(extractVersion(extractor, signals)).toBe('3.7.1');
    });

    it('should resolve version from DOM attributes', () => {
      const extractor: VersionExtractor = {
        fromDom: {
          selector: '[ng-version]',
          attribute: 'ng-version',
          regex: /([\d.]+)/,
        },
      };
      const signals: HarvestedSignals = {
        ...baseSignals,
        dom: [
          { selector: '[ng-version]', attribute: 'ng-version', value: '17.3.0' },
        ],
      };
      expect(extractVersion(extractor, signals)).toBe('17.3.0');
    });

    it('should return undefined when evidence exists but version pattern does not match', () => {
      const extractor: VersionExtractor = {
        fromMeta: {
          name: 'generator',
          regex: /WordPress\s*([\d.]+)/i,
        },
      };
      const signals: HarvestedSignals = {
        ...baseSignals,
        meta: [
          { name: 'generator', content: 'WordPress' }, // No version number provided
        ],
      };
      expect(extractVersion(extractor, signals)).toBeUndefined();
    });
  });
});
