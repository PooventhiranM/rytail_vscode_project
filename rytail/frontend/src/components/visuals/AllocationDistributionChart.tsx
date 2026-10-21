import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onFilterByQty?: (qty: number) => void;
  selectedQty?: number | null;
}

export const AllocationDistributionChart: React.FC<Props> = ({ onFilterByQty, selectedQty }) => {
  const { isDark } = useTheme();

  const data = [
    { qty: 10, qtyLabel: '10 units', count: 39, pct: '20.2%' },
    { qty: 11, qtyLabel: '11 units', count: 33, pct: '17.1%' },
    { qty: 12, qtyLabel: '12 units', count: 27, pct: '14.0%' },
    { qty: 13, qtyLabel: '13 units', count: 78, pct: '40.4%' },
    { qty: 14, qtyLabel: '14 units', count: 8, pct: '4.1%' },
    { qty: 15, qtyLabel: '15 units', count: 8, pct: '4.1%' },
  ];

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 mb-1">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">Store Allocation Distribution Histogram</h3>
          <p className="text-[11px] text-slate-500 font-medium">Click any bar to filter store list by total allocated quantity</p>
        </div>
        {selectedQty && (
          <button 
            onClick={() => onFilterByQty && onFilterByQty(0)}
            className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 hover:underline"
          >
            Clear Filter (Qty {selectedQty})
          </button>
        )}
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="qtyLabel" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} />
            <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                borderColor: isDark ? '#334155' : '#cbd5e1',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              formatter={(val: any) => [`${val} Stores`, 'Frequency']}
            />
            <Bar 
              dataKey="count" 
              radius={[6, 6, 0, 0]}
              onClick={(entry: any) => onFilterByQty && onFilterByQty(entry.qty)}
              cursor="pointer"
            >
              {data.map((entry) => (
                <Cell 
                  key={`cell-${entry.qty}`} 
                  fill={selectedQty === entry.qty ? '#4f46e5' : (entry.qty === 13 ? '#3b82f6' : '#818cf8')} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
