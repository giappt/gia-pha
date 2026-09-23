import React from 'react';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export default function GlobalLoading() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in">
      <div className="flex flex-col items-center gap-4 max-w-md w-full">
        {/* Biểu tượng logo gia phả pulse */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 shadow-sm animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-emerald-200/60 dark:bg-emerald-800/60" />
        </div>

        {/* Sync Loading Badge chuẩn hóa [R-UI.LOADING] */}
        <SyncLoadingBadge />

        {/* Card skeleton placeholders */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          <div className="h-24 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
