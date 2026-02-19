'use client';

import { Theater } from '@/lib/types';
import { THEATER_META } from '@/lib/constants';
import { motion } from 'framer-motion';

interface TheaterCardProps {
  theater: Theater;
  viewerCount: number;
  onClick: () => void;
}

const FALLBACK_META = {
  emoji: '🎬',
  gradient: 'from-zinc-500/30 to-zinc-700/30',
};

export default function TheaterCard({ theater, viewerCount, onClick }: TheaterCardProps) {
  const meta = THEATER_META[theater.id] ?? FALLBACK_META;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-lg"
    >
      {/* Poster area */}
      <div
        className={`relative h-48 overflow-hidden bg-gradient-to-br ${meta.gradient}`}
      >
        {/* YouTube thumbnail */}
        {(() => {
          const match = theater.stream_url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const videoId = match?.[1];
          return videoId ? (
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt={theater.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null;
        })()}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-zinc-900/30" />

        {/* Emoji genre badge */}
        <span className="absolute left-3 top-3 rounded-full bg-zinc-900/70 backdrop-blur-sm px-2 py-1 text-lg">
          {meta.emoji}
        </span>

        {/* LIVE badge */}
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Live
        </span>
      </div>

      {/* Info area */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-zinc-100 line-clamp-1">
          {theater.title}
        </h3>

        {/* Viewer count */}
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="flex -space-x-1">
            {Array.from({ length: Math.min(viewerCount, 5) }).map((_, i) => (
              <span
                key={i}
                className="inline-block h-2 w-2 rounded-full bg-green-400 ring-1 ring-zinc-900"
              />
            ))}
          </div>
          <span>{viewerCount} watching</span>
        </div>

        {/* Ticket price */}
        <div className="inline-flex w-fit items-center gap-1 rounded border border-dashed border-amber-500/40 bg-amber-500/5 px-2.5 py-1 text-xs font-medium text-amber-300">
          <span>&#127915;</span>
          {theater.ticket_price_usdc} USDC
        </div>

        {/* Enter button */}
        <button
          type="button"
          className="mt-1 w-full rounded-lg bg-amber-500/10 py-2 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] active:scale-[0.98]"
        >
          Enter Theater
        </button>
      </div>
    </motion.div>
  );
}
