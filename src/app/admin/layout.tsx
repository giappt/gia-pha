import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';
import type { UserRole } from '@/types/database';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const cookieStore = cookies();
  const headerList = headers();
  const pathname = headerList.get('x-pathname') || '';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: UserRole = 'viewer';

  if (user) {
    if (
      user.id === '00000000-0000-0000-0000-000000000001' ||
      user.email?.toLowerCase() === 'giap.pt.90@gmail.com'
    ) {
      userRole = 'super_admin';
    } else {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('user_role, linked_member_id')
          .eq('id', user.id)
          .single();
        if (profile?.user_role) {
          userRole = profile.user_role as UserRole;
        } else if (profile?.linked_member_id) {
          userRole = 'claimed_member';
        }
      } catch {
        userRole = 'viewer';
      }
    }
  } else if (process.env.NODE_ENV === 'development') {
    const devUserCookie = cookieStore.get('fat_dev_user');
    if (devUserCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devUserCookie.value));
        if (parsed.user_role === 'super_admin' || parsed.id === '00000000-0000-0000-0000-000000000001') {
          userRole = 'super_admin';
        } else if (parsed.user_role === 'branch_editor') {
          userRole = 'branch_editor';
        } else if (parsed.user_role === 'claimed_member' || parsed.linked_member_id) {
          userRole = 'claimed_member';
        }
      } catch {
        // ignore
      }
    }
  }

  // Đọc chế độ đóng vai (Role Impersonation) để phục vụ nghiệm thu
  const impersonatedRole = cookieStore.get('fat_impersonated_role')?.value;
  if (
    impersonatedRole &&
    (userRole === 'super_admin' || process.env.NODE_ENV === 'development')
  ) {
    if (
      impersonatedRole === 'claimed_member' ||
      impersonatedRole === 'branch_editor' ||
      impersonatedRole === 'viewer'
    ) {
      userRole = impersonatedRole as UserRole;
    }
  }

  // Phân quyền truy cập theo vai trò
  if (userRole === 'claimed_member') {
    // Thành viên Gia Đình Của Bạn chỉ được truy cập khu vực phê duyệt hồ sơ con cháu (/admin/claims)
    if (pathname && !pathname.startsWith('/admin/claims')) {
      redirect('/?auth_error=unauthorized_admin');
    }
  } else if (userRole !== 'super_admin' && userRole !== 'branch_editor') {
    // Khách hoặc viewer không có quyền vào bất kỳ trang admin nào
    redirect('/?auth_error=unauthorized_admin');
  }

  // Fetch clan name
  let clanName = cookieStore.get('fat_dev_clan_name')?.value;
  if (!clanName) {
    try {
      const { data: clanData } = await supabase
        .from('clan_settings')
        .select('clan_name')
        .limit(1)
        .maybeSingle();
      if (clanData?.clan_name) {
        clanName = clanData.clan_name;
      }
    } catch {
      // ignore
    }
  }

  return (
    <AdminShell clanName={clanName || 'GIA PHẢ PHẠM VĂN'} userRole={userRole}>
      {children}
    </AdminShell>
  );
}
