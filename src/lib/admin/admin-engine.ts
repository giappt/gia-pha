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

/**
 * Tự động chuyển đổi vai trò người dùng khi gán hoặc gỡ node phả hệ
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
    name: 'Xem Cây Phả Hệ Trực Quan',
    description: 'Truy cập và điều hướng trên canvas cây phả hệ dòng họ (/tree)',
    category: 'visibility',
    roles: { guest: true, viewer: true, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'view_living_private',
    name: 'Xem SĐT & Địa Chỉ Người Còn Sống',
    description: 'Hiển thị số điện thoại, địa chỉ rõ ràng không bị che mờ dạng ***',
    category: 'visibility',
    roles: { guest: false, viewer: false, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'kinship_lookup',
    name: 'Tra Cứu Vai Vế Xưng Hô 3 Miền',
    description: 'Sử dụng công cụ tính toán xưng hô 2 chiều tự động (/kinship)',
    category: 'visibility',
    roles: { guest: true, viewer: true, claimed_member: true, branch_editor: true, super_admin: true },
  },
  {
    id: 'anniversaries_view',
    name: 'Xem Lịch Giỗ Gia Tộc 30 Ngày',
    description: 'Tra cứu danh sách ngày giỗ Âm - Dương trong tháng (/anniversaries)',
    category: 'visibility',
    roles: { guest: true, viewer: true, claimed_member: true, branch_editor: true, super_admin: true },
  },

  // Nhóm 2: Tự Phục Vụ & Gắn Kết
  {
    id: 'claim_node',
    name: 'Gửi Yêu Cầu Nhận Node Phả Hệ',
    description: 'Bấm nút "Tôi là người này" để gửi yêu cầu liên kết tài khoản Google',
    category: 'interaction',
    roles: { guest: false, viewer: true, claimed_member: false, branch_editor: false, super_admin: true },
  },
  {
    id: 'push_notifications',
    name: 'Nhận Web Push Nhắc Giỗ Tự Động',
    description: 'Nhận thông báo đẩy trên trình duyệt/điện thoại trước ngày giỗ người thân',
    category: 'interaction',
    roles: { guest: false, viewer: false, claimed_member: true, branch_editor: true, super_admin: true },
  },

  // Nhóm 3: Biên Tập Gia Phả
  {
    id: 'edit_branch_members',
    name: 'Thêm & Sửa Thành Viên Trong Chi',
    description: 'Thêm con cái, thêm phối ngẫu, sửa ngày mất/mộ phần cho thành viên Chi phụ trách',
    category: 'editing',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: true, super_admin: true },
  },
  {
    id: 'reorder_children',
    name: 'Sắp Xếp Thứ Tự Đàn Con & Con Trưởng',
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

  // Nhóm 4: Bàn Điều Hành Tông Tộc
  {
    id: 'admin_dashboard',
    name: 'Truy Cập Bàn Điều Hành Tông Tộc',
    description: 'Xem các chỉ số sức sống phả hệ và cảnh báo thành viên chưa nối phả (/admin)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: false, super_admin: true },
  },
  {
    id: 'manage_users_claims',
    name: 'Quản Lý Tài Khoản & Duyệt Gán Node',
    description: 'Phê duyệt claim node, phân cấp vai trò người dùng trong họ (/admin/users)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: false, super_admin: true },
  },
  {
    id: 'import_excel_data',
    name: 'Nạp Excel Hàng Loạt & Smart Re-map',
    description: 'Nạp cây phả hệ từ file Excel và tự động bảo tồn liên kết con cháu (/admin/import)',
    category: 'administration',
    roles: { guest: false, viewer: false, claimed_member: false, branch_editor: false, super_admin: true },
  },
];

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


