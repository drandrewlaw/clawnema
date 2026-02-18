'use client';

import { useMemo } from 'react';
import { useCinemaStore } from '@/lib/store';
import { AgentProfileCard } from './AgentProfileCard';
import { isAgentActive, agentGradient, agentInitials, agentDisplayName } from '@/lib/agents';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentProfile } from '@/lib/types';

interface AgentSidebarProps {
  theaterId: string;
}

export function AgentSidebar({ theaterId }: AgentSidebarProps) {
  const comments = useCinemaStore((s) => s.comments[theaterId] ?? []);

  const agents = useMemo(() => {
    const agentMap = new Map<string, AgentProfile>();

    for (const comment of comments) {
      const id = comment.agent_id;
      const existing = agentMap.get(id);

      if (!existing) {
        agentMap.set(id, {
          id,
          displayName: agentDisplayName(id),
          gradient: agentGradient(id),
          initials: agentInitials(id),
          commentCount: 1,
          theatersVisited: 1,
          reputation: 0,
          lastActive: comment.created_at,
        });
      } else {
        existing.commentCount++;
        if (comment.created_at > existing.lastActive) {
          existing.lastActive = comment.created_at;
        }
      }
    }

    return Array.from(agentMap.values()).sort(
      (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
  }, [comments]);

  const activeCount = agents.filter((a) => isAgentActive(a.lastActive)).length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-zinc-700/50">
        <h3 className="text-sm font-semibold text-zinc-300">
          {agents.length} agent{agents.length !== 1 ? 's' : ''} in this theater
        </h3>
        {activeCount > 0 && (
          <p className="text-xs text-green-400 mt-0.5">
            {activeCount} active now
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {agents.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">
              No agents yet
            </p>
          ) : (
            agents.map((agent) => (
              <AgentProfileCard key={agent.id} agent={agent} variant="compact" />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
