import type { Member } from '@/types/database';
import type {
  KinshipRegion,
  KinshipResolution,
  LcaResult,
  RelationshipType,
  KinshipTermRule,
  CustomKinshipDictionary,
} from '@/types/kinship';
import { compareSeniority } from './lca-finder';

export const DEFAULT_NORTH_RULES: KinshipTermRule[] = [
  // I. Trực Hệ (Nội & Ngoại)
  {
    id: 'parent_father',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Cha - Con',
    context: 'Quan hệ huyết thống trực hệ',
    termSenior: 'Bố',
    termJunior: 'Con',
    note: 'Người cha gọi Con, Con gọi Bố',
  },
  {
    id: 'parent_mother',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Mẹ - Con',
    context: 'Quan hệ huyết thống trực hệ',
    termSenior: 'Mẹ',
    termJunior: 'Con',
    note: 'Người mẹ gọi Con, Con gọi Mẹ',
  },
  {
    id: 'grandparent_direct_male',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Ông nội - Cháu nội',
    context: 'Trực hệ bên nội cách 2 thế hệ',
    termSenior: 'Ông nội',
    termJunior: 'Cháu',
    note: 'Ông nội gọi Cháu, Cháu gọi Ông nội',
  },
  {
    id: 'grandparent_direct_female',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Bà nội - Cháu nội',
    context: 'Trực hệ bên nội cách 2 thế hệ',
    termSenior: 'Bà nội',
    termJunior: 'Cháu',
    note: 'Bà nội gọi Cháu, Cháu gọi Bà nội',
  },
  {
    id: 'grandparent_maternal_male',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Ông ngoại - Cháu ngoại',
    context: 'Trực hệ bên ngoại cách 2 thế hệ',
    termSenior: 'Ông ngoại',
    termJunior: 'Cháu ngoại',
    note: 'Ông ngoại gọi Cháu, Cháu gọi Ông ngoại',
  },
  {
    id: 'grandparent_maternal_female',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Bà ngoại - Cháu ngoại',
    context: 'Trực hệ bên ngoại cách 2 thế hệ',
    termSenior: 'Bà ngoại',
    termJunior: 'Cháu ngoại',
    note: 'Bà ngoại gọi Cháu, Cháu gọi Bà ngoại',
  },
  {
    id: 'great_grandparent',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Cụ - Chắt',
    context: 'Trực hệ cách 3 thế hệ',
    termSenior: 'Cụ ông / Cụ bà',
    termJunior: 'Chắt',
    note: 'Bậc Cụ gọi Chắt, Chắt gọi Cụ',
  },
  {
    id: 'ancestor_4plus',
    category: 'direct',
    categoryLabel: 'I. Trực Hệ (Nội & Ngoại)',
    name: 'Kỵ tổ / Tiên tổ - Chút',
    context: 'Trực hệ cách ≥ 4 thế hệ',
    termSenior: 'Kỵ tổ / Cụ tổ họ',
    termJunior: 'Chút / Hậu duệ',
    note: 'Tổ tiên dòng họ gọi Hậu duệ',
  },

  // II. Cùng Thế Hệ & Dâu / Rể
  {
    id: 'sibling_brother',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Anh ruột - Em',
    context: 'Cùng cha/mẹ, sinh trước',
    termSenior: 'Anh',
    termJunior: 'Em',
    note: 'Anh ruột gọi Em, Em gọi Anh',
  },
  {
    id: 'sibling_sister',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Chị ruột - Em',
    context: 'Cùng cha/mẹ, sinh trước',
    termSenior: 'Chị',
    termJunior: 'Em',
    note: 'Chị ruột gọi Em, Em gọi Chị',
  },
  {
    id: 'cousin_senior',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Anh/Chị họ (Nhánh Trưởng / Vai Bác)',
    context: 'Con nhánh Bác (Ưu tiên vai nhánh)',
    termSenior: 'Anh họ (Chị họ)',
    termJunior: 'Em họ',
    note: 'Vai Bác luôn là Anh/Chị dù ít tuổi hơn',
  },
  {
    id: 'cousin_junior',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Em họ (Nhánh Thứ / Vai Chú)',
    context: 'Con nhánh Chú',
    termSenior: 'Em họ',
    termJunior: 'Anh họ (Chị họ)',
    note: 'Nhánh Chú gọi nhánh Bác là Anh/Chị',
  },
  {
    id: 'sister_in_law',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Chị dâu (Vợ anh trai)',
    context: 'Vợ của anh trai trong gia đình',
    termSenior: 'Chị dâu (Chị)',
    termJunior: 'Em (Chú / Cô)',
    note: 'Em chồng gọi Chị dâu, Chị dâu gọi Em/Chú/Cô',
  },
  {
    id: 'brother_in_law',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Anh rể (Chồng chị gái)',
    context: 'Chồng của chị gái trong gia đình',
    termSenior: 'Anh rể (Anh)',
    termJunior: 'Em (Dì / Cậu)',
    note: 'Em vợ gọi Anh rể, Anh rể gọi Em/Dì/Cậu',
  },
  {
    id: 'younger_sister_in_law',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Em dâu (Vợ em trai)',
    context: 'Vợ của em trai trong gia đình',
    termSenior: 'Em dâu',
    termJunior: 'Anh / Chị',
    note: 'Anh/Chị chồng gọi Em dâu',
  },
  {
    id: 'younger_brother_in_law',
    category: 'same_gen',
    categoryLabel: 'II. Cùng Thế Hệ & Dâu / Rể',
    name: 'Em rể (Chồng em gái)',
    context: 'Chồng của em gái trong gia đình',
    termSenior: 'Em rể',
    termJunior: 'Anh / Chị',
    note: 'Anh/Chị vợ gọi Em rể',
  },

  // III. Bác / Chú / Cô & Phu Thê (Bên Nội)
  {
    id: 'uncle_senior',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Bác trai (Bên Nội)',
    context: 'Anh trai của cha / Nhánh trưởng',
    termSenior: 'Bác',
    termJunior: 'Cháu',
    note: 'Cháu gọi Bác, Bác gọi Cháu',
  },
  {
    id: 'aunt_senior_wife',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Vợ của Bác trai (Bác gái / Bác dâu)',
    context: 'Vợ của bác trai bên nội',
    termSenior: 'Bác gái (Bác dâu)',
    termJunior: 'Cháu',
    note: 'Cháu gọi Bác dâu, Bác gọi Cháu',
  },
  {
    id: 'aunt_senior',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Bác gái (Chị của cha / Bên Nội)',
    context: 'Chị gái của cha / Nhánh trưởng',
    termSenior: 'Bác (Bác gái)',
    termJunior: 'Cháu',
    note: 'Cháu gọi Bác gái, Bác gọi Cháu',
  },
  {
    id: 'uncle_senior_husband',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Chồng của Bác gái (Bác rể)',
    context: 'Chồng của bác gái bên nội',
    termSenior: 'Bác rể (Bác trai)',
    termJunior: 'Cháu',
    note: 'Cháu gọi Bác rể, Bác gọi Cháu',
  },
  {
    id: 'uncle_junior',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Chú (Em trai của cha)',
    context: 'Em trai của cha / Nhánh thứ',
    termSenior: 'Chú',
    termJunior: 'Cháu',
    note: 'Cháu gọi Chú, Chú gọi Cháu',
  },
  {
    id: 'aunt_junior_wife',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Vợ của Chú (Thím)',
    context: 'Vợ của em trai cha',
    termSenior: 'Thím',
    termJunior: 'Cháu',
    note: 'Cháu gọi Thím, Thím gọi Cháu',
  },
  {
    id: 'aunt_junior',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Cô / O (Em gái của cha)',
    context: 'Em gái của cha / Nhánh thứ',
    termSenior: 'Cô',
    termJunior: 'Cháu',
    note: 'Cháu gọi Cô, Cô gọi Cháu',
  },
  {
    id: 'uncle_junior_husband',
    category: 'paternal_uncle_aunt',
    categoryLabel: 'III. Bác / Chú / Cô & Phu Thê (Bên Nội)',
    name: 'Chồng của Cô (Chú dượng / Dượng)',
    context: 'Chồng của em gái cha',
    termSenior: 'Chú dượng (Chú rể)',
    termJunior: 'Cháu',
    note: 'Cháu gọi Chú dượng, Dượng gọi Cháu',
  },

  // IV. Bác / Cậu / Dì & Phu Thê (Bên Ngoại)
  {
    id: 'uncle_maternal_senior',
    category: 'maternal_uncle_aunt',
    categoryLabel: 'IV. Bác / Cậu / Dì & Phu Thê (Bên Ngoại)',
    name: 'Bác trai bên ngoại (Anh của mẹ)',
    context: 'Anh trai của mẹ',
    termSenior: 'Bác',
    termJunior: 'Cháu ngoại',
    note: 'Cháu gọi Bác, Bác gọi Cháu',
  },
  {
    id: 'aunt_maternal_senior_wife',
    category: 'maternal_uncle_aunt',
    categoryLabel: 'IV. Bác / Cậu / Dì & Phu Thê (Bên Ngoại)',
    name: 'Vợ của Bác trai ngoại (Bác dâu ngoại)',
    context: 'Vợ của anh trai mẹ',
    termSenior: 'Bác dâu (Bác gái)',
    termJunior: 'Cháu ngoại',
    note: 'Cháu gọi Bác dâu, Bác gọi Cháu',
  },
  {
    id: 'uncle_maternal_junior',
    category: 'maternal_uncle_aunt',
    categoryLabel: 'IV. Bác / Cậu / Dì & Phu Thê (Bên Ngoại)',
    name: 'Cậu (Em trai của mẹ)',
    context: 'Em trai của mẹ',
    termSenior: 'Cậu',
    termJunior: 'Cháu ngoại',
    note: 'Cháu gọi Cậu, Cậu gọi Cháu',
  },
  {
    id: 'aunt_maternal_junior_wife',
    category: 'maternal_uncle_aunt',
    categoryLabel: 'IV. Bác / Cậu / Dì & Phu Thê (Bên Ngoại)',
    name: 'Vợ của Cậu (Mợ)',
    context: 'Vợ của em trai mẹ',
    termSenior: 'Mợ',
    termJunior: 'Cháu ngoại',
    note: 'Cháu gọi Mợ, Mợ gọi Cháu',
  },
  {
    id: 'aunt_maternal_junior',
    category: 'maternal_uncle_aunt',
    categoryLabel: 'IV. Bác / Cậu / Dì & Phu Thê (Bên Ngoại)',
    name: 'Dì (Em gái của mẹ)',
    context: 'Em gái của mẹ',
    termSenior: 'Dì',
    termJunior: 'Cháu ngoại',
    note: 'Cháu gọi Dì, Dì gọi Cháu',
  },
  {
    id: 'uncle_maternal_junior_husband',
    category: 'maternal_uncle_aunt',
    categoryLabel: 'IV. Bác / Cậu / Dì & Phu Thê (Bên Ngoại)',
    name: 'Chồng của Dì (Chú dượng / Dượng)',
    context: 'Chồng của em gái mẹ',
    termSenior: 'Chú dượng (Dượng)',
    termJunior: 'Cháu ngoại',
    note: 'Cháu gọi Chú dượng, Dượng gọi Cháu',
  },

  // V. Dâu / Rể Thế Hệ Con & Cháu
  {
    id: 'daughter_in_law',
    category: 'in_law_descendant',
    categoryLabel: 'V. Dâu / Rể Thế Hệ Con & Cháu',
    name: 'Con dâu (Vợ của con trai)',
    context: 'Vợ của con trai trong gia tộc',
    termSenior: 'Con dâu (Con)',
    termJunior: 'Bố / Mẹ',
    note: 'Bố mẹ chồng gọi Con dâu, Con dâu gọi Bố/Mẹ',
  },
  {
    id: 'son_in_law',
    category: 'in_law_descendant',
    categoryLabel: 'V. Dâu / Rể Thế Hệ Con & Cháu',
    name: 'Con rể (Chồng của con gái)',
    context: 'Chồng của con gái trong gia tộc',
    termSenior: 'Con rể (Con)',
    termJunior: 'Bố / Mẹ',
    note: 'Bố mẹ vợ gọi Con rể, Con rể gọi Bố/Mẹ',
  },
  {
    id: 'grand_daughter_in_law',
    category: 'in_law_descendant',
    categoryLabel: 'V. Dâu / Rể Thế Hệ Con & Cháu',
    name: 'Cháu dâu (Vợ của cháu trai)',
    context: 'Vợ của cháu trai trong họ',
    termSenior: 'Cháu dâu',
    termJunior: 'Ông / Bà / Bác / Chú',
    note: 'Bề trên gọi Cháu dâu',
  },
  {
    id: 'grand_son_in_law',
    category: 'in_law_descendant',
    categoryLabel: 'V. Dâu / Rể Thế Hệ Con & Cháu',
    name: 'Cháu rể (Chồng của cháu gái)',
    context: 'Chồng của cháu gái trong họ',
    termSenior: 'Cháu rể',
    termJunior: 'Ông / Bà / Bác / Chú',
    note: 'Bề trên gọi Cháu rể',
  },

  // VI. Họ Hàng Lệch Đời
  {
    id: 'grandparent_collateral_male',
    category: 'grand_collateral',
    categoryLabel: 'VI. Họ Hàng Lệch Đời',
    name: 'Ông họ',
    context: 'Anh/em với ông nội (lệch 2 đời)',
    termSenior: 'Ông họ',
    termJunior: 'Cháu họ',
    note: 'Cháu họ gọi Ông họ',
  },
  {
    id: 'grandparent_collateral_female',
    category: 'grand_collateral',
    categoryLabel: 'VI. Họ Hàng Lệch Đời',
    name: 'Bà họ',
    context: 'Chị/em với ông nội (lệch 2 đời)',
    termSenior: 'Bà họ',
    termJunior: 'Cháu họ',
    note: 'Cháu họ gọi Bà họ',
  },
];

export const DEFAULT_CENTRAL_RULES: KinshipTermRule[] = DEFAULT_NORTH_RULES.map((rule) => {
  if (rule.id === 'parent_father') {
    return { ...rule, termSenior: 'Ba', note: 'Người cha gọi Con, Con gọi Ba' };
  }
  if (rule.id === 'parent_mother') {
    return { ...rule, termSenior: 'Mẹ (Mạ)', note: 'Người mẹ gọi Con, Con gọi Mẹ (Mạ)' };
  }
  if (rule.id === 'aunt_junior') {
    return { ...rule, termSenior: 'O (Cô)', note: 'Cháu gọi O, O gọi Cháu' };
  }
  if (rule.id === 'uncle_junior_husband') {
    return { ...rule, termSenior: 'Dượng', note: 'Cháu gọi Dượng, Dượng gọi Cháu' };
  }
  if (rule.id === 'uncle_maternal_junior_husband') {
    return { ...rule, termSenior: 'Dượng', note: 'Cháu gọi Dượng, Dượng gọi Cháu' };
  }
  if (rule.id === 'daughter_in_law') {
    return { ...rule, termJunior: 'Ba / Mạ' };
  }
  if (rule.id === 'son_in_law') {
    return { ...rule, termJunior: 'Ba / Mạ' };
  }
  if (rule.id === 'ancestor_4plus') {
    return { ...rule, termSenior: 'Kỵ tổ (Mệ tổ)', note: 'Tổ tiên dòng họ gọi Hậu duệ' };
  }
  return rule;
});

export const DEFAULT_SOUTH_RULES: KinshipTermRule[] = DEFAULT_NORTH_RULES.map((rule) => {
  if (rule.id === 'parent_father') {
    return { ...rule, termSenior: 'Ba (Tía)', note: 'Người cha gọi Con, Con gọi Ba' };
  }
  if (rule.id === 'parent_mother') {
    return { ...rule, termSenior: 'Má', note: 'Người mẹ gọi Con, Con gọi Má' };
  }
  if (rule.id === 'sibling_brother') {
    return { ...rule, termSenior: 'Anh Hai (Anh)', note: 'Người lớn tuổi hơn là Anh Hai' };
  }
  if (rule.id === 'sibling_sister') {
    return { ...rule, termSenior: 'Chị Ba (Chị)', note: 'Người lớn tuổi hơn là Chị' };
  }
  if (rule.id === 'cousin_senior') {
    return { ...rule, context: 'Ưu tiên theo tuổi đời thực tế', note: 'Lớn tuổi hơn là Anh họ (Chị họ)' };
  }
  if (rule.id === 'uncle_senior') {
    return { ...rule, termSenior: 'Bác (Bác lớn)', note: 'Cháu gọi Bác lớn' };
  }
  if (rule.id === 'aunt_senior') {
    return { ...rule, termSenior: 'Cô họ', note: 'Cháu gọi Cô họ' };
  }
  if (rule.id === 'uncle_junior') {
    return { ...rule, termSenior: 'Chú (Chú út)', note: 'Cháu gọi Chú út' };
  }
  if (rule.id === 'aunt_junior_wife') {
    return { ...rule, termSenior: 'Thím (Thiếm)', note: 'Cháu gọi Thím' };
  }
  if (rule.id === 'aunt_junior') {
    return { ...rule, termSenior: 'Cô (Út)', note: 'Cháu gọi Cô út' };
  }
  if (rule.id === 'uncle_junior_husband') {
    return { ...rule, termSenior: 'Dượng', note: 'Cháu gọi Dượng' };
  }
  if (rule.id === 'uncle_maternal_junior_husband') {
    return { ...rule, termSenior: 'Dượng', note: 'Cháu gọi Dượng' };
  }
  if (rule.id === 'daughter_in_law') {
    return { ...rule, termJunior: 'Ba / Má' };
  }
  if (rule.id === 'son_in_law') {
    return { ...rule, termJunior: 'Ba / Má' };
  }
  if (rule.id === 'ancestor_4plus') {
    return { ...rule, termSenior: 'Sơ / Cố tổ', note: 'Tổ tiên dòng họ gọi Hậu duệ' };
  }
  return rule;
});

export function getRegionalPresetDictionary(region: KinshipRegion): KinshipTermRule[] {
  switch (region) {
    case 'central':
      return DEFAULT_CENTRAL_RULES;
    case 'south':
      return DEFAULT_SOUTH_RULES;
    case 'north':
    default:
      return DEFAULT_NORTH_RULES;
  }
}

/**
 * Ánh xạ kết quả tính toán đồ thị phả hệ sang danh xưng xưng hô 2 chiều
 * theo phong tục 3 miền Bắc - Trung - Nam và cấu hình tùy biến của dòng họ
 */
export function resolveKinshipTerms(
  lca: LcaResult,
  personA: Member,
  personB: Member,
  region: KinshipRegion = 'north',
  customDictionary?: CustomKinshipDictionary | null
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
    resolution = resolveSameGeneration(lca, personA, personB, region, breadcrumbs, customDictionary);
  } else if (delta > 0) {
    // 4. A Ở TRÊN B (delta > 0: A là bậc trên của B)
    resolution = resolveSeniorGeneration(lca, personA, personB, delta, region, breadcrumbs, customDictionary);
  } else {
    // 5. A Ở DƯỚI B (delta < 0: A là bậc dưới của B)
    resolution = resolveJuniorGeneration(lca, personA, personB, Math.abs(delta), region, breadcrumbs, customDictionary);
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
  breadcrumbs: string[],
  customDictionary?: CustomKinshipDictionary | null
): KinshipResolution {
  // 3.1. Anh chị em ruột
  if (lca.relationshipType === 'sibling') {
    const isASenior = compareSeniority(a, b);
    const ruleId = (isASenior ? a.gender : b.gender) === 'female' ? 'sibling_sister' : 'sibling_brother';
    const customRule = customDictionary?.[ruleId];
    const defaultOlder = (isASenior ? a.gender : b.gender) === 'female' ? 'Chị' : 'Anh';
    const termOlder = customRule?.termSenior || defaultOlder;
    const termYounger = customRule?.termJunior || 'Em';

    if (isASenior) {
      return {
        termAtoB: termYounger,
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
        termAtoB: termOlder,
        termBtoA: termYounger,
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
      const customSenior = customDictionary?.['cousin_senior'];
      const defaultA = a.gender === 'female' ? 'Chị họ' : 'Anh họ';
      const termA = customSenior?.termSenior || defaultA;
      const termB = customSenior?.termJunior || 'Em họ';

      return {
        termAtoB: termB,
        termBtoA: termA,
        explanation: `Theo phong tục ${region === 'north' ? 'miền Bắc' : 'miền Trung'}: ${a.full_name} thuộc nhánh Bác (nhánh trưởng), ${b.full_name} thuộc nhánh Chú (nhánh thứ). Dù tuổi tác thế nào, con nhánh Bác vẫn là Anh/Chị ("Bé bằng củ khoai, cứ vai Bác là gọi Anh").`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'cousin',
        lcaName: lca.lcaNodeName,
      };
    } else {
      const customJunior = customDictionary?.['cousin_junior'];
      const defaultB = b.gender === 'female' ? 'Chị họ' : 'Anh họ';
      const termB = customJunior?.termJunior || defaultB;
      const termA = customJunior?.termSenior || 'Em họ';

      return {
        termAtoB: termB,
        termBtoA: termA,
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
    const custom = customDictionary?.['cousin_senior'];
    const defaultA = a.gender === 'female' ? 'Chị họ' : 'Anh họ';
    const defaultB = b.gender === 'female' ? 'Chị họ' : 'Anh họ';
    const termA = custom?.termSenior || defaultA;
    const termB = custom?.termSenior || defaultB;
    const termYounger = custom?.termJunior || 'Em họ';

    if (isAOlder) {
      return {
        termAtoB: termYounger,
        termBtoA: termA,
        explanation: `Theo phong tục miền Nam: ${a.full_name} lớn tuổi hơn ${b.full_name} nên xưng là ${termA} - ${termYounger}.`,
        region,
        breadcrumbs,
        generationDelta: 0,
        relationshipType: 'cousin',
        lcaName: lca.lcaNodeName,
      };
    } else {
      return {
        termAtoB: termB,
        termBtoA: termYounger,
        explanation: `Theo phong tục miền Nam: ${b.full_name} lớn tuổi hơn ${a.full_name} nên xưng là ${termB} - ${termYounger}.`,
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
  breadcrumbs: string[],
  customDictionary?: CustomKinshipDictionary | null
): KinshipResolution {
  // Delta = 1: Bậc Cha / Bác / Chú / Cô
  if (delta === 1) {
    if (lca.relationshipType === 'parent_child') {
      const isMother = a.gender === 'female';
      const customParent = customDictionary?.[isMother ? 'parent_mother' : 'parent_father'];
      const defaultParentLabel = isMother
        ? region === 'south'
          ? 'Má'
          : 'Mẹ'
        : region === 'south'
        ? 'Ba'
        : 'Bố';
      const parentLabel = customParent?.termSenior || defaultParentLabel;
      const childLabel = customParent?.termJunior || 'Con';

      return {
        termAtoB: childLabel,
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
        const customUncle = customDictionary?.['uncle_senior'];
        const seniorLabel = customUncle?.termSenior || 'Bác';
        const juniorLabel = customUncle?.termJunior || 'Cháu';
        return {
          termAtoB: juniorLabel,
          termBtoA: seniorLabel,
          explanation: `${a.full_name} thuộc nhánh Bác (nhánh anh) so với cha/mẹ của ${b.full_name}, do đó ${b.full_name} gọi ${a.full_name} là ${seniorLabel}.`,
          region,
          breadcrumbs,
          generationDelta: 1,
          relationshipType: 'cousin',
          lcaName: lca.lcaNodeName,
        };
      } else {
        // A là vai em của cha B -> Chú
        const customUncle = customDictionary?.['uncle_junior'];
        const seniorLabel = customUncle?.termSenior || 'Chú';
        const juniorLabel = customUncle?.termJunior || 'Cháu';
        return {
          termAtoB: juniorLabel,
          termBtoA: seniorLabel,
          explanation: `${a.full_name} là vai Chú (nhánh em trai) so với cha của ${b.full_name}, do đó ${b.full_name} gọi ${a.full_name} là ${seniorLabel}.`,
          region,
          breadcrumbs,
          generationDelta: 1,
          relationshipType: 'cousin',
          lcaName: lca.lcaNodeName,
        };
      }
    } else {
      // A là nữ
      const isSenior = lca.isSeniorBranchA;
      const customAunt = customDictionary?.[isSenior ? 'aunt_senior' : 'aunt_junior'];
      const defaultAuntLabel = isSenior
        ? region === 'south'
          ? 'Cô họ'
          : 'Bác họ (Bác gái)'
        : region === 'central'
        ? 'O'
        : 'Cô';
      const auntLabel = customAunt?.termSenior || defaultAuntLabel;
      const juniorLabel = customAunt?.termJunior || 'Cháu';
      return {
        termAtoB: juniorLabel,
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
      const isFemale = a.gender === 'female';
      const customGrand = customDictionary?.[isFemale ? 'grandparent_direct_female' : 'grandparent_direct_male'];
      const defaultGrandLabel = isFemale ? 'Bà nội' : 'Ông nội';
      const grandLabel = customGrand?.termSenior || defaultGrandLabel;
      const childLabel = customGrand?.termJunior || 'Cháu';
      return {
        termAtoB: childLabel,
        termBtoA: grandLabel,
        explanation: `${a.full_name} là ${grandLabel} trực hệ của ${b.full_name}.`,
        region,
        breadcrumbs,
        generationDelta: 2,
        relationshipType: 'direct_ancestor',
        lcaName: lca.lcaNodeName,
      };
    }

    const isFemale = a.gender === 'female';
    const customGrand = customDictionary?.[isFemale ? 'grandparent_collateral_female' : 'grandparent_collateral_male'];
    const defaultCollateral = isFemale ? 'Bà họ' : 'Ông họ';
    const grandCollateral = customGrand?.termSenior || defaultCollateral;
    const juniorLabel = customGrand?.termJunior || 'Cháu họ';
    return {
      termAtoB: juniorLabel,
      termBtoA: grandCollateral,
      explanation: `${a.full_name} cách ${b.full_name} 2 thế hệ trong dòng họ (${grandCollateral} - ${juniorLabel}).`,
      region,
      breadcrumbs,
      generationDelta: 2,
      relationshipType: 'cousin',
      lcaName: lca.lcaNodeName,
    };
  }

  // Delta = 3: Bậc Cụ
  if (delta === 3) {
    const customGreat = customDictionary?.['great_grandparent'];
    const defaultLabel = a.gender === 'female' ? 'Cụ bà họ' : 'Cụ ông họ';
    const greatLabel = customGreat?.termSenior || defaultLabel;
    const juniorLabel = customGreat?.termJunior || 'Chắt';
    return {
      termAtoB: juniorLabel,
      termBtoA: greatLabel,
      explanation: `${a.full_name} cách ${b.full_name} 3 thế hệ (${greatLabel} - ${juniorLabel}).`,
      region,
      breadcrumbs,
      generationDelta: 3,
      relationshipType: 'direct_ancestor',
      lcaName: lca.lcaNodeName,
    };
  }

  // Delta >= 4: Kỵ / Tiên tổ
  const customAncestor = customDictionary?.['ancestor_4plus'];
  const ancestorLabel = customAncestor?.termSenior || 'Kỵ tổ / Cụ tổ họ';
  const descLabel = customAncestor?.termJunior || 'Chút / Hậu duệ';
  return {
    termAtoB: descLabel,
    termBtoA: ancestorLabel,
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
  breadcrumbs: string[],
  customDictionary?: CustomKinshipDictionary | null
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
    breadcrumbs,
    customDictionary
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

  const contextual = buildContextualAddressing(res, lca, a, b);

  return {
    ...res,
    pathA: lca.pathA,
    pathB: lca.pathB,
    lcaNode: lca.lcaNode || null,
    customsBadge,
    proverbQuote,
    comparisonFacts,
    contextual,
  };
}

/**
 * Xây dựng danh xưng ngữ cảnh (Việc họ tôn ti vs Đời thường) và chỉ dẫn xưng - gọi
 */
function buildContextualAddressing(
  res: KinshipResolution,
  lca: LcaResult,
  a: Member,
  b: Member
) {
  const formalAtoB = res.termAtoB;
  const formalBtoA = res.termBtoA;

  let dailyAtoB = res.termAtoB;
  let dailyBtoA = res.termBtoA;

  if (lca.generationDelta === 0) {
    if (lca.relationshipType === 'sibling' || lca.relationshipType === 'cousin') {
      const yearA = a.birth_year ?? 9999;
      const yearB = b.birth_year ?? 9999;
      if (yearA < yearB) {
        dailyAtoB = 'Em';
        dailyBtoA = a.gender === 'female' ? 'Chị' : 'Anh';
      } else if (yearA > yearB) {
        dailyAtoB = b.gender === 'female' ? 'Chị' : 'Anh';
        dailyBtoA = 'Em';
      } else {
        dailyAtoB = b.gender === 'female' ? 'Chị' : 'Anh';
        dailyBtoA = 'Em';
      }
    }
  }

  const getPronoun = (otherTitle: string, ownTitle: string) => {
    if (ownTitle.includes('Cháu')) return 'Cháu';
    if (ownTitle.includes('Con')) return 'Con';
    if (ownTitle.includes('Em')) return 'Em';
    if (ownTitle.includes('Chắt')) return 'Chắt';
    if (otherTitle.includes('Bác')) return 'Cháu';
    if (otherTitle.includes('Chú') || otherTitle.includes('Cô')) return 'Cháu';
    if (otherTitle.includes('Ông') || otherTitle.includes('Bà')) return 'Cháu';
    if (otherTitle.includes('Bố') || otherTitle.includes('Mẹ')) return 'Con';
    if (otherTitle.includes('Anh') || otherTitle.includes('Chị')) return 'Em';
    if (otherTitle.includes('Em')) return 'Anh/Chị';
    return ownTitle || 'Tôi';
  };

  const pronounA = getPronoun(res.termAtoB, res.termBtoA);
  const pronounB = getPronoun(res.termBtoA, res.termAtoB);

  return {
    formalTermAtoB: formalAtoB,
    formalTermBtoA: formalBtoA,
    dailyTermAtoB: dailyAtoB,
    dailyTermBtoA: dailyBtoA,
    guidanceA: `Xưng "${pronounA}" — Gọi "${res.termAtoB}"`,
    guidanceB: `Xưng "${pronounB}" — Gọi "${res.termBtoA}"`,
  };
}

