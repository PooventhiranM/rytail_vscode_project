import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { Store, TrendingUp, Boxes, ShoppingCart, RefreshCw, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { Sparkline } from '../components/visuals/Sparkline';

export const Store360View: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedStore, setSelectedStore] = useState('E0100');

  const salesTrend = [
    { week: 'W1', Sales: 42, Target: 40 },
    { week: 'W2', Sales: 48, Target: 45 },
    { week: 'W3', Sales: 55, Target: 50 },
    { week: 'W4', Sales: 62, Target: 55 },
    { week: 'W5', Sales: 68, Target: 60 },
  ];

  const categoryPerf = [
    { category: 'POLOS', Sales: 180, Inventory: 120 },
    { category: 'TEES', Sales: 240, Inventory: 160 },
    { category: 'SHIRTS', Sales: 110, Inventory: 95 },
    { category: 'DENIMS', Sales: 90, Inventory: 85 },
    { category: 'JACKETS', Sales: 45, Inventory: 60 },
  ];

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <div className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">Store 360 — Mumbai Flagship</h1>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Grade A</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Store Code: <strong className="text-indigo-600 font-mono">E0100</strong> • Metro Cluster • Region: West • Floor Area: 4,000 sqft</p>
          </div>
        </div>

        <select 
          value={selectedStore} 
          onChange={(e) => setSelectedStore(e.target.value)}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl px-4 py-2.5"
        >
          <option value="E0100">E0100 - Mumbai Flagship</option>
          <option value="E0101">E0101 - Delhi Select City</option>
          <option value="E0105">E0105 - Pune Phoenix</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Weekly Sales', val: '68 units', sub: '+9.6% vs last week', spark: [42,48,55,62,68], color: '#10b981' },
          { label: 'Rate of Sale (ROS)', val: '6.8 u/day', sub: 'Top Store Network', spark: [5.2,5.8,6.1,6.5,6.8], color: '#3b82f6' },
          { label: 'Stock Cover (WOS)', val: '3.8 weeks', sub: 'Healthy Cover Range', spark: [4.8,4.5,4.2,4.0,3.8], color: '#8b5cf6' },
          { label: 'Sell Through %', val: '72.4%', sub: 'Target: 70%', spark: [55,60,65,70,72.4], color: '#f59e0b' },
        ].map((k, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <span className="text-xs font-bold text-slate-500">{k.label}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-black">{k.val}</span>
              <Sparkline data={k.spark} color={k.color} />
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block mt-1">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="font-extrabold text-sm mb-3">Weekly Sales vs Target Trend</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="Target" stroke="#94a3b8" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance Bar Chart */}
        <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="font-extrabold text-sm mb-3">Category Sales vs Inventory</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="Sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Inventory" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
