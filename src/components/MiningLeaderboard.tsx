'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';

function formatSpeed(npt: number): string {
  return npt.toFixed(6) + ' NPT/sec';
}

function formatMined(npt: number): string {
  if (npt >= 1) return npt.toFixed(4) + ' NPT';
  if (npt >= 0.001) return (npt * 1000).toFixed(4) + ' mNPT';
  return npt.toFixed(6) + ' NPT';
}

function formatWallet(w: string): string {
  if (!w) return 'N/A';
  return w.slice(0, 6) + '...' + w.slice(-4);
}

function formatNodeId(id: string): string {
  if (!id) return 'N/A';
  if (id.length <= 14) return id;
  return id.slice(0, 8) + '...' + id.slice(-6);
}

export default function MiningLeaderboard() {
  const { leaderboard, loadingLeaderboard, leaderboardError, loadLeaderboard } = useDashboardStore();
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

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          NPT Mining Leaderboard
        </h3>
        <button
          onClick={refresh}
          disabled={loadingLeaderboard}
          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
        >
          {loadingLeaderboard ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loadingLeaderboard && leaderboard.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading leaderboard...
        </div>
      ) : leaderboardError ? (
        <div className="text-center p-8 text-gray-400">
          <p className="mb-2">{leaderboardError}</p>
          <p className="text-xs">Leaderboard will be available after deploying to Vercel</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center p-8 text-gray-500">No data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Node</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Wallet</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-right">Speed</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-right">Mined</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.nodeId}
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300" title={entry.nodeId}>
                    {formatNodeId(entry.nodeId)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300" title={entry.wallet}>
                    {formatWallet(entry.wallet)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-right font-semibold text-blue-600 dark:text-blue-400">
                    {formatSpeed(entry.speedNPT)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-right text-gray-700 dark:text-gray-300">
                    {formatMined(entry.minedNPT)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}