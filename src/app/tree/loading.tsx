import React from 'react';

export default function TreeLoading() {
  return (
    <div
      style={{ width: '100%', height: 'calc(100vh - 4rem)' }}
      className="relative select-none bg-slate-100/70 dark:bg-slate-950 overflow-hidden flex flex-col"
    >
      {/* Skeleton Toolbar Cố Định */}
      <div className="h-14 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse hidden sm:block" />
          <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800/80 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Vùng Canvas mờ ảo với hoa văn và Card Phả Hệ Skeleton */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Lưới chấm mờ nền canvas */}
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Thông báo trạng thái đồng bộ nổi bật */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 border border-emerald-500/30 dark:border-emerald-500/30 shadow-md backdrop-blur-md animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Đang đồng bộ dữ liệu phả hệ dòng tộc...
          </span>
        </div>

        {/* Cấu trúc cây phả hệ mẫu dạng Skeleton (3 thế hệ thu nhỏ) */}
        <div className="flex flex-col items-center gap-8 opacity-75 dark:opacity-60 scale-90 sm:scale-100">
          {/* Cụ Thủy Tổ Đời 1 */}
          <div className="w-52 h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 flex flex-col justify-between shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-12 bg-emerald-100 dark:bg-emerald-950/80 rounded" />
              <div className="h-3.5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            </div>
          </div>

          {/* Đường trục Bus thẳng đứng & thanh ngang */}
          <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
          <div className="w-96 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
            <div className="absolute -top-1 left-0 w-0.5 h-4 bg-slate-300 dark:bg-slate-700" />
            <div className="absolute -top-1 right-0 w-0.5 h-4 bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Hai cành Chi Đời 2 */}
          <div className="flex items-center gap-12">
            <div className="w-48 h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-2.5 flex flex-col justify-between shadow-xs animate-pulse">
              <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
            <div className="w-48 h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-2.5 flex flex-col justify-between shadow-xs animate-pulse">
              <div className="h-3 w-10 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
