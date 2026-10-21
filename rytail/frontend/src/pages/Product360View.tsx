import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { ShoppingBag, Boxes, TrendingUp, DollarSign } from 'lucide-react';

export const Product360View: React.FC = () => {
  const { isDark } = useTheme();

  const stockSplitData = [
    { name: 'Warehouse H01', value: 4435, color: '#3b82f6' },
    { name: 'Store Network', value: 2323, color: '#10b981' },
  ];

  const topStores = [
    { store: 'E0100 (Mumbai)', sales: 34, stock: 13, sellThrough: 72.3 },
    { store: 'E0105 (Pune)', sales: 31, stock: 12, sellThrough: 71.0 },
    { store: 'E0108 (Jaipur)', sales: 29, stock: 11, sellThrough: 69.5 },
    { store: 'E0112 (Delhi)', sales: 28, stock: 10, sellThrough: 68.2 },
    { store: 'E0115 (Bengaluru)', sales: 27, stock: 10, sellThrough: 67.0 },
  ];

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <div className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">Product 360 — Explorer Impression Polo</h1>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">New Launch</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">SKU: <strong className="text-indigo-600 font-mono">EXFP00035WHITECAP GRAY</strong> • Division: MENS WEAR • Dept: EXPLORER TEES • Season: SS2026</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Warehouse Stock</span>
          <p className="text-2xl font-black text-blue-600 mt-1">4,435 units</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Allocated Store Stock</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">2,323 units</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Selling Price</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹1,299</p>
        </div>
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-xs font-bold text-slate-500">Comparable Match</span>
          <p className="text-2xl font-black text-purple-600 mt-1">99% Similarity</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Split Pie Chart */}
        <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="font-extrabold text-sm mb-3">Warehouse vs Network Store Stock Split</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {stockSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Stores Performance Bar Chart */}
        <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="font-extrabold text-sm mb-3">Top Stores Comparable Sales Volume</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStores} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="store" tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                <Tooltip />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
