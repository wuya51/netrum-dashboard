'use client';

const STORAGE_KEY = 'nptAddressMappings';
const SEEDED_KEY = 'nptAddressMappingsSeeded';

interface AddressMapping {
  [wallet: string]: string;
}

function getMappings(): AddressMapping {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getNodeIdByAddress(address: string): string | null {
  const mappings = getMappings();
  return mappings[address.toLowerCase()] || null;
}

export function saveAddressMapping(wallet: string, nodeId: string): void {
  if (!wallet || !nodeId || typeof window === 'undefined') return;
  try {
    const mappings = getMappings();
    mappings[wallet.toLowerCase()] = nodeId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch { /* ignore */ }
}

export function getAddressByNodeId(nodeId: string): string | null {
  try {
    const mappings = getMappings();
    for (const [wallet, id] of Object.entries(mappings)) {
      if (id === nodeId) return wallet;
    }
    return null;
  } catch {
    return null;
  }
}

export async function loadPreSeededMappings(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/addressMappings.json');
    if (!res.ok) return;
    const seedData: AddressMapping = await res.json();
    const seedCount = Object.keys(seedData).length;

    const lastSeedCount = localStorage.getItem(SEEDED_KEY);
    if (lastSeedCount === String(seedCount)) return;

    const existing = getMappings();
    let merged = false;
    for (const [addr, name] of Object.entries(seedData)) {
      const key = addr.toLowerCase();
      if (!existing[key]) {
        existing[key] = name;
        merged = true;
      }
    }

    if (merged) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
    localStorage.setItem(SEEDED_KEY, String(seedCount));
  } catch { /* ignore */ }
}