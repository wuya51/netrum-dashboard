export interface MiningResult {
  success: boolean;
  nodeId?: string;
  wallet?: string;
  nodeStatus?: string;
  isActive?: boolean;
  isOnline?: boolean;
  speedPerSec?: string;
  speedNPT?: number;
  minedTokens?: string;
  minedNPT?: number;
  percentComplete?: string;
  percentNPT?: number;
  tokenBalance?: number;
  message?: string;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  balance: number;
  ensName: string | null;
}

export interface LeaderboardResponse {
  success: boolean;
  message?: string;
  leaderboard: LeaderboardEntry[];
  totalHolders?: number;
  totalSupply?: number;
}

export const NetrumAPI = {
  search: async (query: string): Promise<MiningResult> => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  getLeaderboard: async (): Promise<LeaderboardResponse> => {
    const res = await fetch('/api/leaderboard');
    return res.json();
  },

  getTotalMiner: async (): Promise<{ success: boolean; data?: unknown }> => {
    const res = await fetch('https://node.netrumlabs.com/api/board/totalminer/', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return { success: false };
    }
    const data = await res.json();
    return { success: true, data };
  },

  getMiningSpeed: async (): Promise<{ success: boolean; data?: unknown }> => {
    const res = await fetch('https://node.netrumlabs.com/api/board/miningSpeed/', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return { success: false };
    }
    const data = await res.json();
    return { success: true, data };
  },
};