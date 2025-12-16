import { useDashboardStore } from '../store/useDashboardStore';

interface ExportButtonProps {
  activeNodesData?: any;
}

export default function ExportButton({ activeNodesData }: ExportButtonProps) {
  const { networkStats, activeNodes: storeActiveNodes } = useDashboardStore();
  
  const activeNodes = activeNodesData || storeActiveNodes;

  const exportToCSV = () => {

    const nodesArray = getExportableNodes();
    if (!nodesArray || nodesArray.length === 0) {

      alert('No data available for export');
      return;
    }
    
    const headers = ['Address', 'Node ID', 'Status', 'Task Count', 'Last Polled'];
    const csvContent = [
      headers.join(','),
      ...nodesArray.map(node => [
        node.address || node.walletAddress || node.wallet || '',
        node.id || node.nodeId || '',
        node.status || node.nodeStatus || '',
        node.taskCount || 0,
        node.lastPolledAt || node.lastUpdated || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'netrum-nodes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {


    const nodesArray = getExportableNodes();
    if (!nodesArray || nodesArray.length === 0) {

      alert('No data available for export');
      return;
    }
    
    const data = {
      networkStats,
      activeNodes: nodesArray,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'netrum-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getExportableNodes = () => {
    console.log('Getting exportable nodes:', activeNodes);
    
    if (!activeNodes) return null;

    if (Array.isArray(activeNodes)) {
      return activeNodes;
    } else if (activeNodes.nodes && Array.isArray(activeNodes.nodes)) {
      return activeNodes.nodes;
    } else if (activeNodes.success && Array.isArray(activeNodes.nodes)) {
      return activeNodes.nodes;
    } else if (activeNodes.data && Array.isArray(activeNodes.data)) {
      return activeNodes.data;
    }
    
    return null;
  };

  const hasExportableData = () => {
    const nodesArray = getExportableNodes();
    return nodesArray && nodesArray.length > 0;
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={exportToCSV} 
        disabled={!hasExportableData()}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        📊 Export CSV
      </button>
      <button 
        onClick={exportToJSON} 
        disabled={!hasExportableData()}
        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        📄 Export JSON
      </button>
    </div>
  );
}