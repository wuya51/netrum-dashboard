import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

export const dynamic = 'force-dynamic';

const BLOCKSCOUT_API = 'https://base.blockscout.com/api/v2';
const CONTRACT_ADDRESS = '0xb8c2ce84f831175136cebbfd48ce4bab9c7a6424';
const DECIMALS = 18;
const MAX_HOLDERS = 50;

const tokenAbi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]);

const rpcClient = createPublicClient({
  chain: base,
  transport: http('https://base-rpc.publicnode.com', { timeout: 15000 }),
});

interface BlockscoutHolder {
  address: {
    hash: string;
    ens_domain_name: string | null;
  };
  value: string;
}

interface BlockscoutResponse {
  items: BlockscoutHolder[];
  next_page_params: {
    value: string;
    address_hash: string;
    items_count: number;
  } | null;
}

async function fetchHolderAddresses(): Promise<{ address: string; ensName: string | null }[]> {
  const holders: { address: string; ensName: string | null }[] = [];
  let url: string | null = `${BLOCKSCOUT_API}/tokens/${CONTRACT_ADDRESS}/holders`;

  while (url && holders.length < MAX_HOLDERS) {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Blockscout HTTP ${res.status}`);
    const data = (await res.json()) as BlockscoutResponse;
    for (const item of data.items) {
      holders.push({
        address: item.address.hash,
        ensName: item.address.ens_domain_name,
      });
    }
    if (data.next_page_params && holders.length < MAX_HOLDERS) {
      const { value, address_hash } = data.next_page_params;
      url = `${BLOCKSCOUT_API}/tokens/${CONTRACT_ADDRESS}/holders?value=${value}&address_hash=${address_hash}`;
    } else {
      url = null;
    }
  }
  return holders.slice(0, MAX_HOLDERS);
}

async function fetchRealBalances(
  holders: { address: string; ensName: string | null }[],
): Promise<{ address: string; balance: number; ensName: string | null }[]> {
  const contracts = holders.map((h) => ({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: tokenAbi,
    functionName: 'balanceOf' as const,
    args: [h.address as `0x${string}`],
  }));

  const results = await rpcClient.multicall({ contracts });

  return holders.map((h, i) => {
    const result = results[i];
    const balance = result.status === 'success' && result.result !== undefined
      ? Number(result.result) / Math.pow(10, DECIMALS)
      : 0;
    return { address: h.address, balance, ensName: h.ensName };
  });
}

export async function GET() {
  try {
    const holders = await fetchHolderAddresses();
    if (holders.length === 0) {
      return NextResponse.json({ success: true, leaderboard: [], totalHolders: 0 });
    }

    const withBalances = await fetchRealBalances(holders);

    withBalances.sort((a, b) => b.balance - a.balance);

    const leaderboard = withBalances.map((item, index) => ({
      rank: index + 1,
      wallet: item.address,
      balance: item.balance,
      ensName: item.ensName,
    }));

    let totalSupply = 0;
    try {
      const ts = await rpcClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: tokenAbi,
        functionName: 'totalSupply',
      });
      totalSupply = Number(ts) / Math.pow(10, DECIMALS);
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      leaderboard,
      totalHolders: leaderboard.length,
      totalSupply,
      source: 'realtime',
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: 'Failed to load holder data, please try again later',
      leaderboard: [],
    });
  }
}