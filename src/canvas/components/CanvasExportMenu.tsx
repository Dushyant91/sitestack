/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Export Menu
 * Location: src/canvas/components/CanvasExportMenu.tsx
 *
 * Provides a compact, keyboard-accessible export dropdown supporting
 * standalone vector SVG, high-resolution PNG (2x Retina), and schema-versioned JSON.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  FileCode,
  Image,
  Braces,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { ArchitectureGraph } from '../../engine/architecture/graph/types';
import { CanvasGraphLayoutResult } from '../types';
import { ScanResult } from '../../engine/types';
import { computeCanvasGraphLayout } from '../layout/canvas-layout';
import {
  exportArchitectureToSvg,
  exportArchitectureToPng,
  exportArchitectureToJson,
} from '../export';

export interface CanvasExportMenuProps {
  readonly graph: ArchitectureGraph | null;
  readonly layout?: CanvasGraphLayoutResult | null;
  readonly scanResult?: ScanResult | null;
  readonly disabled?: boolean;
  readonly theme?: 'dark' | 'light';
}

export const CanvasExportMenu: React.FC<CanvasExportMenuProps> = ({
  graph,
  layout,
  scanResult,
  disabled = false,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-dismiss feedback message after 3.5 seconds
  useEffect(() => {
    if (!exportFeedback) return;
    const timer = setTimeout(() => {
      setExportFeedback(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [exportFeedback]);

  // Ensure deterministic layout exists
  const getEffectiveLayout = useCallback((): CanvasGraphLayoutResult | null => {
    if (layout) return layout;
    if (graph) {
      return computeCanvasGraphLayout(graph);
    }
    return null;
  }, [graph, layout]);

  // 1. Export SVG
  const handleExportSvg = useCallback(() => {
    if (!graph || isExporting) return;
    const activeLayout = getEffectiveLayout();
    if (!activeLayout) return;

    try {
      setIsExporting(true);
      const res = exportArchitectureToSvg(graph, activeLayout);
      setExportFeedback({
        type: 'success',
        message: `Saved ${res.filename}`,
      });
      setIsOpen(false);
    } catch (err) {
      setExportFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'SVG export failed',
      });
    } finally {
      setIsExporting(false);
    }
  }, [graph, getEffectiveLayout, isExporting]);

  // 2. Export PNG
  const handleExportPng = useCallback(async () => {
    if (!graph || isExporting) return;
    const activeLayout = getEffectiveLayout();
    if (!activeLayout) return;

    try {
      setIsExporting(true);
      const res = await exportArchitectureToPng(graph, activeLayout, { scale: 2 });
      if (res.success) {
        setExportFeedback({
          type: 'success',
          message: `Saved ${res.filename}`,
        });
        setIsOpen(false);
      } else {
        setExportFeedback({
          type: 'error',
          message: res.error || 'PNG rasterization failed',
        });
      }
    } catch (err) {
      setExportFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'PNG export failed',
      });
    } finally {
      setIsExporting(false);
    }
  }, [graph, getEffectiveLayout, isExporting]);

  // 3. Export JSON
  const handleExportJson = useCallback(() => {
    if (!graph || isExporting) return;

    try {
      setIsExporting(true);
      exportArchitectureToJson(graph, scanResult);
      setExportFeedback({
        type: 'success',
        message: `Saved ${graph.domain || 'architecture'}.json`,
      });
      setIsOpen(false);
    } catch (err) {
      setExportFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'JSON export failed',
      });
    } finally {
      setIsExporting(false);
    }
  }, [graph, scanResult, isExporting]);

  const isButtonDisabled = disabled || !graph || graph.nodes.length === 0;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={isButtonDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Export architecture"
        data-testid="export-trigger-btn"
        title="Export architecture graph (SVG, PNG, JSON)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
          isButtonDisabled
            ? isLight
              ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
              : 'opacity-40 cursor-not-allowed bg-white/[0.02] text-zinc-500 border border-white/[0.04]'
            : isOpen
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
            : isLight
            ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
            : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border border-white/[0.08]'
        }`}
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        ) : (
          <Download className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`} />
        )}
        <span>Export</span>
        <ChevronDown
          className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-zinc-400'} transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Floating Dropdown Menu Card */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0d0f17] border border-white/[0.1] shadow-2xl p-1.5 z-50 text-xs select-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-400">
              Export Architecture
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
              Export the complete graph layout with grounded evidence semantics.
            </p>
          </div>

          <div className="space-y-0.5">
            {/* 1. Vector SVG Option */}
            <button
              type="button"
              role="menuitem"
              data-format="svg"
              disabled={isExporting}
              onClick={handleExportSvg}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] text-left transition-colors group cursor-pointer"
            >
              <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform mt-0.5">
                <FileCode className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    Vector Graphic
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    SVG
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                  Standalone vector document for Figma, Illustrator, or presentations.
                </p>
              </div>
            </button>

            {/* 2. High-Res PNG Option */}
            <button
              type="button"
              role="menuitem"
              data-format="png"
              disabled={isExporting}
              onClick={handleExportPng}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] text-left transition-colors group cursor-pointer"
            >
              <div className="p-1.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:scale-105 transition-transform mt-0.5">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                    High-Res Image
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                    PNG (2x)
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                  Retina 2x raster image ready for documentation, Slack, or sharing.
                </p>
              </div>
            </button>

            {/* 3. Architecture JSON Option */}
            <button
              type="button"
              role="menuitem"
              data-format="json"
              disabled={isExporting}
              onClick={handleExportJson}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] text-left transition-colors group cursor-pointer"
            >
              <div className="p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform mt-0.5">
                <Braces className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    Architecture Schema
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    JSON
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                  Versioned schema with dependencies, ranks, and evidence provenance.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Feedback Toast */}
      {exportFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute right-0 top-full mt-2 w-64 p-2.5 rounded-lg border text-xs shadow-2xl flex items-center gap-2 z-50 animate-in fade-in duration-150 ${
            exportFeedback.type === 'success'
              ? 'bg-[#0f1712] border-emerald-500/40 text-emerald-200'
              : 'bg-[#180f12] border-rose-500/40 text-rose-200'
          }`}
        >
          {exportFeedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="truncate">{exportFeedback.message}</span>
        </div>
      )}
    </div>
  );
};
