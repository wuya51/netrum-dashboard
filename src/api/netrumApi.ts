const BASE_URL = 'https://node.netrumlabs.dev';
const cache: Record<string, { data: any; timestamp: number }> = {};
const lastCallTime: Record<string, number> = {};
const RATE_LIMIT_MS = 5_000;
const CACHE_DURATION = 30_000;

export async function fetchWithRateLimit(endpoint: string): Promise<any> {
  const now = Date.now();

  const cached = cache[endpoint];
  if (cached && now - cached.timestamp < CACHE_DURATION) {

    return cached.data;
  }


  if (lastCallTime[endpoint] && now - lastCallTime[endpoint] < RATE_LIMIT_MS) {
    if (cached) {

      return cached.data;
    }
    throw new Error(`Rate limit: Please wait ${Math.ceil((RATE_LIMIT_MS - (now - lastCallTime[endpoint])) / 1000)}s`);
  }

  try {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();

    cache[endpoint] = { data, timestamp: now };
    lastCallTime[endpoint] = now;

    return data;
  } catch (err: any) {    

    if (cached) {

      return cached.data;
    }
    

    if (err.name === 'AbortError') {
      throw new Error('Request timeout: Server took too long to respond');
    }
    
    throw err;
  }
}
export const NetrumAPI = {
  getServiceStatus: () => fetchWithRateLimit('/'),
  getNetworkStats: () => fetchWithRateLimit('/lite/nodes/stats'),
  getNodeById: (id: string) => fetchWithRateLimit(`/lite/nodes/id/${id}`),
  getActiveNodes: () => fetchWithRateLimit('/lite/nodes/active'),
  getRegistrationStatus: () => fetchWithRateLimit('/register/status'),
  getPollingNodeStats: (id: string) => fetchWithRateLimit(`/polling/node-stats/${id}`),
  getRequirements: () => fetchWithRateLimit('/metrics/requirements'),
  getCheckCooldown: (id: string) => fetchWithRateLimit(`/metrics/check-cooldown/${id}`),
  getNodeStatus: (id: string) => fetchWithRateLimit(`/metrics/node-status/${id}`),
  getMiningStatus: (id: string) => fetchWithRateLimit(`/mining/status/${id}`),
  getCooldown: (id: string) => fetchWithRateLimit(`/mining/cooldown/${id}`),
  getLiveLog: (addr: string) => fetchWithRateLimit(`/live-log/status/${addr}`),
  getClaimStatus: (addr: string) => fetchWithRateLimit(`/claim/status/${addr}`),
  getClaimHistory: (addr: string) => fetchWithRateLimit(`/claim/history/${addr}`),
  getSystemInfo: () => fetchWithRateLimit('/system/info'),
  getVersionInfo: () => fetchWithRateLimit('/version'),
};