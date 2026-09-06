'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Search,
  GitBranch,
  Clock,
  Sparkles,
  Flame,
  Star,
  Users,
  ChevronRight,
  Loader2,
  CalendarDays,
} from 'lucide-react';
import { AnniversaryDayGroup, AnniversaryMemberItem } from '@/types/anniversary';
import { PushNotificationBanner } from '@/components/anniversaries/PushNotificationBanner';
import { solarToLunar, getYearCanChi } from '@/lib/lunar/vietnamese-lunar';
import { getVietnamDate } from '@/lib/anniversaries/anniversary-engine';
import { getMemberInitials } from '@/lib/tree-layout/avatar-utils';
import {
  getUserPreferences,
  USER_PREFERENCES_EVENT,
  flattenBranchTree,
  resolveMemberBranchHierarchy,
} from '@/lib/tree-layout/branch-engine';
import type { BranchNode } from '@/types/database';
import type { MemberRecord } from '@/types/tree';

export default function AnniversariesPage() {
  const [dayGroups, setDayGroups] = useState<AnniversaryDayGroup[]>([]);
  const [clanBranches, setClanBranches] = useState<BranchNode[]>([]);
  const [allMembers, setAllMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [daysRange, setDaysRange] = useState<number>(30);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Tính ngày hôm nay chuẩn Âm - Dương UTC+7
  const todayInfo = useMemo(() => {
    const { year, month, day } = getVietnamDate();
    const lunar = solarToLunar(day, month, year);
    const canChi = getYearCanChi(lunar.lunarYear);
    return {
      solarStr: `${day < 10 ? '0' : ''}${day}/${month < 10 ? '0' : ''}${month}/${year}`,
      lunarStr: `Ngày ${lunar.lunarDay < 10 ? '0' : ''}${lunar.lunarDay} tháng ${
        lunar.lunarMonth < 10 ? '0' : ''
      }${lunar.lunarMonth} Âm lịch (${canChi})`,
    };
  }, []);

  // Fetch dữ liệu từ API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/anniversaries?days=${daysRange}`)
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted && resData.success && Array.isArray(resData.data)) {
          setDayGroups(resData.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch anniversaries:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [daysRange]);

  // Đồng bộ tùy chọn cá nhân và lắng nghe thay đổi nhánh ưu tiên
  useEffect(() => {
    const prefs = getUserPreferences();
    if (prefs.focusedBranchId) {
      setSelectedBranch(prefs.focusedBranchId);
    }

    const handlePrefChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && 'focusedBranchId' in detail) {
        setSelectedBranch(detail.focusedBranchId || 'all');
      }
    };

    window.addEventListener(USER_PREFERENCES_EVENT, handlePrefChange);
    return () => window.removeEventListener(USER_PREFERENCES_EVENT, handlePrefChange);
  }, []);

  // Nạp cấu trúc Ngành/Chi chính thức và danh sách thành viên
  useEffect(() => {
    fetch('/api/clan-settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data?.branches)) {
          setClanBranches(res.data.branches);
        }
      })
      .catch(() => {});

    fetch('/api/members')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.members)) {
          setAllMembers(res.members);
        }
      })
      .catch(() => {});
  }, []);

  // Làm phẳng cây phân chi chính thức
  const flattenedBranches = useMemo(() => {
    return flattenBranchTree(clanBranches);
  }, [clanBranches]);

  // Trích xuất danh sách chi phái fallback từ dữ liệu sự kiện
  const fallbackBranches = useMemo(() => {
    const set = new Set<string>();
    dayGroups.forEach((g) => {
      g.members.forEach((m) => {
        if (m.branch_code) set.add(m.branch_code);
      });
    });
    return Array.from(set);
  }, [dayGroups]);

  // Lọc theo tìm kiếm và chi phái (hỗ trợ phân cấp cây Ngành/Chi)
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return dayGroups
      .map((group) => {
        const filteredMembers = group.members.filter((m) => {
          const matchName = m.full_name.toLowerCase().includes(q);

          let matchBranch = true;
          if (selectedBranch !== 'all') {
            if (clanBranches.length > 0 && allMembers.length > 0) {
              const res = resolveMemberBranchHierarchy(m.id, allMembers, clanBranches);
              matchBranch =
                res.matchedBranchIds.includes(selectedBranch) ||
                m.branch_code === selectedBranch;
            } else {
              matchBranch = m.branch_code === selectedBranch;
            }
          }

          return matchName && matchBranch;
        });

        return {
          ...group,
          members: filteredMembers,
        };
      })
      .filter((group) => group.members.length > 0);
  }, [dayGroups, searchQuery, selectedBranch, clanBranches, allMembers]);

  const totalMembersCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.members.length, 0);
  }, [filteredGroups]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* 1. Header / Hero Section */}
      <section className="relative border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md pt-8 pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hiếu Nghĩa Truyền Gia</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Lịch Giỗ Gia Tộc
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Quét và theo dõi ngày giỗ của các bậc tiền nhân trong gia phả theo chuẩn Lịch Âm Việt Nam, tự động thông báo để con cháu hướng về cội nguồn.
              </p>
            </div>

            {/* Thẻ ngày hiện tại Âm - Dương */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Hôm nay: {todayInfo.solarStr} (Dương lịch)
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                  Âm lịch: {todayInfo.lunarStr}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Banner Đăng Ký Web Push */}
          <div className="mt-8">
            <PushNotificationBanner />
          </div>
        </div>
      </section>

      {/* 3. Control & Filter Bar */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          {/* Cụm chọn khoảng thời gian */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Phạm vi:</span>
            </span>
            {[
              { label: '7 ngày tới', value: 7 },
              { label: '15 ngày tới', value: 15 },
              { label: '30 ngày tới', value: 30 },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setDaysRange(tab.value)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  daysRange === tab.value
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tìm kiếm & Chi phái */}
          <div className="flex items-center gap-3">
            {flattenedBranches.length > 0 ? (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 max-w-[210px] truncate"
              >
                <option value="all">Toàn bộ dòng họ</option>
                {flattenedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.depth > 0 ? `${'— '.repeat(b.depth)}${b.fullTitle}` : b.fullTitle}
                  </option>
                ))}
              </select>
            ) : fallbackBranches.length > 0 ? (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Toàn bộ chi phái</option>
                {fallbackBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            ) : null}

            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên cụ..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Thống kê kết quả */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3">
          <span>
            Hiển thị <strong>{totalMembersCount}</strong> ngày giỗ trong {daysRange} ngày tới
          </span>
          {searchQuery && (
            <span>
              Kết quả lọc theo từ khóa: <em>&ldquo;{searchQuery}&rdquo;</em>
            </span>
          )}
        </div>

        {/* 5. Main Content: Danh Sách Timeline */}
        <div className="mt-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Đang tính toán lịch giỗ Âm - Dương...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            /* Empty State */
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-12 text-center max-w-lg mx-auto my-8">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Không có ngày giỗ trong {daysRange} ngày tới
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Trong khoảng thời gian này gia tộc không có ngày giỗ nào. Kính chúc toàn thể gia quyến và con cháu vạn sự an khang, thuận hòa!
              </p>
              <div className="mt-5">
                <Link
                  href="/tree"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Quay về Cây Phả Hệ</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Timeline List */
            <div className="space-y-6">
              {filteredGroups.map((group) => {
                const isToday = group.days_left === 0;
                const isTomorrow = group.days_left === 1;

                return (
                  <div
                    key={group.solar_date_str}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                  >
                    {/* Header Của Ngày */}
                    <div
                      className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
                        isToday
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                          : isTomorrow
                          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Countdown Badge */}
                        {isToday ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-rose-600 shadow-sm animate-pulse">
                            <Flame className="w-3.5 h-3.5" />
                            HÔM NAY
                          </span>
                        ) : isTomorrow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-400/80 shadow-sm">
                            <Star className="w-3.5 h-3.5" />
                            NGÀY MAI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60">
                            <Clock className="w-3 h-3" />
                            Còn {group.days_left} ngày
                          </span>
                        )}

                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            Ngày {group.lunar_day < 10 ? '0' : ''}{group.lunar_day}/{group.lunar_month < 10 ? '0' : ''}{group.lunar_month} Âm lịch ({group.lunar_year_name})
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">
                            · Dương lịch: {group.solar_day < 10 ? '0' : ''}{group.solar_day}/{group.solar_month < 10 ? '0' : ''}{group.solar_month}/{group.solar_year}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-slate-400">
                        {group.members.length} người giỗ
                      </span>
                    </div>

                    {/* Danh Sách Người Giỗ Trong Ngày */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {group.members.map((member: AnniversaryMemberItem) => {
                        const isMale = member.gender === 'male';

                        return (
                          <div
                            key={member.id}
                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 tracking-wider ${
                                  isMale
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    : 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                                }`}
                              >
                                {member.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={member.avatar_url}
                                    alt={member.full_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  getMemberInitials(member.full_name)
                                )}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                    {member.full_name}
                                  </h4>

                                  {/* Huy hiệu quan hệ thân tộc tương đối */}
                                  {member.relative_kinship && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                      <Users className="w-3 h-3" />
                                      {member.relative_kinship}
                                    </span>
                                  )}

                                  {/* Tag Đời & Ngành/Chi Tự Động */}
                                  {(() => {
                                    const branchRes =
                                      clanBranches.length > 0 && allMembers.length > 0
                                        ? resolveMemberBranchHierarchy(member.id, allMembers, clanBranches)
                                        : null;

                                    if (branchRes && branchRes.branchPath) {
                                      return (
                                        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                          Đời {member.generation} · {branchRes.branchPath}
                                        </span>
                                      );
                                    }

                                    return (
                                      <>
                                        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                          Đời thứ {member.generation}
                                        </span>
                                        {member.branch_code && (
                                          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {member.branch_code}
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                  {member.birth_year && member.death_year ? (
                                    <span>
                                      Sinh {member.birth_year} — Mất {member.death_year}{' '}
                                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                                        (Hưởng thọ {member.death_year - member.birth_year + 1} tuổi)
                                      </span>
                                    </span>
                                  ) : member.birth_year ? (
                                    <span>Sinh năm {member.birth_year}</span>
                                  ) : member.death_year ? (
                                    <span>Mất năm {member.death_year}</span>
                                  ) : (
                                    <span className="italic text-slate-400">Chưa rõ năm sinh - mất</span>
                                  )}

                                  {member.death_lunar_is_leap && (
                                    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                      Tháng nhuận
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Button: Điều hướng sang cây gia phả */}
                            <div className="flex items-center self-end sm:self-center flex-shrink-0">
                              <Link
                                href={`/tree?focus=${member.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all"
                              >
                                <GitBranch className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Xem trên Cây</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
