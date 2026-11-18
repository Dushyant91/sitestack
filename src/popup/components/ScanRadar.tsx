import React from 'react';
import { SiteStackLogo } from './SiteStackLogo';

interface ScanRadarProps {
  domain: string;
}

export const ScanRadar: React.FC<ScanRadarProps> = ({ domain }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-indigo-500/40 radar-wave"></div>
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 radar-wave-delayed"></div>
        <SiteStackLogo size={44} showGlow={true} className="shadow-xl" />
      </div>

      <h3 className="text-xs font-bold text-white tracking-wide">
        Scanning {domain || 'Website'}...
      </h3>
      <p className="text-[11px] text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
        Analyzing DOM, JavaScript globals and resource signals...
      </p>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-300 font-mono bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
        <span>Evaluating Client-Side Stack</span>
      </div>
    </div>
  );
};
