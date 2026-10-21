import React from 'react';
import { Sparkles, HelpCircle, ChevronRight, AlertCircle } from 'lucide-react';

export interface AiSuggestionCardProps {
  title?: string;
  summary: string;
  onViewCalculation?: () => void;
  assumptions?: string[];
  openQuestions?: string[];
  metrics?: { label: string; value: string | number }[];
  className?: string;
}

export const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({
  title,
  summary,
  onViewCalculation,
  assumptions = [],
  openQuestions = [],
  metrics = [],
  className = '',
}) => {
  return (
    <div
      className={`bg-ai-bg border-l-4 border-l-ai border border-ai/20 rounded p-4 sm:p-5 shadow-sm text-ink ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-sm bg-ai/10 text-ai">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-ai uppercase tracking-wider">
            AI Recommendation — Not yet approved
          </span>
        </div>
        {onViewCalculation && (
          <button
            onClick={onViewCalculation}
            className="inline-flex items-center gap-1 text-xs font-medium text-ai hover:underline"
          >
            <span>View calculation trace</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {title && <h4 className="text-sm font-semibold text-ink mt-2">{title}</h4>}
      <p className="text-sm text-ink-muted mt-1 leading-relaxed">{summary}</p>

      {metrics.length > 0 && (
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card/60 p-3 rounded-sm border border-ai/15">
          {metrics.map((m, idx) => (
            <div key={idx}>
              <div className="text-[11px] font-medium text-ink-muted uppercase">{m.label}</div>
              <div className="text-base font-semibold text-ink tabular-nums mt-0.5">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {(assumptions.length > 0 || openQuestions.length > 0) && (
        <div className="mt-3.5 pt-3 border-t border-ai/15 space-y-2">
          {assumptions.length > 0 && (
            <div className="text-xs bg-warning-bg border border-warning/20 rounded-sm p-2.5 text-ink">
              <span className="font-semibold text-warning block mb-1">Assumptions & Rules:</span>
              <ul className="list-disc list-inside space-y-0.5 text-ink-muted text-[11px]">
                {assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {openQuestions.length > 0 && (
            <div className="text-xs bg-card/80 border border-border rounded-sm p-2.5 text-ink">
              <span className="font-semibold text-ink-muted flex items-center gap-1 mb-1">
                <HelpCircle className="w-3 h-3 text-warning" />
                <span>Open Questions:</span>
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-ink-muted text-[11px]">
                {openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
