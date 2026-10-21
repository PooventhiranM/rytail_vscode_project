import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { 
  TrendingUp, Boxes, AlertTriangle, CheckCircle2, DollarSign, Layers, ShoppingCart, Percent, Sparkles
} from 'lucide-react';
import { Sparkline } from '../components/visuals/Sparkline';
import { AIInsightsPanel } from '../components/visuals/AIInsightsPanel';
import { InventoryHeatmap } from '../components/visuals/InventoryHeatmap';
import { InventoryNetworkGraph } from '../components/visuals/InventoryNetworkGraph';
import { useTheme } from '../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [pending, setPending] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDataQuality().catch(() => null),
      api.getPendingApprovals().catch(() => null)
    ]).then(([dq, pend]) => {
      setDataQuality(dq);
      setPending(pend);
      setLoading(false);
    });
  }, []);

  const kpis = [
    { label: 'Total Warehouse Stock', value: '4,435', unit: 'units', sub: 'Hub H01 (Central Hub)', spark: [4100, 4250, 4300, 4400, 4435], color: '#3b82f6', border: 'border-blue-200 dark:border-blue-900/40', bg: 'bg-blue-50/40 dark:bg-slate-900', text: 'text-blue-700 dark:text-blue-400', iconBg: 'bg-blue-500 text-white', icon: Boxes },
    { label: 'Total Store Stock', value: '18,450', unit: 'units', sub: '193 Active Stores', spark: [17200, 17800, 18000, 18250, 18450], color: '#6366f1', border: 'border-indigo-200 dark:border-indigo-900/40', bg: 'bg-indigo-50/40 dark:bg-slate-900', text: 'text-indigo-700 dark:text-indigo-400', iconBg: 'bg-indigo-500 text-white', icon: ShoppingCart },
    { label: 'Stock Valuation (MRP)', value: '₹2.76 Cr', unit: 'INR', sub: 'Cost: ₹95.2 L', spark: [2.5, 2.6, 2.65, 2.7, 2.76], color: '#10b981', border: 'border-emerald-200 dark:border-emerald-900/40', bg: 'bg-emerald-50/40 dark:bg-slate-900', text: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-500 text-white', icon: DollarSign },
    { label: 'Network Sell-Through', value: '64.2%', unit: '%', sub: 'SS2026: 68.5%', spark: [52, 56, 60, 62, 64.2], color: '#8b5cf6', border: 'border-violet-200 dark:border-violet-900/40', bg: 'bg-violet-50/40 dark:bg-slate-900', text: 'text-violet-700 dark:text-violet-400', iconBg: 'bg-violet-500 text-white', icon: Percent },
    { label: 'Weeks of Supply (WOS)', value: '3.8', unit: 'weeks', sub: 'Target: 4.0wks', spark: [4.8, 4.5, 4.2, 4.0, 3.8], color: '#0d9488', border: 'border-teal-200 dark:border-teal-900/40', bg: 'bg-teal-50/40 dark:bg-slate-900', text: 'text-teal-700 dark:text-teal-400', iconBg: 'bg-teal-500 text-white', icon: TrendingUp },
    { label: 'Rate of Sale (ROS)', value: '2.4', unit: 'u/day', sub: 'Top Store: 6.8 u/d', spark: [1.8, 2.0, 2.1, 2.3, 2.4], color: '#06b6d4', border: 'border-cyan-200 dark:border-cyan-900/40', bg: 'bg-cyan-50/40 dark:bg-slate-900', text: 'text-cyan-700 dark:text-cyan-400', iconBg: 'bg-cyan-500 text-white', icon: TrendingUp },
    { label: 'Out-of-Stock Stores', value: '12', unit: 'stores', sub: 'Action required', spark: [22, 18, 15, 14, 12], color: '#ef4444', border: 'border-rose-200 dark:border-rose-900/40', bg: 'bg-rose-50/40 dark:bg-slate-900', text: 'text-rose-700 dark:text-rose-400', iconBg: 'bg-rose-500 text-white', icon: AlertTriangle },
    { label: 'Overstock Stores', value: '18', unit: 'stores', sub: 'Donor candidates', spark: [28, 24, 22, 20, 18], color: '#f59e0b', border: 'border-amber-200 dark:border-amber-900/40', bg: 'bg-amber-50/40 dark:bg-slate-900', text: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-500 text-white', icon: AlertTriangle },
  ];

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/15 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white border border-white/30">
            Executive Control Center • SS2026
          </span>
          <h1 className="text-3xl font-black mt-2 tracking-tight">Retail Inventory Optimization Engine</h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1.5 max-w-2xl font-medium">
            Explainable multi-echelon first allocation, store-to-store transfer matching, and store replenishment cover across 193 retail locations.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
          <div className="text-right">
            <p className="text-xs text-indigo-100 font-medium">Data Health Score</p>
            <p className="text-2xl font-black text-emerald-300">{dataQuality?.data_health_score ?? 98.5}%</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center text-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`border ${kpi.border} ${kpi.bg} rounded-2xl p-4 shadow-xs hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{kpi.label}</span>
                <div className={`p-2 rounded-xl ${kpi.iconBg} shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className={`text-2xl font-black tracking-tight ${kpi.text}`}>{kpi.value}</span>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase ml-1">{kpi.unit}</span>
                </div>
                <Sparkline data={kpi.spark} color={kpi.color} />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Rytail AI Narrative Insights Panel */}
      <AIInsightsPanel />

      {/* Interactive Network Supply Topology Graph */}
      <InventoryNetworkGraph />

      {/* Inventory Stock Cover Heatmap */}
      <InventoryHeatmap />
    </div>
  );
};
