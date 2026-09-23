'use client';

import { useState, useEffect, useRef } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { saveAddressMapping, loadPreSeededMappings } from '../utils/addressMapping';

function formatSpeed(npt: number): string {
  return npt.toFixed(6) + ' NPT/sec';
}

function formatMined(npt: number): string {
  if (npt >= 1) return npt.toFixed(6) + ' NPT';
  if (npt >= 0.001) return (npt * 1000).toFixed(4) + ' mNPT';
  return npt.toFixed(8) + ' NPT';
}

function formatPercent(pct: number): string {
  return pct.toFixed(2) + '%';
}

function formatBalance(npt: number): string {
  if (npt >= 1_000_000) return (npt / 1_000_000).toFixed(2) + 'M NPT';
  if (npt >= 1_000) return (npt / 1_000).toFixed(2) + 'K NPT';
  return npt.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' NPT';
}

export default function NodeSearch() {
  const { search, result, loading, error, clearError, searchQuery } = useDashboardStore();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nptSearchHistory');
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
    loadPreSeededMappings();
  }, []);

  useEffect(() => {
    if (searchQuery && searchQuery !== input) {
      setInput(searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (result?.wallet && result?.nodeId) {
      saveAddressMapping(result.wallet, result.nodeId);
    }
  }, [result]);

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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); clearError(); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(input)}
              onFocus={() => history.length > 0 && setShowHistory(true)}
              placeholder="Enter Node ID or Wallet Address (0x...)"
              className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all duration-200 backdrop-blur-sm"
              disabled={loading}
            />
            {error && (
              <p className="text-rose-400 text-xs mt-1.5 ml-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
          <button
            onClick={() => handleSearch(input)}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 active:scale-[0.97]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching
              </span>
            ) : 'Search'}
          </button>
        </div>

        {showHistory && history.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-slate-800/95 border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 max-h-48 overflow-y-auto backdrop-blur-xl">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-medium">Recent Searches</div>
            {history.map((item, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-700/50 text-slate-300 text-sm transition-colors"
                onClick={() => { setInput(item); setShowHistory(false); handleSearch(item); }}
              >
                <span className="font-mono text-xs">{item}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {result && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1.5 font-medium">Node ID</div>
              <div className="text-sm font-mono text-indigo-200 break-all">
                {result.nodeId || 'N/A'}
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1.5 font-medium">Wallet Address</div>
              <div className="text-sm font-mono text-emerald-200 break-all">
                {result.wallet || 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-700/40 border border-slate-600/30 rounded-xl p-4 text-center group hover:bg-slate-700/60 transition-colors">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">Status</div>
              <div className={`text-sm font-bold mt-0.5 flex items-center justify-center gap-1.5 ${result.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`w-2 h-2 rounded-full ${result.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {result.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="bg-slate-700/40 border border-slate-600/30 rounded-xl p-4 text-center group hover:bg-slate-700/60 transition-colors">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">Progress</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {formatPercent(result.percentNPT || 0)}
              </div>
            </div>
            <div className="bg-slate-700/40 border border-slate-600/30 rounded-xl p-4 text-center group hover:bg-slate-700/60 transition-colors">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">Node Status</div>
              <div className="text-sm font-bold text-violet-300 mt-0.5">
                {result.nodeStatus || 'Unknown'}
              </div>
            </div>
            <div className="bg-slate-700/40 border border-slate-600/30 rounded-xl p-4 text-center group hover:bg-slate-700/60 transition-colors">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-medium">Token Balance</div>
              <div className="text-sm font-bold text-sky-300 mt-0.5">
                {formatBalance(result.tokenBalance || 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider text-indigo-400 mb-1 font-medium">Mining Speed</div>
              <div className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                {formatSpeed(result.speedNPT || 0)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-1 font-medium">Mined NPT</div>
              <div className="text-xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                {formatMined(result.minedNPT || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}