'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';

function formatSpeed(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return String(n);
}

export default function HeaderStats() {
  const totalMiner = useDashboardStore((s) => s.totalMiner);
  const miningSpeed = useDashboardStore((s) => s.miningSpeed);
  const loadNetworkStats = useDashboardStore((s) => s.loadNetworkStats);

  useEffect(() => {
    loadNetworkStats();
  }, [loadNetworkStats]);

  return (
    <div className="flex items-center gap-4">
      {totalMiner !== null && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="3" x2="6" y2="15" />
              <rect x="2" y="13" width="9" height="3" rx="1.5" />
              <line x1="5" y1="16" x2="5" y2="21" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Miners</div>
            <div className="text-sm font-bold text-amber-300">{totalMiner.toLocaleString()}</div>
          </div>
        </div>
      )}
      {miningSpeed !== null && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.28 2.4a1 1 0 00-1.76-.8L3.8 15.73a1 1 0 00.88 1.47h6.36l-1.32 5.6a1 1 0 001.76.8l7.72-14.13a1 1 0 00-.88-1.47h-6.36z" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Speed</div>
            <div className="text-sm font-bold text-amber-300">{formatSpeed(miningSpeed)} NPT/s</div>
          </div>
        </div>
      )}
    </div>
  );
}