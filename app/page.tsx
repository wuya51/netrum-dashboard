export const dynamic = 'force-dynamic';

import NodeSearch from '../src/components/NodeSearch';
import MiningStats from '../src/components/MiningStats';
import MiningLeaderboard from '../src/components/MiningLeaderboard';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <header className="relative border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <img src="/logo.png" alt="Netrum" className="w-[90%] h-[90%]" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Netrum Dashboard
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                Node Monitor
              </p>
            </div>
          </div>
          <a
            href="https://lite-agent.netrumlabs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
          >
            lite-agent.netrumlabs.dev
          </a>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">
        <NodeSearch />
        <MiningStats />
        <MiningLeaderboard />
      </main>

      <footer className="relative py-6 text-center">
        <p className="text-xs text-slate-600">
          Powered by <span className="text-slate-500">lite-agent.netrumlabs.dev</span>
        </p>
      </footer>
    </div>
  );
}