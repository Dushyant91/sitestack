import { describe, it, expect } from 'vitest';
import {
  formatMultiScanExportCsv,
  formatMultiScanExportJson,
} from '../../src/popup/utils/export';
import { ScanResult } from '../../src/engine/types';

describe('Phase 8.3: Multi-Scan CSV Empty Scan Representation Suite', () => {
  const normalScanNotion: ScanResult = {
    url: 'https://notion.com/product',
    domain: 'notion.com',
    timestamp: 1731590000000,
    scanDurationMs: 1.2,
    technologies: [
      {
        id: 'nextjs',
        name: 'Next.js',
        category: 'framework',
        version: '16.4.2',
        confidenceScore: 100,
        confidenceTier: 'high',
        detectionType: 'direct',
        isInferred: false,
        confidenceReason: 'High confidence (Direct): Corroborated across 2 independent signal classes.',
        evidence: [{ type: 'global', source: 'window.__next_f', weight: 60 }],
        website: 'https://nextjs.org',
        icon: '',
        description: '',
      },
      {
        id: 'react',
        name: 'React',
        category: 'library',
        confidenceScore: 75,
        confidenceTier: 'medium',
        detectionType: 'inferred',
        parentDependency: 'Next.js',
        isInferred: true,
        confidenceReason: 'Architectural dependency: Inferred because Next.js requires React.',
        evidence: [{ type: 'inferred', source: 'Architectural dependency of Next.js', weight: 75 }],
        website: 'https://react.dev',
        icon: '',
        description: '',
      },
    ],
    stats: { total: 2, high: 1, medium: 1, low: 0 },
  };

  const emptyScanYouTube: ScanResult = {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=share',
    domain: 'youtube.com',
    timestamp: 1731590500000,
    scanDurationMs: 0.45,
    technologies: [],
    stats: { total: 0, high: 0, medium: 0, low: 0 },
  };

  const normalScanShopify: ScanResult = {
    url: 'https://shopify.com/store',
    domain: 'shopify.com',
    timestamp: 1731591000000,
    scanDurationMs: 1.1,
    technologies: [
      {
        id: 'shopify',
        name: 'Shopify',
        category: 'ecommerce',
        confidenceScore: 30,
        confidenceTier: 'low',
        detectionType: 'direct',
        isInferred: false,
        confidenceReason: 'Low confidence (Direct): Standalone CDN asset.',
        evidence: [{ type: 'resource', source: 'https://cdn.shopify.com/brand.js', weight: 30 }],
        website: 'https://shopify.com',
        icon: '',
        description: '',
      },
    ],
    stats: { total: 1, high: 0, medium: 0, low: 1 },
  };

  const emptyScanWikipedia: ScanResult = {
    url: 'https://en.wikipedia.org/wiki/Main_Page',
    domain: 'wikipedia.org',
    timestamp: 1731591500000,
    scanDurationMs: 0.35,
    technologies: [],
    stats: { total: 0, high: 0, medium: 0, low: 0 },
  };

  // 1. Multi-scan export with mixed normal and empty scans
  it('1. Emits one row per detected technology and exactly one row for an empty scan', () => {
    const multiCsv = formatMultiScanExportCsv([
      normalScanNotion,
      emptyScanYouTube,
      normalScanShopify,
    ]);
    const lines = multiCsv.split('\r\n').filter((l) => l.trim().length > 0);

    // 1 Header + 2 (Notion) + 1 (YouTube empty) + 1 (Shopify) = 5 rows
    expect(lines.length).toBe(5);

    // Header row
    expect(lines[0]).toBe(
      'scannedWebsite,scanDate,url,technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,technologyWebsite'
    );
  });

  // 2. Correct scannedWebsite, date, and URL on empty-scan row
  it('2. Empty-scan row correctly populates scannedWebsite, scanDate, and normalized url with empty tech fields', () => {
    const multiCsv = formatMultiScanExportCsv([emptyScanYouTube]);
    const lines = multiCsv.split('\r\n').filter((l) => l.trim().length > 0);

    expect(lines.length).toBe(2); // 1 header + 1 empty-scan row
    const emptyRow = lines[1];

    const expectedDate = new Date(emptyScanYouTube.timestamp).toISOString();
    // Normalized URL has utm_source stripped
    const expectedUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    expect(emptyRow).toBe(
      `"youtube.com","${expectedDate}","${expectedUrl}","","","","","","","","","",""`
    );
  });

  // 3. Exactly 13 columns for every row across all scans
  it('3. Guarantees exactly 13 columns for every row (normal technology rows and empty-scan rows)', () => {
    const multiCsv = formatMultiScanExportCsv([
      normalScanNotion,
      emptyScanYouTube,
      normalScanShopify,
      emptyScanWikipedia,
    ]);
    const lines = multiCsv.split('\r\n').filter((l) => l.trim().length > 0);

    expect(lines.length).toBe(6); // 1 header + 2 + 1 + 1 + 1 = 6 rows

    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].match(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g);
      expect(matches).toBeDefined();
      expect(matches?.length).toBe(13);
    }
  });

  // 4. Multiple empty scans in succession
  it('4. Handles multiple empty scans in succession, emitting one row per empty scan', () => {
    const multiCsv = formatMultiScanExportCsv([
      emptyScanYouTube,
      emptyScanWikipedia,
    ]);
    const lines = multiCsv.split('\r\n').filter((l) => l.trim().length > 0);

    expect(lines.length).toBe(3); // 1 header + 2 empty scan rows
    expect(lines[1]).toContain('"youtube.com"');
    expect(lines[2]).toContain('"wikipedia.org"');

    // Technology field (column 4) must be empty, not "None" or "No technologies detected"
    expect(lines[1]).not.toContain('None');
    expect(lines[1]).not.toContain('No technologies detected');
    expect(lines[2]).not.toContain('None');
    expect(lines[2]).not.toContain('No technologies detected');
  });

  // 5. Existing technology rows remain completely unchanged
  it('5. Existing normal technology rows preserve all attributes, scores, and evidence summaries', () => {
    const multiCsvWithEmpty = formatMultiScanExportCsv([
      normalScanNotion,
      emptyScanYouTube,
      normalScanShopify,
    ]);
    const lines = multiCsvWithEmpty.split('\r\n').filter((l) => l.trim().length > 0);

    // Row 1: Next.js on Notion
    expect(lines[1]).toContain('"notion.com"');
    expect(lines[1]).toContain('"Next.js"');
    expect(lines[1]).toContain('"framework"');
    expect(lines[1]).toContain('"16.4.2"');
    expect(lines[1]).toContain('"100"');
    expect(lines[1]).toContain('"high"');
    expect(lines[1]).toContain('"direct"');
    expect(lines[1]).toContain('"https://nextjs.org"');

    // Row 2: Inferred React on Notion
    expect(lines[2]).toContain('"notion.com"');
    expect(lines[2]).toContain('"React"');
    expect(lines[2]).toContain('"library"');
    expect(lines[2]).toContain('"75"');
    expect(lines[2]).toContain('"medium"');
    expect(lines[2]).toContain('"inferred"');
    expect(lines[2]).toContain('"Next.js"');
    expect(lines[2]).toContain('"https://react.dev"');

    // Row 4: Shopify on Shopify.com
    expect(lines[4]).toContain('"shopify.com"');
    expect(lines[4]).toContain('"Shopify"');
    expect(lines[4]).toContain('"ecommerce"');
    expect(lines[4]).toContain('"30"');
    expect(lines[4]).toContain('"low"');
    expect(lines[4]).toContain('"https://shopify.com"');
  });

  // 6. JSON behaviour remains unchanged
  it('6. formatMultiScanExportJson preserves empty scans as technologies: [] without inventing technology entries', () => {
    const multiJson = formatMultiScanExportJson([
      normalScanNotion,
      emptyScanYouTube,
      normalScanShopify,
    ]);

    expect(multiJson.totalScans).toBe(3);
    expect(multiJson.scans.length).toBe(3);

    // Notion scan
    expect(multiJson.scans[0].scannedWebsite).toBe('notion.com');
    expect(multiJson.scans[0].technologies.length).toBe(2);

    // YouTube empty scan
    expect(multiJson.scans[1].scannedWebsite).toBe('youtube.com');
    expect(multiJson.scans[1].technologies).toEqual([]);
    expect(multiJson.scans[1].url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Shopify scan
    expect(multiJson.scans[2].scannedWebsite).toBe('shopify.com');
    expect(multiJson.scans[2].technologies.length).toBe(1);
  });
});
