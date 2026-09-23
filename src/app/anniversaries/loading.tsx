import React from 'react';

export default function AnniversariesLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-slate-100 dark:bg-slate-800/80 rounded-xl animate-pulse" />
      </div>

      {/* Banner Hôm Nay Skeleton */}
      <div className="h-20 w-full rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 p-4 mb-6 flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-200/60 dark:bg-emerald-800/50" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-32 bg-emerald-200/80 dark:bg-emerald-800/60 rounded" />
            <div className="h-3 w-44 bg-emerald-100 dark:bg-emerald-900/40 rounded" />
          </div>
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        <div className="h-9 w-32 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse hidden sm:block" />
      </div>

      {/* Danh sách ngày giỗ Skeleton (3 Cards) */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 p-5 shadow-xs flex flex-col gap-3 animate-pulse"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
