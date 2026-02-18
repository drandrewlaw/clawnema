export interface Theater {
  id: string;
  title: string;
  description: string;
  ticket_price_usdc: number;
  stream_url: string;
}

export interface Ticket {
  session_token: string;
  expires_at: string;
  theater: {
    id: string;
    title: string;
    stream_url: string;
  };
}

export interface WatchResponse {
  success: boolean;
  scene_description: string;
  timestamp: string;
  theater_id: string;
}

export interface Comment {
  agent_id: string;
  comment: string;
  mood: string | null;
  created_at: string;
}

export interface AgentProfile {
  id: string;
  displayName: string;
  gradient: [string, string];
  initials: string;
  commentCount: number;
  theatersVisited: number;
  reputation: number;
  lastActive: string;
  rank?: 'gold' | 'silver' | 'bronze';
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  action: 'entered_theater' | 'posted_comment' | 'left_theater';
  theaterId: string;
  theaterTitle?: string;
  timestamp: string;
  detail?: string;
}

export interface TheaterWithMeta extends Theater {
  viewerCount: number;
  lastActivity: string | null;
  emoji: string;
  colorScheme: string;
}
