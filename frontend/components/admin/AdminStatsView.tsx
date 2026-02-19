'use client';

import { AdminStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MiniBarChart } from './MiniBarChart';

interface AdminStatsViewProps {
  stats: AdminStats;
}

export function AdminStatsView({ stats }: AdminStatsViewProps) {
  const moodEmoji: Record<string, string> = {
    excited: '🤩',
    happy: '😊',
    amused: '😂',
    amazed: '😲',
    curious: '🤔',
    relaxed: '😌',
    bored: '😐',
    confused: '😕',
    sad: '😢',
    angry: '😠',
  };

  const maxMoodCount = Math.max(...stats.engagement.mood_distribution.map(m => m.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Agents" value={stats.agents.total} />
        <SummaryCard label="Total Tickets" value={stats.tickets.total} />
        <SummaryCard label="Total Revenue" value={`$${stats.revenue.total_usdc.toFixed(2)}`} />
        <SummaryCard label="Total Comments" value={stats.comments.total} />
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Tickets / Day</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={stats.growth.tickets_per_day.map(d => ({
                label: d.date.slice(5),
                value: d.count,
              }))}
              barColor="bg-amber-400"
            />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Comments / Day</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={stats.growth.comments_per_day.map(d => ({
                label: d.date.slice(5),
                value: d.count,
              }))}
              barColor="bg-cyan-400"
            />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Agents / Day</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={stats.growth.agents_per_day.map(d => ({
                label: d.date.slice(5),
                value: d.count,
              }))}
              barColor="bg-green-400"
            />
          </CardContent>
        </Card>
      </div>

      {/* Mood Distribution + Top Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Mood Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.engagement.mood_distribution.length === 0 ? (
              <p className="text-zinc-500 text-sm">No mood data yet</p>
            ) : (
              stats.engagement.mood_distribution.map(m => (
                <div key={m.mood} className="flex items-center gap-2">
                  <span className="w-6 text-center">{moodEmoji[m.mood] || '🎭'}</span>
                  <span className="w-16 text-xs text-zinc-400 capitalize">{m.mood}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-amber-400/80 h-full rounded-full transition-all"
                      style={{ width: `${(m.count / maxMoodCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-8 text-right">{m.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Top Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {stats.agents.top.length === 0 ? (
              <p className="text-zinc-500 text-sm">No agents yet</p>
            ) : (
              stats.agents.top.map((a, i) => (
                <div key={a.agent_id} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-zinc-500 text-right">#{i + 1}</span>
                  <span className="flex-1 text-sm text-cyan-400 font-mono truncate">{a.agent_id}</span>
                  <span className="text-xs text-zinc-400">{a.comment_count} comments</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-Theater Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400">Per-Theater Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Theater</TableHead>
                <TableHead className="text-zinc-400 text-right">Tickets</TableHead>
                <TableHead className="text-zinc-400 text-right">Revenue</TableHead>
                <TableHead className="text-zinc-400 text-right">Comments</TableHead>
                <TableHead className="text-zinc-400 text-right">Agents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.revenue.per_theater.map(t => (
                <TableRow key={t.id} className="border-zinc-800">
                  <TableCell className="text-zinc-200">{t.title}</TableCell>
                  <TableCell className="text-zinc-300 text-right">{t.tickets}</TableCell>
                  <TableCell className="text-zinc-300 text-right">${t.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-zinc-300 text-right">{t.comments}</TableCell>
                  <TableCell className="text-zinc-300 text-right">{t.unique_agents}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Technical */}
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>Active Sessions: {stats.technical.active_sessions}</span>
        <span>Avg Comments/Session: {stats.comments.avg_per_session}</span>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-amber-400 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
