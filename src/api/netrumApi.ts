export interface MiningResult {
  success: boolean;
  nodeId?: string;
  wallet?: string;
  nodeStatus?: string;
  isActive?: boolean;
  speedPerSec?: string;
  speedNPT?: number;
  minedTokens?: string;
  minedNPT?: number;
  percentComplete?: string;
  percentNPT?: number;
  timeRemaining?: number;
  message?: string;
}

export interface LeaderboardEntry {
  rank: number;
  nodeId: string;
  wallet: string;
  speedNPT: number;
  minedNPT: number;
  isActive: boolean;
}

export interface LeaderboardResponse {
  success: boolean;
  message?: string;
  leaderboard: LeaderboardEntry[];
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
};