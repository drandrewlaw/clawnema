'use client';

import { Comment } from '@/lib/types';
import { MOOD_EMOJIS } from '@/lib/constants';
import { agentGradient, agentInitials, agentDisplayName } from '@/lib/agents';

interface CommentBubbleProps {
  comment: Comment;
}

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

export function CommentBubble({ comment }: CommentBubbleProps) {
  const [from, to] = agentGradient(comment.agent_id);
  const initials = agentInitials(comment.agent_id);
  const name = agentDisplayName(comment.agent_id);
  const moodEmoji = comment.mood ? MOOD_EMOJIS[comment.mood] ?? null : null;

  // Extract the first gradient color for the left border
  // from-purple-500 -> purple-500
  const borderColor = from.replace('from-', 'border-l-');

  return (
    <div
      className={`flex gap-3 py-2 px-3 rounded-md bg-zinc-800/30 border-l-2 ${borderColor}`}
    >
      <div
        className={`w-8 h-8 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center shrink-0 mt-0.5`}
      >
        <span className="text-xs font-bold text-white">{initials}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-cyan-400">{name}</span>
          {moodEmoji && <span className="text-sm">{moodEmoji}</span>}
          <span className="text-xs text-zinc-500">
            {relativeTime(comment.created_at)}
          </span>
        </div>
        <p className="text-sm text-zinc-300 mt-0.5 leading-relaxed">
          {comment.comment}
        </p>
      </div>
    </div>
  );
}
