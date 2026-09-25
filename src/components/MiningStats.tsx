'use client';

import { useDashboardStore } from '../store/useDashboardStore';

const TOTAL_SUPPLY = 250_000_000;
const DEX_THRESHOLD = 1_000_000;
const TESTNET_ALLOCATION = 5_000_000;

function formatNPT(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function MiningStats() {
  const { totalSupply } = useDashboardStore();

  const mined = totalSupply;
  const dexProgress = Math.min((mined / DEX_THRESHOLD) * 100, 100);
  const totalProgress = (mined / TOTAL_SUPPLY) * 100;

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl backdrop-blur-sm shadow-xl shadow-black/10 overflow-hidden">
      <div className="p-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Mining Progress</h3>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">Total Mined NPT</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm text-slate-400">Total Mined</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
              {formatNPT(mined)} NPT
            </span>
          </div>

          <div className="relative h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
            <span>0</span>
            <span>Total: {formatNPT(TOTAL_SUPPLY)} NPT</span>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-400">DEX Launch Threshold</span>
            <span className="text-xs text-slate-500">
              {formatNPT(mined)} / {formatNPT(DEX_THRESHOLD)} NPT
            </span>
          </div>
          <div className="relative h-2 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
              style={{ width: `${dexProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            DEX opens to the public once {formatNPT(DEX_THRESHOLD)} NPT is mined
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { label: 'Total Supply', value: '250M' },
            { label: 'Testnet Allocation', value: formatNPT(TESTNET_ALLOCATION) },
            { label: 'Full Nodes', value: '25%' },
            { label: 'Lite Nodes', value: '10%' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{item.label}</div>
              <div className="text-sm font-bold text-slate-200">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-indigo-400 mb-2 font-medium">Upcoming</div>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">&#9679;</span>
              3 testnet phases will mint 30% of total supply
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">&#9679;</span>
              New activities, testnets, and full node releases coming soon
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 mt-0.5">&#9679;</span>
              NPT not yet listed on exchanges — currently Lite v4
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}