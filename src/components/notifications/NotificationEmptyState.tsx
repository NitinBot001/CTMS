import React from 'react';
import { BellOff, CheckCircle2, RotateCcw } from 'lucide-react';

interface NotificationEmptyStateProps {
  isFiltered: boolean;
  onResetFilters?: () => void;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  isFiltered,
  onResetFilters,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface border border-border rounded-sm text-center">
      {isFiltered ? (
        <div className="w-12 h-12 rounded-full bg-surface-soft border border-border flex items-center justify-center text-ink-muted mb-3">
          <BellOff className="w-6 h-6" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      )}

      <h3 className="font-serif font-bold text-ink text-base mb-1">
        {isFiltered ? 'No matching notifications found' : 'All caught up!'}
      </h3>

      <p className="text-xs text-ink-muted max-w-sm mb-4 leading-relaxed">
        {isFiltered
          ? 'No notifications match your current search or filter criteria. Try adjusting or clearing your filters.'
          : 'You have no notifications or alerts requiring attention in this study and site context.'}
      </p>

      {isFiltered && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-surface border border-border hover:bg-surface-soft rounded-sm transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
