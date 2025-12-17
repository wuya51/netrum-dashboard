import { useState, useEffect, useRef } from 'react';
import { NetrumAPI } from '../api/netrumApi';

interface NodeDetails {
  id: string;
  address: string;
  status: any;
  mining: any;
  cooldown: any;
  claim: any;
  log: any;
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
  const hasInitialSearchedRef = useRef(false);
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchCooldown, setSearchCooldown] = useState<Record<string, number>>({});
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [cachedActiveNodes, setCachedActiveNodes] = useState<any[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [lastSearchInput, setLastSearchInput] = useState<string>('');

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
    if (cooldownActive && cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => {
          const newRemaining = prev - 1;
          if (newRemaining <= 0) {
            setCooldownActive(false);
            setSearchCooldown({});
          }
          return newRemaining;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownActive, cooldownRemaining]);

  useEffect(() => {
    if (initialSearchValue && initialSearchValue !== input) {
      setInput(initialSearchValue);
      handleSearch(initialSearchValue);
    }
  }, [initialSearchValue]);

  const handleSearch = async (searchInput: string, isRetry: boolean = false) => {
    if (!searchInput.trim()) return;
    
    const now = Date.now();
    const lastSearchTime = searchCooldown[searchInput.toLowerCase()];
    if (lastSearchTime && now - lastSearchTime < 30000 && !isRetry) {
      const remainingSeconds = Math.ceil((30000 - (now - lastSearchTime)) / 1000);
      setCooldownRemaining(remainingSeconds);
      setCooldownActive(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    if (!isRetry) {
      setNodeDetails(null);
      setRetryCount(0);
    }
    setShowHistory(false);
    setLastSearchInput(searchInput);

    try {
      if (!isRetry) {
        addToHistory(searchInput);
      }
      
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(searchInput);

      if (isAddress) {
        await loadAddressDetails(searchInput);
      } else {
        await loadNodeDetails(searchInput, '');
      }
      
      if (!isRetry) {
        setSearchCooldown(prev => ({
          ...prev,
          [searchInput.toLowerCase()]: now
        }));
        
        setCooldownActive(true);
        setCooldownRemaining(30);
      }
      
      setRetryCount(0);
    } catch (err: any) {
      if (err.message && err.message.includes('Rate limit')) {
        setError('Search is temporarily blocked. Please wait 30 seconds before searching again.');
      } else if (err.message && err.message.includes('timeout') || err.message && err.message.includes('Server took too long')) {
        setError(`Request timeout. Please try again. (Retry ${retryCount}/3)`);
      } else {
        setError(`${err.message || 'Failed to search node'} (Retry ${retryCount}/3)`);
      }
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastSearchInput && retryCount < 3) {
      handleSearch(lastSearchInput, true);
    }
  };



  const addToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const newHistory = [searchTerm, ...searchHistory.filter(item => item !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('nodeSearchHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('nodeSearchHistory');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    await handleSearch(input.trim());
  };

  const selectHistoryItem = (item: string) => {
    setInput(item);
    setShowHistory(false);
  };

  const loadNodeDetails = async (nodeId: string, nodeAddress: string) => {
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
        
        const matchedNode = searchNodes.find(node => 
          (node.nodeId && node.nodeId.toLowerCase() === nodeId.toLowerCase()) ||
          (node.id && node.id.toLowerCase() === nodeId.toLowerCase())
        );
        
        if (matchedNode) {
          resolvedAddress = matchedNode.wallet || matchedNode.address || '';
        }
      }

      const [nodeStats, mining, cooldown, claim, log] = await Promise.all([
        NetrumAPI.getPollingNodeStats(nodeId),
        NetrumAPI.getMiningStatus(nodeId),
        NetrumAPI.getCooldown(nodeId),
        resolvedAddress ? NetrumAPI.getClaimStatus(resolvedAddress) : Promise.resolve(null),
        resolvedAddress ? NetrumAPI.getLiveLog(resolvedAddress) : Promise.resolve(null),
      ]);

      if (cooldown?.cooldownActive) {
        const remaining = cooldown.remainingCooldownSeconds || 0;
        setCooldownRemaining(remaining);
        setCooldownActive(true);
      }

      setNodeDetails({
        id: nodeId,
        address: resolvedAddress,
        status: nodeStats,
        mining,
        cooldown,
        claim,
        log,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('timeout') || err.message && err.message.includes('Server took too long')) {
        throw err;
      } else {
        setError(err.message || 'Failed to load node details');
        throw err;
      }
    }
  };

  const loadAddressDetails = async (nodeAddress: string) => {
    try {
      const possibleNodeIds = await findPossibleNodeIds(nodeAddress);
      
      if (possibleNodeIds.length > 0) {
        const nodeId = possibleNodeIds[0];
        await loadNodeDetails(nodeId, nodeAddress);
      } else {
        let claim = null;
        let log = null;
        const [claimResult, logResult] = await Promise.allSettled([
          NetrumAPI.getClaimStatus(nodeAddress),
          NetrumAPI.getLiveLog(nodeAddress)
        ]);
        
        if (claimResult.status === 'fulfilled') {
          claim = claimResult.value;
        }
        if (logResult.status === 'fulfilled') {
          log = logResult.value;
        }
        setNodeDetails({
          id: '',
          address: nodeAddress,
          status: null,
          mining: null,
          cooldown: null,
          claim,
          log,
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('timeout') || err.message && err.message.includes('Server took too long')) {
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
      const activeNodes = await NetrumAPI.getActiveNodes();
      let searchNodes: any[] = [];
      if (Array.isArray(activeNodes)) {
        searchNodes = activeNodes;
      } else if (activeNodes && activeNodes.nodes && Array.isArray(activeNodes.nodes)) {
        searchNodes = activeNodes.nodes;
      } else if (activeNodes && activeNodes.data && Array.isArray(activeNodes.data)) {
        searchNodes = activeNodes.data;
      }
      
      const matchedNodes = searchNodes.filter(node => {
        const nodeWallet = node.wallet || node.address;
        return nodeWallet && nodeWallet.toLowerCase() === nodeAddress.toLowerCase();
      });
      
      matchedNodes.forEach(node => {
        if (node.nodeId) {
          possibleIds.push(node.nodeId);
        }
        if (node.id && node.id !== node.nodeId) {
          possibleIds.push(node.id);
        }
      });

      if (possibleIds.length === 0) {
        const addressSnippet = nodeAddress.substring(2, 10);
        const partialMatches = searchNodes.filter(node => {
          const nodeWallet = node.wallet || node.address;
          return nodeWallet && nodeWallet.toLowerCase().includes(addressSnippet.toLowerCase());
        });
        
        partialMatches.forEach(node => {
          if (node.nodeId) {
            possibleIds.push(node.nodeId);
          }
          if (node.id && node.id !== node.nodeId) {
            possibleIds.push(node.id);
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
                {searchHistory.map((item, index) => (
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
            disabled={loading || cooldownActive}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap"
          >
            {loading ? 'Searching...' : cooldownActive ? `Cooling... ${cooldownRemaining}s` : 'Search'}
          </button>
        </div>
      </form>
      

      <div className="mt-4 space-y-2">
        {loading && (
          <div className="flex items-center px-4 py-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading data...
          </div>
        )}        
      </div>
      
      {error && (
        <div className="mt-4 px-4 py-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <div className="flex gap-2">
              {retryCount < 3 && (
                <button 
                  onClick={handleRetry}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  Retry ({retryCount}/3)
                </button>
              )}
              <button 
                onClick={() => setError(null)} 
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      

      
      {nodeDetails && (
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
                </h4>
                <div className="space-y-4">
                  {nodeDetails.id ? (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Node ID</span>
                      <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">{nodeDetails.id}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">No node ID found</div>
                  )}
                  {nodeDetails.address ? (
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Wallet Address</span>
                      <p className="font-mono text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">{nodeDetails.address}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">No wallet address available</div>
                  )}
                  
                  {nodeDetails.claim?.requirements ? (
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
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📊</span> Node Statistics
                </h4>
                <div className="space-y-4">
                  {nodeDetails.status ? (
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
                            nodeDetails.status.ttsPowerStatus === 'available' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails.status.ttsPowerStatus || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Available RAM:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status.availableRam || '0'} GB</span>
                        </div>
                        {nodeDetails.status.currentTask && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current Task:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status.currentTask}</span>
                          </div>
                        )}
                        {nodeDetails.status.currentTaskType && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Task Type:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status.currentTaskType}</span>
                          </div>
                        )}
                        {nodeDetails.status.lastTaskAssigned && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Task Assigned:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails.status.lastTaskAssigned).toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails.status.lastTaskCompleted && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Task Completed:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails.status.lastTaskCompleted).toLocaleString('en-US')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Polled:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.status.lastPolledAt ? new Date(nodeDetails.status.lastPolledAt).toLocaleString('en-US') : 'N/A'}</span>
                        </div>
                        {nodeDetails.status.hasMiningToken !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Has Mining Token:</span>
                            <span className={`text-sm font-medium ${
                              nodeDetails.status.hasMiningToken ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {nodeDetails.status.hasMiningToken ? '✅ Yes' : '❌ No'}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900 p-3 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg">
                      <span className="text-sm font-medium">Node statistics data unavailable</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">⛏️</span> Mining Status
                </h4>
                <div className="space-y-4">
                  {nodeDetails.mining ? (
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
                        {nodeDetails.mining?.miningStatus?.hoursRemaining !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Hours Left:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.mining.miningStatus.hoursRemaining || '0'}</span>
                          </div>
                        )}
                        {nodeDetails.mining?.miningStatus?.lastMiningStart && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Mining:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(nodeDetails.mining.miningStatus.lastMiningStart).toLocaleString('en-US')}
                            </span>
                          </div>
                        )}
                        {nodeDetails.mining?.requirements && (
                          <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
                            <span className="text-xs text-green-600 dark:text-green-300 block mb-1">Requirements</span>
                            <div className="text-sm text-green-800 dark:text-green-200">
                              <div>Node Status: {nodeDetails.mining.requirements.nodeStatus}</div>
                              <div>Cooldown Period: {nodeDetails.mining.requirements.cooldownPeriod}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900 p-3 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg">
                      <span className="text-sm font-medium">Mining data unavailable</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">💰</span> Claim Status
                </h4>
                <div className="space-y-4">
                  {nodeDetails.claim ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Claim</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.claim.canClaim ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails.claim.canClaim ? '✅ Available' : '❌ Unavailable'}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tokens</span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            <span className="text-xs">{nodeDetails.claim.minedTokensFormatted || '0'}</span> NPT
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Fee:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{nodeDetails.claim.claimFeeETH || '0'} ETH</span>
                        </div>
                        {nodeDetails.claim.lastClaimTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Claim:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails.claim.lastClaimTime).toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails.claim.miningSession && (
                          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                            <span className="text-xs text-blue-600 dark:text-blue-300 block mb-2">Mining Session</span>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-700 dark:text-blue-200">Status:</span>
                                <span className={`text-sm font-medium ${
                                  nodeDetails.claim.miningSession.isComplete ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                  {nodeDetails.claim.miningSession.isComplete ? '✅ Complete' : '⏳ In Progress'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-700 dark:text-blue-200">Start Time:</span>
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{new Date(nodeDetails.claim.miningSession.startTime * 1000).toLocaleString('en-US')}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-blue-700 dark:text-blue-200">Elapsed Time:</span>
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{Math.floor(nodeDetails.claim.miningSession.elapsedTime / 3600)}h {Math.floor((nodeDetails.claim.miningSession.elapsedTime % 3600) / 60)}m</span>
                              </div>
                              {nodeDetails.claim.miningSession.remainingTime > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-blue-700 dark:text-blue-200">Remaining Time:</span>
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{nodeDetails.claim.miningSession.formattedRemainingTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900 p-3 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg">
                      <span className="text-sm font-medium">Claim data unavailable</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">⏳</span> Cooldown Status
                </h4>
                <div className="space-y-4">
                  {nodeDetails.cooldown ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Status</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.cooldown?.cooldownActive ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {nodeDetails.cooldown?.cooldownActive ? '⏳ Active' : '✅ Ready'}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Mining</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.cooldown?.canStartMining ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails.cooldown?.canStartMining ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {nodeDetails.cooldown?.lastMiningStart && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Mining:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(nodeDetails.cooldown.lastMiningStart).toLocaleString('en-US')}
                            </span>
                          </div>
                        )}
                        {nodeDetails.cooldown?.cooldownEndedAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Cooldown Ends:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(nodeDetails.cooldown.cooldownEndedAt).toLocaleString('en-US')}
                            </span>
                          </div>
                        )}
                        {nodeDetails.cooldown?.message && (
                          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
                            <span className="text-xs text-blue-600 dark:text-blue-300 block mb-1">Message</span>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{nodeDetails.cooldown.message}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900 p-3 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg">
                      <span className="text-sm font-medium">Cooldown data unavailable</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📜</span> Log Status
                </h4>
                <div className="space-y-4">
                  {nodeDetails.log ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Logs</span>
                          <span className={`text-sm font-bold ${
                            nodeDetails.log.canCheck ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {nodeDetails.log.canCheck ? '✅ Available' : '❌ Unavailable'}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Cooldown</span>
                          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{nodeDetails.log.remainingCooldownSeconds || '0'}s</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {nodeDetails.log.lastCheckTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Check:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails.log.lastCheckTime).toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails.log.nextCheckTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Next Check:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(nodeDetails.log.nextCheckTime).toLocaleString('en-US')}</span>
                          </div>
                        )}
                        {nodeDetails.log.cooldownDuration && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Cooldown:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.floor(nodeDetails.log.cooldownDuration / 60000)} min</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900 p-3 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg">
                      <span className="text-sm font-medium">Log data unavailable</span>
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