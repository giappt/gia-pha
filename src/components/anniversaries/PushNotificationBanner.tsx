'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, Smartphone, AlertCircle, Loader2 } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationBanner() {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Kiểm tra môi trường hỗ trợ
    if (typeof window === 'undefined') return;

    const hasSW = 'serviceWorker' in navigator;
    const hasPush = 'PushManager' in window;
    const hasNotification = 'Notification' in window;

    // Phát hiện thiết bị iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    if (!hasSW || !hasPush || !hasNotification) {
      setIsSupported(false);
      return;
    }

    setPermission(Notification.permission);

    // Kiểm tra subscription hiện tại trong Service Worker
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setIsSubscribed(true);
        }
      })
      .catch((err) => {
        console.warn('Error checking existing push subscription:', err);
      });
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        setLoading(false);
        return;
      }

      // Xin cấp quyền Notification
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setStatusMessage('Quyền thông báo chưa được cấp phép trong trình duyệt.');
        setLoading(false);
        return;
      }

      // Đăng ký Service Worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const subOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      if (vapidKey) {
        subOptions.applicationServerKey = urlBase64ToUint8Array(vapidKey);
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe(subOptions);
      }

      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };

      const p256dh = sub.getKey ? sub.getKey('p256dh') : null;
      const auth = sub.getKey ? sub.getKey('auth') : null;

      const p256dhStr = p256dh ? arrayBufferToBase64(p256dh) : 'mock-p256dh';
      const authStr = auth ? arrayBufferToBase64(auth) : 'mock-auth';

      // Gửi lên backend API
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: p256dhStr,
            auth: authStr,
          },
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
        setStatusMessage('Đã đăng ký nhận thông báo ngày giỗ thành công!');
      } else {
        const data = await res.json();
        setStatusMessage(data.error || 'Có lỗi xảy ra khi lưu thông tin đăng ký.');
      }
    } catch (err: any) {
      console.error('Push subscribe error:', err);
      setStatusMessage(err.message || 'Không thể đăng ký nhận thông báo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }

      setIsSubscribed(false);
      setStatusMessage('Đã tắt nhận thông báo trên thiết bị này.');
    } catch (err: any) {
      console.error('Unsubscribe error:', err);
      setStatusMessage('Không thể hủy đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  // Trình duyệt không hỗ trợ Web Push
  if (!isSupported) {
    if (isIOS) {
      return (
        <div className="rounded-lg border border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <Smartphone className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium">Bật thông báo trên thiết bị iOS (iPhone/iPad)</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
              Để nhận thông báo đẩy ngày giỗ trên iPhone/iPad, vui lòng nhấn nút <strong>Chia sẻ (Share)</strong> trên Safari và chọn <strong>&ldquo;Thêm vào Màn hình chính&rdquo; (Add to Home Screen)</strong>.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Quyền thông báo đã bị chặn (denied)
  if (permission === 'denied') {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Thông báo đẩy hiện đang bị chặn trong trình duyệt của bạn. Hãy mở Cài đặt trang web để cho phép nhận tin.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-amber-500/5 p-4 sm:p-5 text-slate-800 dark:text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Thông Báo Ngày Giỗ Tự Động
            </h3>
            {isSubscribed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                <CheckCircle className="w-3 h-3" />
                Đã bật
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isSubscribed
              ? 'Hệ thống sẽ gửi thông báo lúc 7:00 sáng khi đến ngày giỗ của các bậc tiền nhân trong gia tộc.'
              : 'Đăng ký nhận thông báo đẩy 7:00 sáng để không bao giờ quên ngày giỗ của các bậc tiền nhân.'}
          </p>
          {statusMessage && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
        {isSubscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
            Tắt thông báo
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            Bật Thông Báo
          </button>
        )}
      </div>
    </div>
  );
}
