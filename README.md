# Netrum Dashboard

A dashboard for monitoring Netrum NPT mining nodes — check mining speed, view mining progress, and browse the NPT leaderboard by Node ID or wallet address.

## Features

- **Node Search** — Search by Node ID (e.g. `netrum.lite.name.base.eth`) or wallet address (`0x...`) to view real-time mining status
- **NPT Leaderboard** — Browse active mining nodes ranked by mining speed
- **Auto Resolution** — Short names like `name.base.eth` auto-resolve to `netrum.lite.name.base.eth`
- **ENS Reverse Lookup** — Automatically resolves wallet addresses to `.base.eth` domain names via Base chain ENS CCIP-Read

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) — State management
- [Viem](https://viem.sh/) — ENS reverse resolution on Base chain
- [Recharts](https://recharts.org/) — Charts (leaderboard)

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

All external API calls go through Next.js API routes (proxy) to avoid CORS issues:

- `GET /api/search?q=<nodeId or wallet>` — Search node mining status
- `GET /api/leaderboard` — Fetch NPT mining leaderboard

## License

MIT