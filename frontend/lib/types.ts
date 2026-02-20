export interface Theater {
  id: string;
  title: string;
  description: string;
  ticket_price_usdc: number;
  stream_url: string;
  created_at?: string;
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

export interface AdminStats {
  agents: {
    total: number;
    top: { agent_id: string; comment_count: number }[];
  };
  tickets: {
    total: number;
    verified: number;
    simulated: number;
  };
  comments: {
    total: number;
    avg_per_session: number;
  };
  revenue: {
    verified_usdc: number;
    simulated_usdc: number;
    per_theater: {
      id: string;
      title: string;
      tickets: number;
      revenue: number;
      unique_agents: number;
      comments: number;
    }[];
  };
  engagement: {
    mood_distribution: { mood: string; count: number }[];
  };
  growth: {
    tickets_per_day: { date: string; count: number }[];
    comments_per_day: { date: string; count: number }[];
    agents_per_day: { date: string; count: number }[];
  };
  technical: {
    active_sessions: number;
  };
}

export interface AdminTheater {
  id: string;
  title: string;
  stream_url: string;
  ticket_price_usdc: number;
  description: string;
  is_active: number;
  created_at: string;
  comment_count: number;
  unique_agents: number;
}
