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

const VIETNAMESE_DAYS_OF_WEEK = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

/**
 * Lấy thứ trong tuần bằng tiếng Việt chuẩn xác (Chủ Nhật, Thứ Hai, ..., Thứ Bảy)
 */
export function getVietnameseDayOfWeek(year: number, month: number, day: number): string {
  const d = new Date(year, month - 1, day);
  return VIETNAMESE_DAYS_OF_WEEK[d.getDay()];
}

/**
 * Định dạng ngày Dương lịch kèm Thứ đầy đủ (VD: "Chủ Nhật, ngày 18/10/2026")
 */
export function formatSolarDateWithDayOfWeek(year: number, month: number, day: number): string {
  const dayOfWeek = getVietnameseDayOfWeek(year, month, day);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${dayOfWeek}, ngày ${pad(day)}/${pad(month)}/${year}`;
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
 * Tính toán tiền tố danh xưng cho người đã khuất:
 * - Khi ĐÃ liên kết node (viewerKinshipTerm được truyền vào):
 *   + Nếu quan hệ gần (cách 1-2 thế hệ như Bố, Mẹ, Ông, Bà, Bác, Chú, Cô, Dì...): ưu tiên dùng danh xưng thân tộc này (bỏ "của bạn" nếu có).
 *   + Nếu quan hệ bậc Cụ/Kỵ trở lên: tiền tố là "Cụ".
 * - Khi CHƯA liên kết node (hoặc không tìm thấy quan hệ thân tộc):
 *   + Tính đời từ dưới lên: levelFromBottom = Math.max(maxGen - generation + 1, 1).
 *   + levelFromBottom >= 4 (Đời thứ 4 từ dưới lên và các đời trên nữa): "Cụ"
 *   + levelFromBottom in [2, 3] (Đời thứ 2, 3 từ dưới lên): Nam -> "Ông", Nữ -> "Bà"
 *   + levelFromBottom === 1 (Đời thấp nhất): "" (tiền tố rỗng)
 */
export function computeDeceasedHonorificPrefix(
  member: AnniversaryMemberInput,
  maxGen: number,
  viewerKinshipTerm?: string | null
): string {
  // 1. Nếu có xưng hô theo ngôi người xem đã liên kết
  if (viewerKinshipTerm) {
    const cleanedTerm = viewerKinshipTerm.replace(/\s+của bạn$/i, '').trim();
    if (cleanedTerm && cleanedTerm !== 'Bản thân' && cleanedTerm !== 'Người ngoài họ') {
      if (cleanedTerm.startsWith('Cụ') || cleanedTerm.startsWith('Kỵ')) {
        return 'Cụ';
      }
      return cleanedTerm;
    }
  }

  // 2. Nếu chưa liên kết node: tính theo phân cấp thế hệ từ đáy lên
  const gen = getMemberGen(member);
  const safeMaxGen = Math.max(maxGen, 1);
  const levelFromBottom = Math.max(safeMaxGen - gen + 1, 1);

  if (levelFromBottom >= 4) {
    return 'Cụ';
  }
  if (levelFromBottom === 2 || levelFromBottom === 3) {
    return member.gender === 'female' ? 'Bà' : 'Ông';
  }
  return '';
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
    region = 'north',
    customDictionary,
    spouseMap,
  } = options;

  const maxGen = members.reduce((max, m) => Math.max(max, getMemberGen(m)), 1);

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
          const lca = findLowestCommonAncestor(viewerMember.id, m.id, membersMap, spouseMap);
          if (lca.lcaNodeId) {
            const targetMember = membersMap.get(m.id)!;
            const kinshipRes = resolveKinshipTerms(lca, viewerMember, targetMember, region, customDictionary);
            if (kinshipRes?.termAtoB) {
              relativeKinship = `${kinshipRes.termAtoB} của bạn`;
            }
          }
        } catch {
          // Bỏ qua lỗi tính vai vế nếu cây rời rạc
        }
      }

      const lunarFormatted = `Âm lịch: Ngày ${padZero(day)}/${padZero(month)}`;
      const generation = getMemberGen(m);
      const branch = getMemberBranch(m);
      const honorificPrefix = computeDeceasedHonorificPrefix(m, maxGen, relativeKinship);
      const displayName = honorificPrefix ? `${honorificPrefix} ${m.full_name}` : m.full_name;

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
        honorific_prefix: honorificPrefix || undefined,
        display_name: displayName,
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

/**
 * Tìm các thành viên có ngày giỗ đúng ngày mai (theo Âm lịch UTC+7)
 * Phục vụ gửi thông báo trước 1 ngày lúc 7:00 AM
 */
export function getTomorrowAnniversaryMembers(
  members: AnniversaryMemberInput[],
  referenceDate: Date = new Date()
): MemberRecord[] {
  const { year, month, day } = getVietnamDate(referenceDate);
  const tomorrowDate = new Date(year, month - 1, day + 1);
  const tomorrowLunar = solarToLunar(tomorrowDate.getDate(), tomorrowDate.getMonth() + 1, tomorrowDate.getFullYear());

  const dayAfterTomorrow = new Date(year, month - 1, day + 2);
  const dayAfterLunar = solarToLunar(dayAfterTomorrow.getDate(), dayAfterTomorrow.getMonth() + 1, dayAfterTomorrow.getFullYear());
  const isTomorrowMonthEnd29 = tomorrowLunar.lunarDay === 29 && dayAfterLunar.lunarDay === 1;

  const matched: MemberRecord[] = [];

  for (const m of members) {
    const isLiving = m.life_status === 'living';
    if (isLiving) continue;
    if (m.death_lunar_day == null || m.death_lunar_month == null) continue;

    const mDay = m.death_lunar_day;
    const mMonth = m.death_lunar_month;

    // 1. Trùng chính xác ngày và tháng
    if (mDay === tomorrowLunar.lunarDay && mMonth === tomorrowLunar.lunarMonth) {
      matched.push(m as MemberRecord);
      continue;
    }

    // 2. Trường hợp giỗ ngày 30 mà tháng này chỉ có 29 ngày
    if (isTomorrowMonthEnd29 && mDay === 30 && mMonth === tomorrowLunar.lunarMonth) {
      matched.push(m as MemberRecord);
    }
  }

  return matched;
}

/**
 * Thuật toán trích xuất toàn bộ nhánh dọc của một thành viên
 * Gồm: Tổ tiên trực hệ (lên đỉnh), Con cháu trực hệ (xuống đáy), Anh chị em ruột, Hôn phối
 */
export function getLineageMemberIds(
  targetMemberId: string,
  members: AnniversaryMemberInput[],
  spouseMap?: Map<string, string[]>
): Set<string> {
  const lineage = new Set<string>();
  if (!targetMemberId) return lineage;
  lineage.add(targetMemberId);

  const memberMap = new Map<string, AnniversaryMemberInput>();
  members.forEach((m) => memberMap.set(m.id, m));

  const target = memberMap.get(targetMemberId);
  if (!target) return lineage;

  // 1. Upwards: Tổ tiên trực hệ (Bố mẹ, ông bà, cụ kỵ...)
  const ancestorQueue = [targetMemberId];
  const ancestors = new Set<string>();
  while (ancestorQueue.length > 0) {
    const currId = ancestorQueue.shift()!;
    const curr = memberMap.get(currId);
    if (!curr) continue;
    if (curr.father_id && !ancestors.has(curr.father_id)) {
      ancestors.add(curr.father_id);
      lineage.add(curr.father_id);
      ancestorQueue.push(curr.father_id);
    }
    if (curr.mother_id && !ancestors.has(curr.mother_id)) {
      ancestors.add(curr.mother_id);
      lineage.add(curr.mother_id);
      ancestorQueue.push(curr.mother_id);
    }
  }

  // 2. Downwards: Con cháu trực hệ (Con, cháu, chắt...)
  const descendantQueue = [targetMemberId];
  while (descendantQueue.length > 0) {
    const currId = descendantQueue.shift()!;
    for (const m of members) {
      if ((m.father_id === currId || m.mother_id === currId) && !lineage.has(m.id)) {
        lineage.add(m.id);
        descendantQueue.push(m.id);
      }
    }
  }

  // 3. Anh chị em ruột (cùng bố hoặc mẹ với target)
  if (target.father_id || target.mother_id) {
    for (const m of members) {
      if (
        (target.father_id && m.father_id === target.father_id) ||
        (target.mother_id && m.mother_id === target.mother_id)
      ) {
        lineage.add(m.id);
      }
    }
  }

  // 4. Hôn phối của target và hôn phối của tổ tiên trực hệ (nếu có spouseMap)
  if (spouseMap) {
    for (const id of Array.from(lineage)) {
      const spouses = spouseMap.get(id);
      if (spouses) {
        spouses.forEach((spId) => lineage.add(spId));
      }
    }
  }

  return lineage;
}

/**
 * Thuật toán tìm toàn bộ ID con cháu trực hệ nhiều đời của một người
 */
export function getDescendantMemberIds(
  targetId: string,
  members: AnniversaryMemberInput[]
): Set<string> {
  const descendants = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const m of members) {
      if ((m.father_id === current || m.mother_id === current) && !descendants.has(m.id)) {
        descendants.add(m.id);
        queue.push(m.id);
      }
    }
  }

  return descendants;
}

/**
 * Thuật toán mở rộng nhánh gia đình ruột thịt (Extended Family Scope)
 * Phục vụ gửi thông báo ngày giỗ cá nhân hóa theo phong tục Việt Nam:
 * 1. Toàn bộ Tổ tiên trực hệ đi lên đỉnh cây (Bố mẹ, Ông bà, Cụ kỵ...).
 * 2. Toàn bộ Hậu duệ (Descendants) từ đời Ông Bà trở xuống (gồm Bác, Chú, Cô, Cậu, Dì, anh em họ, con cháu chắt).
 * 3. Toàn bộ con cháu của chính target.
 * 4. Toàn bộ Vợ/Chồng (Hôn phối - Spouses) của tất cả những người trong tập hợp trên.
 */
export function getExtendedFamilyMemberIds(
  targetMemberId: string,
  members: AnniversaryMemberInput[],
  spouseMap?: Map<string, string[]>
): Set<string> {
  const family = new Set<string>();
  if (!targetMemberId) return family;
  family.add(targetMemberId);

  const memberMap = new Map<string, AnniversaryMemberInput>();
  members.forEach((m) => memberMap.set(m.id, m));

  const target = memberMap.get(targetMemberId);
  if (!target) return family;

  // 1. Tổ tiên trực hệ đi lên (Ascendants)
  const ancestors = new Set<string>();
  const ancestorQueue = [targetMemberId];
  while (ancestorQueue.length > 0) {
    const currId = ancestorQueue.shift()!;
    const curr = memberMap.get(currId);
    if (!curr) continue;
    if (curr.father_id && !ancestors.has(curr.father_id)) {
      ancestors.add(curr.father_id);
      family.add(curr.father_id);
      ancestorQueue.push(curr.father_id);
    }
    if (curr.mother_id && !ancestors.has(curr.mother_id)) {
      ancestors.add(curr.mother_id);
      family.add(curr.mother_id);
      ancestorQueue.push(curr.mother_id);
    }
  }

  // 2. Tìm các bậc tiền nhân ở tầng Bố Mẹ và Ông Bà để trích xuất toàn bộ con cháu (họ hàng cùng nhánh)
  const parents = [target.father_id, target.mother_id].filter(Boolean) as string[];
  const branchRoots = new Set<string>();
  parents.forEach((pId) => branchRoots.add(pId));

  for (const pId of parents) {
    const p = memberMap.get(pId);
    if (p) {
      if (p.father_id) branchRoots.add(p.father_id);
      if (p.mother_id) branchRoots.add(p.mother_id);
    }
  }

  // Với mỗi branchRoot (Ông, Bà, Bố, Mẹ): lấy toàn bộ con cháu của họ
  for (const rootId of Array.from(branchRoots)) {
    const descQueue = [rootId];
    while (descQueue.length > 0) {
      const currId = descQueue.shift()!;
      for (const m of members) {
        if ((m.father_id === currId || m.mother_id === currId) && !family.has(m.id)) {
          family.add(m.id);
          descQueue.push(m.id);
        }
      }
    }
  }

  // 3. Con cháu của chính target
  const selfDescQueue = [targetMemberId];
  while (selfDescQueue.length > 0) {
    const currId = selfDescQueue.shift()!;
    for (const m of members) {
      if ((m.father_id === currId || m.mother_id === currId) && !family.has(m.id)) {
        family.add(m.id);
        selfDescQueue.push(m.id);
      }
    }
  }

  // 4. Vợ/chồng (Hôn phối - Spouses) của tất cả mọi người trong tập hợp family
  if (spouseMap) {
    for (const id of Array.from(family)) {
      const spouses = spouseMap.get(id);
      if (spouses) {
        spouses.forEach((spId) => family.add(spId));
      }
    }
  }

  return family;
}

export interface AggregatedDigestPayload {
  title: string;
  body: string;
  badge: string;
  tag: string;
  url: string;
}

/**
 * Xây dựng payload thông báo Web Push dạng phẳng gộp chung (MB Bank / Uniqlo Style)
 * - Title: Ưu tiên sự kiện Hôm nay, nếu chỉ có Ngày mai thì lấy Ngày mai
 * - Body: Các sự kiện hôm nay và ngày mai phân tách bởi dòng trống \n\n
 * - Không gửi kèm thuộc tính `icon` để tránh bị Android chèn Large Icon thumbnail góc phải
 */
export function buildAggregatedDigestPayload(
  linkedMemberId: string,
  matchingToday: MemberRecord[],
  matchingTomorrow: MemberRecord[],
  formatNameFn: (viewerId: string, deceased: MemberRecord) => string
): AggregatedDigestPayload | null {
  if (matchingToday.length === 0 && matchingTomorrow.length === 0) {
    return null;
  }

  let title = '';
  if (matchingToday.length > 0) {
    const primaryToday = matchingToday[0];
    const displayName = formatNameFn(linkedMemberId, primaryToday);
    const extraCount = matchingToday.length - 1;
    title = extraCount > 0
      ? `Hôm nay là Ngày Giỗ của ${displayName} (+${extraCount} người khác)`
      : `Hôm nay là Ngày Giỗ của ${displayName}`;
  } else {
    const primaryTomorrow = matchingTomorrow[0];
    const displayName = formatNameFn(linkedMemberId, primaryTomorrow);
    const extraCount = matchingTomorrow.length - 1;
    title = extraCount > 0
      ? `Ngày mai có Ngày Giỗ của ${displayName} (+${extraCount} người khác)`
      : `Ngày mai có Ngày Giỗ của ${displayName}`;
  }

  const todayBlocks = matchingToday.map((ancestor) => {
    const displayName = formatNameFn(linkedMemberId, ancestor);
    return `Hôm nay là Ngày Giỗ của ${displayName}\nTức ngày ${ancestor.death_lunar_day}/${ancestor.death_lunar_month} Âm lịch!`;
  });

  const tomorrowBlocks = matchingTomorrow.map((ancestor) => {
    const displayName = formatNameFn(linkedMemberId, ancestor);
    return `Ngày mai có Ngày Giỗ của ${displayName}\nTức ngày ${ancestor.death_lunar_day}/${ancestor.death_lunar_month} Âm lịch.`;
  });

  const body = [...todayBlocks, ...tomorrowBlocks].join('\n\n');

  return {
    title,
    body,
    badge: '/icons/badge-72x72.png',
    tag: 'anniversary-daily-digest',
    url: '/anniversaries?scope=my_lineage',
  };
}


