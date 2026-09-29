import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse bg-stone-200/80 rounded-sm ${className}`}
      aria-hidden="true"
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" data-testid="dashboard-skeleton">
      {/* Context header skeleton */}
      <div className="bg-surface p-6 border border-border rounded-sm">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface p-4 border border-border rounded-sm">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Two columns content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-5 border border-border rounded-sm">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-20 w-full mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="bg-surface p-5 border border-border rounded-sm">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-20 w-full mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
};
