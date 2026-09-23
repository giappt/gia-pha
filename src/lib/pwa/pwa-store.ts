'use client';

/**
 * PWA Store Singleton
 * Quản lý sự kiện beforeinstallprompt, trạng thái standalone và subscribers toàn cục
 * Triệt tiêu lỗi mất sự kiện khi điều hướng bằng client-side SPA routing
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isIOS: boolean;
  isMounted: boolean;
}

declare global {
  interface Window {
    __fat_deferred_prompt?: BeforeInstallPromptEvent | null;
    __fat_pwa_initialized?: boolean;
  }
}

// Module-level Singleton State
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsStandalone = false;
let globalIsIOS = false;
let globalIsMounted = false;

type PwaListener = (state: PwaState) => void;
const listeners = new Set<PwaListener>();

function notifyListeners() {
  const currentState = getPwaState();
  listeners.forEach((listener) => {
    try {
      listener(currentState);
    } catch (err) {
      console.error('[PwaStore] Error notifying listener:', err);
    }
  });
}

export function getPwaState(): PwaState {
  return {
    deferredPrompt: globalDeferredPrompt,
    isStandalone: globalIsStandalone,
    isIOS: globalIsIOS,
    isMounted: globalIsMounted,
  };
}

export function subscribePwa(listener: PwaListener): () => void {
  listeners.add(listener);
  // Gọi ngay listener với state hiện tại
  listener(getPwaState());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Khởi tạo PWA Listeners sớm nhất có thể (chạy an toàn trên client)
 */
export function initPwaListeners(): void {
  if (typeof window === 'undefined') return;

  globalIsMounted = true;

  // 1. Kiểm tra standalone mode
  const checkStandalone = () => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    globalIsStandalone = Boolean(isStandaloneMode);
  };

  checkStandalone();

  // 2. Nhận diện thiết bị iOS Safari
  const ua = window.navigator.userAgent;
  globalIsIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;

  // 3. Khôi phục deferredPrompt nếu window đã có
  if (window.__fat_deferred_prompt) {
    globalDeferredPrompt = window.__fat_deferred_prompt;
  }

  // Tránh đăng ký lặp listeners trên window
  if (window.__fat_pwa_initialized) {
    notifyListeners();
    return;
  }
  window.__fat_pwa_initialized = true;

  // 4. Lắng nghe beforeinstallprompt (Chromium)
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    const promptEvent = e as BeforeInstallPromptEvent;
    globalDeferredPrompt = promptEvent;
    window.__fat_deferred_prompt = promptEvent;
    notifyListeners();
  });

  // 5. Lắng nghe appinstalled
  window.addEventListener('appinstalled', () => {
    globalIsStandalone = true;
    globalDeferredPrompt = null;
    window.__fat_deferred_prompt = null;
    notifyListeners();
  });

  // 6. Tự động kiểm tra thay đổi display-mode media query
  try {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', (e) => {
      globalIsStandalone = e.matches;
      notifyListeners();
    });
  } catch {
    // ignore
  }

  notifyListeners();
}

/**
 * Kích hoạt hộp thoại cài đặt PWA
 */
export async function triggerPwaInstall(): Promise<{
  outcome: 'accepted' | 'dismissed' | 'unsupported';
  platform?: string;
}> {
  if (!globalDeferredPrompt) {
    return { outcome: 'unsupported' };
  }

  try {
    await globalDeferredPrompt.prompt();
    const choice = await globalDeferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      globalIsStandalone = true;
      globalDeferredPrompt = null;
      if (typeof window !== 'undefined') {
        window.__fat_deferred_prompt = null;
      }
      notifyListeners();
    }
    return choice;
  } catch (err) {
    console.error('[PwaStore] Error during prompt():', err);
    return { outcome: 'unsupported' };
  }
}
