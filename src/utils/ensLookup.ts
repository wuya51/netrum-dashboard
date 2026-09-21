import { createPublicClient, http, toCoinType } from 'viem';
import { mainnet, base } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.drpc.org'),
});

export async function lookupEnsReverse(address: string): Promise<string | null> {
  try {
    const name = await client.getEnsName({
      address: address as `0x${string}`,
      coinType: toCoinType(base.id),
      gatewayUrls: ['https://ccip.ens.xyz'],
    });
    return name || null;
  } catch {
    return null;
  }
}

export async function lookupEnsForward(name: string): Promise<string | null> {
  try {
    const addr = await client.getEnsAddress({
      name,
      coinType: toCoinType(base.id),
      gatewayUrls: ['https://ccip.ens.xyz'],
    });
    return addr || null;
  } catch {
    return null;
  }
}