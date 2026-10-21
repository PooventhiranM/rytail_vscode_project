import React, { useState } from 'react';
import { AllocationRun, AllocationResult } from '../types';
import { api } from '../api/client';
import { 
  Download, Search, Info, Edit3, CheckCircle2, ShieldCheck, FileText, Layers, RefreshCw
} from 'lucide-react';
import { AllocationWaterfallChart } from '../components/visuals/AllocationWaterfallChart';
import { AllocationDistributionChart } from '../components/visuals/AllocationDistributionChart';
import { SizeDemandVSAllocationChart } from '../components/visuals/SizeDemandVSAllocationChart';
import { StoreSizeHeatmap } from '../components/visuals/StoreSizeHeatmap';
import { ExplainabilityPanel } from '../components/visuals/ExplainabilityPanel';
import { ReportExportModal } from '../components/visuals/ReportExportModal';
import { useTheme } from '../context/ThemeContext';
import { downloadAllocationCSV } from '../utils/export';

interface Props {
  initialRun: AllocationRun;
  onReset?: () => void;
}

export const FirstAllocationResultView: React.FC<Props> = ({ initialRun, onReset }) => {
  const { isDark } = useTheme();
  const [run, setRun] = useState<AllocationRun>(initialRun);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQtyFilter, setSelectedQtyFilter] = useState<number | null>(null);
  const [selectedResult, setSelectedResult] = useState<AllocationResult | null>(null);
  const [overrideStore, setOverrideStore] = useState<string | null>(null);
  const [overrideQty, setOverrideQty] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [approving, setApproving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Cross-filtering logic: search filter + histogram quantity filter!
  const filteredStores = run.store_results.filter(r => {
    const matchesSearch = r.store_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.comparable_sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQty = selectedQtyFilter ? r.final_allocation === selectedQtyFilter : true;
    return matchesSearch && matchesQty;
  });

  const handleOverrideSave = async () => {
    if (!overrideStore) return;
    try {
      await api.overrideAllocation(run.run_id, {
        store_code: overrideStore,
        new_quantity: overrideQty,
        reason: overrideReason || 'Manual merchandiser override'
      });
      const updated = await api.getAllocationRun(run.run_id);
      setRun(updated);
      setOverrideStore(null);
    } catch (e: any) {
      alert(`Override error: ${e.message}`);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.approveAllocation(run.run_id);
      const updated = await api.getAllocationRun(run.run_id);
      setRun(updated);
    } catch (e: any) {
      alert(`Approval failed: ${e.message}`);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header Summary */}
      <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                Run ID: {run.run_id}
              </span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                run.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
              }`}>
                {run.status}
              </span>
            </div>
            <h1 className="text-2xl font-black mt-2">First Allocation Result Matrix</h1>
            <p className="text-xs text-slate-500 font-medium">Target Product: <strong className="text-indigo-600 font-bold">{run.target_sku}</strong> • Warehouse: <strong>{run.warehouse_code}</strong></p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => downloadAllocationCSV(run)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Visual Report</span>
            </button>
            {run.status !== 'APPROVED' && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/25"
              >
                {approving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Approve Allocation</span>
              </button>
            )}
            {onReset && (
              <button onClick={onReset} className="text-xs text-indigo-600 font-bold hover:underline">
                New Run
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500">Warehouse Stock</span>
            <p className="text-xl font-black mt-0.5">{run.total_warehouse_stock.toLocaleString()} units</p>
          </div>
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Allocation Pool Limit</span>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5">{run.allocation_pool_units.toLocaleString()} units ({run.allocation_pool_pct}%)</p>
          </div>
          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Total Allocated</span>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{run.total_allocated_units.toLocaleString()} units</p>
          </div>
          <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Stores Allocated</span>
            <p className="text-xl font-black text-purple-700 dark:text-purple-300 mt-0.5">{run.store_count} stores</p>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid 1: Waterfall & Distribution Histogram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AllocationWaterfallChart 
          totalStock={run.total_warehouse_stock}
          poolUnits={run.allocation_pool_units}
          finalUnits={run.total_allocated_units}
        />

        <AllocationDistributionChart 
          onFilterByQty={(q) => setSelectedQtyFilter(q === selectedQtyFilter ? null : q)}
          selectedQty={selectedQtyFilter}
        />
      </div>

      {/* Visual Charts Grid 2: Size Demand vs Allocation & Store x Size Heatmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SizeDemandVSAllocationChart />
        <ExplainabilityPanel storeCode="E0100" totalUnits={13} baseUnits={10} surplusUnits={3} weightPct={0.659} />
      </div>

      {/* Store x Size Matrix Heatmap */}
      <StoreSizeHeatmap storeResults={run.store_results} />

      {/* Store Allocation Table */}
      <div className={`border rounded-3xl overflow-hidden shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Search store code or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-xl pl-9 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Showing {filteredStores.length} stores {selectedQtyFilter ? `(Filtered: ${selectedQtyFilter} units)` : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Store Code</th>
                <th className="p-3.5">Comparable SKU</th>
                <th className="p-3.5">Demand</th>
                <th className="p-3.5">Store Weight</th>
                <th className="p-3.5 text-center bg-indigo-50/50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200">S</th>
                <th className="p-3.5 text-center bg-indigo-50/50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200">M</th>
                <th className="p-3.5 text-center bg-indigo-50/50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200">L</th>
                <th className="p-3.5 text-center bg-indigo-50/50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200">XL</th>
                <th className="p-3.5 text-center bg-indigo-50/50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200">XXL</th>
                <th className="p-3.5 text-right font-black text-slate-900 dark:text-white">Total Qty</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredStores.map(r => {
                const s = r.size_split || { S: 2, M: 3, L: 3, XL: 3, XXL: 2 };
                const isOverridden = r.override_quantity !== undefined && r.override_quantity !== null;

                return (
                  <tr key={r.store_code} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30">
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">{r.store_code}</td>
                    <td className="p-3.5 font-mono text-slate-500 font-semibold">{r.comparable_sku}</td>
                    <td className="p-3.5 font-bold">{r.planning_demand} u</td>
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{(r.store_weight * 100).toFixed(4)}%</td>
                    
                    <td className="p-3.5 text-center font-extrabold">{s.S || 0}</td>
                    <td className="p-3.5 text-center font-extrabold text-blue-600">{s.M || 0}</td>
                    <td className="p-3.5 text-center font-extrabold text-emerald-600">{s.L || 0}</td>
                    <td className="p-3.5 text-center font-extrabold">{s.XL || 0}</td>
                    <td className="p-3.5 text-center font-extrabold">{s.XXL || 0}</td>

                    <td className="p-3.5 text-right font-black text-slate-900 dark:text-white text-sm">
                      {isOverridden ? (
                        <span className="text-amber-600 flex items-center justify-end gap-1">
                          {r.override_quantity} <span className="text-[10px] text-amber-600 font-bold">(Override)</span>
                        </span>
                      ) : (
                        r.final_allocation
                      )}
                    </td>

                    <td className="p-3.5 text-center space-x-2">
                      <button
                        onClick={() => setSelectedResult(r)}
                        className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 shadow-xs"
                        title="View Calculation Trace"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setOverrideStore(r.store_code);
                          setOverrideQty(r.final_allocation);
                          setOverrideReason('');
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-300 shadow-xs"
                        title="Override Quantity"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportExportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} runId={run.run_id} run={run} />
    </div>
  );
};
