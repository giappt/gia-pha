import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import ClanHanLogo from '@/components/icons/ClanHanLogo';
import LoginGateAuthButton from '@/components/auth/LoginGateAuthButton';
import InstallPwaButton, { PwaMiniBanner } from '@/components/pwa/InstallPwaButton';
import { resolveFeatureFlags } from '@/lib/admin/admin-engine';
import { ShieldCheck, ArrowLeft, Sparkles, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Vui lòng đăng nhập tài khoản Google để truy cập Gia Phả Phạm Văn.',
};

export default async function LoginGatePage({
  searchParams,
}: {
  searchParams: { returnTo?: string; maintenance?: string };
}) {
  const returnTo = searchParams?.returnTo || '/';
  const isMaintenanceMode = searchParams?.maintenance === 'true';
  const supabase = createClient();
  const cookieStore = cookies();

  // 1. Kiểm tra session hiện tại - nếu đã đăng nhập và KHÔNG đang đóng vai khách thì tự động chuyển tiếp
  const impersonatedRole = cookieStore.get('fat_impersonated_role')?.value;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const devUser = cookieStore.get('fat_dev_user')?.value;
  if ((user || (process.env.NODE_ENV === 'development' && devUser)) && impersonatedRole !== 'guest') {
    redirect(returnTo);
  }

  // 2. Đọc cài đặt dòng họ & feature flags
  let clanName = 'GIA PHẢ HỌ PHẠM';
  let enablePublicTree = true;

  try {
    const { data: clanData } = await supabase
      .from('clan_settings')
      .select('clan_name, feature_flags')
      .limit(1)
      .single();

    if (clanData?.clan_name) {
      clanName = clanData.clan_name;
    }
    const flags = resolveFeatureFlags(clanData?.feature_flags);
    enablePublicTree = flags.enable_public_tree;
  } catch {
    // fallback defaults
  }

  const isTreePrivateMode = !enablePublicTree;

  return (
    <div className="flex-1 flex items-center justify-center p-4 -mb-16 md:mb-0 overflow-y-auto bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-200/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-emerald-900/5 dark:shadow-emerald-950/40 text-center flex flex-col items-center my-auto">
        {/* Emblem Logo Chữ Hán Thư Pháp */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-600/30 dark:shadow-emerald-950/60 flex items-center justify-center mb-4 sm:mb-6 ring-4 ring-emerald-500/20 dark:ring-emerald-400/10">
          <ClanHanLogo size={44} className="text-white" />
        </div>

        {/* Tên Dòng Họ & Huy Hiệu Chế Độ */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2.5 border border-emerald-500/20 dark:border-emerald-800/40">
          {isMaintenanceMode ? (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Hệ Thống Đang Bảo Trì</span>
            </>
          ) : isTreePrivateMode ? (
            <>
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Chế Độ Nội Bộ</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cổng Đăng Nhập Dòng Tộc</span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight mb-2">
          {clanName}
        </h1>

        {/* Thông Điệp Ngữ Cảnh */}
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto mb-6 leading-relaxed">
          {isMaintenanceMode
            ? 'Hệ thống phả hệ hiện đang tạm thời bảo trì để nâng cấp và bảo toàn dữ liệu di sản. Xin quý bà con vui lòng quay lại sau.'
            : isTreePrivateMode
            ? 'Cây phả hệ dòng họ hiện đang ở chế độ Nội bộ. Vui lòng đăng nhập bằng tài khoản Google để truy cập.'
            : 'Tính năng này yêu cầu đăng nhập tài khoản dòng họ để bảo mật thông tin gia tộc.'}
        </p>

        {/* Cụm Nút Hành Động */}
        <div className="w-full flex flex-col gap-3">
          <LoginGateAuthButton returnTo={returnTo} />

          {/* Nút Dev Bypass chỉ hiện khi chạy ở môi trường phát triển (development) */}
          {process.env.NODE_ENV === 'development' && (
            <a
              id="dev-bypass-btn"
              href={`/api/auth/dev-login?action=login&returnTo=${encodeURIComponent(returnTo)}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300/80 dark:border-amber-700/60 rounded-xl transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>⚡ Đăng nhập nhanh Dev (Bypass Super Admin)</span>
            </a>
          )}

          {/* Phân cách nhẹ chân Card cho Tiện ích Cài đặt PWA - Mini Banner đồng bộ */}
          <div className="w-full pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center gap-2">
            <PwaMiniBanner className="w-full" />
          </div>

          {/* Link quay về trang chủ khi cây công khai */}
          {enablePublicTree && (
            <div className="pt-1.5">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về Trang Chủ</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
