import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MINING_SPEED_API = 'https://node.netrumlabs.com/api/board/miningSpeed/';

export async function GET() {
  try {
    const res = await fetch(MINING_SPEED_API, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, message: 'Failed to fetch mining speed data' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: 'Network error fetching mining speed data' }, { status: 500 });
  }
}