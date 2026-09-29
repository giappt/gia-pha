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

export const DEFAULT_BRANCH_TIERS: string[] = ['Ngành', 'Chi', 'Nhánh', 'Phái'];

/**
 * Tự động xác định cấp bậc con kế tiếp dựa vào thứ bậc phân tầng đã định nghĩa của dòng họ.
 * Ví dụ: availableTiers = ['Ngành', 'Chi', 'Nhánh', 'Phái']
 * - currentTier = 'Ngành' -> 'Chi'
 * - currentTier = 'Chi' -> 'Nhánh'
 * - currentTier = 'Phái' -> 'Phái' (cấp cuối giữ nguyên)
 */
export function getNextTierName(
  currentTier?: string | null,
  availableTiers: string[] = DEFAULT_BRANCH_TIERS
): string {
  const tiers = Array.isArray(availableTiers) && availableTiers.length > 0
    ? availableTiers
    : [];

  if (tiers.length === 0) {
    return currentTier || 'Nhánh';
  }

  if (!currentTier) return tiers[0] || 'Chi';

  const normalizedCurrent = currentTier.trim().toLowerCase();
  const foundIndex = tiers.findIndex((t) => t.trim().toLowerCase() === normalizedCurrent);

  if (foundIndex >= 0) {
    if (foundIndex < tiers.length - 1) {
      return tiers[foundIndex + 1];
    }
    return tiers[foundIndex]; // Cấp cuối cùng giữ nguyên
  }

  // Nếu cấp hiện tại không nằm trong danh sách, trả về cấp thứ 2 (ví dụ Chi) hoặc cấp cuối
  return tiers[1] || tiers[0] || 'Chi';
}

/**
 * Duyệt đệ quy toàn bộ cây phân chi để tìm các nhánh đang sử dụng một cấp bậc cụ thể.
 * Dùng làm Integrity Guard để chặn xóa các cấp bậc đang được gán cho dữ liệu thực tế.
 */
export function findBranchesUsingTier(
  branches: BranchNode[],
  tierName: string
): BranchNode[] {
  const target = (tierName || '').trim().toLowerCase();
  if (!target || !Array.isArray(branches)) return [];
  const result: BranchNode[] = [];

  function traverse(nodes: BranchNode[]) {
    for (const node of nodes) {
      if ((node.tierName || '').trim().toLowerCase() === target) {
        result.push(node);
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(branches);
  return result;
}

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
 * Trích xuất toàn bộ ID các vị Cụ Tổ tiền nhân trực hệ (kèm phối ngẫu) từ Cụ Khởi Nhánh (rootMemberId)
 * ngược lên tới Cụ Thủy Tổ Đời 1.
 * Dùng để bảo toàn các Cụ Tổ đời trên (như Cụ Nguyễn Thị Hiền Đời 4) khi con cháu lọc xem Lịch Giỗ theo Chi/Ngành.
 */
export function getBranchAncestorIds(
  branchId: string | null | undefined,
  branches: BranchNode[],
  members: MemberRecord[],
  spouseRelations?: SpouseRelationRecord[]
): Set<string> {
  const ancestorIds = new Set<string>();
  if (!branchId || branchId === 'all' || !Array.isArray(branches) || !Array.isArray(members) || members.length === 0) {
    return ancestorIds;
  }

  const targetNode = findBranchNode(branches, branchId);
  if (!targetNode || !targetNode.rootMemberId) {
    return ancestorIds;
  }

  const memberMap = new Map<string, MemberRecord>();
  for (const m of members) {
    if (m?.id) memberMap.set(m.id, m);
  }

  const spouseMap = new Map<string, Set<string>>();
  if (Array.isArray(spouseRelations)) {
    for (const rel of spouseRelations) {
      if (!rel.member_a_id || !rel.member_b_id) continue;
      if (!spouseMap.has(rel.member_a_id)) spouseMap.set(rel.member_a_id, new Set());
      if (!spouseMap.has(rel.member_b_id)) spouseMap.set(rel.member_b_id, new Set());
      spouseMap.get(rel.member_a_id)!.add(rel.member_b_id);
      spouseMap.get(rel.member_b_id)!.add(rel.member_a_id);
    }
  }

  // Dò ngược chuỗi phụ hệ từ rootMemberId lên Cụ Thủy Tổ Đời 1
  let curr = memberMap.get(targetNode.rootMemberId);
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    ancestorIds.add(curr.id);

    // Bổ sung cả phối ngẫu của vị Cụ Tổ này (nếu có)
    const spouses = spouseMap.get(curr.id);
    if (spouses) {
      spouses.forEach((spouseId) => {
        ancestorIds.add(spouseId);
      });
    }

    if (curr.father_id) {
      curr = memberMap.get(curr.father_id);
    } else {
      break;
    }
  }

  return ancestorIds;
}

/**
 * Lọc danh sách thành viên thuộc về một nhánh cụ thể (bao gồm con cháu của toàn bộ nhánh con)
 * Hỗ trợ tham số lineageDepth:
 * - 'from_root': Bảo toàn các vị Cụ Tổ tiền nhân trực hệ từ Cụ Thủy Tổ Đời 1 đến Cụ Khởi Chi.
 * - 'from_branch' (Mặc định): Chỉ lấy từ Cụ Khởi Chi trở xuống con cháu.
 */
export function filterMembersByBranch(
  members: MemberRecord[],
  branchId: string | null | undefined,
  branches: BranchNode[],
  spouseRelations?: SpouseRelationRecord[],
  lineageDepth: 'from_root' | 'from_branch' = 'from_branch'
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

  const branchAncestorIds =
    lineageDepth === 'from_root'
      ? getBranchAncestorIds(branchId, branches, members, spouseRelations)
      : new Set<string>();

  return members.filter((member) => {
    // 1. Nếu là Cụ Tổ tiền nhân trực hệ của nhánh (khi ở chế độ from_root)
    if (branchAncestorIds.has(member.id)) {
      return true;
    }

    // 2. Nếu là hậu duệ của nhánh (hoặc con dâu/con rể kế thừa theo chồng/vợ)
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

/**
 * Trả về nhãn nấc 2 động theo cấp bậc gốc cao nhất trong CSDL (clan_settings.branch_tiers[0] hoặc branches[0].tierName)
 * Ví dụ: 'Từ Gốc Ngành', 'Từ Gốc Phái'... Fallback: 'Từ Gốc Ngành'
 */
export function resolveRootTierLabel(
  branchTiers?: string[],
  branches?: BranchNode[]
): string {
  if (Array.isArray(branches) && branches.length > 0 && branches[0]?.tierName) {
    return `Từ Gốc ${branches[0].tierName}`;
  }
  const firstTier = Array.isArray(branchTiers) && branchTiers.length > 0 ? branchTiers[0] : 'Ngành';
  return `Từ Gốc ${firstTier || 'Ngành'}`;
}

/**
 * Trích xuất ID các Cụ Tổ tiền nhân nằm bên trên Cụ Khởi Nhánh Gốc (Root Tier Branch)
 * Dùng cho nấc 2 'Từ Gốc Ngành' của 'Nhánh của tôi':
 * Chỉ loại bỏ các Cụ Tổ thời kỳ đầu trước khi phân ngành (Cụ Đời 1, Cụ Hiền Đời 4),
 * và BẢO TOÀN 100% Cụ Khởi Ngành trở xuống: Ông Bà Nội, Bác/Chú, Bố Mẹ, Bản thân...
 */
export function getRootBranchPredecessorIds(
  rootBranchId: string | null | undefined,
  branches: BranchNode[],
  members: MemberRecord[],
  spouseRelations?: SpouseRelationRecord[]
): Set<string> {
  const predecessorIds = new Set<string>();
  if (!rootBranchId || !Array.isArray(branches) || !Array.isArray(members) || members.length === 0) {
    return predecessorIds;
  }

  const rootNode = findBranchNode(branches, rootBranchId);
  if (!rootNode || !rootNode.rootMemberId) {
    return predecessorIds;
  }

  const memberMap = new Map<string, MemberRecord>();
  for (const m of members) {
    if (m?.id) memberMap.set(m.id, m);
  }

  const spouseMap = new Map<string, Set<string>>();
  if (Array.isArray(spouseRelations)) {
    for (const rel of spouseRelations) {
      if (!rel.member_a_id || !rel.member_b_id) continue;
      if (!spouseMap.has(rel.member_a_id)) spouseMap.set(rel.member_a_id, new Set());
      if (!spouseMap.has(rel.member_b_id)) spouseMap.set(rel.member_b_id, new Set());
      spouseMap.get(rel.member_a_id)!.add(rel.member_b_id);
      spouseMap.get(rel.member_b_id)!.add(rel.member_a_id);
    }
  }

  const rootMember = memberMap.get(rootNode.rootMemberId);
  if (!rootMember || !rootMember.father_id) {
    return predecessorIds;
  }

  // Bắt đầu duyệt ngược từ CHA của Cụ Khởi Ngành (không bao gồm Cụ Khởi Ngành)
  let curr = memberMap.get(rootMember.father_id);
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    predecessorIds.add(curr.id);

    const spouses = spouseMap.get(curr.id);
    if (spouses) {
      spouses.forEach((spId) => predecessorIds.add(spId));
    }

    if (curr.father_id) {
      curr = memberMap.get(curr.father_id);
    } else {
      break;
    }
  }

  return predecessorIds;
}

/**
 * Lọc danh sách thành viên cho chế độ 'Nhánh của tôi'
 * Hỗ trợ 2 nấc:
 * - 'from_root': Giữ toàn bộ trục dọc từ Cụ Thủy Tổ Đời 1, Cụ Hiền Đời 4, Cụ Khởi Ngành, Ông Bà Nội, Bác/Chú, Bố Mẹ, Bản thân
 * - 'from_branch': Chỉ ẩn các Cụ Tổ thời kỳ đầu trước khi phân ngành (Cụ Đời 1, Cụ Đời 4);
 *                  BẢO TOÀN 100% từ Cụ Khởi Ngành trở xuống: Ông Bà Nội (như Bà nội Nguyễn Thị Chăm), Bác/Chú, Bố Mẹ, Bản thân
 */
export function filterMembersByMyLineage(
  members: MemberRecord[],
  viewerMemberId: string,
  branches: BranchNode[],
  spouseRelations?: SpouseRelationRecord[],
  lineageDepth: 'from_root' | 'from_branch' = 'from_root'
): MemberRecord[] {
  if (!viewerMemberId || !Array.isArray(members) || members.length === 0) {
    return members;
  }

  if (lineageDepth === 'from_root') {
    return members;
  }

  // lineageDepth === 'from_branch' (Từ Gốc Ngành/Phái):
  // 1. Tìm nhánh cấp gốc cao nhất (Root Tier Branch) mà người xem thuộc về
  const res = resolveMemberBranchHierarchy(viewerMemberId, members, branches, spouseRelations);
  const rootBranchId = res.matchedBranchIds.length > 0 ? res.matchedBranchIds[0] : null;

  if (!rootBranchId) {
    return members;
  }

  // 2. Lấy danh sách ID các Cụ Tổ thời kỳ đầu (trước Cụ Khởi Ngành)
  const predecessorIds = getRootBranchPredecessorIds(rootBranchId, branches, members, spouseRelations);

  // 3. Loại bỏ các Cụ Tổ thời kỳ đầu, giữ lại toàn bộ con cháu từ Cụ Khởi Ngành trở xuống (Ông Bà Nội, Bác, Chú, Bố Mẹ...)
  return members.filter((m) => !predecessorIds.has(m.id));
}

