import type {
  ClanFeatureFlags,
  ClanThemeConfig,
  DesignProfileId,
  ThemeApplyScope,
  UserRole,
} from '@/types/database';

export const DEFAULT_THEME_CONFIG: ClanThemeConfig = {
  active_profile: 'classic',
  canary_enabled: false,
  canary_profile: 'contemporary_heritage',
  apply_scope: 'all',
  allowed_user_ids: [],
};

/**
 * Phân giải an toàn cấu hình Theme Profile với fallback mặc định
 */
export function resolveThemeConfig(config?: Partial<ClanThemeConfig> | null): ClanThemeConfig {
  if (!config || typeof config !== 'object') {
    return { ...DEFAULT_THEME_CONFIG };
  }

  const active_profile: DesignProfileId =
    config.active_profile === 'heritage'
      ? 'heritage'
      : config.active_profile === 'contemporary_heritage'
        ? 'contemporary_heritage'
        : 'classic';

  const canary_profile: DesignProfileId | undefined =
    config.canary_profile === 'heritage' ||
    config.canary_profile === 'classic' ||
    config.canary_profile === 'contemporary_heritage'
      ? config.canary_profile
      : undefined;

  const apply_scope: ThemeApplyScope =
    config.apply_scope === 'admin_only' || config.apply_scope === 'custom_users'
      ? config.apply_scope
      : 'all';

  const canary_enabled: boolean =
    typeof config.canary_enabled === 'boolean'
      ? config.canary_enabled
      : (apply_scope === 'admin_only' || apply_scope === 'custom_users');

  const allowed_user_ids: string[] = Array.isArray(config.allowed_user_ids)
    ? config.allowed_user_ids.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    active_profile,
    canary_enabled,
    canary_profile: canary_profile || (active_profile === 'contemporary_heritage' ? 'heritage' : 'contemporary_heritage'),
    apply_scope,
    allowed_user_ids,
  };
}

/**
 * Tính toán Theme Profile hiệu lực dựa trên cấu hình 2 tầng (Base Theme vs Canary Preview)
 */
export function resolveEffectiveThemeProfile(
  config?: Partial<ClanThemeConfig> | null,
  currentUser?: { id?: string; role?: UserRole; isSuperAdmin?: boolean } | null
): DesignProfileId {
  const resolved = resolveThemeConfig(config);

  // Nếu Canary không bật hoặc scope là 'all' -> 100% người dùng nhận Giao Diện Chính Thức (active_profile)
  if (!resolved.canary_enabled || resolved.apply_scope === 'all') {
    return resolved.active_profile;
  }

  // Nhóm thử nghiệm: Super Admin HOẶC tài khoản nằm trong Whitelist
  const isEligibleForCanary =
    currentUser?.isSuperAdmin ||
    (resolved.apply_scope === 'custom_users' &&
      !!currentUser?.id &&
      resolved.allowed_user_ids.includes(currentUser.id));

  // Kiểm tra xem config đầu vào có chỉ định canary_profile một cách tường minh không
  const hasExplicitCanary =
    config?.canary_profile !== undefined && config.canary_profile !== null;

  if (hasExplicitCanary) {
    // Chế độ 2 tầng hiện đại: Nhóm thử nghiệm nhận canary_profile, còn lại nhận active_profile (Base Dòng Họ)
    if (isEligibleForCanary) {
      return resolved.canary_profile || resolved.active_profile;
    }
    return resolved.active_profile;
  }

  // Chế độ tương thích ngược (Legacy 1-Tier): Nhóm thử nghiệm nhận active_profile, còn lại nhận 'classic'
  if (isEligibleForCanary) {
    return resolved.active_profile;
  }
  return 'classic';
}

/**
 * Thao tác nguyên tử 1-Click: Phổ cập giao diện thử nghiệm cho toàn bộ dòng họ
 */
export function promoteCanaryToProduction(config: ClanThemeConfig): ClanThemeConfig {
  const target = config.canary_profile || config.active_profile;
  return {
    ...config,
    active_profile: target,
    canary_enabled: false,
    apply_scope: 'all',
  };
}

export const DEFAULT_FEATURE_FLAGS: ClanFeatureFlags = {
  enable_public_tree: true,
  enable_kinship_lookup: true,
  enable_anniversaries: true,
  enable_push_notifications: true,
  allow_member_claims: true,
  allow_member_self_edit: true,
  allow_family_claim_approval: true,
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
    allow_member_self_edit:
      typeof flags.allow_member_self_edit === 'boolean'
        ? flags.allow_member_self_edit
        : DEFAULT_FEATURE_FLAGS.allow_member_self_edit,
    allow_family_claim_approval:
      typeof flags.allow_family_claim_approval === 'boolean'
        ? flags.allow_family_claim_approval
        : DEFAULT_FEATURE_FLAGS.allow_family_claim_approval,
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
 * Tính toán các chỉ số sức sống Gia Phả và mức độ phủ sóng tài khoản
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
    // Cụ đời 1 là Cụ Tổ nên không có cha mẹ là bình thường
    if (gen <= 1) return false;
    return !m.father_id && !m.mother_id;
  });
}

/**
 * Tự động chuyển đổi vai trò người dùng khi gán hoặc gỡ node Gia Phả
 * - Khi gán node (linkedMemberId khác null): nếu đang là 'viewer' -> thăng cấp 'claimed_member'
 * - Khi gỡ node (linkedMemberId = null): nếu đang là 'claimed_member' -> hạ cấp về 'viewer'
 * - Các vai trò quản trị ('branch_editor', 'super_admin') được bảo toàn tuyệt đối, không bị thay đổi
 */
export function resolveUserRoleOnNodeLink(
  currentRole: UserRole,
  linkedMemberId: string | null
): UserRole {
  // Bảo vệ vai trò quản trị viên
  if (currentRole === 'super_admin' || currentRole === 'branch_editor') {
    return currentRole;
  }

  if (linkedMemberId) {
    if (currentRole === 'viewer') {
      return 'claimed_member';
    }
    return currentRole;
  } else {
    if (currentRole === 'claimed_member') {
      return 'viewer';
    }
    return currentRole;
  }
}

export interface UserLinkSnapshot {
  userId: string;
  userRole?: UserRole;
  fullName: string;
  birthYear?: number | null;
  gender: string;
  generationLevel?: number | null;
}

export interface RemapMatchResult {
  userId: string;
  oldFullName: string;
  matchedMemberId: string;
  matchedMemberName: string;
  matchLevel: 'triplet' | 'fallback_gen';
}

export interface RemapResult {
  matches: RemapMatchResult[];
  ambiguousUserIds: string[];
  unmatchedUserIds: string[];
}

/**
 * Chuẩn hóa tên thành viên để so khớp (loại bỏ ngoặc đơn, chữ hoa thường, khoảng trắng thừa)
 */
export function normalizeNameForRemap(name: string): string {
  if (!name) return '';
  return name
    .replace(/[\(\[][^\)\]]*[\)\]]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Thuật toán Smart Re-mapping: Khôi phục liên kết tài khoản con cháu sau khi nạp cây mới
 * - Mức 1: Khớp chính xác bộ 3 (Tên chuẩn hóa + Năm sinh + Giới tính)
 * - Mức 2: Nếu khuyết năm sinh, khớp theo (Tên chuẩn hóa + Giới tính + Thế hệ)
 * - Ambiguous Guard: Nếu phát hiện > 1 ứng viên trùng khớp, không tự gán bừa
 */
export function smartRemapUserLinks(
  snapshots: UserLinkSnapshot[],
  newMembers: any[]
): RemapResult {
  const matches: RemapMatchResult[] = [];
  const ambiguousUserIds: string[] = [];
  const unmatchedUserIds: string[] = [];

  for (const s of snapshots) {
    const sName = normalizeNameForRemap(s.fullName);
    if (!sName) {
      unmatchedUserIds.push(s.userId);
      continue;
    }

    // Mức 1: So khớp bộ 3 (Tên + Năm sinh + Giới tính)
    if (s.birthYear != null) {
      const candidates = newMembers.filter((m) => {
        const mName = normalizeNameForRemap(m.full_name || '');
        const mGen = m.gender === 'male' || m.gender === 'Nam' ? 'male' : 'female';
        const sGen = s.gender === 'male' || s.gender === 'Nam' ? 'male' : 'female';
        return (
          mName === sName &&
          mGen === sGen &&
          m.birth_year != null &&
          Number(m.birth_year) === Number(s.birthYear)
        );
      });

      if (candidates.length === 1) {
        matches.push({
          userId: s.userId,
          oldFullName: s.fullName,
          matchedMemberId: candidates[0].id,
          matchedMemberName: candidates[0].full_name,
          matchLevel: 'triplet',
        });
        continue;
      } else if (candidates.length > 1) {
        ambiguousUserIds.push(s.userId);
        continue;
      }
    }

    // Mức 2: Fallback nếu khuyết năm sinh (Tên + Giới tính + Thế hệ)
    const genCandidates = newMembers.filter((m) => {
      const mName = normalizeNameForRemap(m.full_name || '');
      const mGen = m.gender === 'male' || m.gender === 'Nam' ? 'male' : 'female';
      const sGen = s.gender === 'male' || s.gender === 'Nam' ? 'male' : 'female';
      const mLevel = Number(m.generation_level || m.generation_number || 1);
      const sLevel = Number(s.generationLevel || 1);

      return mName === sName && mGen === sGen && mLevel === sLevel;
    });

    if (genCandidates.length === 1) {
      matches.push({
        userId: s.userId,
        oldFullName: s.fullName,
        matchedMemberId: genCandidates[0].id,
        matchedMemberName: genCandidates[0].full_name,
        matchLevel: 'fallback_gen',
      });
    } else if (genCandidates.length > 1) {
      ambiguousUserIds.push(s.userId);
    } else {
      unmatchedUserIds.push(s.userId);
    }
  }

  return {
    matches,
    ambiguousUserIds,
    unmatchedUserIds,
  };
}

export type ImpersonatedRole = 'guest' | 'viewer' | 'claimed_member' | 'branch_editor' | null;

/**
 * Phân giải vai trò hiệu dụng (Effective Role) khi Super Admin sử dụng chế độ Đóng Vai Nghiệm Thu.
 * Bảo đảm nguyên tắc liêm chính: Chỉ duy nhất tài khoản thật là 'super_admin' mới được đóng vai.
 * Mọi tài khoản khác luôn bị khóa cứng ở vai trò thật, chống triệt để tấn công leo thang đặc quyền.
 */
export function resolveEffectiveRole(
  realRole: UserRole | undefined | null,
  impersonatedRole: ImpersonatedRole
): UserRole | 'guest' {
  if (realRole === 'super_admin') {
    if (impersonatedRole === 'guest') {
      return 'guest';
    }
    if (
      impersonatedRole === 'viewer' ||
      impersonatedRole === 'claimed_member' ||
      impersonatedRole === 'branch_editor'
    ) {
      return impersonatedRole;
    }
    return 'super_admin';
  }

  return realRole || 'viewer';
}

export interface PermissionMatrixItem {
  id: string;
  name: string;
  description: string;
  category: 'visibility' | 'interaction' | 'editing' | 'administration';
  masterFlagKey?: keyof ClanFeatureFlags;
  roles: {
    guest: boolean;
    viewer: boolean;
    claimed_member: boolean;
    branch_editor: boolean;
    super_admin: boolean;
  };
}

export const PERMISSION_MATRIX_DEFINITIONS: PermissionMatrixItem[] = [
  // Nhóm 1: Tiếp Cận & Quyền Riêng Tư
  {
    id: 'view_tree',
    name: 'Xem Cây Gia Phả Trực Quan',
    description: 'Truy cập và điều hướng trên canvas cây Gia Phả dòng họ (/tree)',
    category: 'visibility',
    masterFlagKey: 'enable_public_tree',
    roles: { guest: true, viewer: true, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'view_living_private',
    name: 'Xem SĐT & Địa Chỉ Người Còn Sống',
    description: 'Hiển thị số điện thoại, địa chỉ rõ ràng không bị che mờ dạng ***',
    category: 'visibility',
    masterFlagKey: 'mask_living_member_privacy',
    roles: { guest: false, viewer: false, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'kinship_lookup',
    name: 'Tra Cứu Vai Vế Xưng Hô 3 Miền',
    description: 'Sử dụng công cụ tính toán xưng hô 2 chiều tự động (/kinship)',
    category: 'visibility',
    masterFlagKey: 'enable_kinship_lookup',
    roles: { guest: true, viewer: true, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'anniversaries_view',
    name: 'Xem Lịch Giỗ Gia Tộc 30 Ngày',
    description: 'Tra cứu danh sách ngày giỗ Âm - Dương trong tháng (/anniversaries)',
    category: 'visibility',
    masterFlagKey: 'enable_anniversaries',
    roles: { guest: true, viewer: true, claimed_member: true, branch_editor: true, super_admin: true },
  },

  // Nhóm 2: Tự Phục Vụ & Gắn Kết
  {
    id: 'claim_node',
    name: 'Gửi Yêu Cầu Nhận Node Gia Phả',
    description: 'Bấm nút "Tôi là người này" để gửi yêu cầu liên kết tài khoản Google',
    category: 'interaction',
    masterFlagKey: 'allow_member_claims',
    roles: { guest: false, viewer: true, claimed_member: false, branch_editor: false, super_admin: true },
  },
  {
    id: 'push_notifications',
    name: 'Nhận Web Push Nhắc Giỗ Tự Động',
    description: 'Nhận thông báo đẩy trên trình duyệt/điện thoại trước ngày giỗ người thân',
    category: 'interaction',
    masterFlagKey: 'enable_push_notifications',
    roles: { guest: false, viewer: false, claimed_member: true, branch_editor: true, super_admin: true },
  },

  // Nhóm 3: Biên Tập Gia Phả
  {
    id: 'manage_own_family',
    name: 'Tự Quản Thông Tin Gia Đình Của Bạn',
    description: 'Thêm vợ/chồng, thêm con và cập nhật thông tin cá nhân trong gia đình của mình (Có thể tắt/bật qua Cờ Tính Năng)',
    category: 'editing',
    masterFlagKey: 'allow_member_self_edit',
    roles: { guest: false, viewer: false, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'edit_branch_members',
    name: 'Biên Tập Phả Hệ Toàn Chi Nhánh',
    description: 'Thêm con cháu, phối ngẫu, sửa ngày mất/mộ phần cho toàn bộ các thành viên thuộc Chi phụ trách',
    category: 'editing',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: true, super_admin: true },
  },
  {
    id: 'reorder_children',
    name: 'Sắp Xếp Thứ Tự các con & Con Trưởng',
    description: 'Thay đổi ngôi thứ sinh (birth_order) và gán danh vị Trưởng Nam trong Chi',
    category: 'editing',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: true, super_admin: true },
  },
  {
    id: 'delete_leaf_node',
    name: 'Xóa Thành Viên Chưa Có Con (Node Lá)',
    description: 'Thực hiện xóa an toàn các thành viên nhập nhầm chưa phát sinh nhánh con',
    category: 'editing',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: true, super_admin: true },
  },

  // Nhóm 4: Bàn Điều Hành
  {
    id: 'review_family_claims',
    name: 'Phê Duyệt Hồ Sơ Con Cháu (Gia Đình Của Bạn)',
    description: 'Truy cập Cổng Phê Duyệt (/admin/claims) với giao diện cách ly để xét duyệt hồ sơ con cái xin nối vào gia đình mình',
    category: 'administration',
    masterFlagKey: 'allow_family_claim_approval',
    roles: { guest: false, viewer: false, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'review_branch_claims',
    name: 'Phê Duyệt & Thẩm Định Hồ Sơ Chi Nhánh',
    description: 'Xét duyệt hoặc tiếp nhận ủy quyền hồ sơ con cháu thuộc Chi nhánh phụ trách (/admin/claims)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: true, super_admin: true },
  },
  {
    id: 'admin_dashboard',
    name: 'Truy Cập Bàn Điều Hành',
    description: 'Xem các chỉ số sức sống Gia Phả và cảnh báo thành viên chưa nối phả (/admin)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: false, super_admin: true },
  },
  {
    id: 'manage_users_claims',
    name: 'Quản Trị Toàn Tộc, Ủy Quyền & Đổi Vai Trò',
    description: 'Phê duyệt toàn tộc, ủy quyền cho Trưởng Chi, đổi vai trò người dùng trong họ (/admin/users)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: false, super_admin: true },
  },
  {
    id: 'import_excel_data',
    name: 'Nạp Excel Hàng Loạt & Smart Re-map',
    description: 'Nạp cây Gia Phả từ file Excel và tự động bảo tồn liên kết con cháu (/admin/import)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: false, super_admin: true },
  },
  {
    id: 'feature_flags',
    name: 'Quản Trị Cờ Tính Năng (Feature Flags)',
    description: 'Bật/tắt các phân hệ: Nhận node, Che SĐT, và Kill Switch Tự Quản Gia Đình (/admin/features)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: false, super_admin: true },
  },
];

export type EffectiveCellState = 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'GOD_MODE';

/**
 * Phân giải trạng thái ô hiệu lực trong Ma Trận Điều Hành dựa trên nguyên lý Cầu Dao Tổng (Master-Aware Circuit Breaker)
 */
export function resolveEffectiveCellState(
  item: PermissionMatrixItem,
  roleId: UserRole | 'guest',
  featureFlags: ClanFeatureFlags
): EffectiveCellState {
  // 1. Super Admin luôn luôn giữ God Mode bất kể cờ nào
  if (roleId === 'super_admin') {
    return 'GOD_MODE';
  }

  // 2. Kiểm tra thẩm quyền quy định theo vai vế chuẩn mực
  const hasRoleEntitlement = (item.roles as any)[roleId] ?? false;
  if (!hasRoleEntitlement) {
    return 'LOCKED'; // Bị khóa theo vai vế
  }

  // 3. Nếu dòng họ đang bật chế độ bảo trì toàn tộc (maintenance_mode) -> Khóa 100% role thường
  if (featureFlags.maintenance_mode) {
    return 'SUSPENDED'; // Bị đóng băng do chế độ bảo trì toàn tộc
  }

  // 4. Nếu dòng này có gắn Cầu Dao Tổng (Master Switch)
  if (item.masterFlagKey) {
    const isMasterOn = !!featureFlags[item.masterFlagKey];
    if (!isMasterOn) {
      return 'SUSPENDED'; // Bị đóng băng do Cầu Dao Tổng đang ngắt
    }
  }

  // 5. Thỏa mãn cả vai trò và Cầu Dao Tổng đang mở
  return 'ACTIVE'; // Được phép
}

/**
 * Kiểm tra xem một vai trò có quyền xem số điện thoại của người còn sống hay không
 */
export function canViewLivingPhone(role: UserRole | 'guest' | undefined | null): boolean {
  return role === 'claimed_member' || role === 'branch_editor' || role === 'super_admin';
}

/**
 * Che mờ số điện thoại để bảo vệ quyền riêng tư nếu người xem không có quyền
 */
export function maskPhoneNumber(phone: string | null | undefined, canView: boolean): string | null {
  if (!phone) return null;
  const cleanPhone = phone.trim();
  if (!cleanPhone) return null;
  if (canView) return cleanPhone;
  if (cleanPhone.length <= 4) return '****';
  return cleanPhone.slice(0, 4) + ' *** ***';
}

export interface RoleMeta {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  canImpersonate: boolean;
}

export const ROLES_META: RoleMeta[] = [
  {
    id: 'guest',
    title: 'Khách Vãng Lai',
    subtitle: 'Chưa Đăng Nhập',
    badge: 'Guest',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    description: 'Người ngoài họ hoặc con cháu truy cập lần đầu qua liên kết chia sẻ mạng xã hội.',
    canImpersonate: true,
  },
  {
    id: 'viewer',
    title: 'Thành Viên Mới',
    subtitle: 'Đã Đăng Nhập Google',
    badge: 'Viewer',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    description: 'Đã xác thực Google nhưng chưa được Admin phê duyệt gắn vào một node Gia Phả cụ thể.',
    canImpersonate: true,
  },
  {
    id: 'claimed_member',
    title: 'Con Cháu Gắn Node',
    subtitle: 'Chính Thức Trong Họ',
    badge: 'Member',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    description: 'Đã liên kết tài khoản với vị trí trong gia phả. Có quyền tự quản thông tin gia đình của mình, thêm vợ con và phê duyệt hồ sơ con cháu.',
    canImpersonate: true,
  },
  {
    id: 'branch_editor',
    title: 'Biên Tập Viên Chi',
    subtitle: 'Cán Bộ Gia Phả Nhánh',
    badge: 'Branch Editor',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    description: 'Phụ trách cập nhật thông tin con cháu, phối ngẫu và ngày mất cho nhánh Gia Phả được phân công.',
    canImpersonate: true,
  },
  {
    id: 'super_admin',
    title: 'Super Admin',
    subtitle: 'Quản Trị Tối Cao',
    badge: 'Admin',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    description: 'Toàn quyền kiểm soát cấu trúc Gia Phả, phân quyền người dùng và thiết lập tham số hệ thống.',
    canImpersonate: false,
  },
];


