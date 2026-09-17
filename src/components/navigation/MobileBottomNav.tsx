'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Compass } from 'lucide-react';
import FamilyTreeIcon from '@/components/icons/FamilyTreeIcon';
import type { ClanFeatureFlags } from '@/types/database';
import { resolveFeatureFlags } from '@/lib/admin/admin-engine';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Trang Chủ',
    href: '/',
    icon: Home,
  },
  {
    label: 'Phả Hệ',
    href: '/tree',
    icon: FamilyTreeIcon,
  },
  {
    label: 'Lịch Giỗ',
    href: '/anniversaries',
    icon: Calendar,
  },
  {
    label: 'Xưng hô',
    href: '/kinship',
    icon: Compass,
  },
];

export interface MobileBottomNavProps {
  isGuest?: boolean;
  enablePublicTree?: boolean;
  featureFlags?: ClanFeatureFlags;
  isSuperAdmin?: boolean;
}

export default function MobileBottomNav({
  isGuest = false,
  enablePublicTree = true,
  featureFlags,
  isSuperAdmin = false,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  // Màn hình Login Gate là cổng đăng nhập tập trung, không hiển thị thanh điều hướng đáy
  if (pathname === '/login-gate') {
    return null;
  }

  const flags = featureFlags ?? resolveFeatureFlags(undefined);

  // Lọc danh sách items theo quyền truy cập của Guest và Feature Flags
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.href === '/') return true; // '/' luôn hiển thị

    if (item.href === '/tree') {
      return !isGuest || enablePublicTree;
    }

    if (item.href === '/anniversaries') {
      if (isGuest) return false;
      return flags.enable_anniversaries || isSuperAdmin;
    }

    if (item.href === '/kinship') {
      if (isGuest) return false;
      return flags.enable_kinship_lookup || isSuperAdmin;
    }

    return true;
  });

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Điều hướng chính di động"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shadow-lg px-2 h-16 flex items-center justify-around"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 dark:bg-emerald-950/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95'
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-transform ${
                isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'
              }`}
            />
            <span
              className={`text-[11px] mt-0.5 tracking-tight ${
                isActive ? 'font-bold' : 'font-medium'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
