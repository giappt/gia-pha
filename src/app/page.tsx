import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import FamilyTreeIcon from '@/components/icons/FamilyTreeIcon';
import { Calendar, Compass, Shield, AlertCircle, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { getUpcomingAnniversaries, formatSolarDateWithDayOfWeek } from '@/lib/anniversaries/anniversary-engine';
import { SAMPLE_MEMBERS_28 } from '@/lib/tree-layout/sample-data';
import { getMemberInitials } from '@/lib/tree-layout/avatar-utils';
import { resolveFeatureFlags } from '@/lib/admin/admin-engine';
import type { MemberRecord } from '@/types/tree';

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
  let featureFlags = resolveFeatureFlags(undefined);

  // Đọc feature flags: Ưu tiên cookie cache để đồng bộ tức thì
  const cacheCookie = cookieStore.get('fat_feature_flags_cache')?.value;
  const devFlagsCookie = cookieStore.get('fat_dev_feature_flags')?.value;
  const targetFlagsCookie = devFlagsCookie || cacheCookie;
  if (targetFlagsCookie) {
    try {
      featureFlags = resolveFeatureFlags(JSON.parse(decodeURIComponent(targetFlagsCookie)));
    } catch {
      // ignore
    }
  }

  try {
    const { data: clanData, error } = await supabase
      .from('clan_settings')
      .select('clan_name, feature_flags')
      .limit(1)
      .single();

    if (!error && clanData?.clan_name && !devClanName) {
      clanName = clanData.clan_name;
      isDbConnected = true;
    } else if (!error) {
      isDbConnected = true;
    }

    if (!targetFlagsCookie && clanData?.feature_flags) {
      featureFlags = resolveFeatureFlags(clanData.feature_flags);
    }
  } catch (err) {
    console.error('Failed to read clan settings:', err);
  }

  // Get current user session on server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const devUserCookie = cookieStore.get('fat_dev_user')?.value;
  const isGuest = !user && !(process.env.NODE_ENV === 'development' && devUserCookie);

  let userProfile = null;
  if (user) {
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      userProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Giáp Phạm',
        user_role: 'super_admin',
        linked_member_id: null,
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

  // Fetch members to compute the nearest upcoming anniversary
  let membersList: MemberRecord[] = [];
  try {
    const { data: dbMembers, error: memberErr } = await supabase
      .from('members')
      .select('*')
      .order('generation_level', { ascending: true });

    if (!memberErr && dbMembers && dbMembers.length > 0) {
      membersList = dbMembers as unknown as MemberRecord[];
    } else {
      membersList = SAMPLE_MEMBERS_28;
    }
  } catch {
    membersList = SAMPLE_MEMBERS_28;
  }

  // Calculate upcoming anniversaries over a full 365-day window to guarantee finding the nearest one
  const upcomingAnniversaries = getUpcomingAnniversaries(membersList, {
    daysAhead: 365,
    viewerMemberId: userProfile?.linked_member_id || undefined,
  });

  const nearestGroup = upcomingAnniversaries.length > 0 ? upcomingAnniversaries[0] : null;
  const nearestMember = nearestGroup && nearestGroup.members.length > 0 ? nearestGroup.members[0] : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
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
      <div className="text-center max-w-3xl mx-auto mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400 mb-3">
          Hệ Thống Phả Hệ Trực Tuyến
        </p>

        <h1
          id="hero-clan-name"
          className={`${clanName.length > 25 ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl'
            } font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] mb-5 uppercase text-balance break-words max-w-4xl mx-auto`}
        >
          <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200 bg-clip-text text-transparent">
            {clanName}
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
          Nền tảng số hóa gia phả trực tuyến hiện đại. Kết nối mọi thế hệ con cháu và nhắc nhở ngày giỗ theo Âm lịch truyền thống.
        </p>

        {/* User Greeting if logged in */}
        {user ? (
          <div className="inline-flex items-center gap-3 px-4 py-2 mb-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-sm text-left">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || 'User Avatar'}
                className="w-9 h-9 rounded-full border border-emerald-500/50 object-cover aspect-square shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs aspect-square shrink-0 shadow-sm">
                {getMemberInitials(user.user_metadata?.full_name || user.email)}
              </div>
            )}
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
                      ? 'Trưởng Chi'
                      : userProfile?.user_role === 'claimed_member'
                        ? 'Thành Viên Dòng Họ'
                        : 'Khách Xem'}
                </span>
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Banner nhẹ cho Khách chưa đăng nhập */}
      {isGuest && (
        <div className="max-w-md w-full mb-10 p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 text-center shadow-xs">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Đăng nhập tài khoản Google để xem Lịch Giỗ, Tra cứu xưng hô và các tính năng nội bộ dòng họ.
          </p>
        </div>
      )}

      {/* Spotlight: Ngày Giỗ Gần Nhất (Chỉ hiển thị khi tính năng bật và người dùng đã đăng nhập) */}
      {!isGuest && nearestGroup && nearestMember && featureFlags.enable_anniversaries && (
        <div className="max-w-3xl w-full mb-10 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-emerald-950/40 border border-amber-500/30 dark:border-amber-700/40 shadow-lg shadow-amber-500/[0.03]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20 dark:border-amber-700/30">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Ngày Giỗ Gần Nhất
              </h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${nearestGroup.days_left === 0
                ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
                : nearestGroup.days_left === 1
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {nearestGroup.days_left === 0
                ? 'Hôm nay là Ngày Giỗ'
                : nearestGroup.days_left === 1
                  ? 'Ngày mai là Ngày Giỗ'
                  : `Còn ${nearestGroup.days_left} ngày nữa`}
            </span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar hoặc Initials */}
              {nearestMember.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nearestMember.avatar_url}
                  alt={nearestMember.full_name}
                  className="w-14 h-14 rounded-full border-2 border-amber-500 object-cover shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-amber-600 text-white font-bold text-lg flex items-center justify-center border-2 border-amber-400 flex-shrink-0 shadow-sm">
                  {getMemberInitials(nearestMember.full_name)}
                </div>
              )}

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
                  {nearestMember.full_name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Đời thứ {nearestMember.generation}
                  </span>
                  {nearestMember.branch_code && (
                    <>
                      <span>•</span>
                      <span>{nearestMember.branch_code}</span>
                    </>
                  )}
                  {nearestMember.birth_year && nearestMember.death_year && (
                    <>
                      <span>•</span>
                      <span>
                        Hưởng thọ {nearestMember.death_year - nearestMember.birth_year} tuổi ({nearestMember.birth_year} - {nearestMember.death_year})
                      </span>
                    </>
                  )}
                  {nearestMember.relative_kinship && (
                    <span className="px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold">
                      {nearestMember.relative_kinship}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-1 text-xs">
                  {/* Dòng Dương lịch ở trên: có Thứ đầy đủ */}
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                    <span>
                      {formatSolarDateWithDayOfWeek(nearestGroup.solar_year, nearestGroup.solar_month, nearestGroup.solar_day)}
                    </span>
                    <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                      (Dương lịch)
                    </span>
                  </div>
                  {/* Dòng Âm lịch ở dưới */}
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                    <span className="bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300/60 dark:border-amber-800/60">
                      Âm lịch: Ngày {nearestGroup.lunar_day < 10 ? '0' : ''}{nearestGroup.lunar_day}/{nearestGroup.lunar_month < 10 ? '0' : ''}{nearestGroup.lunar_month} ({nearestGroup.lunar_year_name})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
              <Link
                href="/tree"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <FamilyTreeIcon className="w-3.5 h-3.5" />
                <span>Xem trên Cây</span>
              </Link>
              <Link
                href="/anniversaries"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lịch Giỗ</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Quick Access if Super Admin */}
      {isSuperAdmin && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 max-w-xl w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

