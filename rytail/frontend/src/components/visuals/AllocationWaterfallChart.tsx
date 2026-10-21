import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface AllocationWaterfallChartProps {
  totalStock?: number;
  poolUnits?: number;
  baseUnits?: number;
  surplusUnits?: number;
  finalUnits?: number;
  onStageClick?: (stage: string) => void;
}

export const AllocationWaterfallChart: React.FC<AllocationWaterfallChartProps> = ({
  totalStock = 4435,
  poolUnits = 2323,
  baseUnits = 1930,
  surplusUnits = 393,
  finalUnits = 2323,
  onStageClick
}) => {
  const { isDark } = useTheme();

  const data = [
    { name: 'Warehouse Stock', value: totalStock, color: '#3b82f6', stage: 'STOCK' },
    { name: 'Allocation Pool (52.4%)', value: poolUnits, color: '#06b6d4', stage: 'POOL' },
    { name: 'Base Alloc (2u/size)', value: baseUnits, color: '#6366f1', stage: 'BASE' },
    { name: 'Surplus Distribution', value: surplusUnits, color: '#f59e0b', stage: 'SURPLUS' },
    { name: 'Final Allocated Total', value: finalUnits, color: '#10b981', stage: 'FINAL' },
  ];

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 mb-2">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">First Allocation Waterfall Flow</h3>
          <p className="text-[11px] text-slate-500 font-medium">Stage-by-stage inventory breakdown from warehouse stock to final store allocation</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Deterministic Math
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} 
              interval={0}
            />
            <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                borderColor: isDark ? '#334155' : '#cbd5e1',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }} 
              formatter={(val: any) => [`${val?.toLocaleString() || 0} units`, 'Quantity']}
            />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
              onClick={(entry: any) => onStageClick && onStageClick(entry.stage)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold border-t border-slate-200/50 pt-3">
        <div>
          <span className="text-slate-400 block font-normal">Step 1</span>
          <span className="text-blue-600 font-extrabold">{totalStock} u</span>
        </div>
        <div>
          <span className="text-slate-400 block font-normal">Step 2 (Pool)</span>
          <span className="text-cyan-600 font-extrabold">{poolUnits} u</span>
        </div>
        <div>
          <span className="text-slate-400 block font-normal">Step 3 (Base)</span>
          <span className="text-indigo-600 font-extrabold">{baseUnits} u</span>
        </div>
        <div>
          <span className="text-slate-400 block font-normal">Step 4 (Surplus)</span>
          <span className="text-amber-600 font-extrabold">+{surplusUnits} u</span>
        </div>
        <div>
          <span className="text-slate-400 block font-normal">Step 5 (Final)</span>
          <span className="text-emerald-600 font-extrabold">{finalUnits} u</span>
        </div>
      </div>
    </div>
  );
};
