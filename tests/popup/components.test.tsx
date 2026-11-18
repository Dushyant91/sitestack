import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MetricsBanner } from '../../src/popup/components/MetricsBanner';
import { SearchBar } from '../../src/popup/components/SearchBar';
import { TechCard } from '../../src/popup/components/TechCard';
import { CategoryNav } from '../../src/popup/components/CategoryNav';
import { ErrorState } from '../../src/popup/components/ErrorState';
import { formatRelativeTime, formatDomain } from '../../src/popup/utils/formatters';
import { exportToJson, exportToCsv } from '../../src/popup/utils/export';
import { DetectedTechnology, ScanResult } from '../../src/engine/types';

describe('React UI Components (Phase 3)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  const cleanup = () => {
    act(() => {
      root.unmount();
    });
    container.remove();
  };

  it('MetricsBanner renders total count, high/med breakdown, and inferred count', () => {
    act(() => {
      root.render(
        <MetricsBanner
          stats={{ total: 8, high: 6, medium: 2, low: 0 }}
          inferredCount={1}
        />
      );
    });

    expect(container.textContent).toContain('8 Technologies');
    expect(container.textContent).toContain('6 High');
    expect(container.textContent).toContain('2 Med');
    expect(container.textContent).toContain('1 Inferred');
    cleanup();
  });

  it('SearchBar handles user typing and displays clear button when query is present', () => {
    const handleChange = vi.fn();

    act(() => {
      root.render(
        <SearchBar
          query="React"
          onChange={handleChange}
          resultCount={1}
          totalCount={5}
        />
      );
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('React');
    expect(container.textContent).toContain('Showing 1 of 5 detected');

    // Click clear button
    const clearBtn = container.querySelector('button');
    expect(clearBtn).toBeDefined();
    act(() => {
      clearBtn?.click();
    });
    expect(handleChange).toHaveBeenCalledWith('');
    cleanup();
  });

  it('CategoryNav renders only populated categories with counts', () => {
    const handleSelect = vi.fn();
    const counts = {
      cms: 1,
      framework: 3,
      library: 0,
      analytics: 2,
      marketing: 0,
      ecommerce: 0,
      payment: 1,
      infrastructure: 0,
    };

    act(() => {
      root.render(
        <CategoryNav
          activeCategory="all"
          onSelectCategory={handleSelect}
          categoryCounts={counts}
          totalCount={7}
        />
      );
    });

    expect(container.textContent).toContain('All (7)');
    expect(container.textContent).toContain('CMS (1)');
    expect(container.textContent).toContain('Frameworks (3)');
    expect(container.textContent).toContain('Analytics (2)');
    expect(container.textContent).toContain('Payments (1)');

    // Should NOT show zero-count categories
    expect(container.textContent).not.toContain('Marketing (0)');
    expect(container.textContent).not.toContain('Ecommerce (0)');

    // Click Frameworks tab
    const fwBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Frameworks')
    );
    act(() => {
      fwBtn?.click();
    });
    expect(handleSelect).toHaveBeenCalledWith('framework');
    cleanup();
  });

  it('TechCard displays version, confidence tier, and distinguishes inferred technologies', () => {
    const mockInferredTech: DetectedTechnology = {
      id: 'react',
      name: 'React',
      category: 'library',
      version: '18.3.1',
      confidenceScore: 85,
      confidenceTier: 'high',
      detectionType: 'inferred',
      parentDependency: 'Next.js',
      isInferred: true,
      evidence: [
        {
          type: 'inferred',
          source: 'Inferred dependency of Next.js',
          weight: 85,
        },
      ],
      website: 'https://react.dev',
      icon: '/tech-icons/frameworks/react.svg',
      description: 'UI Component Library',
    };

    act(() => {
      root.render(<TechCard technology={mockInferredTech} />);
    });

    expect(container.textContent).toContain('React');
    expect(container.textContent).toContain('v18.3.1');
    expect(container.textContent).toContain('85% INFERRED');

    // Initially EvidenceDrawer is collapsed
    expect(container.textContent).not.toContain('Architectural Dependency');

    // Click to expand EvidenceDrawer
    const cardHeader = container.querySelector('.cursor-pointer') as HTMLElement;
    act(() => {
      cardHeader.click();
    });

    // EvidenceDrawer should now be visible with explicit architectural dependency explanation
    expect(container.textContent).toContain('Architectural Dependency');
    expect(container.textContent).toContain('Inferred from Next.js');
    cleanup();
  });

  it('formatters work accurately for relative times and domains', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 10000)).toBe('Just now');
    expect(formatRelativeTime(now - 120000)).toBe('2m ago');
    expect(formatRelativeTime(now - 7200000)).toBe('2h ago');

    expect(formatDomain('https://vercel.com/dashboard/projects')).toBe('vercel.com');
    expect(formatDomain('https://sub.domain.co.uk')).toBe('sub.domain.co.uk');
  });

  it('export utilities format JSON and CSV reports with valid data', () => {
    const sampleScan: ScanResult = {
      url: 'https://test-site.com',
      domain: 'test-site.com',
      timestamp: Date.now(),
      technologies: [
        {
          id: 'nextjs',
          name: 'Next.js',
          category: 'framework',
          version: '14.2.3',
          confidenceScore: 98,
          confidenceTier: 'high',
          detectionType: 'direct',
          isInferred: false,
          evidence: [{ type: 'global', source: 'window.__NEXT_DATA__', weight: 60 }],
          website: 'https://nextjs.org',
          icon: '',
          description: 'React Framework',
        },
      ],
      stats: { total: 1, high: 1, medium: 0, low: 0 },
      scanDurationMs: 0.5,
    };

    let downloadedBlob: Blob | null = null;
    let downloadedFilename = '';

    // Mock URL.createObjectURL
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((blob: Blob) => {
      downloadedBlob = blob;
      return 'blob:mock-url';
    });
    URL.revokeObjectURL = vi.fn();

    // Mock anchor click
    const originalAppend = document.body.appendChild;
    const originalRemove = document.body.removeChild;
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = vi.fn();

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if ((node as HTMLAnchorElement).download) {
        downloadedFilename = (node as HTMLAnchorElement).download;
      }
      return node;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    // Test JSON export
    exportToJson(sampleScan);
    expect(downloadedFilename).toContain('sitestack-test-site.com');
    expect(downloadedFilename).toContain('.json');
    expect(downloadedBlob).toBeDefined();

    // Test CSV export
    exportToCsv(sampleScan);
    expect(downloadedFilename).toContain('sitestack-test-site.com');
    expect(downloadedFilename).toContain('.csv');
    expect(downloadedBlob).toBeDefined();

    HTMLAnchorElement.prototype.click = originalClick;

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    document.body.appendChild = originalAppend;
    document.body.removeChild = originalRemove;
    cleanup();
  });

  it('ErrorState renders "Page Not Supported" for restricted URLs without retry button, and "Scan Failed" for genuine failures', () => {
    const onRetry = vi.fn();

    // 1. Restricted URL (e.g. brave://extensions or chrome://extensions)
    act(() => {
      root.render(
        <ErrorState
          error={{
            code: 'RESTRICTED_URL',
            message: 'Browser internal and system pages cannot be analyzed. SiteStack inspects regular websites (HTTP/HTTPS), not browser-internal pages.',
          }}
          onRetry={onRetry}
        />
      );
    });

    expect(container.textContent).toContain('Page Not Supported');
    expect(container.textContent).toContain('SiteStack can inspect regular websites, not browser-internal pages.');
    expect(container.textContent).toContain('Navigate to any regular website (HTTP/HTTPS) and open SiteStack.');
    expect(container.textContent).not.toContain('Scan Failed');
    expect(container.querySelector('button')).toBeNull();

    // 2. Unsupported Scheme (e.g. file:///)
    act(() => {
      root.render(
        <ErrorState
          error={{
            code: 'UNSUPPORTED_SCHEME',
            message: 'Unsupported protocol (file://). SiteStack analyzes HTTP and HTTPS websites.',
          }}
          onRetry={onRetry}
        />
      );
    });

    expect(container.textContent).toContain('Page Not Supported');
    expect(container.querySelector('button')).toBeNull();

    // 3. Genuine Failure (e.g. INJECTION_FAILED)
    act(() => {
      root.render(
        <ErrorState
          error={{
            code: 'INJECTION_FAILED',
            message: 'Failed to inspect website. Ensure page is fully loaded and retry.',
          }}
          onRetry={onRetry}
        />
      );
    });

    expect(container.textContent).toContain('Scan Failed');
    expect(container.textContent).toContain('Failed to inspect website.');
    expect(container.querySelector('button')).not.toBeNull();

    // Click retry
    const retryBtn = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      retryBtn.click();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);

    // 4. Page Unavailable (e.g. DNS / Connection Failure)
    act(() => {
      root.render(
        <ErrorState
          error={{
            code: 'PAGE_UNAVAILABLE',
            message: 'Website cannot be reached (DNS_PROBE_FINISHED_NXDOMAIN).',
          }}
          onRetry={onRetry}
        />
      );
    });

    expect(container.textContent).toContain('Page Unavailable');
    expect(container.textContent).toContain('Website cannot be reached');
    expect(container.querySelector('button')).not.toBeNull();

    cleanup();
  });
});
