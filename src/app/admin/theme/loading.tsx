import React from 'react';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export default function AdminThemeLoading() {
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

      {/* Profile cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-56 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
        <div className="h-56 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
      </div>

      {/* Scope options skeleton */}
      <div className="h-40 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60" />
    </div>
  );
}
