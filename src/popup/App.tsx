import React, { useState, useMemo, useCallback } from 'react';
import { Play, List, Network, Maximize2 } from 'lucide-react';
import { useScanner } from './hooks/useScanner';
import { SiteStackLogo } from './components/SiteStackLogo';
import { Header } from './components/Header';
import { MetricsBanner } from './components/MetricsBanner';
import { SearchBar } from './components/SearchBar';
import { CategoryNav } from './components/CategoryNav';
import { TechCard } from './components/TechCard';
import { ScanRadar } from './components/ScanRadar';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { FooterActions } from './components/FooterActions';
import { HistoryModal } from './components/HistoryModal';
import { CollectionsModal } from './components/CollectionsModal';
import { ArchitectureFlowView } from './components/architecture';
import { buildArchitectureGraph } from '../engine/architecture/graph';
import { ScanResult } from '../engine/types';
import { ScanSnapshot } from '../../packages/contracts/src/types';
import { snapshotToStoredRecord } from '../extension/storage/history';
import { createCanvasLaunchRecord } from '../canvas/transfer';

/**
 * Safely extracts a human-readable domain or display label from any scan record
 */
export function getScanDisplayDomain(scan: ScanResult | ScanSnapshot | null | undefined): string {
  if (!scan) return '';
  const s = scan as unknown as Record<string, unknown>;
  if (typeof s.domain === 'string' && s.domain.trim()) return s.domain.trim();
  const target = s.target as Record<string, unknown> | undefined;
  if (target && typeof target.domain === 'string' && target.domain.trim()) return target.domain.trim();
  if (target && typeof target.displayName === 'string' && target.displayName.trim()) return target.displayName.trim();
  if (typeof s.url === 'string' && s.url.trim()) {
    try {
      const u = new URL(s.url.startsWith('http') ? s.url : `https://${s.url}`);
      return u.hostname;
    } catch {
      return s.url;
    }
  }
  return 'Saved Scan';
}

export const App: React.FC = () => {
  const {
    result,
    isLoading,
    error,
    isCached,
    isScanned,
    activeDomain,
    triggerScan,
    clearActiveScan,
  } = useScanner();

  const [viewMode, setViewMode] = useState<'list' | 'flow'>('list');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState<boolean>(false);
  const [historyOverrideScan, setHistoryOverrideScan] = useState<ScanResult | null>(null);

  // Active scan to display (either live result or user selected history item)
  const activeScan = historyOverrideScan || result;

  // In-memory deterministic architecture graph computed from active scan
  const architectureGraph = useMemo(() => {
    if (!activeScan) return null;
    return buildArchitectureGraph({
      detectedTechnologies: activeScan.technologies,
      url: activeScan.url,
      domain: activeScan.domain,
      timestamp: activeScan.timestamp,
    });
  }, [activeScan]);

  // Category counts calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      cms: 0,
      framework: 0,
      library: 0,
      analytics: 0,
      marketing: 0,
      ecommerce: 0,
      payment: 0,
      infrastructure: 0,
    };

    if (activeScan) {
      for (const tech of activeScan.technologies) {
        if (counts[tech.category] !== undefined) {
          counts[tech.category]++;
        }
      }
    }
    return counts;
  }, [activeScan]);

  // Inferred technologies count
  const inferredCount = useMemo(() => {
    if (!activeScan) return 0;
    return activeScan.technologies.filter((t) => t.isInferred).length;
  }, [activeScan]);

  // Filtered technology list based on Category tab and Search query
  const filteredTechnologies = useMemo(() => {
    if (!activeScan) return [];

    let list = activeScan.technologies;

    // Filter by Category
    if (activeCategory !== 'all') {
      list = list.filter((t) => t.category === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.version && t.version.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeScan, activeCategory, searchQuery]);

  const handleRescan = () => {
    setHistoryOverrideScan(null);
    triggerScan(true);
  };

  const handleSelectHistoryScan = (scan: ScanResult | ScanSnapshot) => {
    const s = scan as unknown as Record<string, unknown>;
    const normalized: ScanResult = s.schemaVersion === '3.0.0'
      ? snapshotToStoredRecord(scan as ScanSnapshot)
      : (scan as ScanResult);
    setHistoryOverrideScan(normalized);
    setActiveCategory('all');
    setSearchQuery('');
  };

  const handleHistoryModified = (deletedId?: string | number, isAllCleared?: boolean) => {
    if (isAllCleared) {
      setHistoryOverrideScan(null);
      clearActiveScan();
    } else if (deletedId) {
      if (
        activeScan?.id === deletedId ||
        String(activeScan?.timestamp) === String(deletedId) ||
        activeScan?.timestamp === deletedId ||
        activeScan?.domain === deletedId
      ) {
        setHistoryOverrideScan(null);
        clearActiveScan();
      }
    }
  };

  const handleOpenCanvas = useCallback(async () => {
    if (!activeScan) return;
    try {
      const launchId = await createCanvasLaunchRecord(activeScan);
      const domainQuery = activeScan.domain ? `&domain=${encodeURIComponent(activeScan.domain)}` : '';
      const canvasUrl =
        typeof chrome !== 'undefined' && chrome?.runtime?.getURL
          ? chrome.runtime.getURL(`canvas.html?launchId=${encodeURIComponent(launchId)}${domainQuery}`)
          : `canvas.html?launchId=${encodeURIComponent(launchId)}${domainQuery}`;

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        await chrome.tabs.create({ url: canvasUrl });
      } else if (typeof window !== 'undefined') {
        window.open(canvasUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to launch Architecture Canvas:', err);
    }
  }, [activeScan]);

  return (
    <div className="w-[390px] h-[560px] bg-[#090a0f] text-zinc-100 flex flex-col overflow-hidden relative font-sans border border-white/[0.08] shadow-2xl">
      {/* Top Header */}
      <Header
        domain={historyOverrideScan ? getScanDisplayDomain(historyOverrideScan) : activeDomain}
        isCached={isCached && !historyOverrideScan}
        isScanned={Boolean(historyOverrideScan || isScanned)}
        timestamp={activeScan?.timestamp}
        isLoading={isLoading}
        isHistoryMode={Boolean(historyOverrideScan)}
        onExitHistoryMode={() => setHistoryOverrideScan(null)}
        onRescan={handleRescan}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCollections={() => setIsCollectionsOpen(true)}
      />

      {/* Historical Report Banner */}
      {historyOverrideScan && (
        <div className="px-3 py-1.5 bg-violet-950/40 border-b border-violet-500/20 flex items-center justify-between text-[10px] text-violet-300 font-mono shrink-0">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
            Viewing saved report ({getScanDisplayDomain(historyOverrideScan)})
          </span>
          <button
            onClick={() => setHistoryOverrideScan(null)}
            className="text-violet-400 hover:text-white underline ml-2 shrink-0 transition-colors"
          >
            Back to Active Tab
          </button>
        </div>
      )}

      {/* Main View Area */}
      {isLoading ? (
        <ScanRadar domain={activeDomain} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => triggerScan(true)} />
      ) : !isScanned && !historyOverrideScan ? (
        /* Ready to Scan Zero-State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none space-y-3.5">
          <SiteStackLogo size={48} showGlow={true} className="shadow-xl" />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Ready to Inspect Stack</h3>
            <p className="text-[11px] text-zinc-400 max-w-[270px] leading-relaxed mx-auto">
              Analyze <span className="text-zinc-200 font-mono font-medium">{activeDomain || 'this website'}</span> to inspect frontend frameworks, CMS, analytics, and dependencies.
            </p>
          </div>

          <div className="w-full max-w-[280px] p-2.5 rounded-xl bg-white/[0.025] border border-white/[0.07] text-left space-y-1.5 text-[10px] text-zinc-300">
            <div className="flex items-center gap-1.5 font-medium text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span>80 Verified Technologies Supported</span>
            </div>
            <p className="text-zinc-400 leading-relaxed font-sans">
              Passively corroborates DOM hierarchy, runtime window globals, and network script deliveries.
            </p>
            <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-[9px] text-emerald-400 font-mono">
              <span>✓ 100% Local Browser Memory</span>
              <span>✓ Zero Telemetry</span>
            </div>
          </div>

          <button
            onClick={handleRescan}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Scan Website Now</span>
          </button>
        </div>
      ) : activeScan ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* View Mode Switcher Header */}
          <div className="px-3 py-1.5 bg-white/[0.015] border-b border-white/[0.06] flex items-center justify-between shrink-0 select-none">
            <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`min-h-[28px] flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <List className="w-3.5 h-3.5" aria-hidden="true" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flow')}
                aria-pressed={viewMode === 'flow'}
                className={`min-h-[28px] flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  viewMode === 'flow'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Network className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Architecture</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'flow' && (
                <button
                  type="button"
                  onClick={handleOpenCanvas}
                  title="Open interactive Full-Screen Architecture Canvas in a new tab"
                  className="min-h-[28px] flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Canvas</span>
                </button>
              )}
              <span className="text-[10px] font-mono text-zinc-400">
                {activeScan.technologies.length} {activeScan.technologies.length === 1 ? 'tech' : 'techs'}
              </span>
            </div>
          </div>

          {/* Search Bar (Shared across both views) */}
          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            resultCount={
              viewMode === 'list'
                ? filteredTechnologies.length
                : (architectureGraph?.nodes.length || 0)
            }
            totalCount={activeScan.technologies.length}
          />

          {viewMode === 'list' ? (
            <>
              {/* Quick Metrics */}
              <MetricsBanner
                stats={activeScan.stats}
                inferredCount={inferredCount}
              />

              {/* Category Filter Pills */}
              <CategoryNav
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                categoryCounts={categoryCounts}
                totalCount={activeScan.technologies.length}
              />

              {/* Scrollable Technology Cards List */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {activeScan.technologies.length === 0 ? (
                  <EmptyState />
                ) : filteredTechnologies.length === 0 ? (
                  <EmptyState
                    isSearchEmpty={true}
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery('')}
                  />
                ) : (
                  filteredTechnologies.map((tech) => (
                    <TechCard key={tech.id} technology={tech} />
                  ))
                )}
              </div>
            </>
          ) : (
            architectureGraph && (
              <ArchitectureFlowView
                graph={architectureGraph}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenCanvas={handleOpenCanvas}
              />
            )
          )}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Bottom Footer Actions (JSON / CSV Export) */}
      <FooterActions
        scanResult={activeScan}
        disabled={isLoading || Boolean(error) || (!isScanned && !historyOverrideScan)}
      />

      {/* Scan History Slide-over Drawer */}
      {isHistoryOpen && (
        <HistoryModal
          onClose={() => setIsHistoryOpen(false)}
          onSelectScan={handleSelectHistoryScan}
          onHistoryModified={handleHistoryModified}
        />
      )}

      {/* Research Collections Slide-over Drawer */}
      {isCollectionsOpen && (
        <CollectionsModal
          onClose={() => setIsCollectionsOpen(false)}
          currentScan={activeScan}
          onSelectScan={(scan) => {
            setHistoryOverrideScan(scan as ScanResult);
            setIsCollectionsOpen(false);
          }}
        />
      )}
    </div>
  );
};
