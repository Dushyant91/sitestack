import React from 'react';
import { ShieldAlert, RefreshCw, AlertCircle, WifiOff, Bot, ExternalLink, Globe } from 'lucide-react';
import { ScanError } from '../../shared/messages';

interface ErrorStateProps {
  error: ScanError;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const isRestricted = error.code === 'RESTRICTED_URL' || error.code === 'UNSUPPORTED_SCHEME';
  const isUnavailable = error.code === 'PAGE_UNAVAILABLE';
  const isChallenge = error.code === 'BOT_CHALLENGE';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none space-y-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner ${
          isChallenge
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : isRestricted || isUnavailable
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
        }`}
      >
        {isChallenge ? (
          <Bot className="w-5 h-5 text-amber-400" />
        ) : isRestricted ? (
          <ShieldAlert className="w-5 h-5" />
        ) : isUnavailable ? (
          <WifiOff className="w-5 h-5" />
        ) : (
          <AlertCircle className="w-5 h-5" />
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold text-white mb-1">
          {isChallenge
            ? 'Verification Challenge'
            : isRestricted
            ? 'Page Not Supported'
            : isUnavailable
            ? 'Page Unavailable'
            : 'Scan Failed'}
        </h3>

        <p className="text-[11px] text-zinc-400 max-w-[270px] leading-relaxed mx-auto">
          {isChallenge
            ? error.message || 'Complete the challenge verification in the active tab to load the full page, then click Re-scan Once Verified.'
            : isRestricted
            ? 'SiteStack can inspect regular websites, not browser-internal pages. Chromium security policies prevent extension probes from injecting scripts into internal browser pages (chrome://, chrome-extension://, or Chrome Web Store).'
            : isUnavailable
            ? error.message || 'The active tab encountered a network disconnect or browser error before SiteStack could complete inspection.'
            : error.message}
        </p>
      </div>

      {isChallenge && (
        <div className="p-2.5 rounded-lg bg-amber-500/[0.05] border border-amber-500/25 text-[10px] text-amber-200/90 font-mono max-w-[280px] leading-relaxed">
          Complete the challenge verification in the active tab to load the full page, then click Re-scan Once Verified.
        </div>
      )}

      {isRestricted && (
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] text-zinc-400 font-mono max-w-[280px] text-left space-y-1">
          <span className="text-zinc-300 font-semibold flex items-center gap-1 font-sans">
            <Globe className="w-3 h-3 text-indigo-400" />
            Actionable Next Step:
          </span>
          <p className="leading-relaxed">
            Navigate to any regular website (HTTP/HTTPS) and open SiteStack.
          </p>
        </div>
      )}

      {!isRestricted && (
        <button
          onClick={onRetry}
          className={`min-h-[32px] px-3.5 py-1.5 rounded-lg text-white text-xs font-medium transition-all shadow-md active:scale-95 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:outline-none ${
            isChallenge
              ? 'bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-500 shadow-amber-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:ring-indigo-500 shadow-indigo-600/30'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isChallenge ? 'Re-scan Once Verified' : 'Try Again'}</span>
        </button>
      )}

      <div className="pt-2">
        <a
          href="https://sitestack.pages.dev/docs#faq"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 hover:text-zinc-300 text-[10px] inline-flex items-center gap-1 transition-colors"
        >
          <span>View Troubleshooting FAQ</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
