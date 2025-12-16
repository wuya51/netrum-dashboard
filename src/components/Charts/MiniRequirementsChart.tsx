import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs p-2 shadow-sm">
        <p className="text-gray-900 dark:text-gray-100">
          {label}: {payload[0].value} {dataItem.unit}
        </p>
      </div>
    );
  }
  return null;
};

interface MiniRequirementsChartProps {
  requirements: {
    RAM: number;
    CORES: number;
    STORAGE: number;
    DOWNLOAD_SPEED: number;
    UPLOAD_SPEED: number;
  };
}

const getBarColor = (name: string) => {
  const colorMap: { [key: string]: string } = {
    'RAM': '#3b82f6', 
    'CPU Cores': '#10b981',
    'Storage': '#f59e0b',
    'Download Speed': '#ef4444',
    'Upload Speed': '#8b5cf6'
  };
  return colorMap[name] || '#6b7280';
};

export default function MiniRequirementsChart({ requirements }: MiniRequirementsChartProps) {
  if (!requirements) return null;

  const chartData = [
    { name: 'RAM', value: requirements.RAM, unit: 'GB', max: Math.max(requirements.RAM, 16), color: '#3b82f6' },
    { name: 'CPU Cores', value: requirements.CORES, unit: 'Cores', max: Math.max(requirements.CORES, 8), color: '#10b981' },
    { name: 'Storage', value: requirements.STORAGE, unit: 'GB', max: Math.max(requirements.STORAGE, 500), color: '#f59e0b' },
    { name: 'Download Speed', value: requirements.DOWNLOAD_SPEED, unit: 'Mbps', max: Math.max(requirements.DOWNLOAD_SPEED, 100), color: '#ef4444' },
    { name: 'Upload Speed', value: requirements.UPLOAD_SPEED, unit: 'Mbps', max: Math.max(requirements.UPLOAD_SPEED, 50), color: '#8b5cf6' },
  ];

  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const dataItem = chartData.find(item => item.name === payload.value);
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={4} 
          textAnchor="end" 
          fill={dataItem?.color || '#374151'}
          fontSize={10}
          fontWeight={700}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-full focus:outline-none focus:ring-0">
      <ResponsiveContainer width="100%" height="100%" className="focus:outline-none focus:ring-0">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          className="m-2.5"
          margin={{ top: 5, right: 40, bottom: 5, left: 30 }}
        >
          <XAxis 
            type="number" 
            domain={[0, 'dataMax']}
            className="text-[9px] text-gray-700 dark:text-gray-300"
            tick={{ fontSize: 9, fill: 'currentColor' }}
            axisLine={{ stroke: '#6b7280', strokeWidth: 0.5 }}
            tickLine={{ stroke: '#6b7280', strokeWidth: 0.5 }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            className="text-[10px] font-medium w-[55px]"
            tick={<CustomYAxisTick />}
            axisLine={{ stroke: '#6b7280', strokeWidth: 0.5 }}
            tickLine={{ stroke: '#6b7280', strokeWidth: 0.5 }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-0"
            isAnimationActive={false}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            barSize={16}
            isAnimationActive={false}
            activeBar={false}
            activeIndex={-1}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="none"
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                className="hover:opacity-80 transition-opacity duration-200"
              />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              formatter={(value) => {
                const dataItem = chartData.find(item => item.value === value);
                return `${value} ${dataItem?.unit || ''}`;
              }}
              className="text-[10px] font-bold fill-gray-800 dark:fill-gray-100"
              offset={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}