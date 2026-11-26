import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import { SiteStackLogo } from './SiteStackLogo';

interface ScanRadarProps {
  domain: string;
}

const SCAN_STEPS = [
  'Probing isolated runtime JavaScript globals...',
  'Inspecting DOM hierarchy and markup selectors...',
  'Matching script deliveries and network assets...',
  'Calibrating multi-signal confidence scores...',
];

export const ScanRadar: React.FC<ScanRadarProps> = ({ domain }) => {
  const [stepIndex, setStepIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-indigo-500/40 radar-wave"></div>
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 radar-wave-delayed"></div>
        <SiteStackLogo size={44} showGlow={true} className="shadow-xl" />
      </div>

      <h3 className="text-xs font-bold text-white tracking-wide">
        Scanning {domain || 'Website'}
      </h3>
      <p className="text-[11px] text-indigo-300 font-mono mt-1 max-w-[280px] leading-relaxed min-h-[32px] flex items-center justify-center">
        {SCAN_STEPS[stepIndex]}
      </p>

      <div className="mt-3 flex items-center gap-2 text-[9px] text-zinc-400 font-mono">
        <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.07]">
          <Cpu className="w-2.5 h-2.5 text-indigo-400" />
          <span>Local Engine</span>
        </span>
        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>Zero Telemetry</span>
        </span>
      </div>
    </div>
  );
};
