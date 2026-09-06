import { MemberRecord } from '@/types/tree';
import { Member } from '@/types/database';
import { AnniversaryDayGroup, AnniversaryMemberItem, AnniversaryOptions } from '@/types/anniversary';
import {
  solarToLunar,
  lunarToSolar,
  getYearCanChi,
  calculateNextAnniversary,
} from '@/lib/lunar/vietnamese-lunar';
import { findLowestCommonAncestor } from '@/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '@/lib/kinship-engine/regional-dictionaries';

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export type AnniversaryMemberInput = MemberRecord | Member | {
  id: string;
  full_name: string;
  gender: 'male' | 'female' | 'other';
  life_status?: 'living' | 'deceased';
  father_id?: string | null;
  mother_id?: string | null;
  birth_year?: number | null;
  death_year?: number | null;
  death_lunar_day?: number | null;
  death_lunar_month?: number | null;
  death_lunar_is_leap?: boolean;
  death_lunar_year_name?: string | null;
  generation_level?: number;
  generation_number?: number;
  generation?: number;
  branch_name?: string | null;
  branch_code?: string | null;
  avatar_url?: string | null;
};

function getMemberBranch(m: AnniversaryMemberInput): string | null {
  const anyM = m as any;
  return anyM.branch_code || anyM.branch_name || null;
}

function getMemberGen(m: AnniversaryMemberInput): number {
  const anyM = m as any;
  return anyM.generation_level || anyM.generation_number || anyM.generation || 1;
}

function getMemberAvatar(m: AnniversaryMemberInput): string | null {
  const anyM = m as any;
  return anyM.avatar_url || null;
}

/**
 * Lấy ngày mốc theo múi giờ Việt Nam (UTC+7) không bị lệch do UTC
 */
export function getVietnamDate(d: Date = new Date()): { year: number; month: number; day: number; dateObj: Date } {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const vnTime = new Date(utc + 7 * 3600000);
  const year = vnTime.getFullYear();
  const month = vnTime.getMonth() + 1;
  const day = vnTime.getDate();
  const dateObj = new Date(year, month - 1, day);
  return { year, month, day, dateObj };
}

/**
 * Tính ngày giỗ Dương lịch kế tiếp chuẩn xác, hỗ trợ tháng nhuận và tháng thiếu
 */
export function getAccurateSolarAnniversary(
  lunarDay: number,
  lunarMonth: number,
  isLeap: boolean = false,
  referenceDate: Date = new Date()
): {
  solarDateStr: string;
  solarDay: number;
  solarMonth: number;
  solarYear: number;
  daysLeft: number;
  lunarYearName: string;
} {
  const { year: currentYear, dateObj: today } = getVietnamDate(referenceDate);

  const computeSolarDate = (targetYear: number) => {
    let effectiveDay = lunarDay;
    let effectiveLeap = isLeap;

    let solar: { day: number; month: number; year: number };
    try {
      solar = calculateNextAnniversary(effectiveDay, lunarMonth, effectiveLeap, targetYear);
    } catch {
      effectiveLeap = false;
      solar = calculateNextAnniversary(effectiveDay, lunarMonth, false, targetYear);
    }

    if (lunarDay === 30) {
      const backLunar = solarToLunar(solar.day, solar.month, solar.year);
      if (backLunar.lunarMonth !== lunarMonth || backLunar.lunarDay === 1) {
        try {
          solar = calculateNextAnniversary(29, lunarMonth, effectiveLeap, targetYear);
        } catch {
          solar = calculateNextAnniversary(29, lunarMonth, false, targetYear);
        }
      }
    }

    return { solar, effectiveLeap };
  };

  let targetYear = currentYear;
  let { solar } = computeSolarDate(targetYear);
  let annivDate = new Date(solar.year, solar.month - 1, solar.day);
  let diffMs = annivDate.getTime() - today.getTime();

  if (diffMs < 0) {
    targetYear = currentYear + 1;
    const nextResult = computeSolarDate(targetYear);
    solar = nextResult.solar;
    annivDate = new Date(solar.year, solar.month - 1, solar.day);
    diffMs = annivDate.getTime() - today.getTime();
  }

  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const solarDateStr = `${solar.year}-${padZero(solar.month)}-${padZero(solar.day)}`;
  const lunarYearName = getYearCanChi(solar.year);

  return {
    solarDateStr,
    solarDay: solar.day,
    solarMonth: solar.month,
    solarYear: solar.year,
    daysLeft,
    lunarYearName,
  };
}

/**
 * Quét và gom nhóm danh sách ngày giỗ trong cửa sổ N ngày tới (mặc định 30 ngày)
 */
export function getUpcomingAnniversaries(
  members: AnniversaryMemberInput[],
  options: AnniversaryOptions = {}
): AnniversaryDayGroup[] {
  const {
    daysAhead = 30,
    referenceDate = new Date(),
    viewerMemberId,
    branchFilter,
  } = options;

  // Lọc các thành viên đã mất có đầy đủ ngày & tháng giỗ âm lịch
  const deceasedMembers = members.filter((m) => {
    const isLiving = m.life_status === 'living';
    if (isLiving) return false;
    if (m.death_lunar_day == null || m.death_lunar_month == null) return false;
    if (m.death_lunar_day <= 0 || m.death_lunar_month <= 0) return false;

    const branch = getMemberBranch(m);
    if (branchFilter && branch && branch !== branchFilter) return false;
    return true;
  });

  // Map phục vụ tra cứu tính quan hệ họ hàng
  const membersMap = new Map<string, Member>();
  members.forEach((m) => {
    const anyM = m as any;
    membersMap.set(m.id, {
      ...m,
      life_status: m.life_status || (m.death_lunar_day ? 'deceased' : 'living'),
      father_id: m.father_id || null,
      mother_id: m.mother_id || null,
      alias_name: null,
      birth_date: null,
      death_date: null,
      phone: null,
      address: null,
      biography: null,
      generation_number: getMemberGen(m),
      birth_order: anyM.birth_order != null ? anyM.birth_order : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      death_lunar_day: m.death_lunar_day || null,
      death_lunar_month: m.death_lunar_month || null,
      death_lunar_is_leap: !!m.death_lunar_is_leap,
      death_lunar_year_name: m.death_lunar_year_name || null,
      death_year: m.death_year || null,
      burial_location: null,
      avatar_url: getMemberAvatar(m),
    } as Member);
  });

  const viewerMember = viewerMemberId ? membersMap.get(viewerMemberId) : undefined;

  const candidateItems: AnniversaryMemberItem[] = [];

  for (const m of deceasedMembers) {
    const day = m.death_lunar_day!;
    const month = m.death_lunar_month!;
    const isLeap = !!m.death_lunar_is_leap;

    const anniv = getAccurateSolarAnniversary(day, month, isLeap, referenceDate);

    if (anniv.daysLeft >= 0 && anniv.daysLeft <= daysAhead) {
      let relativeKinship: string | null = null;

      if (viewerMember && viewerMember.id !== m.id) {
        try {
          const lca = findLowestCommonAncestor(viewerMember.id, m.id, membersMap);
          if (lca.lcaNodeId) {
            const targetMember = membersMap.get(m.id)!;
            const kinshipRes = resolveKinshipTerms(lca, viewerMember, targetMember, 'north');
            if (kinshipRes?.termAtoB) {
              relativeKinship = `${kinshipRes.termAtoB} của bạn`;
            }
          }
        } catch {
          // Bỏ qua lỗi tính vai vế nếu cây rời rạc
        }
      }

      const lunarFormatted = `Ngày ${padZero(day)}/${padZero(month)} Âm lịch (${anniv.lunarYearName})`;
      const generation = getMemberGen(m);
      const branch = getMemberBranch(m);

      candidateItems.push({
        id: m.id,
        full_name: m.full_name,
        gender: m.gender,
        avatar_url: getMemberAvatar(m),
        generation,
        branch_code: branch,
        birth_year: m.birth_year || null,
        death_year: m.death_year || null,
        death_lunar_day: day,
        death_lunar_month: month,
        death_lunar_is_leap: isLeap,
        death_lunar_year_name: m.death_lunar_year_name || null,
        solar_date_str: anniv.solarDateStr,
        solar_day: anniv.solarDay,
        solar_month: anniv.solarMonth,
        solar_year: anniv.solarYear,
        days_left: anniv.daysLeft,
        lunar_date_formatted: lunarFormatted,
        relative_kinship: relativeKinship,
      });
    }
  }

  const groupMap = new Map<string, AnniversaryDayGroup>();

  for (const item of candidateItems) {
    const key = item.solar_date_str;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        solar_date_str: item.solar_date_str,
        solar_day: item.solar_day,
        solar_month: item.solar_month,
        solar_year: item.solar_year,
        lunar_day: item.death_lunar_day,
        lunar_month: item.death_lunar_month,
        lunar_year_name: getYearCanChi(item.solar_year),
        days_left: item.days_left,
        members: [],
      });
    }
    groupMap.get(key)!.members.push(item);
  }

  const sortedGroups = Array.from(groupMap.values()).sort((a, b) => a.days_left - b.days_left);

  return sortedGroups;
}

/**
 * Tìm các thành viên có ngày giỗ đúng hôm nay (theo Âm lịch UTC+7)
 * Phục vụ Vercel Cron 7:00 AM hằng ngày
 */
export function getTodayAnniversaryMembers(
  members: AnniversaryMemberInput[],
  referenceDate: Date = new Date()
): MemberRecord[] {
  const { year, month, day } = getVietnamDate(referenceDate);
  const todayLunar = solarToLunar(day, month, year);

  const tomorrow = new Date(year, month - 1, day + 1);
  const tomorrowLunar = solarToLunar(tomorrow.getDate(), tomorrow.getMonth() + 1, tomorrow.getFullYear());
  const isMonthEnd29 = todayLunar.lunarDay === 29 && tomorrowLunar.lunarDay === 1;

  const matched: MemberRecord[] = [];

  for (const m of members) {
    const isLiving = m.life_status === 'living';
    if (isLiving) continue;
    if (m.death_lunar_day == null || m.death_lunar_month == null) continue;

    const mDay = m.death_lunar_day;
    const mMonth = m.death_lunar_month;

    // 1. Trùng chính xác ngày và tháng
    if (mDay === todayLunar.lunarDay && mMonth === todayLunar.lunarMonth) {
      matched.push(m as MemberRecord);
      continue;
    }

    // 2. Trường hợp giỗ ngày 30 mà tháng này chỉ có 29 ngày
    if (isMonthEnd29 && mDay === 30 && mMonth === todayLunar.lunarMonth) {
      matched.push(m as MemberRecord);
    }
  }

  return matched;
}
