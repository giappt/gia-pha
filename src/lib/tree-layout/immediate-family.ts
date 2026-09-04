import { MemberRecord, SpouseRelationRecord, ImmediateFamily, NextAnniversaryInfo } from '@/types/tree';
import { calculateNextAnniversary } from '@/lib/lunar/vietnamese-lunar';

/**
 * Trích xuất mạng lưới thân tộc trực hệ 1 đời của một thành viên:
 * - Phụ mẫu (Cha, Mẹ)
 * - Phu thê (Vợ cả, Vợ hai, Chồng...)
 * - Huynh đệ (Anh chị em ruột cùng cha hoặc cùng mẹ)
 * - Hậu duệ (Toàn bộ con đẻ, con nuôi)
 */
export function getImmediateFamily(
  targetMemberId: string,
  members: MemberRecord[],
  spouseRelations: SpouseRelationRecord[] = []
): ImmediateFamily | null {
  const memberMap = new Map<string, MemberRecord>();
  members.forEach((m) => memberMap.set(m.id, m));

  const targetMember = memberMap.get(targetMemberId);
  if (!targetMember) return null;

  // 1. Phụ mẫu
  const father = targetMember.father_id ? memberMap.get(targetMember.father_id) : undefined;
  const mother = targetMember.mother_id ? memberMap.get(targetMember.mother_id) : undefined;

  // 2. Phu thê
  const spouses: Array<{ member: MemberRecord; relation: SpouseRelationRecord }> = [];
  const processedPartnerIds = new Set<string>();

  spouseRelations.forEach((rel) => {
    let partnerId: string | null = null;
    if (rel.member_a_id === targetMemberId) {
      partnerId = rel.member_b_id;
    } else if (rel.member_b_id === targetMemberId) {
      partnerId = rel.member_a_id;
    }

    if (partnerId && !processedPartnerIds.has(partnerId)) {
      processedPartnerIds.add(partnerId);
      const partner = memberMap.get(partnerId);
      if (partner) {
        spouses.push({ member: partner, relation: rel });
      }
    }
  });

  // Sắp xếp phu thê theo thứ tự kết hôn (marriage_order)
  spouses.sort((a, b) => (a.relation.marriage_order || 1) - (b.relation.marriage_order || 1));

  // 3. Huynh đệ (cùng cha hoặc cùng mẹ, khác targetMember)
  const siblings: MemberRecord[] = [];
  const processedSiblingIds = new Set<string>();

  members.forEach((m) => {
    if (m.id === targetMemberId) return;

    const shareFather = targetMember.father_id && m.father_id === targetMember.father_id;
    const shareMother = targetMember.mother_id && m.mother_id === targetMember.mother_id;

    if ((shareFather || shareMother) && !processedSiblingIds.has(m.id)) {
      processedSiblingIds.add(m.id);
      siblings.push(m);
    }
  });

  // Sắp xếp huynh đệ: Ưu tiên birth_order, rồi đến birth_year
  siblings.sort(compareMemberOrder);

  // 4. Hậu duệ (con cái: người có cha hoặc mẹ là targetMember)
  const children: MemberRecord[] = [];
  members.forEach((m) => {
    if (m.father_id === targetMemberId || m.mother_id === targetMemberId) {
      children.push(m);
    }
  });

  // Sắp xếp hậu duệ
  children.sort(compareMemberOrder);

  // 5. Phân cụm đàn con theo từng người mẹ & con riêng
  const childrenGroups = groupChildrenByMother(targetMemberId, children, spouseRelations, memberMap);

  return {
    targetMember,
    parents: { father, mother },
    spouses,
    siblings,
    children,
    childrenGroups,
  };
}

/**
 * Phân nhóm con cái theo từng người mẹ và nhóm con riêng khuyết mẹ
 */
export function groupChildrenByMother(
  primaryId: string,
  children: MemberRecord[],
  spouseRelations: SpouseRelationRecord[],
  memberMap: Map<string, MemberRecord>
): import('@/types/tree').ChildrenGroup[] {
  // Lấy danh sách phối ngẫu của primaryId
  const spouses: Array<{ member: MemberRecord; relation: SpouseRelationRecord }> = [];
  const processedPartnerIds = new Set<string>();

  spouseRelations.forEach((rel) => {
    let partnerId: string | null = null;
    if (rel.member_a_id === primaryId) {
      partnerId = rel.member_b_id;
    } else if (rel.member_b_id === primaryId) {
      partnerId = rel.member_a_id;
    }

    if (partnerId && !processedPartnerIds.has(partnerId)) {
      processedPartnerIds.add(partnerId);
      const partner = memberMap.get(partnerId);
      if (partner) {
        spouses.push({ member: partner, relation: rel });
      }
    }
  });

  // Sắp xếp các bà vợ theo marriage_order tăng dần
  spouses.sort((a, b) => (a.relation.marriage_order || 1) - (b.relation.marriage_order || 1));

  const groups: import('@/types/tree').ChildrenGroup[] = [];
  const assignedChildIds = new Set<string>();

  // 1. Gom con của từng bà vợ
  spouses.forEach((sp) => {
    const wife = sp.member;
    const wifeChildren = children.filter((c) => c.mother_id === wife.id);
    wifeChildren.forEach((c) => assignedChildIds.add(c.id));

    if (wifeChildren.length > 0) {
      groups.push({
        motherId: wife.id,
        motherName: wife.full_name,
        marriageOrder: sp.relation.marriage_order || 1,
        children: wifeChildren,
      });
    }
  });

  // 2. Gom con riêng khuyết mẹ hoặc mẹ không trong danh sách vợ
  const remainingChildren = children.filter((c) => !assignedChildIds.has(c.id));
  if (remainingChildren.length > 0) {
    groups.push({
      motherId: null,
      motherName: 'Chưa rõ thông tin mẹ',
      children: remainingChildren,
    });
  }

  return groups;
}

function compareMemberOrder(a: MemberRecord, b: MemberRecord): number {
  if (a.birth_order != null && b.birth_order != null) return a.birth_order - b.birth_order;
  if (a.birth_order != null && b.birth_order == null) return -1;
  if (a.birth_order == null && b.birth_order != null) return 1;
  if (a.birth_year != null && b.birth_year != null) return a.birth_year - b.birth_year;
  return a.full_name.localeCompare(b.full_name);
}

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Tính Ngày giỗ Dương lịch kế tiếp tương ứng từ Ngày giỗ Âm lịch
 * Sử dụng thuật toán quy đổi Âm - Dương chuẩn thiên văn UTC+7
 */
export function getNextSolarAnniversary(
  lunarDay?: number | null,
  lunarMonth?: number | null,
  referenceDate: Date = new Date()
): NextAnniversaryInfo | null {
  if (!lunarDay || !lunarMonth || lunarDay <= 0 || lunarMonth <= 0) {
    return null;
  }

  const currYear = referenceDate.getFullYear();
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  // 1. Thử tính ngày giỗ cho năm hiện tại
  let annivSolar = calculateNextAnniversary(lunarDay, lunarMonth, false, currYear);
  let annivDate = new Date(annivSolar.year, annivSolar.month - 1, annivSolar.day);

  // 2. Nếu ngày giỗ năm nay đã trôi qua trong quá khứ -> tính cho năm kế tiếp
  let diffMs = annivDate.getTime() - today.getTime();
  if (diffMs < 0) {
    annivSolar = calculateNextAnniversary(lunarDay, lunarMonth, false, currYear + 1);
    annivDate = new Date(annivSolar.year, annivSolar.month - 1, annivSolar.day);
    diffMs = annivDate.getTime() - today.getTime();
  }

  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const solarDateStr = `${annivSolar.year}-${padZero(annivSolar.month)}-${padZero(annivSolar.day)}`;

  return {
    solarDateStr,
    daysLeft,
  };
}
