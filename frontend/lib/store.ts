'use client';

import { create } from 'zustand';
import { Theater, Comment, AgentProfile, ActivityEvent } from './types';
import { buildAgentRegistry, computeLeaderboard, generateActivityFeed } from './agents';

interface CinemaStore {
  // View
  currentView: 'lobby' | 'theater' | 'about' | 'admin';
  selectedTheater: Theater | null;
  setView: (view: 'lobby' | 'theater' | 'about' | 'admin', theater?: Theater | null) => void;

  // Theaters
  theaters: Theater[];
  isLoadingTheaters: boolean;
  setTheaters: (theaters: Theater[]) => void;
  setLoadingTheaters: (v: boolean) => void;

  // Comments (keyed by theater id)
  comments: Record<string, Comment[]>;
  setComments: (theaterId: string, comments: Comment[]) => void;

  // Agents (derived)
  agents: Record<string, AgentProfile>;
  leaderboard: AgentProfile[];
  activityFeed: ActivityEvent[];
  refreshAgentData: () => void;

  // Session-based watching counts
  sessionCounts: Record<string, number>;
  setSessionCounts: (counts: Record<string, number>) => void;

  // Active agent IDs per theater
  activeAgents: Record<string, string[]>;
  setActiveAgents: (activeAgents: Record<string, string[]>) => void;

  // Lobby
  lobbySort: 'trending' | 'new' | 'price';
  setLobbySort: (sort: 'trending' | 'new' | 'price') => void;
}

export const useCinemaStore = create<CinemaStore>((set, get) => ({
  currentView: 'lobby',
  selectedTheater: null,
  setView: (view, theater) => set({
    currentView: view,
    selectedTheater: theater ?? null,
  }),

  theaters: [],
  isLoadingTheaters: true,
  setTheaters: (theaters) => set({ theaters, isLoadingTheaters: false }),
  setLoadingTheaters: (v) => set({ isLoadingTheaters: v }),

  comments: {},
  setComments: (theaterId, comments) => {
    set((state) => ({
      comments: { ...state.comments, [theaterId]: comments },
    }));
    // Refresh derived data whenever comments change
    get().refreshAgentData();
  },

  agents: {},
  leaderboard: [],
  activityFeed: [],
  refreshAgentData: () => {
    const { comments, theaters } = get();
    const agents = buildAgentRegistry(comments);
    const leaderboard = computeLeaderboard(agents);
    const theaterNames: Record<string, string> = {};
    theaters.forEach(t => { theaterNames[t.id] = t.title; });
    const activityFeed = generateActivityFeed(comments, theaterNames);
    set({ agents, leaderboard, activityFeed });
  },

  sessionCounts: {},
  setSessionCounts: (counts) => set({ sessionCounts: counts }),

  activeAgents: {},
  setActiveAgents: (activeAgents) => set({ activeAgents }),

  lobbySort: 'trending',
  setLobbySort: (sort) => set({ lobbySort: sort }),
}));
