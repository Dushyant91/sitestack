import React from 'react';

interface SiteStackLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

/**
 * SiteStack Unified Brand Logo
 * 
 * Clean, geometric "Browser-Stack" mark:
 * - Deep navy squircle background
 * - Crisp white browser window frame with titlebar controls
 * - Three floating horizontal technology strata layers
 * - Cyan/sky inspection indicator dot on the middle tier
 */
export const SiteStackLogo: React.FC<SiteStackLogoProps> = ({
  size = 24,
  className = '',
  showGlow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-lg bg-indigo-500/20 blur-sm transform scale-110 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10"
        aria-label="SiteStack Logo"
      >
        <defs>
          <linearGradient id="ss-bg-gradient" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F1D3C" />
            <stop offset="100%" stopColor="#070E1E" />
          </linearGradient>
          <linearGradient id="ss-accent-gradient" x1="8" y1="13" x2="24" y2="23.6" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>

        {/* Squircle Background Container */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="7"
          fill="url(#ss-bg-gradient)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />

        {/* Browser Window Viewport Fill */}
        <rect
          x="5"
          y="4.5"
          width="22"
          height="23"
          rx="3.5"
          fill="#122045"
        />

        {/* Browser Window Header Bar (Solid White) */}
        <path
          d="M5 8C5 6.067 6.567 4.5 8.5 4.5H23.5C25.433 4.5 27 6.067 27 8V10.5H5V8Z"
          fill="#FFFFFF"
        />

        {/* Browser Outer Frame (White 1.5px Stroke) */}
        <rect
          x="5"
          y="4.5"
          width="22"
          height="23"
          rx="3.5"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Window Control Dots in Header */}
        <circle cx="7.8" cy="7.5" r="0.85" fill="#122045" />
        <circle cx="10.4" cy="7.5" r="0.85" fill="#122045" />

        {/* Address Bar Pill in Header */}
        <rect x="14" y="6.4" width="9.6" height="2.2" rx="1.1" fill="#122045" fillOpacity="0.25" />

        {/* Tech Stack Layer 1 (UI / Framework) */}
        <rect x="7.8" y="13.2" width="16.4" height="2.4" rx="1.2" fill="url(#ss-accent-gradient)" />

        {/* Tech Stack Layer 2 (Platform / CMS / Libraries) */}
        <rect x="7.8" y="17.6" width="11.8" height="2.4" rx="1.2" fill="url(#ss-accent-gradient)" />

        {/* Active Inspection Indicator Dot */}
        <circle cx="22.2" cy="18.8" r="1.3" fill="#38BDF8" />

        {/* Tech Stack Layer 3 (Infrastructure / Analytics) */}
        <rect x="7.8" y="22" width="16.4" height="2.4" rx="1.2" fill="url(#ss-accent-gradient)" />
      </svg>
    </div>
  );
};
