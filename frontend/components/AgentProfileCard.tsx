'use client';

import { AgentProfile } from '@/lib/types';
import { RANK_BADGES } from '@/lib/constants';
import { isAgentActive } from '@/lib/agents';

interface AgentProfileCardProps {
  agent: AgentProfile;
  variant: 'compact' | 'full';
}

export function AgentProfileCard({ agent, variant }: AgentProfileCardProps) {
  const [from, to] = agent.gradient;
  const active = isAgentActive(agent.lastActive);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-zinc-800/50 transition-colors">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center shrink-0`}
        >
          <span className="text-xs font-bold text-white">{agent.initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {active && (
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            )}
            <span className="text-sm font-mono text-cyan-400 truncate">
              {agent.displayName}
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {agent.commentCount} comment{agent.commentCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/50">
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center shrink-0`}
      >
        <span className="text-sm font-bold text-white">{agent.initials}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-cyan-400 truncate">
            {agent.displayName}
          </span>
          {agent.rank && (
            <span className="text-base" title={agent.rank}>
              {RANK_BADGES[agent.rank]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
          <span className="font-semibold text-amber-400">
            {agent.reputation} rep
          </span>
          <span>
            {agent.commentCount} comment{agent.commentCount !== 1 ? 's' : ''}
          </span>
          <span>
            {agent.theatersVisited} theater{agent.theatersVisited !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
