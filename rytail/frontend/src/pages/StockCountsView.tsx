import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  ClipboardCheck, 
  Plus, 
  Scan, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  FileText, 
  DollarSign,
  TrendingDown,
  RefreshCw,
  Archive
} from 'lucide-react';

export const StockCountsView: React.FC = () => {
  const [storeCode, setStoreCode] = useState('E0100');
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // New Session Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLocation, setNewLocation] = useState('SALES_FLOOR');
  const [newNotes, setNewNotes] = useState('Routine Weekly Rack Count');

  // Scan input inside active session
  const [scanSku, setScanSku] = useState('EXFP00035WHITECAP GRAY');
  const [scanCount, setScanCount] = useState<number>(3);
  const [scanNotes, setScanNotes] = useState('');

  // Manager Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('Audited physical counts against display racks.');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [storeCode]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.getCycleCountSessions(storeCode);
      setSessions(data || []);
      if (data && data.length > 0 && !activeSession) {
        setActiveSession(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await api.createCycleCountSession({
        store_code: storeCode,
        location: newLocation,
        notes: newNotes
      });
      setShowNewModal(false);
      await loadSessions();
      setActiveSession(res);
    } catch (err: any) {
      alert(`Error creating session: ${err.message}`);
    }
  };

  const handleRecordScan = async () => {
    if (!activeSession) return;
    try {
      const updated = await api.recordCycleCountScan(activeSession.id, {
        sku: scanSku,
        counted_qty: Number(scanCount),
        notes: scanNotes || 'Physical count verified'
      });
      setActiveSession(updated.session || updated);
      await loadSessions();
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    }
  };

  const handleSubmitForReview = async () => {
    if (!activeSession) return;
    try {
      await api.submitCycleCount(activeSession.id);
      await loadSessions();
      setActiveSession({ ...activeSession, status: 'SUBMITTED' });
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    }
  };

  const handleReviewSession = async (approve: boolean) => {
    if (!activeSession) return;
    setReviewLoading(true);
    try {
      const res = await api.reviewCycleCount(activeSession.id, approve, reviewNotes);
      alert(res.message);
      setShowReviewModal(false);
      await loadSessions();
      setActiveSession({ ...activeSession, status: approve ? 'APPROVED' : 'REJECTED' });
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  // Compute variance totals
  const totalVarianceUnits = (activeSession?.lines || []).reduce((acc: number, l: any) => acc + (l.variance || 0), 0);
  const totalShrinkageValue = (activeSession?.lines || []).reduce((acc: number, l: any) => {
    return acc + (l.variance < 0 ? Math.abs(l.variance) * 1499 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-100 uppercase tracking-wider">
              Module 6 &bull; Inventory Governance
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-200">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Auditable Cycle Count System
            </span>
          </div>
          <h1 className="text-2xl font-bold">Physical Stock Counting & Discrepancy Audits</h1>
          <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl">
            Conduct scheduled cycle counts, record physical scans, calculate immediate system variances,
            and submit shrink adjustments for Store Manager approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Count Session</span>
          </button>
        </div>
      </div>

      {/* Sessions Grid / Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Count Sessions</h3>
            <span className="text-xs text-slate-400">{sessions.length} recorded</span>
          </div>

          <div className="space-y-2">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => setActiveSession(sess)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  activeSession?.id === sess.id 
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                  <span>{sess.session_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    sess.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    (sess.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
                  }`}>
                    {sess.status}
                  </span>
                </div>
                <div className="text-slate-500 mt-1 flex justify-between">
                  <span>Loc: <strong>{sess.location}</strong></span>
                  <span>{sess.lines?.length || 0} items counted</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  By {sess.created_by} &bull; {new Date(sess.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Session Details & Variance Grid (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {activeSession ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              {/* Session Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-base font-mono">{activeSession.session_number}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeSession.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      (activeSession.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
                    }`}>
                      {activeSession.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Store: <strong>{activeSession.store_code}</strong> | Location: <strong>{activeSession.location}</strong> | Notes: {activeSession.notes}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2">
                  {activeSession.status === 'IN_PROGRESS' && (
                    <button
                      onClick={handleSubmitForReview}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow transition-colors"
                    >
                      Submit for Review
                    </button>
                  )}

                  {activeSession.status === 'SUBMITTED' && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Manager Review</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Items Audited</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {activeSession.lines?.length || 0} SKUs
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Unit Variance</span>
                  <div className={`text-xl font-bold mt-1 ${totalVarianceUnits < 0 ? 'text-rose-600' : (totalVarianceUnits > 0 ? 'text-amber-600' : 'text-emerald-600')}`}>
                    {totalVarianceUnits > 0 ? `+${totalVarianceUnits}` : totalVarianceUnits} units
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Shrinkage Loss Exposure</span>
                  <div className="text-xl font-bold text-rose-700 mt-1">
                    ₹{totalShrinkageValue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Scan Entry Bar (if in progress) */}
              {activeSession.status === 'IN_PROGRESS' && (
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-2">
                  <div className="font-semibold text-xs text-emerald-900 flex items-center gap-1.5">
                    <Scan className="w-4 h-4 text-emerald-700" />
                    <span>Physical Scan Barcode / SKU</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input 
                      type="text"
                      value={scanSku}
                      onChange={(e) => setScanSku(e.target.value)}
                      placeholder="Enter SKU (e.g. EXFP00035WHITECAP GRAY)"
                      className="flex-1 w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-xs text-slate-600 font-medium">Counted:</span>
                      <input 
                        type="number"
                        min="0"
                        value={scanCount}
                        onChange={(e) => setScanCount(Number(e.target.value))}
                        className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-center font-bold"
                      />
                      <button
                        onClick={handleRecordScan}
                        className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow"
                      >
                        Record
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Count Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-center">System Qty</th>
                      <th className="py-2.5 px-3 text-center">Counted Qty</th>
                      <th className="py-2.5 px-3 text-center">Variance</th>
                      <th className="py-2.5 px-3">Status / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeSession.lines || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No items counted yet in this session. Scan barcodes to begin.
                        </td>
                      </tr>
                    ) : (
                      activeSession.lines.map((line: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{line.sku}</td>
                          <td className="py-2.5 px-3 text-slate-700">{line.product_name}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-600">{line.system_qty}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{line.counted_qty}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              line.variance === 0 ? 'bg-emerald-100 text-emerald-800' :
                              (line.variance < 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')
                            }`}>
                              {line.variance > 0 ? `+${line.variance}` : line.variance}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{line.notes || 'Count verified'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Select or Create a Cycle Count Session</p>
            </div>
          )}
        </div>
      </div>

      {/* New Session Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Start New Cycle Count Session</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Location</label>
                <select 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="SALES_FLOOR">Sales Floor</option>
                  <option value="BACKROOM">Backroom Storage</option>
                  <option value="RECEIVING">Goods Receiving Area</option>
                  <option value="DAMAGED">Damaged / Defective Stock</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Audit Notes / Scope</label>
                <input 
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-2 border rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleCreateSession} className="flex-1 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold">
                Create Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && activeSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Store Manager Approval</h3>
            <p className="text-xs text-slate-600">
              Reviewing session <strong>{activeSession.session_number}</strong> with a net variance of <strong>{totalVarianceUnits} units</strong> (loss exposure ₹{totalShrinkageValue.toLocaleString()}).
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Manager Reconciliation Notes</label>
              <textarea 
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleReviewSession(false)} 
                disabled={reviewLoading}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold"
              >
                Reject Session
              </button>
              <button 
                onClick={() => handleReviewSession(true)} 
                disabled={reviewLoading}
                className="flex-1 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow"
              >
                {reviewLoading ? 'Posting...' : 'Approve & Adjust Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
