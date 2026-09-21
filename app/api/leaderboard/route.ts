import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://lite-agent.netrumlabs.dev';

interface OldNodeItem {
  nodeId?: string;
  id?: string;
  wallet?: string;
  address?: string;
  nodeStatus?: string;
  status?: string;
}

interface MiningDebugResponse {
  success: boolean;
  contract?: {
    liveInfo?: {
      speedPerSec: string;
      minedTokens: string;
      isActive: boolean;
      percentComplete: string;
    };
  };
}

function parseSpeed(speedPerSec: string): number {
  try {
    return parseInt(speedPerSec) / 1e18;
  } catch {
    return 0;
  }
}

function parseMined(minedTokens: string): number {
  try {
    return parseInt(minedTokens) / 1e18;
  } catch {
    return 0;
  }
}

async function fetchAPI(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function GET() {
  try {
    let nodes: OldNodeItem[] = [];

    try {
      const res = await fetch('https://node-agent.netrumlabs.dev/lite/nodes/active', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        nodes = Array.isArray(data) ? data : [];
      }
    } catch {
      return NextResponse.json({
        success: false,
        message: 'Leaderboard temporarily unavailable (works after Vercel deploy)',
        leaderboard: [],
      });
    }

    if (nodes.length === 0) {
      return NextResponse.json({ success: true, leaderboard: [] });
    }

    const speedPromises = nodes.slice(0, 30).map(async (node) => {
      const id = node.nodeId || node.id || '';
      const wallet = node.wallet || node.address || '';
      try {
        const mining = await fetchAPI(`/user/mining/debug/${wallet}`) as MiningDebugResponse;
        const liveInfo = mining?.contract?.liveInfo;
        if (liveInfo && liveInfo.isActive) {
          return {
            nodeId: id,
            wallet,
            speedNPT: parseSpeed(liveInfo.speedPerSec),
            minedNPT: parseMined(liveInfo.minedTokens),
            isActive: liveInfo.isActive,
          };
        }
      } catch {
        // skip nodes that fail
      }
      return null;
    });

    const speeds = (await Promise.all(speedPromises)).filter(Boolean);
    const ranked = speeds
      .sort((a, b) => (b?.speedNPT || 0) - (a?.speedNPT || 0))
      .map((s, i) => ({ ...s, rank: i + 1 }));

    return NextResponse.json({ success: true, leaderboard: ranked });
  } catch {
    return NextResponse.json({ success: false, message: '加载失败', leaderboard: [] });
  }
}