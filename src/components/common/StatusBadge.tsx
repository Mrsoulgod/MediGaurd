import React from 'react';

export type StatusBadgeVariant =
  | 'EXPIRED'
  | 'BLOCKED'
  | 'STOCKOUT'
  | 'WARNING_30D'
  | 'LOW_STOCK'
  | 'OK'
  | 'EXECUTED'
  | 'NEUTRAL'
  | 'PENDING';

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  text?: string;
  className?: string;
}

/**
 * Single shared StatusBadge component per DESIGN.md §5 & §2.
 * Strictly adheres to risk color mappings (Yellow for warning, never orange!).
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, text, className = '' }) => {
  let bg = '#F5F5F4';
  let color = '#57534E';
  let defaultLabel = 'Neutral';

  switch (variant) {
    case 'EXPIRED':
    case 'BLOCKED':
    case 'STOCKOUT':
      bg = '#FEE2E2';
      color = '#B91C1C';
      defaultLabel = variant === 'EXPIRED' ? 'Expired' : variant === 'BLOCKED' ? 'Blocked' : 'Stockout';
      break;

    case 'WARNING_30D':
    case 'LOW_STOCK':
      bg = '#FEF9C3';
      color = '#A16207';
      defaultLabel = variant === 'WARNING_30D' ? '≤ 30d' : 'Low stock';
      break;

    case 'OK':
    case 'EXECUTED':
      bg = '#DCFCE7';
      color = '#15803D';
      defaultLabel = variant === 'OK' ? 'OK' : 'Executed';
      break;

    case 'PENDING':
    case 'NEUTRAL':
    default:
      bg = '#F5F5F4';
      color = '#57534E';
      defaultLabel = variant === 'PENDING' ? 'Pending' : '≤ 60d';
      break;
  }

  return (
    <span
      style={{ backgroundColor: bg, color }}
      className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold tracking-tight border border-black/5 ${className}`}
    >
      {text || defaultLabel}
    </span>
  );
};
