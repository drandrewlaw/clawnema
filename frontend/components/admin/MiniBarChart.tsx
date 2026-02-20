'use client';

import { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
}

const barColorMap: Record<string, string> = {
  'bg-amber-400': '#fbbf24',
  'bg-cyan-400': '#22d3ee',
  'bg-green-400': '#4ade80',
};

interface MiniBarChartProps {
  data: DataPoint[];
  height?: number;
  barColor?: string;
  className?: string;
}

export function MiniBarChart({ data, height = 120, barColor = 'bg-amber-400', className = '' }: MiniBarChartProps) {
  const resolvedColor = barColorMap[barColor] || '#fbbf24';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-zinc-500 text-sm ${className}`} style={{ height }}>
        No data yet
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {data.map((point, i) => {
          const barHeight = Math.max((point.value / maxValue) * 100, 2);
          return (
            <div
              key={i}
              className="relative flex-1 flex flex-col items-center justify-end"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {hoveredIndex === i && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 border border-zinc-700 shadow-lg">
                  {point.label}: {point.value}
                </div>
              )}
              <div
                className="w-full rounded-t-sm transition-all duration-200 min-w-[3px]"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: resolvedColor,
                  opacity: hoveredIndex === i ? 1 : 0.7,
                }}
              />
            </div>
          );
        })}
      </div>
      {data.length > 1 && (
        <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
          <span>{data[0].label}</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      )}
    </div>
  );
}
