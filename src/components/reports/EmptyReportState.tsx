import React from 'react';
import { FileQuestion, RotateCcw } from 'lucide-react';

interface EmptyReportStateProps {
  title?: string;
  message?: string;
  onResetFilters?: () => void;
}

export const EmptyReportState: React.FC<EmptyReportStateProps> = ({
  title = 'No Report Records Found',
  message = 'There are no records in the active study/site scope matching your selected filter criteria.',
  onResetFilters,
}) => {
  return (
    <div className="p-12 text-center bg-surface border border-border rounded-sm space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-surface-soft flex items-center justify-center text-ink-muted">
        <FileQuestion className="w-6 h-6" />
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="text-base font-bold text-ink font-heading">{title}</h3>
        <p className="text-xs text-ink-muted leading-relaxed">{message}</p>
      </div>
      {onResetFilters && (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 rounded-sm transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
