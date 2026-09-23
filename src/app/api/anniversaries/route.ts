import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MemberRecord } from '@/types/tree';
import { getUpcomingAnniversaries } from '@/lib/anniversaries/anniversary-engine';
import { buildSpouseMap } from '@/lib/kinship-engine/lca-finder';
import { KinshipRegion, CustomKinshipDictionary } from '@/types/kinship';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const branch = searchParams.get('branch') || undefined;
    const viewerMemberId = searchParams.get('viewerMemberId') || undefined;

    let daysAhead = 30;
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 90) {
        daysAhead = parsed;
      }
    }

    let effectiveViewerId = viewerMemberId;
    let members: MemberRecord[] = [];
    let region: KinshipRegion = 'north';
    let customDictionary: CustomKinshipDictionary | null = null;
    let spouseMap: Map<string, string[]> | undefined;

    try {
      const supabase = createClient();

      // Nếu chưa có viewerMemberId từ query, thử lấy từ session của user đăng nhập
      if (!effectiveViewerId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('users')
              .select('linked_member_id')
              .eq('id', user.id)
              .single();
            if (profile?.linked_member_id) {
              effectiveViewerId = profile.linked_member_id;
            }
          }
        } catch {
          // Bỏ qua lỗi auth để fallback khách
        }
      }

      // Nạp cấu hình từ điển và vùng miền SSOT từ clan_settings
      try {
        const { data: clanSettings } = await supabase
          .from('clan_settings')
          .select('default_kinship_region, custom_kinship_dictionary')
          .limit(1)
          .maybeSingle();

        if (clanSettings?.default_kinship_region) {
          region = clanSettings.default_kinship_region as KinshipRegion;
        }
        if (clanSettings?.custom_kinship_dictionary) {
          customDictionary = clanSettings.custom_kinship_dictionary as CustomKinshipDictionary;
        }
      } catch {
        // Bỏ qua lỗi cấu hình settings
      }

      // Nạp danh sách liên kết hôn phối từ database
      try {
        const { data: dbSpouses } = await supabase
          .from('spouse_relations')
          .select('member_a_id, member_b_id');
        if (dbSpouses && dbSpouses.length > 0) {
          spouseMap = buildSpouseMap(dbSpouses, undefined);
        }
      } catch {
        // Bỏ qua lỗi quan hệ hôn phối
      }

      const { data: dbMembers, error } = await supabase
        .from('members')
        .select('*')
        .order('generation_level', { ascending: true });

      if (!error && dbMembers && dbMembers.length > 0) {
        members = dbMembers as unknown as MemberRecord[];
      } else {
        members = [];
      }
    } catch {
      members = [];
    }

    const data = getUpcomingAnniversaries(members, {
      daysAhead,
      viewerMemberId: effectiveViewerId,
      branchFilter: branch,
      region,
      customDictionary,
      spouseMap,
    });

    const totalCount = data.reduce((acc, g) => acc + g.members.length, 0);

    return NextResponse.json({
      success: true,
      data,
      totalCount,
      daysAhead,
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  } catch (error) {
    console.error('Error fetching anniversaries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching anniversaries' },
      { status: 500 }
    );
  }
}
