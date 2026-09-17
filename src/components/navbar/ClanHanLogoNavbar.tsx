'use client';

import ClanHanLogo from '@/components/icons/ClanHanLogo';

export default function ClanHanLogoNavbar() {
  return (
    <div
      id="navbar-clan-han-logo"
      className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-700/25 group-hover:bg-emerald-700 group-hover:scale-105 transition-all duration-200 select-none shrink-0 border border-emerald-500/30 leading-none overflow-hidden"
    >
      <ClanHanLogo size={28} className="text-white" />
    </div>
  );
}

