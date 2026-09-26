import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TOTAL_MINER_API = 'https://node.netrumlabs.com/api/board/totalminer/';

export async function GET() {
  try {
    const res = await fetch(TOTAL_MINER_API, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NetrumDashboard/1.0',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, message: 'Failed to fetch total miner data' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Network error fetching total miner data' }, { status: 500 });
  }
}