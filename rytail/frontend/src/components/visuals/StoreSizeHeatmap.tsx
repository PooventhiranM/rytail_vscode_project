import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Info } from 'lucide-react';

interface StoreSizeHeatmapProps {
  storeResults?: any[];
}

export const StoreSizeHeatmap: React.FC<StoreSizeHeatmapProps> = ({ storeResults }) => {
  const { isDark } = useTheme();
  const [hoveredCell, setHoveredCell] = useState<any>(null);

  const samples = storeResults && storeResults.length > 0 ? storeResults.slice(0, 12) : [
    { store_code: 'E0100', weight: 0.00659, demand: 11.66, sizes: { S: 2, M: 3, L: 3, XL: 3, XXL: 2 } },
    { store_code: 'E0101', weight: 0.00612, demand: 10.82, sizes: { S: 2, M: 3, L: 3, XL: 2, XXL: 2 } },
    { store_code: 'E0102', weight: 0.00598, demand: 10.55, sizes: { S: 2, M: 2, L: 3, XL: 2, XXL: 2 } },
    { store_code: 'E0103', weight: 0.00581, demand: 10.24, sizes: { S: 2, M: 2, L: 3, XL: 2, XXL: 2 } },
    { store_code: 'E0104', weight: 0.00645, demand: 11.40, sizes: { S: 2, M: 3, L: 3, XL: 3, XXL: 2 } },
    { store_code: 'E0105', weight: 0.00680, demand: 12.01, sizes: { S: 2, M: 3, L: 3, XL: 3, XXL: 2 } },
    { store_code: 'E0106', weight: 0.00520, demand: 9.18, sizes: { S: 2, M: 2, L: 2, XL: 2, XXL: 2 } },
    { store_code: 'E0107', weight: 0.00535, demand: 9.45, sizes: { S: 2, M: 2, L: 3, XL: 2, XXL: 2 } },
    { store_code: 'E0108', weight: 0.00670, demand: 11.85, sizes: { S: 2, M: 3, L: 3, XL: 3, XXL: 2 } },
    { store_code: 'E0109', weight: 0.00510, demand: 9.01, sizes: { S: 2, M: 2, L: 2, XL: 2, XXL: 2 } },
  ];

  const sizeKeys = ['S', 'M', 'L', 'XL', 'XXL'];
  const sizePcts: Record<string, number> = { S: 0.1096, M: 0.2498, L: 0.3367, XL: 0.2104, XXL: 0.0936 };

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 mb-2">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">Store &times; Size Allocation Heatmap</h3>
          <p className="text-[11px] text-slate-500 font-medium">Hover over any size cell to view exact Slot Score and allocation math</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-extrabold">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 inline-block"></span>
            <span>2 Units (Base)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-500 text-white inline-block"></span>
            <span>3+ Units (Surplus Winner)</span>
          </span>
        </div>
      </div>

      {/* Heatmap Matrix Table */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className={`uppercase font-extrabold border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
              <th className="p-2.5 text-left">Store Code</th>
              <th className="p-2.5 text-left">Demand Wt</th>
              {sizeKeys.map(sz => (
                <th key={sz} className="p-2.5 w-16">Size {sz}</th>
              ))}
              <th className="p-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
            {samples.map((row: any) => {
              const sizes = row.size_split || row.sizes || { S: 2, M: 3, L: 3, XL: 3, XXL: 2 };
              const storeTotal = Object.values(sizes).reduce((acc: number, val: any) => acc + Number(val), 0);
              const wt = row.store_weight || row.weight || 0.006;

              return (
                <tr key={row.store_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 text-left font-extrabold">{row.store_code}</td>
                  <td className="p-2.5 text-left font-mono text-indigo-600 font-bold">{(wt * 100).toFixed(4)}%</td>

                  {sizeKeys.map(sz => {
                    const qty = sizes[sz] || 2;
                    const slotScore = (wt * sizePcts[sz]).toFixed(6);
                    const isSurplus = qty > 2;

                    return (
                      <td key={sz} className="p-1.5">
                        <div 
                          onMouseEnter={() => setHoveredCell({ store: row.store_code, size: sz, qty, wt, slotScore, sizePct: (sizePcts[sz] * 100).toFixed(2) })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSurplus 
                              ? 'bg-emerald-500 text-white shadow-xs hover:scale-105' 
                              : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                          }`}
                        >
                          {qty}
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-2.5 text-right font-black text-slate-900 dark:text-white text-sm">
                    {storeTotal} u
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hoveredCell && (
        <div className="mt-3 p-3 bg-slate-900 text-white dark:bg-slate-800 rounded-2xl text-xs flex items-center justify-between font-mono animate-fadeIn">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>{hoveredCell.store}</strong> • Size <strong>{hoveredCell.size}</strong>: Allocated <strong>{hoveredCell.qty} units</strong>
            </span>
          </div>
          <span className="text-slate-300 font-sans text-[11px]">
            Slot Score = Weight ({(hoveredCell.wt * 100).toFixed(3)}%) &times; Size ({hoveredCell.sizePct}%) = <strong>{hoveredCell.slotScore}</strong>
          </span>
        </div>
      )}
    </div>
  );
};
