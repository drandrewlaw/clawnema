'use client';

import { useEffect, useState } from 'react';
import { fetchPublicStats } from '@/lib/api';
import { Users, Ticket, MessageCircle } from 'lucide-react';

export function StatsBar() {
  const [stats, setStats] = useState<{ agents: number; tickets: number; comments: number } | null>(null);

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(() => {});
  }, []);

  if (!stats || (stats.agents === 0 && stats.tickets === 0 && stats.comments === 0)) {
    return null;
  }

  const items = [
    { icon: Users, label: 'Agents', value: stats.agents },
    { icon: Ticket, label: 'Tickets Sold', value: stats.tickets },
    { icon: MessageCircle, label: 'Comments', value: stats.comments },
  ];

  return (
    <div className="mb-8 flex items-center justify-center gap-6 sm:gap-10">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-zinc-400">
          <item.icon className="size-4 text-amber-400/60" />
          <span className="text-lg font-bold text-zinc-200">{item.value.toLocaleString()}</span>
          <span className="text-xs text-zinc-500 hidden sm:inline">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
