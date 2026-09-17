import type { ClanFeatureFlags, UserRole } from '@/types/database';

export const DEFAULT_FEATURE_FLAGS: ClanFeatureFlags = {
  enable_public_tree: true,
  enable_kinship_lookup: true,
  enable_anniversaries: true,
  enable_push_notifications: true,
  allow_member_claims: true,
  mask_living_member_privacy: true,
  maintenance_mode: false,
};

export const VALID_USER_ROLES: UserRole[] = [
  'viewer',
  'claimed_member',
  'branch_editor',
  'super_admin',
];

/**
 * Phân giải bộ cờ tính năng an toàn với fallback mặc định
 */
export function resolveFeatureFlags(flags?: Partial<ClanFeatureFlags> | null): ClanFeatureFlags {
  if (!flags || typeof flags !== 'object') {
    return { ...DEFAULT_FEATURE_FLAGS };
  }

  return {
    enable_public_tree:
      typeof flags.enable_public_tree === 'boolean'
        ? flags.enable_public_tree
        : DEFAULT_FEATURE_FLAGS.enable_public_tree,
    enable_kinship_lookup:
      typeof flags.enable_kinship_lookup === 'boolean'
        ? flags.enable_kinship_lookup
        : DEFAULT_FEATURE_FLAGS.enable_kinship_lookup,
    enable_anniversaries:
      typeof flags.enable_anniversaries === 'boolean'
        ? flags.enable_anniversaries
        : DEFAULT_FEATURE_FLAGS.enable_anniversaries,
    enable_push_notifications:
      typeof flags.enable_push_notifications === 'boolean'
        ? flags.enable_push_notifications
        : DEFAULT_FEATURE_FLAGS.enable_push_notifications,
    allow_member_claims:
      typeof flags.allow_member_claims === 'boolean'
        ? flags.allow_member_claims
        : DEFAULT_FEATURE_FLAGS.allow_member_claims,
    mask_living_member_privacy:
      typeof flags.mask_living_member_privacy === 'boolean'
        ? flags.mask_living_member_privacy
        : DEFAULT_FEATURE_FLAGS.mask_living_member_privacy,
    maintenance_mode:
      typeof flags.maintenance_mode === 'boolean'
        ? flags.maintenance_mode
        : DEFAULT_FEATURE_FLAGS.maintenance_mode,
  };
}

/**
 * Hợp nhất (merge) an toàn các cờ tính năng
 */
export function mergeFeatureFlags(
  current: ClanFeatureFlags,
  patch: Partial<ClanFeatureFlags>
): ClanFeatureFlags {
  return resolveFeatureFlags({
    ...current,
    ...patch,
  });
}

/**
 * Kiểm tra tính hợp lệ của User Role
 */
export function isValidUserRole(role: string): role is UserRole {
  return VALID_USER_ROLES.includes(role as UserRole);
}

export interface ClanVitalityMetrics {
  totalMembers: number;
  males: number;
  females: number;
  deceased: number;
  living: number;
  maxGeneration: number;
  totalUsers: number;
  linkedUsers: number;
  unlinkedUsers: number;
}

/**
 * Tính toán các chỉ số sức sống phả hệ và mức độ phủ sóng tài khoản
 */
export function computeClanVitalityMetrics(
  members: any[] = [],
  users: any[] = []
): ClanVitalityMetrics {
  let males = 0;
  let females = 0;
  let deceased = 0;
  let living = 0;
  let maxGen = 1;

  for (const m of members) {
    if (m.gender === 'male') males++;
    else if (m.gender === 'female') females++;

    if (m.life_status === 'deceased') deceased++;
    else living++;

    const gen = Number(m.generation_level || m.generation_number || 1);
    if (gen > maxGen) maxGen = gen;
  }

  const totalUsers = users.length;
  let linkedUsers = 0;
  for (const u of users) {
    if (u.linked_member_id) linkedUsers++;
  }

  return {
    totalMembers: members.length,
    males,
    females,
    deceased,
    living,
    maxGeneration: maxGen,
    totalUsers,
    linkedUsers,
    unlinkedUsers: totalUsers - linkedUsers,
  };
}

/**
 * Thuật toán phát hiện các thành viên chưa nối phả (đời > 1 nhưng không có cha mẹ)
 */
export function findUnlinkedMembers(members: any[] = []): any[] {
  return members.filter((m) => {
    const gen = Number(m.generation_level || m.generation_number || 1);
    // Cụ đời 1 là Thủy Tổ nên không có cha mẹ là bình thường
    if (gen <= 1) return false;
    return !m.father_id && !m.mother_id;
  });
}
