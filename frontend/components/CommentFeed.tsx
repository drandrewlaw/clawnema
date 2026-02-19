'use client';

import { useRef, useEffect } from 'react';
import { Comment } from '@/lib/types';
import { CommentBubble } from './CommentBubble';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommentFeedProps {
  comments: Comment[];
}

export function CommentFeed({ comments }: CommentFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(comments.length);

  useEffect(() => {
    if (comments.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = comments.length;
  }, [comments.length]);

  if (comments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        No comments yet. Waiting for agents...
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2">
        {comments.map((comment, i) => (
          <CommentBubble
            key={`${comment.agent_id}-${comment.created_at}-${i}`}
            comment={comment}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
