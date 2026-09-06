import type { BranchNode } from '@/types/database';
import type { MemberRecord, SpouseRelationRecord } from '@/types/tree';

export type { BranchNode };

export interface FlattenedBranchItem extends BranchNode {
  depth: number;
  pathName: string;
  fullTitle: string;
}

export interface MemberBranchResolution {
  branchPath: string;            // Ví dụ: "Ngành 1 · Chi 2"
  matchedBranchIds: string[];    // Danh sách ID các tầng nhánh phù hợp: ["b1", "b2"]
  primaryBranchName: string | null; // Tên nhánh sâu nhất: "Chi 2"
  hierarchyLabels: string[];     // ["Ngành 1", "Chi 2"]
}

export const USER_PREFERENCES_STORAGE_KEY = 'fat_user_preferences';
export const USER_PREFERENCES_EVENT = 'fat_user_preferences_changed';

export interface UserPreferences {
  focusedBranchId: string | null;
  enablePushNotifications: boolean;
}

/**
 * Định dạng tên hiển thị của một nhánh thông minh, tránh trùng lặp từ tố (ví dụ "Ngành Ngành 1")
 */
export function formatBranchTitle(tierName?: string, name?: string): string {
  const t = (tierName || '').trim();
  const n = (name || '').trim();
  if (!t) return n;
  if (!n) return t;
  if (n.toLowerCase().startsWith(t.toLowerCase())) {
    return n;
  }
  return `${t} ${n}`;
}

/**
 * Làm phẳng cây phân chi thành danh sách tuyến tính với độ sâu và đường dẫn phân cấp.
 */
export function flattenBranchTree(
  branches: BranchNode[],
  parentPath = '',
  depth = 0
): FlattenedBranchItem[] {
  if (!Array.isArray(branches)) return [];

  const result: FlattenedBranchItem[] = [];

  for (const node of branches) {
    if (!node || !node.id) continue;

    const fullTitle = formatBranchTitle(node.tierName, node.name);
    const pathName = parentPath ? `${parentPath} > ${fullTitle}` : fullTitle;

    result.push({
      ...node,
      depth,
      pathName,
      fullTitle,
    });

    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(...flattenBranchTree(node.children, pathName, depth + 1));
    }
  }

  return result;
}

/**
 * Tìm kiếm một BranchNode theo ID trong cây phân cấp
 */
export function findBranchNode(branches: BranchNode[], branchId: string): BranchNode | null {
  if (!Array.isArray(branches) || !branchId) return null;

  for (const node of branches) {
    if (node.id === branchId) return node;
    if (Array.isArray(node.children) && node.children.length > 0) {
      const found = findBranchNode(node.children, branchId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Kiểm tra tính hợp lệ của cây phân chi:
 * - Không rỗng tên
 * - Không trùng lặp ID
 * - Không có vòng lặp cấu trúc
 */
export function validateBranchTree(branches: BranchNode[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  function traverse(nodes: BranchNode[], path: Set<string>) {
    for (const node of nodes) {
      if (!node.id || typeof node.id !== 'string') {
        errors.push('Tồn tại nhánh thiếu định danh ID');
        continue;
      }

      if (seenIds.has(node.id)) {
        errors.push(`Trùng lặp ID nhánh: "${node.id}"`);
      }
      seenIds.add(node.id);

      if (path.has(node.id)) {
        errors.push(`Phát hiện vòng lặp cấu trúc đệ quy tại nhánh ID "${node.id}"`);
        return;
      }

      if (!node.name || !node.name.trim()) {
        errors.push(`Nhánh có ID "${node.id}" không được để trống tên`);
      }

      if (Array.isArray(node.children) && node.children.length > 0) {
        const nextPath = new Set(path);
        nextPath.add(node.id);
        traverse(node.children, nextPath);
      }
    }
  }

  if (Array.isArray(branches)) {
    traverse(branches, new Set<string>());
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Duyệt ngược chuỗi phụ hệ (father chain) của một thành viên để xác định
 * họ thuộc Ngành/Chi nào dựa trên Cụ Khởi Nguồn (rootMemberId).
 */
export function resolveMemberBranchHierarchy(
  memberId: string,
  members: MemberRecord[],
  branches: BranchNode[],
  spouseRelations?: SpouseRelationRecord[]
): MemberBranchResolution {
  const emptyResult: MemberBranchResolution = {
    branchPath: '',
    matchedBranchIds: [],
    primaryBranchName: null,
    hierarchyLabels: [],
  };

  if (!memberId || !Array.isArray(members) || members.length === 0 || !Array.isArray(branches) || branches.length === 0) {
    return emptyResult;
  }

  const memberMap = new Map<string, MemberRecord>();
  for (const m of members) {
    if (m?.id) memberMap.set(m.id, m);
  }

  const target = memberMap.get(memberId);
  if (!target) return emptyResult;

  // Xây dựng chuỗi phụ hệ (father chain) từ thành viên lên tới Cụ Thủy Tổ
  const ancestorIdSet = new Set<string>();
  let curr: MemberRecord | undefined = target;
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    ancestorIdSet.add(curr.id);
    if (curr.father_id) {
      curr = memberMap.get(curr.father_id);
    } else {
      break;
    }
  }

  // Trường hợp con dâu/rể không có father trong họ, nhưng có spouse trong họ
  if (ancestorIdSet.size === 1 && !target.father_id && Array.isArray(spouseRelations) && spouseRelations.length > 0) {
    const relation = spouseRelations.find(
      (rel) => rel.member_a_id === target.id || rel.member_b_id === target.id
    );
    if (relation) {
      const spouseId = relation.member_a_id === target.id ? relation.member_b_id : relation.member_a_id;
      let spouseCurr = memberMap.get(spouseId);
      const spouseVisited = new Set<string>();
      while (spouseCurr && !spouseVisited.has(spouseCurr.id)) {
        spouseVisited.add(spouseCurr.id);
        ancestorIdSet.add(spouseCurr.id);
        if (spouseCurr.father_id) {
          spouseCurr = memberMap.get(spouseCurr.father_id);
        } else {
          break;
        }
      }
    }
  }

  // Khớp chuỗi tổ phụ với cây phân chi từ gốc xuống lá
  function matchBranchLineage(nodes: BranchNode[]): BranchNode[] {
    for (const node of nodes) {
      if (node.rootMemberId && ancestorIdSet.has(node.rootMemberId)) {
        // Node này khớp! Tiếp tục kiểm tra các nhánh con bên trong
        const matchedChildren = Array.isArray(node.children) && node.children.length > 0
          ? matchBranchLineage(node.children)
          : [];
        return [node, ...matchedChildren];
      }
    }
    return [];
  }

  const matchedNodes = matchBranchLineage(branches);
  if (matchedNodes.length === 0) {
    return emptyResult;
  }

  const matchedBranchIds = matchedNodes.map((n) => n.id);
  const hierarchyLabels = matchedNodes.map((n) => formatBranchTitle(n.tierName, n.name));
  const branchPath = hierarchyLabels.join(' · ');
  const primaryBranchName = hierarchyLabels[hierarchyLabels.length - 1] || null;

  return {
    branchPath,
    matchedBranchIds,
    primaryBranchName,
    hierarchyLabels,
  };
}

/**
 * Lọc danh sách thành viên thuộc về một nhánh cụ thể (bao gồm con cháu của toàn bộ nhánh con)
 */
export function filterMembersByBranch(
  members: MemberRecord[],
  branchId: string | null | undefined,
  branches: BranchNode[],
  spouseRelations?: SpouseRelationRecord[]
): MemberRecord[] {
  if (!branchId || branchId === 'all' || !Array.isArray(members)) {
    return members;
  }

  if (!Array.isArray(branches) || branches.length === 0) {
    return members;
  }

  const targetNode = findBranchNode(branches, branchId);
  if (!targetNode) {
    return members;
  }

  return members.filter((member) => {
    const { matchedBranchIds } = resolveMemberBranchHierarchy(
      member.id,
      members,
      branches,
      spouseRelations
    );
    return matchedBranchIds.includes(branchId);
  });
}

/**
 * Đọc tùy chọn cá nhân từ LocalStorage
 */
export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return { focusedBranchId: null, enablePushNotifications: false };
  }
  try {
    const stored = localStorage.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return { focusedBranchId: null, enablePushNotifications: false };
    }
    const parsed = JSON.parse(stored);
    return {
      focusedBranchId: parsed.focusedBranchId ?? null,
      enablePushNotifications: Boolean(parsed.enablePushNotifications),
    };
  } catch {
    return { focusedBranchId: null, enablePushNotifications: false };
  }
}

/**
 * Lưu tùy chọn cá nhân vào LocalStorage và phát sự kiện đồng bộ
 */
export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  if (typeof window === 'undefined') {
    return { focusedBranchId: null, enablePushNotifications: false, ...prefs };
  }
  try {
    const current = getUserPreferences();
    const updated: UserPreferences = {
      ...current,
      ...prefs,
    };
    localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(USER_PREFERENCES_EVENT, { detail: updated }));
    return updated;
  } catch {
    return { focusedBranchId: null, enablePushNotifications: false, ...prefs };
  }
}
