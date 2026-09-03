import type { Member } from '@/types/database';
import type { LcaResult, KinshipPathNode, RelationshipType } from '@/types/kinship';

interface AncestorPath {
  member: Member;
  distance: number;
  // Chuỗi các thành viên từ Person gốc -> ... -> Ancestor này
  lineage: Member[];
}

/**
 * Thuật toán tìm Tổ tiên chung gần nhất (LCA) và phân tích quan hệ huyết thống
 * Pure Function - Không phụ thuộc DB hay state ngoài
 */
export function findLowestCommonAncestor(
  personAId: string,
  personBId: string,
  membersMap: Map<string, Member>
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

  // 4. Chọn Tổ tiên chung gần nhất (LCA) có tổng khoảng cách (distanceA + distanceB) nhỏ nhất
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
    generationNumber: lcaMember.generation_number,
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
      generationNumber: m.generation_number,
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
 * 1. Thuộc tính `is_senior_branch` (nếu có)
 * 2. Thứ tự sinh `birth_order` (1: con trưởng, 2: con thứ...)
 * 3. Năm sinh / ngày sinh (ai sinh trước là anh/chị)
 */
export function compareSeniority(a: Member, b: Member): boolean {
  if (a.is_senior_branch && !b.is_senior_branch) return true;
  if (!a.is_senior_branch && b.is_senior_branch) return false;

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
