import React from 'react';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Admin Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-60 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          <SyncLoadingBadge />
        </div>
      </div>

      {/* 4 Thẻ Thống Kê (Stats Cards) Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs flex items-center justify-between animate-pulse"
          >
            <div className="flex flex-col gap-2">
              <div className="h-3.5 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-7 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Tab bar và Bảng Dữ Liệu Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-6 shadow-sm flex flex-col gap-4 animate-pulse">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <div className="h-8 w-32 rounded-lg bg-emerald-100 dark:bg-emerald-950/80" />
          <div className="h-8 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-8 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="flex flex-col gap-3 mt-2">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/40 flex items-center px-4 justify-between"
            >
              <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
