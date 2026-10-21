import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TransferRun } from '../types';
import { RefreshCw } from 'lucide-react';
import { TransferSankeyDiagram } from '../components/visuals/TransferSankeyDiagram';
import { useTheme } from '../context/ThemeContext';

export const StoreTransferView: React.FC = () => {
  const { isDark } = useTheme();
  const [run, setRun] = useState<TransferRun | null>(null);
  const [running, setRunning] = useState(false);

  const handleExecuteTransfers = async () => {
    setRunning(true);
    try {
      const res = await api.runTransfers({ donor_wos_threshold: 6.0, receiver_wos_threshold: 2.0 });
      setRun(res);
    } catch (e: any) {
      alert(`Transfers calculation failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    handleExecuteTransfers();
  }, []);

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`p-6 rounded-3xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Store Balancing Command Center</span>
          <h1 className="text-2xl font-black mt-1">Store-to-Store Inventory Transfers</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Identifies inventory excess at donor stores (WOS &gt; 6.0w) and transfers to receiver stores experiencing stock shortages.</p>
        </div>

        <button
          onClick={handleExecuteTransfers}
          disabled={running}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md shadow-purple-500/25 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Matching Store Pairs...' : 'Re-Calculate Transfers'}</span>
        </button>
      </div>

      {run && (
        <div className="space-y-6">
          {/* Transfer Flow Diagram */}
          <TransferSankeyDiagram />

          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Found <strong>{run.recommendation_count}</strong> transfer matches</span>
            <span>Total Units to Move: <strong className="text-purple-600 font-black">{run.total_transfer_units} units</strong></span>
          </div>

          <div className={`border rounded-3xl overflow-hidden shadow-sm ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Donor Store</th>
                  <th className="p-3.5">Receiver Store</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Donor Stock</th>
                  <th className="p-3.5">Receiver Stock</th>
                  <th className="p-3.5 text-center">Score</th>
                  <th className="p-3.5 text-right font-black text-purple-600">Transfer Qty</th>
                  <th className="p-3.5">Recommendation Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {run.recommendations.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/20 dark:hover:bg-purple-950/20">
                    <td className="p-3.5">
                      <span className="font-extrabold text-amber-700 dark:text-amber-400">{rec.donor_store_code}</span>
                      <span className="text-[10px] text-slate-500 block font-semibold">WOS: {rec.donor_wos}wks</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{rec.receiver_store_code}</span>
                      <span className="text-[10px] text-slate-500 block font-semibold">WOS: {rec.receiver_wos}wks</span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 font-semibold">{rec.sku}</td>
                    <td className="p-3.5 font-bold text-indigo-600">{rec.size_code}</td>
                    <td className="p-3.5 font-bold">{rec.donor_current_stock} u</td>
                    <td className="p-3.5 text-rose-600 font-extrabold">{rec.receiver_current_stock} u</td>
                    <td className="p-3.5 text-center">
                      <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                        {rec.transfer_score} pts
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-purple-600 text-sm">{rec.transfer_qty} u</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px] leading-tight max-w-md font-medium">{rec.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
