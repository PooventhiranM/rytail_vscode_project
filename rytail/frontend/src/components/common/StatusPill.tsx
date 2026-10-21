import React from 'react';
import { 
  Clock, CheckCircle2, AlertTriangle, XCircle, 
  MinusCircle, Check, Info 
} from 'lucide-react';

export type WorkflowState = 
  | 'recommended' 
  | 'pending_approval' 
  | 'approved' 
  | 'executed' 
  | 'reconciled' 
  | 'needs_input' 
  | 'blocked' 
  | 'rejected' 
  | 'failed' 
  | 'cancelled' 
  | 'inactive'
  | 'draft'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export interface StatusPillProps {
  status: WorkflowState | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  size = 'sm',
  className = '',
}) => {
  const norm = status.toLowerCase().replace(/[\s-]/g, '_');

  let variantClass = 'bg-inactive-bg text-inactive border border-border';
  let Icon = MinusCircle;
  let defaultLabel = status;

  switch (norm) {
    case 'recommended':
    case 'pending':
    case 'pending_approval':
      variantClass = 'bg-info-bg text-info border border-info/30';
      Icon = Clock;
      defaultLabel = 'Pending Approval';
      break;
    case 'approved':
      variantClass = 'bg-card text-primary border-2 border-primary font-semibold';
      Icon = Check;
      defaultLabel = 'Approved';
      break;
    case 'executed':
    case 'reconciled':
    case 'active':
    case 'success':
      variantClass = 'bg-success-bg text-success border border-success/30';
      Icon = CheckCircle2;
      defaultLabel = 'Executed';
      break;
    case 'needs_input':
    case 'blocked':
    case 'warning':
      variantClass = 'bg-warning-bg text-warning border border-warning/30';
      Icon = AlertTriangle;
      defaultLabel = 'Blocked';
      break;
    case 'rejected':
    case 'failed':
    case 'critical':
    case 'danger':
      variantClass = 'bg-danger-bg text-danger border border-danger/30';
      Icon = XCircle;
      defaultLabel = norm === 'critical' ? 'Critical' : 'Failed';
      break;
    case 'high':
      variantClass = 'bg-warning-bg text-warning border border-warning/40 font-semibold';
      Icon = AlertTriangle;
      defaultLabel = 'High Priority';
      break;
    case 'medium':
      variantClass = 'bg-info-bg text-info border border-info/30';
      Icon = Info;
      defaultLabel = 'Medium Priority';
      break;
    case 'low':
      variantClass = 'bg-sage text-primary border border-primary/20';
      Icon = CheckCircle2;
      defaultLabel = 'Low Priority';
      break;
    case 'draft':
      variantClass = 'bg-sage text-primary border border-primary/30';
      Icon = Clock;
      defaultLabel = 'Draft';
      break;
    case 'cancelled':
    case 'inactive':
    default:
      variantClass = 'bg-inactive-bg text-ink-muted border border-border';
      Icon = MinusCircle;
      defaultLabel = status;
      break;
  }

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full select-none ${sizeClass} ${variantClass} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{label || defaultLabel}</span>
    </span>
  );
};
