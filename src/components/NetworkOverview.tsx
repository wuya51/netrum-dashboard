
import { useEffect, useState } from 'react';
import { NetrumAPI } from '../api/netrumApi';
import MiniNodeStatusChart from './Charts/MiniNodeStatusChart';
import MiniRequirementsChart from './Charts/MiniRequirementsChart';

const GLOBAL_CACHE_PREFIX = 'netrum_global_cache_';

const getGlobalCache = <T,>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(`${GLOBAL_CACHE_PREFIX}${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setGlobalCache = <T,>(key: string, data: T, ttl: number = 30000) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(`${GLOBAL_CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch {
  }
};

const isCacheValid = (cacheData: any): boolean => {
  if (!cacheData || !cacheData.timestamp) return false;
  return Date.now() - cacheData.timestamp < (cacheData.ttl || 30000);
};

export default function NetworkOverview() {
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [systemRequirements, setSystemRequirements] = useState<any>(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [cachedData, setCachedData] = useState<{
    serviceStatus: any;
    systemRequirements: any;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const loadNetworkStats = async () => {
      if (!isMounted) return;
      
      const globalCacheKey = 'network_stats';
      const globalCache = getGlobalCache<any>(globalCacheKey);
      const hasLocalCachedData = cachedData && (Date.now() - cachedData.timestamp < 30000);
      const hasValidGlobalCache = globalCache && isCacheValid(globalCache);
      
      if (hasLocalCachedData || hasValidGlobalCache) {
        const dataToUse = hasValidGlobalCache ? globalCache.data : cachedData;
        setServiceStatus(dataToUse?.serviceStatus || null);
        setSystemRequirements(dataToUse?.systemRequirements || null);
        setIsUpdating(true);
        
        if (hasValidGlobalCache && !hasLocalCachedData) {
          setCachedData(dataToUse);
        }
      } else {
        setServiceLoading(true);
      }
      
      try {
        const [stats, requirements] = await Promise.all([
          NetrumAPI.getNetworkStats(),
          NetrumAPI.getRequirements()
        ]);
        
        if (!isMounted) return;
        
        const newCachedData = {
          serviceStatus: stats,
          systemRequirements: requirements,
          timestamp: Date.now()
        };
        
        setCachedData(newCachedData);
        setServiceStatus(stats);
        setSystemRequirements(requirements);
        setGlobalCache(globalCacheKey, newCachedData, 30000);
      } catch (error) {
        if (!isMounted) return;
        
        if (!hasLocalCachedData && !hasValidGlobalCache) {
          setServiceStatus(null);
          setSystemRequirements(null);
        }
      } finally {
        if (isMounted) {
          setServiceLoading(false);
          setIsUpdating(false);
        }
      }
    };

    loadNetworkStats();
    
    intervalId = setInterval(() => {
      if (isMounted && !serviceLoading && !isUpdating) {
        loadNetworkStats();
      }
    }, 30000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [serviceLoading, isUpdating]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('zh-CN');
    } catch {
      return 'Unknown';
    }
  };

  const getSafeData = (path: string, defaultValue: any = 0) => {
    if (!serviceStatus) return defaultValue;
    
    const keys = path.split('.');
    let value = serviceStatus;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined && value !== null ? value : defaultValue;
  };

  const totalNodes = getSafeData('stats.totalNodes', 0);
  const activeNodesCount = getSafeData('stats.activeNodes', 0);
  const inactiveNodes = getSafeData('stats.inactiveNodes', 0);
  const totalTasks = getSafeData('stats.totalTasks', 0);
  const timestamp = getSafeData('timestamp', '');
  const isSuccess = getSafeData('success', false);

  const requirements = systemRequirements?.requirements;
  const syncCooldown = systemRequirements?.syncCooldown;
  const syncBuffer = systemRequirements?.syncBuffer;
  const effectiveCooldown = systemRequirements?.effectiveCooldown;

  if (serviceLoading && !cachedData) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Service Status</h3>
        </div>
        <div className="text-center p-8 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Loading service status...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">        
        {isSuccess ? (
          <div>
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Service Status</h3>
                {isUpdating && (
                  <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Last Update: </span>
                <span className="font-medium text-xs">{formatTimestamp(timestamp)}</span>
              </div>
            </div>
            

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center flex flex-col justify-center items-center">
                <MiniNodeStatusChart 
                  activeNodes={activeNodesCount}
                  inactiveNodes={inactiveNodes}
                  totalNodes={totalNodes}
                />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-300 dark:border-green-600 rounded-lg h-full w-full">
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className="text-3xl font-bold text-green-600">{activeNodesCount}</div>
                    <div className="text-sm text-green-800 dark:text-green-200">Active Nodes</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 border border-yellow-300 dark:border-yellow-600 rounded-lg h-full w-full">
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className="text-3xl font-bold text-yellow-600">{inactiveNodes}</div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">Inactive Nodes</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center flex flex-col justify-center items-center">
                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border border-purple-300 dark:border-purple-600 rounded-lg h-full w-full">
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalTasks.toLocaleString()}</div>
                    <div className="text-sm text-purple-800 dark:text-purple-200">Total Tasks</div>
                  </div>
                </div>
              </div>
            </div>
            

            {requirements && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Requirements</h4>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-64">
                  <MiniRequirementsChart requirements={requirements} />
                </div>
                

                <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sync Cooldown:</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-1">{syncCooldown ? (syncCooldown / 1000) + 's' : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sync Buffer:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 ml-1">{syncBuffer ? syncBuffer + 'ms' : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Effective Cooldown:</span>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400 ml-1">{effectiveCooldown ? (effectiveCooldown / 1000) + 's' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-600 dark:text-gray-400">
            {cachedData ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Updating service status...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Loading service status...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}