import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

interface ActiveNode {
  nodeId?: string;
  id?: string;
  wallet?: string;
  address?: string;
}

function fetchActiveNodes(): Promise<ActiveNode[]> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      'https://node-agent.netrumlabs.dev/lite/nodes/active',
      {
        headers: { 'Accept': 'application/json' },
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Invalid JSON'));
          }
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

export async function GET() {
  try {
    const nodes = await fetchActiveNodes();

    return NextResponse.json({
      success: true,
      onlineNodes: nodes.length,
      totalNodes: nodes.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, onlineNodes: 0, totalNodes: 0, error: message });
  }
}