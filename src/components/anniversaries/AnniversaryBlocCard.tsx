'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Star, Clock, ArrowRight } from 'lucide-react';
import type { AnniversaryDayGroup } from '@/types/anniversary';
import { formatSolarDateWithDayOfWeek } from '@/lib/anniversaries/anniversary-engine';
import { MOCK_ANNIVERSARY_GROUP_TODAY, MOCK_ANNIVERSARY_GROUP_UPCOMING } from '@/fixtures/anniversary-fixtures';

interface AnniversaryBlocCardProps {
  group: AnniversaryDayGroup;
}

export default function AnniversaryBlocCard({ group }: AnniversaryBlocCardProps) {
  const isToday = group.days_left === 0;
  const isTomorrow = group.days_left === 1;

  const statusText = isToday
    ? 'Hôm nay giỗ'
    : isTomorrow
      ? 'Ngày mai giỗ'
      : `Còn ${group.days_left} ngày`;

  const statusColor = isToday
    ? 'text-red-600 dark:text-red-400'
    : isTomorrow
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-600 dark:text-slate-400';

  const headerBg = isToday
    ? 'bg-red-600 text-white font-black'
    : isTomorrow
      ? 'bg-amber-400 text-slate-950 font-black'
      : 'bg-emerald-800 text-white font-bold';

  // Format thứ
  const solarFull = formatSolarDateWithDayOfWeek(group.solar_year, group.solar_month, group.solar_day);
  const dayOfWeek = solarFull.split(',')[0] || '';

  const monthNames = [
    '', 'Một', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Mười Hai'
  ];
  const monthWord = monthNames[group.solar_month] || `${group.solar_month}`;

  return (
    <div className="w-full max-w-3xl mx-auto rounded-card border border-slate-300/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden">
      {/* 1. Phiên bản Desktop (md+): Dàn ngang 2 nửa liền mạch */}
      <div className="hidden md:flex flex-row items-stretch">
        {/* Nửa trái: Cột Lịch Bloc 185px fit khít 3 mép */}
        <div className="w-[185px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col select-none">
          {/* Header Tháng / Năm */}
          <div className={`px-4 py-2 flex items-center justify-between text-xs tracking-wide shrink-0 ${headerBg}`}>
            <span>Tháng {monthWord}</span>
            <span>{group.solar_year}</span>
          </div>

          {/* Số ngày Dương lịch to đậm */}
          <div className="py-4 text-center bg-white dark:bg-slate-900 shrink-0">
            <div className="text-6xl sm:text-7xl font-black text-slate-950 dark:text-white tracking-tighter leading-none">
              {group.solar_day < 10 ? `0${group.solar_day}` : group.solar_day}
            </div>
            <div className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-300 mt-1.5">
              {dayOfWeek}
            </div>
          </div>

          {/* Răng cưa xé lịch */}
          <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-700 mx-3 shrink-0" />

          {/* Thân Âm Lịch (Bố cục Lệch Trái 2 Dòng: Số ngày căn trái cao 2 dòng, bên phải là tháng ở trên và năm ở dưới) */}
          <div className="py-2.5 px-3 flex items-center justify-center bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-2">
              {/* Số ngày căn trái cao 2 dòng */}
              <span className="text-3xl font-black text-red-600 dark:text-red-400 leading-none tracking-tight">
                {group.lunar_day < 10 ? `0${group.lunar_day}` : group.lunar_day}
              </span>
              {/* Bên phải: Trên là tháng, dưới là năm */}
              <div className="flex flex-col justify-center text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  tháng {group.lunar_month} âm lịch
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Năm {group.lunar_year_name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-900" />
        </div>

        {/* Nửa phải: Thông tin người giỗ và nút hành động */}
        <div className="flex-1 p-5 flex flex-col justify-between bg-stone-50/60 dark:bg-slate-850/40">
          <div>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${statusColor}`}>
              {isToday ? <Flame className="w-3.5 h-3.5" /> : isTomorrow ? <Star className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{statusText}</span>
            </div>

            <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {group.members.map((member, idx) => (
                <div key={member.id} className={`${idx > 0 ? 'pt-3 mt-3' : ''}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white leading-snug">
                      {member.display_name || (member.honorific_prefix ? `${member.honorific_prefix} ${member.full_name}` : member.full_name)}
                    </h3>
                    {member.relative_kinship && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                        {member.relative_kinship}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1 flex-wrap">
                    <span>Đời thứ {member.generation}</span>
                    {(member.branch_path || member.branch_name) && (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        · {member.branch_path || member.branch_name}
                      </span>
                    )}
                    {member.birth_year && member.death_year && (
                      <span>· Hưởng thọ {member.death_year - member.birth_year}t</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
            <Link
              href={`/tree?focusId=${group.members[0]?.id || ''}`}
              className="flex-1 py-2.5 px-4 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Xem trên cây gia phả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Phiên bản Mobile (< md): Thẻ dọc cuốn lịch bloc nguyên bản */}
      <div className="md:hidden flex flex-col w-full">
        {/* Header Cuốn Lịch */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-xs tracking-wide ${headerBg}`}>
          <span>Tháng {monthWord}</span>
          <span>{group.solar_year}</span>
        </div>

        {/* Thân Dương Lịch */}
        <div className="py-5 sm:py-6 text-center bg-white dark:bg-slate-900">
          <div className="text-7xl sm:text-8xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
            {group.solar_day < 10 ? `0${group.solar_day}` : group.solar_day}
          </div>
          <div className="text-base sm:text-lg font-bold tracking-wide text-slate-800 dark:text-slate-200 mt-2">
            {dayOfWeek}
          </div>
        </div>

        {/* Răng cưa xé lịch */}
        <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-700 mx-4" />

        {/* Thân Âm Lịch (Bố cục Dàn Ngang 2 Mép chuẩn theo ảnh: Trái là ngày & tháng, Phải là năm) */}
        <div className="py-2.5 px-4 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">
              {group.lunar_day < 10 ? `0${group.lunar_day}` : group.lunar_day}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              tháng {group.lunar_month} âm lịch
            </span>
          </div>
          <div className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Năm <span className="font-bold text-slate-800 dark:text-slate-200">{group.lunar_year_name}</span>
          </div>
        </div>

        {/* Danh sách người giỗ ở dưới */}
        <div className="p-4 bg-stone-50/80 dark:bg-slate-850/60 border-t border-slate-200 dark:border-slate-800">
          <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${statusColor}`}>
            {isToday ? <Flame className="w-3.5 h-3.5" /> : isTomorrow ? <Star className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{statusText}</span>
          </div>

          <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {group.members.map((member, idx) => (
              <div key={member.id} className={`${idx > 0 ? 'pt-2.5 mt-2.5' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-950 dark:text-white leading-snug">
                    {member.display_name || (member.honorific_prefix ? `${member.honorific_prefix} ${member.full_name}` : member.full_name)}
                  </h3>
                  {member.relative_kinship && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                      {member.relative_kinship}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span>Đời thứ {member.generation}</span>
                  {(member.branch_path || member.branch_name) && (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      · {member.branch_path || member.branch_name}
                    </span>
                  )}
                  {member.birth_year && member.death_year && (
                    <span>· Hưởng thọ {member.death_year - member.birth_year}t</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-2">
            <Link
              href={`/tree?focusId=${group.members[0]?.id || ''}`}
              className="w-full py-2.5 px-4 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Xem trên cây gia phả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sub-component phục vụ Live Preview trên trang Quản trị (/admin/theme)
 * và Storybook/Tests. Tái sử dụng 100% component thật với fixture chuẩn SSOT.
 */
export function AnniversaryBlocCardPreview({
  variant = 'today',
}: {
  variant?: 'today' | 'upcoming';
}) {
  const group = variant === 'today' ? MOCK_ANNIVERSARY_GROUP_TODAY : MOCK_ANNIVERSARY_GROUP_UPCOMING;
  return <AnniversaryBlocCard group={group} />;
}

