/**
 * SiteStack Architecture Intelligence - Dedicated Canvas Empty / Error State
 * Location: src/canvas/components/CanvasEmptyState.tsx
 */

import React from 'react';
import { AlertCircle, Clock, RotateCcw, ArrowLeft } from 'lucide-react';
import { SiteStackLogo } from '../../popup/components/SiteStackLogo';

export interface CanvasEmptyStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly isExpired?: boolean;
  readonly isMissing?: boolean;
  readonly onTryHistory?: () => void;
  readonly onReset?: () => void;
  readonly theme?: 'dark' | 'light';
}

export const CanvasEmptyState: React.FC<CanvasEmptyStateProps> = ({
  title = 'No Architecture Scan Loaded',
  message = 'Open the SiteStack extension popup on any website and click "Open Canvas" in the Architecture tab to launch the full-screen interactive view.',
  isExpired = false,
  isMissing = false,
  onTryHistory,
  onReset,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center select-none transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#07090e] text-zinc-100'
    }`}>
      <div className="mb-5">
        <div className="relative inline-block">
          {/* Official SiteStack Brand Mark from public/icons/ */}
          <SiteStackLogo size={56} showGlow={!isLight} className="shadow-2xl" />
          {isMissing && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-slate-900 shadow"
              title="Scan not found"
            >
              <AlertCircle className="w-3 h-3" />
            </div>
          )}
          {isExpired && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-slate-900 shadow"
              title="Launch session expired"
            >
              <Clock className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>

      <h1 className={`text-lg font-bold mb-2 max-w-md ${isLight ? 'text-slate-900' : 'text-white'}`}>
        {isExpired
          ? 'Canvas Scan Transfer Expired'
          : isMissing
          ? 'Scan Record Not Found'
          : title}
      </h1>

      <p className={`text-xs max-w-md leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
        {isExpired
          ? 'For security and tab isolation, transfer payloads expire after 15 minutes. Re-open the extension popup to generate a fresh canvas launch.'
          : message}
      </p>

      <div className="flex items-center gap-3">
        {onTryHistory && (
          <button
            onClick={onTryHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Latest Saved Scan</span>
          </button>
        )}

        {onReset && (
          <button
            onClick={onReset}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
};
