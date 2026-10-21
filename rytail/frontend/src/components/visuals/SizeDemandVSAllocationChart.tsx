import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export const SizeDemandVSAllocationChart: React.FC = () => {
  const { isDark } = useTheme();

  const data = [
    { size: 'S', DemandPct: 10.96, AllocatedPct: 11.2 },
    { size: 'M', DemandPct: 24.98, AllocatedPct: 25.1 },
    { size: 'L', DemandPct: 33.67, AllocatedPct: 33.5 },
    { size: 'XL', DemandPct: 21.04, AllocatedPct: 20.8 },
    { size: 'XXL', DemandPct: 9.36, AllocatedPct: 9.4 },
  ];

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 mb-1">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">Size Curve: Demand % vs Allocation %</h3>
          <p className="text-[11px] text-slate-500 font-medium">Validation of historical size curve vs final pool size split</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Tight Alignment
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="size" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} unit="%" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                borderColor: isDark ? '#334155' : '#cbd5e1',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              formatter={(val: any) => [`${val}%`]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
            <Bar dataKey="DemandPct" name="Historical Demand %" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="AllocatedPct" name="Allocated Size %" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
