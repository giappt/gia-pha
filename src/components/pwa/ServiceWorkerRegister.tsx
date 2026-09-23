'use client';

import { useEffect } from 'react';
import { initPwaListeners } from '@/lib/pwa/pwa-store';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Khởi tạo listeners PWA bắt sự kiện beforeinstallprompt sớm nhất
    initPwaListeners();

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
