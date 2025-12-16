
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MiniNodeStatusChartProps {
  activeNodes: number;
  inactiveNodes: number;
  totalNodes: number;
}

const COLORS = ['#10b981', '#f59e0b'];

export default function MiniNodeStatusChart({ activeNodes, inactiveNodes, totalNodes }: MiniNodeStatusChartProps) {
  const data = [
    { name: 'Active', value: activeNodes },
    { name: 'Inactive', value: inactiveNodes },
  ];

  const activePercentage = totalNodes > 0 ? Math.round((activeNodes / totalNodes) * 100) : 0;

  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-300 dark:border-blue-600 rounded-lg h-full w-full">
      <div className="flex-shrink-0">
        <ResponsiveContainer width={70} height={70}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={30}
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="text-lg font-bold text-gray-900 dark:text-white">{totalNodes}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Total Nodes</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{activePercentage}% Active</div>
      </div>
    </div>
  );
}