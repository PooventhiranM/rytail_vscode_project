import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Info, CheckCircle2, Award, Zap } from 'lucide-react';

interface ExplainabilityPanelProps {
  storeCode?: string;
  totalUnits?: number;
  baseUnits?: number;
  surplusUnits?: number;
  weightPct?: number;
  explanation?: string;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  storeCode = 'E0100',
  totalUnits = 13,
  baseUnits = 10,
  surplusUnits = 3,
  weightPct = 0.659,
  explanation
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`p-5 rounded-3xl border transition-all ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">Visual Calculation Trace • {storeCode}</h3>
            <p className="text-[11px] text-slate-500 font-medium">Why did store {storeCode} receive {totalUnits} units?</p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Auditable Calculation Trace
        </span>
      </div>

      <div className="space-y-4 pt-3 text-xs">
        {/* Progress Bar 1: Demand Share Weight */}
        <div>
          <div className="flex justify-between font-bold mb-1">
            <span className="text-slate-600 dark:text-slate-400">1. Comparable Sales Velocity & Weight Share:</span>
            <span className="text-indigo-600 font-mono font-extrabold">{weightPct.toFixed(3)}% Share</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, weightPct * 100)}%` }}></div>
          </div>
        </div>

        {/* Breakdown Step Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 text-[10px] block font-bold uppercase">Base Display MOQ</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{baseUnits} Units</span>
            <span className="text-[10px] text-slate-400 font-medium">(2 units per size &times; 5 sizes)</span>
          </div>
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block font-bold uppercase">+ Additional Surplus</span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">+{surplusUnits} Units</span>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">(M +1, L +1, XL +1)</span>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono leading-relaxed text-slate-700 dark:text-slate-300">
          {explanation || `${storeCode} allocated ${totalUnits} units (Base: ${baseUnits}, Surplus: ${surplusUnits}) based on Store Weight ${weightPct}% derived from comparable EXFP00031JET BLACK sales demand.`}
        </div>
      </div>
    </div>
  );
};
