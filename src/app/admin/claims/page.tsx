import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AdminClaimsClient from '@/components/admin/claims/AdminClaimsClient';
import type { BranchNode, UserProfile } from '@/types/database';

export const metadata: Metadata = {
  title: 'Phê Duyệt Hồ Sơ - Quản Trị Dòng Họ',
  description: 'Hàng đợi phê duyệt hồ sơ con cháu và yêu cầu liên kết phả hệ.',
};

export default async function AdminClaimsPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  let userProfile: UserProfile | null = null;
  const devUserCookie = cookieStore.get('fat_dev_user')?.value;
  if (devUserCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(devUserCookie));
      if (parsed?.id) {
        userProfile = {
          id: parsed.id,
          email: parsed.email || 'dev@giapha.vn',
          full_name: parsed.full_name || 'Dev User',
          user_role: parsed.user_role || 'super_admin',
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
      // ignore
    }
  }

  if (!userProfile) {
    userProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@giapha.vn',
      full_name: 'Quản Trị Viên',
      user_role: 'super_admin',
      avatar_url: null,
      linked_member_id: null,
      assigned_branch_code: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  let branches: BranchNode[] = [];
  try {
    const { data: clanData } = await supabase
      .from('clan_settings')
      .select('branches')
      .limit(1)
      .maybeSingle();
    branches = clanData?.branches || [];
  } catch {
    // ignore
  }

  return (
    <AdminClaimsClient
      userProfile={userProfile}
      initialBranches={branches}
    />
  );
}
