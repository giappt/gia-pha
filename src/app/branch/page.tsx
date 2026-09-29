import { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import BranchPortalClient from '@/components/branch/BranchPortalClient';
import type { BranchNode, UserProfile } from '@/types/database';
import type { MemberRecord, SpouseRelationRecord } from '@/types/tree';

export const metadata: Metadata = {
  title: 'Cổng Quản Trị Chi Nhánh - FAT Family Tree',
  description: 'Khu vực quản trị và phê duyệt hồ sơ con cháu thuộc Chi dòng họ.',
};

export default async function BranchPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  let userProfile: UserProfile | null = null;

  // 1. Trích xuất vai trò từ Dev User Cookie hoặc Supabase Auth
  const devUserCookie = cookieStore.get('fat_dev_user')?.value;
  if (devUserCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(devUserCookie));
      if (parsed?.id) {
        userProfile = {
          id: parsed.id,
          email: parsed.email || 'dev@giapha.vn',
          full_name: parsed.full_name || 'Dev User',
          user_role: parsed.user_role || 'viewer',
          avatar_url: parsed.avatar_url || null,
          linked_member_id: parsed.linked_member_id || null,
          assigned_branch_code: parsed.assigned_branch_code || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch {
      // ignore
    }
  }

  if (!userProfile) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (dbUser) {
            userProfile = dbUser as UserProfile;
          }
        }
      }
    } catch {
      // auth fallback
    }
  }

  // 2. Bảo vệ tuyến: Chỉ cho phép branch_editor hoặc super_admin
  if (
    !userProfile ||
    (userProfile.user_role !== 'branch_editor' && userProfile.user_role !== 'super_admin')
  ) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Khu Vực Quản Trị Chi Nhánh
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 mb-6">
          Khu vực này dành riêng cho Trưởng Chi / Ban Biên Tập Chi Nhánh phụ trách duyệt hồ sơ con cháu. Vui lòng đăng nhập với tài khoản được ủy quyền hoặc liên hệ Ban Quản Trị.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay về Trang Chủ</span>
        </Link>
      </div>
    );
  }

  // 3. Tải dữ liệu ban đầu
  let branches: BranchNode[] = [];
  let members: MemberRecord[] = [];
  let spouseRelations: SpouseRelationRecord[] = [];

  try {
    const [branchesRes, membersRes, spouseRes] = await Promise.all([
      supabase.from('clan_settings').select('branches').limit(1).maybeSingle(),
      supabase.from('members').select('*').order('generation_level', { ascending: true }),
      supabase.from('spouse_relations').select('*'),
    ]);

    branches = branchesRes.data?.branches || [];
    members = (membersRes.data || []) as unknown as MemberRecord[];
    spouseRelations = (spouseRes.data || []) as unknown as SpouseRelationRecord[];
  } catch {
    // db fallback
  }

  return (
    <BranchPortalClient
      userProfile={userProfile!}
      initialBranches={branches}
      initialMembers={members}
      initialSpouseRelations={spouseRelations}
    />
  );
}
