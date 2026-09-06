export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'viewer' | 'claimed_member' | 'branch_editor' | 'super_admin';
export type Gender = 'male' | 'female' | 'other';
export type LifeStatus = 'living' | 'deceased';
export type RegionalPreset = 'north' | 'central' | 'south' | 'custom';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface BranchNode {
  id: string;
  tierName: string;         // "Ngành", "Chi", "Nhánh", "Phái"
  name: string;             // "Ngành 1", "Chi Trưởng", "Phái Đông"
  rootMemberId?: string | null; // ID Cụ Tiền nhân khởi nguồn
  children?: BranchNode[];  // Các phân chi trực thuộc
  // Tương thích ngược với schema cũ nếu có
  branchCode?: string;
  branchName?: string;
  description?: string;
  displayOrder?: number;
}

export type ClanBranchItem = BranchNode;

export interface ClanSettings {
  id: string;
  clan_name: string;
  root_ancestor_id: string | null;
  branches: Json;
  regional_preset: RegionalPreset;
  custom_kinship_dictionary: Json;
  anniversary_notify_days_before: number;
  allow_public_tree_view: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  full_name: string;
  alias_name: string | null;
  gender: Gender;
  life_status: LifeStatus;
  father_id: string | null;
  mother_id: string | null;
  birth_date: string | null;
  birth_year: number | null;
  death_date: string | null;
  death_lunar_day: number | null;
  death_lunar_month: number | null;
  death_lunar_is_leap: boolean;
  death_lunar_year_name: string | null;
  death_year: number | null;
  burial_location: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  biography: string | null;
  generation_number: number;
  birth_order: number;
  is_senior_branch?: boolean | null;
  is_adopted?: boolean | null;
  spouse_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_role: UserRole;
  linked_member_id: string | null;
  assigned_branch_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      clan_settings: {
        Row: ClanSettings;
        Insert: Partial<ClanSettings>;
        Update: Partial<ClanSettings>;
        Relationships: [];
      };
      members: {
        Row: Member;
        Insert: Partial<Member>;
        Update: Partial<Member>;
        Relationships: [];
      };
      users: {
        Row: UserProfile;
        Insert: Partial<UserProfile>;
        Update: Partial<UserProfile>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRecord;
        Insert: Partial<PushSubscriptionRecord> & {
          user_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
        };
        Update: Partial<PushSubscriptionRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

