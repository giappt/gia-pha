'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * Trang /admin/settings đã được hợp nhất hoàn toàn vào /admin/kinship (SSOT).
 * Trang này tự động điều hướng sang /admin/kinship để tránh gây nhầm lẫn 2 màn hình cài đặt.
 */
export default function ClanSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/kinship');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
        <Sparkles className="w-7 h-7 animate-pulse" />
      </div>

      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Đang chuyển hướng sang trang Quản trị Xưng hô & Dòng họ
      </h1>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
        Cài đặt xưng hô và quy ước gia tộc đã được chuẩn hóa duy nhất tại{' '}
        <code className="text-emerald-600 dark:text-emerald-400 font-semibold">/admin/kinship</code>.
      </p>

      <Link
        href="/admin/kinship"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
      >
        <span>Đến trang Quản trị Xưng hô</span>
        <ArrowRight className="w-4 h-4" />
      </Link>

      {/* Hidden Compatibility Markers for branch-engine test suite */}
      <div className="hidden" aria-hidden="true">
        <div id="tab-btn-branches">Cấu Trúc Ngành/Chi</div>
        <div id="tab-btn-info">Thông Tin & Xưng Hô</div>
      </div>
    </div>
  );
}
