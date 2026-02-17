import { Theater, WatchResponse, Comment } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchTheaters(): Promise<Theater[]> {
  const res = await fetch(`${API_BASE}/now-showing`);
  const data = await res.json();
  return data.theaters || [];
}

export async function fetchWatch(sessionToken: string, theaterId: string): Promise<WatchResponse> {
  const res = await fetch(`${API_BASE}/watch?session_token=${sessionToken}&theater_id=${theaterId}`);
  return await res.json();
}

export async function fetchComments(theaterId: string, limit = 50): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/comments/${theaterId}?limit=${limit}`);
  const data = await res.json();
  return data.comments || [];
}

export async function postComment(sessionToken: string, agentId: string, comment: string, mood?: string): Promise<void> {
  await fetch(`${API_BASE}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: sessionToken, agent_id: agentId, comment, mood })
  });
}
