'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Flame,
  Star,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import FamilyTreeIcon from '@/components/icons/FamilyTreeIcon';

interface MockMember {
  id: string;
  fullName: string;
  honorific?: string;
  generation: number;
  branchName?: string;
  birthYear?: number;
  deathYear?: number;
  relativeKinship?: string;
}

interface MockAnnivDay {
  solarDay: number;
  solarMonth: number;
  solarYear: number;
  solarDayOfWeek: string;
  lunarDay: number;
  lunarMonth: number;
  lunarYearCanChi: string;
  daysLeft: number;
  members: MockMember[];
}

const MOCK_DATA: Record<string, MockAnnivDay> = {
  single_today: {
    solarDay: 29,
    solarMonth: 9,
    solarYear: 2026,
    solarDayOfWeek: 'Thứ Ba',
    lunarDay: 19,
    lunarMonth: 8,
    lunarYearCanChi: 'Bính Ngọ',
    daysLeft: 0,
    members: [
      {
        id: 'm1',
        fullName: 'Nguyễn Thị Hiến',
        honorific: 'Cụ',
        generation: 4,
        branchName: 'Chi 1',
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
    lunarYearCanChi: 'Bính Ngọ',
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
    lunarYearCanChi: 'Bính Ngọ',
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
        relativeKinship: 'Bác họ',
      },
    ],
  },
};

/**
 * COMPONENT TỜ LỊCH BLOC NGUYÊN BẢN (FIT KHÍT 100% 3 MÉP)
 * - KÉO PHẦN ÂM LỊCH LÊN CỐ ĐỊNH NGAY DƯỚI DƯƠNG LỊCH!
 * - Tuyệt đối không để khoảng trắng dài ở giữa (0% khoảng trống thừa).
 */
function HeritageCalendarBloc({
  day,
  widthClass = 'w-full',
}: {
  day: MockAnnivDay;
  widthClass?: string;
}) {
  const isToday = day.daysLeft === 0;
  const isTomorrow = day.daysLeft === 1;

  // Header màu đỏ son tươi tắn cho hôm nay, vàng tươi rực rỡ cho ngày mai, xanh đen cho ngày khác
  const headerBg = isToday
    ? 'bg-red-600 text-white font-black'
    : isTomorrow
      ? 'bg-amber-400 text-slate-950 font-black'
      : 'bg-slate-900 text-slate-100 font-bold';

  return (
    <div
      className={`${widthClass} bg-white dark:bg-slate-900 flex flex-col select-none overflow-hidden h-full`}
    >
      {/* 1. Header Đỏ Tươi / Vàng Sáng: Tháng Chín · 2026 */}
      <div className={`px-4 py-2 flex items-center justify-between text-xs tracking-wide shrink-0 ${headerBg}`}>
        <span>Tháng {day.solarMonth === 9 ? 'Chín' : day.solarMonth === 10 ? 'Mười' : day.solarMonth}</span>
        <span>{day.solarYear}</span>
      </div>

      {/* 2. Thân Dương Lịch: Số 29 to đen + Thứ Ba (Gắn kết tự nhiên, không rỗng ruột) */}
      <div className="py-4 text-center bg-white dark:bg-slate-900 shrink-0">
        <div className="text-6xl font-black text-slate-950 dark:text-white tracking-tighter leading-none">
          {day.solarDay < 10 ? `0${day.solarDay}` : day.solarDay}
        </div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-300 mt-2">
          {day.solarDayOfWeek}
        </div>
      </div>

      {/* 3. Vết răng cưa xé lịch */}
      <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-700 mx-3 shrink-0" />

      {/* 4. Thân Âm Lịch: KÉO LÊN NGAY DƯỚI DƯƠNG LỊCH, CỐ ĐỊNH LIỀN KHỐI (KHÔNG BỊ ĐẨY XUỐNG ĐÁY) */}
      <div className="p-3.5 flex items-baseline justify-between bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-red-600 dark:text-red-400 leading-none">
            {day.lunarDay < 10 ? `0${day.lunarDay}` : day.lunarDay}
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight">
            tháng {day.lunarMonth} <br />
            âm lịch
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400 block leading-tight">
            Năm
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
            {day.lunarYearCanChi}
          </span>
        </div>
      </div>

      {/* 5. Phần nền còn lại bên dưới (nếu thẻ bên phải dài do có 3 người) giữ phẳng phiu, không xé đôi lịch */}
      <div className="flex-1 bg-white dark:bg-slate-900" />
    </div>
  );
}

/**
 * 1. MÀN HÌNH TRANG CHỦ — PC (DÀN NGANG): THẺ GIA PHẢ 2 NỬA LIỀN MẠCH
 * - Nửa trái: Tờ lịch bloc fit khít 100% 3 mép (185px).
 * - Dương lịch & Âm lịch gắn kết chặt chẽ ở trên, KHÔNG BỊ XÉ RÁCH RỖNG RUỘT!
 */
function HomePcHorizontalWidget({ day }: { day: MockAnnivDay }) {
  const isToday = day.daysLeft === 0;
  const isTomorrow = day.daysLeft === 1;

  const statusText = isToday
    ? 'Hôm nay giỗ'
    : isTomorrow
      ? 'Ngày mai giỗ'
      : `Còn ${day.daysLeft} ngày`;

  const statusColor = isToday
    ? 'text-red-600 dark:text-red-400'
    : isTomorrow
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-600 dark:text-slate-400';

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden flex flex-row items-stretch">
      {/* NỬA TRÁI: TỜ LỊCH BLOC NGUYÊN BẢN (185px, Fit khít 100% 3 mép, Âm lịch kéo lên liền khối) */}
      <div className="w-[185px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <HeritageCalendarBloc day={day} widthClass="w-full" />
      </div>

      {/* NỬA PHẢI: KHU VỰC THÔNG TIN NGƯỜI GIỖ & HÀNH ĐỘNG */}
      <div className="flex-1 p-5 flex flex-col justify-between bg-stone-50/60 dark:bg-slate-850/40">
        <div>
          {/* Nhãn trạng thái */}
          <div className={`text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${statusColor}`}>
            {isToday ? <Flame className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
            <span>{statusText}</span>
          </div>

          {/* Danh sách người giỗ (Hỗ trợ 1 người hoặc 2+ người phẳng phiu) */}
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
            {day.members.map((member, idx) => (
              <div key={member.id} className={`${idx > 0 ? 'pt-3 mt-3' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white leading-snug">
                    {member.honorific ? `${member.honorific} ` : ''}{member.fullName}
                  </h3>
                  {member.relativeKinship && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                      {member.relativeKinship}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span>Đời thứ {member.generation}</span>
                  {member.branchName && <span>· {member.branchName}</span>}
                  {member.birthYear && member.deathYear && (
                    <span>· Hưởng thọ {member.deathYear - member.birthYear}t</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-800">
          <Link
            href="/tree"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>
              {day.members.length === 1
                ? `Xem ${day.members[0].honorific || 'cụ'} trên cây gia phả`
                : `Xem các cụ trên cây gia phả`}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. MÀN HÌNH TRANG CHỦ — MOBILE: TỜ LỊCH BLOC NGUYÊN BẢN (Đúng chuẩn Ảnh 1)
 */
function HomeMobileVerticalWidget({ day }: { day: MockAnnivDay }) {
  const isToday = day.daysLeft === 0;
  const isTomorrow = day.daysLeft === 1;

  const statusText = isToday
    ? 'Hôm nay giỗ'
    : isTomorrow
      ? 'Ngày mai giỗ'
      : `Còn ${day.daysLeft} ngày`;

  const statusColor = isToday
    ? 'text-red-600 dark:text-red-400'
    : isTomorrow
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-600 dark:text-slate-400';

  return (
    <div className="w-[330px] mx-auto rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden flex flex-col">
      {/* KHỐI LỊCH BLOC NGUYÊN BẢN */}
      <HeritageCalendarBloc day={day} widthClass="w-full" />

      {/* KHU VỰC THÔNG TIN NGƯỜI GIỖ Ở DƯỚI */}
      <div className="p-4 bg-stone-50/80 dark:bg-slate-850/60 border-t border-slate-200 dark:border-slate-800">
        <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${statusColor}`}>
          {isToday ? <Flame className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
          <span>{statusText}</span>
        </div>

        <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
          {day.members.map((member, idx) => (
            <div key={member.id} className={`${idx > 0 ? 'pt-2.5 mt-2.5' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-950 dark:text-white leading-snug">
                  {member.honorific ? `${member.honorific} ` : ''}{member.fullName}
                </h3>
                {member.relativeKinship && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                    {member.relativeKinship}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                <span>Đời thứ {member.generation}</span>
                {member.branchName && <span>· {member.branchName}</span>}
                {member.birthYear && member.deathYear && (
                  <span>· Hưởng thọ {member.deathYear - member.birthYear}t</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nút xem cây ở đáy */}
        <div className="mt-4 pt-2">
          <Link
            href="/tree"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <span>
              {day.members.length === 1
                ? `Xem ${day.members[0].honorific || 'cụ'} trên cây gia phả`
                : `Xem các cụ trên cây gia phả`}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. MÀN HÌNH DANH SÁCH LỊCH GIỖ (/anniversaries) — BẢN FIT KHÍT 100% 3 MÉP
 * - Cột lịch bên trái chạm khít mép trên, trái, dưới.
 * - Âm lịch kéo lên ngay dưới Dương lịch, cố định liền khối, KHÔNG BỊ XÉ RÁCH RỖNG RUỘT.
 * - Tên người giỗ hiển thị trọn vẹn, không truncate.
 */
function AnniversariesCleanListView({ isMobile = false }: { isMobile?: boolean }) {
  const groups = [
    MOCK_DATA.single_today,
    MOCK_DATA.dual_tomorrow,
    MOCK_DATA.triple_upcoming,
  ];

  return (
    <div className={`w-full mx-auto space-y-4 ${isMobile ? 'max-w-full' : 'max-w-2xl'}`}>
      {groups.map((group) => {
        const isToday = group.daysLeft === 0;
        const isTomorrow = group.daysLeft === 1;

        // Header màu đỏ son tươi tắn cho hôm nay, vàng tươi cho ngày mai, slate cho ngày khác
        const stampHeaderBg = isToday
          ? 'bg-red-600 text-white'
          : isTomorrow
            ? 'bg-amber-400 text-slate-950'
            : 'bg-slate-800 text-white';

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
            <Clock className="w-3.5 h-3.5" /> Còn {group.daysLeft} ngày
          </span>
        );

        // TRÊN BẢN MOBILE: Chuẩn xác theo phản hồi:
        // - Icon gọn gàng (w-58px), viền chạm sát mép trên & trái của thẻ ngoài (như trên PC)
        // - Bên phải có 3 dòng: (1) Hôm nay giỗ, (2) 19/8 Âm Lịch, (3) Số người giỗ
        // - Phía dưới: Cụ XXXXXXXXXXXX full-width, Xem Cây ở mép phải
        if (isMobile) {
          return (
            <div
              key={group.solarDay}
              className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all overflow-hidden"
            >
              {/* 1. KHU VỰC ĐỈNH CARD: ICON LỊCH CHẠM KHÍT VIỀN TRÊN & TRÁI + 3 DÒNG BÊN PHẢI */}
              <div className="flex items-stretch border-b border-slate-100 dark:border-slate-800">
                {/* ICON LỊCH CHẠM VIỀN THẺ NGOÀI (FLUSH TOP-LEFT, GỌN GÀNG 58px) */}
                <div className="w-[58px] shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between text-center select-none overflow-hidden">
                  <div className={`py-1 text-[9px] font-black uppercase tracking-wider text-center shrink-0 ${stampHeaderBg}`}>
                    T.{group.solarMonth < 10 ? `0${group.solarMonth}` : group.solarMonth}
                  </div>
                  <div className="py-1 flex-1 flex flex-col justify-center items-center">
                    <div className="text-xl font-black text-slate-950 dark:text-white leading-none">
                      {group.solarDay < 10 ? `0${group.solarDay}` : group.solarDay}
                    </div>
                    <div className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                      {group.solarDayOfWeek}
                    </div>
                  </div>
                </div>

                {/* BÊN PHẢI: 3 DÒNG THÔNG TIN NGÀY */}
                <div className="flex-1 px-3.5 py-2 flex flex-col justify-center bg-stone-50/40 dark:bg-slate-850/20">
                  {/* Dòng 1: Hôm nay giỗ / Ngày mai giỗ / Còn X ngày */}
                  <div className="text-xs font-black uppercase tracking-wide">
                    {statusTag}
                  </div>

                  {/* Dòng 2: Ngày Âm lịch to rõ */}
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span className="text-red-600 dark:text-red-400 font-black">
                      {group.lunarDay}/{group.lunarMonth}
                    </span>
                    <span>Âm Lịch</span>
                  </div>

                  {/* Dòng 3: Số người giỗ */}
                  <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    {group.members.length} người giỗ
                  </div>
                </div>
              </div>

              {/* 2. KHU VỰC THÔNG TIN NGƯỜI GIỖ (FULL WIDTH DƯỚI HEADER) */}
              <div className="p-3.5 divide-y divide-slate-100 dark:divide-slate-800">
                {group.members.map((member, idx) => (
                  <div
                    key={member.id}
                    className={`${idx > 0 ? 'pt-3 mt-3' : 'pt-0'} flex flex-col gap-1.5`}
                  >
                    {/* Cụ XXXXXXXXXXXX + Nhãn thân tộc (Tràn ngập 100% bề ngang) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-950 dark:text-white leading-snug">
                        {member.honorific ? `${member.honorific} ` : ''}{member.fullName}
                      </h4>
                      {member.relativeKinship && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                          {member.relativeKinship}
                        </span>
                      )}
                    </div>

                    {/* Thông tin bên trái & Xem cây ở mép phải */}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Đời {member.generation}
                        </span>
                        {member.branchName && <span>· {member.branchName}</span>}
                        {member.birthYear && member.deathYear && (
                          <span>· Hưởng thọ {member.deathYear - member.birthYear}t</span>
                        )}
                      </div>

                      {/* Xem Cây ở góc dưới bên phải */}
                      <Link
                        href="/tree"
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Xem trên Cây Gia Phả"
                      >
                        <FamilyTreeIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Xem Cây</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // TRÊN BẢN DESKTOP (PC): Giữ nguyên bản 2 cột Fit Khít 100% 3 mép đã tạm chốt
        return (
          <div
            key={group.solarDay}
            className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-row items-stretch transition-all hover:shadow-md"
          >
            {/* CỘT TRÁI: CON DẤU LỊCH BLOC THU NHỎ - FIT KHÍT 100% 3 MÉP */}
            <div className="w-[90px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col text-center select-none overflow-hidden">
              <div className={`py-1.5 font-black uppercase tracking-wider text-center shrink-0 ${stampHeaderBg} text-xs`}>
                Tháng {group.solarMonth < 10 ? `0${group.solarMonth}` : group.solarMonth}
              </div>
              <div className="py-2 text-center shrink-0">
                <div className="text-4xl font-black text-slate-950 dark:text-white leading-none tracking-tight">
                  {group.solarDay < 10 ? `0${group.solarDay}` : group.solarDay}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">
                  {group.solarDayOfWeek}
                </div>
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 mx-1 shrink-0" />
              <div className="py-1 bg-stone-50 dark:bg-slate-850 text-center shrink-0">
                <span className="text-xs font-black text-red-600 dark:text-red-400">
                  {group.lunarDay}/{group.lunarMonth} ÂL
                </span>
              </div>
              <div className="flex-1 bg-white dark:bg-slate-900" />
            </div>

            {/* CỘT PHẢI: NỘI DUNG NGƯỜI GIỖ & TRẠNG THÁI */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0 bg-stone-50/50 dark:bg-slate-850/30">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/80 dark:border-slate-800">
                {statusTag}
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Năm {group.lunarYearCanChi} · {group.members.length} người giỗ
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 py-1 flex-1 flex flex-col justify-center">
                {group.members.map((member, idx) => (
                  <div
                    key={member.id}
                    className={`${idx > 0 ? 'pt-3 mt-3' : 'pt-0'} flex flex-col gap-1.5`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {member.honorific ? `${member.honorific} ` : ''}{member.fullName}
                      </h4>
                      {member.relativeKinship && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60">
                          {member.relativeKinship}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          Đời {member.generation}
                        </span>
                        {member.branchName && <span>· {member.branchName}</span>}
                        {member.birthYear && member.deathYear && (
                          <span>· Hưởng thọ {member.deathYear - member.birthYear}t</span>
                        )}
                      </div>

                      <Link
                        href="/tree"
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Xem trên Cây Gia Phả"
                      >
                        <FamilyTreeIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Xem Cây</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PrototypeAnniversaryPage() {
  const [currentTab, setCurrentTab] = useState<'home' | 'list'>('list');
  const [deviceView, setDeviceView] = useState<'pc' | 'mobile'>('mobile');
  const [scenarioKey, setScenarioKey] = useState<string>('dual_tomorrow');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const currentGroup = MOCK_DATA[scenarioKey] || MOCK_DATA.triple_upcoming;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-stone-100 text-slate-900'} py-8 px-4`}>
      {/* 1. Header Toolbar */}
      <div className="max-w-3xl mx-auto mb-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
            Bản Mẫu Chuẩn Lịch Bloc (Fit Khít 100% · Âm Lịch Kéo Lên Cố Định)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cột lịch fit khít 3 mép · Ngày Âm lịch kéo lên sát dưới Dương lịch, không còn khoảng trống dài.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Tab Trang */}
          <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentTab === 'home' ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              1. Trang Chủ
            </button>
            <button
              onClick={() => setCurrentTab('list')}
              className={`px-3 py-1 rounded-md transition-all ${
                currentTab === 'list' ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              2. Danh Sách Lịch Giỗ
            </button>
          </div>

          {/* Toggle Dark Mode */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* 2. Sub-Toolbar: Chọn Thiết Bị & Kịch Bản */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Chọn thiết bị PC vs Mobile */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg text-xs font-bold">
          <button
            onClick={() => setDeviceView('pc')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
              deviceView === 'pc' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950' : 'text-slate-500'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Màn hình PC (Thẻ Ngang)</span>
          </button>
          <button
            onClick={() => setDeviceView('mobile')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-all ${
              deviceView === 'mobile' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950' : 'text-slate-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Màn hình Mobile</span>
          </button>
        </div>

        {/* Chọn số người giỗ (Chỉ cho Tab Home) */}
        {currentTab === 'home' && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium">Kịch bản:</span>
            <button
              onClick={() => setScenarioKey('single_today')}
              className={`px-2 py-1 rounded font-bold border transition-colors ${
                scenarioKey === 'single_today'
                  ? 'bg-red-100 text-red-600 border-red-300 dark:bg-red-950/60'
                  : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-800'
              }`}
            >
              1 Người (Hôm nay)
            </button>
            <button
              onClick={() => setScenarioKey('dual_tomorrow')}
              className={`px-2 py-1 rounded font-bold border transition-colors ${
                scenarioKey === 'dual_tomorrow'
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60'
                  : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-800'
              }`}
            >
              2 Người (Trùng ngày)
            </button>
            <button
              onClick={() => setScenarioKey('triple_upcoming')}
              className={`px-2 py-1 rounded font-bold border transition-colors ${
                scenarioKey === 'triple_upcoming'
                  ? 'bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-800'
              }`}
            >
              3 Người (7 ngày tới)
            </button>
          </div>
        )}
      </div>

      {/* 3. KHU VỰC PREVIEW CHÍNH */}
      <div className="max-w-3xl mx-auto py-2">
        {deviceView === 'pc' ? (
          /* Khung nhìn PC / Desktop (Thoáng đãng, rộng rãi) */
          <div className="py-4">
            {currentTab === 'home' ? (
              <HomePcHorizontalWidget day={currentGroup} />
            ) : (
              <AnniversariesCleanListView isMobile={false} />
            )}
          </div>
        ) : (
          /* Khung nhìn Mobile mô phỏng điện thoại di động (iPhone 375px) */
          <div className="flex flex-col items-center py-4">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Giao diện thực tế trên màn hình điện thoại (Width: 375px)</span>
            </div>

            <div className="w-[375px] min-h-[580px] max-h-[760px] bg-slate-50 dark:bg-slate-950 rounded-[44px] border-[9px] border-slate-900 dark:border-slate-800 shadow-2xl p-3 overflow-y-auto relative">
              {/* Dynamic Island của điện thoại */}
              <div className="w-24 h-4 bg-slate-900 dark:bg-slate-800 rounded-full mx-auto mb-4" />

              {currentTab === 'home' ? (
                <HomeMobileVerticalWidget day={currentGroup} />
              ) : (
                <AnniversariesCleanListView isMobile={true} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
