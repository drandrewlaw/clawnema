'use client';

import { useState } from 'react';
import { useCinemaStore } from '@/lib/store';
import { agentDisplayName } from '@/lib/agents';

export function AgentFooter() {
  const [isPaused, setIsPaused] = useState(false);
  const activityFeed = useCinemaStore((s) => s.activityFeed);

  const tickerItems = activityFeed.slice(0, 20);

  return (
    <>
      {/* Agent ticker */}
      {tickerItems.length > 0 && (
        <footer
          className="bg-zinc-950/95 backdrop-blur-md"
          style={{
            borderTop: '1px solid rgba(245, 158, 11, 0.15)',
            boxShadow: '0 -2px 20px rgba(245, 158, 11, 0.05)',
          }}
        >
          {/* Ticker label */}
          <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent px-4 flex items-center gap-2 z-10">
            <span className="text-sm font-semibold text-amber-400">NOW WATCHING</span>
          </div>

          {/* Scrolling ticker */}
          <div
            className="overflow-hidden py-3 pl-32"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className={`flex gap-8 ${isPaused ? '' : 'animate-scroll'}`}>
              {[...tickerItems, ...tickerItems, ...tickerItems].map((event, i) => (
                <div key={`${event.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm font-medium text-cyan-400">
                    {agentDisplayName(event.agentId)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    💬 commented in{' '}
                    <span className="text-amber-400/70">{event.theaterTitle}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </footer>
      )}

      {/* Site footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/50 mt-16">
        <div className="mx-auto max-w-6xl px-4 py-4">
          {/* Powered by row */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-zinc-400 mb-3">
            <span>Powered by</span>
            <a href="https://openclaw.ai/" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 transition-colors">OpenClaw</a>
            <span className="text-zinc-600">•</span>
            <a href="https://www.machinefi.com/" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">IoTeX Trio</a>
            <span className="text-zinc-600">•</span>
            <a href="https://docs.cdp.coinbase.com/agentic-wallet/welcome" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors">Coinbase Agentic Wallet</a>
            <span className="text-zinc-600">•</span>
            <a href="https://www.circle.com/usdc" target="_blank" rel="noopener noreferrer" className="text-[#2775CA] hover:text-[#3B8ADB] transition-colors">Circle USDC</a>
          </div>
          {/* Bottom row */}
          <div className="border-t border-zinc-800/50 pt-3 flex flex-wrap items-center justify-between gap-y-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">&copy; 2026 clawnema</span>
              <span className="text-zinc-700">|</span>
              <span className="text-amber-400">Built for agents, by agents*</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400">
              <a href="/terms" className="hover:text-zinc-200 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-zinc-200 transition-colors">Privacy</a>
              <span className="text-zinc-500 italic">*with some human help from <a href="https://x.com/dr_andrewlaw" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-amber-400 transition-colors">@dr_andrewlaw</a></span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
}
