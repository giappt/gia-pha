'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBarInternal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setVisible(true);
    setIsLoading(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 90;
        }
        const diff = (90 - prev) * 0.15;
        return Math.min(90, prev + Math.max(diff, 2));
      });
    }, 150);
  };

  const finishProgress = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setProgress(100);
    setIsLoading(false);

    cleanupTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  };

  // Hoàn tất progress bar khi pathname hoặc searchParams thay đổi (trang đã nạp xong)
  useEffect(() => {
    finishProgress();
  }, [pathname, searchParams]);

  // Lắng nghe sự kiện click link nội bộ toàn hệ thống
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Bỏ qua nếu có phím bổ trợ (Ctrl, Cmd, Shift, Alt) hoặc click chuột giữa/phải
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      const download = target.getAttribute('download');

      // Bỏ qua external links, downloads, new tabs, hash-only anchors
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || targetAttr === '_blank' || download !== null) {
        return;
      }

      if (href.startsWith('#')) return;

      // Chuẩn hóa url đích
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Kích hoạt Top Progress Bar tức thì trong 50ms
      startProgress();
    };

    // Lắng nghe sự kiện tùy chỉnh nếu có nơi nào điều hướng bằng router.push
    const handleCustomStart = () => startProgress();
    const handleCustomStop = () => finishProgress();

    document.addEventListener('click', handleDocumentClick, { capture: true });
    window.addEventListener('fat:nav:start', handleCustomStart);
    window.addEventListener('fat:nav:stop', handleCustomStop);

    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
      window.removeEventListener('fat:nav:start', handleCustomStart);
      window.removeEventListener('fat:nav:stop', handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="top-navigation-progress-bar"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] overflow-hidden"
    >
      {/* Thanh Bar chính, sử dụng biến màu CSS động --brand-primary và --brand-glow */}
      <div
        className="h-full relative transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--brand-primary, #059669) 0%, #34d399 50%, var(--brand-primary, #059669) 100%)',
          boxShadow: '0 0 10px var(--brand-glow, rgba(16, 185, 129, 0.7)), 0 0 5px var(--brand-glow, rgba(16, 185, 129, 0.5))',
        }}
      >
        {/* Vệt sáng Shimmer lướt qua */}
        <div
          className="absolute inset-0 w-full h-full opacity-75"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
            animation: 'shimmer 1.2s infinite ease-in-out',
          }}
        />
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarInternal />
    </Suspense>
  );
}
