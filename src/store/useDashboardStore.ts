import { create } from 'zustand';
import { NetrumAPI, MiningResult, LeaderboardEntry } from '../api/netrumApi';

interface DashboardState {
  result: MiningResult | null;
  searchQuery: string;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;

  search: (query: string) => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  result: null,
  searchQuery: '',
  leaderboard: [],
  loading: false,
  loadingLeaderboard: false,
  error: null,
  leaderboardError: null,

  clearError: () => set({ error: null }),

  search: async (query: string) => {
    set({ loading: true, error: null, result: null, searchQuery: query });
    try {
      const data = await NetrumAPI.search(query);
      if (data.success) {
        set({ result: data, loading: false });
      } else {
        set({ error: data.message || 'No data found', loading: false, result: null });
      }
    } catch {
      set({ error: 'Network request failed, please try again', loading: false, result: null });
    }
  },

  loadLeaderboard: async () => {
    set({ loadingLeaderboard: true, leaderboardError: null });
    try {
      const data = await NetrumAPI.getLeaderboard();
      if (data.success) {
        set({ leaderboard: data.leaderboard, loadingLeaderboard: false });
      } else {
        set({ leaderboardError: data.message || 'Failed to load leaderboard', loadingLeaderboard: false });
      }
    } catch {
      set({ leaderboardError: 'Failed to load leaderboard', loadingLeaderboard: false });
    }
  },
}));