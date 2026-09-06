import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ShieldCheck, ArrowLeft, Settings, Users, FileSpreadsheet, GitBranch } from 'lucide-react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?auth_error=unauthorized_admin');
  }

  let isSuperAdmin = false;
  if (user.id === '00000000-0000-0000-0000-000000000001') {
    isSuperAdmin = true;
  } else {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('user_role')
        .eq('id', user.id)
        .single();
      isSuperAdmin = profile?.user_role === 'super_admin';
    } catch {
      isSuperAdmin = false;
    }
  }

  if (!isSuperAdmin) {
    redirect('/?auth_error=unauthorized_admin');
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col">
      {/* Admin Subheader Bar */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Trang Chủ</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Khu Vực Quản Trị Dòng Họ
              </span>
              <span className="hidden sm:inline-block ml-1 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded">
                Super Admin
              </span>
            </div>
          </div>

          {/* Admin Sub-navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-md transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cài Đặt Dòng Họ</span>
            </Link>
            <Link
              href="/admin/import"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 rounded-md transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nhập File Excel</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
