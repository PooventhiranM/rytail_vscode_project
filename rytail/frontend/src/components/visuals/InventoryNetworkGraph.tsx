import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Building2, Store, ArrowRight, Layers, MapPin } from 'lucide-react';

export const InventoryNetworkGraph: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const warehouse = { id: 'H01', name: 'Central Hub H01', stock: 4435, status: 'Healthy' };
  const regions = [
    { id: 'North', name: 'North Region', stores: 48, stock: 4850, health: 'Warning (2 OOS)', flow: '1,200 u/wk' },
    { id: 'South', name: 'South Region', stores: 52, stock: 5400, health: 'Healthy', flow: '1,450 u/wk' },
    { id: 'East', name: 'East Region', stores: 45, stock: 4100, health: 'Healthy', flow: '980 u/wk' },
    { id: 'West', name: 'West Region', stores: 48, stock: 4100, health: 'Overstock', flow: '1,100 u/wk' },
  ];

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 mb-2">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">Interactive Inventory Supply Network Topology</h3>
          <p className="text-[11px] text-slate-500 font-medium">Node sizes represent inventory volume. Line thickness represents network stock flow.</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Multi-Echelon Topology
        </span>
      </div>

      {/* Visual Network Diagram Canvas */}
      <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-8 relative overflow-hidden">
        {/* Level 1: Central Warehouse Node */}
        <div className="flex justify-center">
          <div 
            onClick={() => setSelectedNode(warehouse)}
            className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/20 text-center w-64 hover:scale-105 transition-all border-2 border-white/20"
          >
            <Building2 className="w-6 h-6 mx-auto text-blue-200 mb-1" />
            <h4 className="font-black text-sm">{warehouse.name}</h4>
            <p className="text-xs font-bold text-blue-100 mt-0.5">{warehouse.stock.toLocaleString()} Units Available</p>
          </div>
        </div>

        {/* Connecting Lines Visualizer */}
        <div className="relative h-6 flex justify-around items-center px-12">
          <div className="w-full border-t-2 border-dashed border-indigo-400/50 absolute top-1/2 -translate-y-1/2"></div>
        </div>

        {/* Level 2: Regional Hub Nodes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          {regions.map(reg => (
            <div 
              key={reg.id}
              onClick={() => setSelectedNode(reg)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                selectedNode?.id === reg.id
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-md'
                  : (isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs')
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-600">{reg.id}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {reg.stores} Stores
                </span>
              </div>
              <h5 className="font-black text-sm mt-1.5">{reg.name}</h5>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between text-[11px] font-semibold">
                <span className="text-slate-400">Stock:</span>
                <span className="text-slate-900 dark:text-white font-bold">{reg.stock.toLocaleString()} u</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold mt-0.5">
                <span className="text-slate-400">Movement:</span>
                <span className="text-emerald-600 font-extrabold">{reg.flow}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="mt-3 p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200 font-medium">
          <div>
            <span className="font-extrabold text-sm block">Selected Node: {selectedNode.name}</span>
            <p className="text-[11px] opacity-80 mt-0.5">Current Active Stock: {selectedNode.stock.toLocaleString()} units • Status: {selectedNode.health || selectedNode.status}</p>
          </div>
          <button onClick={() => setSelectedNode(null)} className="font-bold text-xs hover:underline text-indigo-600">Close</button>
        </div>
      )}
    </div>
  );
};
