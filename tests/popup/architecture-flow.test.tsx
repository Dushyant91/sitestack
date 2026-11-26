/**
 * SiteStack Phase 2.7.3 - Architecture Flow View Component & Integration Test Suite
 * Location: tests/popup/architecture-flow.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  ArchitectureFlowView,
  ArchitectureSummary,
  emptyGraphFixture,
  singleIsolatedFixture,
  directDependencyFixture,
  inferredDependencyFixture,
  multipleStacksFixture,
  contextualCoDetectionFixture,
  mixedVerifiedAndUnverifiedFixture,
  large60CatalogFixture,
  longNameTechFixture,
} from '../../src/popup/components/architecture';
import { App } from '../../src/popup/App';
import * as useScannerModule from '../../src/popup/hooks/useScanner';

describe('SiteStack Architecture Flow View (Phase 2.7.3)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Architecture Summary Banner
  // -------------------------------------------------------------------------
  describe('1. Architecture Summary Banner', () => {
    it('renders accurate, distinct metrics for direct, inferred, and unverified edges', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={5}
            directlyObservedEdges={2}
            inferredEdges={1}
            coDetectionEdges={3}
          />
        );
      });

      expect(container.textContent).toContain('5 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('1 Inferred');
      expect(container.textContent).toContain('3 Unverified');
      // Inferred is never labeled as direct
      expect(container.textContent).not.toContain('3 Direct');
    });

    it('renders singular "1 Technology" correctly and zero direct safely', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={1}
            directlyObservedEdges={0}
            inferredEdges={0}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('1 Technology');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).not.toContain('Inferred');
      expect(container.textContent).not.toContain('Unverified');
    });

    it('supports backward-compatible fallback when legacy verifiedEdges is provided', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={4}
            verifiedEdges={3}
            inferredEdges={1}
            coDetectionEdges={2}
          />
        );
      });

      // verifiedEdges (3) - inferredEdges (1) = 2 directly observed
      expect(container.textContent).toContain('4 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('1 Inferred');
      expect(container.textContent).toContain('2 Unverified');
    });

    it('displays optional total dependencies badge when enabled', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={6}
            directlyObservedEdges={2}
            inferredEdges={3}
            coDetectionEdges={1}
            showTotalDependencies={true}
          />
        );
      });

      expect(container.textContent).toContain('6 Technologies');
      expect(container.textContent).toContain('5 Total Deps');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('3 Inferred');
      expect(container.textContent).toContain('1 Unverified');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Empty Graph State
  // -------------------------------------------------------------------------
  describe('2. Empty Graph State', () => {
    it('renders empty state when graph contains 0 technologies', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={emptyGraphFixture} />);
      });

      expect(container.textContent).toContain('No Architecture Flow Available');
    });

    it('renders search empty state when filter matches zero technologies', () => {
      const handleClear = vi.fn();
      act(() => {
        root.render(
          <ArchitectureFlowView
            graph={directDependencyFixture}
            searchQuery="non-existent-tech-xyz"
            onSearchChange={handleClear}
          />
        );
      });

      expect(container.textContent).toContain('No Matching Technologies');
      expect(container.textContent).toContain('non-existent-tech-xyz');
      const clearBtn = container.querySelector('button');
      expect(clearBtn).not.toBeNull();
      act(() => {
        clearBtn?.click();
      });
      expect(handleClear).toHaveBeenCalledWith('');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Single Isolated Technology
  // -------------------------------------------------------------------------
  describe('3. Single Isolated Technology', () => {
    it('renders isolated node in Other Detected Technologies section without stack flow', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={singleIsolatedFixture} />);
      });

      expect(container.textContent).toContain('1 Technology');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).toContain('Other Detected Technologies');
      expect(container.textContent).toContain('Docker');
      expect(container.textContent).toContain('Independent');

      // No dependency stacks should be rendered
      expect(container.textContent).not.toContain('Stack Hierarchy');
      expect(container.textContent).not.toContain('Cluster #');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Single Direct Dependency (Next.js -> React)
  // -------------------------------------------------------------------------
  describe('4. Single Direct Dependency Flow', () => {
    it('renders dependency-first hierarchy with React foundation above Next.js dependent', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={directDependencyFixture} />);
      });

      expect(container.textContent).toContain('2 Technologies');
      expect(container.textContent).toContain('1 Direct');
      expect(container.textContent).toContain('React Stack');
      expect(container.textContent).toContain('Cluster #1');

      // Check cards order in DOM: React (rank 0) must appear before Next.js (rank 1)
      const cards = container.querySelectorAll('[role="button"]');
      expect(cards.length).toBeGreaterThanOrEqual(2);
      expect(cards[0].textContent).toContain('React');
      expect(cards[0].textContent).toContain('Foundation');
      expect(cards[1].textContent).toContain('Next.js');
      expect(cards[1].textContent).toContain('Dependent (Rank 1)');

      // Connector must show VERIFIED
      const connector = container.querySelector('[role="separator"]');
      expect(connector).not.toBeNull();
      expect(connector?.textContent).toContain('VERIFIED');
      expect(connector?.textContent).toContain('powers / required by');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Inferred Dependency Flow & Provenance
  // -------------------------------------------------------------------------
  describe('5. Inferred Dependency Flow & Provenance', () => {
    it('displays INFERRED badges on node, connector, and drawer provenance chain', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={inferredDependencyFixture} />);
      });

      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).toContain('1 Inferred');
      expect(container.textContent).toContain('INFERRED');

      // Click React card to inspect inference provenance
      const cards = container.querySelectorAll('[role="button"]');
      const reactCard = Array.from(cards).find((c) => c.textContent?.includes('React'));
      expect(reactCard).toBeDefined();

      act(() => {
        reactCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // Detail drawer should now be visible
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.textContent).toContain('Inference Provenance Chain');
      expect(dialog?.textContent).toContain('Inferred from: Next.js');
      expect(dialog?.textContent).toContain('nextjs->react:implies');
      expect(dialog?.textContent).toContain('Inferred via Next.js framework parent dependency rule.');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Multiple Independent Dependency Stacks
  // -------------------------------------------------------------------------
  describe('6. Multiple Independent Stacks', () => {
    it('renders separate isolated stack containers for React and WordPress stacks', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={multipleStacksFixture} />);
      });

      expect(container.textContent).toContain('4 Technologies');
      expect(container.textContent).toContain('2 Direct');

      // Must render two separate stack headers
      expect(container.textContent).toContain('React Stack');
      expect(container.textContent).toContain('Cluster #1');
      expect(container.textContent).toContain('WordPress Stack');
      expect(container.textContent).toContain('Cluster #2');

      // Verify WordPress flow: WordPress (rank 0, Foundation) powers WooCommerce (rank 1, Dependent)
      expect(container.textContent).toContain('WordPress');
      expect(container.textContent).toContain('WooCommerce');
    });
  });

  // -------------------------------------------------------------------------
  // 7. Contextual Co-Detection (Unverified Associations)
  // -------------------------------------------------------------------------
  describe('7. Contextual Co-Detection & Unverified Disclaimer', () => {
    it('renders unverified associations with clear disclaimer and NO false verified claims', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={contextualCoDetectionFixture} />);
      });

      // Verification metrics
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).toContain('Unverified Associations');

      // STRICT INVARIANT: Must include truth-preserving disclaimers
      expect(container.textContent).toContain('These technologies were co-detected on this website');
      expect(container.textContent).toContain('client-side scripts do not prove direct integration');
      expect(container.textContent).toContain('Both detected · Linkage unverified');
      expect(container.textContent).toContain('UNVERIFIED');
    });
  });

  // -------------------------------------------------------------------------
  // 8. Mixed Verified and Unverified Graph
  // -------------------------------------------------------------------------
  describe('8. Mixed Verified and Unverified Graph', () => {
    it('accurately distributes stacks, contextual associations, and independent technologies', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={mixedVerifiedAndUnverifiedFixture} />);
      });

      expect(container.textContent).toContain('6 Technologies');
      expect(container.textContent).toContain('1 Direct');
      expect(container.textContent).toContain('2 Unverified');

      // Hard dependency stack
      expect(container.textContent).toContain('React Stack');
      expect(container.textContent).toContain('Cluster #1');

      // Contextual co-detections
      expect(container.textContent).toContain('Unverified Associations');
      expect(container.textContent).toContain('Next.js');
      expect(container.textContent).toContain('Tailwind CSS');
      expect(container.textContent).toContain('Vercel');

      // Independent technologies
      expect(container.textContent).toContain('Other Detected Technologies');
      expect(container.textContent).toContain('Stripe');
      expect(container.textContent).toContain('Google Analytics 4');
    });
  });

  // -------------------------------------------------------------------------
  // 9. Large 60-Technology Catalog Stress Test
  // -------------------------------------------------------------------------
  describe('9. Large 80-Technology Catalog Stress Test', () => {
    it('mounts and renders all 80 technologies with all stacks without crashing', () => {
      const t0 = performance.now();
      act(() => {
        root.render(<ArchitectureFlowView graph={large60CatalogFixture} />);
      });
      const durationMs = performance.now() - t0;

      expect(container.textContent).toContain('80 Technologies');
      expect(container.textContent).toContain('12 Direct');
      expect(container.textContent).toContain('29 Unverified');

      // Verify DOM mount latency budget (< 500ms in jsdom under test runner load)
      expect(durationMs).toBeLessThan(500);
    });
  });

  // -------------------------------------------------------------------------
  // 10. Node Selection, Detail Drawer, and Dismissal
  // -------------------------------------------------------------------------
  describe('10. Node Selection & Detail Drawer', () => {
    it('opens drawer on node click and closes on dismiss or Escape', () => {
      const handleSelect = vi.fn();
      act(() => {
        root.render(
          <ArchitectureFlowView
            graph={directDependencyFixture}
            onSelectTechnology={handleSelect}
          />
        );
      });

      const cards = container.querySelectorAll('[role="button"]');
      const nextCard = Array.from(cards).find((c) => c.textContent?.includes('Next.js'));
      expect(nextCard).toBeDefined();

      act(() => {
        nextCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'nextjs' })
      );

      // Verify drawer content
      expect(container.textContent).toContain('Confidence');
      expect(container.textContent).toContain('Semantic Architecture Roles');
      expect(container.textContent).toContain('Depends on (Prerequisites):');
      expect(container.textContent).toContain('React');

      // Press Escape to dismiss drawer
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      // Drawer should be gone
      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('allows selecting related nodes from inside the detail drawer', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={directDependencyFixture} />);
      });

      // Click Next.js
      const nextCard = Array.from(container.querySelectorAll('[role="button"]')).find((c) =>
        c.textContent?.includes('Next.js')
      );
      act(() => {
        nextCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      // In drawer, click on the prerequisite link "React"
      const dialog = container.querySelector('[role="dialog"]')!;
      const reactPrereqBtn = Array.from(dialog.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('React')
      );
      expect(reactPrereqBtn).toBeDefined();

      act(() => {
        reactPrereqBtn?.click();
      });

      // Drawer should now inspect React
      const updatedDialog = container.querySelector('[role="dialog"]')!;
      expect(updatedDialog.textContent).toContain('Powers (Dependents):');
      expect(updatedDialog.textContent).toContain('Next.js');
    });
  });

  // -------------------------------------------------------------------------
  // 11. Expand / Collapse Behavior
  // -------------------------------------------------------------------------
  describe('11. Expand / Collapse Behavior', () => {
    it('collapses and expands unverified associations section on header click', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={contextualCoDetectionFixture} />);
      });

      const headerBtn = container.querySelector('button[aria-expanded="true"]');
      expect(headerBtn).not.toBeNull();

      // Click to collapse
      act(() => {
        headerBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(headerBtn?.getAttribute('aria-expanded')).toBe('false');

      // Click to expand again
      act(() => {
        headerBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(headerBtn?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // -------------------------------------------------------------------------
  // 12. Long Technology Names & Missing Metadata Handling
  // -------------------------------------------------------------------------
  describe('12. Long Technology Names & Missing Metadata Handling', () => {
    it('gracefully renders long names and missing descriptions/websites without exceptions', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={longNameTechFixture} />);
      });

      expect(container.textContent).toContain(
        'Google Tag Manager Enterprise Container Infrastructure (Long Name Edition)'
      );
      expect(container.textContent).toContain(
        'Google Analytics 4 Measurement Protocol Service Telemetry Engine'
      );
    });
  });

  // -------------------------------------------------------------------------
  // 13. Accessibility & Keyboard Navigation
  // -------------------------------------------------------------------------
  describe('13. Accessibility & Keyboard Navigation', () => {
    it('supports Enter and Space key activation on node cards', () => {
      const handleSelect = vi.fn();
      act(() => {
        root.render(
          <ArchitectureFlowView
            graph={directDependencyFixture}
            onSelectTechnology={handleSelect}
          />
        );
      });

      const card = container.querySelector('[role="button"]') as HTMLElement;
      expect(card).not.toBeNull();
      expect(card.getAttribute('tabindex')).toBe('0');

      // Trigger Enter key
      act(() => {
        card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });
      expect(handleSelect).toHaveBeenCalledTimes(1);

      // Trigger Space key
      act(() => {
        card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      });
      expect(handleSelect).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // 14. App View Switcher Integration
  // -------------------------------------------------------------------------
  describe('14. App View Switcher Integration', () => {
    it('toggles seamlessly between List View and Architecture Flow in App without breaking list view', () => {
      // Mock useScanner returning an active scan with Next.js and React
      vi.spyOn(useScannerModule, 'useScanner').mockReturnValue({
        result: {
          url: 'https://example.com',
          domain: 'example.com',
          timestamp: 1000000000000,
          technologies: [
            {
              id: 'nextjs',
              name: 'Next.js',
              category: 'framework',
              confidenceScore: 90,
              confidenceTier: 'high',
              detectionType: 'direct',
              website: 'https://nextjs.org',
              icon: 'nextjs.svg',
              description: 'Next.js framework',
              evidence: [],
            },
            {
              id: 'react',
              name: 'React',
              category: 'library',
              confidenceScore: 85,
              confidenceTier: 'high',
              detectionType: 'direct',
              website: 'https://react.dev',
              icon: 'react.svg',
              description: 'React library',
              evidence: [],
            },
          ],
          stats: { total: 2, high: 2, medium: 0, low: 0 },
          scanDurationMs: 15,
        },
        isLoading: false,
        error: null,
        isCached: false,
        isScanned: true,
        activeUrl: 'https://example.com',
        activeDomain: 'example.com',
        triggerScan: vi.fn(),
        clearActiveScan: vi.fn(),
        refreshTabStatus: vi.fn(),
      });

      act(() => {
        root.render(<App />);
      });

      // Default view is List
      expect(container.textContent).toContain('List');
      expect(container.textContent).toContain('Architecture');
      expect(container.textContent).toContain('2 Technologies'); // Metrics banner
      expect(container.textContent).toContain('Frameworks (1)'); // Category nav

      // Find the "Architecture" view button
      const archBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Architecture')
      );
      expect(archBtn).toBeDefined();

      // Switch to Architecture view
      act(() => {
        archBtn?.click();
      });

      // Now Architecture Flow is rendered
      expect(container.textContent).toContain('Graph:');
      expect(container.textContent).toContain('React Stack');
      expect(container.textContent).toContain('Cluster #1');
      expect(container.textContent).toContain('1 Direct');

      // Find the "List" view button to switch back
      const listBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('List')
      );
      expect(listBtn).toBeDefined();

      act(() => {
        listBtn?.click();
      });

      // Back to List view!
      expect(container.textContent).toContain('Frameworks (1)');
      expect(container.textContent).toContain('2 Technologies');
    });
  });

  // -------------------------------------------------------------------------
  // 12. Stage 2.7.3.2: Architecture Summary Metric Semantics Regression Suite
  // -------------------------------------------------------------------------
  describe('12. Stage 2.7.3.2: Architecture Summary Metric Semantics Regression Suite', () => {
    it('1. handles two direct dependencies and three inferred dependencies separately without conflation', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={10}
            directlyObservedEdges={2}
            inferredEdges={3}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('10 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('3 Inferred');
      // STRICT: Inferred is NEVER counted or described as direct or verified
      expect(container.textContent).not.toContain('5 Direct');
      expect(container.textContent).not.toContain('5 Verified');
      expect(container.textContent).not.toContain('Unverified');

      const directBadge = container.querySelector('[data-testid="summary-direct-dependencies"]');
      expect(directBadge?.getAttribute('title')).toContain('directly observed dependency connections');
      const inferredBadge = container.querySelector('[data-testid="summary-inferred-dependencies"]');
      expect(inferredBadge?.getAttribute('title')).toContain('inferred dependencies');
    });

    it('2. handles a graph containing only inferred dependencies with 0 direct dependencies cleanly', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={4}
            directlyObservedEdges={0}
            inferredEdges={2}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('4 Technologies');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).toContain('2 Inferred');
      // Inferred must not be claimed as direct
      expect(container.textContent).not.toContain('2 Direct');
      expect(container.textContent).not.toContain('2 Verified');
    });

    it('3. handles a graph containing only direct dependencies with 0 inferred dependencies', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={5}
            directlyObservedEdges={3}
            inferredEdges={0}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('5 Technologies');
      expect(container.textContent).toContain('3 Direct');
      expect(container.textContent).not.toContain('Inferred');
      expect(container.textContent).not.toContain('Unverified');
    });

    it('4. handles a graph containing only co-detected associations without counting them as dependencies', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={4}
            directlyObservedEdges={0}
            inferredEdges={0}
            coDetectionEdges={3}
          />
        );
      });

      expect(container.textContent).toContain('4 Technologies');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).not.toContain('Inferred');
      expect(container.textContent).toContain('3 Unverified');

      const region = container.querySelector('[role="region"]');
      expect(region?.getAttribute('aria-label')).toContain('0 total dependencies');
      expect(region?.getAttribute('aria-label')).toContain('3 unverified associations');
    });

    it('5. handles a graph containing all three evidence states (direct, inferred, unverified)', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={8}
            directlyObservedEdges={2}
            inferredEdges={1}
            coDetectionEdges={3}
          />
        );
      });

      expect(container.textContent).toContain('8 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('1 Inferred');
      expect(container.textContent).toContain('3 Unverified');

      const region = container.querySelector('[role="region"]');
      expect(region?.getAttribute('aria-label')).toContain('3 total dependencies (2 direct, 1 inferred)');
      expect(region?.getAttribute('aria-label')).toContain('3 unverified associations');
    });

    it('6. handles zero relationships cleanly (isolated technologies only)', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={3}
            directlyObservedEdges={0}
            inferredEdges={0}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('3 Technologies');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).not.toContain('Inferred');
      expect(container.textContent).not.toContain('Unverified');
    });

    it('7. renders full ArchitectureFlowView with multiple stacks and independent technologies with exact metrics', () => {
      act(() => {
        root.render(<ArchitectureFlowView graph={multipleStacksFixture} />);
      });

      expect(container.textContent).toContain('4 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('React Stack');
      expect(container.textContent).toContain('WordPress Stack');
      expect(container.textContent).not.toContain('Inferred');
      expect(container.textContent).not.toContain('Unverified');
    });

    it('8. enforces that total dependencies is mathematically directlyObserved + inferred and excludes coDetection', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={12}
            directlyObservedEdges={4}
            inferredEdges={2}
            coDetectionEdges={5}
            showTotalDependencies={true}
          />
        );
      });

      // Total dependencies = 4 direct + 2 inferred = 6 total dependencies
      expect(container.textContent).toContain('6 Total Deps');
      expect(container.textContent).toContain('4 Direct');
      expect(container.textContent).toContain('2 Inferred');
      expect(container.textContent).toContain('5 Unverified');
      // Co-detections (5) are strictly excluded from total dependencies
      expect(container.textContent).not.toContain('11 Total Deps');
    });
  });

  // -------------------------------------------------------------------------
  // 13. Stage 2.7.3.3: Legacy verifiedEdges Compatibility & Metric Invariant Audit Suite
  // -------------------------------------------------------------------------
  describe('13. Stage 2.7.3.3: Legacy verifiedEdges Compatibility & Metric Invariant Audit Suite', () => {
    it('1. handles direct-only legacy graph via verifiedEdges fallback correctly', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={3}
            verifiedEdges={2}
            inferredEdges={0}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('3 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).not.toContain('Inferred');
      expect(container.textContent).not.toContain('Unverified');
    });

    it('2. handles inferred-only legacy graph via verifiedEdges fallback correctly', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={2}
            verifiedEdges={1}
            inferredEdges={1}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('2 Technologies');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).toContain('1 Inferred');
      // Inferred dependency is not claimed as direct
      expect(container.textContent).not.toContain('1 Direct');
    });

    it('3. handles mixed direct and inferred legacy graph via verifiedEdges fallback correctly', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={5}
            verifiedEdges={3}
            inferredEdges={1}
            coDetectionEdges={2}
          />
        );
      });

      expect(container.textContent).toContain('5 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('1 Inferred');
      expect(container.textContent).toContain('2 Unverified');
    });

    it('4. handles missing inferred count in legacy consumer safely without producing NaN', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={4}
            verifiedEdges={2}
          />
        );
      });

      expect(container.textContent).toContain('4 Technologies');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).not.toContain('NaN');
    });

    it('5. handles missing verified count in legacy consumer safely', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={3}
            inferredEdges={1}
          />
        );
      });

      expect(container.textContent).toContain('3 Technologies');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).toContain('1 Inferred');
    });

    it('6. handles zero counts in legacy consumer safely', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={1}
            verifiedEdges={0}
            inferredEdges={0}
            coDetectionEdges={0}
          />
        );
      });

      expect(container.textContent).toContain('1 Technology');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).not.toContain('Inferred');
      expect(container.textContent).not.toContain('Unverified');
    });

    it('7. handles inconsistent legacy counts where inferred exceeds verified safely (no negative counts)', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={4}
            verifiedEdges={1}
            inferredEdges={3}
          />
        );
      });

      expect(container.textContent).toContain('4 Technologies');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).toContain('3 Inferred');
      // Must not render negative direct count
      expect(container.textContent).not.toContain('-2 Direct');
    });

    it('8. handles invalid non-finite numbers (NaN, negative) safely without UI breakage', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={-5}
            directlyObservedEdges={-3}
            inferredEdges={-1}
            coDetectionEdges={-4}
          />
        );
      });

      expect(container.textContent).toContain('0 Technologies');
      expect(container.textContent).toContain('0 Direct');
      expect(container.textContent).not.toContain('-');
    });

    it('9. prioritizes new directlyObservedEdges metric over deprecated verifiedEdges when both are present', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={4}
            directlyObservedEdges={2}
            verifiedEdges={10} // Malformed/stale legacy value that should be completely ignored
            inferredEdges={1}
          />
        );
      });

      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).not.toContain('9 Direct');
      expect(container.textContent).not.toContain('10 Direct');
    });

    it('10. verifies that coDetectionEdges never contributes to totalDependencies in graph output', () => {
      act(() => {
        root.render(
          <ArchitectureSummary
            totalNodes={5}
            directlyObservedEdges={2}
            inferredEdges={1}
            coDetectionEdges={8}
            showTotalDependencies={true}
          />
        );
      });

      expect(container.textContent).toContain('3 Total Deps');
      expect(container.textContent).toContain('2 Direct');
      expect(container.textContent).toContain('1 Inferred');
      expect(container.textContent).toContain('8 Unverified');
      // Co-detections (8) must never inflate dependencies (3 vs 11)
      expect(container.textContent).not.toContain('11 Total Deps');
    });

    it('11. renders "Open Canvas" action button and triggers onOpenCanvas when provided', () => {
      const handleOpenCanvas = vi.fn();

      act(() => {
        root.render(
          <ArchitectureFlowView
            graph={directDependencyFixture}
            onOpenCanvas={handleOpenCanvas}
          />
        );
      });

      expect(container.textContent).toContain('Explore 2D visual layout in a full-screen tab');
      const openCanvasBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Open Canvas')
      );
      expect(openCanvasBtn).toBeDefined();

      act(() => {
        openCanvasBtn?.click();
      });

      expect(handleOpenCanvas).toHaveBeenCalledTimes(1);
    });
  });
});
