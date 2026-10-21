import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  headerBorder = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-card text-ink border border-border rounded shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 ${headerBorder ? 'border-b border-border' : ''}`}>
          <div>
            {title && typeof title === 'string' ? (
              <h3 className="text-base font-semibold text-ink leading-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
};
