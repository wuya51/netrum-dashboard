import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface NodeDetailsChartProps {
  nodeStatus: string;
  taskCount: number;
  availableRam: number;
  isMining: boolean;
  totalRewards: number;
  claimableAmount: number;
  inCooldown: boolean;
}

const NodeDetailsChart: React.FC<NodeDetailsChartProps> = ({
  nodeStatus,
  taskCount,
  availableRam,
  isMining,
  totalRewards,
  claimableAmount,
  inCooldown
}) => {
  const resourceData = [
    { name: 'Tasks', value: taskCount, max: 100, color: '#3b82f6' },
    { name: 'RAM (GB)', value: availableRam, max: 32, color: '#10b981' }
  ];
  const statusData = [
    { name: 'Active', value: nodeStatus === 'Active' ? 1 : 0, color: '#10b981' },
    { name: 'Mining', value: isMining ? 1 : 0, color: '#f59e0b' },
    { name: 'Cooldown', value: inCooldown ? 1 : 0, color: '#ef4444' }
  ];



  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs p-2 shadow-sm">
          <p className="text-gray-900 dark:text-gray-100">{label}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Resource Usage</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={resourceData} layout="vertical">
            <XAxis type="number" domain={[0, 'dataMax']} />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {resourceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔍 Status Overview</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={statusData.filter(item => item.value > 0)}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {statusData.filter(item => item.value > 0).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="md:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💰 Rewards Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">{totalRewards} NPT</div>
            <div className="text-sm text-purple-500 dark:text-purple-400">Total Rewards</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-cyan-100 to-cyan-200 dark:from-cyan-800 dark:to-cyan-900 rounded-lg">
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-300">{claimableAmount} NPT</div>
            <div className="text-sm text-cyan-500 dark:text-cyan-400">Claimable</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsChart;