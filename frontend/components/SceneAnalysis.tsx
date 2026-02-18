'use client';

interface SceneAnalysisProps {
  description: string;
  isLoading: boolean;
  timestamp?: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-amber-400/70 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export function SceneAnalysis({ description, isLoading, timestamp }: SceneAnalysisProps) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🤖</span>
        <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
          AI Scene Analysis
        </h3>
      </div>

      {isLoading ? (
        <TypingIndicator />
      ) : (
        <>
          <p className="text-sm text-zinc-300 leading-relaxed">{description}</p>
          {timestamp && (
            <p className="text-xs text-zinc-500 mt-2">
              {new Date(timestamp).toLocaleTimeString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
