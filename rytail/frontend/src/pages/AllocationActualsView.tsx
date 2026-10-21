import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { Award, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export const AllocationActualsView: React.FC = () => {
  const { isDark } = useTheme();

  const comparisonData = [
    { store: 'E0100', Allocated: 13, Sold: 9, Remaining: 4, SellThrough: 69.2 },
    { store: 'E0101', Allocated: 12, Sold: 8, Remaining: 4, SellThrough: 66.7 },
    { store: 'E0102', Allocated: 11, Sold: 7, Remaining: 4, SellThrough: 63.6 },
    { store: 'E0103', Allocated: 11, Sold: 8, Remaining: 3, SellThrough: 72.7 },
    { store: 'E0104', Allocated: 13, Sold: 10, Remaining: 3, SellThrough: 76.9 },
    { store: 'E0105', Allocated: 13, Sold: 11, Remaining: 2, SellThrough: 84.6 },
  ];

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`p-6 rounded-3xl border flex items-center justify-between shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Feedback Loop</span>
          <h1 className="text-2xl font-black mt-1">Allocation vs Actual Performance & Accuracy</h1>
          <p className="text-xs text-slate-500 font-medium">Post-allocation feedback evaluating whether original allocation quantities matched real store sales velocity.</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-bold">Allocation Accuracy Score</span>
          <p className="text-2xl font-black text-emerald-600">92.4%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Allocated Pool</span>
          <p className="text-2xl font-black text-blue-600 mt-1">2,323 u</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Actual Units Sold</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">1,592 u</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Network Sell-Through</span>
          <p className="text-2xl font-black text-purple-600 mt-1">68.5%</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Stockout Prevention</span>
          <p className="text-2xl font-black text-cyan-600 mt-1">96.2%</p>
        </div>
      </div>

      {/* Bar Chart Comparison */}
      <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="font-extrabold text-sm mb-3">Allocated Qty vs Actual Units Sold (Sample Stores)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="store" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              <Bar dataKey="Allocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sold" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Remaining" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
