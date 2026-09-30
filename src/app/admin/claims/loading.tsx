import React from 'react';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export default function AdminClaimsLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <SyncLoadingBadge />
      </div>

      {/* Toolbar filter skeleton */}
      <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60" />

      {/* Table skeleton */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="h-12 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800" />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="h-16 px-6 flex items-center justify-between">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-control" />
              <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
