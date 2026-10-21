import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Sliders, RefreshCw } from 'lucide-react';

export const PlanningRunsView: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [simParams, setSimParams] = useState({
    warehouse_stock: 4435,
    allocation_pool_pct: 52.4,
    min_units_per_size: 2,
    max_units_per_size: 10,
    planning_horizon_days: 12
  });
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    api.getPlanningRuns().then(setRuns).catch(() => {});
  }, []);

  const handleSimulate = async () => {
    if (runs.length === 0) return;
    setSimulating(true);
    try {
      const res = await api.simulateAllocation({
        base_run_id: runs[0].run_id,
        ...simParams
      });
      setSimResult(res);
    } catch (e: any) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-pink-600 uppercase tracking-widest">Version Control & Simulation</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Planning Runs & What-If Simulation</h1>
          <p className="text-xs text-slate-500 font-medium">Compare planning run versions side-by-side or adjust parameters in what-if simulation mode without touching production DB.</p>
        </div>
      </div>

      {/* What-If Simulation Panel */}
      <div className="bg-white border border-purple-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500 text-white shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">What-If Allocation Simulator</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs font-semibold">
          <div>
            <label className="text-slate-600">Warehouse Stock:</label>
            <input 
              type="number"
              value={simParams.warehouse_stock}
              onChange={(e) => setSimParams({...simParams, warehouse_stock: Number(e.target.value)})}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-black rounded-xl p-2.5 w-full mt-1"
            />
          </div>
          <div>
            <label className="text-slate-600">Allocation Pool %:</label>
            <input 
              type="number"
              step="0.1"
              value={simParams.allocation_pool_pct}
              onChange={(e) => setSimParams({...simParams, allocation_pool_pct: Number(e.target.value)})}
              className="bg-slate-50 border border-slate-300 text-indigo-600 font-black rounded-xl p-2.5 w-full mt-1"
            />
          </div>
          <div>
            <label className="text-slate-600">Horizon (Days):</label>
            <input 
              type="number"
              value={simParams.planning_horizon_days}
              onChange={(e) => setSimParams({...simParams, planning_horizon_days: Number(e.target.value)})}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-black rounded-xl p-2.5 w-full mt-1"
            />
          </div>
          <div>
            <label className="text-slate-600">Min per Size:</label>
            <input 
              type="number"
              value={simParams.min_units_per_size}
              onChange={(e) => setSimParams({...simParams, min_units_per_size: Number(e.target.value)})}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-black rounded-xl p-2.5 w-full mt-1"
            />
          </div>
          <div>
            <label className="text-slate-600">Max per Size:</label>
            <input 
              type="number"
              value={simParams.max_units_per_size}
              onChange={(e) => setSimParams({...simParams, max_units_per_size: Number(e.target.value)})}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-black rounded-xl p-2.5 w-full mt-1"
            />
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-purple-500/25 disabled:opacity-50"
        >
          {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
          <span>Run What-If Simulation</span>
        </button>

        {simResult && (
          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 text-xs space-y-3">
            <h4 className="font-extrabold text-purple-900">Simulation Comparison Results</h4>
            <div className="grid grid-cols-3 gap-4 font-semibold">
              <div className="bg-white p-3 rounded-xl border border-purple-100">
                <span className="text-slate-500">Current Base Run:</span>
                <p className="font-black text-slate-900 text-sm">{simResult.current_result.total_allocated_units} units</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-purple-100">
                <span className="text-slate-500">Simulated Result:</span>
                <p className="font-black text-purple-700 text-sm">{simResult.simulated_result.total_allocated_units} units</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-purple-100">
                <span className="text-slate-500">Variance:</span>
                <p className={`font-black text-sm ${simResult.variance.total_allocated_diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {simResult.variance.total_allocated_diff >= 0 ? '+' : ''}{simResult.variance.total_allocated_diff} units ({simResult.variance.pct_change}%)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Runs Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm">Reproducible Planning Run History</h3>
        </div>
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Run ID</th>
              <th className="p-3.5">Run Type</th>
              <th className="p-3.5">Version</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right font-black text-slate-900">Units</th>
              <th className="p-3.5">Run By</th>
              <th className="p-3.5">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {runs.map(r => (
              <tr key={r.run_id} className="hover:bg-purple-50/20">
                <td className="p-3.5 font-bold text-indigo-600 font-mono">{r.run_id}</td>
                <td className="p-3.5 font-extrabold text-slate-900">{r.type}</td>
                <td className="p-3.5 font-mono text-slate-500 font-semibold">v{r.version}</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3.5 text-right font-black text-slate-900">{r.units} u</td>
                <td className="p-3.5 text-slate-500 font-semibold">{r.run_by}</td>
                <td className="p-3.5 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
