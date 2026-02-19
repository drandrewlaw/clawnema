import { Theater, WatchResponse, Comment, AdminStats, AdminTheater } from './types';

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

// Admin API functions

function adminHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
}

export async function fetchAdminStats(apiKey: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: adminHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  const data = await res.json();
  return data.stats;
}

export async function fetchAdminTheaters(apiKey: string): Promise<AdminTheater[]> {
  const res = await fetch(`${API_BASE}/admin/theaters`, {
    headers: adminHeaders(apiKey),
  });
  if (!res.ok) throw new Error(`Theaters fetch failed: ${res.status}`);
  const data = await res.json();
  return data.theaters;
}

export async function createAdminTheater(
  apiKey: string,
  theater: { id: string; title: string; stream_url: string; ticket_price_usdc: number; description: string }
): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/theaters`, {
    method: 'POST',
    headers: adminHeaders(apiKey),
    body: JSON.stringify(theater),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Create failed: ${res.status}`);
  }
}

export async function updateAdminTheater(
  apiKey: string,
  id: string,
  updates: Partial<{ title: string; stream_url: string; ticket_price_usdc: number; description: string }>
): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/theaters/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(apiKey),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Update failed: ${res.status}`);
  }
}

export async function deleteAdminTheater(apiKey: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/theaters/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(apiKey),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || `Delete failed: ${res.status}`);
  }
}
