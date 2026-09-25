import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ActiveNode {
  nodeId?: string;
  id?: string;
  wallet?: string;
  address?: string;
}

export async function GET() {
  try {
    const res = await fetch('https://node-agent.netrumlabs.dev/lite/nodes/active', {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, onlineNodes: 0, totalNodes: 0 });
    }

    const nodes = (await res.json()) as ActiveNode[];
    const onlineNodes = nodes.length;

    return NextResponse.json({
      success: true,
      onlineNodes,
      totalNodes: onlineNodes,
    });
  } catch {
    return NextResponse.json({ success: false, onlineNodes: 0, totalNodes: 0 });
  }
}