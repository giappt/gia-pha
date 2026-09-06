import { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import { findLowestCommonAncestor } from '@/lib/kinship-engine/lca-finder';
import { Member } from '@/types/database';

export class CycleDetectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CycleDetectedError';
  }
}

/**
 * Kiểm tra xem candidateParentId có phải là chính memberId hoặc là con cháu của memberId không.
 * Nếu đúng -> việc gán candidateParentId làm cha/mẹ của memberId sẽ tạo thành chu trình lặp vô tận (DAG Cycle).
 */
export function isDescendantOf(
  candidateParentId: string,
  memberId: string,
  members: MemberRecord[]
): boolean {
  if (!candidateParentId || !memberId) return false;
  if (candidateParentId === memberId) return true;

  // Dựng bản đồ danh sách con cái: parentId -> children
  const childrenMap = new Map<string, string[]>();
  for (const m of members) {
    if (m.father_id) {
      const list = childrenMap.get(m.father_id) || [];
      list.push(m.id);
      childrenMap.set(m.father_id, list);
    }
    if (m.mother_id) {
      const list = childrenMap.get(m.mother_id) || [];
      list.push(m.id);
      childrenMap.set(m.mother_id, list);
    }
  }

  // Duyệt BFS từ memberId xuống toàn bộ con cháu
  const queue = [memberId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === candidateParentId) {
      return true;
    }
    visited.add(curr);

    const children = childrenMap.get(curr) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        queue.push(childId);
      }
    }
  }

  return false;
}

/**
 * Xác thực việc gán cha mẹ không tạo thành chu trình kín.
 * Ném lỗi CycleDetectedError nếu phát hiện chu trình.
 */
export function validateNoCycle(
  memberId: string,
  candidateParentId: string,
  members: MemberRecord[]
): void {
  if (isDescendantOf(candidateParentId, memberId, members)) {
    throw new CycleDetectedError(
      'Không thể gán chính mình hoặc con cháu làm cha mẹ (phát hiện chu trình lặp vô tận trong đồ thị gia phả)!'
    );
  }
}

/**
 * Lọc danh sách thành viên chưa nối phả (Unlinked Members).
 * Định nghĩa chuẩn:
 * - Không phải Cụ tổ (is_root === false)
 * - Không có cha ruột (father_id null/rỗng) VÀ không có mẹ ruột (mother_id null/rỗng)
 * - VÀ không có quan hệ hôn phối với bất kỳ thành viên nào ĐÃ NỐI vào cây.
 * (Điều này đảm bảo các Dâu/Rể ngoại tộc đã kết hôn với con cháu trong dòng họ sẽ KHÔNG bị nhầm thành unlinked).
 */
export function getUnlinkedMembers(
  members: MemberRecord[],
  spouses: SpouseRelationRecord[]
): MemberRecord[] {
  // 1. Xác định tập hợp các thành viên ĐÃ NỐI VÀO CÂY (Linked Members)
  // Bước cơ sở: Người có cha/mẹ hoặc là root
  const linkedMemberIds = new Set<string>();
  for (const m of members) {
    if (m.is_root || m.father_id || m.mother_id) {
      linkedMemberIds.add(m.id);
    }
  }

  // Bước mở rộng: Nếu A đã linked, thì bất kỳ người nào kết hôn với A cũng được coi là đã linked vào cây (Dâu / Rể)
  let changed = true;
  while (changed) {
    changed = false;
    for (const rel of spouses) {
      const isALinked = linkedMemberIds.has(rel.member_a_id);
      const isBLinked = linkedMemberIds.has(rel.member_b_id);

      if (isALinked && !isBLinked) {
        linkedMemberIds.add(rel.member_b_id);
        changed = true;
      } else if (!isALinked && isBLinked) {
        linkedMemberIds.add(rel.member_a_id);
        changed = true;
      }
    }
  }

  // 2. Những ai không thuộc linkedMemberIds chính là thành viên chưa nối (Unlinked)
  return members.filter((m) => !linkedMemberIds.has(m.id));
}

/**
 * Đệ quy cập nhật lại generation_level cho toàn bộ nhánh con cháu khi một thành viên được nối vào cha mẹ mới.
 * Trả về bản đồ map: memberId -> generation_level mới.
 */
export function recalculateGenerations(
  rootId: string,
  newParentId: string | null,
  members: MemberRecord[]
): Map<string, number> {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const updatedGenerations = new Map<string, number>();

  let newRootGen = 1;
  if (newParentId && memberMap.has(newParentId)) {
    const parent = memberMap.get(newParentId)!;
    newRootGen = (parent.generation_level || 1) + 1;
  }

  updatedGenerations.set(rootId, newRootGen);

  // Xây dựng map con cái
  const childrenMap = new Map<string, string[]>();
  for (const m of members) {
    if (m.father_id) {
      const list = childrenMap.get(m.father_id) || [];
      list.push(m.id);
      childrenMap.set(m.father_id, list);
    }
    if (m.mother_id) {
      const list = childrenMap.get(m.mother_id) || [];
      list.push(m.id);
      childrenMap.set(m.mother_id, list);
    }
  }

  // Duyệt BFS xuống dưới
  const queue: Array<{ id: string; gen: number }> = [{ id: rootId, gen: newRootGen }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    visited.add(id);

    const children = childrenMap.get(id) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        const nextGen = gen + 1;
        updatedGenerations.set(childId, nextGen);
        queue.push({ id: childId, gen: nextGen });
      }
    }
  }

  return updatedGenerations;
}

/**
 * Chính sách Safe Delete RESTRICT:
 * Kiểm tra xem một thành viên có được phép xóa không.
 * - Chỉ cho phép xóa Node Lá (không có con cháu).
 * - Cấm xóa nếu đang có con cái.
 */
export function canDeleteMember(
  memberId: string,
  members: MemberRecord[]
): { canDelete: boolean; childrenCount: number; reason?: string } {
  const children = members.filter(
    (m) => m.father_id === memberId || m.mother_id === memberId
  );

  if (children.length > 0) {
    return {
      canDelete: false,
      childrenCount: children.length,
      reason: `Không thể xóa thành viên đang có ${children.length} con cái trong dòng họ. Vui lòng chuyển giao quyền làm cha/mẹ hoặc gán ẩn danh!`,
    };
  }

  return {
    canDelete: true,
    childrenCount: 0,
  };
}

/**
 * Phát hiện Hôn nhân Nội tộc qua thuật toán Lowest Common Ancestor (LCA).
 */
export function detectConsanguinity(
  memberAId: string,
  memberBId: string,
  members: MemberRecord[]
): {
  isConsanguineous: boolean;
  commonAncestorId?: string | null;
  commonAncestorName?: string | null;
  generationDelta?: number;
  message?: string;
} {
  if (!memberAId || !memberBId || memberAId === memberBId) {
    return { isConsanguineous: false };
  }

  // Chuyển đổi MemberRecord sang dạng Member tương thích với kinship-engine
  const membersMap = new Map<string, Member>();
  for (const m of members) {
    membersMap.set(m.id, {
      id: m.id,
      full_name: m.full_name,
      alias_name: m.alias_name || null,
      gender: m.gender,
      life_status: m.life_status,
      father_id: m.father_id || null,
      mother_id: m.mother_id || null,
      birth_date: m.birth_date || null,
      birth_year: m.birth_year || null,
      death_date: m.death_date || null,
      death_year: m.death_year || null,
      death_lunar_day: m.death_lunar_day || null,
      death_lunar_month: m.death_lunar_month || null,
      death_lunar_is_leap: !!m.death_lunar_is_leap,
      death_lunar_year_name: m.death_lunar_year_name || null,
      burial_location: m.burial_location || null,
      avatar_url: null,
      phone: null,
      address: null,
      biography: m.notes || null,
      generation_number: m.generation_level,
      birth_order: m.birth_order || 1,
      is_senior_branch: !!m.is_senior,
      is_adopted: !!m.is_adopted,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  try {
    const lcaResult = findLowestCommonAncestor(memberAId, memberBId, membersMap);
    if (lcaResult.lcaNodeId && lcaResult.relationshipType !== 'unrelated' && lcaResult.relationshipType !== 'same_person') {
      return {
        isConsanguineous: true,
        commonAncestorId: lcaResult.lcaNodeId,
        commonAncestorName: lcaResult.lcaNodeName,
        generationDelta: lcaResult.generationDelta,
        message: `Phát hiện hôn nhân nội tộc: Hai người có chung Tổ tiên là ${lcaResult.lcaNodeName} (Độ lệch thế hệ: ${lcaResult.generationDelta}). Hệ thống sẽ kích hoạt Ghost Node 🔗 trên cây.`,
      };
    }
  } catch (err) {
    console.error('Lỗi khi tính LCA phát hiện hôn nhân nội tộc:', err);
  }

  return { isConsanguineous: false };
}

export class BiologicalAgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BiologicalAgeError';
  }
}

/**
 * Kiểm thực tính hợp lý của năm sinh giữa con và cha/mẹ.
 * Quy tắc: Con không thể sinh trước hoặc cùng năm với Bố/Mẹ.
 */
export function validateParentChildAge(
  childBirthYear: number | null | undefined,
  parentBirthYear: number | null | undefined,
  parentRole: 'Bố' | 'Mẹ' | 'Cha' = 'Bố',
  parentName?: string
): { isValid: boolean; warning?: string } {
  if (!childBirthYear || !parentBirthYear) {
    return { isValid: true };
  }

  if (childBirthYear <= parentBirthYear) {
    const parentLabel = parentName
      ? `${parentRole} ${parentName} (${parentBirthYear})`
      : `${parentRole} (${parentBirthYear})`;
    throw new BiologicalAgeError(
      `Năm sinh của con (${childBirthYear}) không thể trước hoặc cùng năm sinh của ${parentLabel}.`
    );
  }

  const gap = childBirthYear - parentBirthYear;
  if (gap < 15) {
    return {
      isValid: true,
      warning: `Khoảng cách tuổi giữa ${parentRole} và con khá gần (${gap} tuổi). Vui lòng kiểm tra lại nếu có nhầm lẫn.`,
    };
  }

  return { isValid: true };
}

/**
 * Kiểm tra và phân giải xung đột Con Trưởng trong cùng một gia đình.
 * Quy tắc: Tại mọi thời điểm chỉ có tối đa 1 người là Con Trưởng (is_senior = true).
 */
export function resolveSeniorConflict(
  targetChildId: string | undefined,
  siblings: MemberRecord[],
  wantsSenior: boolean
): {
  hasConflict: boolean;
  currentSenior?: MemberRecord;
  updatedSiblings: MemberRecord[];
} {
  const currentSenior = siblings.find((s) => s.is_senior && s.id !== targetChildId);

  if (!wantsSenior) {
    return {
      hasConflict: false,
      currentSenior,
      updatedSiblings: siblings,
    };
  }

  if (currentSenior) {
    // Có xung đột: Hạ cờ con trưởng cũ của anh chị em
    const updatedSiblings = siblings.map((s) =>
      s.id === currentSenior.id ? { ...s, is_senior: false } : s
    );
    return {
      hasConflict: true,
      currentSenior,
      updatedSiblings,
    };
  }

  return {
    hasConflict: false,
    updatedSiblings: siblings,
  };
}
