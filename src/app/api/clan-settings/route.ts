import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateBranchTree, DEFAULT_BRANCH_TIERS } from '@/lib/tree-layout/branch-engine';
import { resolveFeatureFlags } from '@/lib/admin/admin-engine';

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

    const devBranchesStr = cookieStore.get('fat_dev_branches')?.value;
    let devBranches = null;
    if (devBranchesStr) {
      try {
        devBranches = JSON.parse(devBranchesStr);
      } catch (e) {
        console.warn('Failed to parse dev branches cookie:', e);
      }
    }

    const devTiersStr = cookieStore.get('fat_dev_branch_tiers')?.value;
    let devBranchTiers: string[] | null = null;
    if (devTiersStr) {
      try {
        devBranchTiers = JSON.parse(devTiersStr);
      } catch (e) {
        console.warn('Failed to parse dev branch tiers cookie:', e);
      }
    }

    const devFeatureFlagsStr = cookieStore.get('fat_dev_feature_flags')?.value;
    let devFeatureFlags = null;
    if (devFeatureFlagsStr) {
      try {
        devFeatureFlags = JSON.parse(devFeatureFlagsStr);
      } catch (e) {
        console.warn('Failed to parse dev feature flags cookie:', e);
      }
    }

    const clan_name = devClanName || clanData?.clan_name || 'DÒNG HỌ NGUYỄN VĂN';
    const root_ancestor_id = clanData?.root_ancestor_id || null;
    const default_kinship_region = clanData?.regional_preset || clanData?.default_kinship_region || 'north';
    const custom_kinship_dictionary = devCustomDict || clanData?.custom_kinship_dictionary || {};
    const branches = devBranches || (Array.isArray(clanData?.branches) ? clanData.branches : []);
    const branch_tiers = (Array.isArray(devBranchTiers) && devBranchTiers.length > 0)
      ? devBranchTiers
      : (Array.isArray(clanData?.branch_tiers) && clanData.branch_tiers.length > 0)
        ? clanData.branch_tiers
        : DEFAULT_BRANCH_TIERS;
    const feature_flags = resolveFeatureFlags(devFeatureFlags || clanData?.feature_flags);

    return NextResponse.json({
      success: true,
      data: {
        clan_name,
        root_ancestor_id,
        default_kinship_region,
        custom_kinship_dictionary,
        branch_tiers,
        branches,
        feature_flags,
      },
    });
  } catch (err) {
    console.error('Error fetching clan settings:', err);
    return NextResponse.json({
      success: true,
      data: {
        clan_name: devClanName || 'DÒNG HỌ NGUYỄN VĂN',
        root_ancestor_id: null,
        default_kinship_region: 'north',
        custom_kinship_dictionary: {},
        branch_tiers: DEFAULT_BRANCH_TIERS,
        branches: [],
        feature_flags: resolveFeatureFlags(undefined),
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
        : undefined;

    let clan_name: string | undefined;
    if (rawClanName !== undefined) {
      if (typeof rawClanName !== 'string') {
        return NextResponse.json({ error: 'Tên dòng họ không hợp lệ' }, { status: 400 });
      }

      clan_name = rawClanName.trim().replace(/\s+/g, ' ');

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
    }

    let branches = body.branches;
    if (branches !== undefined) {
      if (!Array.isArray(branches)) {
        return NextResponse.json(
          { error: 'Cấu trúc Ngành/Chi phải là một danh sách hợp lệ' },
          { status: 400 }
        );
      }
      const validation = validateBranchTree(branches);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.errors.join('. ') },
          { status: 400 }
        );
      }
    }

    let branch_tiers = body.branch_tiers;
    if (branch_tiers !== undefined) {
      if (!Array.isArray(branch_tiers)) {
        return NextResponse.json(
          { error: 'Danh sách Cấp bậc dòng họ phải là một mảng hợp lệ' },
          { status: 400 }
        );
      }
      const cleanedTiers: string[] = [];
      for (const t of branch_tiers) {
        if (typeof t === 'string') {
          const trimmed = t.trim();
          if (trimmed && !cleanedTiers.includes(trimmed)) {
            cleanedTiers.push(trimmed);
          }
        }
      }
      branch_tiers = cleanedTiers.length > 0 ? cleanedTiers : DEFAULT_BRANCH_TIERS;
    }

    let feature_flags = body.feature_flags !== undefined ? resolveFeatureFlags(body.feature_flags) : undefined;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (clan_name !== undefined) updatePayload.clan_name = clan_name;
    if (region !== undefined) {
      const validRegions = ['north', 'central', 'south'];
      updatePayload.regional_preset = validRegions.includes(region) ? region : 'north';
    }
    if (custom_kinship_dictionary !== undefined) {
      updatePayload.custom_kinship_dictionary = custom_kinship_dictionary;
    }
    if (branches !== undefined) {
      updatePayload.branches = branches;
    }
    if (branch_tiers !== undefined) {
      updatePayload.branch_tiers = branch_tiers;
    }
    if (feature_flags !== undefined) {
      updatePayload.feature_flags = feature_flags;
    }
    if (body.root_ancestor_id !== undefined) {
      updatePayload.root_ancestor_id = body.root_ancestor_id || null;
    }

    // 3. Update Database with safety timeout (using Admin Client to bypass RLS)
    try {
      const adminClient = createAdminClient() || supabase;
      const updatePromise = adminClient
        .from('clan_settings')
        .update(updatePayload)
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      await Promise.race([updatePromise, timeoutPromise]);
    } catch (dbErr) {
      console.warn('DB update timeout/offline fallback:', dbErr);
    }

    // Persist cookies for dev/offline mode
    if (clan_name !== undefined) {
      cookieStore.set('fat_dev_clan_name', clan_name, {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    if (custom_kinship_dictionary !== undefined) {
      cookieStore.set('fat_dev_kinship_dict', JSON.stringify(custom_kinship_dictionary), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    if (branches !== undefined) {
      cookieStore.set('fat_dev_branches', JSON.stringify(branches), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    if (branch_tiers !== undefined) {
      cookieStore.set('fat_dev_branch_tiers', JSON.stringify(branch_tiers), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    if (feature_flags !== undefined) {
      cookieStore.set('fat_dev_feature_flags', JSON.stringify(feature_flags), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      cookieStore.set('fat_feature_flags_cache', JSON.stringify(feature_flags), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 300, // 5 minutes cache
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin dòng họ thành công',
      data: {
        clan_name: clan_name || 'DÒNG HỌ NGUYỄN VĂN',
        root_ancestor_id: updatePayload.root_ancestor_id !== undefined ? updatePayload.root_ancestor_id : (body.root_ancestor_id || null),
        default_kinship_region: updatePayload.regional_preset || 'north',
        custom_kinship_dictionary: custom_kinship_dictionary || {},
        branch_tiers: branch_tiers || DEFAULT_BRANCH_TIERS,
        branches: branches || [],
        feature_flags: feature_flags || resolveFeatureFlags(undefined),
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
