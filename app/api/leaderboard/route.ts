import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BLOCKSCOUT_API = 'https://base.blockscout.com/api/v2';
const CONTRACT_ADDRESS = '0xb8c2ce84f831175136cebbfd48ce4bab9c7a6424';
const DECIMALS = 18;

interface HolderItem {
  address: {
    hash: string;
    ens_domain_name: string | null;
  };
  value: string;
}

interface HoldersResponse {
  items: HolderItem[];
  next_page_params: {
    value: string;
    address_hash: string;
    items_count: number;
  } | null;
}

async function fetchAllHolders(): Promise<HolderItem[]> {
  const allHolders: HolderItem[] = [];
  let url: string | null = `${BLOCKSCOUT_API}/tokens/${CONTRACT_ADDRESS}/holders`;

  while (url && allHolders.length < 100) {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as HoldersResponse;
    allHolders.push(...data.items);

    if (data.next_page_params) {
      const { value, address_hash } = data.next_page_params;
      url = `${BLOCKSCOUT_API}/tokens/${CONTRACT_ADDRESS}/holders?value=${value}&address_hash=${address_hash}`;
    } else {
      url = null;
    }
  }

  return allHolders;
}

export async function GET() {
  try {
    const holders = await fetchAllHolders();

    if (holders.length === 0) {
      return NextResponse.json({ success: true, leaderboard: [], totalHolders: 0 });
    }

    const leaderboard = holders.map((item, index) => ({
      rank: index + 1,
      wallet: item.address.hash,
      balance: parseInt(item.value) / Math.pow(10, DECIMALS),
      ensName: item.address.ens_domain_name || null,
    }));

    return NextResponse.json({ success: true, leaderboard, totalHolders: holders.length });
  } catch {
    return NextResponse.json({
      success: false,
      message: 'Failed to load holder data, please try again later',
      leaderboard: [],
    });
  }
}