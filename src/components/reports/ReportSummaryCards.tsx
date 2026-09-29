import React from 'react';
import { ReportSummaryMetricItem } from '../../types';
import { Card } from '../ui/Card';

interface ReportSummaryCardsProps {
  metrics: ReportSummaryMetricItem[];
  isLoading?: boolean;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
  metrics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-20 bg-surface-soft/60 animate-pulse rounded-sm border border-border"
          />
        ))}
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return null;
  }

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return {
          cardBorder: 'border-blue-200/80',
          valueColor: 'text-blue-700',
          accent: 'bg-blue-500',
        };
      case 'success':
        return {
          cardBorder: 'border-emerald-200/80',
          valueColor: 'text-emerald-700',
          accent: 'bg-emerald-500',
        };
      case 'warning':
        return {
          cardBorder: 'border-amber-200/80',
          valueColor: 'text-amber-700',
          accent: 'bg-amber-500',
        };
      case 'danger':
        return {
          cardBorder: 'border-rose-200/80',
          valueColor: 'text-rose-700',
          accent: 'bg-rose-500',
        };
      default:
        return {
          cardBorder: 'border-border',
          valueColor: 'text-ink',
          accent: 'bg-primary',
        };
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((item, idx) => {
        const styles = getVariantStyles(item.variant);

        return (
          <Card
            key={`${item.label}-${idx}`}
            className={`p-3 relative overflow-hidden bg-surface hover:shadow-subtle transition-shadow ${styles.cardBorder}`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-0.5 ${styles.accent}`}
            />
            <span className="text-[10px] uppercase font-semibold text-ink-muted block truncate mb-1">
              {item.label}
            </span>
            <div className={`text-xl sm:text-2xl font-bold font-mono leading-none ${styles.valueColor}`}>
              {item.value}
            </div>
            {item.sublabel && (
              <span className="text-[10px] text-ink-muted/80 block mt-1 truncate">
                {item.sublabel}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
};
