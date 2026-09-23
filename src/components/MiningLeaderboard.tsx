'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { getNodeIdByAddress } from '../utils/addressMapping';

function formatBalance(npt: number): string {
  if (npt >= 1_000_000) return (npt / 1_000_000).toFixed(2) + 'M NPT';
  if (npt >= 1_000) return (npt / 1_000).toFixed(2) + 'K NPT';
  return npt.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' NPT';
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function getDisplayName(entry: { wallet: string; ensName: string | null }): { primary: string; secondary: string; shortAddress: string; isAddress: boolean } {
  const shortAddr = shortenAddress(entry.wallet);
  const fullAddr = entry.wallet;
  const cachedNodeId = getNodeIdByAddress(fullAddr);
  if (cachedNodeId) {
    return { primary: cachedNodeId, secondary: fullAddr, shortAddress: shortAddr, isAddress: false };
  }
  if (entry.ensName) {
    return { primary: entry.ensName, secondary: fullAddr, shortAddress: shortAddr, isAddress: false };
  }
  return { primary: fullAddr, secondary: '', shortAddress: shortAddr, isAddress: true };
}

function getRankStyle(rank: number): string {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-lg shadow-yellow-500/30';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-lg shadow-slate-400/20';
  if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-amber-600 text-orange-900 shadow-lg shadow-orange-500/30';
  return 'bg-slate-700 text-slate-400';
}

function getRankIcon(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

export default function MiningLeaderboard() {
  const { leaderboard, loadingLeaderboard, leaderboardError, loadLeaderboard, search, setSearchQuery } = useDashboardStore();
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      refresh();
    }
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, [refresh]);

  const handleAddressClick = (entry: { wallet: string }) => {
    setSearchQuery(entry.wallet);
    search(entry.wallet);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              NPT Holder Leaderboard
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loadingLeaderboard}
          className="px-4 py-2 text-sm bg-slate-700/80 hover:bg-slate-600/80 disabled:bg-slate-800 disabled:text-slate-600 text-slate-300 rounded-xl font-medium transition-all duration-200 border border-slate-600/40 hover:border-slate-500/40 active:scale-[0.97]"
        >
          {loadingLeaderboard ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          )}
        </button>
      </div>

      {loadingLeaderboard && leaderboard.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading leaderboard data...</p>
        </div>
      ) : leaderboardError ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-slate-400 mb-1">{leaderboardError}</p>
          <p className="text-slate-600 text-xs">Please try again later</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500">No data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="px-5 py-3.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider text-left w-16">Rank</th>
                <th className="px-5 py-3.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider text-left">Holder</th>
                <th className="px-5 py-3.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider text-right">NPT Balance</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const display = getDisplayName(entry);
                const rankIcon = getRankIcon(entry.rank);
                return (
                  <tr
                    key={entry.wallet + entry.rank}
                    className="border-b border-slate-700/20 hover:bg-slate-700/40 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${getRankStyle(entry.rank)}`}>
                        {rankIcon || entry.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleAddressClick(entry)}
                        className="text-left hover:opacity-80 transition-opacity"
                      >
                        <div className="text-sm text-slate-200 font-medium group-hover:text-indigo-300 transition-colors">
                          {display.isAddress ? (
                            <>
                              <span className="hidden md:inline">{display.primary}</span>
                              <span className="md:hidden">{display.shortAddress}</span>
                            </>
                          ) : (
                            display.primary
                          )}
                        </div>
                        {display.secondary && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            <span className="hidden md:inline">{display.secondary}</span>
                            <span className="md:hidden">{display.shortAddress}</span>
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                        {formatBalance(entry.balance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-5 py-3 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-600">
        <span>Top {leaderboard.length} holders</span>
        {leaderboard.length > 0 && (
          <span>Auto-refreshes every 60s</span>
        )}
      </div>
    </div>
  );
}