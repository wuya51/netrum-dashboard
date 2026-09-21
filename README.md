# Netrum Dashboard

A dashboard for monitoring Netrum NPT mining nodes — check mining speed, view mining progress, and browse the NPT holder leaderboard with real-time on-chain data.

## Features

- **Node Search** — Search by Node ID (e.g. `netrum.lite.name.base.eth`) or wallet address (`0x...`) to view real-time mining status and token balance
- **NPT Leaderboard** — Real-time on-chain NPT holder rankings via Base RPC Multicall (no stale third-party cache)
- **Click to Search** — Click any wallet address in the leaderboard to instantly view its mining details
- **Auto Resolution** — Short names like `name.base.eth` auto-resolve to `netrum.lite.name.base.eth`
- **ENS Reverse Lookup** — Resolve wallet addresses via ENS CCIP-Read

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [Viem](https://viem.sh/) — Base chain RPC (Multicall batch balance queries, ENS resolution)

## Getting Started

```bash
# Install dependencies
npm install

# Configure API base URL
echo 'NEXT_PUBLIC_API_BASE=https://lite-agent.netrumlabs.dev' > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3030](http://localhost:3030) in your browser.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variable: `NEXT_PUBLIC_API_BASE=https://lite-agent.netrumlabs.dev`
4. Deploy

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Netrum Lite Agent API base URL | `https://lite-agent.netrumlabs.dev` |

## API Routes

All external API calls go through Next.js API Routes (proxy) to avoid CORS issues:

- `GET /api/search?q=<nodeId or wallet>` — Search node mining status + real-time token balance
- `GET /api/leaderboard` — Real-time on-chain NPT holder leaderboard (RPC Multicall)

## License

MIT