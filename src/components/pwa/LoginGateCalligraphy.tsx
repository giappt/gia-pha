'use client';

import React, { useState } from 'react';
import HanziCalligraphyLogo from './HanziCalligraphyLogo';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export interface LoginGateCalligraphyProps {
  className?: string;
  isLoading?: boolean;
}

/**
 * Component Hiển thị Biểu trưng Thư pháp chữ Hán "Phạm" (范) sống động tại Login Gate.
 * - Chữ Hán màu xanh ngọc bích (#059669) - màu chủ đề chuẩn của ứng dụng.
 * - Tự động múa bút viết 8 nét chuẩn xác khi vào màn hình.
 * - Hỗ trợ Cổng Kép Dual-Gate: nếu dữ liệu đang tải (isLoading=true) sau khi vẽ xong,
 *   chữ bước vào trạng thái Living Idle (phát hào quang thở ngọc bích) kèm SyncLoadingBadge chuẩn [R-UI.LOADING].
 * - Chạm vào biểu trưng để xem lại toàn bộ nét chữ.
 */
export default function LoginGateCalligraphy({
  className = '',
  isLoading = false,
}: LoginGateCalligraphyProps) {
  const [animationDone, setAnimationDone] = useState(false);

  const canEnterApp = animationDone && !isLoading;
  const isLivingIdle = animationDone && isLoading;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Khối huy hiệu chứa chữ Hán Thư Pháp */}
      <div
        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-emerald-900/10 dark:shadow-emerald-950/50 border border-emerald-500/25 dark:border-emerald-600/30 flex items-center justify-center mb-3 sm:mb-4 ring-4 ring-emerald-500/20 dark:ring-emerald-400/10 transition-all duration-500 hover:scale-105 cursor-pointer"
        title="Chạm vào để xem lại nét chữ thư pháp 范"
      >
        <HanziCalligraphyLogo
          size={52}
          strokeColor="#059669"
          outlineColor="rgba(5, 150, 105, 0.15)"
          strokeAnimationSpeed={1.3}
          delayBetweenStrokes={120}
          onComplete={() => setAnimationDone(true)}
          isLivingIdle={isLivingIdle}
          interactive={true}
          autoStart={true}
        />
      </div>

      {/* Chỉ báo trạng thái Loading chuẩn tắc [R-UI.LOADING] khi mạng đang đồng bộ */}
      {isLivingIdle && (
        <div className="mb-2 transition-opacity duration-300 animate-fade-in">
          <SyncLoadingBadge message="Đang tải dữ liệu..." />
        </div>
      )}
    </div>
  );
}
