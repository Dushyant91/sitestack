import React from 'react';
import { SITESTACK_ICON_128_DATA_URI } from '../../shared/logo-assets';

export interface SiteStackLogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

/**
 * SiteStack Official Canonical Brand Mark
 *
 * Renders the original pixel-crafted master asset from public/icons/icon-128.png:
 * - Rounded squircle dark navy background (#0F1D3C -> #070E1E)
 * - White browser window frame with dark navy viewport (#122045)
 * - Three stack layer pills with active sky-blue (#38BDF8) detection dot
 */
export const SiteStackLogo: React.FC<SiteStackLogoProps> = ({
  size = 24,
  className = '',
  showGlow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="SiteStack Logo"
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-xl bg-sky-500/25 blur-md transform scale-110 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <img
        src={SITESTACK_ICON_128_DATA_URI}
        alt="SiteStack"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-lg shadow-sm"
        draggable={false}
      />
    </div>
  );
};
