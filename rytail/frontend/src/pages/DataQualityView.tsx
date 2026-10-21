import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export const DataQualityView: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const runAudit = () => {
    setRunning(true);
    api.getDataQuality().then(res => {
      setReport(res);
      setRunning(false);
    }).catch(() => setRunning(false));
  };

  useEffect(() => {
    runAudit();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Data Observability</span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Data Quality Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Continuous pre-flight verification of duplicate records, missing codes, negative inventory, and schema integrity.</p>
        </div>
        <button
          onClick={runAudit}
          disabled={running}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-cyan-500/20 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          <span>Run Pre-Flight Audit</span>
        </button>
      </div>

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-500">Data Health Score</span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{report.data_health_score}%</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-500">Total Records Validated</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{report.total_records_checked.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm text-center">
              <span className="text-xs font-bold text-slate-500">Invalid Records Flagged</span>
              <p className="text-3xl font-black text-amber-600 mt-1">{report.invalid_records_count}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-base">Validation Rule Audit Summary</h3>
            <div className="space-y-3">
              {report.issue_summary.map((issue: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">{issue.rule}</span>
                      <p className="text-slate-500 font-medium">Severity Level: <strong className="text-amber-700 font-bold">{issue.severity}</strong></p>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full border border-amber-300">
                    {issue.count} invalid records
                  </span>
                </div>
              ))}

              {report.issue_summary.length === 0 && (
                <p className="text-emerald-700 font-extrabold text-center p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  ✓ All data quality rules passed cleanly with zero violations.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
