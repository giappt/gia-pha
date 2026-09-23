'use client';

import React, { useState, useEffect, useCallback } from 'react';
import HanziCalligraphyLogo from './HanziCalligraphyLogo';
import SyncLoadingBadge from '@/components/ui/SyncLoadingBadge';

export interface AppSplashScreenProps {
  forceShow?: boolean;
  autoDismiss?: boolean;
}

/**
 * Màn hình Splash Toàn Ứng Dụng (App Splash Screen Overlay)
 * - Hiển thị toàn màn hình (fixed inset-0 z-[9999]) khi người dùng mở ứng dụng web/PWA.
 * - Trung tâm là chữ Hán "Phạm" (范) múa bút 8 nét theo đúng thứ tự bút thuận với màu xanh ngọc bích (#059669).
 * - Dưới chữ là tiêu đề "GIA PHẢ PHẠM VĂN" phong cách trang nghiêm cổ truyền.
 * - Áp dụng Cổng Kép Dual-Gate: canEnterApp = animationDone && isReady.
 * - Mạng nhanh: Chữ viết xong sẽ mờ dần (fade-out 500ms) mở lối vào app.
 * - Mạng chậm: Chữ bước vào Living Idle State (hào quang thở ngọc bích) và hiển thị SyncLoadingBadge "Đang tải dữ liệu...".
 * - Tiện ích: Chạm nhẹ bất kỳ đâu để bỏ qua (Tap to dismiss).
 * - Lưu cờ sessionStorage ('fat_splash_shown') để tránh lặp lại màn hình splash khi chuyển trang SPA nội bộ.
 */
export default function AppSplashScreen({
  forceShow = false,
  autoDismiss = true,
}: AppSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Kiểm tra cờ session storage để chỉ kích hoạt 1 lần trong phiên duyệt
    if (!forceShow) {
      try {
        const hasShown = sessionStorage.getItem('fat_splash_shown');
        if (hasShown === 'true') {
          setIsVisible(false);
          return;
        }
      } catch {
        // Fallback an toàn nếu private mode chặn sessionStorage
      }
    }

    // Đánh dấu hệ thống đã sẵn sàng sau khi mount
    const readyTimer = setTimeout(() => {
      setIsReady(true);
    }, 600);

    return () => clearTimeout(readyTimer);
  }, [forceShow]);

  const dismiss = useCallback(() => {
    setIsFading(true);
    try {
      sessionStorage.setItem('fat_splash_shown', 'true');
    } catch {}
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  }, []);

  // Cổng kép: Chỉ mở rèm khi cả animation hoàn tất và hệ thống sẵn sàng
  const canEnterApp = animationDone && isReady;

  useEffect(() => {
    if (autoDismiss && canEnterApp) {
      const timer = setTimeout(() => {
        dismiss();
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, canEnterApp, dismiss]);

  if (!isVisible) return null;

  return (
    <div
      data-testid="app-splash-screen"
      onClick={dismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-opacity duration-500 ease-out select-none cursor-pointer ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="Chạm vào màn hình để vào ứng dụng ngay"
    >
      <div className="flex flex-col items-center text-center p-6 max-w-sm mx-auto">
        {/* Biểu trưng thư pháp chữ 范 nét cọ xanh ngọc bích */}
        <div className="relative mb-4 flex items-center justify-center">
          <HanziCalligraphyLogo
            size={110}
            strokeColor="#059669"
            outlineColor="rgba(5, 150, 105, 0.12)"
            strokeAnimationSpeed={1.4}
            delayBetweenStrokes={110}
            onComplete={() => setAnimationDone(true)}
            isLivingIdle={animationDone && !isReady}
            interactive={false}
            autoStart={true}
          />
        </div>

        {/* Tên Dòng Họ & Triết Lý */}
        <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-widest text-slate-800 dark:text-slate-100 uppercase mb-1">
          Gia Phả Phạm Văn
        </h1>
        <p className="text-xs font-semibold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase opacity-90 mb-5">
          Hiếu Nghĩa Truyền Gia
        </p>

        {/* Chỉ báo trạng thái tải dữ liệu chuẩn [R-UI.LOADING] khi mạng chậm */}
        <div className="h-8 flex items-center justify-center">
          {animationDone && !isReady && (
            <div className="transition-opacity duration-300 animate-fade-in">
              <SyncLoadingBadge message="Đang tải dữ liệu..." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
