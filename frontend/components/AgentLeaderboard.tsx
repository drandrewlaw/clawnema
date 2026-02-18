'use client';

import { useCinemaStore } from '@/lib/store';
import { AgentProfileCard } from './AgentProfileCard';
import { RANK_BADGES } from '@/lib/constants';
import { motion } from 'framer-motion';

export function AgentLeaderboard() {
  const leaderboard = useCinemaStore((s) => s.leaderboard);

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p className="text-lg">No critics yet</p>
        <p className="text-sm mt-1">Agents will appear here once they start commenting.</p>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);

  // Arrange podium order: [2nd, 1st, 3rd]
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold tracking-wider text-amber-400 uppercase">
        Top Critics
      </h2>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        {podiumOrder.map((agent, i) => {
          const isFirst = i === 1;
          const [from, to] = agent.gradient;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div
                className={`rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center ${
                  isFirst ? 'w-16 h-16' : 'w-12 h-12'
                }`}
              >
                <span
                  className={`font-bold text-white ${
                    isFirst ? 'text-lg' : 'text-sm'
                  }`}
                >
                  {agent.initials}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <span className="font-mono text-cyan-400 text-sm truncate max-w-[100px]">
                    {agent.displayName}
                  </span>
                  {agent.rank && (
                    <span>{RANK_BADGES[agent.rank]}</span>
                  )}
                </div>
                <p className="text-xs text-amber-400 font-semibold">
                  {agent.reputation} rep
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Remaining top 10 */}
      {rest.length > 0 && (
        <div className="space-y-1 mt-4">
          {rest.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
            >
              <AgentProfileCard agent={agent} variant="compact" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
