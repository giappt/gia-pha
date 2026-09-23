import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in">
      <div className="flex flex-col items-center gap-4 max-w-md w-full">
        {/* Biểu tượng logo gia phả pulse */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 shadow-sm animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>

        {/* Thông báo trạng thái trang trọng */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
          <div className="h-3.5 w-56 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse mt-1" />
        </div>

        {/* Card skeleton placeholders */}
        <div className="w-full grid grid-cols-2 gap-3 mt-6">
          <div className="h-24 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
