
import { useState, useEffect, useRef } from 'react';
import { NetrumAPI } from '../api/netrumApi';
import ExportButton from './ExportButton';

interface ActiveNodesDisplayProps {
  result: {
    success: boolean;
    message: string;
    nodes?: any[];
    data?: any[];
    sample?: any[];
    count?: number;
  };
  onClear: () => void;
  retryCount?: number;
  onNodeClick: (address: string) => void;
  cooldownActive: boolean;
}

const ActiveNodesDisplay: React.FC<ActiveNodesDisplayProps> = ({ result, onClear, retryCount = 0, onNodeClick, cooldownActive }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showPopup, setShowPopup] = useState(false);
  const [nodesPerPage, setNodesPerPage] = useState(25);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const popupRef = useRef<HTMLDivElement>(null);
  const nodes = result.nodes || result.data?.nodes || result.data || result.sample || [];

  
  const totalPages = Math.ceil(nodes.length / nodesPerPage);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const startIndex = (currentPage - 1) * nodesPerPage;
  const endIndex = startIndex + nodesPerPage;
  const currentNodes = nodes.slice(startIndex, endIndex);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };
  
  const getAdaptiveAddress = (address: string) => {
    if (!address) return '';
    const isSmallScreen = windowWidth < 768;
    if (isSmallScreen && address.length > 15) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  const getAdaptiveNodeId = (nodeId: string) => {
    if (!nodeId) return '';
    const isSmallScreen = windowWidth < 768;
    if (isSmallScreen && nodeId.length > 20) {
      return `${nodeId.substring(0, 8)}...${nodeId.substring(nodeId.length - 6)}`;
    }
    return nodeId;
  };
  
  if (!result.success) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Active Nodes</h3>
          <button 
            onClick={onClear}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
          >
            Retry Now
          </button>
        </div>
        
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded p-3 text-red-700 dark:text-red-300 mb-4">
          ❌ {result.message}
        </div>
        
        <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {retryCount < 5 ? `Auto-retrying in a few seconds... (Attempt ${retryCount + 1}/5)` : 'Maximum retry attempts reached'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Active Nodes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Showing {startIndex + 1}-{Math.min(endIndex, nodes.length)} of {nodes.length} nodes
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={nodes} />
        </div>
      </div>
      
      <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded p-3 text-green-700 dark:text-green-300 mb-4">
        ✅ {result.count || nodes.length} nodes activated
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
              <th className="p-2 text-left text-gray-900 dark:text-white font-medium">#</th>
              <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Address</th>
              <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Node ID</th>
              <th className="p-2 text-left text-gray-900 dark:text-white font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentNodes.map((node, index) => (
              <tr 
                key={node.nodeId || node.id || node._id || index} 
                className={`hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800 dark:hover:to-blue-900 transition-all duration-300 border-b border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 ${cooldownActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                onClick={() => {
                  const address = node.wallet || node.address;
                  if (address && !cooldownActive) {
                    onNodeClick(address);
                  }
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredNode(node);
                  setPopupPosition({
                    x: rect.right + 10,
                    y: rect.top
                  });
                  setShowPopup(true);
                }}
                onMouseLeave={(e) => {
                  const relatedTarget = e.relatedTarget as HTMLElement;
 const isLeavingToPopup = relatedTarget && relatedTarget.nodeType === Node.ELEMENT_NODE 
                  ? popupRef.current?.contains(relatedTarget)
                  : false;
                  
                  if (!isLeavingToPopup) {
                    setShowPopup(false);
                    setHoveredNode(null);
                  }
                }}
              >
                <td className="p-2 text-center text-gray-900 dark:text-white">{startIndex + index + 1}</td>
                <td className="p-2 font-mono text-gray-900 dark:text-white" title={node.wallet || node.address}>
                  {getAdaptiveAddress(node.wallet || node.address)}
                </td>
                <td className="p-2 text-gray-900 dark:text-white" title={node.nodeId || node.id}>
                  {getAdaptiveNodeId(node.nodeId || node.id)}
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    node.nodeStatus === 'Active' 
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {node.nodeStatus || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showPopup && hoveredNode && (
        <div 
          ref={popupRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 w-80 max-w-[calc(100vw-2rem)] transition-opacity duration-200 pointer-events-auto"
          style={{
            left: `${Math.min(popupPosition.x, windowWidth - 330)}px`,
            top: `${popupPosition.y}px`,
          }}
          onMouseLeave={(e) => {
            const relatedTarget = e.relatedTarget as HTMLElement;
            const isLeavingToRow = (e.currentTarget.parentElement?.querySelector('tbody') as HTMLElement)?.contains(relatedTarget);
            
            if (!isLeavingToRow) {
              setShowPopup(false);
              setHoveredNode(null);
            }
          }}
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Node Details</h4>
          <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Wallet Address:</div>
              <div className="font-mono text-gray-900 dark:text-white break-all text-xs">
                {hoveredNode.wallet || hoveredNode.address || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400 mb-1">Node ID:</div>
              <div className="text-gray-900 dark:text-white break-words text-xs">
                {hoveredNode.nodeId || hoveredNode.id || 'N/A'}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                hoveredNode.nodeStatus === 'Active' 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
              }`}>
                {hoveredNode.nodeStatus || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="text-gray-900 dark:text-white">{hoveredNode.type || 'Lite'}</span>
            </div>
            {hoveredNode.createdAt && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(hoveredNode.createdAt)}</span>
              </div>
            )}
            {hoveredNode.lastUpdated && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(hoveredNode.lastUpdated)}</span>
              </div>
            )}
            {hoveredNode.lastMiningStart && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Mining:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(hoveredNode.lastMiningStart)}</span>
              </div>
            )}
            {hoveredNode.lastClaimTime && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Claim:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(hoveredNode.lastClaimTime)}</span>
              </div>
            )}
            {hoveredNode.txHash && (
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Transaction Hash:</div>
                <div className="font-mono text-gray-900 dark:text-white break-all text-xs">
                  {hoveredNode.txHash}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {nodes.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
            <select 
              value={nodesPerPage}
              onChange={(e) => {
                setNodesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition-colors"
              title="Previous Page"
            >
              «
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80 transition-colors"
              title="Next Page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ActiveNodesSectionProps {
  onNodeClick: (address: string) => void;
  cooldownActive: boolean;
}

export default function ActiveNodesSection({ onNodeClick, cooldownActive }: ActiveNodesSectionProps) {
  const [activeNodesResult, setActiveNodesResult] = useState<any>(null);
  const [activeNodesLoading, setActiveNodesLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const loadActiveNodes = async () => {

    setActiveNodesLoading(true);
    try {
      const result = await NetrumAPI.getActiveNodes();
      let nodes: any[] = [];
      let success = false;
      let message = '';
      
      if (Array.isArray(result)) {
        nodes = result;
        success = true;
        message = `${nodes.length} nodes activated`;
      } else if (result && typeof result === 'object') {
        if (result.nodes && Array.isArray(result.nodes)) {
          nodes = result.nodes;
          success = true;
          message = `${nodes.length} nodes activated`;
        } else if (result.data && Array.isArray(result.data)) {
          nodes = result.data;
          success = true;
          message = `${nodes.length} nodes activated`;
        } else {
          success = false;
          message = 'API returned invalid data format';
        }
      } else {
        success = false;
        message = 'API returned null or unexpected data';
      }
      
      setActiveNodesResult({
        success,
        message,
        nodes,
        count: nodes.length,
        data: nodes
      });
      setRetryCount(0);
    } catch (error: any) {

      setActiveNodesResult({
        success: false,
        message: error.message || 'Failed to load active nodes',
        nodes: [],
        data: []
      });
    } finally {
      setActiveNodesLoading(false);
    }
  };

  useEffect(() => {
    loadActiveNodes();
  }, []);

  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    if (activeNodesResult && !activeNodesResult.success && retryCount < 5) {
      const retryDelay = Math.min(3000 * (retryCount + 1), 15000);
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadActiveNodes();
      }, retryDelay);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [activeNodesResult, retryCount]);

  const handleClear = () => {
    setRetryCount(0);
    loadActiveNodes();
  };

  if (activeNodesLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Active Nodes</h3>
        </div>
        <div className="text-center p-8 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Loading active nodes...
        </div>
      </div>
    );
  }

  return (
    <ActiveNodesDisplay 
      result={activeNodesResult || { success: false, message: 'No data available', nodes: [] }}
      onClear={handleClear}
      retryCount={retryCount}
      onNodeClick={onNodeClick}
      cooldownActive={cooldownActive}
    />
  );
}