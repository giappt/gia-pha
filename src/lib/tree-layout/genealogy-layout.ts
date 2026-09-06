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

interface ChildCluster {
  key: string;
  sourceHandle: string;
  motherId?: string | null;
  motherOrderTitle?: string;
  motherName?: string;
  children: FamilyUnit[];
  sourceMemberId?: string;
  busY?: number;
  isStepChild?: boolean;
}

interface FamilyUnit {
  primaryMember: MemberRecord;
  spouses: MemberRecord[];
  isSpouseGhost: boolean[];
  children: FamilyUnit[];
  childClusters?: ChildCluster[];
  width: number;
  x: number;
  y: number;
  inlawRole?: 'daughter_in_law' | 'son_in_law';
  childRole?: 'paternal_grandchild' | 'maternal_grandchild';
  hasLeftHusbandGhost?: boolean;
  motherOrderTitle?: string;
  motherName?: string;
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
  const spouseRelationLookup = new Map<string, SpouseRelationRecord>();
  spouseRelations.forEach((rel) => {
    const listA = spouseMap.get(rel.member_a_id) || [];
    if (!listA.includes(rel.member_b_id)) listA.push(rel.member_b_id);
    spouseMap.set(rel.member_a_id, listA);

    const listB = spouseMap.get(rel.member_b_id) || [];
    if (!listB.includes(rel.member_a_id)) listB.push(rel.member_a_id);
    spouseMap.set(rel.member_b_id, listB);

    spouseRelationLookup.set(`${rel.member_a_id}_${rel.member_b_id}`, rel);
    spouseRelationLookup.set(`${rel.member_b_id}_${rel.member_a_id}`, rel);
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

  function sortMemberList(list: MemberRecord[]) {
    list.sort((a, b) => {
      if (a.birth_order != null && b.birth_order != null) return a.birth_order - b.birth_order;
      if (a.birth_order != null && b.birth_order == null) return -1;
      if (a.birth_order == null && b.birth_order != null) return 1;
      if (a.birth_year != null && b.birth_year != null) return a.birth_year - b.birth_year;
      return a.full_name.localeCompare(b.full_name);
    });
  }

  // Sắp xếp đàn con: Ưu tiên birth_order trước, rồi đến birth_year
  childrenMap.forEach((childList) => {
    sortMemberList(childList);
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
    const spouseIds = (spouseMap.get(primary.id) || []).slice();
    // Sắp xếp spouseIds theo thứ tự kết hôn (marriage_order) tăng dần
    spouseIds.sort((a, b) => {
      const relA = spouseRelationLookup.get(`${primary.id}_${a}`);
      const relB = spouseRelationLookup.get(`${primary.id}_${b}`);
      return (relA?.marriage_order || 1) - (relB?.marriage_order || 1);
    });

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
    let childClusters: ChildCluster[] | undefined;
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

        const nextPerspective = primary.gender === 'female' ? 'maternal' : perspective;

        // Kiểm tra xem có con riêng của vợ hay không (con có mother_id là một trong các vợ nhưng father_id != primary.id)
        const hasStepChildrenOfWives = spouses.some((sp) =>
          childrenList.some((c) => c.mother_id === sp.id && c.father_id !== primary.id)
        );

        // Phân cụm con cái nếu primary là người cha và (có nhiều vợ HOẶC có con riêng khuyết mẹ bên cạnh vợ HOẶC có con riêng của vợ)
        const isMultiSpouseOrSingleConRieng =
          primary.gender === 'male' &&
          (spouses.length > 1 ||
            (spouses.length === 1 &&
              childrenList.some((c) => c.mother_id !== spouses[0].id)) ||
            hasStepChildrenOfWives);

        if (isMultiSpouseOrSingleConRieng) {
          childClusters = [];
          const assignedIds = new Set<string>();

          // 1. Cụm con riêng của Cha (không mẹ hoặc mẹ không trong spouses, và cha là primary)
          const singleChildren = childrenList.filter(
            (c) =>
              c.father_id === primary.id &&
              (!c.mother_id || !spouses.some((sp) => sp.id === c.mother_id))
          );
          sortMemberList(singleChildren);
          singleChildren.forEach((c) => assignedIds.add(c.id));

          if (singleChildren.length > 0) {
            const singleUnits = singleChildren.map((c) => {
              const u = buildFamilyUnit(c, currentVisited, nextPerspective);
              u.motherOrderTitle = 'Chưa rõ mẹ';
              return u;
            });
            childClusters.push({
              key: 'cluster-single',
              sourceHandle: 'children-single',
              sourceMemberId: primary.id,
              motherId: null,
              motherOrderTitle: 'Chưa rõ mẹ',
              children: singleUnits,
            });
          }

          // 2. Cụm con của từng người vợ theo thứ tự marriage_order
          spouses.forEach((sp, idx) => {
            // 2a. Con chung của Cha và Vợ sp
            const jointChildren = childrenList.filter(
              (c) => c.mother_id === sp.id && c.father_id === primary.id
            );
            sortMemberList(jointChildren);
            jointChildren.forEach((c) => assignedIds.add(c.id));

            if (jointChildren.length > 0) {
              const orderTitle =
                idx === 0 ? 'Con bà cả' : idx === 1 ? 'Con bà hai' : `Con bà ${idx + 1}`;
              const jointUnits = jointChildren.map((c) => {
                const u = buildFamilyUnit(c, currentVisited, nextPerspective);
                u.motherOrderTitle = orderTitle;
                u.motherName = sp.full_name;
                return u;
              });
              childClusters!.push({
                key: `cluster-spouse-${idx}`,
                sourceHandle: spouses.length > 1 ? `children-spouse-${idx}` : 'children-joint',
                sourceMemberId: primary.id,
                motherId: sp.id,
                motherOrderTitle: orderTitle,
                motherName: sp.full_name,
                children: jointUnits,
              });
            }

            // 2b. Con riêng của Vợ sp (nếu có - cha đẻ không phải primary)
            const wifeStepChildren = childrenList.filter(
              (c) => c.mother_id === sp.id && c.father_id !== primary.id
            );
            sortMemberList(wifeStepChildren);
            wifeStepChildren.forEach((c) => assignedIds.add(c.id));

            if (wifeStepChildren.length > 0) {
              const stepUnits = wifeStepChildren.map((c) => {
                const u = buildFamilyUnit(c, currentVisited, nextPerspective);
                u.motherOrderTitle = `Con riêng của ${sp.full_name}`;
                u.motherName = sp.full_name;
                return u;
              });
              childClusters!.push({
                key: `cluster-stepchild-${sp.id}`,
                sourceHandle: 'children-single',
                sourceMemberId: sp.id,
                motherId: sp.id,
                motherOrderTitle: `Con riêng của ${sp.full_name}`,
                motherName: sp.full_name,
                children: stepUnits,
                isStepChild: true,
              });
            }
          });

          // Làm phẳng childUnits theo thứ tự các clusters (Cụm con riêng -> Cụm con Bà Cả -> Cụm con Bà Hai -> Con riêng vợ...)
          childUnits = childClusters.flatMap((cl) => cl.children);
        } else {
          // Trường hợp thông thường: 1 mẹ hoặc mẹ đơn thân
          sortMemberList(childrenList);
          childUnits = childrenList.map((c) => buildFamilyUnit(c, currentVisited, nextPerspective));
        }
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
      childClusters,
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
      const lastChild = unit.children[unit.children.length - 1];
      const lastChildCenter =
        lastChild.x +
        lastChild.spouses.length * (NODE_WIDTH + SPOUSE_GAP) +
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
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
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
          isAnonymous: primary.is_anonymous || false,
          aliasName: primary.alias_name,
          burialLocation: primary.burial_location,
          notes: primary.notes,
          deathLunarYearName: primary.death_lunar_year_name,
          motherName: unit.motherName,
          motherOrderTitle: unit.motherOrderTitle,
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
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
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
            isAnonymous: sp.is_anonymous || false,
            aliasName: sp.alias_name,
            burialLocation: sp.burial_location,
            notes: sp.notes,
            deathLunarYearName: sp.death_lunar_year_name,
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

          // Xác định danh vị phối ngẫu (Bà cả, Bà hai...) nếu gia đình đa thê hoặc có marriage_order > 1
          const rel = spouseRelationLookup.get(`${primary.id}_${sp.id}`);

          let spouseOrderTitle: string | undefined;
          if (
            sp.gender === 'female' &&
            (unit.spouses.length > 1 || (rel?.marriage_order && rel.marriage_order > 1))
          ) {
            const order = rel?.marriage_order ?? (idx + 1);
            if (order === 1) spouseOrderTitle = 'Bà cả';
            else if (order === 2) spouseOrderTitle = 'Bà hai';
            else if (order === 3) spouseOrderTitle = 'Bà ba';
            else if (order === 4) spouseOrderTitle = 'Bà tư';
            else spouseOrderTitle = `Bà thứ ${order}`;
          }

          nodes.push({
            id: sp.id,
            type: 'memberNode',
            position: { x: spouseX, y: spouseY },
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
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
              isAnonymous: sp.is_anonymous || false,
              aliasName: sp.alias_name,
              burialLocation: sp.burial_location,
              notes: sp.notes,
              deathLunarYearName: sp.death_lunar_year_name,
              spouseOrderTitle,
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

      // Xác định sourceHandle, sourceId, busY, isStepChild phù hợp cho child
      let sourceId = primary.id;
      let sourceHandle = unit.spouses.length > 0 ? 'children-joint' : 'children-single';
      let isStepChild = false;
      let busY: number | undefined;

      if (unit.childClusters && unit.childClusters.length > 1) {
        const clusterIdx = unit.childClusters.findIndex((cl) =>
          cl.children.some((c) => c.primaryMember.id === child.id)
        );
        if (clusterIdx >= 0) {
          const matchingCluster = unit.childClusters[clusterIdx];
          sourceHandle = matchingCluster.sourceHandle;
          if (matchingCluster.sourceMemberId) {
            sourceId = matchingCluster.sourceMemberId;
          }
          isStepChild = matchingCluster.isStepChild === true;
          // Phân tầng cao độ Bus Y (Multi-level Altitude Corridor):
          // Mỗi cụm con chênh lệch 20px, bắt đầu từ NODE_HEIGHT + 25
          busY = primaryY + NODE_HEIGHT + 25 + clusterIdx * 20;
        }
      }

      // Edge nối từ cha mẹ xuống con cái: Dùng familyBusEdge
      edges.push({
        id: `parent-${sourceId}-${child.id}`,
        source: sourceId,
        target: child.id,
        sourceHandle,
        targetHandle: 'parent-top',
        type: 'familyBusEdge',
        style: isStepChild
          ? { stroke: '#a855f7', strokeWidth: 1.5, strokeDasharray: '4 4' }
          : { stroke: '#059669', strokeWidth: 1.5 },
        data: {
          relationType: isStepChild ? 'stepchild' : 'lineage',
          busY,
        },
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
