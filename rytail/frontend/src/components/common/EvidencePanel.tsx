import React from 'react';
import { Database, Binary, ShieldCheck, Info } from 'lucide-react';

export interface EvidenceSource {
  name: string;
  id?: string;
  asOf?: string;
}

export interface EvidencePanelProps {
  formulaName: string;
  expression: string;
  algorithmVersion?: string;
  inputs: Record<string, string | number>;
  outputs: Record<string, string | number>;
  dataSources?: EvidenceSource[];
  ruleVersion?: string;
  className?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  formulaName,
  expression,
  algorithmVersion = 'alloc-v1.0.0',
  inputs,
  outputs,
  dataSources = [],
  ruleVersion,
  className = '',
}) => {
  return (
    <div className={`bg-card border border-border rounded p-4 text-ink space-y-4 ${className}`}>
      {/* Header & Version */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-ink">{formulaName}</h4>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-ink-muted">
          <span className="bg-sage px-2 py-0.5 rounded text-primary font-medium">
            {algorithmVersion}
          </span>
          {ruleVersion && (
            <span className="bg-bg px-2 py-0.5 rounded border border-border">
              Rule: {ruleVersion}
            </span>
          )}
        </div>
      </div>

      {/* Formula Expression */}
      <div className="bg-bg border border-border rounded p-3">
        <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider block mb-1">
          Mathematical Expression
        </span>
        <code className="text-xs font-mono text-primary font-semibold block break-all">
          {expression}
        </code>
      </div>

      {/* Inputs & Outputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-bg/50 border border-border rounded p-3 space-y-1.5">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block border-b border-border/50 pb-1">
            Input Variables
          </span>
          {Object.entries(inputs).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-xs">
              <span className="text-ink-muted font-mono">{k}</span>
              <span className="font-semibold tabular-nums text-ink">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-sage/40 border border-primary/20 rounded p-3 space-y-1.5">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block border-b border-primary/20 pb-1">
            Calculated Outputs
          </span>
          {Object.entries(outputs).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-xs">
              <span className="text-ink-muted font-mono">{k}</span>
              <span className="font-bold tabular-nums text-primary">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Sources Lineage */}
      {dataSources.length > 0 && (
        <div className="pt-2 border-t border-border">
          <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1.5 mb-1.5">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span>Authoritative Data Lineage</span>
          </span>
          <div className="space-y-1">
            {dataSources.map((ds, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] text-ink-muted">
                <span className="font-medium text-ink">{ds.name}</span>
                {ds.id && <code className="text-[10px] text-ink-muted font-mono">{ds.id.slice(0, 8)}...</code>}
                {ds.asOf && <span className="text-[10px] italic">{ds.asOf}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
