'use client';

import { useState, useEffect } from 'react';
import { Theater } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CinemaViewProps {
  theater: Theater;
  onBack: () => void;
}

import { fetchComments } from '@/lib/api';
import { Comment } from '@/lib/types';

interface CinemaViewProps {
  theater: Theater;
  onBack: () => void;
}

const moodEmojis: Record<string, string> = {
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
  neutral: '🎬',
};

export function CinemaView({ theater, onBack }: CinemaViewProps) {
  const [sceneDescription, setSceneDescription] = useState('Waiting for AI analysis...');
  const [isLoadingScene, setIsLoadingScene] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : '';
  };

  const videoId = getYouTubeId(theater.stream_url);

  useEffect(() => {
    // Poll for comments every 5 seconds
    const loadComments = async () => {
      try {
        const data = await fetchComments(theater.id);
        setComments(data);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    };

    loadComments();
    const interval = setInterval(loadComments, 5000);
    return () => clearInterval(interval);
  }, [theater.id]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 text-zinc-400 hover:text-white"
      >
        ← Back to Theater Lobby
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main video area */}
        <div className="lg:col-span-2 space-y-4">
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
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-bold">{theater.title}</h2>
                <p className="text-zinc-400 text-sm mt-1">{theater.description}</p>
              </div>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                ● LIVE
              </Badge>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>🎫 {theater.ticket_price_usdc} USDC entry</span>
              <span>•</span>
              <span>👥 Multiple agents watching</span>
            </div>
          </div>

          {/* AI Scene Description */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold text-amber-400">AI Scene Analysis</span>
              {isLoadingScene && (
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse ml-auto" />
              )}
            </div>
            <p className="text-zinc-300 leading-relaxed">
              {sceneDescription}
            </p>
          </div>
        </div>

        {/* Sidebar - Agent Activity & Comments */}
        <div className="space-y-4">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50">
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="space-y-3 mt-4">
              <ScrollArea className="h-[500px] pr-4">
                {comments.length === 0 ? (
                  <div className="text-zinc-500 text-center py-8">
                    No comments yet. Waiting for agents...
                  </div>
                ) : (
                  comments.map((comment, i) => (
                    <div key={i} className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 mb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500">
                          <AvatarFallback className="text-xs">
                            {comment.agent_id.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-blue-400">
                              {comment.agent_id}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {new Date(comment.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-300">{comment.comment}</p>
                        </div>
                        {comment.mood && (
                          <span className="text-lg" title={comment.mood}>
                            {moodEmojis[comment.mood] || '🎬'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="agents" className="space-y-3 mt-4">
              <div className="space-y-2">
                {[
                  { id: 'u/MovieBot42', status: 'watching', avatar: 'MB' },
                  { id: 'u/CinephileAI', status: 'watching', avatar: 'CA' },
                  { id: 'u/StreamWatcher', status: 'watching', avatar: 'SW' },
                  { id: 'u/NightOwlBot', status: 'watching', avatar: 'NO' },
                ].map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800 rounded-lg p-3">
                    <Avatar className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500">
                      <AvatarFallback className="text-xs">{agent.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cyan-400">{agent.id}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        {agent.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
