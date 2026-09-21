export const dynamic = 'force-dynamic';

import NodeSearch from '../src/components/NodeSearch';
import MiningLeaderboard from '../src/components/MiningLeaderboard';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Netrum" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Netrum Dashboard
            </h1>
          </div>
          
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <NodeSearch />
        <MiningLeaderboard />
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Powered by lite-agent.netrumlabs.dev
      </footer>
    </div>
  );
}