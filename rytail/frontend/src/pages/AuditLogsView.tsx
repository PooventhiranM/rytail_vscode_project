import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLogs().then(setLogs).catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Audit Trail</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Audit Logs & Override Tracking</h1>
          <p className="text-xs text-slate-500 font-medium">Immutable audit log recording user actions, quantity overrides, run approvals, and parameter changes.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-600 uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">User</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Run ID</th>
              <th className="p-3.5">Details / Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-rose-50/20">
                <td className="p-3.5 text-slate-400 font-sans font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3.5 font-bold text-slate-900 font-sans">{log.user_name}</td>
                <td className="p-3.5 font-extrabold text-emerald-700">{log.action}</td>
                <td className="p-3.5 text-indigo-600 font-bold">{log.run_id || 'N/A'}</td>
                <td className="p-3.5 text-slate-600 font-sans font-medium">{log.reason || JSON.stringify(log.new_value || {})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
