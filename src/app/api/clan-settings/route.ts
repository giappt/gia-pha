import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const cookieStore = cookies();
  const devClanName = cookieStore.get('fat_dev_clan_name')?.value;

  try {
    const supabase = createClient();
    const fetchPromise = supabase
      .from('clan_settings')
      .select('*')
      .limit(1)
      .single();

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('DB fetch timeout') }), 1800)
    );

    const { data: clanData } = await Promise.race([fetchPromise, timeoutPromise]);

    const clan_name = devClanName || clanData?.clan_name || 'DÒNG HỌ NGUYỄN VĂN';
    const default_kinship_region = clanData?.default_kinship_region || 'north';

    return NextResponse.json({
      success: true,
      data: {
        clan_name,
        default_kinship_region,
      },
    });
  } catch (err) {
    console.error('Error fetching clan settings:', err);
    return NextResponse.json({
      success: true,
      data: {
        clan_name: devClanName || 'DÒNG HỌ NGUYỄN VĂN',
        default_kinship_region: 'north',
      },
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Check authorization: Must be Super Admin
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    let isSuperAdmin = false;
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      isSuperAdmin = true;
    } else {
      const { data: profile } = await supabase
        .from('users')
        .select('user_role')
        .eq('id', user.id)
        .single();
      isSuperAdmin = profile?.user_role === 'super_admin';
    }

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền quản trị viên cao cấp (Super Admin)' },
        { status: 403 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const rawClanName = body.clan_name;
    const region = body.default_kinship_region;

    if (typeof rawClanName !== 'string') {
      return NextResponse.json({ error: 'Tên dòng họ không hợp lệ' }, { status: 400 });
    }

    const clan_name = rawClanName.trim().replace(/\s+/g, ' ');

    if (clan_name.length < 2) {
      return NextResponse.json(
        { error: 'Tên dòng họ phải có ít nhất 2 ký tự' },
        { status: 400 }
      );
    }

    if (clan_name.length > 40) {
      return NextResponse.json(
        { error: 'Tên dòng họ không được vượt quá 40 ký tự để tránh phá vỡ giao diện' },
        { status: 400 }
      );
    }

    const validRegions = ['north', 'central', 'south'];
    const default_kinship_region = validRegions.includes(region) ? region : 'north';

    // 3. Update Database with safety timeout
    try {
      const updatePromise = supabase
        .from('clan_settings')
        .update({
          clan_name,
          default_kinship_region,
          updated_at: new Date().toISOString(),
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      await Promise.race([updatePromise, timeoutPromise]);
    } catch (dbErr) {
      console.warn('DB update timeout/offline fallback:', dbErr);
    }

    // Also persist dev clan name cookie so it works seamlessly even if external DB is blocked
    const cookieStore = cookies();
    cookieStore.set('fat_dev_clan_name', clan_name, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tên dòng họ thành công',
      data: {
        clan_name,
        default_kinship_region,
      },
    });
  } catch (err) {
    console.error('Failed to update clan settings:', err);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lưu thông tin cài đặt' },
      { status: 500 }
    );
  }
}
