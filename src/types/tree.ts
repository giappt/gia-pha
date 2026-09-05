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
  death_year?: number | null;
  death_lunar_day?: number | null;
  death_lunar_month?: number | null;
  generation_level: number;
  birth_order?: number | null;
  is_root: boolean;
  is_senior?: boolean | null;
  branch_name?: string | null;
  is_anonymous?: boolean | null;
  alias_name?: string | null;
  burial_location?: string | null;
  notes?: string | null;
  death_lunar_year_name?: string | null;
  claimed_by?: string | null;
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
