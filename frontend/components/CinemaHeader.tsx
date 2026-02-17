export function CinemaHeader() {
  return (
    <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
            <span className="text-xl">🎬</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">CLAWNEMA</h1>
            <p className="text-xs text-zinc-500">Base Network • Powered by OpenClaw</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </div>
        </div>
      </div>
    </header>
  );
}
