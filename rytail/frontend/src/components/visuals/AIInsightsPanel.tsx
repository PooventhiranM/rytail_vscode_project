import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  metric?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AIInsightsPanelProps {
  insights?: Insight[];
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights }) => {
  const { isDark } = useTheme();

  const defaultInsights: Insight[] = [
    {
      id: '1',
      type: 'info',
      title: 'Deterministic Allocation Mode Active',
      description: '78 stores received 13 units. 393 surplus units were distributed across 393 store-size slots based on demand weight ranking.',
      metric: '2,323 Units',
      actionLabel: 'Inspect Allocation Trace'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Low Stock Cover Alert in 12 Stores',
      description: 'Stores E0100, E0105, and E0112 have stock cover below 1.0 weeks for fast-moving sizes (M, L). Urgent replenishment suggested.',
      metric: 'WOS < 1.0w',
      actionLabel: 'View Replenishments'
    },
    {
      id: '3',
      type: 'success',
      title: 'Store Transfer Opportunity Detected',
      description: 'Store E0105 holds 25 units excess (WOS 7.2w). Transferring 5 units to Store E0100 prevents stockouts and saves ₹1.56 L in lost sales.',
      metric: '8 Matches',
      actionLabel: 'Execute Transfers'
    },
    {
      id: '4',
      type: 'info',
      title: 'Comparable SKU Match High Accuracy',
      description: 'Target EXFP00035 matched with EXFP00031JET BLACK (99% similarity). All 5 hard gates passed cleanly.',
      metric: '99% Match',
      actionLabel: 'Review Comparable'
    }
  ];

  const items = insights && insights.length > 0 ? insights : defaultInsights;

  return (
    <div className={`p-5 rounded-3xl border transition-all ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 to-purple-950/40 border-purple-900/40 text-white' 
        : 'bg-gradient-to-br from-purple-50/60 via-indigo-50/40 to-white border-purple-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-purple-200/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-500/25">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">Rytail Insights & Narrative Intelligence</h3>
            <p className="text-[11px] text-purple-600 dark:text-purple-300 font-semibold">Real-time automated retail recommendations</p>
          </div>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-600 text-white shadow-xs">
          AI Engine Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {items.map(item => {
          const typeColors = {
            success: isDark ? 'border-emerald-800/60 bg-emerald-950/20 text-emerald-300' : 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
            warning: isDark ? 'border-amber-800/60 bg-amber-950/20 text-amber-300' : 'border-amber-200 bg-amber-50/80 text-amber-900',
            critical: isDark ? 'border-rose-800/60 bg-rose-950/20 text-rose-300' : 'border-rose-200 bg-rose-50/80 text-rose-900',
            info: isDark ? 'border-indigo-800/60 bg-indigo-950/20 text-indigo-300' : 'border-indigo-200 bg-indigo-50/80 text-indigo-900'
          };

          return (
            <div 
              key={item.id} 
              className={`p-4 rounded-2xl border ${typeColors[item.type]} flex flex-col justify-between space-y-2 transition-all hover:scale-[1.01]`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>{item.title}</span>
                  </h4>
                  {item.metric && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/40 border border-current">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-80 mt-1.5 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              {item.actionLabel && (
                <button 
                  onClick={item.onAction}
                  className="text-[11px] font-extrabold flex items-center gap-1 hover:underline pt-1 text-purple-700 dark:text-purple-300"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
