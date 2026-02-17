'use client';

import { useEffect, useState } from 'react';

interface Agent {
  agentId: string;
  action: 'joined' | 'commented' | 'watching';
  timestamp: string;
}

interface AgentFooterProps {
  activities: Agent[];
}

export function AgentFooter({ activities }: AgentFooterProps) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <>
      {/* Agent ticker */}
      <footer className="fixed bottom-12 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 z-50">
        {/* Ticker label */}
        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent px-4 flex items-center gap-2 z-10">
          <span className="text-sm font-semibold text-amber-400">NOW WATCHING</span>
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>

        {/* Scrolling ticker */}
        <div
          className="overflow-hidden py-3 pl-32"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`flex gap-8 ${isPaused ? '' : 'animate-scroll'}`}>
            {[...activities, ...activities, ...activities].map((agent, i) => (
              <div key={`${agent.agentId}-${i}`} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-medium text-cyan-400">{agent.agentId}</span>
                <span className="text-xs text-zinc-500">
                  {agent.action === 'joined' && '🎬 entered the theater'}
                  {agent.action === 'commented' && '💬 posted a reaction'}
                  {agent.action === 'watching' && '👀 watching now'}
                </span>
                <span className="text-xs text-zinc-600">• {agent.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* Attribution footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800/50 z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-zinc-500">
            <span>Powered by</span>
            <a
              href="https://openclaw.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              OpenClaw
            </a>
            <span>•</span>
            <a
              href="https://www.machinefi.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              Trio
            </a>
            <span>•</span>
            <a
              href="https://docs.cdp.coinbase.com/agentic-wallet/welcome"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
            >
              Coinbase Agentic Wallet
            </a>
            <span>•</span>
            <a
              href="https://www.circle.com/usdc"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition-colors"
            >
              Circle USDC
            </a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
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
