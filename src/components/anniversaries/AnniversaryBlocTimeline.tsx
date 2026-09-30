'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Star, Clock } from 'lucide-react';
import type { AnniversaryDayGroup, AnniversaryMemberItem } from '@/types/anniversary';
import { formatSolarDateWithDayOfWeek } from '@/lib/anniversaries/anniversary-engine';
import FamilyTreeIcon from '@/components/icons/FamilyTreeIcon';

interface AnniversaryBlocTimelineProps {
  groups: AnniversaryDayGroup[];
  onSelectMember?: (member: AnniversaryMemberItem) => void;
}

export default function AnniversaryBlocTimeline({
  groups,
  onSelectMember,
}: AnniversaryBlocTimelineProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {groups.map((group) => {
        const isToday = group.days_left === 0;
        const isTomorrow = group.days_left === 1;

        const stampHeaderBg = isToday
          ? 'bg-red-600 text-white font-black'
          : isTomorrow
            ? 'bg-amber-400 text-slate-950 font-black'
            : 'bg-emerald-800 text-white font-bold';

        const statusTag = isToday ? (
          <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> HÔM NAY GIỖ
          </span>
        ) : isTomorrow ? (
          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> NGÀY MAI GIỖ
          </span>
        ) : (
          <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Còn {group.days_left} ngày
          </span>
        );

        const solarFull = formatSolarDateWithDayOfWeek(group.solar_year, group.solar_month, group.solar_day);
        const dayOfWeek = solarFull.split(',')[0] || '';

        return (
          <div
            key={group.solar_date_str}
            className="rounded-card border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            {/* 1. GIAO DIỆN MOBILE (< sm): CHUẨN XÁC THEO WIREFRAME ĐÃ DUYỆT */}
            <div className="sm:hidden flex flex-col">
              {/* Header đỉnh: Icon lịch 58px chạm 2 mép + 3 dòng thông tin */}
              <div className="flex items-stretch border-b border-slate-100 dark:border-slate-800">
                {/* Icon lịch chạm mép trên và mép trái (76px to rõ chuẩn tờ lịch bloc) */}
                <div className="w-[76px] shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between text-center select-none overflow-hidden">
                  <div className={`py-1.5 text-xs font-black uppercase tracking-wider text-center shrink-0 ${stampHeaderBg}`}>
                    T.{group.solar_month < 10 ? `0${group.solar_month}` : group.solar_month}
                  </div>
                  <div className="py-2 flex-1 flex flex-col justify-center items-center">
                    <div className="text-3xl font-black text-slate-950 dark:text-white leading-none py-0.5">
                      {group.solar_day < 10 ? `0${group.solar_day}` : group.solar_day}
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mt-1 tracking-wider">
                      {dayOfWeek}
                    </div>
                  </div>
                </div>

                {/* 3 dòng thông tin ngày giỗ bên phải */}
                <div className="flex-1 px-3.5 py-2 flex flex-col justify-center bg-stone-50/40 dark:bg-slate-850/20">
                  {/* Dòng 1: Countdown Tag */}
                  <div className="text-xs font-black uppercase tracking-wide">
                    {statusTag}
                  </div>

                  {/* Dòng 2: Ngày Âm lịch to đậm */}
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span className="text-red-600 dark:text-red-400 font-black">
                      {group.lunar_day}/{group.lunar_month}
                    </span>
                    <span>Âm Lịch</span>
                  </div>

                  {/* Dòng 3: Số lượng người giỗ */}
                  <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    {group.members.length} người giỗ
                  </div>
                </div>
              </div>

              {/* Danh sách người giỗ full width */}
              <div className="p-3.5 divide-y divide-slate-100 dark:divide-slate-800">
                {group.members.map((member, idx) => (
                  <div
                    key={member.id}
                    className={`${idx > 0 ? 'pt-3 mt-3' : 'pt-0'} flex flex-col gap-1.5`}
                  >
                    {/* Tên cụ tràn 100% bề ngang không bị cắt */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-950 dark:text-white leading-snug">
                        {member.display_name || (member.honorific_prefix ? `${member.honorific_prefix} ${member.full_name}` : member.full_name)}
                      </h4>
                      {member.relative_kinship && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                          {member.relative_kinship}
                        </span>
                      )}
                    </div>

                    {/* Hàng dưới: Thế hệ bên trái, Xem Cây neo góc phải */}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Đời {member.generation}
                        </span>
                        {(member.branch_path || member.branch_name) && (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            · {member.branch_path || member.branch_name}
                          </span>
                        )}
                        {member.birth_year && member.death_year && (
                          <span>· Hưởng thọ {member.death_year - member.birth_year}t</span>
                        )}
                      </div>

                      <Link
                        href={`/tree?focusId=${member.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800 transition-colors shrink-0 shadow-xs"
                      >
                        <FamilyTreeIcon className="w-3.5 h-3.5" />
                        <span>Xem Cây</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. GIAO DIỆN DESKTOP (sm+): CỘT LỊCH 90PX FIT KHÍT 3 MÉP */}
            <div className="hidden sm:flex items-stretch">
              {/* Cột lịch bên trái (90px) */}
              <div className="w-[90px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between text-center select-none overflow-hidden">
                <div className={`py-1.5 text-[11px] font-black uppercase tracking-wider text-center shrink-0 ${stampHeaderBg}`}>
                  Tháng {group.solar_month < 10 ? `0${group.solar_month}` : group.solar_month}
                </div>

                <div className="py-2.5 flex-1 flex flex-col justify-center items-center">
                  <div className="text-3xl font-black text-slate-950 dark:text-white leading-none">
                    {group.solar_day < 10 ? `0${group.solar_day}` : group.solar_day}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">
                    {dayOfWeek}
                  </div>
                </div>

                <div className="py-1 px-1 text-center shrink-0 border-t border-slate-100 dark:border-slate-800 select-none">
                  <span className="text-red-600 dark:text-red-400 font-black text-xs">
                    {group.lunar_day}/{group.lunar_month}
                  </span>{' '}
                  <span className="text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                    Âm Lịch
                  </span>
                </div>
              </div>

              {/* Nửa bên phải: Header & Danh sách người giỗ */}
              <div className="flex-1 flex flex-col justify-between">
                {/* Header thanh lịch */}
                <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-stone-50/50 dark:bg-slate-850/30">
                  <div className="flex items-center gap-2">
                    {statusTag}
                  </div>

                  <span className="text-xs text-slate-400">
                    {group.members.length} người giỗ
                  </span>
                </div>

                {/* Danh sách người giỗ */}
                <div className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
                  {group.members.map((member, idx) => (
                    <div
                      key={member.id}
                      className={`${idx > 0 ? 'pt-3.5 mt-3.5' : 'pt-0'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {member.display_name || (member.honorific_prefix ? `${member.honorific_prefix} ${member.full_name}` : member.full_name)}
                          </h4>
                          {member.relative_kinship && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                              {member.relative_kinship}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
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

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          href={`/tree?focusId=${member.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800 transition-colors shadow-xs"
                        >
                          <FamilyTreeIcon className="w-3.5 h-3.5" />
                          <span>Xem Cây</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
