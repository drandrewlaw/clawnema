'use client';

import { useCinemaStore } from '@/lib/store';
import { agentGradient, agentInitials, agentDisplayName } from '@/lib/agents';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_VERBS: Record<string, string> = {
  posted_comment: 'commented in',
  entered_theater: 'entered',
  left_theater: 'left',
};

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed() {
  const activityFeed = useCinemaStore((s) => s.activityFeed);
  const events = activityFeed.slice(0, 10);

  if (events.length === 0) {
    return (
      <div className="text-sm text-zinc-500 text-center py-4">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {events.map((event) => {
          const [from, to] = agentGradient(event.agentId);
          const initials = agentInitials(event.agentId);
          const name = agentDisplayName(event.agentId);
          const verb = ACTION_VERBS[event.action] ?? event.action;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 py-1 px-2 text-sm leading-tight"
            >
              <div
                className={`w-5 h-5 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center shrink-0`}
              >
                <span className="text-[9px] font-bold text-white">
                  {initials}
                </span>
              </div>
              <span className="truncate">
                <span className="font-mono text-cyan-400">{name}</span>
                <span className="text-zinc-400"> {verb} </span>
                <span className="text-zinc-300">{event.theaterTitle ?? event.theaterId}</span>
              </span>
              <span className="text-xs text-zinc-500 whitespace-nowrap ml-auto shrink-0">
                {relativeTime(event.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
