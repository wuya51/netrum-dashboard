import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDashboardStore } from '../store/useDashboardStore';
import CountdownTimer from './CountdownTimer';

export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { selectedNode, loadNodeDetails, loading, error, clearError } = useDashboardStore();
  const [addressFromStore, setAddressFromStore] = useState<string>('');
  const [displayNodeId, setDisplayNodeId] = useState<string>('');
  const isAddress = nodeId ? /^0x[a-fA-F0-9]{40}$/.test(nodeId) : false;

  useEffect(() => {
    if (nodeId) {
      if (isAddress) {
        loadNodeDetails('', nodeId);
      } else {
        loadNodeDetails(nodeId, '');
      }
    }
  }, [nodeId, isAddress, loadNodeDetails]);

  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.address) {
        setAddressFromStore(selectedNode.address);
      }
      if (selectedNode.id) {
        setDisplayNodeId(selectedNode.id);
      }
    }
  }, [selectedNode]);
  const displayAddress = addressFromStore || (isAddress ? nodeId : 'N/A');
  const finalNodeId = displayNodeId || (!isAddress ? nodeId : 'N/A');
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getProperty = (obj: any, key: string, defaultValue: any = 'N/A') => {
    return obj && obj[key] !== undefined ? obj[key] : defaultValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading node details...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {isAddress ? `Searching by address: ${nodeId?.substring(0, 10)}...` : `Searching by Node ID: ${nodeId}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <div className="mt-4 flex gap-3">
              <button 
                onClick={clearError}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">No Data Found</h3>
            <p className="text-yellow-700 dark:text-yellow-200">
              {isAddress 
                ? `No node found for address: ${nodeId?.substring(0, 10)}...` 
                : `No node found with ID: ${nodeId}`}
            </p>
            <button 
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { status, mining, cooldown, claim, log } = selectedNode;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Node Details
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Node ID</h4>
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {finalNodeId || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Wallet Address</h4>
                  <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                    {displayAddress || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <CountdownTimer />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">📊</span> Node Status
            </h3>
            {status ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getProperty(status, 'nodeStatus') === 'Active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {getProperty(status, 'nodeStatus', 'Unknown')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Task Count:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Number(getProperty(status, 'taskCount', 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Available RAM:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getProperty(status, 'availableRam', 0)} GB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Polled:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(getProperty(status, 'lastPolledAt'))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No status data available</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">⛏️</span> Mining Status
            </h3>
            {mining ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Active:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getProperty(mining, 'is_mining') || getProperty(mining?.miningStatus, 'canStartMining')
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {getProperty(mining, 'is_mining') || getProperty(mining?.miningStatus, 'canStartMining') ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Mined:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(getProperty(mining, 'last_mining_time') || getProperty(mining?.miningStatus, 'lastMiningStart'))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Rewards:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getProperty(mining, 'total_rewards', 0)} NPT
                  </span>
                </div>
                {getProperty(mining?.miningStatus, 'hoursRemaining') && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Hours Left:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getProperty(mining?.miningStatus, 'hoursRemaining')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No mining data available</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">❄️</span> Cooldown
            </h3>
            {cooldown ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getProperty(cooldown, 'in_cooldown') || getProperty(cooldown, 'cooldownActive')
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {getProperty(cooldown, 'in_cooldown') || getProperty(cooldown, 'cooldownActive') ? '⏳ In Cooldown' : '✅ Ready'}
                  </span>
                </div>
                {getProperty(cooldown, 'next_available_time') && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Next Available:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatTime(getProperty(cooldown, 'next_available_time'))}
                    </span>
                  </div>
                )}
                {getProperty(cooldown, 'cooldownEndedAt') && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Cooldown Ends:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatTime(getProperty(cooldown, 'cooldownEndedAt'))}
                    </span>
                  </div>
                )}
                {getProperty(cooldown, 'remaining_seconds') && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getProperty(cooldown, 'remaining_seconds')} seconds
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No cooldown data available</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🎁</span> Claim Status
            </h3>
            {claim ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Claimable:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {getProperty(claim, 'claimable_amount', 0)} NPT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Can Claim:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getProperty(claim, 'canClaim')
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {getProperty(claim, 'canClaim') ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Claim:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(getProperty(claim, 'last_claim_time'))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Claimed:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getProperty(claim, 'total_claimed', 0)} NPT
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No claim data available</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">📜</span> Live Log
            </h3>
            {log ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Can Check:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getProperty(log, 'canCheck')
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {getProperty(log, 'canCheck') ? '✅ Available' : '❌ Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatTime(getProperty(log, 'lastCheckTime'))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Cooldown:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getProperty(log, 'remainingCooldownSeconds', 0)} seconds
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">No log data available</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl shadow-lg p-6 border border-blue-200 dark:border-blue-700 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">⚡</span> Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center">
                <span className="mr-2">🔄</span> Refresh Data
              </button>
              <button className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center">
                <span className="mr-2">⛏️</span> Start Mining
              </button>
              <button className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center">
                <span className="mr-2">💰</span> Claim Rewards
              </button>
            </div>
          </div>
        </div>

        {log && log.logs && Array.isArray(log.logs) && log.logs.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">📋</span> Live Log Entries (Last 10)
              </h3>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                {log.logs.length} entries
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {log.logs.slice(-10).join('\n')}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8">
          <details className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <summary className="px-6 py-4 cursor-pointer text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">🔍</span> Raw Data (Debug View)
              </span>
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Click to expand
              </span>
            </summary>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                {JSON.stringify(selectedNode, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}