import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export const ReplenishmentPriorityScatter: React.FC = () => {
  const { isDark } = useTheme();

  const data = [
    { store: 'E0100', wos: 0.8, ros: 3.2, priority: 'Critical', stock: 12, target: 27 },
    { store: 'E0105', wos: 7.2, ros: 0.4, priority: 'Low', stock: 25, target: 8 },
    { store: 'E0108', wos: 1.2, ros: 2.8, priority: 'High', stock: 15, target: 28 },
    { store: 'E0112', wos: 0.5, ros: 4.1, priority: 'Critical', stock: 5, target: 30 },
    { store: 'E0115', wos: 3.5, ros: 1.8, priority: 'Medium', stock: 20, target: 22 },
    { store: 'E0120', wos: 1.8, ros: 2.5, priority: 'High', stock: 14, target: 25 },
    { store: 'E0125', wos: 0.0, ros: 3.8, priority: 'Critical', stock: 0, target: 26 },
    { store: 'E0130', wos: 4.5, ros: 1.2, priority: 'Low', stock: 22, target: 15 },
  ];

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 mb-1">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">Replenishment Priority Matrix (WOS vs ROS)</h3>
          <p className="text-[11px] text-slate-500 font-medium">Quadrant 1 (High Velocity / Low Stock Cover) indicates critical replenishment needs</p>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          4 Quadrants
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis type="number" dataKey="wos" name="Stock Cover (WOS)" unit="w" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
            <YAxis type="number" dataKey="ros" name="Sales Velocity (ROS)" unit="u/d" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
            <ReferenceLine x={2.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "WOS < 2w", fill: "#ef4444", fontSize: 10 }} />
            <ReferenceLine y={2.0} stroke="#3b82f6" strokeDasharray="3 3" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                borderColor: isDark ? '#334155' : '#cbd5e1',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              formatter={(val: any, name: any) => [val, name || '']}
            />
            <Scatter name="Stores" data={data} fill="#ef4444" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
