import React from 'react';
import { ShieldAlert, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';
import { ScanError } from '../../shared/messages';

interface ErrorStateProps {
  error: ScanError;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const isRestricted = error.code === 'RESTRICTED_URL' || error.code === 'UNSUPPORTED_SCHEME';
  const isUnavailable = error.code === 'PAGE_UNAVAILABLE';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 border ${
          isRestricted
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            : isUnavailable
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
        }`}
      >
        {isRestricted ? (
          <ShieldAlert className="w-5 h-5" />
        ) : isUnavailable ? (
          <WifiOff className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
      </div>

      <h3 className="text-xs font-bold text-white mb-1.5">
        {isRestricted ? 'Page Not Supported' : isUnavailable ? 'Page Unavailable' : 'Scan Failed'}
      </h3>

      <p className="text-[11px] text-zinc-400 max-w-[260px] leading-relaxed mb-4">
        {isRestricted
          ? 'SiteStack can inspect regular websites, not browser-internal pages.'
          : error.message}
      </p>

      {!isRestricted && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/25 active:scale-95 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry Inspection</span>
        </button>
      )}

      {isRestricted && (
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] text-zinc-400 font-mono max-w-[270px]">
          Navigate to any regular website (HTTP/HTTPS) and open SiteStack.
        </div>
      )}
    </div>
  );
};
