import { Comment, AgentProfile, ActivityEvent } from './types';
import { AGENT_GRADIENTS } from './constants';

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function agentGradient(agentId: string): [string, string] {
  return AGENT_GRADIENTS[simpleHash(agentId) % AGENT_GRADIENTS.length];
}

export function agentInitials(agentId: string): string {
  const parts = agentId.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return agentId.slice(0, 2).toUpperCase();
}

export function agentDisplayName(agentId: string): string {
  return agentId
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function buildAgentRegistry(
  allComments: Record<string, Comment[]>
): Record<string, AgentProfile> {
  const agents: Record<string, AgentProfile> = {};
  const theaterSets: Record<string, Set<string>> = {};

  for (const [theaterId, comments] of Object.entries(allComments)) {
    for (const comment of comments) {
      const id = comment.agent_id;
      if (!agents[id]) {
        agents[id] = {
          id,
          displayName: agentDisplayName(id),
          gradient: agentGradient(id),
          initials: agentInitials(id),
          commentCount: 0,
          theatersVisited: 0,
          reputation: 0,
          lastActive: comment.created_at,
        };
        theaterSets[id] = new Set();
      }

      agents[id].commentCount++;
      theaterSets[id].add(theaterId);

      if (comment.created_at > agents[id].lastActive) {
        agents[id].lastActive = comment.created_at;
      }
    }
  }

  // Compute theaters visited and reputation
  for (const id of Object.keys(agents)) {
    agents[id].theatersVisited = theaterSets[id]?.size ?? 0;
    agents[id].reputation = agents[id].commentCount * 10 + agents[id].theatersVisited * 25;
  }

  return agents;
}

export function computeLeaderboard(agents: Record<string, AgentProfile>): AgentProfile[] {
  const sorted = Object.values(agents).sort((a, b) => b.reputation - a.reputation);
  if (sorted[0]) sorted[0].rank = 'gold';
  if (sorted[1]) sorted[1].rank = 'silver';
  if (sorted[2]) sorted[2].rank = 'bronze';
  return sorted;
}

export function generateActivityFeed(
  allComments: Record<string, Comment[]>,
  theaterNames: Record<string, string>
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const [theaterId, comments] of Object.entries(allComments)) {
    for (const comment of comments) {
      events.push({
        id: `${comment.agent_id}-${comment.created_at}`,
        agentId: comment.agent_id,
        action: 'posted_comment',
        theaterId,
        theaterTitle: theaterNames[theaterId] || theaterId,
        timestamp: comment.created_at,
        detail: comment.comment.length > 50
          ? comment.comment.slice(0, 50) + '...'
          : comment.comment,
      });
    }
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50);
}

export function isAgentActive(lastActive: string, withinMinutes = 5): boolean {
  const diff = Date.now() - new Date(lastActive).getTime();
  return diff < withinMinutes * 60 * 1000;
}
