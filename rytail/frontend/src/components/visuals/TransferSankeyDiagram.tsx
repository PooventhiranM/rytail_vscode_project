import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRight, RefreshCw, Zap } from 'lucide-react';

export const TransferSankeyDiagram: React.FC = () => {
  const { isDark } = useTheme();

  const transfers = [
    { donor: 'E0105 (Pune Phoenix)', receiver: 'E0100 (Mumbai Flagship)', qty: 5, sku: 'EXFP00035', size: 'M', score: 48.5, reason: 'High WOS excess (7.2w) at E0105 -> Stockout risk at E0100' },
    { donor: 'E0105 (Pune Phoenix)', receiver: 'E0108 (Jaipur WTC)', qty: 3, sku: 'EXFP00035', size: 'L', score: 42.1, reason: 'Excess L size -> High demand gap at E0108' },
    { donor: 'E0112 (Delhi Select)', receiver: 'E0101 (Delhi City)', qty: 4, sku: 'EXFP00031', size: 'XL', score: 39.8, reason: 'Intra-city short haul transfer' },
    { donor: 'E0120 (Bengaluru Ind)', receiver: 'E0125 (Hyderabad Gach)', qty: 6, sku: 'EXFP00010', size: 'M', score: 35.4, reason: 'Overstock clearance to high velocity store' },
  ];

  return (
    <div className={`p-5 rounded-3xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 mb-2">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">Store-to-Store Inventory Transfer Flow Map</h3>
          <p className="text-[11px] text-slate-500 font-medium font-sans">Visualizing stock migration paths from donor stores to receiver demand hotspots</p>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          Sankey Topology
        </span>
      </div>

      <div className="space-y-3 pt-2">
        {transfers.map((tr, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Donor Node */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-extrabold border border-amber-300">
                  Donor: {tr.donor}
                </span>
              </div>

              {/* Transfer Flow Bar */}
              <div className="flex-1 flex items-center justify-center gap-2 px-4">
                <div className="h-2 flex-1 bg-gradient-to-r from-amber-400 via-purple-500 to-emerald-500 rounded-full"></div>
                <span className="font-black text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-300 text-xs">
                  {tr.qty} units ({tr.size})
                </span>
                <div className="h-2 flex-1 bg-gradient-to-r from-amber-400 via-purple-500 to-emerald-500 rounded-full"></div>
              </div>

              {/* Receiver Node */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                  Receiver: {tr.receiver}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between">
              <span>{tr.reason}</span>
              <span className="font-mono font-bold text-indigo-600">Score: {tr.score} pts</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
