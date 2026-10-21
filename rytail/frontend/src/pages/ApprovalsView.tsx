import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CheckSquare, CheckCircle2, RefreshCw } from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const [pending, setPending] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = () => {
    setLoading(true);
    api.getPendingApprovals().then(res => {
      setPending(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (runId: string, type: string) => {
    try {
      if (type === 'FIRST_ALLOCATION') {
        await api.approveAllocation(runId);
      } else if (type === 'REPLENISHMENT') {
        await api.approveReplenishment(runId);
      } else if (type === 'STORE_TRANSFER') {
        await api.approveTransfer(runId);
      }
      fetchApprovals();
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Governance & Workflow</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Pending Approvals Queue</h1>
          <p className="text-xs text-slate-500 font-medium">Review, approve, or reject allocation, replenishment, and store transfer runs.</p>
        </div>
        <span className="text-xs bg-amber-100 text-amber-800 font-extrabold px-3 py-1.5 rounded-full border border-amber-300">
          {pending?.pending_count ?? 0} Pending Approvals
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Run ID</th>
              <th className="p-3.5">Run Type</th>
              <th className="p-3.5">Target</th>
              <th className="p-3.5 text-right font-black text-slate-900">Units</th>
              <th className="p-3.5">Requested By</th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {pending?.items.map((item: any) => (
              <tr key={item.run_id} className="hover:bg-amber-50/20">
                <td className="p-3.5 font-bold text-indigo-600 font-mono">{item.run_id}</td>
                <td className="p-3.5 font-extrabold text-slate-900">{item.type}</td>
                <td className="p-3.5 font-mono text-slate-500 font-semibold">{item.target}</td>
                <td className="p-3.5 text-right font-black text-emerald-600 text-sm">{item.units} u</td>
                <td className="p-3.5 text-slate-500 font-semibold">{item.requested_by}</td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => handleApprove(item.run_id, item.type)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 text-xs flex items-center gap-1.5 mx-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </td>
              </tr>
            ))}

            {(!pending || pending.items.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-bold italic">
                  No pending approvals in queue. All planning runs approved.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
