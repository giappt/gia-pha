import type { Member } from './database';

export type KinshipRegion = 'north' | 'central' | 'south';

export type RelationshipType =
  | 'same_person'
  | 'parent_child'
  | 'direct_ancestor'
  | 'sibling'
  | 'cousin'
  | 'in_law'
  | 'unrelated';

export type KinshipCategory =
  | 'direct'
  | 'same_gen'
  | 'paternal_uncle_aunt'
  | 'maternal_uncle_aunt'
  | 'in_law_descendant'
  | 'grand_collateral';

export interface KinshipTermRule {
  id: string;
  category: KinshipCategory;
  categoryLabel: string;
  name: string;
  context: string;
  termSenior: string; // B gọi A khi A là vai trên
  termJunior: string; // A gọi B khi B là vai dưới
  note?: string;
}

export type CustomKinshipDictionary = Record<
  string,
  {
    termSenior: string;
    termJunior: string;
  }
>;

export interface KinshipPathNode {
  id: string;
  name: string;
  relation: string;
  birthYear?: number | null;
  generationNumber?: number;
  isSeniorBranch?: boolean;
  isAdopted?: boolean;
  gender?: 'male' | 'female' | 'other';
}

export interface LcaResult {
  lcaNodeId: string | null;
  lcaNodeName: string | null;
  lcaNode?: KinshipPathNode | null;
  distanceA: number; // Số thế hệ từ A lên LCA
  distanceB: number; // Số thế hệ từ B lên LCA
  generationDelta: number; // distanceB - distanceA (> 0: A trên B; < 0: A dưới B; 0: cùng thế hệ)
  isSeniorBranchA: boolean; // Nhánh của A có phải trưởng so với B tại điểm rẽ từ LCA?
  pathA: KinshipPathNode[];
  pathB: KinshipPathNode[];
  relationshipType: RelationshipType;
}

export interface ComparisonFacts {
  labelA: string;
  labelB: string;
  detailA: string;
  detailB: string;
  summary: string;
}

export interface KinshipContextualTerms {
  formalTermAtoB: string; // Trong nghi lễ họ tộc (VD: "Bác họ", "Cháu họ")
  formalTermBtoA: string;
  dailyTermAtoB: string; // Giao tiếp thường nhật / theo tuổi tác (VD: "Bác", "Anh/Chị", "Em")
  dailyTermBtoA: string;
  guidanceA: string; // "Bạn xưng: Cháu — Gọi đối phương: Bác"
  guidanceB: string;
}

export interface KinshipResolution {
  termAtoB: string; // A gọi B là gì (VD: "Bác họ", "Chú họ", "Anh họ")
  termBtoA: string; // B gọi A là gì (VD: "Cháu họ", "Em họ")
  explanation: string; // Diễn giải phong tục (VD: "B là con bác trưởng, A là con chú thứ")
  region: KinshipRegion;
  breadcrumbs: string[]; // Chuỗi mắt xích
  generationDelta: number;
  relationshipType: RelationshipType;
  lcaName?: string | null;
  lcaNode?: KinshipPathNode | null;
  pathA?: KinshipPathNode[]; // Nhánh thế hệ từ A lên LCA
  pathB?: KinshipPathNode[]; // Nhánh thế hệ từ B lên LCA
  customsBadge?: string; // Huy hiệu nguyên tắc phong tục
  proverbQuote?: string; // Lời tục ngữ / danh ngôn cổ phong
  comparisonFacts?: ComparisonFacts; // Bảng so sánh trực diện tương quan
  contextual?: KinshipContextualTerms; // Gợi ý xưng hô theo ngữ cảnh họ tộc vs đời thường
}

export interface LunarDate {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeap: boolean;
  canChiYear: string;
}

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}
