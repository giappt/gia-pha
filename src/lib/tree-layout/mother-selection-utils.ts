import { MemberRecord, SpouseRelationRecord } from '@/types/tree';

export interface MotherSelectionOption {
  motherId: string;
  motherName: string;
  marriageOrder: number;
  isDefault: boolean;
}

export interface MotherSelectionResolution {
  wives: MemberRecord[];
  defaultMotherId: string | null;
  requiresSelection: boolean;
  options: MotherSelectionOption[];
}

/**
 * Xác định danh sách mẹ khả dụng và mẹ mặc định khi thêm con cho một người cha:
 * - Nếu cha có 1 vợ: Mẹ mặc định (default) là người vợ đó (defaultMotherId = wife.id, requiresSelection = false)
 * - Nếu cha có >= 2 vợ: Cần người dùng chủ động chọn mẹ (requiresSelection = true, defaultMotherId = null)
 * - Nếu cha chưa có vợ: defaultMotherId = null, requiresSelection = false
 */
export function resolveMothersForFather(
  fatherId: string,
  allSpouses: SpouseRelationRecord[],
  allMembers: MemberRecord[]
): MotherSelectionResolution {
  if (!fatherId) {
    return { wives: [], defaultMotherId: null, requiresSelection: false, options: [] };
  }

  const spouseRels = allSpouses.filter(
    (s) => s.member_a_id === fatherId || s.member_b_id === fatherId
  );

  const wivesWithOrder = spouseRels
    .map((rel) => {
      const partnerId = rel.member_a_id === fatherId ? rel.member_b_id : rel.member_a_id;
      const partner = allMembers.find((m) => m.id === partnerId);
      return {
        partner,
        marriageOrder: rel.marriage_order || 1,
      };
    })
    .filter(
      (item): item is { partner: MemberRecord; marriageOrder: number } =>
        !!item.partner && item.partner.gender === 'female'
    )
    .sort((a, b) => a.marriageOrder - b.marriageOrder);

  const wives = wivesWithOrder.map((w) => w.partner);

  if (wives.length === 1) {
    return {
      wives,
      defaultMotherId: wives[0].id,
      requiresSelection: false,
      options: [
        {
          motherId: wives[0].id,
          motherName: wives[0].full_name,
          marriageOrder: wivesWithOrder[0].marriageOrder,
          isDefault: true,
        },
      ],
    };
  }

  if (wives.length >= 2) {
    return {
      wives,
      defaultMotherId: null,
      requiresSelection: true,
      options: wivesWithOrder.map((w) => ({
        motherId: w.partner.id,
        motherName: w.partner.full_name,
        marriageOrder: w.marriageOrder,
        isDefault: false,
      })),
    };
  }

  return {
    wives: [],
    defaultMotherId: null,
    requiresSelection: false,
    options: [],
  };
}
