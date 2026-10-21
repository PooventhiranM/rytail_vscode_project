import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Filter, Search, Info } from 'lucide-react';

export const InventoryHeatmap: React.FC = () => {
  const { isDark } = useTheme();
  const [hoveredStore, setHoveredStore] = useState<any>(null);
  const [filterHealth, setFilterHealth] = useState<string>('ALL');

  const categories = ['POLOS', 'TEES', 'SHIRTS', 'DENIMS', 'JACKETS'];
  const stores = [
    { code: 'E0100', name: 'Mumbai Flagship', covers: { POLOS: 0.8, TEES: 3.2, SHIRTS: 4.5, DENIMS: 2.1, JACKETS: 7.5 } },
    { code: 'E0101', name: 'Delhi Select City', covers: { POLOS: 4.1, TEES: 1.2, SHIRTS: 3.8, DENIMS: 8.2, JACKETS: 1.5 } },
    { code: 'E0102', name: 'Bengaluru Indiranagar', covers: { POLOS: 0.0, TEES: 2.8, SHIRTS: 4.1, DENIMS: 3.5, JACKETS: 0.5 } },
    { code: 'E0103', name: 'Hyderabad Gachibowli', covers: { POLOS: 3.5, TEES: 4.0, SHIRTS: 2.1, DENIMS: 6.8, JACKETS: 9.1 } },
    { code: 'E0104', name: 'Chennai Express Ave', covers: { POLOS: 1.8, TEES: 0.9, SHIRTS: 5.2, DENIMS: 4.0, JACKETS: 2.2 } },
    { code: 'E0105', name: 'Pune Phoenix Market', covers: { POLOS: 7.2, TEES: 5.5, SHIRTS: 3.0, DENIMS: 1.9, JACKETS: 8.5 } },
    { code: 'E0106', name: 'Ahmedabad One Mall', covers: { POLOS: 2.4, TEES: 3.1, SHIRTS: 0.0, DENIMS: 4.2, JACKETS: 3.8 } },
    { code: 'E0107', name: 'Jaipur World Trade', covers: { POLOS: 4.8, TEES: 2.2, SHIRTS: 3.9, DENIMS: 0.8, JACKETS: 1.2 } },
  ];

  const getCoverColor = (wos: number) => {
    if (wos === 0) return 'bg-rose-600 text-white font-black'; // Out of Stock
    if (wos < 2.0) return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300'; // Low Stock
    if (wos <= 6.0) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-300'; // Healthy
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-300'; // Overstock
  };

  const getCoverLabel = (wos: number) => {
    if (wos === 0) return 'OUT OF STOCK';
    if (wos < 2.0) return 'LOW COVER';
    if (wos <= 6.0) return 'HEALTHY';
    return 'OVERSTOCK';
  };

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 mb-2">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">Multi-Category Inventory Stock Cover Heatmap</h3>
          <p className="text-[11px] text-slate-500 font-medium">Color intensity represents Weeks of Supply (WOS) cover per store category</p>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-2 text-[10px] font-extrabold">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-600"></span>
            <span>Out of Stock (0w)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-200 dark:bg-rose-900 border border-rose-400"></span>
            <span>Low (&lt;2w)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-900 border border-emerald-400"></span>
            <span>Healthy (2-6w)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-900 border border-amber-400"></span>
            <span>Overstock (&gt;6w)</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className={`uppercase font-extrabold border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
              <th className="p-2.5 text-left">Store Name</th>
              {categories.map(cat => (
                <th key={cat} className="p-2.5 w-24">{cat}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
            {stores.map(st => (
              <tr key={st.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="p-2.5 text-left">
                  <span className="font-extrabold text-slate-900 dark:text-white block">{st.code}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{st.name}</span>
                </td>
                {categories.map(cat => {
                  const wos = (st.covers as any)[cat] ?? 0;
                  return (
                    <td key={cat} className="p-1.5">
                      <div 
                        onMouseEnter={() => setHoveredStore({ store: st.code, name: st.name, cat, wos, status: getCoverLabel(wos) })}
                        onMouseLeave={() => setHoveredStore(null)}
                        className={`py-2 rounded-xl text-xs transition-all cursor-pointer ${getCoverColor(wos)}`}
                      >
                        {wos.toFixed(1)}w
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hoveredStore && (
        <div className="mt-3 p-3 bg-slate-900 text-white dark:bg-slate-800 rounded-2xl text-xs flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>
              <strong>{hoveredStore.store} ({hoveredStore.name})</strong> • Category: <strong>{hoveredStore.cat}</strong>
            </span>
          </div>
          <span className="font-bold">
            Stock Cover: {hoveredStore.wos} weeks [{hoveredStore.status}]
          </span>
        </div>
      )}
    </div>
  );
};
