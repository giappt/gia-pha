import { AnniversaryDayGroup } from '@/types/anniversary';

/**
 * Fixture ngày giỗ Hôm Nay (days_left = 0)
 * Dùng cho Live Preview trang Quản trị, Storybook và Unit Tests.
 */
export const MOCK_ANNIVERSARY_GROUP_TODAY: AnniversaryDayGroup = {
  solar_date_str: '2026-09-30',
  solar_day: 30,
  solar_month: 9,
  solar_year: 2026,
  lunar_day: 20,
  lunar_month: 8,
  lunar_year_name: 'Bính Ngọ',
  days_left: 0,
  members: [
    {
      id: 'mock-member-today-1',
      full_name: 'Phạm Văn Khởi',
      gender: 'male',
      avatar_url: null,
      generation: 4,
      branch_code: 'Ngành 1',
      branch_name: 'Ngành 1',
      branch_path: 'Đời 4 · Ngành 1 · Chi 1',
      birth_year: 1912,
      death_year: 1988,
      death_lunar_day: 20,
      death_lunar_month: 8,
      death_lunar_is_leap: false,
      death_lunar_year_name: 'Mậu Thìn',
      solar_date_str: '2026-09-30',
      solar_day: 30,
      solar_month: 9,
      solar_year: 2026,
      days_left: 0,
      lunar_date_formatted: 'Ngày 20/08 Âm lịch (Bính Ngọ)',
      honorific_prefix: 'Cụ',
      display_name: 'Cụ Phạm Văn Khởi',
      relative_kinship: 'Cụ cố của bạn',
    },
  ],
};

/**
 * Fixture ngày giỗ tương lai (days_left = 12)
 * Dùng cho Live Preview và Unit Tests.
 */
export const MOCK_ANNIVERSARY_GROUP_UPCOMING: AnniversaryDayGroup = {
  solar_date_str: '2026-10-12',
  solar_day: 12,
  solar_month: 10,
  solar_year: 2026,
  lunar_day: 2,
  lunar_month: 9,
  lunar_year_name: 'Bính Ngọ',
  days_left: 12,
  members: [
    {
      id: 'mock-member-upcoming-1',
      full_name: 'Lê Thị Thảo',
      gender: 'female',
      avatar_url: null,
      generation: 5,
      branch_code: 'Chi 2',
      branch_name: 'Chi 2',
      branch_path: 'Đời 5 · Ngành 2 · Chi 2',
      birth_year: 1935,
      death_year: 2010,
      death_lunar_day: 2,
      death_lunar_month: 9,
      death_lunar_is_leap: false,
      death_lunar_year_name: 'Canh Dần',
      solar_date_str: '2026-10-12',
      solar_day: 12,
      solar_month: 10,
      solar_year: 2026,
      days_left: 12,
      lunar_date_formatted: 'Ngày 02/09 Âm lịch (Bính Ngọ)',
      honorific_prefix: 'Cụ Bà',
      display_name: 'Cụ Bà Lê Thị Thảo',
      relative_kinship: 'Bà cố của bạn',
    },
  ],
};
