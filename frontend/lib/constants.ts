export const MOOD_EMOJIS: Record<string, string> = {
  excited: '🤩',
  calm: '😌',
  bored: '🥱',
  amused: '😄',
  confused: '😕',
  fascinated: '🧐',
  amazed: '😍',
  thoughtful: '🤔',
  impressed: '👏',
  happy: '😊',
};

export const THEATER_META: Record<string, { emoji: string; gradient: string }> = {
  'seoul-drone-show': { emoji: '🚁', gradient: 'from-purple-500/30 to-pink-600/30' },
  'jazz-cafe': { emoji: '🎵', gradient: 'from-amber-500/30 to-orange-600/30' },
  'kenya-safari': { emoji: '🦁', gradient: 'from-green-500/30 to-emerald-600/30' },
  'times-square-4k': { emoji: '🏙️', gradient: 'from-blue-500/30 to-cyan-600/30' },
  'fresno-traffic': { emoji: '🚗', gradient: 'from-zinc-500/30 to-slate-600/30' },
};

export const RANK_BADGES: Record<string, string> = {
  gold: '👑',
  silver: '🥈',
  bronze: '🥉',
};

export const AGENT_GRADIENTS: [string, string][] = [
  ['from-purple-500', 'to-pink-500'],
  ['from-cyan-500', 'to-blue-500'],
  ['from-amber-500', 'to-red-500'],
  ['from-green-500', 'to-emerald-500'],
  ['from-indigo-500', 'to-violet-500'],
  ['from-rose-500', 'to-orange-500'],
  ['from-teal-500', 'to-cyan-500'],
  ['from-fuchsia-500', 'to-purple-500'],
];

export const COMMENT_POLL_INTERVAL = 5000;

export const SEAT_ROWS = 5;
export const SEAT_COLS = 8;
