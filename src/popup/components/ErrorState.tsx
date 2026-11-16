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
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 border ${
          isRestricted
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : isUnavailable
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
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

      <h3 className="text-xs font-bold text-white mb-1">
        {isRestricted ? 'Restricted Page' : isUnavailable ? 'Page Unavailable' : 'Scan Failed'}
      </h3>

      <p className="text-[11px] text-zinc-400 max-w-[250px] leading-relaxed mb-4">
        {error.message}
      </p>

      {!isRestricted && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry Inspection</span>
        </button>
      )}

      {isRestricted && (
        <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
          Navigate to any standard website (HTTP/HTTPS) and open SiteStack.
        </div>
      )}
    </div>
  );
};
