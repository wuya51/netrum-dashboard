'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';

function formatSpeed(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.001) return (n * 1000).toFixed(2) + 'm';
  if (n >= 0.000001) return (n * 1_000_000).toFixed(2) + 'µ';
  return n.toExponential(2);
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
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 9.879L19 5m-7 7l-5.5 5.5M12 12l4.95-4.95M6.5 17.5l-4 4M21 3l-3.5 3.5M10 2v2m6 4h2M2 10h2m13 8h2M4.93 19.07l1.41 1.41" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Miners</div>
            <div className="text-sm font-bold text-blue-300">{totalMiner.toLocaleString()}</div>
          </div>
        </div>
      )}
      {miningSpeed !== null && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41M12 7a5 5 0 110 10 5 5 0 010-10z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l3-1" />
            </svg>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Speed</div>
            <div className="text-sm font-bold text-emerald-300">{formatSpeed(miningSpeed)} NPT/s</div>
          </div>
        </div>
      )}
    </div>
  );
}