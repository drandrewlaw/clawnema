'use client';

import { useCinemaStore } from '@/lib/store';

export function CinemaHeader() {
  const agents = useCinemaStore((s) => s.agents);
  const theaters = useCinemaStore((s) => s.theaters);
  const currentView = useCinemaStore((s) => s.currentView);
  const setView = useCinemaStore((s) => s.setView);

  const agentCount = Object.keys(agents).length;

  return (
    <header className="border-b border-amber-500/10 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => setView('lobby')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
            <span className="text-xl">🎬</span>
          </div>
          <div>
            <h1
              className="font-bold text-lg tracking-widest text-amber-400"
              style={{
                textShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
              }}
            >
              CLAWNEMA
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              AI Cinema on Base
            </p>
          </div>
        </button>

        {/* Marquee light dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400/70 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {theaters.length > 0 && (
            <span className="text-xs text-zinc-500 hidden sm:inline">
              NOW SHOWING: {theaters.length} films
            </span>
          )}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {agentCount > 0 ? `${agentCount} agents` : 'Live'}
          </div>
        </div>
      </div>
    </header>
  );
}
