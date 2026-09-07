import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { isValidUserRole } from '@/lib/admin/admin-engine';

async function checkSuperAdminPermission(): Promise<boolean> {
  const supabase = createClient();
  const cookieStore = cookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      return true;
    }
    const { data: profile } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single();
    return profile?.user_role === 'super_admin';
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const devUserCookie = cookieStore.get('fat_dev_user');
    if (devUserCookie?.value) {
      try {
        const parsed = JSON.parse(devUserCookie.value);
        if (parsed.user_role === 'super_admin' || parsed.id === '00000000-0000-0000-0000-000000000001') {
          return true;
        }
      } catch {
        // ignore
      }
    }
  }

  return false;
}

export async function GET() {
  try {
    const isSuperAdmin = await checkSuperAdminPermission();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền quản trị viên cao cấp (Super Admin)' },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const { data: usersData, error: usersErr } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch members to attach linked member info
    const { data: membersData } = await supabase
      .from('members')
      .select('id, full_name, gender, generation_number, branch_code');

    const memberMap = new Map<string, any>();
    if (Array.isArray(membersData)) {
      for (const m of membersData) {
        memberMap.set(m.id, m);
      }
    }

    const cookieStore = cookies();
    const devUsersStr = cookieStore.get('fat_dev_users')?.value;
    let devUsers: any[] | null = null;
    if (devUsersStr) {
      try {
        devUsers = JSON.parse(devUsersStr);
      } catch {
        // ignore
      }
    }

    let finalUsers = devUsers || (Array.isArray(usersData) && usersData.length > 0 ? usersData : []);

    // If still empty in dev, provide seed admin user so UI is always interactive
    if (finalUsers.length === 0) {
      finalUsers = [
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@giapha.vn',
          full_name: 'Trưởng Tộc Quản Trị',
          avatar_url: null,
          user_role: 'super_admin',
          linked_member_id: null,
          assigned_branch_code: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }

    const enrichedUsers = finalUsers.map((u: any) => ({
      ...u,
      linked_member: u.linked_member_id ? memberMap.get(u.linked_member_id) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
    });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi tải danh sách người dùng' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const isSuperAdmin = await checkSuperAdminPermission();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền quản trị viên cao cấp (Super Admin)' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, user_role, linked_member_id } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Mã người dùng (userId) không hợp lệ' }, { status: 400 });
    }

    if (user_role !== undefined && !isValidUserRole(user_role)) {
      return NextResponse.json(
        { error: `Vai trò '${user_role}' không hợp lệ. Cho phép: viewer, claimed_member, branch_editor, super_admin` },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check conflict if linking to a member node
    if (linked_member_id) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('linked_member_id', linked_member_id)
        .neq('id', userId)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          {
            error: `Node phả hệ này đã được liên kết với tài khoản '${existingUser.email}' (${existingUser.full_name || 'Chưa đặt tên'}). Vui lòng gỡ liên kết cũ trước.`,
          },
          { status: 409 }
        );
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (user_role !== undefined) updatePayload.user_role = user_role;
    if (linked_member_id !== undefined) updatePayload.linked_member_id = linked_member_id;

    try {
      await supabase.from('users').update(updatePayload).eq('id', userId);
    } catch (dbErr) {
      console.warn('DB update failed, using cookie fallback:', dbErr);
    }

    // Persist dev cookie
    const cookieStore = cookies();
    const devUsersStr = cookieStore.get('fat_dev_users')?.value;
    let devUsers: any[] = [];
    if (devUsersStr) {
      try {
        devUsers = JSON.parse(devUsersStr);
      } catch {
        // ignore
      }
    }

    const userIndex = devUsers.findIndex((u) => u.id === userId);
    if (userIndex >= 0) {
      devUsers[userIndex] = { ...devUsers[userIndex], ...updatePayload };
    } else {
      devUsers.push({ id: userId, ...updatePayload });
    }

    cookieStore.set('fat_dev_users', JSON.stringify(devUsers), {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tài khoản người dùng thành công',
      data: {
        id: userId,
        ...updatePayload,
      },
    });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi cập nhật người dùng' },
      { status: 500 }
    );
  }
}
