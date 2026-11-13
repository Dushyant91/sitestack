import React, { useState, useMemo } from 'react';
import { useScanner } from './hooks/useScanner';
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
import { ScanResult } from '../engine/types';

export const App: React.FC = () => {
  const {
    result,
    isLoading,
    error,
    isCached,
    activeDomain,
    triggerScan,
  } = useScanner();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyOverrideScan, setHistoryOverrideScan] = useState<ScanResult | null>(null);

  // Active scan to display (either live result or user selected history item)
  const activeScan = historyOverrideScan || result;

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

  const handleSelectHistoryScan = (scan: ScanResult) => {
    setHistoryOverrideScan(scan);
    setActiveCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="w-[390px] h-[560px] bg-[#090a0f] text-zinc-100 flex flex-col overflow-hidden relative font-sans border border-white/[0.08] shadow-2xl">
      {/* Top Header */}
      <Header
        domain={historyOverrideScan ? historyOverrideScan.domain : activeDomain}
        isCached={isCached && !historyOverrideScan}
        timestamp={activeScan?.timestamp}
        isLoading={isLoading}
        isHistoryMode={Boolean(historyOverrideScan)}
        onExitHistoryMode={() => setHistoryOverrideScan(null)}
        onRescan={handleRescan}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Historical Report Banner */}
      {historyOverrideScan && (
        <div className="px-3 py-1.5 bg-violet-950/40 border-b border-violet-500/20 flex items-center justify-between text-[10px] text-violet-300 font-mono shrink-0">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
            Viewing saved report ({historyOverrideScan.domain})
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
      ) : activeScan ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick Metrics */}
          <MetricsBanner
            stats={activeScan.stats}
            inferredCount={inferredCount}
          />

          {/* Search Bar */}
          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredTechnologies.length}
            totalCount={activeScan.technologies.length}
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
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Bottom Footer Actions (JSON / CSV Export) */}
      <FooterActions
        scanResult={activeScan}
        disabled={isLoading || Boolean(error)}
      />

      {/* Scan History Slide-over Drawer */}
      {isHistoryOpen && (
        <HistoryModal
          onClose={() => setIsHistoryOpen(false)}
          onSelectScan={handleSelectHistoryScan}
        />
      )}
    </div>
  );
};
