import React, { useState } from 'react';
import { api } from '../api/client';
import { AllocationRun } from '../types';
import { Layers, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { FirstAllocationResultView } from './FirstAllocationResult';

export const FirstAllocationWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [product, setProduct] = useState('EXFP00035WHITECAP GRAY');
  const [warehouse, setWarehouse] = useState('H01');
  const [horizon, setHorizon] = useState(12);
  const [poolPct, setPoolPct] = useState(52.4);
  const [comparableSku, setComparableSku] = useState('EXFP00031JET BLACK');
  const [minSizeQty, setMinSizeQty] = useState(2);
  const [maxSizeQty, setMaxSizeQty] = useState(10);
  
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<AllocationRun | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunAllocation = async () => {
    setRunning(true);
    setErrorMsg(null);
    try {
      const res = await api.runFirstAllocation({
        target_sku: product,
        warehouse_code: warehouse,
        planning_horizon_days: horizon,
        allocation_pool_pct: poolPct,
        min_units_per_size: minSizeQty,
        max_units_per_size: maxSizeQty,
        comparable_sku: comparableSku
      });
      setRunResult(res);
      setStep(9);
    } catch (err: any) {
      setErrorMsg(err.message || 'Allocation run failed.');
    } finally {
      setRunning(false);
    }
  };

  if (runResult && step >= 9) {
    return <FirstAllocationResultView initialRun={runResult} onReset={() => { setRunResult(null); setStep(1); }} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Workflow Engine</span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            First Allocation Wizard
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Step {step} of 8</span>
          <p className="text-sm font-extrabold text-indigo-600">
            {step === 1 && 'Select Target Product'}
            {step === 2 && 'Select Source Warehouse'}
            {step === 3 && 'Define Planning Horizon'}
            {step === 4 && 'Configure Allocation Pool %'}
            {step === 5 && 'Select Comparable SKU'}
            {step === 6 && 'Set Display MOQ & Guardrails'}
            {step === 7 && 'Review Size Curves'}
            {step === 8 && 'Run Allocation Engine'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
        <div 
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${(step / 8) * 100}%` }}
        />
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 min-h-[380px] flex flex-col justify-between shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Step 1: Select New Product / SKU</h3>
            <p className="text-xs text-slate-500 font-medium">Choose the newly arrived product in the warehouse that requires initial store allocation.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div 
                onClick={() => setProduct('EXFP00035WHITECAP GRAY')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  product === 'EXFP00035WHITECAP GRAY' 
                    ? 'border-indigo-600 bg-indigo-50/40 text-slate-900 shadow-md' 
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600">EXFP00035WHITECAP GRAY</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">New Launch</span>
                </div>
                <h4 className="font-extrabold text-base mt-2">Explorer Impression Polo</h4>
                <p className="text-xs text-slate-500 mt-1">Division: MENS WEAR • Dept: EXPLORER TEES • Type: IMPRESSION POLO</p>
                <div className="mt-3 text-xs text-slate-600 font-semibold flex gap-4">
                  <span>Price: ₹1,299</span>
                  <span>MRP: ₹1,499</span>
                  <span>Fit: REGULAR FIT</span>
                </div>
              </div>

              <div 
                onClick={() => setProduct('EXFP00010NAVY BLUE')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  product === 'EXFP00010NAVY BLUE' 
                    ? 'border-indigo-600 bg-indigo-50/40 text-slate-900 shadow-md' 
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">EXFP00010NAVY BLUE</span>
                  <span className="text-xs bg-slate-100 text-slate-700 font-extrabold px-2.5 py-0.5 rounded-full">Carryover</span>
                </div>
                <h4 className="font-extrabold text-base mt-2">Classic Pique Polo - Navy</h4>
                <p className="text-xs text-slate-500 mt-1">Division: MENS WEAR • Dept: EXPLORER TEES • Type: CLASSIC POLO</p>
                <div className="mt-3 text-xs text-slate-600 font-semibold flex gap-4">
                  <span>Price: ₹1,399</span>
                  <span>MRP: ₹1,599</span>
                  <span>Fit: SLIM FIT</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Step 2: Select Source Warehouse</h3>
            <p className="text-xs text-slate-500 font-medium">Select the distribution center holding the unallocated inventory.</p>
            <div className="p-5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/60 text-slate-900 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-base text-indigo-950">H01 - Central Distribution Warehouse</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">4,435 Units Available</span>
              </div>
              <p className="text-xs text-indigo-800 font-medium">Location: National Central Hub • Active Status: Operational</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Step 3: Define Planning Horizon</h3>
            <p className="text-xs text-slate-500 font-medium">Number of demand days to plan inventory allocation for stores.</p>
            <div className="flex items-center gap-4 pt-4">
              <input 
                type="number" 
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="bg-slate-50 border-2 border-slate-300 text-slate-900 font-black text-2xl rounded-2xl px-4 py-3 w-36 text-center focus:border-indigo-600 focus:outline-none"
              />
              <span className="text-slate-700 font-extrabold">Days (Default: 12 days)</span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Step 4: Configure Allocation Pool %</h3>
            <p className="text-xs text-slate-500 font-medium">Percentage of warehouse available stock committed to this allocation run.</p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  step="0.1"
                  value={poolPct}
                  onChange={(e) => setPoolPct(Number(e.target.value))}
                  className="bg-slate-50 border-2 border-indigo-600 text-indigo-600 font-black text-3xl rounded-2xl px-4 py-3 w-40 text-center focus:outline-none"
                />
                <span className="text-xl font-extrabold text-slate-900">% of Warehouse Stock</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-slate-700 flex justify-between items-center">
                <span className="font-semibold">Calculated Allocation Pool Limit:</span>
                <span className="font-black text-emerald-700 text-base">
                  {Math.floor(4435 * (poolPct / 100.0))} Units (HARD GATE LIMIT)
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Step 5: Comparable SKU Selection</h3>
            <p className="text-xs text-slate-500 font-medium">Select reference historical SKU to derive store sales velocity and demand share weights.</p>
            <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 text-slate-900 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-emerald-700 font-extrabold uppercase">Rank #1 Match • 99% Similarity</span>
                  <h4 className="font-extrabold text-base text-slate-900">EXFP00031JET BLACK</h4>
                </div>
                <span className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold">Hard Gates Passed</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Passed: Division (MENS WEAR), Dept (EXPLORER TEES), Product Type (IMPRESSION POLO), Sleeve (HALF SLEEVE), Fit (REGULAR FIT).</p>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Step 6: Display MOQ & Guardrails</h3>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-bold">Minimum Units Per Size (Base):</label>
                <input 
                  type="number" value={minSizeQty} onChange={(e) => setMinSizeQty(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl p-3 w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-bold">Maximum Units Per Size:</label>
                <input 
                  type="number" value={maxSizeQty} onChange={(e) => setMaxSizeQty(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl p-3 w-full"
                />
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">Step 7: Size Curve Resolution</h3>
            <p className="text-xs text-slate-500 font-medium">Historical size distribution ratio across sizes S, M, L, XL, XXL.</p>
            <div className="grid grid-cols-5 gap-3 pt-2 text-center">
              {[
                { size: 'S', pct: '10.96%' },
                { size: 'M', pct: '24.98%' },
                { size: 'L', pct: '33.67%' },
                { size: 'XL', pct: '21.04%' },
                { size: 'XXL', pct: '9.36%' },
              ].map(s => (
                <div key={s.size} className="bg-indigo-50/50 border border-indigo-200 p-3.5 rounded-2xl">
                  <span className="text-xs text-indigo-700 font-extrabold">Size {s.size}</span>
                  <p className="text-xl font-black text-indigo-900 mt-1">{s.pct}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-emerald-700 font-bold text-right">Sum = 100.0% • Fallback Level: NETWORK_DEFAULT</p>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-100 border border-indigo-300 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Ready to Execute First Allocation</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium">
              The engine will allocate <strong className="text-indigo-600 font-bold">2,323 units</strong> across <strong className="text-slate-900 font-bold">193 stores</strong> using exact base + surplus slot score ranking.
            </p>
            <button
              onClick={handleRunAllocation}
              disabled={running}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 text-sm"
            >
              {running ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              <span>{running ? 'Running Allocation Math...' : 'Run Allocation Engine'}</span>
            </button>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between border-t border-slate-100 pt-4 mt-6">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1 || running}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 8 && (
            <button
              onClick={() => setStep(s => Math.min(8, s + 1))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
