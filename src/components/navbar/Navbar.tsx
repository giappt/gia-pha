import Link from 'next/link';
import AuthButton from '@/components/auth/AuthButton';
import ThemeToggle from '@/components/theme/ThemeToggle';
import FamilyTreeIcon from '@/components/icons/FamilyTreeIcon';
import ClanHanLogoNavbar from '@/components/navbar/ClanHanLogoNavbar';
import { createClient } from '@/lib/supabase/server';
import { Calendar, Compass } from 'lucide-react';
import type { UserProfile } from '@/types/database';

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile: UserProfile | null = null;
  if (user) {
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      userProfile = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || 'Giáp Phạm',
        user_role: 'super_admin',
        avatar_url: null,
        linked_member_id: null,
        assigned_branch_code: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        userProfile = profile;
      } catch {
        // profile fallback
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Clan Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <ClanHanLogoNavbar />
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-50 tracking-tight leading-none group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                GIA PHẢ HỌ PHẠM
              </span>
              <span className="text-[11px] font-medium text-emerald-700/90 dark:text-emerald-400/90 mt-1 leading-none tracking-wide">
                FAT · Phả Hệ Số Hiện Đại
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/tree"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
          >
            <FamilyTreeIcon className="w-4 h-4 text-emerald-600" />
            <span>Cây Phả Hệ</span>
          </Link>
          <Link
            href="/anniversaries"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Lịch Giỗ</span>
          </Link>
          <Link
            href="/kinship"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all"
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Hỏi Vai Vế</span>
          </Link>
        </nav>

        {/* Right: Theme Toggle & Auth Action (Đã tinh gọn, bỏ nút Quản Trị) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <AuthButton initialUser={user} initialProfile={userProfile} />
        </div>
      </div>
    </header>
  );
}
