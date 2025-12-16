
import { create } from 'zustand';
import { NetrumAPI } from '../api/netrumApi';

type NodeData = {
  id: string;
  address?: string;
  status: any;
  mining: any;
  cooldown: any;
  claim: any;
  log: any;
};

type DashboardState = {
  networkStats: any | null;
  activeNodes: any[] | null;
  selectedNode: NodeData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  loadNetworkOverview: () => Promise<void>;
  loadNodeDetails: (nodeId: string, nodeAddress?: string) => Promise<void>;
  clearError: () => void;
  getCachedActiveNodes: () => any[];
  findNodeById: (nodeId: string) => any | null;
  findNodeByAddress: (address: string) => any | null;
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  networkStats: null,
  activeNodes: null,
  selectedNode: null,
  loading: false,
  error: null,
  lastUpdated: null,

  clearError: () => set({ error: null }),

  getCachedActiveNodes: () => {
    const state = get();
    return state.activeNodes || [];
  },

  findNodeById: (nodeId: string) => {
    const nodes = get().activeNodes || [];
    return nodes.find(node => 
      (node.nodeId && node.nodeId.toLowerCase() === nodeId.toLowerCase()) ||
      (node.id && node.id.toLowerCase() === nodeId.toLowerCase())
    ) || null;
  },

  findNodeByAddress: (address: string) => {
    const nodes = get().activeNodes || [];
    return nodes.find(node => 
      (node.wallet && node.wallet.toLowerCase() === address.toLowerCase()) ||
      (node.address && node.address.toLowerCase() === address.toLowerCase())
    ) || null;
  },

  loadNetworkOverview: async () => {
    set({ loading: true, error: null });
    try {
      const [stats, nodes] = await Promise.all([
        NetrumAPI.getNetworkStats(),
        NetrumAPI.getActiveNodes(),
      ]);
      set({ networkStats: stats, activeNodes: nodes, loading: false, lastUpdated: new Date() });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load network data', loading: false });
    }
  },

  loadNodeDetails: async (nodeId: string, nodeAddress?: string) => {
    set({ loading: true, error: null, selectedNode: null });
    
    try {
      let finalNodeId = nodeId;
      let finalAddress = nodeAddress;
      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(nodeId);
      
      if (isAddress) {
        finalAddress = nodeId;
        finalNodeId = nodeAddress || '';
      }
      if (finalNodeId && !finalAddress) {
        const cachedNode = get().findNodeById(finalNodeId);
        if (cachedNode) {
          finalAddress = cachedNode.wallet || cachedNode.address;

        } else {
          try {
            const activeNodes = await NetrumAPI.getActiveNodes();
            const nodes = Array.isArray(activeNodes) ? activeNodes : 
                         (activeNodes?.nodes) ? activeNodes.nodes : [];
            
            const matchedNode = nodes.find(node => 
              (node.nodeId && node.nodeId.toLowerCase() === finalNodeId.toLowerCase()) ||
              (node.id && node.id.toLowerCase() === finalNodeId.toLowerCase())
            );
            
            if (matchedNode) {
              finalAddress = matchedNode.wallet || matchedNode.address || '';

            }
          } catch (err) {

          }
        }
      }
      if (finalAddress && !finalNodeId) {
        const cachedNode = get().findNodeByAddress(finalAddress);
        if (cachedNode) {
          finalNodeId = cachedNode.nodeId || cachedNode.id;

        } else {
          try {
            const activeNodes = await NetrumAPI.getActiveNodes();
            const nodes = Array.isArray(activeNodes) ? activeNodes : 
                         (activeNodes?.nodes) ? activeNodes.nodes : [];
            
            const matchedNode = nodes.find(node => 
              (node.wallet && node.wallet.toLowerCase() === finalAddress!.toLowerCase()) ||
              (node.address && node.address.toLowerCase() === finalAddress!.toLowerCase())
            );
            
            if (matchedNode) {
              finalNodeId = matchedNode.nodeId || matchedNode.id || '';

            }
          } catch (err) {

          }
        }
      }
      const promises = [];
      if (finalNodeId) {
        promises.push(
          NetrumAPI.getNodeStatus(finalNodeId).catch(err => {

            return null;
          }),
          NetrumAPI.getMiningStatus(finalNodeId).catch(err => {

            return null;
          }),
          NetrumAPI.getCooldown(finalNodeId).catch(err => {

            return null;
          })
        );
      } else {
        promises.push(Promise.resolve(null), Promise.resolve(null), Promise.resolve(null));
      }
      if (finalAddress) {
        promises.push(
          NetrumAPI.getClaimStatus(finalAddress).catch(err => {
            console.warn('Failed to load claim status:', err);
            return null;
          }),
          NetrumAPI.getLiveLog(finalAddress).catch(err => {
            console.warn('Failed to load live log:', err);
            return null;
          })
        );
      } else {
 
        promises.push(Promise.resolve(null), Promise.resolve(null));
      }

      const [status, mining, cooldown, claim, log] = await Promise.all(promises);
      set({
        selectedNode: {
          id: finalNodeId || '',
          address: finalAddress || '',
          status,
          mining,
          cooldown,
          claim,
          log,
        },
        loading: false,
        lastUpdated: new Date(),
        error: null
      });
      
    } catch (err: any) {
      console.error('Error loading node details:', err);
      set({ 
        error: err.message || 'Failed to load node details',
        loading: false,
        selectedNode: null
      });
    }
  },
}));