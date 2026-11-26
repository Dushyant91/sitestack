import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, ShieldCheck, GitFork, Info } from 'lucide-react';
import { ScanResult } from '../../engine/types';

interface MetricsBannerProps {
  stats: ScanResult['stats'];
  inferredCount: number;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats, inferredCount }) => {
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showGuide) {
      closeBtnRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowGuide(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showGuide]);

  return (
    <>
      <div className="px-3.5 py-1.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 text-[11px] font-medium">Stack:</span>
          <span className="font-semibold font-mono text-[11px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/25 px-1.5 py-0.5 rounded">
            {stats.total} {stats.total === 1 ? 'Technology' : 'Technologies'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {stats.high > 0 && (
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/20 transition-colors cursor-pointer"
              title="High confidence detections (>= 80 pts). Click to learn how scores work."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"></span>
              {stats.high} High
            </button>
          )}
          {stats.medium > 0 && (
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 text-amber-400 font-medium bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/20 transition-colors cursor-pointer"
              title="Medium confidence detections (50-79 pts). Click to learn how scores work."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"></span>
              {stats.medium} Med
            </button>
          )}
          {inferredCount > 0 && (
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1 text-violet-300 font-medium bg-violet-500/10 hover:bg-violet-500/20 px-1.5 py-0.5 rounded border border-violet-500/20 transition-colors cursor-pointer"
              title="Architecturally inferred dependencies. Click to learn how scores work."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.5)]"></span>
              {inferredCount} Inferred
            </button>
          )}

          <button
            onClick={() => setShowGuide(true)}
            aria-label="Explain confidence scoring system"
            title="How confidence scores are calculated"
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Accessible Confidence Score Explanation Modal */}
      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confidence score explanation"
          className="absolute inset-0 z-50 flex flex-col bg-[#090a0f]/95 backdrop-blur-md animate-in fade-in duration-150 p-4 overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Confidence Scoring Transparency
              </h3>
            </div>
            <button
              ref={closeBtnRef}
              onClick={() => setShowGuide(false)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close confidence guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 py-3 text-[11px] text-zinc-300 font-sans leading-relaxed">
            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
              <span className="font-bold text-indigo-300 text-xs block">What does the score represent?</span>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                SiteStack confidence scores (0–100%) measure <strong>heuristic detection confidence</strong> based on verifiable client-side signals.
              </p>
              <p className="text-zinc-400 text-[10px] leading-relaxed">
                A 100% score indicates certain, corroborated presence. It is <strong>NOT</strong> a percentage of the website&apos;s codebase and <strong>NOT</strong> a statistically calibrated probability.
              </p>
            </div>

            <div className="space-y-2 font-mono text-[10px]">
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    HIGH CONFIDENCE (80% – 100%)
                  </span>
                  <span className="text-emerald-300/80 uppercase">Corroborated</span>
                </div>
                <p className="font-sans text-[10px] text-zinc-300 leading-relaxed">
                  Requires corroboration across 2+ independent signal classes (e.g. DOM structure + runtime global) or definitive runtime proof of active execution.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    MEDIUM CONFIDENCE (50% – 79%)
                  </span>
                  <span className="text-amber-300/80 uppercase">Probable</span>
                </div>
                <p className="font-sans text-[10px] text-zinc-300 leading-relaxed">
                  Verified by a primary signal (such as a versioned script delivery or unique namespace), but lacks multi-class confirmation of full active execution.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                    LOW CONFIDENCE (30% – 49%)
                  </span>
                  <span className="text-zinc-500 uppercase">Isolated</span>
                </div>
                <p className="font-sans text-[10px] text-zinc-400 leading-relaxed">
                  Isolated signal (e.g. client telemetry script or non-authoritative asset). Scored below 30% is discarded as noise.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-violet-950/25 border border-violet-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-violet-300 flex items-center gap-1.5">
                    <GitFork className="w-3 h-3 text-violet-400" />
                    INFERRED DEPENDENCY (30% – 75%)
                  </span>
                  <span className="text-violet-400 uppercase">Architectural</span>
                </div>
                <p className="font-sans text-[10px] text-zinc-300 leading-relaxed">
                  Technically required foundation of a confirmed parent technology (e.g. React inferred when Next.js is detected). Calibrated to reflect parent confidence without claiming direct browser global exposure.
                </p>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1 text-zinc-300 font-semibold">
                <Info className="w-3 h-3 text-indigo-400" />
                <span>Deterministic Zero-Telemetry Architecture</span>
              </div>
              <p className="leading-relaxed">
                All detection happens strictly in your local browser memory using passive inspection. No data is sent to external servers.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex justify-end">
            <button
              onClick={() => setShowGuide(false)}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
