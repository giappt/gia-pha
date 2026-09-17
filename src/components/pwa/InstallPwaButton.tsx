'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface InstallPwaButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'banner';
  label?: string;
  mobileLabel?: string;
  showIcon?: boolean;
}

export default function InstallPwaButton({
  className = '',
  variant = 'outline',
  label,
  mobileLabel,
  showIcon = true,
}: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 1. Kiểm tra standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // 2. Kiểm tra thiết bị iOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIosDevice);

    // 3. Lắng nghe beforeinstallprompt (Chrome / Android / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Lắng nghe appinstalled
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isMounted || isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
        setDeferredPrompt(null);
      }
    } else {
      // Thông báo nhẹ nếu trình duyệt không hỗ trợ trực tiếp prompt
      alert(
        'Để cài đặt ứng dụng, bạn có thể nhấn vào biểu tượng [Cài đặt / Thêm vào màn hình chính] trên thanh địa chỉ của trình duyệt.'
      );
    }
  };

  // Render nhãn thông minh (Desktop: "Cài đặt ứng dụng", Mobile: "Cài đặt ứng dụng điện thoại")
  const renderLabel = () => {
    if (label && !mobileLabel) {
      return <span>{label}</span>;
    }
    const desktopText = label || 'Cài đặt ứng dụng';
    const mobileText = mobileLabel || 'Cài đặt ứng dụng điện thoại';
    return (
      <>
        <span className="hidden sm:inline">{desktopText}</span>
        <span className="inline sm:hidden">{mobileText}</span>
      </>
    );
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-500/30';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300';
      case 'outline':
      default:
        return 'bg-white/80 dark:bg-slate-900/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 shadow-xs';
    }
  };

  const modalElement = showIOSModal && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setShowIOSModal(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 id="ios-modal-title" className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Cài Đặt Lên Màn Hình iPhone / iPad
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng hướng dẫn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Trình duyệt Safari trên iOS yêu cầu thao tác cài đặt qua thanh công cụ:
        </p>

        <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div>
              <div className="font-semibold flex items-center gap-1">
                Nhấn biểu tượng Chia sẻ <Share className="w-3.5 h-3.5 text-blue-500 inline" />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Nằm ở thanh công cụ phía dưới cùng của trình duyệt Safari.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div>
              <div className="font-semibold flex items-center gap-1">
                Chọn &ldquo;Thêm vào Màn hình chính&rdquo; <PlusSquare className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 inline" />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Cuộn danh sách tác vụ xuống dưới để tìm mục này (Add to Home Screen).
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div>
              <div className="font-semibold">Nhấn &ldquo;Thêm&rdquo; (Add)</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Nút màu xanh ở góc trên bên phải màn hình để hoàn tất.
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowIOSModal(false)}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          Đã hiểu, tôi sẽ thực hiện
        </button>
      </div>
    </div>
  );

  // Trường hợp variant="banner": Render Dải Tiện Ích chuẩn max-w-3xl gióng hàng với Thẻ Ngày Giỗ
  if (variant === 'banner') {
    return (
      <>
        <div
          data-testid="pwa-install-banner"
          className={`max-w-3xl w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-emerald-950/40 border border-emerald-500/30 dark:border-emerald-700/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              {isIOS ? <Smartphone className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Cài đặt ứng dụng Gia Phả lên màn hình chính
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Nhận thông báo ngày giỗ tự động thuận tiện.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            data-testid="pwa-install-button"
            aria-label="Cài đặt ứng dụng PWA"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all cursor-pointer select-none"
          >
            {renderLabel()}
          </button>
        </div>
        {modalElement}
      </>
    );
  }

  // Trường hợp button chuẩn thông thường
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        data-testid="pwa-install-button"
        aria-label="Cài đặt ứng dụng PWA lên màn hình chính"
        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95 ${getVariantStyles()} ${className}`}
      >
        {showIcon && (
          isIOS ? (
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )
        )}
        {renderLabel()}
      </button>
      {modalElement}
    </>
  );
}

/**
 * Wrapper component chuyên dụng cho Banner Tiện Ích PWA
 */
export function PwaInstallBanner(props: { className?: string }) {
  return <InstallPwaButton variant="banner" {...props} />;
}
