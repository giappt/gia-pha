import { Gender } from './database';

export interface AnniversaryMemberItem {
  id: string;
  full_name: string;
  gender: Gender;
  avatar_url: string | null;
  generation: number;
  branch_code: string | null;
  birth_year: number | null;
  death_year: number | null;
  death_lunar_day: number;
  death_lunar_month: number;
  death_lunar_is_leap: boolean;
  death_lunar_year_name: string | null;
  // Thông tin ngày giỗ Dương lịch quy đổi kế tiếp
  solar_date_str: string; // YYYY-MM-DD
  solar_day: number;
  solar_month: number;
  solar_year: number;
  days_left: number; // 0 = Hôm nay, 1 = Ngày mai, >1 = Còn N ngày
  lunar_date_formatted: string; // "Ngày 15/08 Âm lịch (Bính Ngọ)"
  relative_kinship?: string | null; // "Bà nội của bạn", "Cụ kỵ của bạn"
  honorific_prefix?: string; // "Cụ", "Ông", "Bà", "Bà nội", ...
  display_name?: string; // "Cụ Phạm Kim Đức", "Bà nội Lê Thị Nhân", ...
}

export interface AnniversaryDayGroup {
  solar_date_str: string; // YYYY-MM-DD
  solar_day: number;
  solar_month: number;
  solar_year: number;
  lunar_day: number;
  lunar_month: number;
  lunar_year_name: string;
  days_left: number;
  members: AnniversaryMemberItem[];
}

import { KinshipRegion, CustomKinshipDictionary } from './kinship';

export interface AnniversaryOptions {
  daysAhead?: number;
  referenceDate?: Date;
  viewerMemberId?: string;
  branchFilter?: string;
  region?: KinshipRegion;
  customDictionary?: CustomKinshipDictionary | null;
  spouseMap?: Map<string, string[]>;
}

export interface PushSubscribePayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}
