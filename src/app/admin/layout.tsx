import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const cookieStore = cookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSuperAdmin = false;
  if (user) {
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
  } else if (process.env.NODE_ENV === 'development') {
    const devUserCookie = cookieStore.get('fat_dev_user');
    if (devUserCookie?.value) {
      try {
        const parsed = JSON.parse(devUserCookie.value);
        if (parsed.user_role === 'super_admin' || parsed.id === '00000000-0000-0000-0000-000000000001') {
          isSuperAdmin = true;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!isSuperAdmin) {
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
    <AdminShell clanName={clanName || 'GIA PHẢ PHẠM VĂN'}>
      {children}
    </AdminShell>
  );
}
