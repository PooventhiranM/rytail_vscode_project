import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    isPositiveGood?: boolean;
    trend?: 'up' | 'down' | 'neutral';
  };
  asOf?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  asOf,
  icon,
  subtitle,
  className = '',
}) => {
  const isPositive = delta?.trend === 'up' || (typeof delta?.value === 'number' && delta.value > 0);
  const isGood = delta?.isPositiveGood !== undefined 
    ? (isPositive ? delta.isPositiveGood : !delta.isPositiveGood)
    : true;

  return (
    <div className={`bg-card border border-border rounded p-4 sm:p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</span>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <div className="text-[28px] font-semibold text-ink tabular-nums leading-none">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </div>

        {delta && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-sm ${
              isGood ? 'text-accent bg-sage' : 'text-danger bg-danger-bg'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{delta.value}</span>
          </div>
        )}
      </div>

      {(subtitle || asOf) && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-muted">
          {subtitle && <span>{subtitle}</span>}
          {asOf && <span className="ml-auto italic">As of {asOf}</span>}
        </div>
      )}
    </div>
  );
};
