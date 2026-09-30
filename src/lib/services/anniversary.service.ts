import { createClient } from '@/lib/supabase/server';
import { MemberRecord } from '@/types/tree';
import { AnniversaryDayGroup } from '@/types/anniversary';
import { getUpcomingAnniversaries, getExtendedFamilyMemberIds } from '@/lib/anniversaries/anniversary-engine';
import { buildSpouseMap } from '@/lib/kinship-engine/lca-finder';
import { KinshipRegion, CustomKinshipDictionary } from '@/types/kinship';

export interface AnniversaryFeedOptions {
  daysAhead?: number;
  viewerMemberId?: string;
  branch?: string;
  scope?: string;
  region?: KinshipRegion;
  customDictionary?: CustomKinshipDictionary | null;
  referenceDate?: Date;
  // Hỗ trợ inject dữ liệu phục vụ Unit Test và môi trường tách biệt DB
  injectedMembers?: MemberRecord[];
  injectedBranches?: any[];
  injectedSpouseRelations?: any[];
}

/**
 * Domain Service tập trung duy nhất (SSOT) cho toàn bộ dữ liệu Lịch Giỗ.
 * Chịu trách nhiệm nạp DB, phân giải quan hệ họ hàng, cấu hình phân chi (Ngành, Chi),
 * tính toán ngày giỗ và trả về feed đồng nhất cho Home, API và Cron.
 */
export async function getUpcomingAnniversariesFeed(
  options: AnniversaryFeedOptions = {}
): Promise<AnniversaryDayGroup[]> {
  const {
    daysAhead = 30,
    viewerMemberId,
    branch,
    scope,
    referenceDate,
    injectedMembers,
    injectedBranches,
    injectedSpouseRelations,
  } = options;

  let members: MemberRecord[] = injectedMembers || [];
  let branches: any[] = injectedBranches || [];
  let spouseRelations: any[] = injectedSpouseRelations || [];
  let region: KinshipRegion = options.region || 'north';
  let customDictionary: CustomKinshipDictionary | null = options.customDictionary || null;
  let spouseMap: Map<string, string[]> | undefined;

  // Nếu không được inject sẵn, tiến hành nạp từ database Supabase
  if (!injectedMembers) {
    try {
      const supabase = createClient();

      // Nạp cấu hình từ điển, vùng miền và cây phân chi SSOT từ clan_settings
      try {
        const { data: clanSettings } = await supabase
          .from('clan_settings')
          .select('regional_preset, custom_kinship_dictionary, branches')
          .limit(1)
          .maybeSingle();

        const effectiveRegion = clanSettings?.regional_preset || (clanSettings as any)?.default_kinship_region;
        if (effectiveRegion && !options.region) {
          region = effectiveRegion as KinshipRegion;
        }
        if (clanSettings?.custom_kinship_dictionary && !options.customDictionary) {
          customDictionary = clanSettings.custom_kinship_dictionary as CustomKinshipDictionary;
        }
        if (clanSettings?.branches && Array.isArray(clanSettings.branches) && branches.length === 0) {
          branches = clanSettings.branches;
        }
      } catch {
        // Bỏ qua lỗi cấu hình settings
      }

      // Nạp danh sách liên kết hôn phối từ database
      try {
        const { data: dbSpouses } = await supabase
          .from('spouse_relations')
          .select('member_a_id, member_b_id');
        if (dbSpouses && dbSpouses.length > 0 && spouseRelations.length === 0) {
          spouseRelations = dbSpouses;
        }
      } catch {
        // Bỏ qua lỗi quan hệ hôn phối
      }

      // Nạp danh sách thành viên dòng họ
      try {
        const { data: dbMembers, error } = await supabase
          .from('members')
          .select('*')
          .order('generation_level', { ascending: true });

        if (!error && dbMembers && dbMembers.length > 0) {
          members = dbMembers as unknown as MemberRecord[];
        }
      } catch {
        members = [];
      }
    } catch {
      // Bỏ qua lỗi kết nối tổng thể
    }
  }

  if (spouseRelations && spouseRelations.length > 0) {
    spouseMap = buildSpouseMap(spouseRelations, undefined);
  }

  let feed = getUpcomingAnniversaries(members, {
    daysAhead,
    referenceDate,
    viewerMemberId,
    branchFilter: branch,
    region,
    customDictionary,
    spouseMap,
    branches,
    spouseRelations,
  });

  // Lọc theo phạm vi thân tộc mở rộng của người xem nếu có yêu cầu scope=my_lineage
  if (scope === 'my_lineage' && viewerMemberId && members.length > 0) {
    const lineageIds = getExtendedFamilyMemberIds(viewerMemberId, members, spouseMap);
    feed = feed
      .map((group) => ({
        ...group,
        members: group.members.filter((m) => lineageIds.has(m.id)),
      }))
      .filter((group) => group.members.length > 0);
  }

  return feed;
}
