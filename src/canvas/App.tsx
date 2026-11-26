/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Application
 * Location: src/canvas/App.tsx
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { buildArchitectureGraph } from '../engine/architecture/graph';
import { ArchitectureGraph, ArchitectureGraphNode } from '../engine/architecture/graph/types';
import { ScanResult } from '../engine/types';
import {
  CanvasFilterState,
  CanvasViewport,
  CANVAS_DEFAULT_ZOOM,
} from './types';
import {
  getCanvasLaunchRecord,
  getFallbackHistoryScan,
  CanvasTransferPayload,
} from './transfer';
import { CanvasHeader } from './components/CanvasHeader';
import { CanvasSidebar } from './components/CanvasSidebar';
import { CanvasGraph } from './components/CanvasGraph';
import { CanvasInspector } from './components/CanvasInspector';
import { CanvasEmptyState } from './components/CanvasEmptyState';
import { SiteStackLogo } from '../popup/components/SiteStackLogo';

export interface CanvasAppProps {
  /** Optional pre-loaded scan result for direct embedding or tests */
  readonly initialScanResult?: ScanResult;
  /** Optional pre-computed architecture graph */
  readonly initialGraph?: ArchitectureGraph;
}

export const App: React.FC<CanvasAppProps> = ({
  initialScanResult,
  initialGraph,
}) => {
  const [scanPayload, setScanPayload] = useState<CanvasTransferPayload | null>(null);
  const [historyFallbackScan, setHistoryFallbackScan] = useState<ScanResult | null>(
    initialScanResult || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialScanResult && !initialGraph);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isHistoricalFallback, setIsHistoricalFallback] = useState<boolean>(false);
  const [isFallbackNoticeDismissed, setIsFallbackNoticeDismissed] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<ArchitectureGraphNode | null>(null);

  // Theme Management (Light / Dark) for Architecture Canvas
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('sitestack_canvas_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {}
    return 'dark';
  });

  // Sync with chrome.storage if available
  useEffect(() => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['sitestack_canvas_theme'], (res) => {
          if (res?.sitestack_canvas_theme === 'dark' || res?.sitestack_canvas_theme === 'light') {
            setTheme(res.sitestack_canvas_theme);
          }
        });
      }
    } catch (e) {}
  }, []);

  // Update root document element class whenever theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('sitestack_canvas_theme', next);
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ sitestack_canvas_theme: next });
        }
      } catch (e) {}
      return next;
    });
  }, []);

  const [filters, setFilters] = useState<CanvasFilterState>({
    searchQuery: '',
    showDirect: true,
    showInferred: true,
    showUnverified: true,
    selectedClusterId: 'all',
    selectedCategory: 'all',
  });

  const [viewport, setViewport] = useState<CanvasViewport>({
    panX: 0,
    panY: 0,
    zoom: CANVAS_DEFAULT_ZOOM,
  });

  // Hydrate scan transfer payload on mount
  useEffect(() => {
    if (initialScanResult || initialGraph) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function hydrate() {
      setIsLoading(true);
      setErrorMessage(null);
      setIsExpired(false);

      try {
        const params = new URLSearchParams(window.location.search);
        const launchId = params.get('launchId');
        const targetDomain = params.get('domain') || undefined;

        if (launchId) {
          const payload = await getCanvasLaunchRecord(launchId);
          if (!isMounted) return;

          if (payload) {
            setScanPayload(payload);
            setIsLoading(false);
            return;
          } else {
            // Explicitly halt at expired state; never silently substitute an arbitrary scan
            setIsExpired(true);
            setErrorMessage(
              'Canvas transfer session has expired (15m TTL) or was closed. Please re-open from the SiteStack extension popup, or load the saved scan from history.'
            );
            setIsLoading(false);
            return;
          }
        }

        // If no launchId was specified at all (e.g. direct page open), try history fallback
        const fallback = await getFallbackHistoryScan(targetDomain);
        if (!isMounted) return;

        if (fallback) {
          setHistoryFallbackScan(fallback);
          setIsHistoricalFallback(true);
        } else {
          setErrorMessage(
            targetDomain
              ? `No saved scans found for "${targetDomain}". Open the extension popup to scan this website.`
              : 'No scan specified. Open the extension popup to scan a website.'
          );
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'Failed to load architecture scan'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [initialScanResult, initialGraph]);

  // Compute Architecture Graph deterministically from active scan
  const graph = useMemo<ArchitectureGraph | null>(() => {
    if (initialGraph) return initialGraph;

    if (scanPayload) {
      return buildArchitectureGraph({
        detectedTechnologies: scanPayload.technologies,
        url: scanPayload.url,
        domain: scanPayload.domain,
        timestamp: scanPayload.scanTimestamp,
      });
    }

    if (historyFallbackScan) {
      return buildArchitectureGraph({
        detectedTechnologies: historyFallbackScan.technologies,
        url: historyFallbackScan.url,
        domain: historyFallbackScan.domain,
        timestamp: historyFallbackScan.timestamp,
      });
    }

    return null;
  }, [initialGraph, scanPayload, historyFallbackScan]);

  const activeDomain = scanPayload?.domain || historyFallbackScan?.domain || graph?.domain || '';
  const activeUrl = scanPayload?.url || historyFallbackScan?.url || graph?.url;
  const activeTimestamp = scanPayload?.scanTimestamp || historyFallbackScan?.timestamp || graph?.timestamp;

  const activeScanResult = useMemo<ScanResult | null>(() => {
    if (historyFallbackScan) return historyFallbackScan;
    if (initialScanResult) return initialScanResult;
    if (scanPayload) {
      return {
        url: scanPayload.url,
        domain: scanPayload.domain,
        timestamp: scanPayload.scanTimestamp,
        technologies: [...scanPayload.technologies],
        stats: scanPayload.stats,
        scanDurationMs: 0,
      };
    }
    return null;
  }, [historyFallbackScan, initialScanResult, scanPayload]);

  const handleSelectRelatedNode = useCallback(
    (nodeId: string) => {
      if (!graph) return;
      const target = graph.nodes.find((n) => n.id === nodeId);
      if (target) {
        setSelectedNode(target);
      }
    },
    [graph]
  );

  const handleTryHistory = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams(window.location.search);
    const targetDomain = params.get('domain') || undefined;
    const fallback = await getFallbackHistoryScan(targetDomain);
    setIsLoading(false);
    if (fallback) {
      setHistoryFallbackScan(fallback);
      setIsHistoricalFallback(true);
      setErrorMessage(null);
      setIsExpired(false);
    } else {
      setErrorMessage(
        targetDomain
          ? `No saved scans found for "${targetDomain}". Open the extension popup to scan this website.`
          : 'No saved scans found in extension history.'
      );
    }
  }, []);

  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined' && window.close) {
      window.close();
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`h-screen w-screen flex flex-col items-center justify-center select-none ${theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-[#07090e] text-zinc-100'}`}>
        <SiteStackLogo size={48} showGlow={theme === 'dark'} className="mb-4 animate-pulse" />
        <p className={`text-xs font-mono ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>Loading Architecture Canvas...</p>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className={`h-screen w-screen flex flex-col ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#07090e] text-zinc-100'}`}>
        <CanvasHeader
          graph={null}
          domain={activeDomain}
          url={activeUrl}
          timestamp={activeTimestamp}
          searchQuery={filters.searchQuery}
          onSearchChange={(q) => setFilters({ ...filters, searchQuery: q })}
          viewport={viewport}
          onZoomIn={() => setViewport((v) => ({ ...v, zoom: Math.min(2.5, v.zoom * 1.15) }))}
          onZoomOut={() => setViewport((v) => ({ ...v, zoom: Math.max(0.25, v.zoom * 0.85) }))}
          onZoomReset={() => setViewport((v) => ({ ...v, zoom: 1.0 }))}
          onFitToScreen={() => {}}
          onClose={handleClose}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <CanvasEmptyState
          isExpired={isExpired}
          isMissing={Boolean(errorMessage)}
          message={errorMessage || undefined}
          onTryHistory={handleTryHistory}
          theme={theme}
        />
      </div>
    );
  }

  const isLight = theme === 'light';

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden select-none font-sans ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#07090e] text-zinc-100'}`}>
      {/* Top Header Bar */}
      <CanvasHeader
        graph={graph}
        domain={activeDomain}
        url={activeUrl}
        timestamp={activeTimestamp}
        isHistoricalFallback={isHistoricalFallback}
        scanResult={activeScanResult}
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => setFilters({ ...filters, searchQuery: q })}
        viewport={viewport}
        onZoomIn={() => setViewport((v) => ({ ...v, zoom: Math.min(2.5, v.zoom * 1.15) }))}
        onZoomOut={() => setViewport((v) => ({ ...v, zoom: Math.max(0.25, v.zoom * 0.85) }))}
        onZoomReset={() => setViewport((v) => ({ ...v, zoom: 1.0, panX: 0, panY: 0 }))}
        onFitToScreen={() => {}}
        onClose={handleClose}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Prominent Historical Fallback Warning Banner */}
      {isHistoricalFallback && historyFallbackScan && !isFallbackNoticeDismissed && (
        <div
          role="alert"
          className={`${isLight ? 'bg-amber-50 border-b border-amber-200 text-amber-800' : 'bg-amber-500/10 border-b border-amber-500/25 text-amber-200'} px-4 py-2 flex items-center justify-between text-xs shrink-0 z-10`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-500/20 text-amber-300'} mr-1.5`}>
                HISTORY FALLBACK
              </span>
              <strong>Historical Scan Notice:</strong> Displaying saved scan for{' '}
              <span className={`font-mono font-medium ${isLight ? 'text-amber-950 font-bold' : 'text-white'}`}>{historyFallbackScan.domain}</span>{' '}
              captured on {new Date(historyFallbackScan.timestamp).toLocaleString()} ({historyFallbackScan.url}). Active launch session expired or was not provided.
            </span>
          </div>
          <button
            onClick={() => setIsFallbackNoticeDismissed(true)}
            className={`${isLight ? 'text-amber-700 hover:text-amber-950' : 'text-amber-400 hover:text-amber-200'} text-[11px] font-semibold shrink-0 ml-3 underline`}
            title="Dismiss notice"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-row min-h-0 relative overflow-hidden">
        {/* Left Control Sidebar */}
        <CanvasSidebar
          graph={graph}
          filters={filters}
          onFiltersChange={setFilters}
          onSelectNode={setSelectedNode}
          selectedNodeId={selectedNode?.id || null}
          theme={theme}
        />

        {/* Center SVG Interactive Canvas */}
        <CanvasGraph
          graph={graph}
          filters={filters}
          viewport={viewport}
          onViewportChange={setViewport}
          selectedNodeId={selectedNode?.id || null}
          onSelectNode={setSelectedNode}
          theme={theme}
        />

        {/* Right Inspection Dossier Panel */}
        {selectedNode && (
          <CanvasInspector
            node={selectedNode}
            graph={graph}
            onClose={() => setSelectedNode(null)}
            onSelectRelatedNode={handleSelectRelatedNode}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};
