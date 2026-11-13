import React from 'react';

interface TechIconProps {
  id: string;
  name: string;
  className?: string;
}

export const TechIcon: React.FC<TechIconProps> = ({ id, name, className = 'w-7 h-7' }) => {
  switch (id) {
    case 'react':
      return (
        <div className={`${className} rounded-lg bg-[#00d8ff]/10 border border-[#00d8ff]/20 flex items-center justify-center text-[#00d8ff] font-bold text-xs`}>
          ⚛
        </div>
      );
    case 'nextjs':
      return (
        <div className={`${className} rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-white font-mono font-bold text-xs shadow-inner`}>
          N
        </div>
      );
    case 'vue':
      return (
        <div className={`${className} rounded-lg bg-[#42b883]/10 border border-[#42b883]/20 flex items-center justify-center text-[#42b883] font-bold text-xs`}>
          V
        </div>
      );
    case 'angular':
      return (
        <div className={`${className} rounded-lg bg-[#dd0031]/10 border border-[#dd0031]/20 flex items-center justify-center text-[#dd0031] font-bold text-xs`}>
          A
        </div>
      );
    case 'wordpress':
      return (
        <div className={`${className} rounded-lg bg-[#21759b]/15 border border-[#21759b]/30 flex items-center justify-center text-[#21759b] font-bold text-xs`}>
          W
        </div>
      );
    case 'shopify':
      return (
        <div className={`${className} rounded-lg bg-[#95bf47]/15 border border-[#95bf47]/30 flex items-center justify-center text-[#95bf47] font-bold text-xs`}>
          S
        </div>
      );
    case 'webflow':
      return (
        <div className={`${className} rounded-lg bg-[#4353ff]/15 border border-[#4353ff]/30 flex items-center justify-center text-[#4353ff] font-bold text-xs`}>
          W
        </div>
      );
    case 'wix':
      return (
        <div className={`${className} rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold text-xs`}>
          Wx
        </div>
      );
    case 'woocommerce':
      return (
        <div className={`${className} rounded-lg bg-[#96588a]/15 border border-[#96588a]/30 flex items-center justify-center text-[#96588a] font-bold text-xs`}>
          Wc
        </div>
      );
    case 'stripe':
      return (
        <div className={`${className} rounded-lg bg-[#635bff]/15 border border-[#635bff]/30 flex items-center justify-center text-[#635bff] font-bold text-xs`}>
          S
        </div>
      );
    case 'razorpay':
      return (
        <div className={`${className} rounded-lg bg-[#0c2340]/40 border border-[#0284c7]/30 flex items-center justify-center text-[#0284c7] font-bold text-xs`}>
          R
        </div>
      );
    case 'google-analytics':
      return (
        <div className={`${className} rounded-lg bg-[#e37400]/15 border border-[#e37400]/30 flex items-center justify-center text-[#e37400] font-bold text-xs`}>
          GA
        </div>
      );
    case 'google-tag-manager':
      return (
        <div className={`${className} rounded-lg bg-[#246fdb]/15 border border-[#246fdb]/30 flex items-center justify-center text-[#246fdb] font-bold text-xs`}>
          GTM
        </div>
      );
    case 'hotjar':
      return (
        <div className={`${className} rounded-lg bg-[#fd3a5c]/15 border border-[#fd3a5c]/30 flex items-center justify-center text-[#fd3a5c] font-bold text-xs`}>
          H
        </div>
      );
    case 'meta-pixel':
      return (
        <div className={`${className} rounded-lg bg-[#0081fb]/15 border border-[#0081fb]/30 flex items-center justify-center text-[#0081fb] font-bold text-xs`}>
          M
        </div>
      );
    case 'hubspot':
      return (
        <div className={`${className} rounded-lg bg-[#ff7a59]/15 border border-[#ff7a59]/30 flex items-center justify-center text-[#ff7a59] font-bold text-xs`}>
          HS
        </div>
      );
    case 'intercom':
      return (
        <div className={`${className} rounded-lg bg-[#1f8eed]/15 border border-[#1f8eed]/30 flex items-center justify-center text-[#1f8eed] font-bold text-xs`}>
          I
        </div>
      );
    case 'jquery':
      return (
        <div className={`${className} rounded-lg bg-[#0769ad]/15 border border-[#0769ad]/30 flex items-center justify-center text-[#0769ad] font-bold text-xs`}>
          jQ
        </div>
      );
    case 'bootstrap':
      return (
        <div className={`${className} rounded-lg bg-[#7952b3]/15 border border-[#7952b3]/30 flex items-center justify-center text-[#7952b3] font-bold text-xs`}>
          B
        </div>
      );
    case 'tailwindcss':
      return (
        <div className={`${className} rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8] font-bold text-xs`}>
          ≈
        </div>
      );
    case 'cloudflare':
      return (
        <div className={`${className} rounded-lg bg-[#f38020]/15 border border-[#f38020]/30 flex items-center justify-center text-[#f38020] font-bold text-xs`}>
          CF
        </div>
      );
    case 'vercel':
      return (
        <div className={`${className} rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-bold text-xs`}>
          ▲
        </div>
      );
    case 'netlify':
      return (
        <div className={`${className} rounded-lg bg-[#00c7b7]/15 border border-[#00c7b7]/30 flex items-center justify-center text-[#00c7b7] font-bold text-xs`}>
          ◆
        </div>
      );
    default:
      return (
        <div className={`${className} rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 font-bold text-xs`}>
          {name.charAt(0).toUpperCase()}
        </div>
      );
  }
};
