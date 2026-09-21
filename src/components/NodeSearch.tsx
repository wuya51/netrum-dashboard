'use client';

import { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';

function formatSpeed(npt: number): string {
  return npt.toFixed(6) + ' NPT/sec';
}

function formatMined(npt: number): string {
  if (npt >= 1) return npt.toFixed(6) + ' NPT';
  if (npt >= 0.001) return (npt * 1000).toFixed(4) + ' mNPT';
  return npt.toFixed(8) + ' NPT';
}

function formatWallet(w: string): string {
  if (!w) return 'N/A';
  return w.slice(0, 6) + '...' + w.slice(-4);
}

function formatPercent(pct: number): string {
  return pct.toFixed(2) + '%';
}

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function NodeSearch() {
  const { search, result, loading, error, clearError } = useDashboardStore();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nptSearchHistory');
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addHistory = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 10);
      localStorage.setItem('nptSearchHistory', JSON.stringify(next));
      return next;
    });
  };

  const handleSearch = (val: string) => {
    const q = val.trim();
    if (!q) return;
    clearError();
    setShowHistory(false);
    addHistory(q);
    search(q);
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); clearError(); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(input)}
              onFocus={() => history.length > 0 && setShowHistory(true)}
              placeholder="Enter Node ID or Wallet Address (0x...)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
          <button
            onClick={() => handleSearch(input)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching
              </span>
            ) : 'Search'}
          </button>
        </div>

        {showHistory && history.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {history.map((item, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                onClick={() => { setInput(item); setShowHistory(false); handleSearch(item); }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-600 dark:text-blue-400">Node ID</div>
              <div className="text-sm font-mono text-blue-800 dark:text-blue-200 mt-1 truncate" title={result.nodeId}>
                {result.nodeId || formatWallet(result.wallet || '') || 'N/A'}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <div className="text-xs text-green-600 dark:text-green-400">Wallet</div>
              <div className="text-sm font-mono text-green-800 dark:text-green-200 mt-1" title={result.wallet}>
                {formatWallet(result.wallet || '')}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <div className="text-xs text-purple-600 dark:text-purple-400">Status</div>
              <div className={`text-sm font-semibold mt-1 ${result.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {result.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <div className="text-xs text-orange-600 dark:text-orange-400">Progress</div>
              <div className="text-sm font-semibold text-orange-700 dark:text-orange-300 mt-1">
                {formatPercent(result.percentNPT || 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mining Speed</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{formatSpeed(result.speedNPT || 0)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mined NPT</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{formatMined(result.minedNPT || 0)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Remaining</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formatTime(result.timeRemaining || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}