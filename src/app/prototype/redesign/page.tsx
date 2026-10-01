'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  MapPin,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Flame,
  Star,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Eye,
  BookOpen,
  Sliders,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Link2,
  UserCheck,
  Heart,
  Info,
  AlertCircle,
  X,
  ChevronRight,
  User,
  ArrowUpDown,
  Share2,
  ShieldCheck,
  Search,
  Building2,
  Check,
  LayoutDashboard,
  SlidersHorizontal,
  FileSpreadsheet,
  Shield,
  ClipboardList,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import FamilyTreeIcon from '@/components/icons/FamilyTreeIcon';
import AnniversaryBlocCard from '@/components/anniversaries/AnniversaryBlocCard';
import AnniversaryBlocTimeline from '@/components/anniversaries/AnniversaryBlocTimeline';
import type { AnniversaryDayGroup } from '@/types/anniversary';

// =========================================================================
// DỮ LIỆU THẬT 100% TỪ CƠ SỞ DỮ LIỆU DÒNG HỌ PHẠM (SUPABASE SSOT)
// =========================================================================
const MOCK_GROUPS: AnniversaryDayGroup[] = [
  {
    solar_date_str: '2026-10-05',
    solar_day: 5,
    solar_month: 10,
    solar_year: 2026,
    lunar_day: 3,
    lunar_month: 7,
    lunar_year_name: 'Bính Ngọ',
    days_left: 0,
    members: [
      {
        id: 'mock-chien',
        full_name: 'Phạm Văn Chiến',
        gender: 'male',
        avatar_url: null,
        generation: 1,
        branch_code: 'Cụ Tổ',
        branch_name: 'Họ Phạm',
        branch_path: 'Đời 1 · Cụ Tổ Khởi Thủy',
        birth_year: null,
        death_year: null,
        death_lunar_day: 3,
        death_lunar_month: 7,
        death_lunar_is_leap: false,
        death_lunar_year_name: 'Bính Ngọ',
        solar_date_str: '2026-10-05',
        solar_day: 5,
        solar_month: 10,
        solar_year: 2026,
        days_left: 0,
        lunar_date_formatted: 'Ngày 03/07 Âm lịch (Bính Ngọ)',
        honorific_prefix: 'Cụ Tổ',
        display_name: 'Cụ Tổ Phạm Văn Chiến',
        relative_kinship: 'Cụ Tổ khai sinh dòng họ',
      },
    ],
  },
  {
    solar_date_str: '2026-10-06',
    solar_day: 6,
    solar_month: 10,
    solar_year: 2026,
    lunar_day: 11,
    lunar_month: 5,
    lunar_year_name: 'Bính Ngọ',
    days_left: 1,
    members: [
      {
        id: 'mock-mo',
        full_name: 'Hoàng Thị Mơ',
        gender: 'female',
        avatar_url: null,
        generation: 1,
        branch_code: 'Chánh Thất',
        branch_name: 'Vợ Cả',
        branch_path: 'Đời 1 · Chánh Thất Cụ Chiến',
        birth_year: null,
        death_year: null,
        death_lunar_day: 11,
        death_lunar_month: 5,
        death_lunar_is_leap: false,
        death_lunar_year_name: 'Bính Ngọ',
        solar_date_str: '2026-10-06',
        solar_day: 6,
        solar_month: 10,
        solar_year: 2026,
        days_left: 1,
        lunar_date_formatted: 'Ngày 11/05 Âm lịch (Bính Ngọ)',
        honorific_prefix: 'Cụ Bà Cả',
        display_name: 'Cụ Bà Hoàng Thị Mơ',
        relative_kinship: 'Cụ bà tổ mẫu của dòng họ',
      },
    ],
  },
  {
    solar_date_str: '2026-10-18',
    solar_day: 18,
    solar_month: 10,
    solar_year: 2026,
    lunar_day: 19,
    lunar_month: 5,
    lunar_year_name: 'Bính Ngọ',
    days_left: 13,
    members: [
      {
        id: 'mock-dong',
        full_name: 'Phạm Văn Đồng',
        gender: 'male',
        avatar_url: null,
        generation: 2,
        branch_code: 'Ngành 1',
        branch_name: 'Trưởng Ngành',
        branch_path: 'Đời 2 · Ngành 1',
        birth_year: null,
        death_year: null,
        death_lunar_day: 19,
        death_lunar_month: 5,
        death_lunar_is_leap: false,
        death_lunar_year_name: 'Bính Ngọ',
        solar_date_str: '2026-10-18',
        solar_day: 18,
        solar_month: 10,
        solar_year: 2026,
        days_left: 13,
        lunar_date_formatted: 'Ngày 19/05 Âm lịch (Bính Ngọ)',
        honorific_prefix: 'Cụ',
        display_name: 'Cụ Phạm Văn Đồng',
        relative_kinship: 'Con trai Cụ Chiến & Cụ Mơ',
      },
      {
        id: 'mock-lieu',
        full_name: 'Đào Thị Liễu',
        gender: 'female',
        avatar_url: null,
        generation: 1,
        branch_code: 'Thứ Thất',
        branch_name: 'Vợ Hai',
        branch_path: 'Đời 1 · Thứ Thất Cụ Chiến',
        birth_year: null,
        death_year: null,
        death_lunar_day: 24,
        death_lunar_month: 7,
        death_lunar_is_leap: false,
        death_lunar_year_name: 'Bính Ngọ',
        solar_date_str: '2026-10-18',
        solar_day: 18,
        solar_month: 10,
        solar_year: 2026,
        days_left: 13,
        lunar_date_formatted: 'Ngày 24/07 Âm lịch (Bính Ngọ)',
        honorific_prefix: 'Cụ Bà Hai',
        display_name: 'Cụ Bà Đào Thị Liễu',
        relative_kinship: 'Vợ hai Cụ Tổ Chiến',
      },
    ],
  },
];

// =========================================================================
// THÀNH VIÊN THỰC TẾ TRONG CƠ SỞ DỮ LIỆU DÒNG HỌ PHẠM (5 THẾ HỆ LIÊN TỤC)
// =========================================================================
interface TreeMemberItem {
  id: string;
  fullName: string;
  aliasName?: string;
  gender: 'male' | 'female';
  lifeStatus: 'living' | 'deceased';
  generation: number;
  branchPath: string;
  birthYear?: number;
  deathYear?: number;
  deathLunar?: string;
  isRoot?: boolean;
  isSenior?: boolean;
  isGhost?: boolean;
  ghostBranch?: string;
  roleTitle?: string;
  childCount?: number;
  initials: string;
  career?: string;
  burialLocation?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  childrenNames?: string[];
}

const TREE_MEMBERS: Record<string, TreeMemberItem> = {
  chien: {
    id: 'chien',
    fullName: 'Phạm Văn Chiến',
    aliasName: 'Cụ Tổ',
    gender: 'male',
    lifeStatus: 'deceased',
    generation: 1,
    branchPath: 'Đời 1 · Cụ Tổ Khởi Thủy',
    deathLunar: '03/7 Âm lịch',
    isRoot: true,
    initials: 'PC',
    career: 'Cụ Tổ khai sinh dòng họ Phạm, có công khai hoang lập ấp truyền đời.',
    spouseName: 'Hoàng Thị Mơ (Bà Cả) & Đào Thị Liễu (Bà Hai)',
    childrenNames: ['Phạm Văn Đồng (Trưởng Ngành 1)'],
  },
  mo: {
    id: 'mo',
    fullName: 'Hoàng Thị Mơ',
    gender: 'female',
    lifeStatus: 'deceased',
    generation: 1,
    branchPath: 'Đời 1 · Chánh Thất (Vợ Cả)',
    deathLunar: '11/5 Âm lịch',
    roleTitle: 'Chánh Thất (Vợ Cả)',
    initials: 'HM',
    spouseName: 'Phạm Văn Chiến',
    childrenNames: ['Phạm Văn Đồng'],
  },
  lieu: {
    id: 'lieu',
    fullName: 'Đào Thị Liễu',
    gender: 'female',
    lifeStatus: 'deceased',
    generation: 1,
    branchPath: 'Đời 1 · Thứ Thất (Vợ Hai)',
    deathLunar: '24/7 Âm lịch',
    roleTitle: 'Thứ Thất (Vợ Hai)',
    initials: 'ĐL',
    spouseName: 'Phạm Văn Chiến',
  },
  dong: {
    id: 'dong',
    fullName: 'Phạm Văn Đồng',
    gender: 'male',
    lifeStatus: 'deceased',
    generation: 2,
    branchPath: 'Đời 2 · Ngành 1 - Trưởng',
    deathLunar: '19/5 Âm lịch',
    isSenior: true,
    roleTitle: 'Trưởng Ngành 1',
    initials: 'PĐ',
    childCount: 1,
    fatherName: 'Phạm Văn Chiến',
    motherName: 'Hoàng Thị Mơ',
    spouseName: 'Vũ Thị Thìn',
    childrenNames: ['Phạm Kim Chức'],
  },
  thin: {
    id: 'thin',
    fullName: 'Vũ Thị Thìn',
    gender: 'female',
    lifeStatus: 'deceased',
    generation: 2,
    branchPath: 'Đời 2 · Ngành 1',
    deathLunar: '08/6 Âm lịch',
    roleTitle: 'Vợ Cụ Đồng',
    initials: 'VT',
    spouseName: 'Phạm Văn Đồng',
    childrenNames: ['Phạm Kim Chức'],
  },
  chuc: {
    id: 'chuc',
    fullName: 'Phạm Kim Chức',
    gender: 'male',
    lifeStatus: 'deceased',
    generation: 3,
    branchPath: 'Đời 3 · Ngành 1',
    deathLunar: '13/6 Âm lịch',
    roleTitle: 'Đời thứ 3 Ngành 1',
    initials: 'PC',
    childCount: 1,
    fatherName: 'Phạm Văn Đồng',
    motherName: 'Vũ Thị Thìn',
    spouseName: 'Hoàng Thị Dinh',
    childrenNames: ['Phạm Khắc Tường'],
  },
  dinh: {
    id: 'dinh',
    fullName: 'Hoàng Thị Dinh',
    gender: 'female',
    lifeStatus: 'deceased',
    generation: 3,
    branchPath: 'Đời 3 · Ngành 1',
    deathLunar: '20/3 Âm lịch',
    roleTitle: 'Vợ Cụ Chức',
    initials: 'HD',
    spouseName: 'Phạm Kim Chức',
    childrenNames: ['Phạm Khắc Tường'],
  },
  tuong: {
    id: 'tuong',
    fullName: 'Phạm Khắc Tường',
    gender: 'male',
    lifeStatus: 'deceased',
    generation: 4,
    branchPath: 'Đời 4 · Ngành 1',
    deathLunar: '11/6 Âm lịch',
    roleTitle: 'Đời thứ 4 Ngành 1',
    initials: 'PT',
    childCount: 2,
    fatherName: 'Phạm Kim Chức',
    motherName: 'Hoàng Thị Dinh',
    spouseName: 'Nguyễn Thị Hiến',
    childrenNames: ['Phạm Khắc Đoàn (Trưởng)', 'Phạm Kim Đức (Thứ)'],
  },
  hien: {
    id: 'hien',
    fullName: 'Nguyễn Thị Hiến',
    gender: 'female',
    lifeStatus: 'deceased',
    generation: 4,
    branchPath: 'Đời 4 · Ngành 1',
    deathLunar: '19/8 Âm lịch',
    roleTitle: 'Vợ Cụ Tường',
    initials: 'NH',
    spouseName: 'Phạm Khắc Tường',
    childrenNames: ['Phạm Khắc Đoàn', 'Phạm Kim Đức'],
  },
  doan: {
    id: 'doan',
    fullName: 'Phạm Khắc Đoàn',
    gender: 'male',
    lifeStatus: 'deceased',
    generation: 5,
    branchPath: 'Đời 5 · Ngành 1 - Trưởng',
    deathLunar: '23/5 Âm lịch',
    isSenior: true,
    roleTitle: 'Trưởng Nam Đời 5',
    initials: 'PĐ',
    fatherName: 'Phạm Khắc Tường',
    motherName: 'Nguyễn Thị Hiến',
    spouseName: 'Lê Thị Nhân',
  },
  nhan: {
    id: 'nhan',
    fullName: 'Lê Thị Nhân',
    gender: 'female',
    lifeStatus: 'deceased',
    generation: 5,
    branchPath: 'Đời 5 · Ngành 1',
    deathLunar: '20/6 Âm lịch',
    roleTitle: 'Vợ Cụ Đoàn',
    initials: 'LN',
    spouseName: 'Phạm Khắc Đoàn',
  },
  duc: {
    id: 'duc',
    fullName: 'Phạm Kim Đức',
    gender: 'male',
    lifeStatus: 'deceased',
    generation: 5,
    branchPath: 'Đời 5 · Ngành 1 - Thứ',
    deathLunar: '12/8 Âm lịch',
    roleTitle: 'Thứ Nam Đời 5',
    initials: 'PĐ',
    fatherName: 'Phạm Khắc Tường',
    motherName: 'Nguyễn Thị Hiến',
  },
  giap: {
    id: 'giap',
    fullName: 'Phạm Tiến Giáp',
    gender: 'male',
    lifeStatus: 'living',
    generation: 12,
    branchPath: 'Đời 12 · Ngành 1 - Trưởng',
    birthYear: 1990,
    isSenior: true,
    roleTitle: 'Đích Tôn (Chính bạn)',
    initials: 'PG',
    career: 'Kỹ sư giải pháp phần mềm, quản trị viên số hóa Gia Phả.',
    fatherName: 'Hậu duệ dòng dõi Cụ Tường & Cụ Đoàn',
  },
  huong: {
    id: 'huong',
    fullName: 'Phạm Thị Hương',
    gender: 'female',
    lifeStatus: 'living',
    generation: 12,
    branchPath: 'Đời 12 · Ngành 1',
    birthYear: 1994,
    roleTitle: 'Em gái bạn',
    initials: 'PH',
    career: 'Giáo viên văn học.',
  },
};

// =========================================================================
// SEMANTIC COLOR TOKENS ENGINE (ĐỒNG BỘ 100% CÂY, DRAWER, FORM VÀ MODAL)
// =========================================================================
function getPaletteTokens(palette: 'bright_crisp' | 'indigo_plum' | 'earth_wood' | 'ink_wash' | 'legacy_neon') {
  switch (palette) {
    case 'bright_crisp': // PA 1: Sáng & Trong Trẻo (Tươi Mới - Khuyên Dùng)
      return {
        name: 'PA 1: Sáng & Trong Trẻo (Tươi Mới - Khuyên Dùng)',
        male: {
          active: 'bg-sky-600 text-white shadow-2xs border-sky-600',
          inactive: 'text-stone-600 hover:bg-sky-50 hover:text-sky-700 border-transparent',
          badge: 'bg-sky-50 text-sky-700 border-sky-200',
          avatar: 'bg-sky-50 text-sky-700 border border-sky-200',
          dot: 'bg-sky-400',
          label: 'Thanh Thiên · Xanh Ngọc',
        },
        female: {
          active: 'bg-rose-500 text-white shadow-2xs border-rose-500',
          inactive: 'text-stone-600 hover:bg-rose-50 hover:text-rose-700 border-transparent',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          avatar: 'bg-rose-50 text-rose-700 border border-rose-200',
          dot: 'bg-rose-400',
          label: 'Hồng Phấn · Dịu Sáng',
        },
        living: {
          active: 'bg-emerald-600 text-white shadow-2xs border-emerald-600',
          inactive: 'text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 border-transparent',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-400',
        },
        deceased: {
          active: 'bg-stone-600 text-white shadow-2xs border-stone-600',
          inactive: 'text-stone-600 hover:bg-stone-100 hover:text-stone-700 border-transparent',
          badge: 'bg-stone-100 text-stone-700 border-stone-300',
          dot: 'bg-stone-400',
        },
      };
    case 'indigo_plum': // PA 2: Chàm Cổ & Cánh Sen Trầm
      return {
        name: 'PA 2: Chàm Cổ & Sen Trầm',
        male: {
          active: 'bg-[#234E70] text-white shadow-2xs border-[#234E70]',
          inactive: 'text-stone-600 hover:bg-[#E8EFF5] hover:text-[#1B3B54] border-transparent',
          badge: 'bg-[#E8EFF5] text-[#1B3B54] border-[#B9D0E2]',
          avatar: 'bg-[#E8EFF5] text-[#1B3B54] border border-[#B9D0E2]',
          dot: 'bg-[#234E70]',
          label: 'Chàm Cổ · Mực Lam',
        },
        female: {
          active: 'bg-[#8C4A5A] text-white shadow-2xs border-[#8C4A5A]',
          inactive: 'text-stone-600 hover:bg-[#F8EFF1] hover:text-[#702A3C] border-transparent',
          badge: 'bg-[#F8EFF1] text-[#702A3C] border-[#E5CAD0]',
          avatar: 'bg-[#F8EFF1] text-[#702A3C] border border-[#E5CAD0]',
          dot: 'bg-[#8C4A5A]',
          label: 'Cánh Sen Trầm · Tía Mận',
        },
        living: {
          active: 'bg-emerald-700 text-white shadow-2xs border-emerald-700',
          inactive: 'text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 border-transparent',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-400',
        },
        deceased: {
          active: 'bg-[#3A3836] text-white shadow-2xs border-[#3A3836]',
          inactive: 'text-stone-600 hover:bg-stone-100 hover:text-stone-700 border-transparent',
          badge: 'bg-stone-100 text-stone-700 border-stone-300',
          dot: 'bg-stone-400',
        },
      };
    case 'earth_wood': // PA 3: Thổ Mộc & Đất Nung
      return {
        name: 'PA 3: Thổ Mộc & Đất Nung',
        male: {
          active: 'bg-[#1E4E45] text-white shadow-2xs border-[#1E4E45]',
          inactive: 'text-stone-600 hover:bg-[#E8F0ED] hover:text-[#143B34] border-transparent',
          badge: 'bg-[#E8F0ED] text-[#143B34] border-[#BDD4CD]',
          avatar: 'bg-[#E8F0ED] text-[#143B34] border border-[#BDD4CD]',
          dot: 'bg-[#1E4E45]',
          label: 'Rêu Phong · Am Mộc',
        },
        female: {
          active: 'bg-[#A0522D] text-white shadow-2xs border-[#A0522D]',
          inactive: 'text-stone-600 hover:bg-[#FAF0E6] hover:text-[#7B3A1C] border-transparent',
          badge: 'bg-[#FAF0E6] text-[#7B3A1C] border-[#E4CEB8]',
          avatar: 'bg-[#FAF0E6] text-[#7B3A1C] border border-[#E4CEB8]',
          dot: 'bg-[#A0522D]',
          label: 'Gạch Cổ · Đất Nung',
        },
        living: {
          active: 'bg-[#2A5E4E] text-white shadow-2xs border-[#2A5E4E]',
          inactive: 'text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 border-transparent',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-400',
        },
        deceased: {
          active: 'bg-[#4A3F35] text-white shadow-2xs border-[#4A3F35]',
          inactive: 'text-stone-600 hover:bg-stone-100 hover:text-stone-700 border-transparent',
          badge: 'bg-stone-100 text-stone-700 border-stone-300',
          dot: 'bg-stone-400',
        },
      };
    case 'ink_wash': // PA 4: Thủy Mặc Tối Giản
      return {
        name: 'PA 4: Thủy Mặc Tối Giản',
        male: {
          active: 'bg-stone-800 text-white shadow-2xs border-stone-800',
          inactive: 'text-stone-600 hover:bg-[#ECEAE4] hover:text-stone-900 border-transparent',
          badge: 'bg-[#ECEAE4] text-stone-800 border-[#D8D2C4]',
          avatar: 'bg-[#ECEAE4] text-stone-800 border border-[#D8D2C4]',
          dot: 'bg-stone-600',
          label: 'Mực Than Chì Đậm',
        },
        female: {
          active: 'bg-stone-600 text-white shadow-2xs border-stone-600',
          inactive: 'text-stone-600 hover:bg-[#F5F2EB] hover:text-stone-900 border-transparent',
          badge: 'bg-[#F5F2EB] text-stone-700 border-[#DFD9CB]',
          avatar: 'bg-[#F5F2EB] text-stone-700 border border-[#DFD9CB]',
          dot: 'bg-stone-400',
          label: 'Mực Nhạt Thanh Nhã',
        },
        living: {
          active: 'bg-emerald-700 text-white shadow-2xs border-emerald-700',
          inactive: 'text-stone-600 hover:bg-stone-100 hover:text-stone-800 border-transparent',
          badge: 'bg-stone-100 text-emerald-800 border-stone-300',
          dot: 'bg-emerald-400',
        },
        deceased: {
          active: 'bg-stone-700 text-white shadow-2xs border-stone-700',
          inactive: 'text-stone-600 hover:bg-stone-100 hover:text-stone-800 border-transparent',
          badge: 'bg-stone-100 text-stone-700 border-stone-300',
          dot: 'bg-stone-400',
        },
      };
    default: // legacy_neon
      return {
        name: 'Bản Cũ (Neon)',
        male: {
          active: 'bg-blue-600 text-white shadow-2xs border-blue-600',
          inactive: 'text-stone-600 hover:bg-blue-50 hover:text-blue-700 border-transparent',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          avatar: 'bg-blue-100 text-blue-800 border border-blue-300',
          dot: 'bg-blue-500',
          label: 'Lam Web Mặc Định',
        },
        female: {
          active: 'bg-pink-600 text-white shadow-2xs border-pink-600',
          inactive: 'text-stone-600 hover:bg-pink-50 hover:text-pink-700 border-transparent',
          badge: 'bg-pink-50 text-pink-700 border-pink-200',
          avatar: 'bg-pink-100 text-pink-800 border border-pink-300',
          dot: 'bg-pink-500',
          label: 'Hồng Neon Mặc Định',
        },
        living: {
          active: 'bg-emerald-700 text-white shadow-2xs border-emerald-700',
          inactive: 'text-stone-600 hover:bg-stone-50 border-transparent',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-400',
        },
        deceased: {
          active: 'bg-slate-700 text-white shadow-2xs border-slate-700',
          inactive: 'text-stone-600 hover:bg-stone-50 border-transparent',
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        },
      };
  }
}

export default function ProfessionalDesignSystemShowcase() {
  const [activeScreen, setActiveScreen] = useState<'home' | 'anniversaries' | 'tree' | 'kinship' | 'admin' | 'forms' | 'tokens'>('home');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedHomeScenario, setSelectedHomeScenario] = useState<number>(0);
  const [showYearGridModal, setShowYearGridModal] = useState<boolean>(false);

  // States cho Cây Gia Phả - Mặc định là BRIGHT_CRISP (Tươi sáng & Tinh tế)
  const [treeViewMode, setTreeViewMode] = useState<'normal' | 'anniversary'>('normal');
  const [treePalette, setTreePalette] = useState<'bright_crisp' | 'indigo_plum' | 'earth_wood' | 'ink_wash' | 'legacy_neon'>('bright_crisp');
  const [activeAnnivFocus, setActiveAnnivFocus] = useState<'none' | 'chien' | 'mo' | 'dong' | 'lieu'>('chien');
  const [selectedTreeMemberId, setSelectedTreeMemberId] = useState<string>('chien');

  // Token màu sắc đồng bộ toàn hệ thống
  const currentTokens = getPaletteTokens(treePalette);

  // States cho Tra Cứu Vai Vế (Kinship Simulator)
  const [kinshipPersonA, setKinshipPersonA] = useState<string>('giap');
  const [kinshipPersonB, setKinshipPersonB] = useState<string>('tuong');

  // States cho Form Nhập Liệu
  const [formActiveSection, setFormActiveSection] = useState<'identity' | 'lineage' | 'spouse' | 'death' | 'children'>('identity');
  const [isLiveModalOpen, setIsLiveModalOpen] = useState<boolean>(false);
  const [modalFormMode, setModalFormMode] = useState<'create' | 'edit'>('edit');

  // Form Field States (Interactive Preview)
  const [formFullName, setFormFullName] = useState('Phạm Tiến Giáp');
  const [formAlias, setFormAlias] = useState('Tự: Văn Giáp');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formLifeStatus, setFormLifeStatus] = useState<'living' | 'deceased'>('living');
  const [formBirthYear, setFormBirthYear] = useState('1990');
  const [formFatherId, setFormFatherId] = useState('cuong');
  const [formMotherId, setFormMotherId] = useState('cham');
  const [formBirthOrder, setFormBirthOrder] = useState<number>(1);
  const [formIsSenior, setFormIsSenior] = useState(true);
  const [formSpouseOrigin, setFormSpouseOrigin] = useState<'external' | 'internal'>('external');
  const [formDeathLunarDay, setFormDeathLunarDay] = useState('25');
  const [formDeathLunarMonth, setFormDeathLunarMonth] = useState('8');
  const [formDeathLunarYearName, setFormDeathLunarYearName] = useState('Bính Ngọ');

  const currentHomeGroup = MOCK_GROUPS[selectedHomeScenario] || MOCK_GROUPS[0];
  const selectedMemberData = TREE_MEMBERS[selectedTreeMemberId] || TREE_MEMBERS['cham'];

  // States cho Bàn Quản Trị (Admin Dashboard)
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminBranchFilter, setAdminBranchFilter] = useState<'all' | 'branch_1' | 'branch_2'>('all');
  const [approvedClaims, setApprovedClaims] = useState<string[]>([]);
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'claims' | 'users' | 'branches' | 'governance'>('dashboard');

  // Chế độ Bố cục Trang Chủ: 'clean' (Chuẩn thực tế như src/app/page.tsx) vs 'extended' (Đề xuất thêm 2 thẻ)
  const [homeLayoutMode, setHomeLayoutMode] = useState<'clean' | 'extended'>('clean');

  const busLineBg =
    treePalette === 'bright_crisp'
      ? 'bg-stone-300'
      : treePalette === 'indigo_plum'
        ? 'bg-[#0F382C]'
        : treePalette === 'earth_wood'
          ? 'bg-[#292524]'
          : treePalette === 'ink_wash'
            ? 'bg-stone-700'
            : 'bg-emerald-700';

  const spouseDotBg =
    treePalette === 'bright_crisp'
      ? 'bg-rose-400'
      : treePalette === 'indigo_plum'
        ? 'bg-[#0F382C]'
        : treePalette === 'earth_wood'
          ? 'bg-[#292524]'
          : treePalette === 'ink_wash'
            ? 'bg-stone-800'
            : 'bg-emerald-800';

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 pb-32 font-sans selection:bg-amber-100 selection:text-amber-950">
      {/* ============================================================ */}
      {/* 1. THANH CÔNG CỤ THỬ NGHIỆM PROTOTYPE (STUDIO META RIBBON) */}
      {/* ============================================================ */}
      <div className="bg-[#1C1917] text-stone-300 text-xs px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white tracking-wide">FAT Studio Inspector:</span>
          <span className="text-stone-400 hidden md:inline">Bản mô phỏng giao diện toàn cảnh (Full Page Experience)</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Screen Jump */}
          <div className="flex items-center gap-1 bg-stone-800/90 p-0.5 rounded-lg border border-stone-700 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveScreen('home')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeScreen === 'home' ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              1. Home
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('anniversaries')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeScreen === 'anniversaries' ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              2. Giỗ
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('tree')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeScreen === 'tree' ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              3. Cây
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('kinship')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeScreen === 'kinship' ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              4. Vai Vế
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('admin')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeScreen === 'admin' ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              5. Quản Trị
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('forms')}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                activeScreen === 'forms' ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>6. Form</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('tokens')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeScreen === 'tokens' ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
              }`}
            >
              7. Tokens
            </button>
          </div>

          {/* Toggle Desktop / Mobile Viewport */}
          {(activeScreen === 'home' || activeScreen === 'anniversaries') && (
            <div className="flex items-center bg-stone-800/90 p-0.5 rounded-lg border border-stone-700 text-[11px]">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`px-2 py-0.5 rounded transition-all ${
                  deviceMode === 'desktop' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`px-2 py-0.5 rounded transition-all ${
                  deviceMode === 'mobile' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-400 hover:text-white'
                }`}
              >
                Mobile (375px)
              </button>
            </div>
          )}

          {/* Test Controls riêng cho Trang Chủ */}
          {activeScreen === 'home' && (
            <div className="hidden lg:flex items-center gap-1 bg-stone-800/90 p-0.5 rounded-lg border border-stone-700 text-[11px]">
              <span className="text-stone-400 px-1 font-medium">Bố cục:</span>
              <button
                type="button"
                onClick={() => setHomeLayoutMode('clean')}
                className={`px-2 py-0.5 rounded transition-all ${
                  homeLayoutMode === 'clean' ? 'bg-white text-stone-900 font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                Chuẩn Code
              </button>
              <button
                type="button"
                onClick={() => setHomeLayoutMode('extended')}
                className={`px-2 py-0.5 rounded transition-all ${
                  homeLayoutMode === 'extended' ? 'bg-white text-stone-900 font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                + Đề Xuất
              </button>

              <span className="text-stone-600 px-1">|</span>

              <span className="text-stone-400 px-1 font-medium">Giỗ:</span>
              <button
                type="button"
                onClick={() => setSelectedHomeScenario(0)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  selectedHomeScenario === 0 ? 'bg-white text-stone-900 font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setSelectedHomeScenario(1)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  selectedHomeScenario === 1 ? 'bg-white text-stone-900 font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                Ngày mai
              </button>
              <button
                type="button"
                onClick={() => setSelectedHomeScenario(2)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  selectedHomeScenario === 2 ? 'bg-white text-stone-900 font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                Trùng 2
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. THANH ĐIỀU HƯỚNG CHÍNH THỨC CỦA HỆ THỐNG GIA PHẢ (HEADER BAR) */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E7E2D5] bg-white/95 backdrop-blur-md transition-colors shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Clan Name */}
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0F382C] text-[#E8D49E] flex items-center justify-center font-serif font-black text-xl shadow-xs border border-[#164E3D] group-hover:scale-105 transition-transform">
              范
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-stone-900 tracking-tight leading-none group-hover:text-[#0F382C] transition-colors">
                GIA PHẢ HỌ PHẠM
              </span>
              <span className="text-[11px] font-semibold text-[#0F382C] mt-1 leading-none tracking-wide">
                FAT · Gia Phả Số Hiện Đại
              </span>
            </div>
          </button>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveScreen('home')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeScreen === 'home'
                  ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
              }`}
            >
              Trang Chủ
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeScreen === 'tree'
                  ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
              }`}
            >
              <FamilyTreeIcon className="w-4 h-4 text-emerald-600" />
              <span>Cây Gia Phả</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('anniversaries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeScreen === 'anniversaries'
                  ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Lịch Giỗ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('kinship')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeScreen === 'kinship'
                  ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Xưng Hô</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveScreen('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeScreen === 'admin'
                  ? 'bg-[#0F382C] text-[#F3E5C8] font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Quản Trị</span>
            </button>
          </nav>

          {/* Right: Theme Toggle & User Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F2] border border-[#DDD8CD] flex items-center justify-center text-stone-600">
              <Sun className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-[#EAE5D9]">
              <div className="w-8 h-8 rounded-full bg-[#0F382C] text-[#E8D49E] font-bold text-xs flex items-center justify-center shadow-2xs">
                GP
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-stone-900 leading-tight">Giáp Phạm</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. KHÔNG GIAN TRÌNH DIỄN THÀNH PHẦN (MAIN CANVAS) */}
      {/* ============================================================ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        {/* ============================================================ */}
        {/* MÀN HÌNH 1: TRANG CHỦ (HOME CLAN PORTAL) */}
        {/* ============================================================ */}
        {activeScreen === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {deviceMode === 'desktop' ? (
              <div className="space-y-10">
                {/* 1. Hero Header Chuẩn (100% Thuần Khiết, Không Box, Không Viền Giả Lập) */}
                <div className="text-center max-w-3xl mx-auto pt-6 pb-2 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-800 font-sans">
                    Hệ Thống Gia Phả Trực Tuyến
                  </p>
                  <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight leading-[1.12] uppercase font-serif">
                    GIA PHẢ PHẠM VĂN
                  </h1>
                  <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-sans font-normal">
                    Nền tảng số hóa gia phả trực tuyến hiện đại.
                    <br />
                    Kết nối thế hệ con cháu, thông báo ngày giỗ theo Âm lịch truyền thống.
                  </p>
                </div>

                {/* 2. Grid Nội Dung Trang Chủ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-8 space-y-6">
                    <AnniversaryBlocCard group={currentHomeGroup} forceLayout="desktop" />

                    {/* Khối Cội Nguồn & Hai Chi: CHỈ HIỂN THỊ KHI BẬT CHẾ ĐỘ Ý TƯỞNG MỞ RỘNG */}
                    {homeLayoutMode === 'extended' && (
                      <div className="rounded-2xl bg-amber-50/40 border border-dashed border-amber-300 p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-serif uppercase tracking-widest font-bold text-stone-700">
                              Cội Nguồn & Hai Đại Chi Tông Tộc
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                              Ý Tưởng Đề Xuất Thêm
                            </span>
                          </div>
                          <span className="text-xs text-amber-700 font-medium">Chưa có trong code gốc</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-1">
                            <p className="text-[10px] font-bold uppercase text-[#0F382C]">Cụ Tổ Khởi Thủy</p>
                            <h4 className="font-serif font-bold text-stone-900 text-sm">Phạm Văn Chiến</h4>
                            <p className="text-[11px] text-stone-500">Thế hệ thứ 1 • Cụ Tổ</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-1">
                            <p className="text-[10px] font-bold uppercase text-[#0F382C]">Đại Chi Thứ Nhất</p>
                            <h4 className="font-serif font-bold text-stone-900 text-sm">Ngành 1 (Trưởng)</h4>
                            <p className="text-[11px] text-stone-500">Chi 1 & Chi 2 • Trưởng tộc</p>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-1">
                            <p className="text-[10px] font-bold uppercase text-[#0F382C]">Đại Chi Thứ Hai</p>
                            <h4 className="font-serif font-bold text-stone-900 text-sm">Ngành 2 (Thứ)</h4>
                            <p className="text-[11px] text-stone-500">Chi 1 • Thứ tộc</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    {/* Thẻ Ngữ Cảnh Định Danh Cá Nhân (IdentityContextWidget) */}
                    <div className="rounded-2xl bg-white border border-[#EAE5D9] p-5 shadow-[0_2px_12px_-2px_rgba(28,25,23,0.04)] space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-[#F0EBE1]">
                        <div className="w-11 h-11 rounded-xl bg-[#0F382C] text-[#EAD096] flex items-center justify-center font-serif font-bold text-sm shadow-xs shrink-0">
                          GP
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-stone-900">Giáp Phạm</h4>
                          <p className="text-[11px] text-stone-500">Phạm Tiến Giáp • Đời 12 • Ngành 1</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-[#F5F2EA]">
                          <span className="text-stone-400">Vai trò quản trị:</span>
                          <span className="font-bold text-[#0F382C]">Super Admin</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#F5F2EA]">
                          <span className="text-stone-400">Hồ sơ liên kết:</span>
                          <span className="font-semibold text-stone-800">Đã gắn trên cây</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen('tree');
                          setSelectedTreeMemberId('giap');
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-[#F4F1E8] hover:bg-[#EAE5D9] text-stone-800 block transition-colors shadow-2xs"
                      >
                        Xem Nhánh Gia Đình Của Bạn →
                      </button>
                    </div>

                    {/* Khối Quy Mô Gia Tộc: CHỈ HIỂN THỊ KHI BẬT CHẾ ĐỘ Ý TƯỞNG MỞ RỘNG */}
                    {homeLayoutMode === 'extended' && (
                      <div className="rounded-2xl bg-amber-50/40 border border-dashed border-amber-300 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                          <h4 className="text-xs font-serif uppercase tracking-widest font-bold text-stone-600">
                            Quy Mô Gia Tộc
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                            Ý Tưởng Đề Xuất
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 text-center">
                          <div className="p-3 rounded-xl bg-white border border-amber-200">
                            <p className="text-xl font-serif font-bold text-stone-900">13</p>
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Thế Hệ</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-amber-200">
                            <p className="text-xl font-serif font-bold text-stone-900">52</p>
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Nhân Khẩu</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-amber-200">
                            <p className="text-xl font-serif font-bold text-stone-900">2</p>
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Ngành</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-amber-200">
                            <p className="text-xl font-serif font-bold text-stone-900">5</p>
                            <p className="text-[10px] text-stone-400 uppercase font-semibold">Tài Khoản</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-[375px] min-h-[640px] max-h-[840px] bg-[#FAF8F2] rounded-[44px] border-[9px] border-stone-800 shadow-2xl p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
                  <div>
                    {/* Notch tai thỏ */}
                    <div className="w-24 h-4 bg-stone-800 rounded-md mx-auto mb-2 shrink-0" />

                    {/* Header di động */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#EAE5D9]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#0F382C] text-[#E8D49E] flex items-center justify-center font-serif font-black text-xs shadow-xs">
                          范
                        </div>
                        <span className="font-extrabold text-xs text-stone-900 tracking-tight">GIA PHẢ HỌ PHẠM</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#0F382C] text-[#E8D49E] text-[10px] font-bold flex items-center justify-center shadow-2xs">
                        GP
                      </div>
                    </div>

                    {/* 1. Hero di động chuẩn (Thuần khiết, không box, không viền) */}
                    <div className="pt-4 pb-3 space-y-1.5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 font-sans">
                        Hệ Thống Gia Phả Trực Tuyến
                      </p>
                      <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">
                        GIA PHẢ PHẠM VĂN
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        Nền tảng số hóa gia phả trực tuyến hiện đại. Kết nối thế hệ con cháu, thông báo ngày giỗ theo Âm lịch.
                      </p>
                    </div>

                    {/* 2. Thẻ Lịch Giỗ Bloc Trang Chủ (forceLayout mobile) */}
                    <div className="mt-2">
                      <AnniversaryBlocCard group={currentHomeGroup} forceLayout="mobile" />
                    </div>

                    {/* 3. Thẻ Hồ Sơ Thành Viên Cá Nhân */}
                    <div className="mt-4 p-4 rounded-xl bg-white border border-[#EAE5D9] shadow-xs space-y-3">
                      <div className="flex items-center gap-3 pb-2.5 border-b border-[#F0EBE1]">
                        <div className="w-10 h-10 rounded-xl bg-[#0F382C] text-[#EAD096] flex items-center justify-center font-serif font-bold text-xs shadow-xs shrink-0">
                          GP
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif font-bold text-sm text-stone-900 truncate">Giáp Phạm</h4>
                          <p className="text-[11px] text-stone-500 truncate">Phạm Tiến Giáp • Đời 12 • Ngành 1</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between py-0.5 border-b border-[#F5F2EA]">
                          <span className="text-stone-400">Vai trò quản trị:</span>
                          <span className="font-bold text-[#0F382C]">Super Admin</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-[#F5F2EA]">
                          <span className="text-stone-400">Hồ sơ liên kết:</span>
                          <span className="font-semibold text-stone-800">Đã gắn trên cây</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen('tree');
                          setSelectedTreeMemberId('giap');
                        }}
                        className="w-full py-2 rounded-xl text-xs font-bold text-center bg-[#F4F1E8] hover:bg-[#EAE5D9] text-stone-800 block transition-colors shadow-2xs"
                      >
                        Xem Nhánh Gia Đình Của Bạn →
                      </button>
                    </div>

                    {/* 4 & 5. Khối Cội Nguồn & Quy Mô trên Mobile (Chỉ hiện khi bật Extended) */}
                    {homeLayoutMode === 'extended' && (
                      <div className="mt-4 space-y-3">
                        <div className="p-4 rounded-xl bg-amber-50/50 border border-dashed border-amber-300 shadow-xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                            <h4 className="text-[11px] font-serif uppercase tracking-wider font-bold text-stone-700">
                              Cội Nguồn & Các Ngành
                            </h4>
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                              Đề Xuất
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                              <p className="text-[9px] font-bold uppercase text-[#0F382C]">Cụ Tổ Khởi Thủy</p>
                              <h5 className="font-serif font-bold text-stone-900 text-xs">Phạm Văn Chiến</h5>
                              <p className="text-[10px] text-stone-500">Thế hệ thứ 1 • Cụ Tổ</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                                <p className="text-[9px] font-bold uppercase text-[#0F382C]">Đại Chi Thứ Nhất</p>
                                <h5 className="font-serif font-bold text-stone-900 text-xs">Ngành 1 (Trưởng)</h5>
                                <p className="text-[10px] text-stone-500">Chi 1 & Chi 2</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                                <p className="text-[9px] font-bold uppercase text-[#0F382C]">Đại Chi Thứ Hai</p>
                                <h5 className="font-serif font-bold text-stone-900 text-xs">Ngành 2 (Thứ)</h5>
                                <p className="text-[10px] text-stone-500">Chi 1</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50/50 border border-dashed border-amber-300 shadow-xs space-y-2.5">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                            <h4 className="text-[11px] font-serif uppercase tracking-wider font-bold text-stone-700">
                              Quy Mô Gia Tộc
                            </h4>
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                              Đề Xuất
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                              <p className="text-lg font-serif font-bold text-stone-900">13</p>
                              <p className="text-[9px] text-stone-400 uppercase font-semibold">Thế Hệ</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                              <p className="text-lg font-serif font-bold text-stone-900">52</p>
                              <p className="text-[9px] text-stone-400 uppercase font-semibold">Nhân Khẩu</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                              <p className="text-lg font-serif font-bold text-stone-900">2</p>
                              <p className="text-[9px] text-stone-400 uppercase font-semibold">Ngành</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                              <p className="text-lg font-serif font-bold text-stone-900">5</p>
                              <p className="text-[9px] text-stone-400 uppercase font-semibold">Tài Khoản</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Mobile Bottom Nav Bar */}
                  <div className="pt-2 border-t border-[#EAE5D9] grid grid-cols-5 text-center text-[10px] text-stone-500 mt-4">
                    <button type="button" onClick={() => setActiveScreen('home')} className="flex flex-col items-center py-1 text-[#0F382C] font-bold">
                      <LayoutDashboard className="w-4 h-4 mb-0.5" />
                      <span>Trang Chủ</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('tree')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <FamilyTreeIcon className="w-4 h-4 mb-0.5" />
                      <span>Cây Phả</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('anniversaries')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <Calendar className="w-4 h-4 mb-0.5" />
                      <span>Lịch Giỗ</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('kinship')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <Users className="w-4 h-4 mb-0.5" />
                      <span>Xưng Hô</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('admin')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <Shield className="w-4 h-4 mb-0.5" />
                      <span>Quản Trị</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 2: LỊCH GIỖ TOÀN TỘC (/anniversaries) */}
        {/* ============================================================ */}
        {activeScreen === 'anniversaries' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Trang Lịch Giỗ Chuẩn */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE5D9] gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                  Lịch Giỗ Dòng Họ
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Theo dõi các ngày húy kỵ của tiền nhân theo Âm lịch truyền thống
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowYearGridModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#F4F1E8] border border-[#DCD5C6] text-stone-800 transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-center"
              >
                <Eye className="w-3.5 h-3.5 text-[#0F382C]" />
                <span>Xem Lưới Tháng Cả Năm</span>
              </button>
            </div>

            {deviceMode === 'desktop' ? (
              <div className="max-w-3xl mx-auto pt-2">
                <AnniversaryBlocTimeline groups={MOCK_GROUPS} />
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-[375px] min-h-[640px] max-h-[840px] bg-[#FAF8F2] rounded-[44px] border-[9px] border-stone-800 shadow-2xl p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
                  <div>
                    {/* Notch tai thỏ */}
                    <div className="w-24 h-4 bg-stone-800 rounded-md mx-auto mb-2 shrink-0" />

                    {/* Header di động */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#EAE5D9]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#0F382C] text-[#E8D49E] flex items-center justify-center font-serif font-black text-xs shadow-xs">
                          范
                        </div>
                        <span className="font-extrabold text-xs text-stone-900 tracking-tight">LỊCH GIỖ DÒNG HỌ</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#0F382C] text-[#E8D49E] text-[10px] font-bold flex items-center justify-center shadow-2xs">
                        GP
                      </div>
                    </div>

                    <div className="pt-3">
                      <AnniversaryBlocTimeline groups={MOCK_GROUPS} />
                    </div>
                  </div>

                  {/* Mobile Bottom Nav */}
                  <div className="pt-2 border-t border-[#EAE5D9] grid grid-cols-5 text-center text-[10px] text-stone-500 mt-4">
                    <button type="button" onClick={() => setActiveScreen('home')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <LayoutDashboard className="w-4 h-4 mb-0.5" />
                      <span>Trang Chủ</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('tree')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <FamilyTreeIcon className="w-4 h-4 mb-0.5" />
                      <span>Cây Phả</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('anniversaries')} className="flex flex-col items-center py-1 text-[#0F382C] font-bold">
                      <Calendar className="w-4 h-4 mb-0.5" />
                      <span>Lịch Giỗ</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('kinship')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <Users className="w-4 h-4 mb-0.5" />
                      <span>Xưng Hô</span>
                    </button>
                    <button type="button" onClick={() => setActiveScreen('admin')} className="flex flex-col items-center py-1 hover:text-stone-900">
                      <Shield className="w-4 h-4 mb-0.5" />
                      <span>Quản Trị</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 3: CÂY GIA PHẢ THỰC THỤ & HỆ THỐNG NHẬN DIỆN TRỰC QUAN */}
        {/* ============================================================ */}
        {activeScreen === 'tree' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Màn Hình 3 */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#EAE5D9] gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif uppercase tracking-widest text-[#0F382C] font-bold">
                    Màn Hình 3: Cây Gia Phả Tương Tác
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    Bố Cục 3 Thế Hệ Thật
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
                  Đồ Thị Gia Phả Hoàn Chỉnh & Quy Chuẩn Nhận Diện Trực Quan
                </h2>
                <p className="text-xs text-stone-500 mt-0.5 max-w-3xl">
                  Hiển thị đầy đủ liên kết hôn phối nằm ngang (Nam tả - Nữ hữu), đường trục hạ nhánh vuông góc 90° (Family Bus), hỗ trợ chuyển đổi linh hoạt 3 hệ màu di sản (Chàm cổ & Sen trầm, Thổ mộc & Đất nung, Thủy mặc tối giản) thay thế cho màu lam/hồng mặc định.
                </p>
              </div>

              {/* Bộ Điều Khiển Chế Độ Xem: Thường Nhật (Mặc định) vs Tiêu Điểm Giỗ (Phụ) */}
              <div className="flex items-center gap-2 bg-[#EFECE4] p-1.5 rounded-xl border border-[#DDD8CD] self-start lg:self-center shrink-0">
                <span className="text-[11px] font-bold text-stone-600 px-2">Chế độ xem:</span>
                <button
                  type="button"
                  onClick={() => {
                    setTreeViewMode('normal');
                    setActiveAnnivFocus('none');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all font-bold ${treeViewMode === 'normal'
                    ? 'bg-white text-[#0F382C] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  Thường Nhật (Mặc định)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTreeViewMode('anniversary');
                    if (activeAnnivFocus === 'none') setActiveAnnivFocus('chien');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all font-bold flex items-center gap-1.5 ${treeViewMode === 'anniversary'
                    ? 'bg-[#0F382C] text-[#F3E5C8] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tiêu Điểm Lễ Giỗ</span>
                </button>
              </div>
            </div>

            {/* BẢNG CHÚ GIẢI TRỰC QUAN & BỘ CHỌN HỆ MÀU TRỰC TIẾP */}
            <div className="rounded-xl bg-white border border-[#EAE5D9] p-4 shadow-2xs space-y-3">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-3 border-b border-[#F0EBE1] gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-[#0F382C] uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#0F382C]" />
                    <span>Bảng Quy Chuẩn Nhận Diện Trực Quan Trên Cây Gia Phả</span>
                  </span>
                  <span className="text-stone-400 text-[11px] hidden sm:inline">(200 × 96px)</span>
                </div>

                {/* BỘ CHỌN HỆ MÀU TRỰC TIẾP TRÊN MÀN HÌNH (LIVE PALETTE SWITCHER) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF8F2] border border-[#DDD6C7] text-xs self-start xl:self-auto overflow-x-auto max-w-full">
                  <span className="text-stone-500 font-semibold px-1.5 whitespace-nowrap text-[11px]">Hệ màu:</span>
                  <button
                    type="button"
                    onClick={() => setTreePalette('bright_crisp')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${treePalette === 'bright_crisp'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>PA 1: Sáng & Trong Trẻo (Tươi Mới - Khuyên Dùng)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreePalette('indigo_plum')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${treePalette === 'indigo_plum'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#234E70]" />
                    <span className="w-2 h-2 rounded-full bg-[#8C4A5A]" />
                    <span>PA 2: Chàm Cổ & Sen Trầm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreePalette('earth_wood')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${treePalette === 'earth_wood'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#1E4E45]" />
                    <span className="w-2 h-2 rounded-full bg-[#A0522D]" />
                    <span>PA 3: Thổ Mộc & Đất Nung</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreePalette('ink_wash')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${treePalette === 'ink_wash'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-stone-700" />
                    <span className="w-2 h-2 rounded-full bg-stone-400" />
                    <span>PA 4: Thủy Mặc Tối Giản</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreePalette('legacy_neon')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${treePalette === 'legacy_neon'
                      ? 'bg-stone-800 text-white shadow-2xs'
                      : 'text-stone-400 hover:text-stone-700 hover:bg-stone-200/50'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    <span>Bản Cũ (Neon)</span>
                  </button>
                </div>
              </div>

              {/* 7 MỤC CHÚ GIẢI THÍCH ỨNG THEO HỆ MÀU ĐANG CHỌN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                {/* 1. Nam giới */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9]">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border-2 shrink-0 ${treePalette === 'bright_crisp'
                      ? 'border-sky-500 bg-sky-50'
                      : treePalette === 'indigo_plum'
                        ? 'border-[#234E70] bg-[#E8EFF5]'
                        : treePalette === 'earth_wood'
                          ? 'border-[#1E4E45] bg-[#E8F0ED]'
                          : treePalette === 'ink_wash'
                            ? 'border-stone-700 bg-stone-200'
                            : 'border-blue-500 bg-blue-100'
                      }`}
                  />
                  <div>
                    <p className="font-bold text-stone-900">Nam giới</p>
                    <p className="text-[10px] text-stone-500">
                      {treePalette === 'bright_crisp'
                        ? 'Thanh thiên · Xanh ngọc'
                        : treePalette === 'indigo_plum'
                          ? 'Chàm Cổ · Mực xanh'
                          : treePalette === 'earth_wood'
                            ? 'Rêu Phong · Mộc'
                            : treePalette === 'ink_wash'
                              ? 'Mực chì than · Nhã'
                              : 'Viền lam · Avatar xanh'}
                    </p>
                  </div>
                </div>

                {/* 2. Nữ giới */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9]">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border-2 shrink-0 ${treePalette === 'bright_crisp'
                      ? 'border-rose-400 bg-rose-50'
                      : treePalette === 'indigo_plum'
                        ? 'border-[#8C4A5A] bg-[#F8EFF1]'
                        : treePalette === 'earth_wood'
                          ? 'border-[#A0522D] bg-[#FAF0E6]'
                          : treePalette === 'ink_wash'
                            ? 'border-stone-400 bg-stone-100'
                            : 'border-pink-500 bg-pink-100'
                      }`}
                  />
                  <div>
                    <p className="font-bold text-stone-900">Nữ giới</p>
                    <p className="text-[10px] text-stone-500">
                      {treePalette === 'bright_crisp'
                        ? 'Hồng phấn · Dịu sáng'
                        : treePalette === 'indigo_plum'
                          ? 'Cánh Sen Trầm · Tía'
                          : treePalette === 'earth_wood'
                            ? 'Đất Nung · Nắng ấm'
                            : treePalette === 'ink_wash'
                              ? 'Mực tro trầm · Đoan'
                              : 'Viền hồng · Avatar hồng'}
                    </p>
                  </div>
                </div>

                {/* 3. Còn sống */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9]">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500" />
                  <div>
                    <p className="font-bold text-stone-900">Còn sống</p>
                    <p className="text-[10px] text-stone-500">Năm sinh & tuổi</p>
                  </div>
                </div>

                {/* 4. Đã mất */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9]">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-400" />
                  <div>
                    <p className="font-bold text-stone-900">Đã mất</p>
                    <p className="text-[10px] text-stone-500">Sinh - Mất & thọ</p>
                  </div>
                </div>

                {/* 5. Ghost Node Nội Tộc */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9]">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border border-dashed shrink-0 flex items-center justify-center ${treePalette === 'bright_crisp'
                      ? 'border-amber-500 bg-amber-50'
                      : treePalette === 'indigo_plum'
                        ? 'border-[#B8860B] bg-[#FEF9EE]'
                        : treePalette === 'earth_wood'
                          ? 'border-[#C68B59] bg-[#FDF8F3]'
                          : treePalette === 'ink_wash'
                            ? 'border-stone-400 bg-stone-100'
                            : 'border-amber-500 bg-amber-50'
                      }`}
                  >
                    <Link2 className="w-2.5 h-2.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Ghost Node</p>
                    <p className="text-[10px] text-stone-500">Nội tộc liên kết</p>
                  </div>
                </div>

                {/* 6. Hôn phối */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9]">
                  <div className={`w-6 h-0.5 shrink-0 ${busLineBg}`} />
                  <div>
                    <p className="font-bold text-stone-900">Hôn phối</p>
                    <p className="text-[10px] text-stone-500">Đường nối ngang</p>
                  </div>
                </div>

                {/* 7. Family Bus */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9]">
                  <div className={`w-6 h-3 border-l-2 border-b-2 shrink-0 ${busLineBg}`} />
                  <div>
                    <p className="font-bold text-stone-900">Family Bus</p>
                    <p className="text-[10px] text-stone-500">Thước thợ 90°</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector ngày giỗ (Khi bật chế độ Tiêu Điểm Lễ Giỗ) */}
            {treeViewMode === 'anniversary' && (
              <div className="p-3.5 rounded-xl bg-[#FEF6E9] border border-[#E8CE9D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-[#8C5D17] font-bold">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Đang kích hoạt Tiêu Điểm Lễ Giỗ: Chọn ngày giỗ để xem hiệu ứng hào quang & làm mờ</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAnnivFocus('chien');
                      setSelectedTreeMemberId('chien');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${activeAnnivFocus === 'chien'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-xs'
                      : 'bg-white text-stone-800 hover:bg-[#FAF8F2]'
                      }`}
                  >
                    Giỗ Cụ Tổ Chiến (03/7 Âm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAnnivFocus('mo');
                      setSelectedTreeMemberId('mo');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${activeAnnivFocus === 'mo'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-xs'
                      : 'bg-white text-stone-800 hover:bg-[#FAF8F2]'
                      }`}
                  >
                    Giỗ Cụ Bà Mơ (11/5 Âm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAnnivFocus('dong');
                      setSelectedTreeMemberId('dong');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${activeAnnivFocus === 'dong'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-xs'
                      : 'bg-white text-stone-800 hover:bg-[#FAF8F2]'
                      }`}
                  >
                    Giỗ Cụ Đồng (19/5 Âm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAnnivFocus('lieu');
                      setSelectedTreeMemberId('lieu');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${activeAnnivFocus === 'lieu'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-xs'
                      : 'bg-white text-stone-800 hover:bg-[#FAF8F2]'
                      }`}
                  >
                    Giỗ Cụ Bà Liễu (24/7 Âm)
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* CANVAS CÂY GIA PHẢ CHÍNH (CÓ ĐƯỜNG BUS & THẺ NODE 200x96px) */}
            {/* ============================================================ */}
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* CANVAS BÊN TRÁI: ĐỒ THỊ HUYẾT THỐNG HỌ PHẠM */}
              <div className="flex-1 w-full bg-white rounded-2xl border border-[#EAE5D9] p-4 sm:p-6 shadow-xs overflow-hidden flex flex-col">
                {/* Toolbar Canvas */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EBE1] text-xs">
                  <div className="flex items-center gap-2 font-serif font-bold text-stone-800">
                    <FamilyTreeIcon className="w-4 h-4 text-[#0F382C]" />
                    <span>Phả Đồ Trực Quan • Gia Phả Họ Phạm (Dữ Liệu Thật 100%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-stone-400 mr-2">Click vào thẻ để xem ngăn kéo chi tiết</span>
                    <button className="p-1.5 rounded-lg bg-[#FAF8F2] border border-[#DDD6C7] text-stone-600 hover:text-stone-900" title="Phóng to">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-[#FAF8F2] border border-[#DDD6C7] text-stone-600 hover:text-stone-900" title="Thu nhỏ">
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTreeMemberId('giap')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0F382C] text-[#E8D49E] text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-[#154B3B]"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>Tìm Tôi</span>
                    </button>
                  </div>
                </div>

                {/* VÙNG CHỨA ĐỒ THỊ CÂY CÓ CUỘN NGANG (HORIZONTAL SCROLL CANVAS) */}
                <div className="overflow-x-auto pb-6 pt-2 bg-[#FAF8F2] rounded-xl border border-[#EAE5D9]/70 relative">
                  {/* Lưới chấm vi điểm nền đồ thị */}
                  <div
                    className="min-w-[1020px] p-6 relative"
                    style={{
                      backgroundImage: 'radial-gradient(#DDD8CD 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  >
                    {/* -------------------------------------------------------- */}
                    {/* THẾ HỆ I: Cụ Tổ (ĐỜI 1) */}
                    {/* -------------------------------------------------------- */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-[#0F382C] font-bold mb-2">
                        Thế Hệ I • Đời 1 (Cụ Tổ Khởi Thủy)
                      </span>

                      {/* Cụm Hôn Phối Đa Thê Của Cụ Tổ: Bà Cả + Cụ Chiến + Bà Hai */}
                      <div className="flex items-center relative">
                        {/* Thẻ Cụ Bà Cả Mơ */}
                        {renderTreeNode('mo')}

                        {/* Cầu hôn phối 1 */}
                        <div className={`w-7 h-1 ${busLineBg} relative flex items-center justify-center`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${spouseDotBg} border-2 border-white shadow-2xs`} />
                        </div>

                        {/* Thẻ Cụ Tổ Chiến */}
                        {renderTreeNode('chien')}

                        {/* Cầu hôn phối 2 (Bà hai) */}
                        <div className={`w-7 h-1 ${busLineBg} relative flex items-center justify-center`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${spouseDotBg} border-2 border-white shadow-2xs`} />
                        </div>

                        {/* Thẻ Cụ Bà Hai Liễu */}
                        {renderTreeNode('lieu')}
                      </div>

                      {/* Family Bus hạ từ Cụ Đồng (Con Cụ Chiến & Cụ Mơ) */}
                      <div className={`w-0.5 h-8 ${busLineBg}`} />
                      <div className={`w-[480px] h-0.5 ${busLineBg} relative`}>
                        <div className={`absolute left-1/2 -translate-x-1/2 top-0 w-0.5 h-8 ${busLineBg}`} />
                      </div>
                      <div className="h-8" />
                    </div>

                    {/* -------------------------------------------------------- */}
                    {/* THẾ HỆ II: TRƯỞNG NGÀNH 1 (ĐỜI 2) */}
                    {/* -------------------------------------------------------- */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500 font-bold mb-2">
                        Thế Hệ II • Đời 2 (Khởi Lập Ngành 1)
                      </span>

                      <div className="flex items-center">
                        {renderTreeNode('dong')}
                        <div className={`w-8 h-1 ${busLineBg} relative flex items-center justify-center`}>
                          <span className={`w-2 h-2 rounded-full ${spouseDotBg} border border-white`} />
                        </div>
                        {renderTreeNode('thin')}
                      </div>

                      {/* Family Bus hạ xuống Đời 3 */}
                      <div className={`w-0.5 h-8 ${busLineBg}`} />
                      <div className="h-4" />
                    </div>

                    {/* -------------------------------------------------------- */}
                    {/* THẾ HỆ III & IV: TRUNG TÔNG NGÀNH 1 (ĐỜI 3 & 4) */}
                    {/* -------------------------------------------------------- */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500 font-bold mb-2">
                        Thế Hệ III & IV • Đời 3 & 4 (Trung Tông Ngành 1)
                      </span>

                      <div className="flex items-center gap-8">
                        {/* Cụ Chức & Cụ Dinh (Đời 3) */}
                        <div className="flex items-center">
                          {renderTreeNode('chuc')}
                          <div className={`w-6 h-0.5 ${busLineBg}`} />
                          {renderTreeNode('dinh')}
                        </div>

                        {/* Mũi tên tiếp nối xuống Đời 4 */}
                        <div className="flex items-center text-stone-400 font-bold text-xs">
                          <ArrowRight className="w-4 h-4 text-[#0F382C]" />
                        </div>

                        {/* Cụ Tường & Cụ Hiến (Đời 4) */}
                        <div className="flex items-center">
                          {renderTreeNode('tuong')}
                          <div className={`w-6 h-0.5 ${busLineBg}`} />
                          {renderTreeNode('hien')}
                        </div>
                      </div>

                      {/* Family Bus từ Cụ Tường rẽ 2 nhánh Đời 5 */}
                      <div className={`w-0.5 h-8 ${busLineBg}`} />
                      <div className={`w-[420px] h-0.5 ${busLineBg} relative`}>
                        <div className={`absolute left-0 top-0 w-0.5 h-8 ${busLineBg}`} />
                        <div className={`absolute right-0 top-0 w-0.5 h-8 ${busLineBg}`} />
                      </div>
                      <div className="h-8" />
                    </div>

                    {/* -------------------------------------------------------- */}
                    {/* THẾ HỆ V: PHÂN CHI ĐỜI 5 (TRƯỞNG & THỨ) */}
                    {/* -------------------------------------------------------- */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-serif uppercase tracking-widest text-stone-400 font-bold mb-3 px-12">
                        <span>Nhánh 1: Cụ Phạm Khắc Đoàn (Trưởng Nam Đời 5)</span>
                        <span>Nhánh 2: Cụ Phạm Kim Đức (Thứ Nam Đời 5)</span>
                      </div>

                      <div className="flex items-start justify-between gap-12 px-6">
                        {/* Nhánh 1 (Trưởng nam): Cụ Đoàn + Cụ Nhân */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center">
                            {renderTreeNode('doan')}
                            <div className={`w-5 h-0.5 ${busLineBg}`} />
                            {renderTreeNode('nhan')}
                          </div>
                          {/* Đường hạ xuống đời 12 */}
                          <div className={`w-0.5 h-8 ${busLineBg}`} />
                          <div className="text-[10px] text-stone-400 font-serif italic py-1">
                            (Truyền thừa các thế hệ 6 → 11)
                          </div>
                          <div className={`w-0.5 h-8 ${busLineBg}`} />
                        </div>

                        {/* Nhánh 2 (Thứ nam): Cụ Đức */}
                        <div className="flex items-center">
                          {renderTreeNode('duc')}
                        </div>
                      </div>
                    </div>

                    {/* -------------------------------------------------------- */}
                    {/* THẾ HỆ XII: HẬU DUỆ ĐÍCH TÔN (ĐỜI 12 - CHÍNH BẠN) */}
                    {/* -------------------------------------------------------- */}
                    <div className="flex flex-col items-center mt-2">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-stone-400 font-bold mb-2">
                        Thế Hệ XII • Đời 12 (Hậu Duệ Đích Tôn Đương Đại)
                      </span>

                      <div className="flex items-center gap-10">
                        {renderTreeNode('giap')}
                        {renderTreeNode('huong')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NGĂN KÉO CHI TIẾT BÊN PHẢI (DRAWER PREVIEW 320PX) */}
              <div className="w-full lg:w-[320px] rounded-2xl bg-white border border-[#EAE5D9] p-5 shadow-sm space-y-4 shrink-0">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0F382C]" />
                    <h4 className="font-sans font-bold text-sm text-stone-900">
                      Hồ Sơ Thành Viên (Drawer)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase">
                    Chi tiết
                  </span>
                </div>

                {/* Nội dung hồ sơ người được chọn */}
                <div className="space-y-4 text-xs">
                  {/* Header danh tính */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-sans font-black text-sm shrink-0 border ${selectedMemberData.isGhost
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : selectedMemberData.gender === 'male'
                          ? currentTokens.male.avatar
                          : currentTokens.female.avatar
                        }`}
                    >
                      {selectedMemberData.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-sans font-bold text-base text-stone-900 leading-snug">
                        {selectedMemberData.fullName}
                      </h4>
                      {selectedMemberData.aliasName && (
                        <p className="text-stone-500 text-[11px] italic">
                          {selectedMemberData.aliasName}
                        </p>
                      )}
                      <p className="text-[#0F382C] font-semibold text-[11px] mt-0.5">
                        {selectedMemberData.branchPath}
                      </p>
                    </div>
                  </div>

                  {/* Huy hiệu trạng thái */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${selectedMemberData.gender === 'male'
                        ? currentTokens.male.badge
                        : currentTokens.female.badge
                        }`}
                    >
                      {selectedMemberData.gender === 'male' ? 'Nam giới' : 'Nữ giới'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${selectedMemberData.lifeStatus === 'living'
                        ? currentTokens.living.badge
                        : currentTokens.deceased.badge
                        }`}
                    >
                      {selectedMemberData.lifeStatus === 'living' ? 'Còn sống' : 'Đã mất'}
                    </span>
                    {selectedMemberData.isSenior && (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-300">
                        Con Trưởng / Đích Tôn
                      </span>
                    )}
                    {selectedMemberData.isGhost && (
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Link2 className="w-2.5 h-2.5" /> Hôn phối nội tộc
                      </span>
                    )}
                  </div>

                  {/* Thông tin sinh tử & Lịch giỗ */}
                  <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Năm sinh:</span>
                      <span className="font-bold text-stone-800">
                        {selectedMemberData.birthYear || 'Chưa rõ'}
                      </span>
                    </div>
                    {selectedMemberData.lifeStatus === 'deceased' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Năm mất:</span>
                          <span className="font-bold text-stone-800">
                            {selectedMemberData.deathYear} (Thọ{' '}
                            {selectedMemberData.birthYear && selectedMemberData.deathYear
                              ? selectedMemberData.deathYear - selectedMemberData.birthYear
                              : '...'}
                            t)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Ngày giỗ Âm lịch:</span>
                          <span className="font-bold text-red-600">
                            {selectedMemberData.deathLunar || 'Chưa rõ'}
                          </span>
                        </div>
                      </>
                    )}
                    {selectedMemberData.burialLocation && (
                      <div className="pt-1 border-t border-[#EAE5D9] space-y-0.5">
                        <span className="text-stone-500 flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-[#0F382C]" /> Nơi an táng:
                        </span>
                        <p className="text-stone-800 text-[11px] leading-tight">
                          {selectedMemberData.burialLocation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quan hệ gia tộc */}
                  <div className="space-y-1.5 pt-1">
                    <h5 className="font-serif font-bold text-stone-800 text-xs">
                      Quan Hệ Trực Hệ:
                    </h5>
                    <div className="space-y-1 text-[11px] text-stone-600">
                      {selectedMemberData.fatherName && (
                        <p>
                          • Thân phụ: <strong className="text-stone-900">{selectedMemberData.fatherName}</strong>
                        </p>
                      )}
                      {selectedMemberData.motherName && (
                        <p>
                          • Thân mẫu: <strong className="text-stone-900">{selectedMemberData.motherName}</strong>
                        </p>
                      )}
                      {selectedMemberData.spouseName && (
                        <p>
                          • Hôn phối: <strong className="text-stone-900">{selectedMemberData.spouseName}</strong>
                        </p>
                      )}
                      {selectedMemberData.childrenNames && (
                        <div>
                          <p>• Hậu duệ con cái:</p>
                          <ul className="pl-3 space-y-0.5 text-stone-700">
                            {selectedMemberData.childrenNames.map((child, i) => (
                              <li key={i}>– {child}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nút hành động quản trị */}
                  <div className="pt-2 border-t border-[#F0EBE1] space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalFormMode('edit');
                        setFormFullName(selectedMemberData.fullName);
                        setFormAlias(selectedMemberData.aliasName || '');
                        setFormGender(selectedMemberData.gender);
                        setFormLifeStatus(selectedMemberData.lifeStatus);
                        setFormBirthYear(selectedMemberData.birthYear ? String(selectedMemberData.birthYear) : '');
                        setIsLiveModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl text-xs font-bold text-center bg-[#0F382C] text-[#F3E5C8] hover:bg-[#154B3B] transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa Hồ Sơ Thành Viên</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalFormMode('create');
                        setFormFullName('');
                        setFormAlias('');
                        setFormGender('male');
                        setFormLifeStatus('living');
                        setFormFatherId(selectedMemberData.id);
                        setIsLiveModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl text-xs font-bold text-center bg-[#FAF8F2] hover:bg-[#F4F1E8] border border-[#DDD6C7] text-stone-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0F382C]" />
                      <span>Thêm Con Mới Cho Cụ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 4: TRA CỨU VAI VẾ & QUAN HỆ TÔN TI (/kinship) */}
        {/* ============================================================ */}
        {activeScreen === 'kinship' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE5D9] gap-4">
              <div>
                <span className="text-xs font-serif uppercase tracking-widest text-[#0F382C] font-bold">
                  Màn Hình 4: Tra Cứu Vai Vế & Quan Hệ Tôn Ti
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  Công Cụ Xác Định Vai Vế & Xưng Hô Huyết Thống Chuẩn Mực
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Dựa trên thuật toán tìm Tổ Tiên Chung Gần Nhất (LCA) kết hợp bộ từ điển xưng hô dòng tộc Việt Nam.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Lõi LCA Toán Học
                </span>
              </div>
            </div>

            {/* BỘ CHỌN 2 NGƯỜI TƯƠNG TÁC */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Người A (Mặc định: Bạn - Giáp Phạm) */}
              <div className="md:col-span-5 rounded-2xl bg-white border border-[#EAE5D9] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F382C]">
                    Chủ thể Tra Cứu (Người A)
                  </span>
                  <span className="text-[10px] text-stone-400">Chính bạn</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/60 border border-sky-200">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-serif font-bold text-sm shrink-0 border border-sky-300">
                    PG
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif font-bold text-stone-900 text-sm">Phạm Tiến Giáp</h4>
                    <p className="text-xs text-sky-800 font-semibold">Đời 12 • Ngành 1 • Đích Tôn</p>
                    <p className="text-[11px] text-stone-500">Kỹ sư giải pháp • Quản trị viên</p>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 italic">
                  Đang neo cố định hồ sơ của bạn để tra cứu vai vế xưng hô đối với các tiền nhân và đồng tộc trong họ.
                </p>
              </div>

              {/* Nút Hoán vị & So sánh */}
              <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
                <div className="w-10 h-10 rounded-full bg-[#FAF8F2] border border-[#DDD6C7] flex items-center justify-center text-[#0F382C] shadow-2xs">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-stone-400 uppercase mt-1">So vai vế</span>
              </div>

              {/* Người B (Đối tượng tra cứu) */}
              <div className="md:col-span-5 rounded-2xl bg-white border border-[#EAE5D9] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F382C]">
                    Đối tượng đối chiếu (Người B)
                  </span>
                  <span className="text-[10px] text-stone-400">Chọn trong họ</span>
                </div>

                <div className="space-y-2">
                  <select
                    value={kinshipPersonB}
                    onChange={(e) => setKinshipPersonB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD6C7] text-xs bg-[#FAF8F2] font-semibold text-stone-900 focus:outline-none"
                  >
                    <option value="chien">Cụ Tổ Phạm Văn Chiến (Đời 1 · Cụ Tổ)</option>
                    <option value="mo">Cụ Bà Cả Hoàng Thị Mơ (Đời 1 · Tổ Mẫu)</option>
                    <option value="dong">Cụ Phạm Văn Đồng (Đời 2 · Trưởng Ngành 1)</option>
                    <option value="chuc">Cụ Phạm Kim Chức (Đời 3 · Ngành 1)</option>
                    <option value="tuong">Cụ Phạm Khắc Tường (Đời 4 · Ngành 1)</option>
                    <option value="doan">Cụ Phạm Khắc Đoàn (Đời 5 · Trưởng Nam)</option>
                    <option value="duc">Cụ Phạm Kim Đức (Đời 5 · Thứ Nam)</option>
                    <option value="huong">Phạm Thị Hương (Đời 12 · Em gái bạn)</option>
                  </select>

                  {TREE_MEMBERS[kinshipPersonB] && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-serif font-bold text-sm shrink-0 border border-amber-300">
                        {TREE_MEMBERS[kinshipPersonB].initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-stone-900 text-sm">
                          {TREE_MEMBERS[kinshipPersonB].fullName}
                        </h4>
                        <p className="text-xs text-amber-900 font-semibold">
                          {TREE_MEMBERS[kinshipPersonB].branchPath}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {TREE_MEMBERS[kinshipPersonB].lifeStatus === 'deceased'
                            ? `Ngày giỗ: ${TREE_MEMBERS[kinshipPersonB].deathLunar || 'Âm lịch'}`
                            : 'Hiện đang còn sống'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KẾT QUẢ TÍNH TOÁN XƯNG HÔ CHÍNH XÁC */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-[#FCFAF5] to-[#F7F3EA] border border-[#EAE5D9] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE5D9] gap-2">
                <div>
                  <span className="text-[10px] font-serif uppercase tracking-widest text-[#0F382C] font-bold">
                    Kết Quả Phân Tích Thân Tộc
                  </span>
                  <h3 className="font-serif font-bold text-xl text-stone-900">
                    Mối Quan Hệ Giữa Giáp Phạm & {TREE_MEMBERS[kinshipPersonB]?.fullName}
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-lg bg-[#0F382C] text-[#F3E5C8] font-bold self-start sm:self-center">
                  Quan Hệ Trực Hệ Tông Tộc
                </span>
              </div>

              {/* 2 Thẻ Xưng Hô Chiều Đi - Chiều Về */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-white border border-[#EAE5D9] shadow-2xs space-y-2">
                  <p className="text-xs text-stone-500 font-semibold">Giáp Phạm xưng hô với người B là:</p>
                  <p className="text-2xl font-serif font-black text-[#0F382C]">
                    {kinshipPersonB === 'chien'
                      ? 'Cụ Tổ Khởi Thủy'
                      : kinshipPersonB === 'mo'
                        ? 'Cụ Bà Cả Tổ Mẫu'
                        : kinshipPersonB === 'dong'
                          ? 'Cụ Cố Cao Tổ'
                          : kinshipPersonB === 'chuc'
                            ? 'Cụ Cố Tằng Tổ'
                            : kinshipPersonB === 'tuong'
                              ? 'Cụ Cố'
                              : kinshipPersonB === 'doan'
                                ? 'Ông Cố Trưởng'
                                : kinshipPersonB === 'duc'
                                  ? 'Ông Cố Thứ'
                                  : kinshipPersonB === 'huong'
                                    ? 'Em gái ruột'
                                    : 'Người trong họ'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Cách xưng kính cẩn trang nghiêm theo gia lễ truyền thống Đại tộc họ Phạm.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-white border border-[#EAE5D9] shadow-2xs space-y-2">
                  <p className="text-xs text-stone-500 font-semibold">Người B gọi Giáp Phạm là:</p>
                  <p className="text-2xl font-serif font-black text-[#8C5D17]">
                    {kinshipPersonB === 'chien'
                      ? 'Hậu duệ Đích Tôn Đời 12'
                      : kinshipPersonB === 'mo'
                        ? 'Hậu duệ Đích Tôn Đời 12'
                        : kinshipPersonB === 'dong'
                          ? 'Huyền Tôn (Cháu đời 12)'
                          : kinshipPersonB === 'chuc'
                            ? 'Tằng Tôn Đích Tử'
                            : kinshipPersonB === 'tuong'
                              ? 'Chắt Đích Tôn'
                              : kinshipPersonB === 'doan'
                                ? 'Cháu Đích Tôn'
                                : kinshipPersonB === 'duc'
                                  ? 'Cháu Họ Đích Tôn'
                                  : kinshipPersonB === 'huong'
                                    ? 'Anh trai ruột'
                                    : 'Cháu trong tộc'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Thừa nhận vị trí Trưởng nam kế thế, kế thừa hương hỏa tổ tiên.
                  </p>
                </div>
              </div>

              {/* Sơ đồ Nấc thang Huyết thống (Lineage Stepper) */}
              <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-3">
                <div className="flex items-center justify-between text-xs font-serif font-bold text-stone-700">
                  <span>Đường Dẫn Huyết Thống Nối Tới Tổ Tiên Chung (LCA):</span>
                  <span className="text-[#0F382C]">
                    LCA: {kinshipPersonB === 'huong' ? 'Thân phụ đời 11' : 'Cụ Tổ Phạm Văn Chiến'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                  <span className="px-3 py-1.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-300">
                    Phạm Tiến Giáp (Đời 12)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-[#DDD6C7] text-stone-700">
                    Hậu duệ chi Cụ Đoàn (Đời 5)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-[#DDD6C7] text-stone-700">
                    Cụ Phạm Khắc Tường (Đời 4)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-[#DDD6C7] text-stone-700">
                    Cụ Phạm Kim Chức (Đời 3)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-[#DDD6C7] text-stone-700">
                    Cụ Phạm Văn Đồng (Đời 2)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                    Cụ Tổ Phạm Văn Chiến (Đời 1)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 5: BÀN QUẢN TRỊ DÒNG HỌ & KIỂM DUYỆT (/admin) */}
        {/* ============================================================ */}
        {activeScreen === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Màn Hình 5 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE5D9] gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans uppercase tracking-widest text-[#0F382C] font-bold">
                    Màn Hình 5: Bàn Quản Trị Dòng Họ
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Admin Shell (11 Menu Độc Lập)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-sans font-black text-stone-900 mt-1">
                  Trung Tâm Bàn Điều Hành & Quản Trị Dòng Họ
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Mô phỏng đầy đủ cấu trúc Sidebar 11 phân hệ chuyên biệt theo đúng kiến trúc thực tế của hệ thống.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalFormMode('create');
                    setFormFullName('');
                    setFormAlias('');
                    setFormGender('male');
                    setFormLifeStatus('living');
                    setIsLiveModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F382C] hover:bg-[#154B3B] text-[#F3E5C8] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Nhân Khẩu Mới</span>
                </button>
              </div>
            </div>

            {/* BỐ CỤC ADMIN SHELL: SIDEBAR BÊN TRÁI + NỘI DUNG MÀN HÌNH CON BÊN PHẢI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* SIDEBAR ĐIỀU HƯỚNG QUẢN TRỊ (4 CỘT) */}
              <div className="lg:col-span-3 rounded-2xl bg-white border border-[#EAE5D9] p-4 shadow-xs space-y-4">
                <div className="pb-3 border-b border-[#F0EBE1]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Danh Mục Quản Trị</p>
                  <h4 className="font-sans font-bold text-stone-900 text-sm mt-0.5">GIA PHẢ PHẠM VĂN</h4>
                </div>

                {/* Nhóm 1: TỔNG QUAN */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">Tổng Quan</p>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('dashboard')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${adminSubTab === 'dashboard'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-[#FAF8F2] hover:text-stone-900'
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Bàn Điều Hành (/admin)</span>
                  </button>
                </div>

                {/* Nhóm 2: GIA PHẢ & QUY ƯỚC */}
                <div className="space-y-1 pt-2 border-t border-[#F5F2EA]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">Gia Phả & Quy Ước</p>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('branches')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${adminSubTab === 'branches'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-[#FAF8F2] hover:text-stone-900'
                      }`}
                  >
                    <FamilyTreeIcon className="w-4 h-4 shrink-0" />
                    <span>Cấu Trúc Ngành/Chi</span>
                  </button>
                </div>

                {/* Nhóm 3: THÀNH VIÊN & TÀI KHOẢN */}
                <div className="space-y-1 pt-2 border-t border-[#F5F2EA]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">Thành Viên & Tài Khoản</p>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('claims')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${adminSubTab === 'claims'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-[#FAF8F2] hover:text-stone-900'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 shrink-0" />
                      <span>Phê Duyệt Hồ Sơ</span>
                    </div>
                    {2 - approvedClaims.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-white">
                        {2 - approvedClaims.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('users')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${adminSubTab === 'users'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-[#FAF8F2] hover:text-stone-900'
                      }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Quản Lý Tài Khoản</span>
                  </button>
                </div>

                {/* Nhóm 4: VẬN HÀNH & HỆ THỐNG */}
                <div className="space-y-1 pt-2 border-t border-[#F5F2EA]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">Vận Hành & Hệ Thống</p>
                  <button
                    type="button"
                    onClick={() => setAdminSubTab('governance')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${adminSubTab === 'governance'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-[#FAF8F2] hover:text-stone-900'
                      }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Bật/Tắt & Phân Quyền</span>
                  </button>
                </div>
              </div>

              {/* KHU VỰC NỘI DUNG CHÍNH (9 CỘT - THAY ĐỔI THEO MENU ĐƯỢC CHỌN) */}
              <div className="lg:col-span-9 space-y-6">
                {/* 1. MÀN HÌNH CON: BÀN ĐIỀU HÀNH (/admin - Chuẩn ClanDashboard.tsx) */}
                {adminSubTab === 'dashboard' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Welcome Banner */}
                    <div className="p-5 rounded-2xl bg-white border border-[#EAE5D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#0F382C]">
                            Bàn Điều Hành
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Hệ Thống Trực Tuyến
                          </span>
                        </div>
                        <h3 className="text-xl font-sans font-black text-stone-900 tracking-tight mt-1">
                          GIA PHẢ PHẠM VĂN
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Tổng quan sức khỏe dữ liệu phả ký, danh sách con cháu và trạng thái vận hành hệ thống.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveScreen('tree')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DDD6C7] bg-[#FAF8F2] text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
                      >
                        <span>Xem Cây Gia Phả</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 4 Thẻ Vitality KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 rounded-xl bg-white border border-[#EAE5D9] shadow-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-stone-400">Tổng Nhân Khẩu</span>
                        <p className="text-2xl font-sans font-black text-stone-900">52</p>
                        <p className="text-[10px] text-emerald-800 font-semibold">31 Nam • 21 Nữ</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-[#EAE5D9] shadow-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-stone-400">Độ Sâu Gia Phả</span>
                        <p className="text-2xl font-sans font-black text-stone-900">13</p>
                        <p className="text-[10px] text-stone-500">13 Thế Hệ Đã Số Hóa</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-[#EAE5D9] shadow-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-stone-400">Tài Khoản Đã Vào</span>
                        <p className="text-2xl font-sans font-black text-stone-900">5</p>
                        <p className="text-[10px] text-blue-700 font-semibold">1 đã gắn • 4 chưa gắn</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white border border-[#EAE5D9] shadow-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase text-stone-400">Trạng Thái Hệ Thống</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-sm font-bold text-stone-900">Đang Hoạt Động</p>
                        </div>
                        <p className="text-[10px] text-stone-400">Cây công khai • Bảo vệ bật</p>
                      </div>
                    </div>

                    {/* Trung Tâm Việc Cần Xử Lý & Rà Soát Dữ Liệu */}
                    <div className="p-5 rounded-2xl bg-white border border-[#EAE5D9] shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EBE1]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Trung Tâm Việc Cần Xử Lý & Rà Soát Dữ Liệu</span>
                        </h4>
                        <span className="text-xs font-semibold text-stone-400">
                          {2 - approvedClaims.length} mục cần chú ý
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Hộp 1: Nối phả hoàn chỉnh */}
                        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-xs font-bold text-emerald-950">
                              Cây gia phả hoàn chỉnh (Không có thành viên trôi dạt thiếu cha mẹ)
                            </h5>
                            <p className="text-[11px] text-emerald-800/80 mt-0.5">
                              Toàn bộ con cháu từ Đời 2 trở đi đều đã được kết nối huyết thống chính xác với tiền nhân.
                            </p>
                          </div>
                        </div>

                        {/* Hộp 2: Cảnh báo tài khoản Google chưa gắn node */}
                        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-bold text-blue-950">
                                Có {2 - approvedClaims.length} tài khoản Google mới gửi yêu cầu nhận node Gia Phả
                              </h5>
                              <p className="text-[11px] text-blue-800/80 mt-0.5">
                                Con cháu đã đăng nhập tài khoản. Trưởng tộc có thể phê duyệt hoặc từ chối yêu cầu liên kết.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAdminSubTab('claims')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-2xs shrink-0"
                          >
                            <span>Xem yêu cầu</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Phím Tắt Tác Vụ & Nhật Ký Biến Động */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white border border-[#EAE5D9] shadow-xs space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Phím Tắt Tác Vụ</p>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <button
                            type="button"
                            onClick={() => setAdminSubTab('branches')}
                            className="p-3 rounded-lg border border-[#DDD6C7] bg-[#FAF8F2] hover:bg-white font-bold text-stone-800"
                          >
                            Ngành & Chi
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminSubTab('users')}
                            className="p-3 rounded-lg border border-[#DDD6C7] bg-[#FAF8F2] hover:bg-white font-bold text-stone-800"
                          >
                            Tài Khoản
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminSubTab('governance')}
                            className="p-3 rounded-lg border border-[#DDD6C7] bg-[#FAF8F2] hover:bg-white font-bold text-stone-800"
                          >
                            Bật/Tắt Cờ
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminSubTab('claims')}
                            className="p-3 rounded-lg border border-[#DDD6C7] bg-[#FAF8F2] hover:bg-white font-bold text-stone-800"
                          >
                            Duyệt Hồ Sơ
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-[#EAE5D9] shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
                          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Nhật Ký Biến Động</p>
                          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">Gần Đây</span>
                        </div>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-stone-800">Cập nhật cấu trúc phân cấp Ngành 1 & Ngành 2</p>
                              <span className="text-[10px] text-stone-400">Vừa xong • Super Admin</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-stone-800">Đồng bộ quy ước xưng hô 32 quan hệ dòng họ</p>
                              <span className="text-[10px] text-stone-400">Hôm nay • Hệ thống</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MÀN HÌNH CON: PHÊ DUYỆT HỒ SƠ CLAIM (/admin/claims) */}
                {adminSubTab === 'claims' && (
                  <div className="p-6 rounded-2xl bg-white border border-[#EAE5D9] shadow-xs space-y-5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                      <div>
                        <h4 className="font-sans font-bold text-stone-900 text-base flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-[#0F382C]" />
                          <span>Phê Duyệt Hồ Sơ Nhận Node Con Cháu (/admin/claims)</span>
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Kiểm duyệt yêu cầu gắn tài khoản Google của con cháu vào đúng vị trí trên cây Gia Phả.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        {2 - approvedClaims.length} Yêu cầu chờ xử lý
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {!approvedClaims.includes('doan') && (
                        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-2.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-stone-900 text-sm">Nguyễn Văn Tuấn</p>
                              <p className="text-xs text-stone-500">Tài khoản Google: tuannv@gmail.com</p>
                            </div>
                            <span className="text-[10px] text-stone-400">10 phút trước</span>
                          </div>
                          <p className="text-xs text-stone-700 bg-white p-2.5 rounded-lg border border-[#EAE5D9]">
                            Yêu cầu gắn vào hồ sơ: <strong className="text-[#0F382C]">Cụ Phạm Khắc Đoàn (Đời 5 · Trưởng Nam)</strong>
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setApprovedClaims((prev) => [...prev, 'doan'])}
                              className="px-4 py-2 rounded-lg bg-[#0F382C] text-[#F3E5C8] text-xs font-bold hover:bg-[#154B3B] transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Phê Duyệt Liên Kết</span>
                            </button>
                            <button
                              type="button"
                              className="px-3.5 py-2 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold hover:bg-stone-200 transition-colors"
                            >
                              Từ Chối
                            </button>
                          </div>
                        </div>
                      )}

                      {!approvedClaims.includes('huong') && (
                        <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-2.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-stone-900 text-sm">Trần Thị Mai</p>
                              <p className="text-xs text-stone-500">Tài khoản Google: maitran@gmail.com</p>
                            </div>
                            <span className="text-[10px] text-stone-400">1 giờ trước</span>
                          </div>
                          <p className="text-xs text-stone-700 bg-white p-2.5 rounded-lg border border-[#EAE5D9]">
                            Yêu cầu gắn vào hồ sơ: <strong className="text-[#0F382C]">Phạm Thị Hương (Đời 12 · Em gái Giáp Phạm)</strong>
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setApprovedClaims((prev) => [...prev, 'huong'])}
                              className="px-4 py-2 rounded-lg bg-[#0F382C] text-[#F3E5C8] text-xs font-bold hover:bg-[#154B3B] transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Phê Duyệt Liên Kết</span>
                            </button>
                            <button
                              type="button"
                              className="px-3.5 py-2 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold hover:bg-stone-200 transition-colors"
                            >
                              Từ Chối
                            </button>
                          </div>
                        </div>
                      )}

                      {approvedClaims.length === 2 && (
                        <div className="p-8 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                          <p className="text-sm font-bold text-emerald-900">Đã phê duyệt tất cả yêu cầu</p>
                          <p className="text-xs text-emerald-700">Hàng chờ kiểm duyệt đang trống. Toàn bộ con cháu đã được gán node chính xác.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. MÀN HÌNH CON: QUẢN LÝ TÀI KHOẢN (/admin/users) */}
                {adminSubTab === 'users' && (
                  <div className="p-6 rounded-2xl bg-white border border-[#EAE5D9] shadow-xs space-y-4 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EBE1] gap-3">
                      <div>
                        <h4 className="font-sans font-bold text-stone-900 text-base flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#0F382C]" />
                          <span>Quản Lý Tài Khoản Thành Viên (/admin/users)</span>
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Danh sách tài khoản Google đăng nhập và phân quyền truy cập dòng họ.
                        </p>
                      </div>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Tìm tài khoản..."
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#DDD6C7] bg-[#FAF8F2] focus:outline-none w-44"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-[#F0EBE1] text-stone-400 uppercase font-semibold text-[10px]">
                            <th className="py-2.5 px-3">Tài Khoản</th>
                            <th className="py-2.5 px-3">Vai Trò</th>
                            <th className="py-2.5 px-3">Hồ Sơ Gắn Trên Cây</th>
                            <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          <tr className="hover:bg-[#FAF8F2]/60">
                            <td className="py-3 px-3">
                              <p className="font-bold text-stone-900">Giáp Phạm</p>
                              <p className="text-[10px] text-stone-400">giap.pt.90@gmail.com</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                                Super Admin
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-[#0F382C]">Phạm Tiến Giáp (Đời 12)</td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-emerald-700 font-bold text-[10px]">Đang Hoạt Động</span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#FAF8F2]/60">
                            <td className="py-3 px-3">
                              <p className="font-bold text-stone-900">Nguyễn Văn Tuấn</p>
                              <p className="text-[10px] text-stone-400">tuannv@gmail.com</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                                Thành Viên
                              </span>
                            </td>
                            <td className="py-3 px-3 text-stone-500">
                              {approvedClaims.includes('doan') ? 'Cụ Phạm Khắc Đoàn' : 'Chưa gắn node'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-stone-400 text-[10px]">Đã đăng nhập</span>
                            </td>
                          </tr>
                          <tr className="hover:bg-[#FAF8F2]/60">
                            <td className="py-3 px-3">
                              <p className="font-bold text-stone-900">Trần Thị Mai</p>
                              <p className="text-[10px] text-stone-400">maitran@gmail.com</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                                Thành Viên
                              </span>
                            </td>
                            <td className="py-3 px-3 text-stone-500">
                              {approvedClaims.includes('huong') ? 'Phạm Thị Hương' : 'Chưa gắn node'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className="text-stone-400 text-[10px]">Đã đăng nhập</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. MÀN HÌNH CON: CẤU TRÚC NGÀNH / CHI (/admin/branches) */}
                {adminSubTab === 'branches' && (
                  <div className="p-6 rounded-2xl bg-white border border-[#EAE5D9] shadow-xs space-y-4 animate-in fade-in duration-150">
                    <div className="pb-3 border-b border-[#F0EBE1]">
                      <h4 className="font-sans font-bold text-stone-900 text-base flex items-center gap-2">
                        <FamilyTreeIcon className="w-5 h-5 text-[#0F382C]" />
                        <span>Cấu Trúc Ngành & Chi Tông Tộc (/admin/branches)</span>
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Phân cấp các nhánh huyết thống dòng họ Phạm từ Cụ Tổ Phạm Văn Chiến.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F382C] text-[#F3E5C8]">
                            Ngành 1 (Trưởng Tộc)
                          </span>
                          <span className="text-xs font-bold text-stone-700">38 Nhân Khẩu</span>
                        </div>
                        <h5 className="font-sans font-bold text-stone-900 text-sm">Nhánh Trưởng Nam Phạm Văn Đồng</h5>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Bao gồm Chi 1 (Trưởng chi Cụ Phạm Khắc Đoàn) và Chi 2. Trực hệ con cháu Đích Tôn gìn giữ từ đường.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-700 text-white">
                            Ngành 2 (Thứ Tộc)
                          </span>
                          <span className="text-xs font-bold text-stone-700">14 Nhân Khẩu</span>
                        </div>
                        <h5 className="font-sans font-bold text-stone-900 text-sm">Nhánh Thứ Nam Phạm Kim Đức</h5>
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Bao gồm Chi 1 Thứ tộc. Phân nhánh từ đời thứ 5, gìn giữ quan hệ nội tộc đoàn kết, hiếu nghĩa.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. MÀN HÌNH CON: BẬT/TẮT & PHÂN QUYỀN (/admin/governance) */}
                {adminSubTab === 'governance' && (
                  <div className="p-6 rounded-2xl bg-white border border-[#EAE5D9] shadow-xs space-y-5 animate-in fade-in duration-150">
                    <div className="pb-3 border-b border-[#F0EBE1]">
                      <h4 className="font-sans font-bold text-stone-900 text-base flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#0F382C]" />
                        <span>Bật/Tắt Cờ & Phân Quyền Hệ Thống (/admin/governance)</span>
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Thiết lập chính sách bảo mật, tính năng công khai và quyền riêng tư của dòng họ.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-stone-900 text-sm">Cho phép khách xem Cây Gia Phả</p>
                          <p className="text-stone-500 mt-0.5">Người chưa đăng nhập vẫn có thể tra cứu xem sơ đồ cây gia phả</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0F382C]" />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-stone-900 text-sm">Thông báo giỗ qua Web Push API</p>
                          <p className="text-stone-500 mt-0.5">Hệ thống gửi thông báo nhắc trước 3 ngày giỗ Âm lịch về thiết bị con cháu</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0F382C]" />
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between">
                        <div>
                          <p className="font-bold text-stone-900 text-sm">Bảo vệ quyền riêng tư người còn sống</p>
                          <p className="text-stone-500 mt-0.5">Ẩn ngày sinh chi tiết, số điện thoại và nơi ở đối với tài khoản khách</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0F382C]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 6: FORM NHẬP LIỆU THÀNH VIÊN (MEMBER FORM MODAL & WIZARD) */}
        {/* ============================================================ */}
        {activeScreen === 'forms' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Màn Hình 6 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAE5D9] gap-4">
              <div>
                <span className="text-xs font-serif uppercase tracking-widest text-[#0F382C] font-bold">
                  Màn Hình 6: Form Nhập Liệu Chuẩn Mực
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  Biểu Mẫu Quản Trị Thành Viên & Gia Đình (Member Form Wizard)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
                  Chuẩn hóa toàn diện 5 phân khu nhập liệu cốt lõi: Định danh & sinh tử, Thân tộc trực hệ, Hôn phối đa thê/nội tộc, Ngày giỗ âm lịch, Hậu duệ con cái & phả ký.
                </p>
              </div>

              {/* Nút Kích Hoạt Modal Thật */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalFormMode('create');
                    setFormFullName('');
                    setFormAlias('');
                    setFormGender('male');
                    setFormLifeStatus('living');
                    setIsLiveModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F382C] hover:bg-[#154B3B] text-[#F3E5C8] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Thành Viên (Mở Modal Thật)</span>
                </button>
              </div>
            </div>

            {/* BẢN THIẾT KẾ TRỰC QUAN CỦA FORM (IN-PLACE BLUEPRINT) */}
            <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1]">
                <div>
                  <h3 className="font-sans font-black text-base text-stone-900 tracking-tight">
                    Bản Thảo Thiết Kế Giao Diện Biểu Mẫu 2 Cột (Production Form Layout)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Trực tiếp chuyển đổi giữa các tab để kiểm tra từng nhóm trường nhập liệu chuyên sâu.
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Tương tác trực tiếp trên trang
                </span>
              </div>

              {/* THANH ĐỒNG BỘ HỆ MÀU DI SẢN (SYNCED PALETTE CONTROLLER TRÊN FORM) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      <span>Đồng Bộ Hệ Màu Di Sản:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                        {currentTokens.name}
                      </span>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Toàn bộ nút chọn Giới Tính, Sinh Tử và Huy hiệu trên Form tự động chuyển đổi theo hệ màu này.
                    </p>
                  </div>
                </div>

                {/* Công tắc đổi nhanh hệ màu ngay trên Form */}
                <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#DDD6C7] text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTreePalette('bright_crisp')}
                    className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${treePalette === 'bright_crisp'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>PA 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreePalette('indigo_plum')}
                    className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${treePalette === 'indigo_plum'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#234E70]" />
                    <span>PA 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreePalette('earth_wood')}
                    className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${treePalette === 'earth_wood'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#1E4E45]" />
                    <span>PA 3</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTreePalette('ink_wash')}
                    className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${treePalette === 'ink_wash'
                      ? 'bg-[#0F382C] text-[#F3E5C8] shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-stone-700" />
                    <span>PA 4</span>
                  </button>
                </div>
              </div>

              {/* Tab Navigation của Biểu Mẫu */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFormActiveSection('identity')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${formActiveSection === 'identity'
                    ? 'bg-white text-[#0F382C] shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  1. Định Danh & Sinh Tử
                </button>
                <button
                  type="button"
                  onClick={() => setFormActiveSection('lineage')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${formActiveSection === 'lineage'
                    ? 'bg-white text-[#0F382C] shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  2. Thân Tộc Trực Hệ
                </button>
                <button
                  type="button"
                  onClick={() => setFormActiveSection('spouse')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${formActiveSection === 'spouse'
                    ? 'bg-white text-[#0F382C] shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  3. Hôn Phối (Vợ/Chồng)
                </button>
                <button
                  type="button"
                  onClick={() => setFormActiveSection('death')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${formActiveSection === 'death'
                    ? 'bg-white text-[#0F382C] shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  4. Lịch Giỗ Âm Lịch
                </button>
                <button
                  type="button"
                  onClick={() => setFormActiveSection('children')}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${formActiveSection === 'children'
                    ? 'bg-white text-[#0F382C] shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                    }`}
                >
                  5. Hậu Duệ & Phả Ký
                </button>
              </div>

              {/* NỘI DUNG TỪNG PHÂN KHU BIỂU MẪU */}
              <div className="p-6 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-6">
                {/* 1. ĐỊNH DANH & SINH TỬ */}
                {formActiveSection === 'identity' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                          <span>Họ và Tên (*):</span>
                          <span className="text-[10px] text-stone-400 font-normal">Tự động tách tên húy</span>
                        </label>
                        <input
                          type="text"
                          value={formFullName}
                          onChange={(e) => setFormFullName(e.target.value)}
                          placeholder="Ví dụ: Phạm Tiến Giáp"
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]/30 focus:border-[#0F382C]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">
                          Tên Húy / Bí Danh / Tên Tự:
                        </label>
                        <input
                          type="text"
                          value={formAlias}
                          onChange={(e) => setFormAlias(e.target.value)}
                          placeholder="Ví dụ: Tự: Văn Giáp"
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]/30 focus:border-[#0F382C]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {/* Segmented Switch Giới tính */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Giới Tính:</label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-control border border-[#DCD5C6]">
                          <button
                            type="button"
                            onClick={() => setFormGender('male')}
                            className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 border ${formGender === 'male'
                              ? currentTokens.male.active
                              : currentTokens.male.inactive
                              }`}
                          >
                            <User className="w-3 h-3" />
                            <span>Nam</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormGender('female')}
                            className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 border ${formGender === 'female'
                              ? currentTokens.female.active
                              : currentTokens.female.inactive
                              }`}
                          >
                            <User className="w-3 h-3" />
                            <span>Nữ</span>
                          </button>
                        </div>
                      </div>

                      {/* Toggle Sinh tử */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Tình Trạng Sinh Tử:</label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-control border border-[#DCD5C6]">
                          <button
                            type="button"
                            onClick={() => setFormLifeStatus('living')}
                            className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 border ${formLifeStatus === 'living'
                              ? currentTokens.living.active
                              : currentTokens.living.inactive
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${formLifeStatus === 'living' ? 'bg-white' : currentTokens.living.dot
                                }`}
                            />
                            <span>Còn Sống</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormLifeStatus('deceased')}
                            className={`py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 border ${formLifeStatus === 'deceased'
                              ? currentTokens.deceased.active
                              : currentTokens.deceased.inactive
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${formLifeStatus === 'deceased' ? 'bg-white' : currentTokens.deceased.dot
                                }`}
                            />
                            <span>Đã Mất</span>
                          </button>
                        </div>
                      </div>

                      {/* Năm sinh */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Năm Sinh (Dương lịch):</label>
                        <input
                          type="number"
                          value={formBirthYear}
                          onChange={(e) => setFormBirthYear(e.target.value)}
                          placeholder="Ví dụ: 1990"
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]/30 focus:border-[#0F382C]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. THÂN TỘC TRỰC HỆ */}
                {formActiveSection === 'lineage' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Chọn Cha (Thân phụ):</label>
                        <select
                          value={formFatherId}
                          onChange={(e) => setFormFatherId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]/30"
                        >
                          <option value="khoi">Cụ Phạm Văn Khởi (Đời 10 - Cụ Tổ)</option>
                          <option value="tuan">Bác Phạm Văn Tuấn (Đời 11 - Trưởng)</option>
                          <option value="cuong">Bố Phạm Văn Cường (Đời 11 - Thứ)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Chọn Mẹ (Thân mẫu):</label>
                        <select
                          value={formMotherId}
                          onChange={(e) => setFormMotherId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]/30"
                        >
                          <option value="hien">Cụ Nguyễn Thị Hiến (Phu nhân Cụ Khởi)</option>
                          <option value="hue">Bác Trần Thị Huệ (Phu nhân Bác Tuấn)</option>
                          <option value="cham">Mẹ Nguyễn Thị Chăm (Phu nhân Bố Cường)</option>
                        </select>
                      </div>
                    </div>

                    {/* Card Thẩm Định Quan Hệ Cặp Phụ Mẫu Tự Động */}
                    <div className="p-3.5 rounded-xl bg-[#E8F0EC] border border-[#BED7CA] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-950">
                            Cặp phụ mẫu hợp pháp: Bố Phạm Văn Cường & Mẹ Nguyễn Thị Chăm
                          </p>
                          <p className="text-emerald-700 text-[11px]">
                            Hạ nhánh con cái chính thức từ quan hệ hôn phối đã được xác thực trên cây phả hệ.
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                        Hôn Phối Hợp Pháp
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Thứ Tự Con Trong Nhà:</label>
                        <input
                          type="number"
                          value={formBirthOrder}
                          onChange={(e) => setFormBirthOrder(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                          <input
                            type="checkbox"
                            checked={formIsSenior}
                            onChange={(e) => setFormIsSenior(e.target.checked)}
                            className="rounded text-[#0F382C] focus:ring-[#0F382C]"
                          />
                          <span>Con Trưởng / Đích Tôn (Gắn badge Trưởng)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. HÔN PHỐI (VỢ / CHỒNG) */}
                {formActiveSection === 'spouse' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700">Nguồn Gốc Phối Ngẫu:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setFormSpouseOrigin('external')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${formSpouseOrigin === 'external'
                            ? 'bg-white border-[#0F382C] ring-2 ring-[#0F382C]/20 shadow-2xs'
                            : 'bg-white/60 border-[#DCD5C6]'
                            }`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs text-stone-900">
                            <span>Phối Ngẫu Ngoại Tộc</span>
                            <span className="text-[10px] text-stone-400">Phổ biến</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Người ngoài dòng họ, tạo thẻ thông thường nối ngang với thành viên.
                          </p>
                        </div>

                        <div
                          onClick={() => setFormSpouseOrigin('internal')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${formSpouseOrigin === 'internal'
                            ? 'bg-white border-amber-600 ring-2 ring-amber-600/20 shadow-2xs'
                            : 'bg-white/60 border-[#DCD5C6]'
                            }`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs text-amber-900">
                            <span className="flex items-center gap-1">
                              <Link2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Hôn Nhân Nội Tộc (Ghost Node Phản Chiếu)</span>
                            </span>
                            <span className="text-[10px] text-amber-700">Bảo toàn số đinh</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Người cùng trong dòng tộc (chi khác), sinh Ghost Node phản chiếu để chống nhân bản bản ghi.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Họ và Tên Vợ/Chồng:</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Nguyễn Thị Hoa"
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Thứ Tự Hôn Phối:</label>
                        <select className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white">
                          <option>Vợ Cả / Chánh Thất (Hôn phối thứ 1)</option>
                          <option>Vợ Hai / Thứ Thất (Hôn phối thứ 2)</option>
                          <option>Vợ Ba (Hôn phối thứ 3)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Tình Trạng Hôn Nhân:</label>
                        <select className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white">
                          <option>Đang chung sống</option>
                          <option>Tái giá</option>
                          <option>Ly hôn</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. LỊCH GIỖ ÂM LỊCH & NGÀY MẤT */}
                {formActiveSection === 'death' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="p-3.5 rounded-xl bg-[#FEF6E9] border border-[#E8CE9D] flex items-center gap-2.5 text-xs text-[#8C5D17]">
                      <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Thuật toán quy đổi Âm - Dương chuẩn múi giờ Việt Nam (UTC+7). Mặc định ưu tiên ngày Giỗ theo Âm lịch truyền thống.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Ngày Giỗ (Âm lịch):</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={formDeathLunarDay}
                          onChange={(e) => setFormDeathLunarDay(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white font-bold text-red-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Tháng Giỗ (Âm lịch):</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formDeathLunarMonth}
                          onChange={(e) => setFormDeathLunarMonth(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white font-bold text-red-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Năm Can Chi:</label>
                        <input
                          type="text"
                          value={formDeathLunarYearName}
                          onChange={(e) => setFormDeathLunarYearName(e.target.value)}
                          placeholder="Ví dụ: Bính Ngọ"
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-700">Năm Mất (Dương lịch):</label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 2022"
                          className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0F382C]" />
                        <span>Nơi An Táng / Lăng Mộ Phần:</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Nghĩa trang nhân dân xã Cổ Am, huyện Vĩnh Bảo, Hải Phòng"
                        className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* 5. HẬU DUỆ & PHẢ KÝ */}
                {formActiveSection === 'children' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-stone-700">Danh Sách Hậu Duệ Con Cái:</label>
                        <span className="text-[11px] text-stone-400">Kéo thả để sắp xếp thứ tự ngôi</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-[#DCD5C6] divide-y divide-stone-100 text-xs">
                        <div className="py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-control bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">
                              1
                            </span>
                            <span className="font-bold text-stone-900">Phạm Tiến Giáp</span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Đích Tôn
                            </span>
                          </div>
                          <span className="text-stone-400 text-[11px]">SN: 1990</span>
                        </div>

                        <div className="py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-control bg-pink-100 text-pink-800 font-bold text-[10px] flex items-center justify-center">
                              2
                            </span>
                            <span className="font-bold text-stone-900">Phạm Thị Hương</span>
                            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                              Con gái
                            </span>
                          </div>
                          <span className="text-stone-400 text-[11px]">SN: 1994</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-stone-700">Tiểu Sử Phả Ký & Công Đức:</label>
                      <textarea
                        rows={4}
                        placeholder="Ghi chép công đức, chức sắc, sự nghiệp hoặc huân huy chương của tiền nhân..."
                        className="w-full px-3 py-2 text-xs rounded-control border border-[#DCD5C6] bg-white focus:outline-none leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 7: DESIGN TOKENS & CHUẨN MỰC HÌNH HỌC */}
        {/* ============================================================ */}
        {activeScreen === 'tokens' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Màn Hình 7 */}
            <div className="pb-4 border-b border-[#EAE5D9]">
              <span className="text-xs font-serif uppercase tracking-widest text-[#0F382C] font-bold">
                Màn Hình 7: Bảng Quy Chuẩn Thiết Kế Toàn Diện
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
                Hệ Thống Design Tokens Di Sản & Cam Kết Kỹ Thuật (SSOT)
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
                Tài liệu nguồn chân lý duy nhất (Single Source of Truth) định nghĩa toàn bộ giá trị thị giác: Bậc phân tầng nền, viền kẻ hairline, bóng đổ nâu than, màu chữ phân cấp, nút bấm tương tác, ô nhập liệu form, huy hiệu trạng thái, màu thân tộc phả hệ, tem lịch bloc, modal shell và bộ mã nguồn CSS/Tailwind tích hợp trực tiếp.
              </p>
            </div>

            {/* LƯỚI 10 KHỐI QUY CHUẨN THỊ GIÁC CHI TIẾT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* PHÂN KHU 1: BẬC PHÂN TẦNG NỀN & MẶT PHẲNG */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      1. Bậc Phân Tầng Nền (Surface & Elevation)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Quy định cao độ thị giác và độ sâu không gian</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">6 Tầng Nền</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9] shadow-2xs shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Canvas Base (#FAF8F2)</p>
                        <p className="text-stone-500 text-[11px]">Nền giấy Dó ngà ấm toàn trang, êm dịu thị giác, chống mỏi mắt</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bg-canvas</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FFFFFF] border border-[#EAE5D9] shadow-xs shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Surface Card (#FFFFFF)</p>
                        <p className="text-stone-500 text-[11px]">Thẻ trắng sứ tinh khiết, nổi bật trên nền giấy ngà bằng viền đá ấm</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bg-surface</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F5F2EA] border border-[#E5E0D4] shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Sub-Surface Inset (#F5F2EA)</p>
                        <p className="text-stone-500 text-[11px]">Khối lồng phụ bên trong thẻ, bảng dữ liệu con, khung tóm tắt</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bg-sub-surface</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#EFECE4] border border-[#DDD8CD] shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Control Track (#EFECE4)</p>
                        <p className="text-stone-500 text-[11px]">Rãnh chứa segmented switch, thanh trượt chuyển tab và bộ lọc</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bg-control</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0F382C] border border-[#164E3D] shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Headerbar Brand (#0F382C)</p>
                        <p className="text-stone-500 text-[11px]">Thanh điều hướng đỉnh trang, màu xanh ngọc di sản trang nghiêm</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bg-brand</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1C1917] border border-stone-800 shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Command Dark (#1C1917)</p>
                        <p className="text-stone-500 text-[11px]">Thanh Studio Inspector, thanh công cụ Canvas, nền code preview</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bg-dark-ribbon</span>
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 2: HỆ THỐNG VIỀN KẺ MẢNH (HAIRLINE BORDERS) */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      2. Hệ Thống Viền Kẻ Mảnh (Hairline Borders)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Viền đá tự nhiên 1px, tạo ranh giới tinh tế không chói gắt</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Hairline 1px</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border-2 border-[#EAE5D9] shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Border Card (#EAE5D9)</p>
                        <p className="text-stone-500 text-[11px]">Viền đá ấm bao bọc thẻ card, modal, bloc lịch, hộp thông tin</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--border-card</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border-2 border-[#F0EBE1] shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Border Divider (#F0EBE1)</p>
                        <p className="text-stone-500 text-[11px]">Đường kẻ ngang mờ phân chia dòng danh sách, header/footer thẻ</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--border-divider</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border-2 border-[#DCD5C6] shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Border Control (#DCD5C6)</p>
                        <p className="text-stone-500 text-[11px]">Viền ô nhập liệu input, nút thứ cấp, đậm hơn 1 nấc nhận diện tương tác</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--border-control</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0F382C] border-2 border-[#164E3D] shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Border Brand (#164E3D)</p>
                        <p className="text-stone-500 text-[11px]">Viền xanh ngọc đậm cho nút chính, ấn triện và đường viền headerbar</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--border-brand</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border-2 border-dashed border-stone-300 shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Border Dashed (#D6D3D1)</p>
                        <p className="text-stone-500 text-[11px]">Đường nét đứt xé tem lịch bloc, khung node rỗng, ô tải file</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--border-dashed</span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                    <strong>Điều Cấm Kỵ Tuyệt Đối:</strong> Không sử dụng các class viền xám công nghiệp mặc định (như <code>border-slate-200</code> hay <code>border-gray-200</code>). Tông xanh lạnh của slate sẽ phá hủy hoàn toàn cảm xúc ấm áp, hoài niệm của giấy Dó gia phả.
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 3: BÓNG ĐỔ DI SẢN (HERITAGE SOFT SHADOWS) */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      3. Bóng Đổ Di Sản (Heritage Soft Shadows)
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Sắc tố than chì nâu trầm, loại bỏ bóng đen xám nhựa</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Pigment Brown</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] shadow-[0_2px_12px_-2px_rgba(28,25,23,0.04)] space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900">Shadow Card Soft (Trạng Thái Nghỉ)</p>
                      <span className="font-mono text-stone-400 text-[11px]">rgba(28,25,23,0.04)</span>
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      <code>0 2px 12px -2px rgba(28, 25, 23, 0.04)</code> • Bóng êm sương sớm, nâng nhẹ thẻ trên nền giấy ngà.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] shadow-[0_4px_20px_-4px_rgba(28,25,23,0.08)] space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900">Shadow Elevated (Hover & Active Focus)</p>
                      <span className="font-mono text-stone-400 text-[11px]">rgba(28,25,23,0.08)</span>
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      <code>0 4px 20px -4px rgba(28, 25, 23, 0.08)</code> • Áp dụng khi người dùng rê chuột (hover) vào thẻ hoặc thẻ được kích hoạt.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#EAE5D9] shadow-[0_12px_32px_-4px_rgba(28,25,23,0.12)] space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900">Shadow Floating (Modal Popup & Drawer)</p>
                      <span className="font-mono text-stone-400 text-[11px]">rgba(28,25,23,0.12)</span>
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      <code>0 12px 32px -4px rgba(28, 25, 23, 0.12)</code> • Chiều sâu không gian tối thượng cho cửa sổ popup modal và menu trượt.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    <strong>Quy Ước Sắc Tố Than Chì:</strong> 100% bóng đổ trong toàn hệ thống sử dụng kênh màu nâu chì <code>rgba(28, 25, 23, ...)</code>. Tuyệt đối không dùng bóng đen mặc định của trình duyệt <code>rgba(0, 0, 0, 0.15)</code> vì gây cảm giác sắc lạnh, giả tạo.
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 4: PHÂN CẤP MÀU CHỮ & TYPOGRAPHY */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      4. Hệ Thống Màu Chữ & Phân Cấp Nội Dung
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Thang bậc tương phản đạt chuẩn WCAG AAA trên nền giấy ngà</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">WCAG AAA</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#1C1917] text-sm">Tiêu Đề Chính / Headline (#1C1917)</p>
                      <p className="text-stone-500 text-[11px]">Độ tương phản tối đa, ấm áp, dùng cho tên người, tiêu đề màn hình</p>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">text-stone-900</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#292524]">Nội Dung Chính / Body Primary (#292524)</p>
                      <p className="text-stone-500 text-[11px]">Văn bản đọc chính, thông tin gia phả, nhãn input, giá trị bảng</p>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">text-stone-800</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#57534E]">Mô Tả Phụ / Body Secondary (#57534E)</p>
                      <p className="text-stone-500 text-[11px]">Dòng giải thích, đoạn văn dẫn, địa danh quê quán, tóm tắt sự vụ</p>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">text-stone-600</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between">
                    <div>
                      <p className="text-[#78716C]">Siêu Dữ Liệu / Caption & Metadata (#78716C)</p>
                      <p className="text-stone-500 text-[11px]">Ngày giờ, tuổi thọ, vai vế xưng hô phụ, nhãn chỉ dẫn vi mô</p>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">text-stone-500</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-center">
                      <p className="font-bold text-[#0F382C]">Xanh Ngọc Di Sản</p>
                      <p className="text-[10px] text-emerald-700 font-mono mt-0.5">#0F382C</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 text-center">
                      <p className="font-bold text-[#BE123C]">Đỏ Son Âm Lịch</p>
                      <p className="text-[10px] text-rose-700 font-mono mt-0.5">#BE123C</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-center">
                      <p className="font-bold text-[#B45309]">Vàng Đồng Trang Ngang</p>
                      <p className="text-[10px] text-amber-700 font-mono mt-0.5">#B45309</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 5: BỘ NÚT BẤM & TRẠNG THÁI TƯƠNG TÁC */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      5. Bộ Nút Bấm & Điều Khiển Tương Tác
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Chuẩn bo góc rounded-lg (8px), tuyệt đối không dùng viên thuốc</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Interactive</span>
                </div>
                <div className="space-y-3 text-xs">
                  {/* Hàng nút bấm xem trước */}
                  <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-3">
                    <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">Mẫu Xem Trước Nút Bấm (Live Preview):</p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button type="button" className="px-3.5 py-2 rounded-lg bg-[#0F382C] text-white font-bold text-xs shadow-xs hover:bg-[#164E3D] border border-[#164E3D] transition-colors">
                        Nút Chính (Primary)
                      </button>
                      <button type="button" className="px-3.5 py-2 rounded-lg bg-white text-stone-800 font-semibold text-xs shadow-2xs hover:bg-[#FAF8F2] border border-[#DCD5C6] transition-colors">
                        Nút Thứ Cấp (Secondary)
                      </button>
                      <button type="button" className="px-3 py-2 rounded-lg bg-transparent text-stone-600 font-medium text-xs hover:bg-[#EFECE4] hover:text-stone-900 transition-colors">
                        Nút Tối Giản (Ghost)
                      </button>
                      <button type="button" className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200 hover:bg-rose-100 transition-colors">
                        Xóa / Cảnh Báo
                      </button>
                      <button type="button" className="px-3 py-2 rounded-lg bg-[#0F382C] text-amber-300 font-serif font-bold text-xs border border-[#164E3D] shadow-2xs">
                        Ấn Triện
                      </button>
                    </div>
                  </div>

                  {/* Segmented Switch mẫu */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">Bộ Chuyển Đổi Tab / Phân Đoạn (Segmented Switch):</p>
                      <span className="font-mono text-stone-400 text-[10px]">rounded-lg</span>
                    </div>
                    <div className="p-1 rounded-lg bg-[#EFECE4] border border-[#DCD5C6] flex items-center max-w-sm">
                      <div className="flex-1 py-1.5 px-3 rounded-md bg-white text-stone-900 font-bold text-center text-xs shadow-2xs border border-[#EAE5D9]">
                        Đang Chọn (Active)
                      </div>
                      <div className="flex-1 py-1.5 px-3 rounded-md text-stone-600 font-medium text-center text-xs hover:text-stone-900">
                        Chưa Chọn (Inactive)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 6: FORM CONTROLS & Ô NHẬP LIỆU */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      6. Form Controls & Quy Chuẩn Nhập Liệu
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Tránh hoàn toàn lỗi kerning, viền tương tác rõ nét</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Inputs</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-stone-700 font-semibold text-xs font-sans">
                      Họ và Tên Thành Viên (Trạng Thái Nghỉ - Normal):
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Phạm Văn Dũng"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#DCD5C6] text-stone-900 text-xs shadow-2xs focus:outline-hidden"
                    />
                    <p className="text-stone-400 text-[11px]">Border #DCD5C6, bo góc rounded-lg (8px)</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[#0F382C] font-semibold text-xs font-sans">
                      Ngày Sinh Âm Lịch (Trạng Thái Được Chọn - Focus):
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="15 tháng Tám năm Giáp Dần"
                      className="w-full px-3 py-2 rounded-lg bg-white border-2 border-[#0F382C] text-stone-900 text-xs shadow-xs focus:outline-hidden ring-2 ring-[#0F382C]/10"
                    />
                    <p className="text-emerald-700 text-[11px]">Border 2px #0F382C kèm bóng ring mờ 10%</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-stone-400 font-semibold text-xs font-sans">
                      Mã Định Danh Cố Định (Trạng Thái Khóa - Disabled):
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value="NODE-PHAM-0028"
                      className="w-full px-3 py-2 rounded-lg bg-[#F5F2EA] border border-[#EAE5D9] text-stone-400 text-xs cursor-not-allowed"
                    />
                    <p className="text-stone-400 text-[11px]">Nền Sub-surface #F5F2EA, viền #EAE5D9</p>
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 7: HUY HIỆU TRẠNG THÁI & CHẤM VI MÔ */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      7. Hệ Thống Huy Hiệu Trạng Thái & Micro-Dots
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Quy ước bo góc thẻ rounded-md (6px), micro-dot chuẩn hóa</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Status Badges</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Còn Sống / Đã Duyệt
                      </span>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">bg-emerald-50 border-emerald-200</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-500 shrink-0" />
                        Đã Mất / Lưu Trữ
                      </span>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">bg-stone-100 border-stone-200</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Chờ Duyệt / Cảnh Báo
                      </span>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">bg-amber-50 border-amber-200</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        Từ Chối / Nguy Cấp
                      </span>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">bg-rose-50 border-rose-200</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        Nhánh Chi / Thông Tin
                      </span>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">bg-sky-50 border-sky-200</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F382C]/10 text-[#0F382C] border border-[#0F382C]/30 text-xs font-bold font-serif">
                        Trưởng Tộc / Ngành Trưởng
                      </span>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px]">bg-brand/10 text-brand</span>
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 8: MÀU SẮC THÂN TỘC & CÂY PHẢ HỆ */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      8. Màu Sắc Phả Hệ & Node Cây Gia Phả
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Khóa kích thước chuẩn 200x96px, phân định giới tính</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">200 × 96px</span>
                </div>
                <div className="space-y-3 text-xs">
                  {/* PA1 */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">PA 1: Sáng & Trong Trẻo (Tươi Mới - Đang Dùng)</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-100 text-emerald-800 font-bold">Mặc Định</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-sky-50/80 border border-sky-300 text-sky-800 flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-md bg-sky-400 shrink-0" />
                        <div>
                          <p className="font-bold">Nam (PA 1)</p>
                          <p className="text-[10px] text-sky-600 font-mono">Viền #38BDF8 / Nền #E0F2FE</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-300 text-rose-800 flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-md bg-rose-400 shrink-0" />
                        <div>
                          <p className="font-bold">Nữ (PA 1)</p>
                          <p className="text-[10px] text-rose-600 font-mono">Viền #FB7185 / Nền #FFE4E6</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PA2 */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-2">
                    <span className="font-bold text-stone-900">PA 2: Chàm Cổ & Cánh Sen Trầm (Trang Trọng Hoài Niệm)</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-[#EAEFF5] border border-[#234E70] text-[#1B3B54] flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-md bg-[#234E70] shrink-0" />
                        <div>
                          <p className="font-bold">Nam (PA 2)</p>
                          <p className="text-[10px] text-[#234E70] font-mono">Viền #234E70 / Nền #EAEFF5</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F5ECEF] border border-[#8C4A5A] text-[#702A3C] flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-md bg-[#8C4A5A] shrink-0" />
                        <div>
                          <p className="font-bold">Nữ (PA 2)</p>
                          <p className="text-[10px] text-[#8C4A5A] font-mono">Viền #8C4A5A / Nền #F5ECEF</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ghost Node & Dây Nối */}
                  <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-md border border-dashed border-stone-400 bg-stone-50 text-stone-600 font-medium">
                        Node Phản Chiếu (Ghost)
                      </div>
                      <span className="text-stone-500">Viền nét đứt #D6D3D1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-[#DCD5C6]" />
                      <span className="text-stone-500 font-mono">Dây nối #DCD5C6</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 9: QUY CHUẨN TEM LỊCH BLOC DI SẢN */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      9. Quy Chuẩn Tem Lịch Bloc Di Sản
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Khóa kích thước 90x108px, cấu trúc âm dương truyền thống</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Bloc Stamp</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#B91C1C] border border-[#991B1B] shadow-2xs shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Đỏ Gáy Lịch Bloc (#B91C1C / #C53030)</p>
                        <p className="text-stone-500 text-[11px]">Sắc đỏ cờ truyền thống, cao 26px, chữ hoa trắng in đậm</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bloc-header-red</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border-2 border-dashed border-stone-300 shrink-0" />
                      <div>
                        <p className="font-bold text-stone-900">Đường Xé Răng Cưa (border-dashed)</p>
                        <p className="text-stone-500 text-[11px]">Nét đứt phân tách ngày dương lịch và phần ghi chú âm lịch</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bloc-tear-dash</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FAF8F2] border border-[#EAE5D9] flex items-center justify-center font-bold text-rose-700 text-sm shrink-0">
                        03
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">Số Âm Lịch Lệch Trái (#BE123C)</p>
                        <p className="text-stone-500 text-[11px]">Neo cố định góc trái dưới, kèm năm Can Chi font-serif</p>
                      </div>
                    </div>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">--bloc-lunar-num</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] text-[11px] space-y-1">
                    <p className="font-bold text-stone-900">Khóa Hình Học Cố Định:</p>
                    <p className="text-stone-600 leading-relaxed">
                      Desktop: khóa cứng chính xác <code>w-[90px] h-[108px]</code>. Mobile: <code>w-[76px] h-[96px]</code>. Tuyệt đối không dùng <code>flex-1</code> kéo dãn dọc làm méo tỷ lệ tờ lịch bloc.
                    </p>
                  </div>
                </div>
              </div>

              {/* PHÂN KHU 10: QUY CHUẨN MODAL & NAVIGATION SHELL */}
              <div className="rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      10. Cấu Trúc Khung Modal & Thanh Headerbar
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">Trải nghiệm popup nổi và thanh nhận diện thương hiệu</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">Shell & Overlay</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-1.5">
                    <p className="font-bold text-stone-900">Màn Che Tối (Backdrop Overlay):</p>
                    <p className="text-stone-600 font-mono text-[11px]">bg-stone-950/60 backdrop-blur-xs</p>
                    <p className="text-stone-500 text-[11px]">Làm mờ nhẹ hậu cảnh, tập trung thị giác vào nội dung modal</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-1.5">
                    <p className="font-bold text-stone-900">Khung Cửa Sổ Modal (Modal Window Body):</p>
                    <p className="text-stone-600 font-mono text-[11px]">rounded-2xl bg-white border border-[#EAE5D9] shadow-2xl</p>
                    <p className="text-stone-500 text-[11px]">Bo góc 16px, viền đá ấm, phân tầng bằng bóng đổ floating</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#EAE5D9] space-y-1.5">
                    <p className="font-bold text-stone-900">Thanh Headerbar Đỉnh Trang:</p>
                    <p className="text-stone-600 font-mono text-[11px]">bg-[#0F382C] border-b border-[#164E3D]</p>
                    <p className="text-stone-500 text-[11px]">Tab đang chọn: <code>bg-[#164E3D] text-white border border-emerald-600/40</code></p>
                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG TỔNG HỢP CSS VARIABLES ĐẦY ĐỦ (DÀNH CHO LẬP TRÌNH VIÊN) */}
            <div className="rounded-2xl bg-[#1C1917] text-stone-300 p-6 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="font-bold text-white tracking-wider uppercase font-sans">
                    CSS Variables Manifest (Toàn Bộ Biến Gốc Cho globals.css)
                  </span>
                </div>
                <span className="text-stone-500 text-[11px]">Single Source of Truth</span>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-stone-300 p-2">
{`:root {
  /* ============================================================ */
  /* 1. BẬC PHÂN TẦNG NỀN & MẶT PHẲNG (SURFACE & CANVAS)         */
  /* ============================================================ */
  --bg-canvas:              #FAF8F2; /* Nền giấy Dó ngà ấm toàn trang */
  --bg-surface:             #FFFFFF; /* Thẻ Card trắng sứ tinh khiết */
  --bg-sub-surface:         #F5F2EA; /* Khối lồng phụ bên trong Card */
  --bg-control:             #EFECE4; /* Rãnh thanh trượt switch & segmented */
  --bg-brand:               #0F382C; /* Xanh ngọc di sản đỉnh Headerbar */
  --bg-dark-ribbon:         #1C1917; /* Thanh đen chì Studio Inspector */

  /* ============================================================ */
  /* 2. HỆ THỐNG VIỀN HAIRLINE ĐÁ TỰ NHIÊN (1PX BORDERS)         */
  /* ============================================================ */
  --border-card:            #EAE5D9; /* Viền thẻ ngoài, khung modal, lịch */
  --border-divider:         #F0EBE1; /* Kẻ ngang mờ phân cách danh sách */
  --border-control:         #DCD5C6; /* Viền ô nhập liệu input & nút phụ */
  --border-control-focus:   #0F382C; /* Viền ô nhập liệu khi focus */
  --border-brand:           #164E3D; /* Viền xanh ngọc đậm cho ấn triện */
  --border-dashed:          #D6D3D1; /* Đường xé răng cưa & node rỗng */

  /* ============================================================ */
  /* 3. BÓNG ĐỔ SẮC NÂU THAN DI SẢN (HERITAGE SOFT SHADOWS)       */
  /* ============================================================ */
  --shadow-card:            0 2px 12px -2px rgba(28, 25, 23, 0.04);
  --shadow-elevated:        0 4px 20px -4px rgba(28, 25, 23, 0.08);
  --shadow-floating:        0 12px 32px -4px rgba(28, 25, 23, 0.12);
  --shadow-segmented-thumb: 0 1px 3px 0 rgba(28, 25, 23, 0.08);

  /* ============================================================ */
  /* 4. PHÂN CẤP MÀU CHỮ & TYPOGRAPHY                             */
  /* ============================================================ */
  --text-title:             #1C1917; /* Tiêu đề tối đa, WCAG AAA */
  --text-body-primary:      #292524; /* Chữ thân chính, đọc êm mắt */
  --text-body-secondary:    #57534E; /* Mô tả phụ, giải thích */
  --text-caption:           #78716C; /* Siêu dữ liệu, ngày tháng */
  --text-placeholder:       #A8A29E; /* Ô chờ nhập liệu, chữ mờ */
  --text-brand-accent:      #0F382C; /* Nhấn xanh ngọc di sản */
  --text-lunar-accent:      #BE123C; /* Nhấn đỏ son âm lịch */
  --text-gold-accent:       #B45309; /* Nhấn vàng đồng trang nghiêm */

  /* ============================================================ */
  /* 5. NÚT BẤM & TƯƠNG TÁC (BUTTONS & CONTROLS)                 */
  /* ============================================================ */
  --btn-primary-bg:         #0F382C;
  --btn-primary-hover:      #164E3D;
  --btn-primary-border:     #164E3D;
  --btn-primary-text:       #FFFFFF;
  --btn-secondary-bg:       #FFFFFF;
  --btn-secondary-hover:    #FAF8F2;
  --btn-secondary-border:   #DCD5C6;
  --btn-secondary-text:     #1C1917;

  /* ============================================================ */
  /* 6. TEM LỊCH BLOC DI SẢN (ANNIVERSARY STAMP TOKENS)           */
  /* ============================================================ */
  --bloc-header-red:        #B91C1C; /* Đỏ gáy lịch bloc */
  --bloc-lunar-num:         #BE123C; /* Con số đỏ âm lịch */
  --bloc-width-pc:          90px;
  --bloc-height-pc:         108px;
  --bloc-width-mobile:      76px;
  --bloc-height-mobile:     96px;

  /* ============================================================ */
  /* 7. MÀU THÂN TỘC PHẢ HỆ (KINSHIP & GENDER TOKENS)            */
  /* ============================================================ */
  --kinship-male-border:    #38BDF8; /* Nam giới (PA 1 Trong Trẻo) */
  --kinship-male-avatar:    #E0F2FE;
  --kinship-female-border:  #FB7185; /* Nữ giới (PA 1 Trong Trẻo) */
  --kinship-female-avatar:  #FFE4E6;
  --kinship-dot-living:     #16A34A; /* Chấm vi mô người còn sống */
  --kinship-dot-deceased:   #78716C; /* Chấm vi mô người đã mất */

  /* ============================================================ */
  /* 8. QUY CHUẨN HÌNH HỌC ANTI-PILL (GEOMETRIC RADII)           */
  /* ============================================================ */
  --radius-card:            16px;    /* rounded-2xl cho Thẻ & Modal */
  --radius-inset:           12px;    /* rounded-xl cho Khối lồng phụ */
  --radius-control:         8px;     /* rounded-lg cho Nút & Input */
  --radius-badge:           6px;     /* rounded-md cho Huy hiệu trạng thái */
}`}
              </pre>
            </div>

            {/* BẢNG CẤU HÌNH TAILWIND CONFIG EXTENSION */}
            <div className="rounded-2xl bg-[#1C1917] text-stone-300 p-6 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                  <span className="font-bold text-white tracking-wider uppercase font-sans">
                    Tailwind Config Extension (Sao Chép Vào tailwind.config.ts)
                  </span>
                </div>
                <span className="text-stone-500 text-[11px]">Utility Classes Ready</span>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-stone-300 p-2">
{`// tailwind.config.ts extension
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        'sub-surface': 'var(--bg-sub-surface)',
        control: 'var(--bg-control)',
        brand: {
          DEFAULT: 'var(--bg-brand)',
          border: 'var(--border-brand)',
        },
      },
      borderColor: {
        card: 'var(--border-card)',
        divider: 'var(--border-divider)',
        control: 'var(--border-control)',
      },
      boxShadow: {
        'card-soft': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
        'floating': 'var(--shadow-floating)',
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'inset': 'var(--radius-inset)',
        'control': 'var(--radius-control)',
        'badge': 'var(--radius-badge)',
      },
    },
  },
};`}
              </pre>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LIVE POPUP MODAL THÀNH VIÊN (TRẢI NGHIỆM TƯƠNG TÁC THẬT) */}
        {/* ============================================================ */}
        {isLiveModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#EAE5D9] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header Modal */}
              <div className="px-6 py-4 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF8F2]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0F382C] text-[#E8D49E] flex items-center justify-center font-bold text-xs">
                    {modalFormMode === 'create' ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      {modalFormMode === 'create' ? 'Thêm Thành Viên Mới' : `Chỉnh Sửa Hồ Sơ: ${formFullName || 'Thành viên'}`}
                    </h3>
                    <p className="text-xs text-stone-500">Hệ thống kiểm soát tính toàn vẹn phả hệ FAT</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Thân Modal Có Cuộn */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* 1. Họ tên & Giới tính */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Họ và Tên (*):</label>
                    <input
                      type="text"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="Ví dụ: Phạm Tiến Giáp"
                      className="w-full px-3 py-2 rounded-control border border-[#DCD5C6] bg-white font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Tên Húy / Bí Danh:</label>
                    <input
                      type="text"
                      value={formAlias}
                      onChange={(e) => setFormAlias(e.target.value)}
                      placeholder="Ví dụ: Tự: Văn Giáp"
                      className="w-full px-3 py-2 rounded-control border border-[#DCD5C6] bg-white"
                    />
                  </div>
                </div>

                {/* 2. Giới tính & Tình trạng sinh tử */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Giới Tính:</label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF8F2] rounded-control border border-[#DCD5C6]">
                      <button
                        type="button"
                        onClick={() => setFormGender('male')}
                        className={`py-1.5 rounded font-bold transition-all border ${formGender === 'male'
                          ? currentTokens.male.active
                          : currentTokens.male.inactive
                          }`}
                      >
                        Nam
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormGender('female')}
                        className={`py-1.5 rounded font-bold transition-all border ${formGender === 'female'
                          ? currentTokens.female.active
                          : currentTokens.female.inactive
                          }`}
                      >
                        Nữ
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Sinh Tử:</label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF8F2] rounded-control border border-[#DCD5C6]">
                      <button
                        type="button"
                        onClick={() => setFormLifeStatus('living')}
                        className={`py-1.5 rounded font-bold transition-all flex items-center justify-center gap-1.5 border ${formLifeStatus === 'living'
                          ? currentTokens.living.active
                          : currentTokens.living.inactive
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${formLifeStatus === 'living' ? 'bg-white' : currentTokens.living.dot
                            }`}
                        />
                        <span>Còn Sống</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormLifeStatus('deceased')}
                        className={`py-1.5 rounded font-bold transition-all flex items-center justify-center gap-1.5 border ${formLifeStatus === 'deceased'
                          ? currentTokens.deceased.active
                          : currentTokens.deceased.inactive
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${formLifeStatus === 'deceased' ? 'bg-white' : currentTokens.deceased.dot
                            }`}
                        />
                        <span>Đã Mất</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-stone-700">Năm Sinh:</label>
                    <input
                      type="number"
                      value={formBirthYear}
                      onChange={(e) => setFormBirthYear(e.target.value)}
                      placeholder="1990"
                      className="w-full px-3 py-2 rounded-control border border-[#DCD5C6] bg-white"
                    />
                  </div>
                </div>

                {/* 3. Lịch Giỗ Âm Lịch (Nếu chọn Đã Mất) */}
                {formLifeStatus === 'deceased' && (
                  <div className="p-4 rounded-xl bg-[#FEF6E9] border border-[#E8CE9D] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C5D17]">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thông Tin Lễ Giỗ & An Táng:</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-600">Ngày Giỗ (Âm):</label>
                        <input
                          type="number"
                          value={formDeathLunarDay}
                          onChange={(e) => setFormDeathLunarDay(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-[#DCD5C6] bg-white font-bold text-red-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-600">Tháng Giỗ (Âm):</label>
                        <input
                          type="number"
                          value={formDeathLunarMonth}
                          onChange={(e) => setFormDeathLunarMonth(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-[#DCD5C6] bg-white font-bold text-red-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-600">Năm Can Chi:</label>
                        <input
                          type="text"
                          value={formDeathLunarYearName}
                          onChange={(e) => setFormDeathLunarYearName(e.target.value)}
                          placeholder="Bính Ngọ"
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-[#DCD5C6] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-3.5 border-t border-[#F0EBE1] flex items-center justify-end gap-2.5 bg-[#FAF8F2]">
                <button
                  type="button"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="px-4 py-2 rounded-control text-xs font-semibold text-stone-600 hover:bg-stone-200/60"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLiveModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-control text-xs font-bold bg-[#0F382C] text-[#F3E5C8] hover:bg-[#154B3B] transition-colors shadow-2xs"
                >
                  Lưu Thông Tin Thành Viên
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL XEM LƯỚI THÁNG CẢ NĂM */}
        {showYearGridModal && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white border border-[#EAE5D9] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                <div>
                  <h4 className="font-serif font-bold text-base text-stone-900">
                    Bao Quát Mật Độ Lễ Giỗ Cả Năm (Xem Thêm)
                  </h4>
                  <p className="text-xs text-stone-500">
                    Chỉ dùng khi cần xem toàn cảnh 12 tháng Âm lịch trong dòng họ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowYearGridModal(false)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-[#F4F1E8] text-stone-700 hover:bg-[#EAE5D9]"
                >
                  Đóng lại
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { m: 'Tháng 1', count: 2 },
                  { m: 'Tháng 2', count: 1 },
                  { m: 'Tháng 3', count: 4 },
                  { m: 'Tháng 4', count: 0 },
                  { m: 'Tháng 5', count: 3 },
                  { m: 'Tháng 6', count: 1 },
                  { m: 'Tháng 7', count: 5 },
                  { m: 'Tháng 8', count: 3, current: true },
                  { m: 'Tháng 9', count: 1 },
                  { m: 'Tháng 10', count: 2 },
                  { m: 'Tháng 11', count: 4 },
                  { m: 'Tháng 12', count: 6 },
                ].map((item) => (
                  <div
                    key={item.m}
                    className={`p-3 rounded-xl border text-center space-y-1 ${item.current
                      ? 'bg-[#FEF6E9] border-[#E8CE9D] text-[#8C5D17]'
                      : 'bg-[#FAF8F2] border-[#EAE5D9] text-stone-700'
                      }`}
                  >
                    <p className="text-xs font-serif font-bold">{item.m}</p>
                    <p className="text-[11px]">
                      {item.count > 0 ? `${item.count} ngày giỗ` : 'Không có giỗ'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER ĐIỀU HƯỚNG */}
      <footer className="max-w-6xl mx-auto px-6 mt-16 text-center text-xs text-stone-400">
        <p className="font-serif">
          Gia Phả Phạm Văn • Di Sản Số Đương Đại • Bản Thử Nghiệm Chuẩn Hóa Từng Component
        </p>
      </footer>
    </div>
  );

  // =========================================================================
  // HELPER RENDER THẺ NODE CHUẨN KÍCH THƯỚC (200x96px) CHO CÂY GIA PHẢ
  // =========================================================================
  function renderTreeNode(memberId: string) {
    const member = TREE_MEMBERS[memberId];
    if (!member) return null;

    const isSelected = selectedTreeMemberId === memberId;
    const isAnnivFocused =
      treeViewMode === 'anniversary' &&
      ((activeAnnivFocus === 'chien' && memberId === 'chien') ||
        (activeAnnivFocus === 'mo' && memberId === 'mo') ||
        (activeAnnivFocus === 'dong' && memberId === 'dong') ||
        (activeAnnivFocus === 'lieu' && memberId === 'lieu'));

    const isDimmed = treeViewMode === 'anniversary' && activeAnnivFocus !== 'none' && !isAnnivFocused;

    // Xác định màu sắc theo Tree Palette đang chọn
    let borderStyle = '';
    let avatarStyle = '';
    let seniorBadgeStyle = '';

    if (treePalette === 'bright_crisp') {
      // PA 1: Sáng & Trong Trẻo (Tươi Mới - Khuyên Dùng)
      if (member.isGhost) {
        borderStyle = 'border-dashed border-amber-400/80 hover:border-amber-500 bg-amber-50/30';
        avatarStyle = 'bg-amber-50 text-amber-800 border border-amber-200';
      } else if (member.gender === 'male') {
        borderStyle = 'border-sky-400/80 hover:border-sky-500 bg-white';
        avatarStyle = 'bg-sky-50 text-sky-700 border border-sky-200';
        seniorBadgeStyle = 'text-sky-700 bg-sky-50 border-sky-200';
      } else {
        borderStyle = 'border-rose-400/80 hover:border-rose-500 bg-white';
        avatarStyle = 'bg-rose-50 text-rose-700 border border-rose-200';
      }
    } else if (treePalette === 'indigo_plum') {
      // PA 2: Chàm Cổ & Cánh Sen Trầm
      if (member.isGhost) {
        borderStyle = 'border-dashed border-[#B8860B]/70 hover:border-[#B8860B] bg-[#FFFDF8]';
        avatarStyle = 'bg-[#FEF6E9] text-[#8C5D17] border border-[#E8CE9D]';
      } else if (member.gender === 'male') {
        borderStyle = 'border-[#234E70]/60 hover:border-[#234E70]';
        avatarStyle = 'bg-[#E8EFF5] text-[#1B3B54] border border-[#B9D0E2]';
        seniorBadgeStyle = 'text-[#1B3B54] bg-[#E8EFF5] border-[#B9D0E2]';
      } else {
        borderStyle = 'border-[#8C4A5A]/50 hover:border-[#8C4A5A]';
        avatarStyle = 'bg-[#F8EFF1] text-[#702A3C] border border-[#E5CAD0]';
      }
    } else if (treePalette === 'earth_wood') {
      // PA 2: Thổ Mộc & Đất Nung (Rêu Phong & Gạch Cổ)
      if (member.isGhost) {
        borderStyle = 'border-dashed border-[#C68B59]/70 hover:border-[#C68B59] bg-[#FDF8F3]';
        avatarStyle = 'bg-[#F8EFE6] text-[#8C5528] border border-[#DFC3A6]';
      } else if (member.gender === 'male') {
        borderStyle = 'border-[#1E4E45]/60 hover:border-[#1E4E45]';
        avatarStyle = 'bg-[#E8F0ED] text-[#143B34] border border-[#BDD4CD]';
        seniorBadgeStyle = 'text-[#143B34] bg-[#E8F0ED] border-[#BDD4CD]';
      } else {
        borderStyle = 'border-[#A0522D]/50 hover:border-[#A0522D]';
        avatarStyle = 'bg-[#FAF0E6] text-[#7B3A1C] border border-[#E4CEB8]';
      }
    } else if (treePalette === 'ink_wash') {
      // PA 3: Thủy Mặc Đơn Sắc (Tối Giản Tinh Tế)
      if (member.isGhost) {
        borderStyle = 'border-dashed border-stone-400 hover:border-stone-600 bg-stone-50/50';
        avatarStyle = 'bg-stone-100 text-stone-700 border border-stone-300';
      } else if (member.gender === 'male') {
        borderStyle = 'border-stone-400 hover:border-stone-700';
        avatarStyle = 'bg-[#ECEAE4] text-stone-800 border border-[#D8D2C4]';
        seniorBadgeStyle = 'text-stone-800 bg-[#EFECE4] border-[#D8D2C4]';
      } else {
        borderStyle = 'border-stone-300 hover:border-stone-600';
        avatarStyle = 'bg-[#F5F2EB] text-stone-700 border border-[#DFD9CB]';
      }
    } else {
      // Bản cũ: Neon Xanh Lam & Hồng
      if (member.isGhost) {
        borderStyle = 'border-dashed border-amber-400 hover:border-amber-500';
        avatarStyle = 'bg-amber-100 text-amber-800 border border-amber-300';
      } else if (member.gender === 'male') {
        borderStyle = 'border-blue-500/50 hover:border-blue-500';
        avatarStyle = 'bg-blue-100 text-blue-700';
        seniorBadgeStyle = 'text-blue-700 bg-blue-50 border-blue-200';
      } else {
        borderStyle = 'border-pink-500/50 hover:border-pink-500';
        avatarStyle = 'bg-pink-100 text-pink-700';
      }
    }

    return (
      <div
        key={member.id}
        onClick={() => setSelectedTreeMemberId(member.id)}
        className={`w-[200px] h-[96px] rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none relative ${borderStyle} ${isAnnivFocused
          ? 'bg-[#FFFDF9] ring-2 ring-amber-500/80 shadow-[0_4px_16px_rgba(217,119,6,0.25)] border-amber-400 scale-[1.03] z-20'
          : isSelected
            ? 'bg-white ring-2 ring-[#0F382C] shadow-md z-10'
            : isDimmed
              ? 'bg-white/60 opacity-40 filter blur-[0.2px]'
              : 'bg-white shadow-2xs hover:shadow-md hover:scale-[1.01]'
          }`}
      >
        {/* Header Thẻ */}
        <div className="h-[18px] shrink-0 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 font-semibold text-stone-500 text-[10px]">
            <span>Đời {member.generation}</span>
            {member.isSenior && (
              <span
                className={`text-[9px] font-bold px-1 rounded border ${seniorBadgeStyle || 'text-blue-700 bg-blue-50 border-blue-200'
                  }`}
              >
                (Trưởng)
              </span>
            )}
          </div>

          {member.isRoot ? (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Cụ Tổ
            </span>
          ) : isAnnivFocused ? (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#8C5D17] bg-[#FEF6E9] px-1 py-0.2 rounded border border-[#E8CE9D]">
              <Flame className="w-2.5 h-2.5 text-amber-600" /> Giỗ
            </span>
          ) : member.isGhost ? (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-300">
              <Link2 className="w-2.5 h-2.5" /> Nội tộc
            </span>
          ) : member.lifeStatus === 'living' ? (
            <span
              className={`w-1.5 h-1.5 rounded-full ${treePalette === 'indigo_plum'
                ? 'bg-emerald-600'
                : treePalette === 'earth_wood'
                  ? 'bg-[#2D6A4F]'
                  : treePalette === 'ink_wash'
                    ? 'bg-emerald-700'
                    : 'bg-emerald-500'
                }`}
              title="Còn sống"
            />
          ) : (
            <span
              className={`w-1.5 h-1.5 rounded-full ${treePalette === 'indigo_plum'
                ? 'bg-[#78716C]'
                : treePalette === 'earth_wood'
                  ? 'bg-[#8C7A6B]'
                  : treePalette === 'ink_wash'
                    ? 'bg-stone-500'
                    : 'bg-slate-400'
                }`}
              title="Đã mất"
            />
          )}
        </div>

        {/* Thân Thẻ: Avatar & Tên (Neo Y Cố Định) */}
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-serif font-bold text-xs shrink-0 ${avatarStyle}`}
          >
            {member.initials}
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <p className="truncate text-[12px] font-bold text-stone-900 leading-tight">
              {member.fullName}
            </p>
            <p className="truncate text-[10px] text-stone-500 mt-0.5">
              {member.lifeStatus === 'deceased' && member.birthYear && member.deathYear
                ? `${member.birthYear} – ${member.deathYear} (${member.deathYear - member.birthYear}t)`
                : member.birthYear
                  ? `SN: ${member.birthYear}`
                  : member.roleTitle || 'Thành viên'}
            </p>
          </div>
        </div>

        {/* Footer Thẻ */}
        <div className="mt-auto h-[16px] shrink-0 flex items-center justify-between text-[9px] pt-1 border-t border-stone-100 text-stone-400">
          <span className="truncate max-w-[110px]">
            {member.isGhost
              ? member.ghostBranch
              : member.lifeStatus === 'deceased'
                ? member.deathLunar || 'Âm lịch'
                : member.roleTitle || 'Còn sống'}
          </span>
          {member.childCount != null && member.childCount > 0 ? (
            <span className="font-semibold text-emerald-800">{member.childCount} con</span>
          ) : (
            <span>{member.gender === 'male' ? 'Nam' : 'Nữ'}</span>
          )}
        </div>
      </div>
    );
  }
}
