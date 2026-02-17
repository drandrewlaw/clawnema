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

export interface AgentActivity {
  agent_id: string;
  action: 'joined' | 'commented' | 'watching';
  theater_id?: string;
  timestamp: string;
}
