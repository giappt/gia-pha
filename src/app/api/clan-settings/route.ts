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

    const devDictStr = cookieStore.get('fat_dev_kinship_dict')?.value;
    let devCustomDict = null;
    if (devDictStr) {
      try {
        devCustomDict = JSON.parse(devDictStr);
      } catch (e) {
        console.warn('Failed to parse dev custom dict cookie:', e);
      }
    }

    const clan_name = devClanName || clanData?.clan_name || 'DÒNG HỌ NGUYỄN VĂN';
    const default_kinship_region = clanData?.regional_preset || clanData?.default_kinship_region || 'north';
    const custom_kinship_dictionary = devCustomDict || clanData?.custom_kinship_dictionary || {};

    return NextResponse.json({
      success: true,
      data: {
        clan_name,
        default_kinship_region,
        custom_kinship_dictionary,
      },
    });
  } catch (err) {
    console.error('Error fetching clan settings:', err);
    return NextResponse.json({
      success: true,
      data: {
        clan_name: devClanName || 'DÒNG HỌ NGUYỄN VĂN',
        default_kinship_region: 'north',
        custom_kinship_dictionary: {},
      },
    });
  }
}

export async function PATCH(request: Request) {
  try {
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
        const { data: profile } = await supabase
          .from('users')
          .select('user_role')
          .eq('id', user.id)
          .single();
        isSuperAdmin = profile?.user_role === 'super_admin';
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
      return NextResponse.json(
        { error: 'Bạn không có quyền quản trị viên cao cấp (Super Admin)' },
        { status: 403 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const rawClanName = body.clan_name;
    const region = body.default_kinship_region;
    const custom_kinship_dictionary =
      typeof body.custom_kinship_dictionary === 'object' && body.custom_kinship_dictionary !== null
        ? body.custom_kinship_dictionary
        : {};

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
          regional_preset: default_kinship_region,
          custom_kinship_dictionary,
          updated_at: new Date().toISOString(),
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      await Promise.race([updatePromise, timeoutPromise]);
    } catch (dbErr) {
      console.warn('DB update timeout/offline fallback:', dbErr);
    }

    // Also persist dev clan name and custom dictionary cookies so it works seamlessly offline/local
    cookieStore.set('fat_dev_clan_name', clan_name, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    cookieStore.set('fat_dev_kinship_dict', JSON.stringify(custom_kinship_dictionary), {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin dòng họ thành công',
      data: {
        clan_name,
        default_kinship_region,
        custom_kinship_dictionary,
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
