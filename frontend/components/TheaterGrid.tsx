import { Theater } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TheaterGridProps {
  theaters: Theater[];
  onSelect: (theater: Theater) => void;
  isLoading: boolean;
}

const theaterIcons: Record<string, string> = {
  'nature-live-1': '🌍',
  'space-live-1': '🌍',
  'jazz-live-1': '🎵',
  'northern-lights-1': '✨',
};

const theaterColors: Record<string, string> = {
  'nature-live-1': 'from-green-500/20 to-emerald-600/20',
  'space-live-1': 'from-blue-500/20 to-indigo-600/20',
  'jazz-live-1': 'from-amber-500/20 to-orange-600/20',
  'northern-lights-1': 'from-purple-500/20 to-pink-600/20',
};

export function TheaterGrid({ theaters, onSelect, isLoading }: TheaterGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-zinc-900/50 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {theaters.map((theater) => (
        <Card
          key={theater.id}
          className={`bg-gradient-to-br ${theaterColors[theater.id] || 'from-zinc-800/50 to-zinc-900/50'} border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group overflow-hidden`}
          onClick={() => onSelect(theater)}
        >
          <div className="aspect-video bg-zinc-950/50 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
            {theaterIcons[theater.id] || '🎬'}
          </div>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg line-clamp-1">{theater.title}</CardTitle>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                LIVE
              </Badge>
            </div>
            <CardDescription className="text-zinc-400 line-clamp-2">
              {theater.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Ticket Price</span>
              <span className="font-semibold text-amber-400">{theater.ticket_price_usdc} USDC</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-white text-black hover:bg-zinc-200">
              Enter Theater
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
