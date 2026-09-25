import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { lookupEnsReverse } from '../../../src/utils/ensLookup';

export const dynamic = 'force-dynamic';

const TOKEN_ADDRESS = '0xb8c2ce84f831175136cebbfd48ce4bab9c7a6424';
const tokenAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);

const rpcClient = createPublicClient({
  chain: base,
  transport: http('https://base-rpc.publicnode.com', { timeout: 10000 }),
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://lite-agent.netrumlabs.dev';

interface MiningLiveInfo {
  minedTokens: string;
  speedPerSec: string;
  timeRemaining: string;
  percentComplete: string;
  isActive: boolean;
}

interface MiningDebugResponse {
  success: boolean;
  contract?: {
    liveInfo: MiningLiveInfo;
  };
}

interface NodeStatsResponse {
  success: boolean;
  nodeId?: string;
  stats?: {
    wallet: string;
    nodeStatus: string;
  };
}

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
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

function parsePercent(percentComplete: string): number {
  try {
    const val = parseFloat(percentComplete);
    return val > 100 ? val / 100 : val;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || !q.trim()) {
    return NextResponse.json({ success: false, message: 'Please enter a Node ID or Wallet Address' }, { status: 400 });
  }

  const query = q.trim();

  try {
    const isWallet = query.startsWith('0x');
    let wallet: string;
    let nodeId: string;
    let nodeStatus = '';
    let isOnline = false;

    const activeNodes = await fetch('https://node-agent.netrumlabs.dev/lite/nodes/active', {
      headers: { 'Accept': 'application/json' },
    }).then((r) => (r.ok ? r.json() as Promise<Array<{ nodeId?: string; id?: string; wallet?: string; address?: string }>> : Promise.resolve([])))
      .catch(() => [] as Array<{ nodeId?: string; id?: string; wallet?: string; address?: string }>);

    if (isWallet) {
      wallet = query;
      nodeId = '';

      const found = activeNodes.find(
        (n) => (n.wallet || n.address || '').toLowerCase() === wallet.toLowerCase()
      );
      if (found) {
        nodeId = found.nodeId || found.id || '';
        isOnline = true;
      }

      if (!nodeId) {
        try {
          const ensName = await lookupEnsReverse(wallet);
          if (ensName) {
            const candidateId = `netrum.lite.${ensName}`;
            const checkRes = await fetch(`${API_BASE}/user/task/node-stats/${encodeURIComponent(candidateId)}`, {
              headers: { 'Accept': 'application/json' },
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json() as NodeStatsResponse;
              if (checkData.success && checkData.stats?.wallet) {
                nodeId = candidateId;
              }
            }
          }
        } catch { /* ENS lookup optional */ }
      }
    } else {
      const candidates = query.startsWith('netrum.lite.')
        ? [query]
        : [query, `netrum.lite.${query}`];

      let nodeStats: NodeStatsResponse | null = null;
      let resolvedId = query;
      for (const candidate of candidates) {
        try {
          const res = await fetchAPI<NodeStatsResponse>(`/user/task/node-stats/${encodeURIComponent(candidate)}`);
          if (res.success && res.stats?.wallet) {
            nodeStats = res;
            resolvedId = candidate;
            break;
          }
        } catch { /* try next */ }
      }

      if (!nodeStats?.stats?.wallet) {
        return NextResponse.json({ success: false, message: 'Node not found, please check the Node ID' }, { status: 404 });
      }

      wallet = nodeStats.stats.wallet;
      nodeId = nodeStats.nodeId || resolvedId;
      nodeStatus = nodeStats.stats.nodeStatus || '';

      const foundInActive = activeNodes.find(
        (n) => (n.wallet || n.address || '').toLowerCase() === wallet.toLowerCase()
      );
      isOnline = !!foundInActive || nodeStatus.toLowerCase().includes('active');
    }

    let miningData: MiningDebugResponse | null = null;
    try {
      miningData = await fetchAPI<MiningDebugResponse>(`/user/mining/debug/${wallet}`);
    } catch {
      return NextResponse.json({ success: false, message: 'Failed to fetch mining data' }, { status: 500 });
    }

    const liveInfo = miningData?.contract?.liveInfo;
    if (!liveInfo) {
      return NextResponse.json({ success: false, message: 'No mining data found' }, { status: 404 });
    }

    const speed = parseSpeed(liveInfo.speedPerSec);
    const mined = parseMined(liveInfo.minedTokens);
    const percent = parsePercent(liveInfo.percentComplete);

    let tokenBalance = 0;
    if (wallet) {
      try {
        const balanceResult = await rpcClient.readContract({
          address: TOKEN_ADDRESS as `0x${string}`,
          abi: tokenAbi,
          functionName: 'balanceOf',
          args: [wallet as `0x${string}`],
        });
        tokenBalance = Number(balanceResult) / 1e18;
      } catch { /* balance lookup optional */ }
    }

    return NextResponse.json({
      success: true,
      nodeId: nodeId || '',
      wallet,
      nodeStatus,
      isActive: liveInfo.isActive,
      isOnline,
      speedPerSec: liveInfo.speedPerSec,
      speedNPT: speed,
      minedTokens: liveInfo.minedTokens,
      minedNPT: mined,
      percentComplete: liveInfo.percentComplete,
      percentNPT: percent,
      tokenBalance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}