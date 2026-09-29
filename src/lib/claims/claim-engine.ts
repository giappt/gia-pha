import type { ProposedChildData, BranchNode, UserRole } from '@/types/database';
import type { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import {
  resolveMemberBranchHierarchy,
  findBranchNode,
} from '@/lib/tree-layout/branch-engine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface MemberContextCardInfo {
  id: string;
  fullName: string;
  gender: string;
  birthYear: number | null;
  generationLevel: number;
  parentInfo: string;
  branchInfo: string;
  displaySummary: string;
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu con cái đề xuất mới
 */
export function validateProposedChildData(
  data?: Partial<ProposedChildData> | null
): ValidationResult {
  const errors: string[] = [];

  if (!data) {
    return { isValid: false, errors: ['Thiếu dữ liệu đề xuất'] };
  }

  const name = (data.full_name || '').trim();
  if (!name) {
    errors.push('Họ và tên không được để trống');
  } else if (name.length < 2) {
    errors.push('Họ và tên quá ngắn');
  }

  if (!data.gender || (data.gender !== 'male' && data.gender !== 'female')) {
    errors.push('Giới tính phải là "Nam" hoặc "Nữ"');
  }

  const currentYear = new Date().getFullYear();
  if (data.birth_year != null) {
    const year = Number(data.birth_year);
    if (isNaN(year) || year < 1850 || year > currentYear + 1) {
      errors.push(`Năm sinh không hợp lệ (từ 1850 đến ${currentYear + 1})`);
    }
  }

  if (data.birth_order != null) {
    const order = Number(data.birth_order);
    if (isNaN(order) || order < 1 || !Number.isInteger(order)) {
      errors.push('Thứ tự sinh phải là số nguyên dương (>= 1)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu Phiếu Yêu Cầu Xác Minh (Khi chưa rõ cha mẹ trên cây)
 */
export function validateFindOriginData(
  data?: Partial<ProposedChildData> | null
): ValidationResult {
  const errors: string[] = [];

  if (!data) {
    return { isValid: false, errors: ['Thiếu dữ liệu yêu cầu'] };
  }

  const name = (data.full_name || '').trim();
  if (!name) {
    errors.push('Họ và tên không được để trống');
  } else if (name.length < 2) {
    errors.push('Họ và tên quá ngắn');
  }

  if (!data.gender || (data.gender !== 'male' && data.gender !== 'female')) {
    errors.push('Giới tính phải là "Nam" hoặc "Nữ"');
  }

  const rawParent = (data.raw_parent_info || '').trim();
  if (!rawParent) {
    errors.push('Vui lòng nhập Tên Bố / Mẹ ngoài đời để Ban Quản Trị có thông tin đối chiếu');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Tự động xác định Chi/Ngánh mặc định của thành viên dựa vào cây phân cấp tông tộc
 */
export function deduceUserBranchFocus(
  memberId: string,
  members: MemberRecord[],
  branches: BranchNode[],
  spouseRelations?: SpouseRelationRecord[]
): string | null {
  if (!memberId || !Array.isArray(members) || !Array.isArray(branches) || branches.length === 0) {
    return null;
  }

  const res = resolveMemberBranchHierarchy(memberId, members, branches, spouseRelations);
  if (res.matchedBranchIds && res.matchedBranchIds.length > 0) {
    // Trả về ID của nhánh sâu nhất (ví dụ: Chi 2 trong Ngành 1 > Chi 2)
    return res.matchedBranchIds[res.matchedBranchIds.length - 1];
  }

  return null;
}

/**
 * Định dạng thẻ ngữ cảnh nhận diện thành viên 3 thế hệ (chống trùng tên)
 */
export function formatMemberContextCard(
  member: MemberRecord,
  membersMap: Map<string, MemberRecord>,
  branches: BranchNode[] = [],
  spouseRelations: SpouseRelationRecord[] = []
): MemberContextCardInfo {
  const genderStr = member.gender === 'male' ? 'Nam' : 'Nữ';
  const birthYearStr = member.birth_year ? `(${member.birth_year})` : '';

  // 1. Phân giải thông tin cha mẹ
  const father = member.father_id ? membersMap.get(member.father_id) : null;
  const mother = member.mother_id ? membersMap.get(member.mother_id) : null;

  let parentInfo = 'Chưa rõ cha mẹ';
  if (father && mother) {
    parentInfo = `Con cụ: ${father.full_name} & Bà: ${mother.full_name}`;
  } else if (father) {
    parentInfo = `Con cụ: ${father.full_name} (Đời ${father.generation_level || 1})`;
  } else if (mother) {
    parentInfo = `Con bà: ${mother.full_name}`;
  }

  // 2. Phân giải thông tin Chi/Ngành
  const branchRes = resolveMemberBranchHierarchy(
    member.id,
    Array.from(membersMap.values()),
    branches,
    spouseRelations
  );

  const genStr = `Đời ${member.generation_level || 1}`;
  const branchPath = branchRes.branchPath ? ` · ${branchRes.branchPath}` : '';
  const branchInfo = `${genStr}${branchPath}`;

  const displaySummary = `${member.full_name} ${birthYearStr} · ${branchInfo} · ${parentInfo}`.trim();

  return {
    id: member.id,
    fullName: member.full_name,
    gender: genderStr,
    birthYear: member.birth_year || null,
    generationLevel: member.generation_level || 1,
    parentInfo,
    branchInfo,
    displaySummary,
  };
}

/**
 * Kiểm tra xem một người dùng có quyền quản lý/thao tác trên node thành viên targetMemberId hay không
 * Tuân thủ mô hình 3 tầng:
 * 1. super_admin: Toàn quyền
 * 2. branch_editor: Cây con thuộc assigned_branch_code
 * 3. claimed_member: Bản thân, Vợ/Chồng, và Con đẻ của mình
 */
export function canUserManageMember(
  user: {
    id?: string;
    user_role?: UserRole | string;
    linked_member_id?: string | null;
    assigned_branch_code?: string | null;
  } | null | undefined,
  targetMemberId: string,
  members: MemberRecord[],
  spouseRelations: SpouseRelationRecord[] = [],
  branches: BranchNode[] = []
): boolean {
  if (!user || !targetMemberId || !Array.isArray(members)) return false;

  // 1. Super Admin luôn có quyền
  if (user.user_role === 'super_admin') return true;

  const memberMap = new Map<string, MemberRecord>();
  for (const m of members) {
    if (m?.id) memberMap.set(m.id, m);
  }

  const target = memberMap.get(targetMemberId);
  if (!target) return false;

  // 2. Branch Editor: Kiểm tra targetMemberId có thuộc cây con của assigned_branch_code hay không
  if (user.user_role === 'branch_editor') {
    if (!user.assigned_branch_code) return false;
    const branchRes = resolveMemberBranchHierarchy(
      targetMemberId,
      members,
      branches,
      spouseRelations
    );
    // Khớp mã hoặc ID của nhánh
    return (
      branchRes.matchedBranchIds.includes(user.assigned_branch_code) ||
      branchRes.hierarchyLabels.some(
        (lbl) => lbl.toLowerCase() === user.assigned_branch_code?.toLowerCase()
      )
    );
  }

  // 3. Claimed Member (Chủ Hộ / Bố Mẹ):
  if (user.user_role === 'claimed_member' && user.linked_member_id) {
    const myId = user.linked_member_id;

    // A. Chính bản thân
    if (targetMemberId === myId) return true;

    // B. Vợ / Chồng
    const isSpouse = spouseRelations.some(
      (rel) =>
        (rel.member_a_id === myId && rel.member_b_id === targetMemberId) ||
        (rel.member_b_id === myId && rel.member_a_id === targetMemberId)
    );
    if (isSpouse) return true;

    // C. Con đẻ trực hệ (có father_id hoặc mother_id là myId)
    if (target.father_id === myId || target.mother_id === myId) {
      return true;
    }

    return false;
  }

  return false;
}

export interface CandidateSpouseItem {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  birthYear?: number | null;
  spouseTitle: string;
}

/**
 * Trích xuất danh sách bạn đời của một người Cha/Mẹ kèm danh xưng (Mẹ cả, Mẹ hai, Bố cả...)
 */
export function getCandidateSpouses(
  parentId: string,
  membersMap: Map<string, MemberRecord>,
  spouseRelations: SpouseRelationRecord[] = []
): CandidateSpouseItem[] {
  if (!parentId) return [];
  const parent = membersMap.get(parentId);
  if (!parent) return [];

  const spouseRels = spouseRelations.filter(
    (s) => s.member_a_id === parentId || s.member_b_id === parentId
  );
  const spouseIds = spouseRels.map((s) =>
    s.member_a_id === parentId ? s.member_b_id : s.member_a_id
  );

  const wivesOrHusbands = spouseIds
    .map((id) => membersMap.get(id))
    .filter((m): m is MemberRecord => !!m);

  return wivesOrHusbands.map((sp, idx) => {
    let spouseTitle = 'Vợ/Chồng';
    const rankWords = ['cả', 'hai', 'ba', 'tư', 'năm'];
    const rankWord = idx < rankWords.length ? rankWords[idx] : String(idx + 1);

    if (parent.gender === 'male') {
      spouseTitle = wivesOrHusbands.length === 1 ? 'Mẹ' : `Mẹ (Bà ${rankWord})`;
    } else {
      spouseTitle = wivesOrHusbands.length === 1 ? 'Bố' : `Bố (Chồng ${rankWord})`;
    }

    return {
      id: sp.id,
      fullName: sp.full_name,
      gender: sp.gender as 'male' | 'female',
      birthYear: sp.birth_year || null,
      spouseTitle,
    };
  });
}

/**
 * Định dạng tên hiển thị của Cha/Mẹ kèm tên bạn đời (Vợ: Chu Thị Hà) khi tìm kiếm
 */
export function getParentDisplayNameWithSpouse(
  parent: MemberRecord,
  membersMap: Map<string, MemberRecord>,
  spouseRelations: SpouseRelationRecord[] = [],
  branches: BranchNode[] = []
): string {
  const candidates = getCandidateSpouses(parent.id, membersMap, spouseRelations);
  const spouseText =
    candidates.length > 0
      ? ` (${parent.gender === 'male' ? 'Vợ' : 'Chồng'}: ${candidates.map((c) => c.fullName).join(', ')})`
      : '';
  const genText = `Đời ${parent.generation_level || 1}`;

  const branchRes = resolveMemberBranchHierarchy(
    parent.id,
    Array.from(membersMap.values()),
    branches,
    spouseRelations
  );
  const branchPath = branchRes.branchPath ? ` · ${branchRes.branchPath}` : '';

  return `${parent.full_name}${spouseText} · ${genText}${branchPath}`;
}

export interface BirthOrderSuggestion {
  suggestedOrder: number;
  explanation: string;
}

/**
 * Sinh câu giải thích ngữ cảnh trực quan theo số thứ tự con được chọn
 */
export function calculateBirthOrderExplanation(
  targetOrder: number,
  existingChildren: { id: string; full_name: string; birth_order?: number | null; birth_year?: number | null }[]
): string {
  const sorted = [...existingChildren].sort((a, b) => (a.birth_order || 0) - (b.birth_order || 0));
  if (sorted.length === 0) {
    return 'Là con đầu lòng trong gia đình.';
  }

  const maxOrder = Math.max(...sorted.map((c) => c.birth_order || 0), sorted.length);
  if (targetOrder > maxOrder) {
    const lastChild = sorted[sorted.length - 1];
    return `Là con kế tiếp (sau ${lastChild.full_name}).`;
  }

  if (targetOrder === 1) {
    const firstChild = sorted[0];
    return `Con đầu lòng (đứng trước ${firstChild.full_name}, các anh chị em hiện có sẽ lùi lại 1 bậc khi duyệt).`;
  }

  // Chèn vào giữa
  const prevChild = sorted.find((c) => (c.birth_order || 0) === targetOrder - 1) || sorted[targetOrder - 2];
  const nextChild = sorted.find((c) => (c.birth_order || 0) >= targetOrder);

  if (prevChild && nextChild) {
    return `Đứng sau ${prevChild.full_name}, đứng trước ${nextChild.full_name} (khi duyệt, ${nextChild.full_name} và các em sẽ tự động tăng 1 bậc).`;
  } else if (prevChild) {
    return `Đứng sau ${prevChild.full_name}.`;
  } else if (nextChild) {
    return `Đứng trước ${nextChild.full_name} (khi duyệt, ${nextChild.full_name} sẽ tăng 1 bậc).`;
  }

  return `Vị trí con Thứ #${targetOrder} trong gia đình.`;
}

/**
 * Thuật toán tự động gợi ý thứ tự con thông minh:
 * 1. Ưu tiên so sánh năm sinh nếu có
 * 2. Lấp lỗ hổng (gap) nếu có số thứ tự bị khuyết
 * 3. Mặc định là số kế tiếp (max + 1)
 */
export function calculateSuggestedBirthOrder(
  birthYear: number | null | undefined,
  existingChildren: { id: string; full_name: string; birth_order?: number | null; birth_year?: number | null }[]
): BirthOrderSuggestion {
  const sorted = [...existingChildren].sort((a, b) => (a.birth_order || 0) - (b.birth_order || 0));
  if (sorted.length === 0) {
    return {
      suggestedOrder: 1,
      explanation: 'Là con đầu lòng trong gia đình.',
    };
  }

  // 1. So sánh năm sinh nếu người dùng có nhập và có ít nhất 1 con có năm sinh
  if (birthYear != null) {
    const nextIdx = sorted.findIndex((c) => c.birth_year != null && c.birth_year > birthYear);
    if (nextIdx === 0) {
      // Sinh trước con đầu tiên
      const order = 1;
      return {
        suggestedOrder: order,
        explanation: calculateBirthOrderExplanation(order, sorted),
      };
    } else if (nextIdx > 0) {
      // Chèn ở giữa
      const targetOrder = sorted[nextIdx].birth_order || nextIdx + 1;
      return {
        suggestedOrder: targetOrder,
        explanation: calculateBirthOrderExplanation(targetOrder, sorted),
      };
    }
  }

  // 2. Tìm vị trí bị khuyết (gap)
  const existingOrders = new Set(
    sorted.map((c) => c.birth_order).filter((o): o is number => o != null && o > 0)
  );
  const maxOrder = Math.max(...Array.from(existingOrders), 0);
  for (let i = 1; i <= maxOrder; i++) {
    if (!existingOrders.has(i)) {
      return {
        suggestedOrder: i,
        explanation: `Vị trí còn thiếu gần nhất (#${i}) trong gia đình.`,
      };
    }
  }

  // 3. Vị trí kế tiếp sau con út
  const nextOrder = maxOrder + 1;
  return {
    suggestedOrder: nextOrder,
    explanation: calculateBirthOrderExplanation(nextOrder, sorted),
  };
}

/**
 * Lọc danh sách thành viên cho Tab 1 (Nhận Node Đã Có):
 * Bảo mật 100%: Lọc bỏ hoàn toàn các hồ sơ đã có tài khoản liên kết (claimedMemberIds)
 */
export function filterUnclaimedCandidateMembers(
  members: MemberRecord[],
  claimedMemberIds: string[],
  searchQuery: string,
  membersMap: Map<string, MemberRecord>
): MemberRecord[] {
  if (!searchQuery.trim()) return [];
  const q = searchQuery.toLowerCase().trim();
  const claimedSet = new Set(claimedMemberIds);

  return members.filter((m) => {
    // 1. Bảo mật: Bỏ qua 100% hồ sơ đã liên kết
    if (claimedSet.has(m.id)) return false;

    // 2. Tìm kiếm tên mình hoặc tên cha
    const nameMatch = m.full_name?.toLowerCase().includes(q);
    const father = m.father_id ? membersMap.get(m.father_id) : null;
    const fatherMatch = father?.full_name?.toLowerCase().includes(q);
    return nameMatch || fatherMatch;
  });
}

