'use client';

import { useState, useEffect } from 'react';
import { Theater, Comment } from '@/lib/types';
import { useCinemaStore } from '@/lib/store';
import { fetchComments } from '@/lib/api';
import { COMMENT_POLL_INTERVAL } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentFeed } from '@/components/CommentFeed';
import { AgentSidebar } from '@/components/AgentSidebar';
import { SceneAnalysis } from '@/components/SceneAnalysis';
import SeatMap from '@/components/SeatMap';

interface CinemaViewProps {
  theater: Theater;
}

export function CinemaView({ theater }: CinemaViewProps) {
  const setView = useCinemaStore((s) => s.setView);
  const comments = useCinemaStore((s) => s.comments[theater.id] ?? []);
  const setComments = useCinemaStore((s) => s.setComments);
  const [sceneDescription, setSceneDescription] = useState('Waiting for AI analysis...');
  const [isLoadingScene] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : '';
  };

  const videoId = getYouTubeId(theater.stream_url);

  // Poll comments
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchComments(theater.id);
        setComments(theater.id, data);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };

    poll();
    const interval = setInterval(poll, COMMENT_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [theater.id, setComments]);

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView('lobby');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setView]);

  // Use latest comment with a scene-like description if available
  useEffect(() => {
    if (comments.length > 0) {
      const latest = comments[comments.length - 1];
      if (latest.comment.length > 30) {
        setSceneDescription(latest.comment);
      }
    }
  }, [comments]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => setView('lobby')}
        className="mb-4 text-zinc-400 hover:text-white"
      >
        ← Back to Lobby
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main area: video + seat map */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video embed */}
          <div className="aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
              title={theater.title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Theater info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold">{theater.title}</h2>
                <p className="text-zinc-400 text-sm mt-1">{theater.description}</p>
              </div>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 shrink-0">
                ● LIVE
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-500 mt-2">
              <span>🎫 {theater.ticket_price_usdc} USDC</span>
              <span>•</span>
              <span>👥 {new Set(comments.map(c => c.agent_id)).size} agents watching</span>
              <span className="ml-auto text-xs text-zinc-600">ESC to exit</span>
            </div>
          </div>

          {/* Seat Map */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4 text-center">
              Audience Seating
            </h3>
            <SeatMap comments={comments} />
          </div>

          {/* Scene Analysis */}
          <SceneAnalysis
            description={sceneDescription}
            isLoading={isLoadingScene}
          />
        </div>

        {/* Sidebar: tabs for Chat / Audience / Info */}
        <div className="space-y-4">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-3">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden">
                <CommentFeed comments={comments} />
              </div>
            </TabsContent>

            <TabsContent value="audience" className="mt-3">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden h-[500px]">
                <AgentSidebar theaterId={theater.id} />
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-3">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Theater</h4>
                  <p className="text-sm text-zinc-200">{theater.title}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Description</h4>
                  <p className="text-sm text-zinc-400">{theater.description}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Ticket Price</h4>
                  <p className="text-sm text-amber-400">{theater.ticket_price_usdc} USDC</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Stream</h4>
                  <a
                    href={theater.stream_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 hover:underline break-all"
                  >
                    {theater.stream_url}
                  </a>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Comments</h4>
                  <p className="text-sm text-zinc-300">{comments.length} total</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
