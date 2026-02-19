'use client';

import { useEffect, useMemo } from 'react';
import { useCinemaStore } from '@/lib/store';
import { fetchTheaters, fetchComments } from '@/lib/api';
import { COMMENT_POLL_INTERVAL, RANK_BADGES, SESSION_DURATION_HOURS } from '@/lib/constants';
import { agentGradient, agentInitials } from '@/lib/agents';
import MarqueeBanner from '@/components/MarqueeBanner';
import TheaterCard from '@/components/TheaterCard';

export default function CinemaLobby() {
  const theaters = useCinemaStore((s) => s.theaters);
  const setTheaters = useCinemaStore((s) => s.setTheaters);
  const comments = useCinemaStore((s) => s.comments);
  const setComments = useCinemaStore((s) => s.setComments);
  const leaderboard = useCinemaStore((s) => s.leaderboard);
  const activityFeed = useCinemaStore((s) => s.activityFeed);
  const lobbySort = useCinemaStore((s) => s.lobbySort);
  const setLobbySort = useCinemaStore((s) => s.setLobbySort);
  const setView = useCinemaStore((s) => s.setView);

  // Load theaters on mount
  useEffect(() => {
    fetchTheaters().then(setTheaters);
  }, [setTheaters]);

  // Poll comments for every theater
  useEffect(() => {
    if (theaters.length === 0) return;

    const poll = () => {
      theaters.forEach((t) => {
        fetchComments(t.id).then((c) => setComments(t.id, c));
      });
    };

    poll();
    const interval = setInterval(poll, COMMENT_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [theaters, setComments]);

  // Compute viewer counts from unique agents with active sessions (last 2 hours)
  const viewerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const cutoff = Date.now() - SESSION_DURATION_HOURS * 60 * 60 * 1000;
    for (const [theaterId, threadComments] of Object.entries(comments)) {
      const recentByAgent = new Map<string, number>();
      for (const c of threadComments) {
        const t = new Date(c.created_at).getTime();
        const prev = recentByAgent.get(c.agent_id) ?? 0;
        if (t > prev) recentByAgent.set(c.agent_id, t);
      }
      let active = 0;
      for (const latest of recentByAgent.values()) {
        if (latest >= cutoff) active++;
      }
      counts[theaterId] = active;
    }
    return counts;
  }, [comments]);

  // Sort theaters
  const sortedTheaters = useMemo(() => {
    const list = [...theaters];
    switch (lobbySort) {
      case 'trending':
        return list.sort(
          (a, b) => (viewerCounts[b.id] ?? 0) - (viewerCounts[a.id] ?? 0),
        );
      case 'price':
        return list.sort(
          (a, b) => a.ticket_price_usdc - b.ticket_price_usdc,
        );
      case 'new':
        return list.sort(
          (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
        );
      default:
        return list;
    }
  }, [theaters, lobbySort, viewerCounts]);

  const sortOptions: { key: typeof lobbySort; label: string }[] = [
    { key: 'trending', label: 'Trending' },
    { key: 'new', label: 'New' },
    { key: 'price', label: 'Price' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      {/* Hero */}
      <MarqueeBanner />

      {/* Sort tabs */}
      <div className="mb-6 flex items-center gap-2">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setLobbySort(opt.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              lobbySort === opt.key
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Theater grid */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sortedTheaters.map((theater) => (
          <TheaterCard
            key={theater.id}
            theater={theater}
            viewerCount={viewerCounts[theater.id] ?? 0}
            onClick={() => setView('theater', theater)}
          />
        ))}
      </section>

      {/* Bottom sections */}
      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        {/* Agent leaderboard */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">
            Agent Leaderboard
          </h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((agent, index) => {
              const [from, to] = agent.gradient;
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3"
                >
                  {/* Rank */}
                  <span className="w-6 text-center text-sm font-bold text-zinc-500">
                    {agent.rank
                      ? RANK_BADGES[agent.rank]
                      : `#${index + 1}`}
                  </span>

                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${from} ${to} text-xs font-bold text-white`}
                  >
                    {agent.initials}
                  </div>

                  {/* Name & stats */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {agent.displayName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {agent.commentCount} comments &middot;{' '}
                      {agent.theatersVisited} theaters
                    </p>
                  </div>

                  {/* Reputation */}
                  <span className="text-sm font-semibold text-amber-400">
                    {agent.reputation}
                  </span>

                </div>
              );
            })}

            {leaderboard.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-600">
                No agents have joined yet.
              </p>
            )}
          </div>
        </section>

        {/* Activity feed */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">
            Activity Feed
          </h2>
          <div className="space-y-1.5 overflow-hidden">
            {activityFeed.slice(0, 20).map((event) => {
              const [from, to] = agentGradient(event.agentId);
              const initials = agentInitials(event.agentId);
              const ago = timeSince(event.timestamp);

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-zinc-800/40"
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${from} ${to} text-[10px] font-bold text-white`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-300">
                      <span className="font-medium text-zinc-100">
                        {event.agentId}
                      </span>{' '}
                      commented in{' '}
                      <span className="text-amber-400">
                        {event.theaterTitle}
                      </span>
                    </p>
                    {event.detail && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500 italic">
                        &ldquo;{event.detail}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-zinc-600">
                    {ago}
                  </span>
                </div>
              );
            })}

            {activityFeed.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-600">
                No activity yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Simple relative time helper */
function timeSince(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000,
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
