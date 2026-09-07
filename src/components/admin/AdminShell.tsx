'use client';

import React, { useState, useEffect } from 'react';
import { Menu, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdminSidebar from './AdminSidebar';

interface AdminShellProps {
  children: React.ReactNode;
  clanName?: string;
}

export default function AdminShell({ children, clanName = 'DÒNG HỌ NGUYỄN VĂN' }: AdminShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="mobile-admin-menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Quản Trị Dòng Họ
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Cây</span>
        </Link>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Slide-over Drawer */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-64 relative shadow-2xl animate-in slide-in-from-left duration-200">
              <AdminSidebar
                clanName={clanName}
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0 z-20">
        <AdminSidebar clanName={clanName} />
      </div>

      {/* Main Fluid Content Area */}
      <main className="flex-1 min-w-0 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
