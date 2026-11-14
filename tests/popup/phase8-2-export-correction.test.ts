import { describe, it, expect } from 'vitest';
import {
  formatExportJson,
  formatExportCsv,
  formatMultiScanExportJson,
  formatMultiScanExportCsv,
  escapeCsv,
} from '../../src/popup/utils/export';
import { ScanResult } from '../../src/engine/types';

describe('Phase 8.2: Export Field Semantics (scannedWebsite vs technologyWebsite)', () => {
  const sampleScan: ScanResult = {
    url: 'https://notion.com/product/docs?utm_source=twitter&utm_medium=social#overview',
    domain: 'notion.com',
    timestamp: 1731588000000,
    scanDurationMs: 1.45,
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
        confidenceReason: 'High confidence (Direct): Corroborated across 2 independent signal classes (global, dom).',
        evidence: [
          { type: 'global', source: 'window.__next_f', weight: 60 },
          { type: 'dom', source: '#__next', weight: 35 },
        ],
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
        evidence: [
          { type: 'inferred', source: 'Architectural dependency of Next.js', weight: 75 },
        ],
        website: 'https://react.dev',
        icon: '',
        description: '',
      },
    ],
    stats: { total: 2, high: 1, medium: 1, low: 0 },
  };

  // 1. Single-Scan JSON Export
  it('1. Single-scan JSON export provides distinct scannedWebsite and technologyWebsite fields', () => {
    const json = formatExportJson(sampleScan);

    // Root-level fields
    expect(json.scannedWebsite).toBe('notion.com');
    expect(json.domain).toBe('notion.com'); // Backward compatibility
    expect(json.url).toBe('https://notion.com/product/docs'); // Tracking params and hash stripped
    expect(json.scanDurationMs).toBe(1.45);
    expect(json.technologies.length).toBe(2);

    // Direct technology (Next.js)
    const nextjs = json.technologies[0];
    expect(nextjs.scannedWebsite).toBe('notion.com');
    expect(nextjs.technology).toBe('Next.js');
    expect(nextjs.category).toBe('framework');
    expect(nextjs.version).toBe('16.4.2');
    expect(nextjs.confidenceScore).toBe(100);
    expect(nextjs.confidenceTier).toBe('high');
    expect(nextjs.detectionType).toBe('direct');
    expect(nextjs.parentDependency).toBeNull();
    expect(nextjs.technologyWebsite).toBe('https://nextjs.org');
    expect(nextjs.website).toBe('https://nextjs.org'); // Backward compatibility

    // Inferred technology (React)
    const react = json.technologies[1];
    expect(react.scannedWebsite).toBe('notion.com');
    expect(react.technology).toBe('React');
    expect(react.category).toBe('library');
    expect(react.version).toBeNull();
    expect(react.confidenceScore).toBe(75);
    expect(react.confidenceTier).toBe('medium');
    expect(react.detectionType).toBe('inferred');
    expect(react.parentDependency).toBe('Next.js');
    expect(react.technologyWebsite).toBe('https://react.dev');
    expect(react.website).toBe('https://react.dev');
  });

  // 2. Single-Scan CSV Export
  it('2. Single-scan CSV export contains exactly 11 columns with scannedWebsite and technologyWebsite clearly separated', () => {
    const csv = formatExportCsv(sampleScan);
    const lines = csv.split('\r\n').filter((l) => l.trim().length > 0);

    // Header validation
    expect(lines.length).toBe(3); // 1 header + 2 technology rows
    const headerRow = lines[0];
    const expectedHeaders = [
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
    ];
    expect(headerRow.split(',')).toEqual(expectedHeaders);
    expect(expectedHeaders.length).toBe(11);

    // Row 1: Direct technology (Next.js)
    const row1Matches = lines[1].match(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g);
    expect(row1Matches?.length).toBe(11);
    expect(lines[1]).toContain('"notion.com"'); // Column 1: scannedWebsite
    expect(lines[1]).toContain('"Next.js"'); // Column 2: technology
    expect(lines[1]).toContain('"framework"'); // Column 3: category
    expect(lines[1]).toContain('"16.4.2"'); // Column 4: version
    expect(lines[1]).toContain('"100"'); // Column 5: confidenceScore
    expect(lines[1]).toContain('"high"'); // Column 6: confidenceTier
    expect(lines[1]).toContain('"direct"'); // Column 7: detectionType
    expect(lines[1]).toContain('"https://nextjs.org"'); // Column 11: technologyWebsite

    // Row 2: Inferred technology (React)
    const row2Matches = lines[2].match(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g);
    expect(row2Matches?.length).toBe(11);
    expect(lines[2]).toContain('"notion.com"'); // Column 1: scannedWebsite
    expect(lines[2]).toContain('"React"'); // Column 2: technology
    expect(lines[2]).toContain('"inferred"'); // Column 7: detectionType
    expect(lines[2]).toContain('"Next.js"'); // Column 8: parentDependency
    expect(lines[2]).toContain('"https://react.dev"'); // Column 11: technologyWebsite
  });

  // 3. Multi-Scan JSON Export
  it('3. Multi-scan JSON export aggregates multiple scans preserving scannedWebsite and technologyWebsite', () => {
    const scanShopify: ScanResult = {
      url: 'https://shopify.com/store',
      domain: 'shopify.com',
      timestamp: 1731589000000,
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
          confidenceReason: 'Low confidence (Direct): Identified via standalone network asset.',
          evidence: [{ type: 'resource', source: 'https://cdn.shopify.com/brand.js', weight: 30 }],
          website: 'https://shopify.com',
          icon: '',
          description: '',
        },
      ],
      stats: { total: 1, high: 0, medium: 0, low: 1 },
    };

    const multiJson = formatMultiScanExportJson([sampleScan, scanShopify]);
    expect(multiJson.totalScans).toBe(2);
    expect(multiJson.scans.length).toBe(2);

    expect(multiJson.scans[0].scannedWebsite).toBe('notion.com');
    expect(multiJson.scans[0].technologies[0].scannedWebsite).toBe('notion.com');
    expect(multiJson.scans[0].technologies[0].technologyWebsite).toBe('https://nextjs.org');

    expect(multiJson.scans[1].scannedWebsite).toBe('shopify.com');
    expect(multiJson.scans[1].technologies[0].scannedWebsite).toBe('shopify.com');
    expect(multiJson.scans[1].technologies[0].technologyWebsite).toBe('https://shopify.com');
  });

  // 4. Multi-Scan CSV Export
  it('4. Multi-scan CSV export includes scannedWebsite as column 1 and technologyWebsite as column 13', () => {
    const scanShopify: ScanResult = {
      url: 'https://shopify.com/store',
      domain: 'shopify.com',
      timestamp: 1731589000000,
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
          confidenceReason: 'Low confidence (Direct): Identified via standalone network asset.',
          evidence: [{ type: 'resource', source: 'https://cdn.shopify.com/brand.js', weight: 30 }],
          website: 'https://shopify.com',
          icon: '',
          description: '',
        },
      ],
      stats: { total: 1, high: 0, medium: 0, low: 1 },
    };

    const multiCsv = formatMultiScanExportCsv([sampleScan, scanShopify]);
    const lines = multiCsv.split('\r\n').filter((l) => l.trim().length > 0);

    const expectedHeaders = [
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
    ];

    expect(lines[0].split(',')).toEqual(expectedHeaders);
    expect(expectedHeaders.length).toBe(13);
    expect(lines.length).toBe(4); // 1 header + 2 for Notion + 1 for Shopify

    // Check row 1 (Notion Next.js)
    expect(lines[1]).toContain('"notion.com"');
    expect(lines[1]).toContain('"Next.js"');
    expect(lines[1]).toContain('"https://nextjs.org"');

    // Check row 3 (Shopify Shopify)
    expect(lines[3]).toContain('"shopify.com"');
    expect(lines[3]).toContain('"Shopify"');
    expect(lines[3]).toContain('"https://shopify.com"');
  });

  // 5. Empty Scan Handling
  it('5. Empty scan exports valid CSV (11 headers, 0 data rows) and valid JSON with empty technologies array', () => {
    const emptyScan: ScanResult = {
      url: 'https://www.youtube.com',
      domain: 'youtube.com',
      timestamp: Date.now(),
      scanDurationMs: 0.45,
      technologies: [],
      stats: { total: 0, high: 0, medium: 0, low: 0 },
    };

    // CSV
    const csv = formatExportCsv(emptyScan);
    const lines = csv.split('\r\n').filter((l) => l.trim().length > 0);
    expect(lines.length).toBe(1);
    expect(lines[0].split(',').length).toBe(11);
    expect(lines[0]).toBe(
      'scannedWebsite,technology,category,version,confidenceScore,confidenceTier,detectionType,parentDependency,confidenceReason,evidenceSummary,technologyWebsite'
    );

    // JSON
    const json = formatExportJson(emptyScan);
    expect(json.scannedWebsite).toBe('youtube.com');
    expect(json.domain).toBe('youtube.com');
    expect(json.url).toBe('https://www.youtube.com/');
    expect(json.technologies).toEqual([]);
    expect(JSON.parse(JSON.stringify(json)).technologies).toEqual([]);
  });

  // 6. CSV Escaping (RFC 4180)
  it('6. Strictly escapes double quotes, commas, and linebreaks in CSV', () => {
    const trickyScan: ScanResult = {
      url: 'https://example.com/test,page?query="val"&param=1',
      domain: 'example.com',
      timestamp: Date.now(),
      scanDurationMs: 0.5,
      technologies: [
        {
          id: 'tricky-lib',
          name: 'Tricky, "Quoted" & Tagged Library',
          category: 'library',
          version: '1.0.0, "Beta"',
          confidenceScore: 80,
          confidenceTier: 'high',
          detectionType: 'direct',
          isInferred: false,
          confidenceReason: 'Line 1: detected\nLine 2: corroborated,\nLine 3: "confirmed"',
          evidence: [
            { type: 'dom', source: 'div[data-val="foo,bar"]', weight: 80 },
          ],
          website: 'https://example.com/lib,"official"',
          icon: '',
          description: '',
        },
      ],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
    };

    const csv = formatExportCsv(trickyScan);
    expect(csv).toContain('"Tricky, ""Quoted"" & Tagged Library"');
    expect(csv).toContain('"1.0.0, ""Beta"""');
    expect(csv).toContain('"Line 1: detected\nLine 2: corroborated,\nLine 3: ""confirmed"""');
    expect(csv).toContain('"https://example.com/lib,""official"""');
  });

  // 7. escapeCsv Helper Unit Checks
  it('7. escapeCsv handles null, undefined, numbers, and plain strings properly', () => {
    expect(escapeCsv(null)).toBe('""');
    expect(escapeCsv(undefined)).toBe('""');
    expect(escapeCsv(100)).toBe('"100"');
    expect(escapeCsv(0)).toBe('"0"');
    expect(escapeCsv('simple')).toBe('"simple"');
    expect(escapeCsv('with,comma')).toBe('"with,comma"');
    expect(escapeCsv('with "quotes"')).toBe('"with ""quotes"""');
  });
});
