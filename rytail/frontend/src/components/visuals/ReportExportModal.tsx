import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { downloadAllocationReport } from '../../utils/export';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  runId?: string;
  run?: any;
}

export const ReportExportModal: React.FC<Props> = ({ isOpen, onClose, runId = 'FA-20260924-001', run }) => {
  const { isDark } = useTheme();
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [generating, setGenerating] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setGenerating(true);
    setTimeout(() => {
      try {
        downloadAllocationReport(run || { run_id: runId, store_results: [] }, format);
      } catch (err) {
        console.error('Export download error:', err);
      }
      setGenerating(false);
      setCompleted(true);
      setTimeout(() => {
        setCompleted(false);
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className={`p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Export Visual Retail Report
          </h3>
          <button onClick={onClose} className="font-bold text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Generate an executive visual report for Run <strong className="text-indigo-600">{runId}</strong> containing store & size distribution charts, comparable SKU analysis, and calculation traces.
        </p>

        {/* Format Selectors */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'pdf', label: 'PDF/HTML Report', icon: FileText, color: 'text-rose-600 border-rose-200 bg-rose-50' },
            { id: 'excel', label: 'Excel Workbook', icon: FileSpreadsheet, color: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
            { id: 'csv', label: 'CSV Table', icon: Download, color: 'text-blue-600 border-blue-200 bg-blue-50' },
          ].map(fmt => (
            <div
              key={fmt.id}
              onClick={() => setFormat(fmt.id as any)}
              className={`p-3 rounded-2xl border-2 cursor-pointer text-center space-y-1 transition-all ${
                format === fmt.id ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950 font-bold' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <fmt.icon className={`w-5 h-5 mx-auto ${fmt.color.split(' ')[0]}`} />
              <span className="text-[11px] block font-bold">{fmt.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleDownload}
          disabled={generating || completed}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3 rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {generating ? (
            <span>Compiling Visual Report...</span>
          ) : completed ? (
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-300" /> Report Downloaded!</span>
          ) : (
            <span>Download {format.toUpperCase()} Report</span>
          )}
        </button>
      </div>
    </div>
  );
};
