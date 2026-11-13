import React from 'react';

interface ScanRadarProps {
  domain: string;
}

export const ScanRadar: React.FC<ScanRadarProps> = ({ domain }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-indigo-500/40 radar-wave"></div>
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 radar-wave-delayed"></div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/25 border border-indigo-500/50 flex items-center justify-center text-indigo-300 text-xl font-bold shadow-lg shadow-indigo-600/30">
          ⚡
        </div>
      </div>

      <h3 className="text-xs font-bold text-white tracking-wide">
        Scanning {domain || 'Website'}...
      </h3>
      <p className="text-[11px] text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
        Probing DOM meta, script tags, runtime globals, and network resource timings...
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono bg-indigo-950/40 px-2 py-1 rounded-full border border-indigo-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
        <span>Evaluating Client-Side Stack</span>
      </div>
    </div>
  );
};
