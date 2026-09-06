export type Gender = 'male' | 'female' | 'other';
export type LifeStatus = 'living' | 'deceased';

export interface MemberRecord {
  id: string;
  full_name: string;
  gender: Gender;
  life_status: LifeStatus;
  father_id?: string | null;
  mother_id?: string | null;
  birth_year?: number | null;
  birth_date?: string | null;
  death_year?: number | null;
  death_date?: string | null;
  death_lunar_day?: number | null;
  death_lunar_month?: number | null;
  death_lunar_is_leap?: boolean;
  generation_level: number;
  birth_order?: number | null;
  is_root: boolean;
  is_senior?: boolean | null;
  is_adopted?: boolean | null;
  branch_name?: string | null;
  is_anonymous?: boolean | null;
  alias_name?: string | null;
  burial_location?: string | null;
  notes?: string | null;
  death_lunar_year_name?: string | null;
  claimed_by?: string | null;
  avatar_url?: string | null;
}

export interface SpouseRelationRecord {
  id: string;
  member_a_id: string;
  member_b_id: string;
  marriage_order?: number;
  marriage_status?: string;
}

export interface InternalSpouseInfo {
  id: string;
  fullName: string;
  branchName?: string;
  roleTitle?: string;
}

export interface ExternalSpouseInfo {
  fullName: string;
}

export interface TreeNodeData extends Record<string, any> {
  id: string;
  fullName: string;
  gender: Gender;
  lifeStatus: LifeStatus;
  birthYear?: number | null;
  deathYear?: number | null;
  deathLunarDay?: number | null;
  deathLunarMonth?: number | null;
  generationLevel: number;
  birthOrder?: number | null;
  isRoot: boolean;
  branchName?: string;
  spouseIds?: string[];
  childCount?: number;
  isGhost?: boolean;
  originalMemberId?: string;
  partnerMemberId?: string;
  originalBranchName?: string;
  internalSpouse?: InternalSpouseInfo;
  externalSpouse?: ExternalSpouseInfo;
  inlawRole?: 'daughter_in_law' | 'son_in_law';
  childRole?: 'paternal_grandchild' | 'maternal_grandchild';
  isSenior?: boolean;
  isAnonymous?: boolean;
  aliasName?: string | null;
  burialLocation?: string | null;
  notes?: string | null;
  deathLunarYearName?: string | null;
  motherName?: string;
  motherOrderTitle?: string;
  spouseOrderTitle?: string;
}

export interface ChildrenGroup {
  motherId: string | null;
  motherName: string;
  marriageOrder?: number;
  children: MemberRecord[];
}

export interface ImmediateFamily {
  targetMember: MemberRecord;
  parents: {
    father?: MemberRecord;
    mother?: MemberRecord;
  };
  spouses: Array<{
    member: MemberRecord;
    relation: SpouseRelationRecord;
  }>;
  siblings: MemberRecord[];
  children: MemberRecord[];
  childrenGroups?: ChildrenGroup[];
}

export interface NextAnniversaryInfo {
  solarDateStr: string;
  daysLeft: number;
}

export interface TreeLayoutOptions {
  showMaternalBranches?: boolean;
  showInternalHusbands?: boolean;
  focusRootId?: string | null;
}

export interface GhostNodeData extends Record<string, any> {
  originalMemberId: string;
  partnerMemberId: string;
  fullName: string;
  gender: Gender;
  generationLevel: number;
  originalBranchName?: string;
}

export interface TreeResponseDTO {
  success: boolean;
  clanName: string;
  rootAncestorId: string | null;
  members: MemberRecord[];
  spouseRelations: SpouseRelationRecord[];
}

export interface LayoutNode {
  id: string;
  type: 'memberNode' | 'ghostNode';
  position: { x: number; y: number };
  data: TreeNodeData;
  width?: number;
  height?: number;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: Record<string, any>;
}

export interface TreeLayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

export interface MemberFormData {
  id?: string;
  full_name: string;
  alias_name?: string | null;
  gender: Gender;
  life_status: LifeStatus;
  father_id?: string | null;
  mother_id?: string | null;
  birth_year?: number | null;
  birth_date?: string | null;
  death_lunar_day?: number | null;
  death_lunar_month?: number | null;
  death_lunar_is_leap?: boolean;
  death_lunar_year_name?: string | null;
  death_year?: number | null;
  death_date?: string | null;
  birth_order?: number | null;
  is_senior?: boolean;
  is_adopted?: boolean;
  is_root?: boolean;
  burial_location?: string | null;
  notes?: string | null;
  spouse_id?: string | null;
  marriage_order?: number;
  marriage_status?: 'married' | 'divorced' | 'widowed';
  // Inline Spouse Creation (Dâu / Rể ngoài họ)
  new_spouse_name?: string | null;
  new_spouse_birth_year?: number | null;
  new_spouse_gender?: Gender;
  new_spouse_is_deceased?: boolean;
  // Gán nối danh sách con cái
  child_ids_to_link?: string[];
}

export interface ExcelMemberRow {
  rowNumber: number;
  stt: number | string;
  fullName: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  lifeStatus: 'Còn sống' | 'Đã mất';
  fatherStt?: number | string | null;
  motherStt?: number | string | null;
  spouseStt?: number | string | null;
  birthYear?: number | null;
  deathLunarDay?: number | null;
  deathLunarMonth?: number | null;
  deathLunarIsLeap?: boolean;
  deathLunarYearName?: string | null;
  deathYear?: number | null;
  birthOrder?: number | null;
  isSenior?: boolean;
  isAdopted?: boolean;
  isRoot?: boolean;
  burialLocation?: string | null;
  notes?: string | null;
  validationErrors: string[];
  validationWarnings: string[];
  isValid: boolean;
}

export interface ExcelParseResult {
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  warningRowsCount: number;
  rows: ExcelMemberRow[];
  canImport: boolean;
}

export interface UnlinkedMemberInfo {
  member: MemberRecord;
  reason: 'no_parents_no_spouse' | 'floating_branch';
}

