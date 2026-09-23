import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { FamilyTreeCanvas } from '@/components/tree/FamilyTreeCanvas';
import { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import type { BranchNode, UserRole, ClanFeatureFlags } from '@/types/database';
import { canManageTree } from '@/lib/auth/permissions';
import { resolveEffectiveRole, resolveFeatureFlags, type ImpersonatedRole } from '@/lib/admin/admin-engine';

export const metadata: Metadata = {
  title: 'Cây Phả Hệ Tương Tác - FAT Family Tree',
  description: 'Màn hình trực quan hóa cây phả hệ gia tộc đa thế hệ, hỗ trợ pan zoom và Ghost Node hôn nhân nội tộc.',
};

export default async function TreePage() {
  const cookieStore = cookies();
  let members: MemberRecord[] = [];
  let spouseRelations: SpouseRelationRecord[] = [];
  let clanName = 'GIA PHẢ PHẠM VĂN';
  let clanBranches: BranchNode[] = [];
  let rootAncestorId: string | null = null;
  let userRole: UserRole = 'viewer';
  let featureFlags: ClanFeatureFlags = resolveFeatureFlags(undefined);

  try {
    const supabase = createClient();

    // 1. Trích xuất vai trò người dùng (Dev Cookie trước, Supabase Auth sau)
    const devUserCookie = cookieStore.get('fat_dev_user')?.value;
    if (devUserCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devUserCookie));
        if (parsed?.user_role) {
          userRole = parsed.user_role;
        } else if (parsed?.id === '00000000-0000-0000-0000-000000000001') {
          userRole = 'super_admin';
        }
      } catch {}
    } else {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          if (user.id === '00000000-0000-0000-0000-000000000001') {
            userRole = 'super_admin';
          } else if (user.user_metadata?.user_role) {
            userRole = user.user_metadata.user_role;
          } else {
            const { data: profile } = await supabase
              .from('users')
              .select('user_role')
              .eq('id', user.id)
              .maybeSingle();
            if (profile?.user_role) {
              userRole = profile.user_role;
            }
          }
        }
      } catch {}
    }

    const devBranchesStr = cookieStore.get('fat_dev_branches')?.value;
    if (devBranchesStr) {
      try {
        clanBranches = JSON.parse(devBranchesStr);
      } catch {}
    }

    // Lấy thông tin cài đặt dòng họ & feature flags
    const { data: clanSettings } = await supabase
      .from('clan_settings')
      .select('clan_name, branches, root_ancestor_id, feature_flags')
      .limit(1)
      .maybeSingle();

    if (clanSettings?.clan_name) {
      clanName = clanSettings.clan_name;
    }
    if (clanBranches.length === 0 && clanSettings?.branches && Array.isArray(clanSettings.branches)) {
      clanBranches = clanSettings.branches as unknown as BranchNode[];
    }
    if (clanSettings?.root_ancestor_id) {
      rootAncestorId = clanSettings.root_ancestor_id;
    }

    // Đọc feature flags (ưu tiên cookie cache nếu có)
    const cacheCookie = cookieStore.get('fat_feature_flags_cache')?.value;
    const devFlagsCookie = cookieStore.get('fat_dev_feature_flags')?.value;
    const targetCookie = devFlagsCookie || cacheCookie;
    if (targetCookie) {
      try {
        featureFlags = resolveFeatureFlags(JSON.parse(decodeURIComponent(targetCookie)));
      } catch {
        featureFlags = resolveFeatureFlags(clanSettings?.feature_flags);
      }
    } else if (clanSettings?.feature_flags) {
      featureFlags = resolveFeatureFlags(clanSettings.feature_flags);
    }

    // Lấy danh sách thành viên
    const { data: dbMembers, error: memberError } = await supabase
      .from('members')
      .select('*')
      .order('generation_level', { ascending: true })
      .order('birth_order', { ascending: true });

    // Lấy quan hệ hôn phối
    const { data: dbRelations } = await supabase
      .from('spouse_relations')
      .select('*');

    if (!memberError && dbMembers && dbMembers.length > 0) {
      members = dbMembers as unknown as MemberRecord[];
      spouseRelations = (dbRelations || []) as unknown as SpouseRelationRecord[];
    } else {
      members = [];
      spouseRelations = [];
    }
  } catch {
    members = [];
    spouseRelations = [];
  }

  // Đọc chế độ Đóng Vai (Role Impersonation) để điều chỉnh quyền hạn và hiển thị thực tế
  const impersonatedRole = cookieStore.get('fat_impersonated_role')?.value as ImpersonatedRole;
  const effectiveRole = resolveEffectiveRole(userRole, impersonatedRole);
  const canManage = canManageTree(effectiveRole === 'guest' ? 'viewer' : effectiveRole);

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden flex flex-col">
      <FamilyTreeCanvas
        initialMembers={members}
        initialSpouseRelations={spouseRelations}
        clanName={clanName}
        clanBranches={clanBranches}
        rootAncestorId={rootAncestorId}
        userRole={effectiveRole === 'guest' ? 'viewer' : effectiveRole}
        effectiveRole={effectiveRole}
        canManageTree={canManage}
        featureFlags={featureFlags}
      />
    </div>
  );
}
