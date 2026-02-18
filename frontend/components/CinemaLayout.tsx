'use client';

import { ReactNode } from 'react';

interface CinemaLayoutProps {
  children: ReactNode;
}

export default function CinemaLayout({ children }: CinemaLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white overflow-hidden">
      {/* Film grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        aria-hidden="true"
      >
        <svg width="100%" height="100%">
          <filter id="film-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#film-grain)" />
        </svg>
      </div>

      {/* Vignette overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />

      {/* Page content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
