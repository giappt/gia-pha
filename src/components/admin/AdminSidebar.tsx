'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  GitBranch,
  BookOpen,
  Users,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowLeft,
  ShieldCheck,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      {
        href: '/admin',
        label: 'Bàn Điều Hành',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'PHẢ HỆ & QUY ƯỚC',
    items: [
      {
        href: '/admin/profile',
        label: 'Căn Cước Dòng Họ',
        icon: Landmark,
      },
      {
        href: '/admin/branches',
        label: 'Cấu Trúc Ngành/Chi',
        icon: GitBranch,
      },
      {
        href: '/admin/kinship',
        label: 'Quy Ước Xưng Hô',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'THÀNH VIÊN & TÀI KHOẢN',
    items: [
      {
        href: '/admin/users',
        label: 'Quản Lý Tài Khoản',
        icon: Users,
      },
    ],
  },
  {
    title: 'VẬN HÀNH & HỆ THỐNG',
    items: [
      {
        href: '/admin/features',
        label: 'Bật/Tắt Tính Năng',
        icon: SlidersHorizontal,
      },
      {
        href: '/admin/import',
        label: 'Nạp Dữ Liệu Excel',
        icon: FileSpreadsheet,
      },
    ],
  },
];

interface AdminSidebarProps {
  clanName?: string;
  onCloseMobileDrawer?: () => void;
}

export default function AdminSidebar({
  clanName = 'DÒNG HỌ NGUYỄN VĂN',
  onCloseMobileDrawer,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isCurrentActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100">
                KHU VỰC QUẢN TRỊ
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
              {clanName}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {group.title}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const active = isCurrentActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobileDrawer}
                    id={`sidebar-link-${item.href.replace('/admin', '').replace('/', '') || 'dashboard'}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                      active
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold border-l-2 border-emerald-600 rounded-l-none shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        active
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Back to Public Home */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Cây Phả Hệ</span>
        </Link>
      </div>
    </aside>
  );
}
