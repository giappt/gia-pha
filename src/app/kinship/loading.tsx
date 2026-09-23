import React from 'react';

export default function KinshipLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
      {/* Header Skeleton */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-slate-100 dark:bg-slate-800/60 rounded mt-2.5 animate-pulse" />
      </div>

      {/* Hai Hộp Chọn Người A & B Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Người A */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 p-5 shadow-xs flex flex-col gap-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-emerald-100 dark:bg-emerald-950/80 rounded" />
            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl mt-1" />
          <div className="h-14 w-full bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60" />
        </div>

        {/* Người B */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 p-5 shadow-xs flex flex-col gap-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-emerald-100 dark:bg-emerald-950/80 rounded" />
            <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 rounded-xl mt-1" />
          <div className="h-14 w-full bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60" />
        </div>
      </div>

      {/* Khung Kết Quả Vai Vế Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-6 shadow-sm flex flex-col items-center gap-4 animate-pulse">
        <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-12 w-3/4 max-w-md bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40" />
        <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded mt-1" />
      </div>
    </div>
  );
}
