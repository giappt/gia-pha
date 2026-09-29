'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Flame,
  Star,
  Users,
  Smartphone,
  Monitor,
  Maximize2,
  Sun,
  Moon,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  History,
} from 'lucide-react';
import FamilyTreeIcon from '@/components/icons/FamilyTreeIcon';

// Mock data mô phỏng các kịch bản thực tế của dòng họ
interface MockAnniversaryMember {
  id: string;
  fullName: string;
  honorific?: string;
  generation: number;
  branchName?: string;
  birthYear?: number;
  deathYear?: number;
  relativeKinship?: string;
  gender: 'male' | 'female';
  avatarUrl?: string;
}

interface MockAnniversaryGroup {
  solarDay: number;
  solarMonth: number;
  solarYear: number;
  solarDayOfWeek: string;
  lunarDay: number;
  lunarMonth: number;
  lunarYearCanChi: string;
  daysLeft: number;
  members: MockAnniversaryMember[];
}

const MOCK_SCENARIOS: Record<string, MockAnniversaryGroup> = {
  single_today: {
    solarDay: 29,
    solarMonth: 9,
    solarYear: 2026,
    solarDayOfWeek: 'Thứ Ba',
    lunarDay: 19,
    lunarMonth: 8,
    lunarYearCanChi: 'Năm Bính Ngọ',
    daysLeft: 0,
    members: [
      {
        id: 'm1',
        fullName: 'Nguyễn Thị Hiến',
        honorific: 'Cụ',
        generation: 4,
        branchName: 'Chi 1',
        gender: 'female',
        relativeKinship: 'Cụ Bà Thủy Tổ',
      },
    ],
  },
  dual_tomorrow: {
    solarDay: 30,
    solarMonth: 9,
    solarYear: 2026,
    solarDayOfWeek: 'Thứ Tư',
    lunarDay: 20,
    lunarMonth: 8,
    lunarYearCanChi: 'Năm Bính Ngọ',
    daysLeft: 1,
    members: [
      {
        id: 'm2',
        fullName: 'Phạm Văn Cường',
        honorific: 'Ông',
        generation: 11,
        branchName: 'Chi 1 - Trưởng',
        birthYear: 1948,
        deathYear: 2020,
        gender: 'male',
        relativeKinship: 'Ông nội',
      },
      {
        id: 'm3',
        fullName: 'Nguyễn Thị Chăm',
        honorific: 'Bà',
        generation: 11,
        branchName: 'Chi 1 - Trưởng',
        birthYear: 1952,
        deathYear: 2019,
        gender: 'female',
        relativeKinship: 'Bà nội',
      },
    ],
  },
  triple_upcoming: {
    solarDay: 6,
    solarMonth: 10,
    solarYear: 2026,
    solarDayOfWeek: 'Thứ Ba',
    lunarDay: 26,
    lunarMonth: 8,
    lunarYearCanChi: 'Năm Bính Ngọ',
    daysLeft: 7,
    members: [
      {
        id: 'm4',
        fullName: 'Phạm Văn Huân',
        honorific: 'Cụ',
        generation: 3,
        branchName: 'Chi 2',
        birthYear: 1890,
        deathYear: 1965,
        gender: 'male',
        relativeKinship: 'Cụ Cố',
      },
      {
        id: 'm5',
        fullName: 'Lê Thị Đào',
        honorific: 'Cụ',
        generation: 3,
        branchName: 'Chi 2',
        birthYear: 1894,
        deathYear: 1970,
        gender: 'female',
        relativeKinship: 'Cụ Bà Cố',
      },
      {
        id: 'm6',
        fullName: 'Phạm Văn Phúc',
        honorific: 'Bác',
        generation: 12,
        branchName: 'Chi 2',
        birthYear: 1965,
        deathYear: 2022,
        gender: 'male',
        relativeKinship: 'Bác họ',
      },
    ],
  },
};

/**
 * Component Tờ Lịch Bloc Thu Nhỏ Neo-Heritage
 * Đảm bảo kích thước cố định, khóa cứng tỷ lệ, TUYỆT ĐỐI không bị dãn khi bên phải có nhiều người!
 */
function CalendarBlocItem({
  group,
  compact = false,
}: {
  group: MockAnniversaryGroup;
  compact?: boolean;
}) {
  const isToday = group.daysLeft === 0;
  const isTomorrow = group.daysLeft === 1;

  // Tông màu phân tầng
  const headerBg = isToday
    ? 'bg-rose-600 text-white'
    : isTomorrow
      ? 'bg-amber-500 text-amber-950'
      : 'bg-emerald-700 text-white';

  const cardBorder = isToday
    ? 'border-rose-300 dark:border-rose-900/60 shadow-rose-500/10'
    : isTomorrow
      ? 'border-amber-300 dark:border-amber-900/60 shadow-amber-500/10'
      : 'border-slate-200 dark:border-slate-800 shadow-slate-500/5';

  const lunarColor = isToday
    ? 'text-rose-600 dark:text-rose-400'
    : isTomorrow
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-700 dark:text-emerald-400';

  return (
    <div
      className={`shrink-0 self-start flex flex-col rounded-2xl border bg-white dark:bg-slate-900/90 shadow-md overflow-hidden transition-all select-none ${
        compact ? 'w-[110px]' : 'w-[124px] sm:w-[136px]'
      } ${cardBorder}`}
    >
      {/* 1. Header tờ lịch */}
      <div
        className={`px-2 py-1.5 text-center flex items-center justify-between text-[11px] font-black uppercase tracking-wider ${headerBg}`}
      >
        <span>Tháng {group.solarMonth < 10 ? `0${group.solarMonth}` : group.solarMonth}</span>
        <span>{group.solarYear}</span>
      </div>

      {/* 2. Thân Dương Lịch */}
      <div className="py-2.5 px-2 text-center bg-linear-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-850">
        <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
          {group.solarDay < 10 ? `0${group.solarDay}` : group.solarDay}
        </div>
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase">
          {group.solarDayOfWeek}
        </div>
      </div>

      {/* 3. Vết răng cưa xé lịch (Perforation Hairline) */}
      <div className="relative border-t-2 border-dashed border-slate-200 dark:border-slate-700 my-0.5">
        <span className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
        <span className="absolute -right-1.5 -top-1.5 w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
      </div>

      {/* 4. Thân Âm Lịch */}
      <div className="py-2 px-1 text-center bg-slate-50/80 dark:bg-slate-900/60">
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-xl sm:text-2xl font-black leading-none ${lunarColor}`}>
            {group.lunarDay < 10 ? `0${group.lunarDay}` : group.lunarDay}
          </span>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            tháng {group.lunarMonth < 10 ? `0${group.lunarMonth}` : group.lunarMonth}
          </span>
        </div>
        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
          {group.lunarYearCanChi}
        </div>
      </div>

      {/* 5. Chân tờ lịch: Huy hiệu Countdown */}
      <div
        className={`py-1 px-1.5 text-center text-[10px] font-bold border-t flex items-center justify-center gap-1 ${
          isToday
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/40 animate-pulse'
            : isTomorrow
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
        }`}
      >
        {isToday ? (
          <>
            <Flame className="w-3 h-3" /> HÔM NAY
          </>
        ) : isTomorrow ? (
          <>
            <Star className="w-3 h-3" /> NGÀY MAI
          </>
        ) : (
          <>
            <Clock className="w-3 h-3" /> Còn {group.daysLeft} ngày
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Prototype Trang Chủ: Thẻ Ngang Spotlight Lịch Giỗ Gần Nhất
 */
function HomeSpotlightPrototype({
  group,
  isMobileView,
}: {
  group: MockAnniversaryGroup;
  isMobileView: boolean;
}) {
  const isToday = group.daysLeft === 0;
  const isTomorrow = group.daysLeft === 1;

  const containerBg = isToday
    ? 'bg-gradient-to-br from-rose-50/90 via-white to-amber-50/40 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20 border-rose-200/90 dark:border-rose-900/50 shadow-lg shadow-rose-500/5'
    : isTomorrow
      ? 'bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-emerald-950/20 border-amber-200/90 dark:border-amber-900/50 shadow-lg shadow-amber-500/5'
      : 'bg-gradient-to-br from-emerald-50/90 via-white to-slate-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-emerald-200/90 dark:border-emerald-900/50 shadow-lg shadow-emerald-500/5';

  return (
    <div className={`w-full rounded-3xl border p-5 sm:p-6 transition-all ${containerBg}`}>
      {/* Header bar của thẻ Spotlight */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Ngày Giỗ Gần Nhất
          </h3>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            · {group.members.length} người giỗ
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isToday
              ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800 animate-pulse'
              : isTomorrow
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
          }`}
        >
          {isToday ? (
            <>
              <Flame className="w-3.5 h-3.5" /> Hôm nay là Ngày Giỗ
            </>
          ) : isTomorrow ? (
            <>
              <Star className="w-3.5 h-3.5" /> Ngày mai là Ngày Giỗ
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" /> Còn {group.daysLeft} ngày nữa
            </>
          )}
        </span>
      </div>

      {/* Thân thẻ: Bố cục Dàn Ngang (Cột Lịch Bloc bên trái + Cột Người Giỗ bên phải) */}
      <div className={`flex ${isMobileView ? 'flex-col gap-4' : 'flex-row items-start gap-6'}`}>
        {/* CỘT TRÁI: TỜ LỊCH BLOC (Khóa cứng kích thước, tự đứng vững, 0% bị kéo dãn!) */}
        <div className="flex flex-col items-center">
          <CalendarBlocItem group={group} compact={isMobileView} />
          <span className="text-[10px] text-slate-400 font-medium mt-1.5 text-center hidden sm:block">
            Tờ lịch bloc
          </span>
        </div>

        {/* CỘT PHẢI: DANH SÁCH NGƯỜI GIỖ (Nếu có 2 người, hiển thị cả 2 người phẳng phiu!) */}
        <div className="flex-1 w-full divide-y divide-slate-100 dark:divide-slate-800/80">
          {group.members.map((member, idx) => {
            const isMale = member.gender === 'male';

            return (
              <div
                key={member.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  idx > 0 ? 'pt-4 mt-4' : ''
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar / Chân dung */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border ${
                      isMale
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {member.fullName
                      .split(' ')
                      .slice(-2)
                      .map((n) => n[0])
                      .join('')}
                  </div>

                  <div>
                    {/* Tên thành viên + Huy hiệu danh xưng */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {member.honorific ? `${member.honorific} ` : ''}
                        {member.fullName}
                      </h4>

                      {member.relativeKinship && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          <Users className="w-3 h-3" />
                          {member.relativeKinship}
                        </span>
                      )}
                    </div>

                    {/* Typography Hierarchy: Đời thứ · Chi nhánh · Tuổi thọ */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Đời thứ {member.generation}
                      </span>
                      {member.branchName && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span>{member.branchName}</span>
                        </>
                      )}
                      {member.birthYear && member.deathYear ? (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            Hưởng thọ {member.deathYear - member.birthYear} tuổi ({member.birthYear} -{' '}
                            {member.deathYear})
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-slate-400 italic">Chưa rõ năm sinh - mất</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nút Xem trên Cây riêng cho từng cụ */}
                <div className="sm:self-center shrink-0">
                  <Link
                    href="/tree"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 w-full sm:w-auto"
                  >
                    <FamilyTreeIcon className="w-3.5 h-3.5" />
                    <span>Xem trên Cây</span>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Footer liên kết nhanh sang toàn bộ lịch giỗ */}
          <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Đồng bộ theo Lịch Âm truyền thống Việt Nam (UTC+7)
            </span>
            <Link
              href="/anniversaries"
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              <span>Xem lịch giỗ cả năm ({group.members.length > 1 ? '12 sự kiện' : '15 sự kiện'})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Prototype Trang Danh Sách Lịch Giỗ (/anniversaries): Cột Ngày Bên Trái
 */
function AnniversariesListPrototype({ isMobileView }: { isMobileView: boolean }) {
  const groups = [
    MOCK_SCENARIOS.single_today,
    MOCK_SCENARIOS.dual_tomorrow,
    MOCK_SCENARIOS.triple_upcoming,
  ];

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const isToday = group.daysLeft === 0;
        const isTomorrow = group.daysLeft === 1;

        const cardBorder = isToday
          ? 'border-rose-200 dark:border-rose-900/50 shadow-rose-500/5'
          : isTomorrow
            ? 'border-amber-200 dark:border-amber-900/50 shadow-amber-500/5'
            : 'border-slate-200/80 dark:border-slate-800/80 shadow-slate-500/5';

        return (
          <div
            key={group.solarDay}
            className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5 transition-all ${cardBorder}`}
          >
            {/* Bố cục 2 Cột: Cột Ngày Bên Trái + Cột Danh Sách Người Giỗ Bên Phải */}
            <div className={`flex ${isMobileView ? 'flex-col gap-4' : 'flex-row items-start gap-5'}`}>
              {/* CỘT TRÁI: LỊCH BLOC ĐỘC LẬP - NEO CHẶT Ở ĐỈNH, KHÔNG BỊ KÉO DÃN! */}
              <div className="flex flex-col items-center">
                <CalendarBlocItem group={group} compact={isMobileView} />
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  {group.members.length} người giỗ
                </span>
              </div>

              {/* CỘT PHẢI: NỘI DUNG NGƯỜI GIỖ - ÂM LỊCH & DƯƠNG LỊCH KHÔNG BỊ LẶP LẠI */}
              <div className="flex-1 w-full divide-y divide-slate-100 dark:divide-slate-800">
                {group.members.map((member, idx) => {
                  const isMale = member.gender === 'male';

                  return (
                    <div
                      key={member.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        idx > 0 ? 'pt-4 mt-4' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isMale
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {member.fullName
                            .split(' ')
                            .slice(-2)
                            .map((n) => n[0])
                            .join('')}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {member.honorific ? `${member.honorific} ` : ''}
                              {member.fullName}
                            </h4>

                            {member.relativeKinship && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                <Users className="w-3 h-3" />
                                {member.relativeKinship}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Đời thứ {member.generation}
                            </span>
                            {member.branchName && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                <span>{member.branchName}</span>
                              </>
                            )}
                            {member.birthYear && member.deathYear ? (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  Hưởng thọ {member.deathYear - member.birthYear} tuổi ({member.birthYear} -{' '}
                                  {member.deathYear})
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">·</span>
                                <span className="text-slate-400 italic">Chưa rõ năm sinh - mất</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="sm:self-center shrink-0">
                        <Link
                          href="/tree"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors w-full sm:w-auto"
                        >
                          <FamilyTreeIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Xem trên Cây</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PrototypeAnniversaryPage() {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile' | 'responsive'>('desktop');
  const [pageTab, setPageTab] = useState<'home' | 'list'>('home');
  const [scenarioKey, setScenarioKey] = useState<string>('dual_tomorrow');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const currentGroup = MOCK_SCENARIOS[scenarioKey] || MOCK_SCENARIOS.dual_tomorrow;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'} py-8 px-4 sm:px-6`}>
      {/* 1. Header Toolbar Điều Khiển Prototype */}
      <div className="max-w-5xl mx-auto mb-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white">
              PROTOTYPE
            </span>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">
              Trực Quan Hóa Lịch Bloc Gia Tộc (PC & Mobile)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kiểm tra tỷ lệ tờ lịch bloc, bố cục cột trái, tính chống méo và trải nghiệm đa màn hình.
          </p>
        </div>

        {/* Cụm công tắc điều khiển */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chuyển đổi Thiết bị: PC vs Mobile vs Responsive */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC / Laptop</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (390px)</span>
            </button>
            <button
              onClick={() => setDeviceMode('responsive')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                deviceMode === 'responsive'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Tự do</span>
            </button>
          </div>

          {/* Nút bật/tắt Dark Mode */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title="Đổi Chế Độ Sáng / Tối"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* 2. Sub-Toolbar: Chọn Màn Hình (Home vs Lịch Giỗ) & Kịch Bản Số Lượng Người */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tab chuyển trang */}
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-slate-200 dark:border-slate-800 pb-2 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={() => setPageTab('home')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              pageTab === 'home'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            🏠 1. Thẻ Trang Chủ (Home Spotlight)
          </button>
          <button
            onClick={() => setPageTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              pageTab === 'list'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            📅 2. Trang Danh Sách Lịch Giỗ (/anniversaries)
          </button>
        </div>

        {/* Dropdown / Chips chọn kịch bản số người (cho tab Home) */}
        {pageTab === 'home' && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Kịch bản:</span>
            <button
              onClick={() => setScenarioKey('single_today')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                scenarioKey === 'single_today'
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-300'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              1 Người (Hôm nay)
            </button>
            <button
              onClick={() => setScenarioKey('dual_tomorrow')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                scenarioKey === 'dual_tomorrow'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              2 Người (Trùng ngày giỗ)
            </button>
            <button
              onClick={() => setScenarioKey('triple_upcoming')}
              className={`px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                scenarioKey === 'triple_upcoming'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              3 Người (7 ngày tới)
            </button>
          </div>
        )}
      </div>

      {/* 3. KHU VỰC HIỂN THỊ CHÍNH (PREVIEW CANVAS) */}
      <div className="max-w-5xl mx-auto">
        {deviceMode === 'mobile' ? (
          /* Khung mô phỏng điện thoại iPhone 15 Pro (390px) */
          <div className="flex flex-col items-center py-4">
            <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Khung nhìn Mobile thực tế (Width: 390px)</span>
            </div>
            <div className="w-[390px] min-h-[640px] max-h-[820px] bg-white dark:bg-slate-900 rounded-[44px] border-[10px] border-slate-900 dark:border-slate-800 shadow-2xl p-4 overflow-y-auto relative">
              {/* Dynamic Island */}
              <div className="w-24 h-4 bg-slate-900 dark:bg-slate-800 rounded-full mx-auto mb-4" />

              {pageTab === 'home' ? (
                <HomeSpotlightPrototype group={currentGroup} isMobileView={true} />
              ) : (
                <AnniversariesListPrototype isMobileView={true} />
              )}
            </div>
          </div>
        ) : deviceMode === 'desktop' ? (
          /* Khung nhìn PC / Laptop chuẩn (Width max-w-3xl) */
          <div className="max-w-3xl mx-auto py-4">
            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                <span>Khung nhìn Desktop Thẻ Ngang (max-w-3xl)</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                ✓ Khối lịch bloc bên trái neo đỉnh tự nhiên (self-start), 0% bị kéo dãn!
              </span>
            </div>

            {pageTab === 'home' ? (
              <HomeSpotlightPrototype group={currentGroup} isMobileView={false} />
            ) : (
              <AnniversariesListPrototype isMobileView={false} />
            )}
          </div>
        ) : (
          /* Khung nhìn Responsive Tự Do */
          <div className="w-full py-4">
            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Chế độ tự do (Kéo giãn cửa sổ trình duyệt để kiểm tra Breakpoint)</span>
            </div>
            {pageTab === 'home' ? (
              <HomeSpotlightPrototype group={currentGroup} isMobileView={false} />
            ) : (
              <AnniversariesListPrototype isMobileView={false} />
            )}
          </div>
        )}
      </div>

      {/* 4. BẢNG PHÂN TÍCH THIẾT KẾ & GIẢI ĐÁP KỸ THUẬT (INSPECTOR HIGHLIGHTS) */}
      <div className="max-w-3xl mx-auto mt-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>Giải Pháp Cho 3 Vấn Đề Bạn Đã Nêu</span>
        </h3>

        <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">1. Cột bên trái có bị kéo dài ra không?</strong>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Nhờ sử dụng <code>shrink-0 self-start</code> và khóa cứng tỷ lệ vàng <code>w-[124px]</code>, tờ lịch bloc luôn neo vững chãi ở góc trên bên trái. Kể cả khi bên phải có 2 hay 3 người giỗ (chiều cao cột phải phình to), tờ lịch bloc bên trái vẫn giữ trọn vẹn 100% hình dạng chuẩn, tuyệt đối không bị méo hay kéo dãn.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">2. Ngày có 2 người giỗ thì thế nào?</strong>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Ở cả thẻ Home lẫn danh sách Lịch Giỗ, 2 cụ cùng giỗ chia sẻ chung 1 tờ lịch bloc duy nhất. Cột bên phải phân thành 2 hàng trang nhã (ngăn cách bởi đường hairline siêu mảnh). Cả 2 cụ đều có Avatar, Họ tên, Đời thứ và nút <em>Xem trên Cây</em> riêng biệt, không ai bị giấu!
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">3. Tông màu và sự lặp lại âm - dương:</strong>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Tông màu chuẩn: <strong>Hôm nay Đỏ</strong> (rực rỡ, trang nghiêm) $\rightarrow$ <strong>Ngày mai Vàng</strong> (ấm áp, chuẩn bị) $\rightarrow$ <strong>Ngày khác Bình thường</strong> (xanh ngọc / slate). Vì Dương lịch và Âm lịch đã nằm trọn vẹn và nổi bật ở tờ lịch bloc bên trái, cột bên phải hoàn toàn không bị lặp lại ngày tháng nữa!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
