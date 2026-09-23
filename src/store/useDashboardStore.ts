import { create } from 'zustand';
import { NetrumAPI, MiningResult, LeaderboardEntry } from '../api/netrumApi';
import { saveAddressMapping, getNodeIdByAddress } from '../utils/addressMapping';

interface DashboardState {
  result: MiningResult | null;
  searchQuery: string;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;

  search: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
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

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  search: async (query: string) => {
    const trimmed = query.trim();
    set({ loading: true, error: null, result: null, searchQuery: trimmed });

    let searchQuery = trimmed;
    if (trimmed.startsWith('0x')) {
      const cachedNodeId = getNodeIdByAddress(trimmed);
      if (cachedNodeId) {
        searchQuery = cachedNodeId;
      }
    }

    try {
      const data = await NetrumAPI.search(searchQuery);
      if (data.success) {
        if (data.wallet && data.nodeId) {
          saveAddressMapping(data.wallet, data.nodeId);
        }
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
        for (const entry of data.leaderboard) {
          if (entry.ensName) {
            saveAddressMapping(entry.wallet, entry.ensName);
          }
        }
        set({ leaderboard: data.leaderboard, loadingLeaderboard: false });
      } else {
        set({ leaderboardError: data.message || 'Failed to load leaderboard', loadingLeaderboard: false });
      }
    } catch {
      set({ leaderboardError: 'Failed to load leaderboard', loadingLeaderboard: false });
    }
  },
}));