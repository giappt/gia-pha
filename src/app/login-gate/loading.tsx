import React from 'react';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export default function LoginGateLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh] -mb-16 md:mb-0">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl text-center flex flex-col items-center gap-4 animate-pulse">
        {/* Emblem Skeleton */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center" />

        {/* Badge & Title Skeleton */}
        <div className="h-5 w-40 bg-emerald-100/80 dark:bg-emerald-950/40 rounded-full" />
        <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 max-w-full bg-slate-100 dark:bg-slate-800/60 rounded" />

        {/* Sync Loading Badge chuẩn hóa */}
        <div className="pt-2">
          <SyncLoadingBadge />
        </div>

        {/* Button & Footer Skeletons */}
        <div className="w-full space-y-3 pt-2">
          <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-14 w-full bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800/60" />
        </div>
      </div>
    </div>
  );
}
