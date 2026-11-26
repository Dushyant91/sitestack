/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Header
 * Location: src/canvas/components/CanvasHeader.tsx
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  X,
  ExternalLink,
  Layers,
  ShieldCheck,
  GitFork,
  Link2,
  Keyboard,
  Sun,
  Moon,
} from 'lucide-react';
import { ArchitectureGraph } from '../../engine/architecture/graph/types';
import { ScanResult } from '../../engine/types';
import { CanvasViewport } from '../types';
import { CanvasExportMenu } from './CanvasExportMenu';
import { SiteStackLogo } from '../../popup/components/SiteStackLogo';

export interface CanvasHeaderProps {
  readonly graph: ArchitectureGraph | null;
  readonly domain: string;
  readonly url?: string;
  readonly timestamp?: number;
  readonly isHistoricalFallback?: boolean;
  readonly scanResult?: ScanResult | null;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly viewport: CanvasViewport;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onZoomReset: () => void;
  readonly onFitToScreen: () => void;
  readonly onClose?: () => void;
  readonly theme?: 'dark' | 'light';
  readonly onToggleTheme?: () => void;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  graph,
  domain,
  url,
  timestamp,
  isHistoricalFallback: _isHistoricalFallback = false,
  scanResult,
  searchQuery,
  onSearchChange,
  viewport,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onClose,
  theme = 'dark',
  onToggleTheme,
}) => {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const zoomPercent = Math.round(viewport.zoom * 100);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) {
        setShowShortcuts(false);
      }
    };
    if (showShortcuts) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showShortcuts]);

  const isLight = theme === 'light';

  return (
    <header className={`h-14 ${
      isLight ? 'bg-white border-b border-slate-200 text-slate-900' : 'bg-[#0d0f17] border-b border-white/[0.08] text-white'
    } px-4 flex items-center justify-between gap-4 shrink-0 select-none z-20 transition-colors duration-200`}>
      {/* Left: Original Approved Branding & Scanned Website */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* SiteStack Official Brand Mark from public/icons/ */}
          <SiteStackLogo size={28} showGlow={!isLight} className="shrink-0" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold text-xs tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>SiteStack</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                CANVAS
              </span>
            </div>
          </div>
        </div>

        <div className={`h-4 w-px hidden sm:block ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

        {/* Domain Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-bold text-xs font-mono tracking-tight max-w-[200px] sm:max-w-[260px] truncate ${
              isLight ? 'text-slate-800' : 'text-zinc-200'
            }`}>
              {domain || 'Website Architecture'}
            </span>
            {formattedTime && (
              <span className={`text-[10px] font-mono hidden md:inline ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                ({formattedTime})
              </span>
            )}
          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1 rounded transition-colors hidden sm:inline-flex ${
                isLight ? 'text-slate-400 hover:text-indigo-600' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Open target URL: ${url}`}
              aria-label="Open target website"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Center: Graph Metrics Summary */}
      {graph && (
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.04] border-white/[0.08] text-zinc-300'
          }`}>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold">{graph.metrics.totalNodes}</span>{' '}
            <span className={isLight ? 'text-slate-500 text-[11px]' : 'text-zinc-500 text-[11px]'}>Techs</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold">{graph.metrics.directlyObservedEdges}</span>{' '}
            <span className={`text-[11px] ${isLight ? 'text-emerald-700' : 'text-emerald-400/80'}`}>Direct</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isLight ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-purple-500/10 border-purple-500/20 text-purple-300'
          }`}>
            <GitFork className="w-3.5 h-3.5 text-purple-500" />
            <span className="font-bold">{graph.metrics.inferredEdges}</span>{' '}
            <span className={`text-[11px] ${isLight ? 'text-purple-700' : 'text-purple-400/80'}`}>Inferred</span>
          </div>

          {graph.metrics.coDetectionEdges > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}>
              <Link2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-bold">{graph.metrics.coDetectionEdges}</span>{' '}
              <span className={`text-[11px] ${isLight ? 'text-amber-700' : 'text-amber-400/80'}`}>Unverified</span>
            </div>
          )}
        </div>
      )}

      {/* Right: Controls, Search, Theme Toggle & Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            isLight ? 'text-slate-400' : 'text-zinc-500'
          }`} />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-28 sm:w-44 h-8 pl-8 pr-7 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-200 placeholder-zinc-500 focus:bg-white/[0.08]'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className={`hidden sm:flex items-center rounded-lg border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/[0.08]'
        }`}>
          <button
            onClick={onZoomOut}
            className={`p-1.5 transition-colors ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'}`}
            title="Zoom out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className={`px-1 text-[11px] font-mono min-w-[38px] text-center select-none ${
            isLight ? 'text-slate-600' : 'text-zinc-400'
          }`}>
            {zoomPercent}%
          </span>
          <button
            onClick={onZoomIn}
            className={`p-1.5 transition-colors ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'}`}
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onFitToScreen}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Fit graph to viewport (F)"
        >
          <Maximize2 className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`} />
          <span className="text-[11px] font-medium hidden sm:inline">Fit</span>
        </button>

        <button
          onClick={onZoomReset}
          className={`p-1.5 rounded-lg border transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Reset pan and zoom (0)"
          aria-label="Reset pan and zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Keyboard Shortcuts Helper */}
        <div className="relative" ref={shortcutsRef}>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showShortcuts
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                : isLight
                ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Keyboard shortcuts"
            aria-label="Keyboard shortcuts"
            aria-expanded={showShortcuts}
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {showShortcuts && (
            <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-2xl p-3 z-50 text-xs ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131622] border-white/10 text-zinc-200'
            }`}>
              <div className={`flex items-center justify-between pb-2 mb-2 border-b ${
                isLight ? 'border-slate-100' : 'border-white/[0.08]'
              }`}>
                <span className={`font-semibold text-[11px] flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Keyboard className="w-3.5 h-3.5 text-indigo-500" />
                  Keyboard Controls
                </span>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Canvas</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Pan Canvas</span>
                  <div className="flex items-center gap-0.5">
                    <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                    }`}>↑</kbd>
                    <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                    }`}>↓</kbd>
                    <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                    }`}>←</kbd>
                    <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                    }`}>→</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Zoom In / Out</span>
                  <div className="flex items-center gap-0.5">
                    <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                    }`}>+</kbd>
                    <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                    }`}>-</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Reset View</span>
                  <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                  }`}>0</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Fit to Screen</span>
                  <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                  }`}>F</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isLight ? 'text-slate-500' : 'text-zinc-400'}>Close Drawer</span>
                  <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/[0.06] border-white/10 text-zinc-200'
                  }`}>Esc</kbd>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                : 'bg-white/[0.04] border-white/[0.08] text-amber-300 hover:text-white hover:bg-white/[0.08]'
            } focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
            title={isLight ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
            aria-label={isLight ? 'Switch to Night Mode (Dark)' : 'Switch to Day Mode (Light)'}
          >
            {isLight ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        <div className={`h-4 w-px mx-0.5 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />

        {/* Architecture Export Menu Dropdown */}
        <CanvasExportMenu
          graph={graph}
          scanResult={scanResult}
          disabled={!graph || graph.nodes.length === 0}
          theme={theme}
        />

        {onClose && (
          <button
            onClick={onClose}
            className={`p-1.5 ml-1 rounded-lg border transition-colors ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10'
            }`}
            title="Close canvas"
            aria-label="Close canvas"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
