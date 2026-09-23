import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SyncLoadingBadgeProps {
  className?: string;
  message?: string;
}

/**
 * Component Loading Chuẩn Hóa Toàn Hệ Thống [R-UI.LOADING]
 * - Luôn sử dụng icon Lucide Loader2 với 'shrink-0 aspect-square text-emerald-600 animate-spin' chống méo 100%
 * - Thông điệp thống nhất tuyệt đối: "Đang tải dữ liệu..."
 */
export default function SyncLoadingBadge({
  className = '',
  message = 'Đang tải dữ liệu...',
}: SyncLoadingBadgeProps) {
  return (
    <div
      data-testid="sync-loading-badge"
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-emerald-500/30 dark:border-emerald-500/30 shadow-xs backdrop-blur-md animate-pulse ${className}`}
    >
      <Loader2 className="w-4 h-4 shrink-0 aspect-square text-emerald-600 animate-spin" />
      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
        {message}
      </span>
    </div>
  );
}
