import type { Member } from '@/types/database';
import type { LcaResult, KinshipPathNode, RelationshipType } from '@/types/kinship';

interface AncestorPath {
  member: Member;
  distance: number;
  // Chuỗi các thành viên từ Person gốc -> ... -> Ancestor này
  lineage: Member[];
}

/**
 * Xây dựng danh sách liên kết hôn phối 2 chiều: Map<memberId, spouseIds[]>
 */
export function buildSpouseMap(
  spouseRelations?: Array<{ member_a_id: string; member_b_id: string }> | null,
  membersMap?: Map<string, Member>
): Map<string, string[]> {
  const map = new Map<string, Set<string>>();

  const addPair = (a: string, b: string) => {
    if (!a || !b || a === b) return;
    if (!map.has(a)) map.set(a, new Set());
    if (!map.has(b)) map.set(b, new Set());
    map.get(a)!.add(b);
    map.get(b)!.add(a);
  };

  if (spouseRelations && Array.isArray(spouseRelations)) {
    for (const rel of spouseRelations) {
      addPair(rel.member_a_id, rel.member_b_id);
    }
  }

  if (membersMap) {
    membersMap.forEach((m, id) => {
      if (m.spouse_ids && Array.isArray(m.spouse_ids)) {
        for (const spId of m.spouse_ids) {
          addPair(id, spId);
        }
      }
    });
  }

  const result = new Map<string, string[]>();
  map.forEach((set, id) => {
    result.set(id, Array.from(set));
  });
  return result;
}

/**
 * Thuật toán tìm Gốc Gần Nhất và phân tích quan hệ huyết thống thuần
 * (Chỉ duyệt các thế hệ cha mẹ trực hệ)
 */
export function findConsanguinealLca(
  personA: Member,
  personB: Member,
  membersMap: Map<string, Member>
): LcaResult {
  // 1. Thu thập toàn bộ tổ tiên của A kèm chuỗi thế hệ từ A lên
  const ancestorsA = collectAncestors(personA, membersMap);

  // 2. Thu thập toàn bộ tổ tiên của B kèm chuỗi thế hệ từ B lên
  const ancestorsB = collectAncestors(personB, membersMap);

  // 3. Tìm tập hợp tổ tiên chung (Common Ancestors)
  const commonAncestorIds: string[] = [];
  ancestorsA.forEach((_, id) => {
    if (ancestorsB.has(id)) {
      commonAncestorIds.push(id);
    }
  });

  if (commonAncestorIds.length === 0) {
    return createUnrelatedResult(personA, personB);
  }

  // 4. Chọn Gốc Gần Nhất có tổng khoảng cách (distanceA + distanceB) nhỏ nhất
  let bestLcaId = commonAncestorIds[0];
  let minTotalDist = Infinity;

  for (const ancId of commonAncestorIds) {
    const stepA = ancestorsA.get(ancId)!;
    const stepB = ancestorsB.get(ancId)!;
    const totalDist = stepA.distance + stepB.distance;

    if (totalDist < minTotalDist) {
      minTotalDist = totalDist;
      bestLcaId = ancId;
    } else if (totalDist === minTotalDist) {
      // Ưu tiên dòng họ nội (cha) theo truyền thống phả hệ Việt Nam
      const ancMember = membersMap.get(ancId);
      if (ancMember?.gender === 'male') {
        bestLcaId = ancId;
      }
    }
  }

  const pathInfoA = ancestorsA.get(bestLcaId)!;
  const pathInfoB = ancestorsB.get(bestLcaId)!;
  const lcaMember = membersMap.get(bestLcaId)!;

  const distanceA = pathInfoA.distance;
  const distanceB = pathInfoB.distance;
  const generationDelta = distanceB - distanceA;

  // 5. Xây dựng đường đi (Path) từ A lên LCA và từ B lên LCA
  const pathA = buildKinshipPath(pathInfoA.lineage);
  const pathB = buildKinshipPath(pathInfoB.lineage);

  // 6. Xác định mối quan hệ (RelationshipType)
  let relationshipType: RelationshipType = 'cousin';
  if (distanceA === 0 || distanceB === 0) {
    const dist = Math.max(distanceA, distanceB);
    relationshipType = dist === 1 ? 'parent_child' : 'direct_ancestor';
  } else if (distanceA === 1 && distanceB === 1) {
    const fatherA = personA.father_id;
    const fatherB = personB.father_id;
    const motherA = personA.mother_id;
    const motherB = personB.mother_id;

    if ((fatherA && fatherA === fatherB) || (motherA && motherA === motherB)) {
      relationshipType = 'sibling';
    } else {
      relationshipType = 'cousin';
    }
  }

  // 7. Xác định thứ bậc Nhánh Trưởng / Nhánh Thứ (isSeniorBranchA)
  const isSeniorBranchA = determineSeniorBranch(
    personA,
    personB,
    pathInfoA,
    pathInfoB
  );

  const lcaNode: KinshipPathNode = {
    id: lcaMember.id,
    name: lcaMember.full_name,
    relation: 'Tổ tiên chung (LCA)',
    birthYear: lcaMember.birth_year,
    generationNumber: lcaMember.generation_level ?? lcaMember.generation_number ?? 1,
    isSeniorBranch: lcaMember.is_senior_branch ?? undefined,
    gender: lcaMember.gender,
  };

  return {
    lcaNodeId: lcaMember.id,
    lcaNodeName: lcaMember.full_name,
    lcaNode,
    distanceA,
    distanceB,
    generationDelta,
    isSeniorBranchA,
    pathA,
    pathB,
    relationshipType,
  };
}

/**
 * Thuật toán tìm Gốc Gần Nhất và phân tích quan hệ thân tộc toàn diện:
 * - Huyết thống (Consanguineal)
 * - Vợ - Chồng (Spouse)
 * - Cầu nối hôn nhân đơn (In-Law)
 * - Cầu nối hôn nhân đôi (Co-In-Law)
 * Pure Function - Không phụ thuộc DB hay state ngoài
 */
export function findLowestCommonAncestor(
  personAId: string,
  personBId: string,
  membersMap: Map<string, Member>,
  spouseMapInput?: Map<string, string[]>
): LcaResult {
  const personA = membersMap.get(personAId);
  const personB = membersMap.get(personBId);

  // Trường hợp không tìm thấy thành viên
  if (!personA || !personB) {
    return createUnrelatedResult(personA, personB);
  }

  // Trường hợp chọn chính mình
  if (personAId === personBId) {
    const node: KinshipPathNode = {
      id: personA.id,
      name: personA.full_name,
      relation: 'Bản thân',
      birthYear: personA.birth_year,
      birthOrder: personA.birth_order ?? null,
      generationNumber: personA.generation_level ?? personA.generation_number ?? 1,
      isSeniorBranch: personA.is_senior_branch ?? undefined,
      gender: personA.gender,
    };
    return {
      lcaNodeId: personA.id,
      lcaNodeName: personA.full_name,
      distanceA: 0,
      distanceB: 0,
      generationDelta: 0,
      isSeniorBranchA: true,
      pathA: [node],
      pathB: [node],
      relationshipType: 'same_person',
    };
  }

  // Xây dựng hoặc nạp bảng hôn phối
  const spouseMap = spouseMapInput ?? buildSpouseMap(null, membersMap);
  const spousesA = spouseMap.get(personAId) || [];
  const spousesB = spouseMap.get(personBId) || [];

  // 1. Kiểm tra quan hệ VỢ - CHỒNG trực tiếp (Direct Spouse)
  const isDirectSpouse = spousesA.includes(personBId) || spousesB.includes(personAId);
  if (isDirectSpouse) {
    const isAMale = personA.gender === 'male';
    const nodeA: KinshipPathNode = {
      id: personA.id,
      name: personA.full_name,
      relation: isAMale ? 'Chồng' : 'Vợ',
      birthYear: personA.birth_year,
      birthOrder: personA.birth_order ?? null,
      generationNumber: personA.generation_level ?? personA.generation_number ?? 1,
      isSeniorBranch: personA.is_senior_branch ?? undefined,
      gender: personA.gender,
    };
    const nodeB: KinshipPathNode = {
      id: personB.id,
      name: personB.full_name,
      relation: personB.gender === 'male' ? 'Chồng' : 'Vợ',
      birthYear: personB.birth_year,
      birthOrder: personB.birth_order ?? null,
      generationNumber: personB.generation_level ?? personB.generation_number ?? 1,
      isSeniorBranch: personB.is_senior_branch ?? undefined,
      gender: personB.gender,
    };

    return {
      lcaNodeId: null,
      lcaNodeName: null,
      distanceA: 0,
      distanceB: 0,
      generationDelta: 0,
      isSeniorBranchA: isAMale,
      pathA: [nodeA],
      pathB: [nodeB],
      relationshipType: 'spouse',
      spouseBridge: {
        type: 'spouse',
        spouseAId: personB.id,
        spouseBId: personA.id,
        inLawRoleA: 'self',
        inLawRoleB: 'self',
      },
    };
  }

  // 2. Kiểm tra quan hệ HUYẾT THỐNG trực tiếp qua LCA
  const directBloodLca = findConsanguinealLca(personA, personB, membersMap);
  if (directBloodLca.relationshipType !== 'unrelated') {
    return directBloodLca;
  }

  // 3. Kiểm tra CẦU NỐI HÔN NHÂN ĐƠN (In-Law: 1 bên là Dâu/Rể)
  interface InLawCandidate {
    type: 'bridgeA' | 'bridgeB';
    bridgeMember: Member;
    bloodLca: LcaResult;
    totalDist: number;
  }
  const inLawCandidates: InLawCandidate[] = [];

  // 3a. A là Dâu/Rể -> Tìm cầu nối qua người phối ngẫu S_A của A
  for (const sAId of spousesA) {
    const sAMember = membersMap.get(sAId);
    if (!sAMember) continue;
    const bridgeLca = findConsanguinealLca(sAMember, personB, membersMap);
    if (bridgeLca.relationshipType !== 'unrelated') {
      inLawCandidates.push({
        type: 'bridgeA',
        bridgeMember: sAMember,
        bloodLca: bridgeLca,
        totalDist: bridgeLca.distanceA + bridgeLca.distanceB,
      });
    }
  }

  // 3b. B là Dâu/Rể -> Tìm cầu nối qua người phối ngẫu S_B của B
  for (const sBId of spousesB) {
    const sBMember = membersMap.get(sBId);
    if (!sBMember) continue;
    const bridgeLca = findConsanguinealLca(personA, sBMember, membersMap);
    if (bridgeLca.relationshipType !== 'unrelated') {
      inLawCandidates.push({
        type: 'bridgeB',
        bridgeMember: sBMember,
        bloodLca: bridgeLca,
        totalDist: bridgeLca.distanceA + bridgeLca.distanceB,
      });
    }
  }

  if (inLawCandidates.length > 0) {
    // Ưu tiên cầu nối có tổng khoảng cách huyết thống nhỏ nhất
    inLawCandidates.sort((c1, c2) => c1.totalDist - c2.totalDist);
    const bestInLaw = inLawCandidates[0];
    const { bridgeMember, bloodLca } = bestInLaw;

    if (bestInLaw.type === 'bridgeA') {
      // A là Dâu/Rể, bridgeMember là S_A (chồng/vợ của A có huyết thống với B)
      const nodeA: KinshipPathNode = {
        id: personA.id,
        name: personA.full_name,
        relation: 'Bản thân',
        birthYear: personA.birth_year,
        birthOrder: personA.birth_order ?? null,
        generationNumber: personA.generation_level ?? personA.generation_number ?? 1,
        isSeniorBranch: personA.is_senior_branch ?? undefined,
        gender: personA.gender,
        isSpouse: true,
      };
      const nodeSA: KinshipPathNode = {
        id: bridgeMember.id,
        name: bridgeMember.full_name,
        relation: bridgeMember.gender === 'male' ? 'Chồng' : 'Vợ',
        birthYear: bridgeMember.birth_year,
        birthOrder: bridgeMember.birth_order ?? null,
        generationNumber: bridgeMember.generation_level ?? bridgeMember.generation_number ?? 1,
        isSeniorBranch: bridgeMember.is_senior_branch ?? undefined,
        gender: bridgeMember.gender,
        isSpouse: false,
        isSpouseBridge: true,
      };

      const pathA = [nodeA, nodeSA, ...bloodLca.pathA.slice(1)];

      return {
        lcaNodeId: bloodLca.lcaNodeId,
        lcaNodeName: bloodLca.lcaNodeName,
        lcaNode: bloodLca.lcaNode,
        distanceA: bloodLca.distanceA,
        distanceB: bloodLca.distanceB,
        generationDelta: bloodLca.generationDelta,
        isSeniorBranchA: bloodLca.isSeniorBranchA,
        pathA,
        pathB: bloodLca.pathB,
        relationshipType: 'in_law',
        spouseBridge: {
          type: 'in_law',
          spouseAId: bridgeMember.id,
          bridgeMemberA: nodeSA,
          bloodRelation: bloodLca.relationshipType,
          inLawRoleA: 'spouse',
          inLawRoleB: 'self',
        },
      };
    } else {
      // B là Dâu/Rể, bridgeMember là S_B (chồng/vợ của B có huyết thống với A)
      const nodeB: KinshipPathNode = {
        id: personB.id,
        name: personB.full_name,
        relation: 'Bản thân',
        birthYear: personB.birth_year,
        birthOrder: personB.birth_order ?? null,
        generationNumber: personB.generation_level ?? personB.generation_number ?? 1,
        isSeniorBranch: personB.is_senior_branch ?? undefined,
        gender: personB.gender,
        isSpouse: true,
      };
      const nodeSB: KinshipPathNode = {
        id: bridgeMember.id,
        name: bridgeMember.full_name,
        relation: bridgeMember.gender === 'male' ? 'Chồng' : 'Vợ',
        birthYear: bridgeMember.birth_year,
        birthOrder: bridgeMember.birth_order ?? null,
        generationNumber: bridgeMember.generation_level ?? bridgeMember.generation_number ?? 1,
        isSeniorBranch: bridgeMember.is_senior_branch ?? undefined,
        gender: bridgeMember.gender,
        isSpouse: false,
        isSpouseBridge: true,
      };

      const pathB = [nodeB, nodeSB, ...bloodLca.pathB.slice(1)];

      return {
        lcaNodeId: bloodLca.lcaNodeId,
        lcaNodeName: bloodLca.lcaNodeName,
        lcaNode: bloodLca.lcaNode,
        distanceA: bloodLca.distanceA,
        distanceB: bloodLca.distanceB,
        generationDelta: bloodLca.generationDelta,
        isSeniorBranchA: bloodLca.isSeniorBranchA,
        pathA: bloodLca.pathA,
        pathB,
        relationshipType: 'in_law',
        spouseBridge: {
          type: 'in_law',
          spouseBId: bridgeMember.id,
          bridgeMemberB: nodeSB,
          bloodRelation: bloodLca.relationshipType,
          inLawRoleA: 'self',
          inLawRoleB: 'spouse',
        },
      };
    }
  }

  // 4. Kiểm tra CẦU NỐI HÔN NHÂN ĐÔI (Co-In-Law: cả 2 bên đều là Dâu/Rể)
  interface CoInLawCandidate {
    memberSA: Member;
    memberSB: Member;
    bloodLca: LcaResult;
    totalDist: number;
  }
  const coInLawCandidates: CoInLawCandidate[] = [];

  for (const sAId of spousesA) {
    const sAMember = membersMap.get(sAId);
    if (!sAMember) continue;
    for (const sBId of spousesB) {
      const sBMember = membersMap.get(sBId);
      if (!sBMember) continue;

      const bloodLca = findConsanguinealLca(sAMember, sBMember, membersMap);
      if (bloodLca.relationshipType !== 'unrelated') {
        coInLawCandidates.push({
          memberSA: sAMember,
          memberSB: sBMember,
          bloodLca,
          totalDist: bloodLca.distanceA + bloodLca.distanceB,
        });
      }
    }
  }

  if (coInLawCandidates.length > 0) {
    coInLawCandidates.sort((c1, c2) => c1.totalDist - c2.totalDist);
    const { memberSA, memberSB, bloodLca } = coInLawCandidates[0];

    const nodeA: KinshipPathNode = {
      id: personA.id,
      name: personA.full_name,
      relation: 'Bản thân',
      birthYear: personA.birth_year,
      birthOrder: personA.birth_order ?? null,
      generationNumber: personA.generation_level ?? personA.generation_number ?? 1,
      isSeniorBranch: personA.is_senior_branch ?? undefined,
      gender: personA.gender,
      isSpouse: true,
    };
    const nodeSA: KinshipPathNode = {
      id: memberSA.id,
      name: memberSA.full_name,
      relation: memberSA.gender === 'male' ? 'Chồng' : 'Vợ',
      birthYear: memberSA.birth_year,
      birthOrder: memberSA.birth_order ?? null,
      generationNumber: memberSA.generation_level ?? memberSA.generation_number ?? 1,
      isSeniorBranch: memberSA.is_senior_branch ?? undefined,
      gender: memberSA.gender,
      isSpouse: false,
      isSpouseBridge: true,
    };
    const nodeB: KinshipPathNode = {
      id: personB.id,
      name: personB.full_name,
      relation: 'Bản thân',
      birthYear: personB.birth_year,
      birthOrder: personB.birth_order ?? null,
      generationNumber: personB.generation_level ?? personB.generation_number ?? 1,
      isSeniorBranch: personB.is_senior_branch ?? undefined,
      gender: personB.gender,
      isSpouse: true,
    };
    const nodeSB: KinshipPathNode = {
      id: memberSB.id,
      name: memberSB.full_name,
      relation: memberSB.gender === 'male' ? 'Chồng' : 'Vợ',
      birthYear: memberSB.birth_year,
      birthOrder: memberSB.birth_order ?? null,
      generationNumber: memberSB.generation_level ?? memberSB.generation_number ?? 1,
      isSeniorBranch: memberSB.is_senior_branch ?? undefined,
      gender: memberSB.gender,
      isSpouse: false,
      isSpouseBridge: true,
    };

    const pathA = [nodeA, nodeSA, ...bloodLca.pathA.slice(1)];
    const pathB = [nodeB, nodeSB, ...bloodLca.pathB.slice(1)];

    return {
      lcaNodeId: bloodLca.lcaNodeId,
      lcaNodeName: bloodLca.lcaNodeName,
      lcaNode: bloodLca.lcaNode,
      distanceA: bloodLca.distanceA,
      distanceB: bloodLca.distanceB,
      generationDelta: bloodLca.generationDelta,
      isSeniorBranchA: bloodLca.isSeniorBranchA,
      pathA,
      pathB,
      relationshipType: 'co_in_law',
      spouseBridge: {
        type: 'co_in_law',
        spouseAId: memberSA.id,
        spouseBId: memberSB.id,
        bridgeMemberA: nodeSA,
        bridgeMemberB: nodeSB,
        bloodRelation: bloodLca.relationshipType,
        inLawRoleA: 'spouse',
        inLawRoleB: 'spouse',
      },
    };
  }

  // 5. Không tìm thấy liên kết
  return createUnrelatedResult(personA, personB);
}

/**
 * Thu thập danh sách tổ tiên bằng BFS để lấy khoảng cách ngắn nhất tới mỗi tổ tiên
 */
function collectAncestors(
  person: Member,
  membersMap: Map<string, Member>
): Map<string, AncestorPath> {
  const ancestors = new Map<string, AncestorPath>();

  // Bản thân là thế hệ 0, lineage bắt đầu từ chính mình
  const rootPath: AncestorPath = {
    member: person,
    distance: 0,
    lineage: [person],
  };
  ancestors.set(person.id, rootPath);

  const queue: AncestorPath[] = [rootPath];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Xét cha
    if (current.member.father_id) {
      const father = membersMap.get(current.member.father_id);
      if (father && !ancestors.has(father.id)) {
        const fatherPath: AncestorPath = {
          member: father,
          distance: current.distance + 1,
          lineage: [...current.lineage, father],
        };
        ancestors.set(father.id, fatherPath);
        queue.push(fatherPath);
      }
    }

    // Xét mẹ
    if (current.member.mother_id) {
      const mother = membersMap.get(current.member.mother_id);
      if (mother && !ancestors.has(mother.id)) {
        const motherPath: AncestorPath = {
          member: mother,
          distance: current.distance + 1,
          lineage: [...current.lineage, mother],
        };
        ancestors.set(mother.id, motherPath);
        queue.push(motherPath);
      }
    }
  }

  return ancestors;
}

/**
 * Xây dựng mảng KinshipPathNode từ mảng lineage (Person -> ... -> LCA)
 */
function buildKinshipPath(lineage: Member[]): KinshipPathNode[] {
  return lineage.map((m, index) => {
    let relation = 'Bản thân';
    if (index === 1) relation = m.gender === 'female' ? 'Mẹ' : 'Bố';
    else if (index === 2) relation = m.gender === 'female' ? 'Bà nội' : 'Ông nội';
    else if (index === 3) relation = m.gender === 'female' ? 'Cụ bà' : 'Cụ ông';
    else if (index > 3) relation = 'Tổ tiên đời thứ ' + index;

    return {
      id: m.id,
      name: m.full_name,
      relation,
      birthYear: m.birth_year,
      birthOrder: m.birth_order ?? null,
      generationNumber: m.generation_level ?? m.generation_number ?? 1,
      isSeniorBranch: m.is_senior_branch ?? undefined,
      isAdopted: m.is_adopted ?? undefined,
      gender: m.gender,
    };
  });
}

/**
 * Xác định nhánh A có phải nhánh trưởng so với B tại điểm rẽ dưới LCA không
 */
function determineSeniorBranch(
  personA: Member,
  personB: Member,
  pathA: AncestorPath,
  pathB: AncestorPath
): boolean {
  // Nếu A là LCA -> A ở thế hệ trên
  if (pathA.distance === 0) return true;
  // Nếu B là LCA -> B ở thế hệ trên
  if (pathB.distance === 0) return false;

  // Lấy người con trực tiếp của LCA trên mỗi nhánh:
  // lineage có cấu trúc: [person, parent1, ..., childOfLca, LCA]
  // Node ngay trước LCA chính là con trực tiếp của LCA:
  const childUnderLcaA = pathA.lineage[pathA.lineage.length - 2];
  const childUnderLcaB = pathB.lineage[pathB.lineage.length - 2];

  // Nếu cùng là 1 người con (ví dụ anh em ruột)
  if (childUnderLcaA.id === childUnderLcaB.id) {
    return compareSeniority(personA, personB);
  }

  // So sánh tính trưởng/thứ của 2 người con này dưới LCA
  return compareSeniority(childUnderLcaA, childUnderLcaB);
}

/**
 * So sánh tính Trưởng/Thứ giữa 2 thành viên cùng thế hệ:
 * 1. Nếu là anh chị em ruột (cùng cha hoặc cùng mẹ):
 *    - Thứ bậc hoàn toàn do birth_order (1: con trưởng, 2: con thứ...) và năm sinh/ngày sinh quyết định.
 *    - Thuộc tính is_senior_branch không được làm đảo lộn thứ bậc chị gái sinh trước thành em gái!
 * 2. Nếu không phải anh chị em ruột (anh em họ):
 *    - Thuộc tính `is_senior_branch` (nếu có: chi trưởng / chi thứ)
 *    - Sau đó đến thứ tự sinh `birth_order` và năm sinh / ngày sinh
 */
export function compareSeniority(a: Member, b: Member): boolean {
  const isSibling =
    (!!a.father_id && !!b.father_id && a.father_id === b.father_id) ||
    (!!a.mother_id && !!b.mother_id && a.mother_id === b.mother_id);

  if (!isSibling) {
    if (a.is_senior_branch && !b.is_senior_branch) return true;
    if (!a.is_senior_branch && b.is_senior_branch) return false;
  }

  const orderA = a.birth_order || 999;
  const orderB = b.birth_order || 999;

  if (orderA !== orderB) {
    return orderA < orderB;
  }

  // So sánh năm sinh
  if (a.birth_year && b.birth_year && a.birth_year !== b.birth_year) {
    return a.birth_year < b.birth_year;
  }

  // So sánh ngày sinh
  if (a.birth_date && b.birth_date && a.birth_date !== b.birth_date) {
    return new Date(a.birth_date).getTime() < new Date(b.birth_date).getTime();
  }

  // Fallback nếu anh em ruột không có thứ tự sinh và năm sinh nhưng có cờ chi trưởng:
  if (isSibling) {
    if (a.is_senior_branch && !b.is_senior_branch) return true;
    if (!a.is_senior_branch && b.is_senior_branch) return false;
  }

  return true;
}

function createUnrelatedResult(personA?: Member, personB?: Member): LcaResult {
  return {
    lcaNodeId: null,
    lcaNodeName: null,
    distanceA: 0,
    distanceB: 0,
    generationDelta: 0,
    isSeniorBranchA: false,
    pathA: personA ? [{ id: personA.id, name: personA.full_name, relation: 'Bản thân' }] : [],
    pathB: personB ? [{ id: personB.id, name: personB.full_name, relation: 'Bản thân' }] : [],
    relationshipType: 'unrelated',
  };
}
