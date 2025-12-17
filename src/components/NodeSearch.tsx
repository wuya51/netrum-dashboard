import { useState, useEffect, useRef } from 'react';
import { NetrumAPI } from '../api/netrumApi';

interface NodeStatus {
  nodeStatus?: string;
  taskCount?: number;
  ttsPowerStatus?: string;
  availableRam?: number;
  currentTask?: string;
  currentTaskType?: string;
  lastTaskAssigned?: string;
  lastTaskCompleted?: string;
  lastPolledAt?: string;
  hasMiningToken?: boolean;
}

interface MiningStatus {
  canStartMining?: boolean;
  contractStatus?: string;
  hoursRemaining?: number;
  lastMiningStart?: string;
}

interface MiningData {
  miningStatus?: MiningStatus;
  requirements?: {
    nodeStatus?: string;
    cooldownPeriod?: string;
  };
}

interface CooldownData {
  cooldownActive?: boolean;
  canStartMining?: boolean;
  lastMiningStart?: string;
  cooldownEndedAt?: string;
  message?: string;
  remainingCooldownSeconds?: number;
}

interface ClaimData {
  canClaim?: boolean;
  minedTokensFormatted?: string;
  claimFeeETH?: string;
  lastClaimTime?: string;
  miningSession?: {
    isComplete?: boolean;
    startTime?: number;
    elapsedTime?: number;
    remainingTime?: number;
    formattedRemainingTime?: string;
  };
  requirements?: {
    miningDuration?: string;
    minimumTokens?: string;
  };
}

interface LogData {
  canCheck?: boolean;
  remainingCooldownSeconds?: number;
  lastCheckTime?: string;
  nextCheckTime?: string;
  cooldownDuration?: number;
}

interface NodeDetails {
  id: string;
  address: string;
  status?: NodeStatus;
  mining?: MiningData;
  cooldown?: CooldownData;
  claim?: ClaimData;
  log?: LogData;
}

interface LoadingStatus {
  status: boolean;
  mining: boolean;
  cooldown: boolean;
  claim: boolean;
  log: boolean;
}

interface NodeSearchProps {
  initialSearchValue?: string;
  cooldownActive?: boolean;
  setCooldownActive?: (active: boolean) => void;
  setCooldownRemaining?: (remaining: number) => void;
  setSearchCooldown?: (cooldown: Record<string, number>) => void;
}



export default function NodeSearch({ initialSearchValue = '' }: NodeSearchProps) {
  const [input, setInput] = useState(initialSearchValue);
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchCooldown, setSearchCooldown] = useState<Record<string, number>>({});
  const [searchCooldownRemaining, setSearchCooldownRemaining] = useState<number>(0);
  const [searchCooldownActive, setSearchCooldownActive] = useState<boolean>(false);
  const [nodeCooldownRemaining, setNodeCooldownRemaining] = useState<number>(0);
  const [nodeCooldownActive, setNodeCooldownActive] = useState<boolean>(false);
  const [cachedActiveNodes, setCachedActiveNodes] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastSearchInput, setLastSearchInput] = useState<string>('');
  const [cachedNodeData, setCachedNodeData] = useState<Record<string, NodeDetails>>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    status: false,
    mining: false,
    cooldown: false,
    claim: false,
    log: false
  });
  const isMountedRef = useRef(true);
  const currentRequestIdRef = useRef(0);
  const hasInitialSearchedRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('nodeSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
      }
    }
  }, []);



  useEffect(() => {
    if (searchCooldownActive && searchCooldownRemaining > 0) {
      const timer = setInterval(() => {
        setSearchCooldownRemaining(prev => {
          const newRemaining = prev - 1;
          if (newRemaining <= 0) {
            setSearchCooldownActive(false);
            return 0;
          }
          return newRemaining;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [searchCooldownActive, searchCooldownRemaining]);

  useEffect(() => {
    if (nodeCooldownActive && nodeCooldownRemaining > 0) {
      const timer = setInterval(() => {
        setNodeCooldownRemaining(prev => {
          const newRemaining = prev - 1;
          if (newRemaining <= 0) {
            setNodeCooldownActive(false);
            return 0;
          }
          return newRemaining;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [nodeCooldownActive, nodeCooldownRemaining]);

  useEffect(() => {
    if (initialSearchValue && initialSearchValue.trim() !== '' && !hasInitialSearchedRef.current) {
      hasInitialSearchedRef.current = true;
      setInput(initialSearchValue);
      handleSearch(initialSearchValue);
    }
  }, [initialSearchValue]);

  const handleSearch = async (searchInput: string, isRetry: boolean = false) => {
    console.log('🔍 Starting search for:', searchInput);
    if (!searchInput || searchInput.trim() === '') {
      console.log('❌ Aborted: empty input');
      return;
    }
    
    const requestId = ++currentRequestIdRef.current;
    const now = Date.now();
    const searchKey = searchInput.toLowerCase();
    const lastSearchTime = searchCooldown[searchKey];

    if (lastSearchTime && now - lastSearchTime < 30000 && !isRetry) {
      const remainingSeconds = Math.ceil((30000 - (now - lastSearchTime)) / 1000);
      console.log('⏰ Search cooling down:', remainingSeconds, 'seconds remaining');
      if (isMountedRef.current) {
        setSearchCooldownRemaining(remainingSeconds);
        setSearchCooldownActive(true);
        setError(`Search cooling down. Please wait ${remainingSeconds} seconds.`);
      }
      return;
    }
    
    const hasCachedData = cachedNodeData[searchKey];
    console.log('📦 Cache check:', hasCachedData ? 'Found cached data' : 'No cached data');
    
    if (hasCachedData && !isRetry) {
      console.log('🔄 Showing cached data and continuing with API call');
      if (isMountedRef.current) {
        setIsUpdating(true);
        setNodeDetails(hasCachedData);
        setSearchCooldown(prev => ({
          ...prev,
          [searchKey]: now
        }));
        setSearchCooldownActive(true);
        setSearchCooldownRemaining(30);
      }
    }
    
    if (!hasCachedData || isRetry) {
      console.log('🚀 Starting API call');
      setLoading(true);
      if (!isRetry) {
        setNodeDetails(null);
        setRetryCount(0);
      }
    }
    
    setError(null);
    setShowHistory(false);
    setLastSearchInput(searchInput);

    try {
      if (!isRetry) {
        addToHistory(searchInput);
      }
      
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(searchInput);
      console.log('🔗 Search type:', isAddress ? 'Address' : 'Node ID');

      let result: NodeDetails | null = null;
      if (isAddress) {
        result = await loadAddressDetails(searchInput);
      } else {
        result = await loadNodeDetails(searchInput, '');
      }
      
      if (!result) {
        throw new Error('Failed to load node details: result is null');
      }
      
      if (requestId !== currentRequestIdRef.current) {
        console.log('⚠️ Search request was cancelled, ignoring result');
        return;
      }
      
      console.log('✅ API call successful, updating data');
      setNodeDetails(result);
      setCachedNodeData(prev => ({
        ...prev,
        [searchKey]: result
      }));
      
      if (result.cooldown?.cooldownActive) {
        setNodeCooldownRemaining(result.cooldown.remainingCooldownSeconds || 0);
        setNodeCooldownActive(true);
      } else if (!isRetry) {
        setSearchCooldown(prev => ({
          ...prev,
          [searchKey]: now
        }));
        setSearchCooldownActive(true);
        setSearchCooldownRemaining(30);
      }
      
      setRetryCount(0);
    } catch (err: any) {
      const nextRetryCount = retryCount + 1;
      if (err.message && err.message.includes('Rate limit')) {
        setError('Search is temporarily blocked. Please wait 30 seconds before searching again.');
      } else if (err.message && (err.message.includes('timeout') || err.message.includes('Server took too long'))) {
        if (nextRetryCount <= 3) {
          console.log(`🔄 Auto retrying search (${nextRetryCount}/3)...`);
          setRetryCount(nextRetryCount);
          setTimeout(() => {
            handleSearch(lastSearchInput, true);
          }, 2000);
          return;
        } else {
          setError('Request timeout after 3 attempts. Please try again later.');
        }
      } else {
        setError(`${err.message || 'Failed to search node'}`);
      }
      setRetryCount(nextRetryCount);
    } finally {
      console.log('✅ Search finished (loading = false)');
      setLoading(false);
      setIsUpdating(false);
    }
  };

  const addToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [searchTerm, ...searchHistory.filter(item => item.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('nodeSearchHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('nodeSearchHistory');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted with input:', input);
    if (!input.trim() || loading) {
      console.log('❌ Form submission aborted:', !input.trim() ? 'Empty input' : 'Already loading');
      return;
    }
    
    await handleSearch(input.trim());
  };

  const selectHistoryItem = (item: string) => {
    setInput(item);
    setShowHistory(false);
  };

  const loadNodeDetails = async (nodeId: string, nodeAddress: string): Promise<NodeDetails> => {
    try {
      let resolvedAddress = nodeAddress;
      
      if (!resolvedAddress) {
        let searchNodes = cachedActiveNodes;
        if (searchNodes.length === 0) {
          const activeNodes = await NetrumAPI.getActiveNodes();
          if (Array.isArray(activeNodes)) {
            searchNodes = activeNodes;
          } else if (activeNodes && activeNodes.nodes && Array.isArray(activeNodes.nodes)) {
            searchNodes = activeNodes.nodes;
          } else if (activeNodes && activeNodes.data && Array.isArray(activeNodes.data)) {
            searchNodes = activeNodes.data;
          }
          setCachedActiveNodes(searchNodes);
        }

        const matchedNode = searchNodes.find(node => {
          const nodeIdMatch = (node.nodeId && node.nodeId.toLowerCase() === nodeId.toLowerCase()) ||
                            (node.id && node.id.toLowerCase() === nodeId.toLowerCase());

          if (nodeIdMatch && (node.wallet || node.address)) {
            return true;
          }
          return false;
        });
        
        if (matchedNode) {
          resolvedAddress = matchedNode.wallet || matchedNode.address || '';
          console.log(`✅ Matched node: ${nodeId} -> ${resolvedAddress}`);
        } else {
          console.warn(`⚠️ No address found for nodeId: ${nodeId}`);
        }
      }

      if (!resolvedAddress) {
        resolvedAddress = nodeId;
        console.log(`🔄 Using nodeId as address: ${resolvedAddress}`);
      }

      const nodeDetails: NodeDetails = {
        id: nodeId,
        address: resolvedAddress,
        status: undefined,
        mining: undefined,
        cooldown: undefined,
        claim: undefined,
        log: undefined,
      };

      setNodeDetails({...nodeDetails});

      const loadData = async (): Promise<NodeDetails> => {
        const isUsingAddressAsNodeId = nodeId === resolvedAddress;
        console.log(`🔧 API calls: nodeId=${nodeId}, resolvedAddress=${resolvedAddress}, isUsingAddressAsNodeId=${isUsingAddressAsNodeId}`);
        
        const apiCalls = [
          { key: 'status', call: () => isUsingAddressAsNodeId ? Promise.resolve(null) : NetrumAPI.getPollingNodeStats(nodeId) },
          { key: 'mining', call: () => isUsingAddressAsNodeId ? Promise.resolve(null) : NetrumAPI.getMiningStatus(nodeId) },
          { key: 'cooldown', call: () => isUsingAddressAsNodeId ? Promise.resolve(null) : NetrumAPI.getCooldown(nodeId) },
          { key: 'claim', call: () => NetrumAPI.getClaimStatus(resolvedAddress) },
          { key: 'log', call: () => NetrumAPI.getLiveLog(resolvedAddress) },
        ];

        let hasTimeoutError = false;
        
        const updatedNodeDetails = { ...nodeDetails };
        const updatedLoadingStatus = { ...loadingStatus };
        
        for (const item of apiCalls) {
          updatedLoadingStatus[item.key as keyof LoadingStatus] = true;
        }
        setLoadingStatus(updatedLoadingStatus);
        
        for (const item of apiCalls) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          let retryCount = 0;
          const maxRetries = 2;
          let success = false;
          
          while (retryCount <= maxRetries && !success) {
            try {
              const result = await item.call();
              updatedNodeDetails[item.key as keyof NodeDetails] = result;
              updatedLoadingStatus[item.key as keyof LoadingStatus] = false;
              success = true;
              
              setNodeDetails({ ...updatedNodeDetails });
              setLoadingStatus({ ...updatedLoadingStatus });
            } catch (err: any) {
              console.error(`Failed to load ${item.key} (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
              
              if (retryCount < maxRetries && err.message && (err.message.includes('timeout') || err.message.includes('Server took too long'))) {
                console.log(`🔄 Retrying ${item.key} in 2 seconds...`);
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }
              
              if (item.key === 'id' || item.key === 'address') {
              } else {
                updatedNodeDetails[item.key as keyof NodeDetails] = null as any;
              }
              updatedLoadingStatus[item.key as keyof LoadingStatus] = false;

              setNodeDetails({ ...updatedNodeDetails });
              setLoadingStatus({ ...updatedLoadingStatus });
              
              if (err.message && (err.message.includes('timeout') || err.message.includes('Server took too long'))) {
                hasTimeoutError = true;
              }
              break;
            }
          }
        }
        
        return updatedNodeDetails;
      };

      const finalData = await loadData();
      return finalData;
    } catch (err: any) {
      if (err.message && (err.message.includes('timeout') || err.message.includes('Server took too long'))) {
        throw err;
      }
      throw new Error(err.message || 'Failed to load node details');
    }
  };

  const loadAddressDetails = async (nodeAddress: string): Promise<NodeDetails> => {
    try {
      const possibleNodeIds = await findPossibleNodeIds(nodeAddress);
      console.log(`🔍 Searching for nodeId for address: ${nodeAddress}, found: ${possibleNodeIds.length} possible IDs`);
      
      if (possibleNodeIds.length > 0) {
        const nodeId = possibleNodeIds[0];
        console.log(`✅ Using nodeId: ${nodeId} for address: ${nodeAddress}`);
        return await loadNodeDetails(nodeId, nodeAddress);
      } else {
        console.log(`⚠️ No nodeId found for address: ${nodeAddress}, using address as nodeId`);
        const nodeDetails: NodeDetails = {
          id: nodeAddress,
          address: nodeAddress,
          status: undefined,
          mining: undefined,
          cooldown: undefined,
          claim: undefined,
          log: undefined,
        };

        setNodeDetails({...nodeDetails});

        const loadData = async () => {
          const apiCalls = [
            { key: 'claim', call: () => NetrumAPI.getClaimStatus(nodeAddress) },
            { key: 'log', call: () => NetrumAPI.getLiveLog(nodeAddress) },
          ];

          let hasTimeoutError = false;
          
          for (const item of apiCalls) {
            setLoadingStatus(prev => ({ ...prev, [item.key]: true }));
            
            let retryCount = 0;
            const maxRetries = 2;
            let success = false;
            
            while (retryCount <= maxRetries && !success) {
              try {
                const result = await item.call();
                nodeDetails[item.key as keyof NodeDetails] = result;
                setNodeDetails({...nodeDetails});
                success = true;
              } catch (err: any) {
                console.error(`Failed to load ${item.key} (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
                
                if (retryCount < maxRetries && err.message && (err.message.includes('timeout') || err.message.includes('Server took too long'))) {
                  console.log(`🔄 Retrying ${item.key} in 2 seconds...`);
                  retryCount++;
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  continue;
                }
                
                if (!success && err.message && (err.message.includes('timeout') || err.message.includes('Server took too long'))) {
                  hasTimeoutError = true;
                }
                break;
              }
            }
            
            setLoadingStatus(prev => ({ ...prev, [item.key]: false }));
          }
          
          if (hasTimeoutError) {
            throw new Error('Request timeout: Some data could not be loaded due to server timeout');
          }
        };

        await loadData();
        return nodeDetails;
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('timeout') || err.message.includes('Server took too long'))) {
        throw err;
      } else {
        setError(`Failed to load address details: ${err.message}`);
        throw err;
      }
    }
  };

  const findPossibleNodeIds = async (nodeAddress: string): Promise<string[]> => {
    const possibleIds: string[] = [];
    
    try {
      const getGlobalCache = (key: string) => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && Date.now() - parsed.timestamp < 30000) {
              return parsed;
            }
          }
        } catch (error) {
        }
        return null;
      };
      
      const globalCacheKey = 'active_nodes';
      const globalCache = getGlobalCache(globalCacheKey);
      
      let searchNodes: any[] = [];
      
      if (globalCache) {
        const cachedData = globalCache.data;
        if (Array.isArray(cachedData)) {
          searchNodes = cachedData;
        } else if (cachedData && cachedData.nodes && Array.isArray(cachedData.nodes)) {
          searchNodes = cachedData.nodes;
        } else if (cachedData && cachedData.data && Array.isArray(cachedData.data)) {
          searchNodes = cachedData.data;
        }
      }
      
      if (searchNodes.length === 0) {
        const activeNodes = await NetrumAPI.getActiveNodes();
        if (Array.isArray(activeNodes)) {
          searchNodes = activeNodes;
        } else if (activeNodes && activeNodes.nodes && Array.isArray(activeNodes.nodes)) {
          searchNodes = activeNodes.nodes;
        } else if (activeNodes && activeNodes.data && Array.isArray(activeNodes.data)) {
          searchNodes = activeNodes.data;
        }
      }
      
      console.log(`🔍 Searching for address: ${nodeAddress} in ${searchNodes.length} nodes`);
      
      const matchedNodes = searchNodes.filter(node => {
        const nodeWallet = node.wallet || node.address;
        const match = nodeWallet && nodeWallet.toLowerCase() === nodeAddress.toLowerCase();
        if (match) {
          console.log(`✅ Found match: nodeWallet=${nodeWallet}, nodeId=${node.nodeId}, id=${node.id}`);
        }
        return match;
      });
      
      matchedNodes.forEach(node => {
        if (node.nodeId && !possibleIds.includes(node.nodeId)) {
          possibleIds.push(node.nodeId);
          console.log(`➕ Added nodeId: ${node.nodeId}`);
        }
        if (node.id && node.id !== node.nodeId && !possibleIds.includes(node.id)) {
          possibleIds.push(node.id);
          console.log(`➕ Added id: ${node.id}`);
        }
      });

      if (possibleIds.length === 0) {
        console.log(`🔍 No exact match found, trying case-insensitive match`);
        const caseInsensitiveMatches = searchNodes.filter(node => {
          const nodeWallet = node.wallet || node.address;
          return nodeWallet && nodeWallet.toLowerCase() === nodeAddress.toLowerCase();
        });
        
        caseInsensitiveMatches.forEach(node => {
          if (node.nodeId && !possibleIds.includes(node.nodeId)) {
            possibleIds.push(node.nodeId);
            console.log(`➕ Added case-insensitive match nodeId: ${node.nodeId}`);
          }
          if (node.id && node.id !== node.nodeId && !possibleIds.includes(node.id)) {
            possibleIds.push(node.id);
            console.log(`➕ Added case-insensitive match id: ${node.id}`);
          }
        });
      }

      if (possibleIds.length === 0) {
        console.log(`🔍 No case-insensitive match found, trying checksum address match`);
        const checksumAddress = nodeAddress.toLowerCase();
        const checksumMatches = searchNodes.filter(node => {
          const nodeWallet = node.wallet || node.address;
          return nodeWallet && nodeWallet.toLowerCase() === checksumAddress;
        });
        
        checksumMatches.forEach(node => {
          if (node.nodeId && !possibleIds.includes(node.nodeId)) {
            possibleIds.push(node.nodeId);
            console.log(`➕ Added checksum match nodeId: ${node.nodeId}`);
          }
          if (node.id && node.id !== node.nodeId && !possibleIds.includes(node.id)) {
            possibleIds.push(node.id);
            console.log(`➕ Added checksum match id: ${node.id}`);
          }
        });
      }
    } catch (error) {
    }
    
    return possibleIds;
  };

  const closeNodeDetails = () => {
    setNodeDetails(null);
    setError(null);
    setShowHistory(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:whitespace-nowrap">🔍 Search Node</h2>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              placeholder="Enter Node ID (netrum.lite.node-abc123.base.eth) or Wallet Address"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              disabled={loading}
            />
            
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent searches</span>
                  <button 
                    onClick={clearHistory}
                    className="text-xs text-red-500 hover:text-red-700"
                    type="button"
                  >
                    Clear all
                  </button>
                </div>
                {searchHistory.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectHistoryItem(item)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || searchCooldownActive || nodeCooldownActive}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            {loading ? 'Searching...' : 
             searchCooldownActive ? `Search Cooling... ${searchCooldownRemaining}s` :
             nodeCooldownActive ? `Node Cooling... ${nodeCooldownRemaining}s` : 
             'Search'}
          </button>
        </div>
      </form>
      <div className="mt-4 space-y-2">
        {(loading || isUpdating) && (
          <div className="flex items-center px-4 py-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            {isUpdating ? 'Updating data...' : 'Loading data...'}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 px-4 py-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      

      
      {(nodeDetails || loading || isUpdating) && (
        <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Node Details</h3>
            <button onClick={closeNodeDetails} className="text-2xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">×</button>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">🆔</span> Identity
                  {loadingStatus.claim && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </h4>
                <div className="space-y-4">
                  {loadingStatus.claim ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div 
                            className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent"
                            style={{
                              animation: 'shimmer 2s infinite'
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Loading Identity Data...</span>
                    </div>
                  ) : nodeDetails?.id || nodeDetails?.address ? (
                    <>
                      {nodeDetails?.id ? (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Node ID</span>
                          <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 break-all">{nodeDetails.id}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">No node ID found</div>
                      )}
                      {nodeDetails?.address ? (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Wallet Address</span>
                          <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 break-all">{nodeDetails.address}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">No wallet address available</div>
                      )}
                      {nodeDetails?.claim?.requirements ? (
                        <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
                          <span className="text-xs text-green-600 dark:text-green-300 block mb-1">Requirements</span>
                          <div className="text-sm text-green-800 dark:text-green-200">
                            <div>Mining Duration: {nodeDetails.claim.requirements.miningDuration}</div>
                            <div>Minimum Tokens: {nodeDetails.claim.requirements.minimumTokens}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">Requirements data not available</div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Waiting for loading...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📊</span> Node Statistics
                  {loadingStatus.status && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </h4>
                <div className="space-y-4">
                  {loadingStatus.status ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Loading Node Statistics...</span>
                    </div>
                  ) : nodeDetails?.status !== undefined ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Node Status</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.status.nodeStatus === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {nodeDetails.status.nodeStatus === 'Active' ? '✅ Active' : '❌ ' + (nodeDetails.status.nodeStatus || 'Unknown')}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Task Count</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{nodeDetails.status.taskCount?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">TTS Power Status:</span>
                          <span className={`text-sm font-medium ${
                            nodeDetails.status?.ttsPowerStatus === 'available' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails.status?.ttsPowerStatus || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Available RAM:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status?.availableRam || '0'} GB</span>
                        </div>
                        {nodeDetails.status.currentTask && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current Task:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status?.currentTask}</span>
                          </div>
                        )}
                        {nodeDetails.status.currentTaskType && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Task Type:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status?.currentTaskType}</span>
                          </div>
                        )}
                        {nodeDetails.status.lastTaskAssigned && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Task Assigned:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails.status?.lastTaskAssigned || '').toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails.status.lastTaskCompleted && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Task Completed:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails.status?.lastTaskCompleted || '').toLocaleString('en-US')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Polled:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status?.lastPolledAt ? new Date(nodeDetails.status.lastPolledAt).toLocaleString('en-US') : 'N/A'}</span>
                        </div>
                        {nodeDetails.status.hasMiningToken !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Has Mining Token:</span>
                            <span className={`text-sm font-medium ${
                              nodeDetails.status?.hasMiningToken ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {nodeDetails.status?.hasMiningToken ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Waiting for loading...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">⛏️</span> Mining Status
                  {loadingStatus.mining && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </h4>
                <div className="space-y-4">
                  {loadingStatus.mining ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Loading Mining Status...</span>
                    </div>
                  ) : nodeDetails?.mining ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Mining</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.mining?.miningStatus?.canStartMining ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails.mining?.miningStatus?.canStartMining ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Contract</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.mining?.miningStatus?.contractStatus === 'active' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {nodeDetails.mining?.miningStatus?.contractStatus === 'active' ? '✅ Active' : '⚠️ ' + (nodeDetails.mining?.miningStatus?.contractStatus || 'Unknown')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {nodeDetails.mining?.miningStatus?.hoursRemaining !== undefined ? (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Hours Left:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.mining?.miningStatus?.hoursRemaining || '0'}</span>
                          </div>
                        ) : null}
                        {nodeDetails.mining?.miningStatus?.lastMiningStart ? (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Mining:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(nodeDetails.mining?.miningStatus?.lastMiningStart || '').toLocaleString('en-US')}
                            </span>
                          </div>
                        ) : null}
                        {nodeDetails.mining?.requirements ? (
                          <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
                            <span className="text-xs text-green-600 dark:text-green-300 block mb-1">Requirements</span>
                            <div className="text-sm text-green-800 dark:text-green-200">
                              <div>Node Status: {nodeDetails.mining?.requirements?.nodeStatus}</div>
                              <div>Cooldown Period: {nodeDetails.mining?.requirements?.cooldownPeriod}</div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Waiting for loading...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">💰</span> Claim Status
                  {loadingStatus.claim && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </h4>
                <div className="space-y-4">
                  {loadingStatus.claim ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Loading Claim Status...</span>
                    </div>
                  ) : nodeDetails?.claim ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Claim</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.claim?.canClaim ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails?.claim?.canClaim ? '✅ Available' : '❌ Unavailable'}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tokens</span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            <span className="text-xs">{nodeDetails?.claim?.minedTokensFormatted || '0'}</span> NPT
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fee:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails?.claim?.claimFeeETH || '0'} ETH</span>
                        </div>
                        {nodeDetails?.claim?.lastClaimTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Claim:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails?.claim?.lastClaimTime || '').toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails?.claim?.miningSession && (
                          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                            <span className="text-xs text-blue-600 dark:text-blue-300 block mb-2">Mining Session</span>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-700 dark:text-blue-200">Status:</span>
                                <span className={`text-sm font-medium ${
                                  nodeDetails.claim?.miningSession?.isComplete ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                  {nodeDetails?.claim?.miningSession?.isComplete ? '✅ Complete' : '⏳ In Progress'}
                                </span>
                              </div>
                              {nodeDetails?.claim?.miningSession?.startTime && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-blue-700 dark:text-blue-200">Start Time:</span>
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{new Date(nodeDetails?.claim?.miningSession?.startTime * 1000).toLocaleString('en-US')}</span>
                                </div>
                              )}
                              {nodeDetails?.claim?.miningSession?.elapsedTime && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-blue-700 dark:text-blue-200">Elapsed Time:</span>
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{Math.floor(nodeDetails?.claim?.miningSession?.elapsedTime / 3600)}h {Math.floor((nodeDetails?.claim?.miningSession?.elapsedTime % 3600) / 60)}m</span>
                                </div>
                              )}
                              {nodeDetails?.claim?.miningSession?.remainingTime && nodeDetails?.claim?.miningSession?.remainingTime > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-blue-700 dark:text-blue-200">Remaining Time:</span>
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{nodeDetails?.claim?.miningSession?.formattedRemainingTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Waiting for loading...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">⏳</span> Cooldown Status
                  {loadingStatus.cooldown && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </h4>
                <div className="space-y-4">
                  {loadingStatus.cooldown ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Loading Cooldown Status...</span>
                    </div>
                  ) : nodeDetails?.cooldown ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Status</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.cooldown?.cooldownActive ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {nodeDetails?.cooldown?.cooldownActive ? '⏳ Active' : '✅ Ready'}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Mining</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.cooldown?.canStartMining ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails?.cooldown?.canStartMining ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {nodeDetails?.cooldown?.lastMiningStart && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Mining:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(nodeDetails?.cooldown?.lastMiningStart).toLocaleString('en-US')}
                            </span>
                          </div>
                        )}
                        {nodeDetails?.cooldown?.cooldownEndedAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Cooldown Ends:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(nodeDetails?.cooldown?.cooldownEndedAt).toLocaleString('en-US')}
                            </span>
                          </div>
                        )}
                        {nodeDetails?.cooldown?.message && (
                          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                            <span className="text-xs text-blue-600 dark:text-blue-300 block mb-1">Message</span>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{nodeDetails?.cooldown?.message}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Waiting for loading...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📜</span> Log Status
                  {loadingStatus.log && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </h4>
                <div className="space-y-4">
                  {loadingStatus.log ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Loading Log Status...</span>
                    </div>
                  ) : nodeDetails?.log ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Logs</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails?.log?.canCheck ? 'text-green-600 dark:text-green-400' : 
                            nodeDetails?.log?.remainingCooldownSeconds ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails?.log?.canCheck ? '✅ Available' : 
                             nodeDetails?.log?.remainingCooldownSeconds ? '⏳ Cooldown' : '❌ Unavailable'}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Cooldown</span>
                          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{nodeDetails?.log?.remainingCooldownSeconds || '0'}s</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {nodeDetails?.log?.lastCheckTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Check:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails?.log?.lastCheckTime).toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails?.log?.nextCheckTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Next Check:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails?.log?.nextCheckTime).toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails?.log?.cooldownDuration && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Cooldown:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.floor(nodeDetails?.log?.cooldownDuration / 60000)} min</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 animate-pulse">
                          <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-300">Waiting for loading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}