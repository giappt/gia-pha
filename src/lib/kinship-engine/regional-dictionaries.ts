import type { Member } from '@/types/database';
import type {
  KinshipRegion,
  KinshipResolution,
  LcaResult,
  RelationshipType,
} from '@/types/kinship';
import { compareSeniority } from './lca-finder';

/**
 * Ánh xạ kết quả tính toán đồ thị phả hệ sang danh xưng xưng hô 2 chiều
 * theo phong tục 3 miền Bắc - Trung - Nam
 */
export function resolveKinshipTerms(
  lca: LcaResult,
  personA: Member,
  personB: Member,
  region: KinshipRegion = 'north'
): KinshipResolution {
  const breadcrumbs = generateBreadcrumbs(lca, personA, personB);

  // 1. Cùng một người
  if (lca.relationshipType === 'same_person') {
    return {
      termAtoB: 'Bản thân',
      termBtoA: 'Bản thân',
      explanation: 'A và B là cùng một thành viên trong gia phả.',
      region,
      breadcrumbs,
      generationDelta: 0,
      relationshipType: 'same_person',
      lcaName: personA.full_name,
    };
  }

  // 2. Không có quan hệ huyết thống tìm thấy
  if (lca.relationshipType === 'unrelated' || !lca.lcaNodeId) {
    return {
      termAtoB: 'Người ngoài họ',
      termBtoA: 'Người ngoài họ',
      explanation:
        'Hai thành viên chưa tìm thấy mối liên kết huyết thống hoặc tổ tiên chung trong cây gia phả.',
      region,
      breadcrumbs: [personA.full_name, personB.full_name],
      generationDelta: 0,
      relationshipType: 'unrelated',
      lcaName: null,
    };
  }

  const delta = lca.generationDelta;
  let resolution: KinshipResolution;

  // 3. CÙNG THẾ HỆ (delta === 0)
  if (delta === 0) {
    resolution = resolveSameGeneration(lca, personA, personB, region, breadcrumbs);
  } else if (delta > 0) {
    // 4. A Ở TRÊN B (delta > 0: A là bậc trên của B)
    resolution = resolveSeniorGeneration(lca, personA, personB, delta, region, breadcrumbs);
  } else {
    // 5. A Ở DƯỚI B (delta < 0: A là bậc dưới của B)
    resolution = resolveJuniorGeneration(lca, personA, personB, Math.abs(delta), region, breadcrumbs);
  }

  // Đính kèm cấu trúc đồ thị và so sánh phong tục
  return attachStructuredMetadata(resolution, lca, personA, personB, region);
}

/**
 * Xử lý quan hệ cùng thế hệ (delta === 0)
 */
function resolveSameGeneration(
  lca: LcaResult,
  a: Member,
  b: Member,
  region: KinshipRegion,
  breadcrumbs: string[]
): KinshipResolution {
  // 3.1. Anh chị em ruột
  if (lca.relationshipType === 'sibling') {
    const isASenior = compareSeniority(a, b);
    const termOlder = a.gender === 'female' ? 'Chị' : 'Anh';
    const termOlderB = b.gender === 'female' ? 'Chị' : 'Anh';

    if (isASenior) {
      return {
        termAtoB: 'Em',
        termBtoA: termOlder,
        explanation: `${a.full_name} và ${b.full_name} là anh chị em ruột (${a.full_name} sinh trước/vai trên).`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'sibling',
        lcaName: lca.lcaNodeName,
      };
    } else {
      return {
        termAtoB: termOlderB,
        termBtoA: 'Em',
        explanation: `${a.full_name} và ${b.full_name} là anh chị em ruột (${b.full_name} sinh trước/vai trên).`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'sibling',
        lcaName: lca.lcaNodeName,
      };
    }
  }

  // 3.2. Anh chị em họ (Con chú con bác)
  // Đặc thù văn hóa theo vùng miền:
  if (region === 'north' || region === 'central') {
    // Miền Bắc / Trung: Trọng thứ bậc nhánh (Vai Bác xưng Anh/Chị dù ít tuổi hơn)
    if (lca.isSeniorBranchA) {
      // A là con nhánh bác (nhánh trưởng), B là con nhánh chú (nhánh thứ)
      const termA = a.gender === 'female' ? 'Chị họ' : 'Anh họ';
      return {
        termAtoB: 'Em họ',
        termBtoA: termA,
        explanation: `Theo phong tục ${region === 'north' ? 'miền Bắc' : 'miền Trung'}: ${a.full_name} thuộc nhánh Bác (nhánh trưởng), ${b.full_name} thuộc nhánh Chú (nhánh thứ). Dù tuổi tác thế nào, con nhánh Bác vẫn là Anh/Chị ("Bé bằng củ khoai, cứ vai Bác là gọi Anh").`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'cousin',
        lcaName: lca.lcaNodeName,
      };
    } else {
      // A là con nhánh chú, B là con nhánh bác
      const termB = b.gender === 'female' ? 'Chị họ' : 'Anh họ';
      return {
        termAtoB: termB,
        termBtoA: 'Em họ',
        explanation: `Theo phong tục ${region === 'north' ? 'miền Bắc' : 'miền Trung'}: ${b.full_name} thuộc nhánh Bác (nhánh trưởng), ${a.full_name} thuộc nhánh Chú (nhánh thứ). Người thuộc nhánh Chú luôn gọi người nhánh Bác là ${termB}.`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'cousin',
        lcaName: lca.lcaNodeName,
      };
    }
  } else {
    // Miền Nam: Xưng anh/chị theo tuổi đời thực tế kèm danh xưng "họ"
    const isAOlder = compareAge(a, b);
    const termA = a.gender === 'female' ? 'Chị họ' : 'Anh họ';
    const termB = b.gender === 'female' ? 'Chị họ' : 'Anh họ';

    if (isAOlder) {
      return {
        termAtoB: 'Em họ',
        termBtoA: termA,
        explanation: `Theo phong tục miền Nam: ${a.full_name} lớn tuổi hơn ${b.full_name} nên xưng là ${termA} - Em họ.`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'cousin',
        lcaName: lca.lcaNodeName,
      };
    } else {
      return {
        termAtoB: termB,
        termBtoA: 'Em họ',
        explanation: `Theo phong tục miền Nam: ${b.full_name} lớn tuổi hơn ${a.full_name} nên xưng là ${termB} - Em họ.`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'cousin',
        lcaName: lca.lcaNodeName,
      };
    }
  }
}

/**
 * So sánh tuổi tác theo ngày/năm sinh thực tế (ưu tiên số năm sinh nhỏ hơn là lớn tuổi hơn)
 */
function compareAge(a: Member, b: Member): boolean {
  if (a.birth_year && b.birth_year && a.birth_year !== b.birth_year) {
    return a.birth_year < b.birth_year;
  }
  if (a.birth_date && b.birth_date && a.birth_date !== b.birth_date) {
    return new Date(a.birth_date).getTime() < new Date(b.birth_date).getTime();
  }
  if (a.birth_order && b.birth_order && a.birth_order !== b.birth_order) {
    return a.birth_order < b.birth_order;
  }
  return true;
}

/**
 * Xử lý trường hợp A ở thế hệ trên B (delta > 0)
 */
function resolveSeniorGeneration(
  lca: LcaResult,
  a: Member,
  b: Member,
  delta: number,
  region: KinshipRegion,
  breadcrumbs: string[]
): KinshipResolution {
  // Delta = 1: Bậc Cha / Bác / Chú / Cô
  if (delta === 1) {
    if (lca.relationshipType === 'parent_child') {
      const parentLabel =
        a.gender === 'female'
          ? region === 'south'
            ? 'Má'
            : 'Mẹ'
          : region === 'south'
          ? 'Ba'
          : 'Bố';
      return {
        termAtoB: 'Con',
        termBtoA: parentLabel,
        explanation: `${a.full_name} là cha/mẹ trực hệ của ${b.full_name}.`,
        region,
        breadcrumbs,
        generationDelta: 1,
        relationshipType: 'parent_child',
        lcaName: lca.lcaNodeName,
      };
    }

    // A là Bác / Chú / Cô của B
    if (a.gender === 'male') {
      if (lca.isSeniorBranchA) {
        // A là vai anh của cha B (hoặc nhánh trên) -> Bác
        return {
          termAtoB: 'Cháu',
          termBtoA: 'Bác',
          explanation: `${a.full_name} thuộc nhánh Bác (nhánh anh) so với cha/mẹ của ${b.full_name}, do đó ${b.full_name} gọi ${a.full_name} là Bác.`,
          region,
          breadcrumbs,
          generationDelta: 1,
          relationshipType: 'cousin',
          lcaName: lca.lcaNodeName,
        };
      } else {
        // A là vai em của cha B -> Chú
        return {
          termAtoB: 'Cháu',
          termBtoA: 'Chú',
          explanation: `${a.full_name} là vai Chú (nhánh em trai) so với cha của ${b.full_name}, do đó ${b.full_name} gọi ${a.full_name} là Chú.`,
          region,
          breadcrumbs,
          generationDelta: 1,
          relationshipType: 'cousin',
          lcaName: lca.lcaNodeName,
        };
      }
    } else {
      // A là nữ
      const auntLabel = lca.isSeniorBranchA
        ? region === 'south'
          ? 'Cô họ'
          : 'Bác họ (Bác gái)'
        : 'Cô';
      return {
        termAtoB: 'Cháu',
        termBtoA: auntLabel,
        explanation: `${a.full_name} là bề trên (${auntLabel}) của ${b.full_name}.`,
        region,
        breadcrumbs,
        generationDelta: 1,
        relationshipType: 'cousin',
        lcaName: lca.lcaNodeName,
      };
    }
  }

  // Delta = 2: Bậc Ông / Bà
  if (delta === 2) {
    if (lca.relationshipType === 'direct_ancestor') {
      const grandLabel = a.gender === 'female' ? 'Bà nội' : 'Ông nội';
      return {
        termAtoB: 'Cháu',
        termBtoA: grandLabel,
        explanation: `${a.full_name} là ${grandLabel} trực hệ của ${b.full_name}.`,
        region,
        breadcrumbs,
        generationDelta: 2,
        relationshipType: 'direct_ancestor',
        lcaName: lca.lcaNodeName,
      };
    }

    const grandCollateral = a.gender === 'female' ? 'Bà họ' : 'Ông họ';
    return {
      termAtoB: 'Cháu họ',
      termBtoA: grandCollateral,
      explanation: `${a.full_name} cách ${b.full_name} 2 thế hệ trong dòng họ (${grandCollateral} - Cháu họ).`,
      region,
      breadcrumbs,
      generationDelta: 2,
      relationshipType: 'cousin',
      lcaName: lca.lcaNodeName,
    };
  }

  // Delta = 3: Bậc Cụ
  if (delta === 3) {
    const greatLabel = a.gender === 'female' ? 'Cụ bà' : 'Cụ ông';
    return {
      termAtoB: 'Chắt',
      termBtoA: `${greatLabel} họ`,
      explanation: `${a.full_name} cách ${b.full_name} 3 thế hệ (${greatLabel} - Chắt).`,
      region,
      breadcrumbs,
      generationDelta: 3,
      relationshipType: 'direct_ancestor',
      lcaName: lca.lcaNodeName,
    };
  }

  // Delta >= 4: Kỵ / Tiên tổ
  return {
    termAtoB: 'Chút / Hậu duệ',
    termBtoA: 'Kỵ tổ / Cụ tổ họ',
    explanation: `${a.full_name} là bậc tiền nhân cách ${b.full_name} ${delta} thế hệ.`,
    region,
    breadcrumbs,
    generationDelta: delta,
    relationshipType: 'direct_ancestor',
    lcaName: lca.lcaNodeName,
  };
}

/**
 * Xử lý trường hợp A ở thế hệ dưới B (delta < 0)
 * Bằng cách đảo vai tính toán rồi lật ngược kết quả
 */
function resolveJuniorGeneration(
  lca: LcaResult,
  a: Member,
  b: Member,
  absDelta: number,
  region: KinshipRegion,
  breadcrumbs: string[]
): KinshipResolution {
  // Tạo LCA đảo ngược từ góc nhìn B lên A
  const invertedLca: LcaResult = {
    ...lca,
    distanceA: lca.distanceB,
    distanceB: lca.distanceA,
    generationDelta: absDelta,
    isSeniorBranchA: !lca.isSeniorBranchA,
  };

  const seniorResult = resolveSeniorGeneration(
    invertedLca,
    b,
    a,
    absDelta,
    region,
    breadcrumbs
  );

  return {
    termAtoB: seniorResult.termBtoA,
    termBtoA: seniorResult.termAtoB,
    explanation: seniorResult.explanation,
    region,
    breadcrumbs,
    generationDelta: -absDelta,
    relationshipType: seniorResult.relationshipType,
    lcaName: lca.lcaNodeName,
  };
}

/**
 * Tạo danh sách mắt xích trực quan (Breadcrumbs)
 * Từ A -> ... -> LCA -> ... -> B
 */
function generateBreadcrumbs(lca: LcaResult, a: Member, b: Member): string[] {
  if (lca.relationshipType === 'same_person') {
    return [a.full_name];
  }

  if (lca.relationshipType === 'unrelated' || !lca.lcaNodeId) {
    return [a.full_name, b.full_name];
  }

  const crumbs: string[] = [];

  // Nhánh của A đi lên LCA: pathA là [A, parent, ..., LCA]
  for (let i = 0; i < lca.pathA.length; i++) {
    const node = lca.pathA[i];
    if (i === 0) {
      crumbs.push(node.name);
    } else if (i === lca.pathA.length - 1) {
      crumbs.push(`Tổ tiên chung (LCA): ${node.name}`);
    } else {
      crumbs.push(`${node.relation}: ${node.name}`);
    }
  }

  // Nhánh của B đi từ ngay dưới LCA xuống B: pathB là [B, parent, ..., LCA]
  // Ta cần đi từ LCA -> con của LCA -> ... -> B (đảo ngược trừ LCA)
  if (lca.pathB.length > 1) {
    for (let i = lca.pathB.length - 2; i >= 0; i--) {
      const node = lca.pathB[i];
      if (i === 0) {
        crumbs.push(node.name);
      } else {
        crumbs.push(`${node.relation}: ${node.name}`);
      }
    }
  }

  return crumbs;
}

/**
 * Đính kèm metadata phong tục cấu trúc hóa (customsBadge, proverbQuote, comparisonFacts, pathA, pathB, lcaNode)
 */
function attachStructuredMetadata(
  res: KinshipResolution,
  lca: LcaResult,
  a: Member,
  b: Member,
  region: KinshipRegion
): KinshipResolution {
  let customsBadge = 'Phong tục Miền Bắc: Chuẩn Mực Tôn Ti Gia Tộc';
  let proverbQuote = 'Cây có gốc mới nở cành xanh ngọn, nước có nguồn mới biển rộng sông sâu';

  if (region === 'north') {
    if (lca.relationshipType === 'cousin') {
      customsBadge = 'Phong tục Miền Bắc: Tôn Ti Nhánh Họ Chi Trưởng';
      proverbQuote = 'Bé bằng củ khoai, cứ vai Bác là gọi Anh';
    } else if (lca.relationshipType === 'sibling') {
      customsBadge = 'Phong tục Miền Bắc: Hòa Mục Huynh Đệ';
      proverbQuote = 'Anh em như thể tay chân, rách lành đùm bọc dở hay đỡ đần';
    }
  } else if (region === 'central') {
    customsBadge = 'Phong tục Miền Trung: Kính Trên Nhường Dưới';
    proverbQuote = 'Giọt máu đào hơn ao nước lã, trọn nghĩa đồng tông';
  } else if (region === 'south') {
    customsBadge = 'Phong tục Miền Nam: Trọng Tuổi Tác Đời Thực';
    proverbQuote = 'Anh em bốn bể là nhà, lớn làm anh, nhỏ làm em';
  }

  let summary = '';
  if (a.is_adopted || b.is_adopted) {
    summary =
      'Thành viên con nuôi được ghi danh trọn vẹn trong gia phả, hưởng đầy đủ vai vế và tôn ti theo thứ bậc gia đình.';
  } else if (lca.generationDelta === 0 && lca.relationshipType === 'cousin') {
    if (region === 'north' || region === 'central') {
      summary =
        'Theo lệ xưa của dòng họ, con của nhánh Bác trưởng luôn giữ vai Anh/Chị đối với con nhánh Chú thứ, tuổi đời nhường bước tôn ti.';
    } else {
      summary =
        'Theo phong tục miền Nam phóng khoáng, anh em họ cùng thế hệ xưng hô tôn trọng theo tuổi đời thực tế.';
    }
  } else if (Math.abs(lca.generationDelta) >= 1) {
    summary = `Cách nhau ${Math.abs(
      lca.generationDelta
    )} thế hệ trong gia phả dòng tộc, xưng hô tôn kính theo thứ bậc trên dưới.`;
  } else {
    summary = 'Anh chị em ruột thịt cùng một cội nguồn sinh dưỡng.';
  }

  const comparisonFacts = {
    labelA: a.full_name,
    labelB: b.full_name,
    detailA: `Đời ${a.generation_number} · Sinh ${a.birth_year || '---'}${
      a.is_senior_branch ? ' · Chi Trưởng' : ' · Chi Thứ'
    }${a.is_adopted ? ' · Con Nuôi' : ''}`,
    detailB: `Đời ${b.generation_number} · Sinh ${b.birth_year || '---'}${
      b.is_senior_branch ? ' · Chi Trưởng' : ' · Chi Thứ'
    }${b.is_adopted ? ' · Con Nuôi' : ''}`,
    summary,
  };

  return {
    ...res,
    pathA: lca.pathA,
    pathB: lca.pathB,
    lcaNode: lca.lcaNode || null,
    customsBadge,
    proverbQuote,
    comparisonFacts,
  };
}
