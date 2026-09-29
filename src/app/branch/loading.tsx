import React from 'react';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export default function BranchLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded mt-2 animate-pulse" />
        </div>
        <SyncLoadingBadge message="Đang tải dữ liệu..." />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-9 w-36 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
      </div>

      {/* Content Cards Skeleton */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col gap-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
