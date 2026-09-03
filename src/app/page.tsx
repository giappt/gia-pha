import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { GitBranch, Calendar, Compass, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { auth_error?: string };
}) {
  const supabase = createClient();
  const cookieStore = cookies();
  const devClanName = cookieStore.get('fat_dev_clan_name')?.value;

  // Fetch clan settings if existing
  let clanName = devClanName || 'DÒNG HỌ NGUYỄN VĂN';
  let isDbConnected = false;

  try {
    const { data: clanData, error } = await supabase
      .from('clan_settings')
      .select('clan_name')
      .limit(1)
      .single();

    if (!error && clanData?.clan_name && !devClanName) {
      clanName = clanData.clan_name;
      isDbConnected = true;
    } else if (!error) {
      isDbConnected = true;
    }
  } catch (err) {
    console.error('Failed to read clan settings:', err);
  }

  // Get current user session on server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      userProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Giáp Phạm',
        user_role: 'super_admin',
      };
    } else {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        userProfile = profile;
      } catch {
        // ignore profile error
      }
    }
  }

  const isSuperAdmin = userProfile?.user_role === 'super_admin';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      {/* Auth Error Notification */}
      {searchParams.auth_error && (
        <div className="max-w-xl w-full mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Thông báo Bảo mật & Phân quyền</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              {searchParams.auth_error === 'cancelled'
                ? 'Thao tác đăng nhập Google đã được hủy bỏ.'
                : searchParams.auth_error === 'unauthorized_admin'
                ? 'Bạn không có quyền Super Admin để truy cập vào khu vực Cài đặt Quản trị.'
                : 'Không thể hoàn tất xác thực tài khoản. Vui lòng thử lại.'}
            </p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Nền Tảng Phả Hệ Số Hiện Đại</span>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400 mb-3">
          Hệ Thống Phả Hệ Trực Tuyến
        </p>

        <h1
          id="hero-clan-name"
          className={`${
            clanName.length > 25 ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl'
          } font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] mb-6 uppercase text-balance break-words max-w-4xl mx-auto`}
        >
          <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200 bg-clip-text text-transparent">
            {clanName}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          Nền tảng số hóa gia phả trực tuyến hiện đại. Kết nối mọi thế hệ con cháu, tự động xác định vai vế xưng hô chuẩn mực và nhắc nhở ngày giỗ theo Âm lịch truyền thống.
        </p>

        {/* User Greeting if logged in */}
        {user ? (
          <div className="inline-flex items-center gap-3 px-4 py-2.5 mb-8 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-sm text-left">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {(user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Xin chào, {user.user_metadata?.full_name || user.email}!
              </p>
              <p className="text-[11px] text-slate-500">
                Vai trò:{' '}
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {isSuperAdmin
                    ? 'Super Admin (Toàn quyền)'
                    : userProfile?.user_role === 'branch_editor'
                    ? 'Trưởng Chi Nhánh'
                    : userProfile?.user_role === 'claimed_member'
                    ? 'Thành Viên Dòng Họ'
                    : 'Khách Xem (Viewer)'}
                </span>
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Feature Navigation Cards Grid - Open Architecture, No Box-in-Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-4">
        {/* Card 1: Family Tree */}
        <div className="group relative flex flex-col p-7 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/[0.04] transition-all duration-300">
          <div className="mb-5 flex items-center justify-between">
            <GitBranch className="w-7 h-7 text-emerald-600 group-hover:scale-110 transition-transform duration-200" strokeWidth={1.75} />
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
              Milestone 3
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            Cây Phả Hệ Tương Tác
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1 font-normal">
            Trực quan hóa phả đồ nhiều thế hệ với Pan, Zoom, bộ lọc chi nhánh và giải pháp Ghost Node cho hôn nhân nội tộc.
          </p>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span>Sắp ra mắt trên Canvas đồ thị</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 2: Kinship Engine */}
        <div className="group relative flex flex-col p-7 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/70 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/[0.04] transition-all duration-300">
          <div className="mb-5 flex items-center justify-between">
            <Compass className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform duration-200" strokeWidth={1.75} />
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
              Milestone 2
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            Tra Cứu Vai Vế Xưng Hô
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1 font-normal">
            Thuật toán đồ thị tìm tổ tiên chung gần nhất (LCA) kết hợp từ điển Bắc - Trung - Nam cho ra cách gọi chuẩn mực.
          </p>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span>Lõi thuật toán Kinship Engine</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {/* Card 3: Anniversaries & Push */}
        <div className="group relative flex flex-col p-7 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/70 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/[0.04] transition-all duration-300">
          <div className="mb-5 flex items-center justify-between">
            <Calendar className="w-7 h-7 text-amber-600 group-hover:scale-110 transition-transform duration-200" strokeWidth={1.75} />
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
              Milestone 5
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            Lịch Giỗ & Nhắc Nhở PWA
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1 font-normal">
            Theo dõi ngày giỗ âm lịch trong 30 ngày tới và tự động nhận Web Push Notification vào đúng 7h sáng ngày giỗ.
          </p>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span>Đồng bộ Âm - Dương & Web Push</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>

      {/* Admin Panel Quick Access if Super Admin */}
      {isSuperAdmin && (
        <div className="mt-8 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 max-w-xl w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Khu vực Quản Trị Viên (Super Admin)
              </p>
              <p className="text-xs text-slate-500">
                Bạn có toàn quyền cấu hình dòng họ, duyệt thành viên và phân quyền.
              </p>
            </div>
          </div>
          <Link
            id="admin-settings-btn"
            href="/admin/settings"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-xs flex-shrink-0"
          >
            <span>Cài Đặt Dòng Họ</span>
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
