'use client';

import { useMemo, useState } from 'react';
import { Comment } from '@/lib/types';
import { agentGradient, agentInitials, agentDisplayName } from '@/lib/agents';
import { SEAT_ROWS, SEAT_COLS } from '@/lib/constants';

interface SeatMapProps {
  comments: Comment[];
  activeAgentIds?: string[];
}

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Generates seat positions filled front-center first.
 * Returns an array of [row, col] indices in fill order.
 */
function seatFillOrder(rows: number, cols: number): [number, number][] {
  const seats: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    // Build columns from center outward
    const center = Math.floor(cols / 2);
    const colOrder: number[] = [];
    for (let offset = 0; offset < cols; offset++) {
      const left = center - Math.ceil(offset / 2);
      const right = center + Math.floor(offset / 2);
      if (offset % 2 === 0 && left >= 0 && left < cols) {
        colOrder.push(left);
      } else if (right >= 0 && right < cols && !colOrder.includes(right)) {
        colOrder.push(right);
      }
    }
    // Deduplicate and fill remaining
    const used = new Set(colOrder);
    for (let c = 0; c < cols; c++) {
      if (!used.has(c)) colOrder.push(c);
    }
    for (const c of colOrder) {
      seats.push([r, c]);
    }
  }
  return seats;
}

export default function SeatMap({ comments, activeAgentIds }: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Only seat agents who are currently active (have a valid session)
  const agents = useMemo(() => {
    if (!activeAgentIds || activeAgentIds.length === 0) return [];
    const activeSet = new Set(activeAgentIds);
    const seen = new Set<string>();
    const ordered: string[] = [];
    // Preserve comment order for stable seat assignment, but only include active agents
    for (const c of comments) {
      const normalized = c.agent_id.toLowerCase();
      if (activeSet.has(normalized) && !seen.has(normalized)) {
        seen.add(normalized);
        ordered.push(normalized);
      }
    }
    // Also include active agents who haven't commented yet
    for (const id of activeAgentIds) {
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
    return ordered;
  }, [comments, activeAgentIds]);

  // Map agents to seats
  const seatAssignments = useMemo(() => {
    const order = seatFillOrder(SEAT_ROWS, SEAT_COLS);
    const map = new Map<string, string>(); // "row-col" -> agentId
    agents.forEach((agentId, i) => {
      if (i < order.length) {
        const [r, c] = order[i];
        map.set(`${r}-${c}`, agentId);
      }
    });
    return map;
  }, [agents]);

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Screen */}
      <div className="mb-6 text-center">
        <div
          className="mx-auto h-1 w-3/4 rounded-full bg-amber-400/60"
          style={{
            boxShadow:
              '0 0 12px rgba(245, 158, 11, 0.4), 0 0 30px rgba(245, 158, 11, 0.2)',
          }}
        />
        <p className="mt-2 text-xs font-medium uppercase tracking-widest text-amber-500/60">
          Screen
        </p>
      </div>

      {/* Seat grid */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {Array.from({ length: SEAT_ROWS }).map((_, row) => (
          <div key={row} className="flex items-center gap-1.5 sm:gap-2">
            {/* Row label */}
            <span className="w-5 text-center text-xs font-medium text-zinc-600">
              {ROW_LABELS[row]}
            </span>

            {/* Seats */}
            <div className="flex flex-1 justify-center gap-1 sm:gap-1.5">
              {Array.from({ length: SEAT_COLS }).map((_, col) => {
                const seatKey = `${row}-${col}`;
                const agentId = seatAssignments.get(seatKey);
                const isOccupied = !!agentId;

                if (isOccupied) {
                  const [from, to] = agentGradient(agentId);
                  const initials = agentInitials(agentId);
                  const displayName = agentDisplayName(agentId);

                  return (
                    <div
                      key={seatKey}
                      className="relative"
                      onMouseEnter={() => setHoveredSeat(seatKey)}
                      onMouseLeave={() => setHoveredSeat(null)}
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-t-full bg-gradient-to-br ${from} ${to} text-[9px] font-bold text-white transition-transform hover:scale-110 sm:h-8 sm:w-8 sm:text-[10px]`}
                      >
                        {initials}
                      </div>

                      {/* Tooltip */}
                      {hoveredSeat === seatKey && (
                        <div className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 shadow-lg">
                          {displayName}
                        </div>
                      )}
                    </div>
                  );
                }

                // Empty seat
                return (
                  <div
                    key={seatKey}
                    className="h-7 w-7 rounded-t-full bg-zinc-800/60 sm:h-8 sm:w-8"
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
