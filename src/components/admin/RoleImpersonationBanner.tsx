'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Shield, X } from 'lucide-react';
import type { ImpersonatedRole } from '@/lib/admin/admin-engine';

const ROLE_DISPLAY_NAMES: Record<string, { label: string; badgeColor: string }> = {
  guest: { label: 'Khách Vãng Lai (Chưa đăng nhập)', badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  viewer: { label: 'Viewer (Đã đăng nhập - Chưa gắn node)', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
  claimed_member: { label: 'Con Cháu Đã Gắn Node (Member)', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  branch_editor: { label: 'Ban Biên Tập Chi (Editor)', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' },
};

export default function RoleImpersonationBanner() {
  const [impersonatedRole, setImpersonatedRole] = useState<ImpersonatedRole>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const readCookie = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)fat_impersonated_role=([^;]+)/);
    return match ? (decodeURIComponent(match[1]) as ImpersonatedRole) : null;
  };

  useEffect(() => {
    setIsClient(true);
    const role = readCookie();
    setImpersonatedRole(role);

    const handleStorage = () => {
      setImpersonatedRole(readCookie());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fat_impersonation_change', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fat_impersonation_change', handleStorage);
    };
  }, []);

  if (!isClient || !impersonatedRole) {
    return null;
  }

  const handleSwitchRole = (newRole: string) => {
    if (newRole === 'exit') {
      handleExit();
      return;
    }
    document.cookie = `fat_impersonated_role=${encodeURIComponent(newRole)}; path=/; max-age=${60 * 60 * 24}`;
    setImpersonatedRole(newRole as ImpersonatedRole);
    window.dispatchEvent(new Event('fat_impersonation_change'));
    router.refresh();
  };

  const handleExit = () => {
    document.cookie = 'fat_impersonated_role=; path=/; max-age=0';
    setImpersonatedRole(null);
    window.dispatchEvent(new Event('fat_impersonation_change'));
    router.refresh();
  };

  const roleInfo = ROLE_DISPLAY_NAMES[impersonatedRole] || {
    label: impersonatedRole,
    badgeColor: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div
      id="role-impersonation-banner"
      className="sticky top-0 z-[100] w-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 text-white shadow-md border-b border-amber-400/50 px-3 py-1.5 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left info badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white shrink-0">
            <Eye className="w-3.5 h-3.5" />
          </span>
          <span className="font-medium hidden sm:inline">Chế độ Thử Nghiệm:</span>
          <span className="font-bold">Đang xem với vai trò:</span>
          <span className="px-2 py-0.5 rounded-md font-bold bg-white text-slate-900 shadow-xs text-[11px]">
            {roleInfo.label}
          </span>
        </div>

        {/* Center & Right controls */}
        <div className="flex items-center gap-2">
          {/* Quick role switcher */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-amber-100 hidden md:inline">Đổi vai:</span>
            <select
              value={impersonatedRole}
              onChange={(e) => handleSwitchRole(e.target.value)}
              className="bg-black/20 hover:bg-black/30 border border-white/30 text-white rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer focus:outline-hidden"
            >
              <option value="guest" className="text-slate-900">Khách vãng lai (Guest)</option>
              <option value="viewer" className="text-slate-900">Thành viên mới (Viewer)</option>
              <option value="claimed_member" className="text-slate-900">Con cháu đã gắn node (Member)</option>
              <option value="branch_editor" className="text-slate-900">Ban biên tập Chi (Editor)</option>
            </select>
          </div>

          {/* Admin link (Always accessible - Never locked out) */}
          <Link
            href="/admin/roles"
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold transition-colors shrink-0"
          >
            <Shield className="w-3 h-3 text-amber-200" />
            <span>Vào Quản Trị</span>
          </Link>

          {/* Exit impersonation button */}
          <button
            type="button"
            onClick={handleExit}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-700/80 hover:bg-rose-700 text-white font-bold transition-colors shrink-0 cursor-pointer"
            title="Thoát chế độ đóng vai và quay lại Super Admin gốc"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>
    </div>
  );
}
