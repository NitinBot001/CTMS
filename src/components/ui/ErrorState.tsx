import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Operational Error',
  message,
  onRetry,
}) => {
  return (
    <div className="bg-red-50/50 border border-red-200 rounded-sm p-6 text-center flex flex-col items-center justify-center">
      <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-semantic-danger mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-semantic-danger font-heading">{title}</h3>
      <p className="text-sm text-ink-secondary max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
          Retry Request
        </Button>
      )}
    </div>
  );
};
