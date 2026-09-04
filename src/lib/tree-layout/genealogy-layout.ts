import {
  MemberRecord,
  SpouseRelationRecord,
  TreeNodeData,
  LayoutNode,
  LayoutEdge,
  TreeLayoutResult,
  TreeLayoutOptions,
  InternalSpouseInfo,
  ExternalSpouseInfo,
} from '@/types/tree';

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 96;
export const SPOUSE_GAP = 20;
export const SIBLING_GAP = 40;
export const LEVEL_HEIGHT = 220;

interface FamilyUnit {
  primaryMember: MemberRecord;
  spouses: MemberRecord[];
  isSpouseGhost: boolean[];
  children: FamilyUnit[];
  width: number;
  x: number;
  y: number;
  inlawRole?: 'daughter_in_law' | 'son_in_law';
  childRole?: 'paternal_grandchild' | 'maternal_grandchild';
  hasLeftHusbandGhost?: boolean;
}

/**
 * Thuật toán dàn trang cây phả hệ (Genealogy Tree Layout Engine)
 * - Phân tầng thế hệ Y = (generation_level - 1) * LEVEL_HEIGHT
 * - Tọa độ vợ chồng: X_spouse = X_primary + NODE_WIDTH + SPOUSE_GAP
 * - Zero collision: Tính độ rộng nhánh con (subtree width) từ dưới lên
 * - Hôn nhân nội tộc: Nhận diện thành viên có mặt ở cả 2 chi và xử lý dâu/rể nội tộc
 * - Tùy chọn showMaternalBranches: Ẩn/Hiện gia đình con gái lấy chồng ngoại tộc
 * - Tùy chọn focusRootId: Cho phép chọn bất kỳ ai làm Gốc và tự động đổi vai (Dâu/Rể, Cháu nội/ngoại)
 * - Hệ trục con cái hình thước thợ: Custom FamilyBusEdge chia sẻ thanh ngang chung Y_bus
 */
export function calculateTreeLayout(
  members: MemberRecord[],
  spouseRelations: SpouseRelationRecord[] = [],
  options: TreeLayoutOptions = { showMaternalBranches: true }
): TreeLayoutResult {
  if (!members || members.length === 0) {
    return { nodes: [], edges: [] };
  }

  const memberMap = new Map<string, MemberRecord>();
  members.forEach((m) => memberMap.set(m.id, m));

  // Lập bản đồ hôn phối: memberId -> spouseMemberId[]
  const spouseMap = new Map<string, string[]>();
  spouseRelations.forEach((rel) => {
    const listA = spouseMap.get(rel.member_a_id) || [];
    if (!listA.includes(rel.member_b_id)) listA.push(rel.member_b_id);
    spouseMap.set(rel.member_a_id, listA);

    const listB = spouseMap.get(rel.member_b_id) || [];
    if (!listB.includes(rel.member_a_id)) listB.push(rel.member_a_id);
    spouseMap.set(rel.member_b_id, listB);
  });

  // Lập bản đồ con cái: parentId -> children MemberRecord[]
  const childrenMap = new Map<string, MemberRecord[]>();
  members.forEach((m) => {
    if (m.father_id) {
      const list = childrenMap.get(m.father_id) || [];
      if (!list.some((c) => c.id === m.id)) list.push(m);
      childrenMap.set(m.father_id, list);
    }
    if (m.mother_id) {
      const list = childrenMap.get(m.mother_id) || [];
      if (!list.some((c) => c.id === m.id)) list.push(m);
      childrenMap.set(m.mother_id, list);
    }
  });

  // Sắp xếp đàn con: Ưu tiên birth_order trước, rồi đến birth_year
  childrenMap.forEach((childList) => {
    childList.sort((a, b) => {
      if (a.birth_order != null && b.birth_order != null) return a.birth_order - b.birth_order;
      if (a.birth_order != null && b.birth_order == null) return -1;
      if (a.birth_order == null && b.birth_order != null) return 1;
      if (a.birth_year != null && b.birth_year != null) return a.birth_year - b.birth_year;
      return a.full_name.localeCompare(b.full_name);
    });
  });

  // Xác định Con Trưởng (Trưởng Nam): Ưu tiên is_senior gán thủ công, hoặc mặc định con trai lớn nhất trong đàn con
  const seniorMemberIds = new Set<string>();
  childrenMap.forEach((childList) => {
    const explicitSenior = childList.find((c) => c.is_senior === true);
    if (explicitSenior) {
      seniorMemberIds.add(explicitSenior.id);
    } else {
      const oldestMale = childList.find((c) => c.gender === 'male');
      if (oldestMale) {
        seniorMemberIds.add(oldestMale.id);
      }
    }
  });

  // Tập hợp các ID có mặt trong cây huyết thống
  const lineageMemberIds = new Set<string>();
  members.forEach((m) => {
    if (m.father_id || m.mother_id || m.is_root) {
      lineageMemberIds.add(m.id);
    }
  });

  // Xác định Roots
  let primaryRoots: MemberRecord[] = [];
  const focusMember = options.focusRootId ? memberMap.get(options.focusRootId) : undefined;

  if (focusMember) {
    // Nếu có focusRootId: Gốc chính là người được chọn
    primaryRoots = [focusMember];
  } else {
    // Mặc định: Lấy root ancestor(s)
    let roots = members.filter((m) => m.is_root);
    if (roots.length === 0) {
      roots = members.filter((m) => !m.father_id && !m.mother_id);
    }
    if (roots.length === 0 && members.length > 0) {
      const minGen = Math.min(...members.map((m) => m.generation_level || 1));
      roots = members.filter((m) => (m.generation_level || 1) === minGen);
    }

    const processedRootIds = new Set<string>();
    roots.forEach((r) => {
      if (processedRootIds.has(r.id)) return;
      const spouses = (spouseMap.get(r.id) || [])
        .map((id) => memberMap.get(id))
        .filter((m): m is MemberRecord => !!m);

      processedRootIds.add(r.id);
      spouses.forEach((s) => processedRootIds.add(s.id));

      if (r.gender === 'female' && spouses.some((s) => s.gender === 'male')) {
        const maleSpouse = spouses.find((s) => s.gender === 'male')!;
        primaryRoots.push(maleSpouse);
      } else {
        primaryRoots.push(r);
      }
    });
  }

  // Thuật toán kiểm tra huyết thống so với Gốc đang xem (nếu có focusMember)
  // Trả về: 'paternal' (theo đường nam) hoặc 'maternal' (theo đường nữ)
  function getLineagePerspective(memberId: string): 'paternal' | 'maternal' {
    if (!focusMember || memberId === focusMember.id) return 'paternal';

    let curr: MemberRecord | undefined = memberMap.get(memberId);
    while (curr && curr.id !== focusMember.id) {
      if (curr.mother_id === focusMember.id) return 'maternal';
      if (curr.father_id === focusMember.id) return 'paternal';

      const parentMember: MemberRecord | undefined =
        (curr.mother_id && memberMap.get(curr.mother_id)) ||
        (curr.father_id && memberMap.get(curr.father_id)) ||
        undefined;

      if (!parentMember) break;
      if (parentMember.gender === 'female') return 'maternal';
      curr = parentMember;
    }
    return 'paternal';
  }

  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const renderedNodeIds = new Set<string>();

  // Xây dựng cây FamilyUnit đệ quy
  function buildFamilyUnit(
    primary: MemberRecord,
    visitedPath: Set<string>,
    parentPerspective?: 'paternal' | 'maternal'
  ): FamilyUnit {
    const currentVisited = new Set(visitedPath);
    currentVisited.add(primary.id);

    const perspective = parentPerspective || getLineagePerspective(primary.id);
    const spouseIds = spouseMap.get(primary.id) || [];
    const spouses: MemberRecord[] = [];
    const isSpouseGhost: boolean[] = [];

    const isMaternalDaughter =
      primary.gender === 'female' && (primary.father_id != null || primary.mother_id != null);

    spouseIds.forEach((spId) => {
      const sp = memberMap.get(spId);
      if (sp) {
        // Hôn nhân nội tộc
        const isInternalMarriage =
          lineageMemberIds.has(sp.id) && (sp.father_id != null || sp.mother_id != null);

        if (isInternalMarriage) {
          if (focusMember && primary.gender === 'female' && sp.gender === 'male') {
            // Khi xem nhánh con gái của Gốc (Chi 2):
            // Người nữ (Mai) là con gái ruột, người nam (Tuấn) xuất hiện làm Con rể!
            spouses.push(sp);
            isSpouseGhost.push(false);
          } else {
            // Xem Toàn tộc:
            if (primary.gender === 'male' && sp.gender === 'female') {
              // Nhánh người nam (Tuấn Chi 1): Vợ (Mai) xuất hiện làm Ghost Node Dâu nội tộc
              spouses.push(sp);
              isSpouseGhost.push(true);
            } else if (
              primary.gender === 'female' &&
              sp.gender === 'male' &&
              options.showInternalHusbands !== false &&
              !focusMember
            ) {
              // Nhánh người nữ (Mai Chi 2): Chồng (Tuấn) xuất hiện làm Ghost Node Rể nội tộc khi bật tùy chọn
              spouses.push(sp);
              isSpouseGhost.push(true);
            }
          }
        } else {
          // Hôn nhân ngoài dòng họ:
          if (isMaternalDaughter && options.showMaternalBranches === false && !focusMember) {
            // Ẩn rể ngoại khi tắt tùy chọn
          } else {
            spouses.push(sp);
            isSpouseGhost.push(false);
          }
        }
      }
    });

    // Lấy danh sách con
    let childUnits: FamilyUnit[] = [];
    const shouldHideChildren =
      isMaternalDaughter && options.showMaternalBranches === false && !focusMember;

    if (!shouldHideChildren) {
      const childrenOfPrimary = childrenMap.get(primary.id) || [];
      const allChildIds = new Set<string>(childrenOfPrimary.map((c) => c.id));

      spouses.forEach((sp) => {
        const spChildren = childrenMap.get(sp.id) || [];
        spChildren.forEach((c) => allChildIds.add(c.id));
      });

      // Nếu đang xem Toàn họ và primary là con gái nội tộc (Mai Chi 2):
      // Con cái đã được vẽ bên chồng Tuấn ở Chi 1 -> Chi 2 không vẽ con để tránh nhân đôi số đinh
      const isInternalWifeInHerOriginalBranch =
        !focusMember &&
        primary.gender === 'female' &&
        spouseIds.some((sId) => {
          const sp = memberMap.get(sId);
          return sp && sp.gender === 'male' && lineageMemberIds.has(sp.id);
        });

      if (!isInternalWifeInHerOriginalBranch) {
        const childrenList = Array.from(allChildIds)
          .map((id) => memberMap.get(id)!)
          .filter((c) => !!c && !currentVisited.has(c.id));

        // Sắp xếp con theo birth_order / birth_year
        childrenList.sort((a, b) => {
          if (a.birth_order != null && b.birth_order != null) return a.birth_order - b.birth_order;
          if (a.birth_order != null && b.birth_order == null) return -1;
          if (a.birth_order == null && b.birth_order != null) return 1;
          if (a.birth_year != null && b.birth_year != null) return a.birth_year - b.birth_year;
          return a.full_name.localeCompare(b.full_name);
        });

        const nextPerspective = primary.gender === 'female' ? 'maternal' : perspective;
        childUnits = childrenList.map((c) => buildFamilyUnit(c, currentVisited, nextPerspective));
      }
    }

    // Tính couple width
    const totalSpouseCount = spouses.length;
    const coupleWidth = NODE_WIDTH + totalSpouseCount * (NODE_WIDTH + SPOUSE_GAP);

    // Tính children total width
    let childrenWidth = 0;
    if (childUnits.length > 0) {
      const sumChildWidths = childUnits.reduce((acc, cu) => acc + cu.width, 0);
      const totalGap = (childUnits.length - 1) * SIBLING_GAP;
      childrenWidth = sumChildWidths + totalGap;
    }

    const unitWidth = Math.max(coupleWidth, childrenWidth);

    const hasLeftHusbandGhost =
      primary.gender === 'female' &&
      spouses.length === 1 &&
      spouses[0].gender === 'male' &&
      isSpouseGhost[0] === true;

    return {
      primaryMember: primary,
      spouses,
      isSpouseGhost,
      children: childUnits,
      width: unitWidth,
      x: 0,
      y: (primary.generation_level - 1) * LEVEL_HEIGHT,
      inlawRole: perspective === 'maternal' && primary.gender === 'male' ? 'son_in_law' : undefined,
      childRole: perspective === 'maternal' ? 'maternal_grandchild' : 'paternal_grandchild',
      hasLeftHusbandGhost,
    };
  }

  // Gán tọa độ X cho các Unit
  function assignCoordinates(unit: FamilyUnit, startX: number) {
    const totalSpouseCount = unit.spouses.length;
    const coupleWidth = NODE_WIDTH + totalSpouseCount * (NODE_WIDTH + SPOUSE_GAP);

    if (unit.children.length === 0) {
      unit.x = startX;
    } else {
      let currentChildX = startX;
      unit.children.forEach((child) => {
        assignCoordinates(child, currentChildX);
        currentChildX += child.width + SIBLING_GAP;
      });

      const firstChildCenter = unit.children[0].x + NODE_WIDTH / 2;
      const lastChildCenter =
        unit.children[unit.children.length - 1].x +
        unit.children[unit.children.length - 1].spouses.length * (NODE_WIDTH + SPOUSE_GAP) +
        NODE_WIDTH / 2;
      const childrenCenter = (firstChildCenter + lastChildCenter) / 2;

      unit.x = Math.max(startX, childrenCenter - coupleWidth / 2);
    }
  }

  // Chuyển đổi FamilyUnit thành LayoutNode & LayoutEdge
  function renderUnit(unit: FamilyUnit) {
    const primary = unit.primaryMember;
    const hasLeftGhost = unit.hasLeftHusbandGhost === true;
    const primaryX = hasLeftGhost ? unit.x + NODE_WIDTH + SPOUSE_GAP : unit.x;
    const primaryY = unit.y;

    if (!renderedNodeIds.has(primary.id)) {
      renderedNodeIds.add(primary.id);

      let internalSpouseInfo: InternalSpouseInfo | undefined;
      let externalSpouseInfo: ExternalSpouseInfo | undefined;

      const allSpousesOfPrimary = (spouseMap.get(primary.id) || [])
        .map((id) => memberMap.get(id))
        .filter((m): m is MemberRecord => !!m);

      if (primary.gender === 'female' && (primary.father_id != null || primary.mother_id != null)) {
        const internalHusband = allSpousesOfPrimary.find(
          (s) => s.gender === 'male' && lineageMemberIds.has(s.id) && (s.father_id != null || s.mother_id != null)
        );
        if (internalHusband) {
          internalSpouseInfo = {
            id: internalHusband.id,
            fullName: internalHusband.full_name,
            branchName: internalHusband.branch_name || undefined,
            roleTitle: 'Chồng',
          };
        } else {
          const externalHusband = allSpousesOfPrimary.find((s) => s.gender === 'male');
          if (externalHusband) {
            externalSpouseInfo = {
              fullName: externalHusband.full_name,
            };
          }
        }
      }

      nodes.push({
        id: primary.id,
        type: 'memberNode',
        position: { x: primaryX, y: primaryY },
        data: {
          id: primary.id,
          fullName: primary.full_name,
          gender: primary.gender,
          lifeStatus: primary.life_status,
          birthYear: primary.birth_year,
          birthOrder: primary.birth_order,
          deathYear: primary.death_year,
          deathLunarDay: primary.death_lunar_day,
          deathLunarMonth: primary.death_lunar_month,
          generationLevel: primary.generation_level,
          isRoot: primary.is_root,
          branchName: primary.branch_name || undefined,
          spouseIds: unit.spouses.map((s) => s.id),
          childCount: unit.children.length,
          isGhost: false,
          internalSpouse: internalSpouseInfo,
          externalSpouse: externalSpouseInfo,
          inlawRole: unit.inlawRole,
          childRole: unit.childRole,
          isSenior: seniorMemberIds.has(primary.id),
        },
      });
    }

    // Render Spouses
    unit.spouses.forEach((sp, idx) => {
      const isGhost = unit.isSpouseGhost[idx];
      const spouseX = hasLeftGhost ? unit.x : primaryX + (idx + 1) * (NODE_WIDTH + SPOUSE_GAP);
      const spouseY = primaryY;

      if (isGhost) {
        // Hôn nhân nội tộc -> Ghost Node (Dâu nội tộc / Rể nội tộc)
        const ghostId = `ghost-${sp.id}-partner-${primary.id}`;
        nodes.push({
          id: ghostId,
          type: 'ghostNode',
          position: { x: spouseX, y: spouseY },
          data: {
            id: ghostId,
            fullName: sp.full_name,
            gender: sp.gender,
            lifeStatus: sp.life_status,
            generationLevel: sp.generation_level,
            birthOrder: sp.birth_order,
            isRoot: false,
            isGhost: true,
            originalMemberId: sp.id,
            partnerMemberId: primary.id,
            originalBranchName: sp.branch_name || undefined,
            inlawRole: sp.gender === 'female' ? 'daughter_in_law' : 'son_in_law',
          },
        });

        // Cạnh hôn phối nét liền màu xanh ngọc bích
        if (hasLeftGhost) {
          edges.push({
            id: `marriage-${ghostId}-${primary.id}`,
            source: ghostId,
            target: primary.id,
            sourceHandle: 'spouse-right',
            targetHandle: 'spouse-left',
            type: 'straight',
            style: { stroke: '#059669', strokeWidth: 1.5 },
            data: { relationType: 'marriage_ghost' },
          });
        } else {
          edges.push({
            id: `marriage-${primary.id}-${ghostId}`,
            source: primary.id,
            target: ghostId,
            sourceHandle: 'spouse-right',
            targetHandle: 'spouse-left',
            type: 'straight',
            style: { stroke: '#059669', strokeWidth: 1.5 },
            data: { relationType: 'marriage_ghost' },
          });
        }
      } else {
        if (!renderedNodeIds.has(sp.id)) {
          renderedNodeIds.add(sp.id);
          nodes.push({
            id: sp.id,
            type: 'memberNode',
            position: { x: spouseX, y: spouseY },
            data: {
              id: sp.id,
              fullName: sp.full_name,
              gender: sp.gender,
              lifeStatus: sp.life_status,
              birthYear: sp.birth_year,
              birthOrder: sp.birth_order,
              deathYear: sp.death_year,
              generationLevel: sp.generation_level,
              isRoot: sp.is_root,
              branchName: sp.branch_name || undefined,
              isGhost: false,
              inlawRole: sp.gender === 'male' ? 'son_in_law' : 'daughter_in_law',
              isSenior: seniorMemberIds.has(sp.id),
            },
          });
        }

        // Cạnh hôn phối nét liền màu xanh ngọc bích
        edges.push({
          id: `marriage-${primary.id}-${sp.id}`,
          source: primary.id,
          target: sp.id,
          sourceHandle: 'spouse-right',
          targetHandle: 'spouse-left',
          type: 'straight',
          style: { stroke: '#059669', strokeWidth: 1.5 },
          data: { relationType: 'marriage' },
        });
      }
    });

    // Render con cái & Edge thước thợ Bus Hierarchy
    unit.children.forEach((childUnit) => {
      const child = childUnit.primaryMember;
      renderUnit(childUnit);

      // Edge nối từ cha mẹ xuống con cái: Dùng familyBusEdge hoặc step thước thợ
      edges.push({
        id: `parent-${primary.id}-${child.id}`,
        source: primary.id,
        target: child.id,
        sourceHandle: unit.spouses.length > 0 ? 'children-joint' : 'children-single',
        targetHandle: 'parent-top',
        type: 'familyBusEdge',
        style: { stroke: '#059669', strokeWidth: 1.5 },
        data: { relationType: 'lineage' },
      });
    });
  }

  // Dàn trang các Primary Roots
  let rootStartX = 100;
  primaryRoots.forEach((root) => {
    const rootUnit = buildFamilyUnit(root, new Set());
    assignCoordinates(rootUnit, rootStartX);
    renderUnit(rootUnit);
    rootStartX += rootUnit.width + SIBLING_GAP * 2;
  });

  return { nodes, edges };
}
