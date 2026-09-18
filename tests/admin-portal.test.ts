import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveFeatureFlags,
  mergeFeatureFlags,
  isValidUserRole,
  computeClanVitalityMetrics,
  findUnlinkedMembers,
  DEFAULT_FEATURE_FLAGS,
  VALID_USER_ROLES,
  resolveEffectiveRole,
} from '../src/lib/admin/admin-engine';
import type { ClanFeatureFlags, UserProfile } from '../src/types/database';

describe('Admin Portal & Feature Governance Engine (Milestone 7)', () => {
  describe('7.1 Automated Tests', () => {
    // TC_UT_FEAT_DEFAULT_01: Khởi tạo giá trị mặc định cho Feature Flags
    it('TC_UT_FEAT_DEFAULT_01: should return full default feature flags when input is undefined or null', () => {
      const flagsFromUndefined = resolveFeatureFlags(undefined);
      assert.deepStrictEqual(flagsFromUndefined, DEFAULT_FEATURE_FLAGS);
      assert.strictEqual(flagsFromUndefined.enable_public_tree, true);
      assert.strictEqual(flagsFromUndefined.enable_kinship_lookup, true);
      assert.strictEqual(flagsFromUndefined.enable_anniversaries, true);
      assert.strictEqual(flagsFromUndefined.allow_member_claims, true);
      assert.strictEqual(flagsFromUndefined.mask_living_member_privacy, true);
      assert.strictEqual(flagsFromUndefined.maintenance_mode, false);

      const flagsFromNull = resolveFeatureFlags(null);
      assert.deepStrictEqual(flagsFromNull, DEFAULT_FEATURE_FLAGS);

      const flagsFromEmptyObj = resolveFeatureFlags({});
      assert.deepStrictEqual(flagsFromEmptyObj, DEFAULT_FEATURE_FLAGS);
    });

    // TC_UT_FEAT_MERGE_02: Merge cờ tính năng ghi đè một phần
    it('TC_UT_FEAT_MERGE_02: should merge partial feature flag updates safely without mutating other flags', () => {
      const initial = resolveFeatureFlags(undefined);
      assert.strictEqual(initial.maintenance_mode, false);
      assert.strictEqual(initial.enable_public_tree, true);

      // Patch 1: Bật maintenance mode
      const patched1 = mergeFeatureFlags(initial, { maintenance_mode: true });
      assert.strictEqual(patched1.maintenance_mode, true);
      assert.strictEqual(patched1.enable_public_tree, true);
      assert.strictEqual(patched1.enable_kinship_lookup, true);

      // Patch 2: Tắt public tree
      const patched2 = mergeFeatureFlags(patched1, { enable_public_tree: false });
      assert.strictEqual(patched2.maintenance_mode, true);
      assert.strictEqual(patched2.enable_public_tree, false);
      assert.strictEqual(patched2.enable_anniversaries, true);
    });

    // TC_UT_DASHBOARD_STATS_01: Tính toán chỉ số sức sống phả hệ
    it('TC_UT_DASHBOARD_STATS_01: should compute accurate vitality metrics and account coverage', () => {
      const mockMembers = [
        { id: '1', gender: 'male', life_status: 'deceased', generation_number: 1 },
        { id: '2', gender: 'male', life_status: 'deceased', generation_number: 2 },
        { id: '3', gender: 'female', life_status: 'living', generation_number: 2 },
        { id: '4', gender: 'male', life_status: 'living', generation_number: 3 },
        { id: '5', gender: 'female', life_status: 'living', generation_number: 3 },
      ];

      const mockUsers: Partial<UserProfile>[] = [
        { id: 'u1', email: 'admin@fat.vn', user_role: 'super_admin', linked_member_id: '1' },
        { id: 'u2', email: 'member@fat.vn', user_role: 'claimed_member', linked_member_id: '4' },
        { id: 'u3', email: 'viewer@fat.vn', user_role: 'viewer', linked_member_id: null },
      ];

      const metrics = computeClanVitalityMetrics(mockMembers, mockUsers);

      assert.strictEqual(metrics.totalMembers, 5);
      assert.strictEqual(metrics.males, 3);
      assert.strictEqual(metrics.females, 2);
      assert.strictEqual(metrics.deceased, 2);
      assert.strictEqual(metrics.living, 3);
      assert.strictEqual(metrics.maxGeneration, 3);
      assert.strictEqual(metrics.totalUsers, 3);
      assert.strictEqual(metrics.linkedUsers, 2);
      assert.strictEqual(metrics.unlinkedUsers, 1);
    });

    // TC_UT_DASHBOARD_ALERTS_02: Phát hiện thành viên chưa nối phả
    it('TC_UT_DASHBOARD_ALERTS_02: should accurately detect unlinked members with generation > 1 and missing parents', () => {
      const mockMembers = [
        // Cụ Tổ Đời 1: không có cha mẹ -> hợp lệ, KHÔNG tính là unlinked
        { id: 'm1', full_name: 'Cụ Tổ', generation_level: 1, father_id: null, mother_id: null },
        // Đời 2 có cha là m1 -> hợp lệ
        { id: 'm2', full_name: 'Ông Hai', generation_level: 2, father_id: 'm1', mother_id: null },
        // Đời 2 bị mồ côi cha mẹ -> UNLINKED!
        { id: 'm3', full_name: 'Ông Ba Lạc', generation_level: 2, father_id: null, mother_id: null },
        // Đời 3 có cha là m2 -> hợp lệ
        { id: 'm4', full_name: 'Bác Tư', generation_level: 3, father_id: 'm2', mother_id: null },
        // Đời 3 bị mồ côi cha mẹ -> UNLINKED!
        { id: 'm5', full_name: 'Cháu Năm Lạc', generation_level: 3, father_id: null, mother_id: null },
      ];

      const unlinked = findUnlinkedMembers(mockMembers);
      assert.strictEqual(unlinked.length, 2);
      assert.strictEqual(unlinked[0].id, 'm3');
      assert.strictEqual(unlinked[1].id, 'm5');
    });

    // TC_UT_USER_ROLE_VALIDATION: Ràng buộc vai trò người dùng hợp lệ
    it('TC_UT_USER_ROLE_VALIDATION: should strictly validate user roles against allowed domain roles', () => {
      for (const role of VALID_USER_ROLES) {
        assert.strictEqual(isValidUserRole(role), true, `Role '${role}' should be valid`);
      }

      assert.strictEqual(isValidUserRole('hacker_admin'), false);
      assert.strictEqual(isValidUserRole('guest'), false);
      assert.strictEqual(isValidUserRole(''), false);
      assert.strictEqual(isValidUserRole('admin'), false); // Phải là super_admin
      assert.strictEqual(isValidUserRole('editor'), false); // Phải là branch_editor
    });

    // TC_INT_USERS_API_AUTH_GUARD: Kiểm tra tệp định tuyến và bảo vệ quyền Super Admin
    it('TC_INT_USERS_API_AUTH_GUARD: should verify users route and clan-settings route files exist and enforce admin guards', () => {
      const usersRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'users', 'route.ts');
      assert.strictEqual(fs.existsSync(usersRoutePath), true, 'src/app/api/users/route.ts must exist');

      const usersRouteContent = fs.readFileSync(usersRoutePath, 'utf8');
      assert.strictEqual(usersRouteContent.includes('checkSuperAdminPermission'), true);
      assert.strictEqual(usersRouteContent.includes('export async function GET'), true);
      assert.strictEqual(usersRouteContent.includes('export async function PATCH'), true);
      assert.strictEqual(usersRouteContent.includes('403'), true);

      // Verify clan-settings route supports feature_flags
      const clanSettingsRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'clan-settings', 'route.ts');
      const clanSettingsContent = fs.readFileSync(clanSettingsRoutePath, 'utf8');
      assert.strictEqual(clanSettingsContent.includes('feature_flags'), true);
      assert.strictEqual(clanSettingsContent.includes('resolveFeatureFlags'), true);

      // Verify all admin sub-pages exist
      const requiredPages = [
        path.join(process.cwd(), 'src', 'app', 'admin', 'page.tsx'),
        path.join(process.cwd(), 'src', 'app', 'admin', 'branches', 'page.tsx'),
        path.join(process.cwd(), 'src', 'app', 'admin', 'profile', 'page.tsx'),
        path.join(process.cwd(), 'src', 'app', 'admin', 'kinship', 'page.tsx'),
        path.join(process.cwd(), 'src', 'app', 'admin', 'users', 'page.tsx'),
        path.join(process.cwd(), 'src', 'app', 'admin', 'features', 'page.tsx'),
        path.join(process.cwd(), 'src', 'app', 'admin', 'settings', 'page.tsx'),
      ];

      for (const p of requiredPages) {
        assert.strictEqual(fs.existsSync(p), true, `Page ${p} must exist`);
      }
    });

    // TC_UT_DASHBOARD_GEOMETRY_CLEAN: Kiểm tra triệt tiêu bo tròn quá đà và méo góc
    it('TC_UT_DASHBOARD_GEOMETRY_CLEAN: should verify AdminSidebar and ClanDashboard strictly adhere to crisp geometry and have 0 rounded-2xl / border-r-2', () => {
      const sidebarPath = path.join(process.cwd(), 'src', 'components', 'admin', 'AdminSidebar.tsx');
      const dashboardPath = path.join(process.cwd(), 'src', 'components', 'admin', 'ClanDashboard.tsx');

      const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

      // AdminSidebar: cấm rounded-xl, rounded-2xl, rounded-3xl, border-r-2; bắt buộc rounded-md
      assert.strictEqual(sidebarContent.includes('rounded-2xl'), false, 'AdminSidebar must not contain rounded-2xl');
      assert.strictEqual(sidebarContent.includes('rounded-3xl'), false, 'AdminSidebar must not contain rounded-3xl');
      assert.strictEqual(sidebarContent.includes('border-r-2'), false, 'AdminSidebar must not contain border-r-2');
      assert.strictEqual(sidebarContent.includes('rounded-md'), true, 'AdminSidebar must contain rounded-md for crisp links');

      // ClanDashboard: cấm rounded-2xl, rounded-3xl; bắt buộc rounded-lg và rounded-md
      assert.strictEqual(dashboardContent.includes('rounded-2xl'), false, 'ClanDashboard must not contain rounded-2xl');
      assert.strictEqual(dashboardContent.includes('rounded-3xl'), false, 'ClanDashboard must not contain rounded-3xl');
      assert.strictEqual(dashboardContent.includes('rounded-lg'), true, 'ClanDashboard must contain rounded-lg for cards');
      assert.strictEqual(dashboardContent.includes('rounded-md'), true, 'ClanDashboard must contain rounded-md for controls');
    });

    // TC_UT_DASHBOARD_UNLINKED_DRAWER_BINDING: Kiểm tra nút Kiểm tra gắn kết với Drawer rà soát tại chỗ
    it('TC_UT_DASHBOARD_UNLINKED_DRAWER_BINDING: should verify unlinked members check button triggers in-place drawer with relink/delete capabilities', () => {
      const dashboardPath = path.join(process.cwd(), 'src', 'components', 'admin', 'ClanDashboard.tsx');
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

      // Must import and use UnlinkedMembersDrawer
      assert.strictEqual(dashboardContent.includes('UnlinkedMembersDrawer'), true, 'Must import UnlinkedMembersDrawer');
      assert.strictEqual(dashboardContent.includes('isUnlinkedDrawerOpen'), true, 'Must track isUnlinkedDrawerOpen state');
      assert.strictEqual(dashboardContent.includes('setIsUnlinkedDrawerOpen(true)'), true, 'Must toggle drawer state on check button');

      // Check button must not hardcode redirect to /admin/branches
      assert.strictEqual(dashboardContent.includes('id="btn-check-unlinked-members"'), true, 'Must have test ID for check button');
      assert.strictEqual(dashboardContent.includes('href="/admin/branches">\n                  <span>Kiểm tra</span>'), false, 'Check button must not link to branches');

      // Must provide relink and delete handlers
      assert.strictEqual(dashboardContent.includes('handleRelinkMember'), true, 'Must implement handleRelinkMember');
      assert.strictEqual(dashboardContent.includes('handleDeleteMember'), true, 'Must implement handleDeleteMember');
    });

    // =========================================================================
    // MILESTONE 7.7: GÁN NODE BỀN VỮNG & SMART RE-MAPPING BẢO TỒN LIÊN KẾT
    // =========================================================================

    // TC_UT_USERS_SCHEMA_NORMALIZATION: Query users dùng đúng cột generation_level và branch_name
    it('TC_UT_USERS_SCHEMA_NORMALIZATION: should verify /api/users queries generation_level & branch_name and has 0 generation_number / branch_code', () => {
      const usersRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'users', 'route.ts');
      const content = fs.readFileSync(usersRoutePath, 'utf8');

      assert.strictEqual(content.includes('generation_level'), true, 'Must select generation_level from members');
      assert.strictEqual(content.includes('branch_name'), true, 'Must select branch_name from members');
      assert.strictEqual(content.includes('generation_number'), false, 'Must NOT query non-existent generation_number');
      assert.strictEqual(content.includes(", branch_code'"), false, 'Must NOT query non-existent branch_code from members');
    });

    // TC_UT_USERS_ADMIN_CLIENT_MUTATION: PATCH /api/users dùng createAdminClient và bắt lỗi error
    it('TC_UT_USERS_ADMIN_CLIENT_MUTATION: should verify PATCH /api/users calls createAdminClient to bypass RLS and validates error', () => {
      const usersRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'users', 'route.ts');
      const content = fs.readFileSync(usersRoutePath, 'utf8');

      assert.strictEqual(content.includes('createAdminClient'), true, 'Must import and use createAdminClient');
      assert.strictEqual(content.includes('resolveUserRoleOnNodeLink'), true, 'Must import and call resolveUserRoleOnNodeLink');
      assert.strictEqual(content.includes('updateErr'), true, 'Must check updateErr from Supabase update response');
    });

    // TC_UT_USERS_ROLE_AUTO_PROMOTION: Tự động thăng cấp và hạ cấp vai trò khi gán/gỡ node
    it('TC_UT_USERS_ROLE_AUTO_PROMOTION: should promote viewer to claimed_member on link, and demote claimed_member to viewer on unlink', () => {
      const { resolveUserRoleOnNodeLink } = require('../src/lib/admin/admin-engine');

      // Khi gán node cho viewer -> thăng cấp claimed_member
      const promoted = resolveUserRoleOnNodeLink('viewer', 'mem-uuid-123');
      assert.strictEqual(promoted, 'claimed_member', 'Viewer must be promoted to claimed_member when linked');

      // Khi gỡ node của claimed_member -> hạ cấp về viewer
      const demoted = resolveUserRoleOnNodeLink('claimed_member', null);
      assert.strictEqual(demoted, 'viewer', 'Claimed member must be demoted to viewer when unlinked');
    });

    // TC_UT_USERS_PRESERVE_ADMIN_ROLES: Giữ nguyên vai trò Quản trị viên khi gán/gỡ node
    it('TC_UT_USERS_PRESERVE_ADMIN_ROLES: should preserve super_admin and branch_editor roles unchanged on link or unlink', () => {
      const { resolveUserRoleOnNodeLink } = require('../src/lib/admin/admin-engine');

      assert.strictEqual(resolveUserRoleOnNodeLink('super_admin', 'mem-uuid-123'), 'super_admin');
      assert.strictEqual(resolveUserRoleOnNodeLink('super_admin', null), 'super_admin');
      assert.strictEqual(resolveUserRoleOnNodeLink('branch_editor', 'mem-uuid-123'), 'branch_editor');
      assert.strictEqual(resolveUserRoleOnNodeLink('branch_editor', null), 'branch_editor');
    });

    // TC_UT_IMPORT_SMART_REMAPPING_TRIPLET: Smart Re-mapping khớp chính xác theo bộ 3 Tên + Năm sinh + Giới tính
    it('TC_UT_IMPORT_SMART_REMAPPING_TRIPLET: should accurately remap user link using (clean_name, birth_year, gender)', () => {
      const { smartRemapUserLinks } = require('../src/lib/admin/admin-engine');

      const snapshots = [
        {
          userId: 'user-01',
          fullName: 'Nguyễn Văn Nam (Nam Béo)',
          birthYear: 1985,
          gender: 'male',
          generationLevel: 3,
        },
      ];

      const newMembers = [
        {
          id: 'new-uuid-888',
          full_name: 'Nguyễn Văn Nam',
          birth_year: 1985,
          gender: 'male',
          generation_level: 3,
        },
        {
          id: 'new-uuid-999',
          full_name: 'Nguyễn Văn Nam',
          birth_year: 2010,
          gender: 'male',
          generation_level: 4,
        },
      ];

      const result = smartRemapUserLinks(snapshots, newMembers);
      assert.strictEqual(result.matches.length, 1);
      assert.strictEqual(result.matches[0].userId, 'user-01');
      assert.strictEqual(result.matches[0].matchedMemberId, 'new-uuid-888');
      assert.strictEqual(result.matches[0].matchLevel, 'triplet');
      assert.strictEqual(result.ambiguousUserIds.length, 0);
    });

    // TC_UT_IMPORT_SMART_REMAPPING_FALLBACK_GEN: Smart Re-mapping fallback theo Thế hệ khi khuyết năm sinh
    it('TC_UT_IMPORT_SMART_REMAPPING_FALLBACK_GEN: should fallback to generation_level when birth_year is missing', () => {
      const { smartRemapUserLinks } = require('../src/lib/admin/admin-engine');

      const snapshots = [
        {
          userId: 'user-02',
          fullName: 'Trần Thị Mai',
          birthYear: null,
          gender: 'female',
          generationLevel: 2,
        },
      ];

      const newMembers = [
        {
          id: 'new-uuid-mai-gen2',
          full_name: 'Trần Thị Mai',
          birth_year: null,
          gender: 'female',
          generation_level: 2,
        },
        {
          id: 'new-uuid-mai-gen3',
          full_name: 'Trần Thị Mai',
          birth_year: null,
          gender: 'female',
          generation_level: 3,
        },
      ];

      const result = smartRemapUserLinks(snapshots, newMembers);
      assert.strictEqual(result.matches.length, 1);
      assert.strictEqual(result.matches[0].userId, 'user-02');
      assert.strictEqual(result.matches[0].matchedMemberId, 'new-uuid-mai-gen2');
      assert.strictEqual(result.matches[0].matchLevel, 'fallback_gen');
    });

    // TC_UT_IMPORT_REMAPPING_AMBIGUOUS_GUARD: Chặn tự động gán khi phát hiện trùng lặp mơ hồ
    it('TC_UT_IMPORT_REMAPPING_AMBIGUOUS_GUARD: should not auto-link and flag as ambiguous when multiple candidates match', () => {
      const { smartRemapUserLinks } = require('../src/lib/admin/admin-engine');

      const snapshots = [
        {
          userId: 'user-03',
          fullName: 'Nguyễn Văn Tuấn',
          birthYear: 1990,
          gender: 'male',
          generationLevel: 3,
        },
      ];

      // File mới có 2 người cùng tên Nguyễn Văn Tuấn và cùng sinh 1990
      const newMembers = [
        {
          id: 'tuan-branch-a',
          full_name: 'Nguyễn Văn Tuấn',
          birth_year: 1990,
          gender: 'male',
          generation_level: 3,
        },
        {
          id: 'tuan-branch-b',
          full_name: 'Nguyễn Văn Tuấn',
          birth_year: 1990,
          gender: 'male',
          generation_level: 3,
        },
      ];

      const result = smartRemapUserLinks(snapshots, newMembers);
      assert.strictEqual(result.matches.length, 0, 'Must NOT auto-link ambiguous candidate');
      assert.strictEqual(result.ambiguousUserIds.length, 1);
      assert.strictEqual(result.ambiguousUserIds[0], 'user-03');
    });

    // TC_UT_AUTH_CHECK_USES_SSR_CLIENT: Phân quyền Super Admin bắt buộc dùng SSR client đọc session
    it('TC_UT_AUTH_CHECK_USES_SSR_CLIENT: checkSuperAdminPermission must use SSR client to read Google session', () => {
      const routeContent = fs.readFileSync(
        path.join(__dirname, '../src/app/api/users/route.ts'),
        'utf-8'
      );
      // Bắt buộc import createClient từ '@/lib/supabase/server'
      assert.match(
        routeContent,
        /import\s+\{\s*createClient\s*\}\s+from\s+['"]@\/lib\/supabase\/server['"]/,
        'Must import createClient from @/lib/supabase/server'
      );
      // checkSuperAdminPermission phải gọi createClient() để đọc cookies session
      assert.match(
        routeContent,
        /async\s+function\s+checkSuperAdminPermission[\s\S]*?const\s+supabase\s*=\s*createClient\(\)/,
        'checkSuperAdminPermission must initialize SSR client with createClient()'
      );
      // Tuyệt đối CẤM gọi admin.auth.getUser() vì service role không có cookies của user
      assert.doesNotMatch(
        routeContent,
        /admin\.auth\.getUser\(\)/,
        'Must never call admin.auth.getUser() because service role client lacks user cookies'
      );
    });

    // TC_UT_USERS_ROUTE_NO_DEV_USERS_COOKIE_OVERRIDE: GET /api/users không cho phép cookie đè CSDL thật
    it('TC_UT_USERS_ROUTE_NO_DEV_USERS_COOKIE_OVERRIDE: GET /api/users must prioritize database users over dev cookies', () => {
      const routeContent = fs.readFileSync(
        path.join(__dirname, '../src/app/api/users/route.ts'),
        'utf-8'
      );
      // Phải ưu tiên dữ liệu usersData từ Supabase
      assert.match(
        routeContent,
        /finalUsers\s*=\s*Array\.isArray\(usersData\)\s*&&\s*usersData\.length\s*>\s*0\s*\?\s*usersData\s*:\s*\[\]/,
        'finalUsers must strictly prioritize Supabase usersData'
      );
      // Dọn sạch cookie rác fat_dev_users
      assert.match(
        routeContent,
        /cookieStore\.delete\(['"]fat_dev_users['"]\)/,
        'Must delete stale fat_dev_users cookie'
      );
      // Trong PATCH không được set cookie fat_dev_users
      assert.doesNotMatch(
        routeContent,
        /cookieStore\.set\(['"]fat_dev_users['"]/,
        'PATCH must not persist fat_dev_users cookie'
      );
    });

    // TC_UT_USERS_PAGE_ERROR_ALERT_EXPOSURE: Frontend hiển thị cảnh báo lỗi khi API thất bại
    it('TC_UT_USERS_PAGE_ERROR_ALERT_EXPOSURE: AdminUsersPage must expose error alerts when API fails instead of swallowing', () => {
      const pageContent = fs.readFileSync(
        path.join(__dirname, '../src/app/admin/users/page.tsx'),
        'utf-8'
      );
      // loadData phải kiểm tra !usersRes.ok
      assert.match(
        pageContent,
        /if\s*\(\s*!usersRes\.ok\s*\)/,
        'loadData must inspect !usersRes.ok to detect server errors'
      );
      // Khi có lỗi, phải gọi setStatusMessage với type: 'error'
      assert.match(
        pageContent,
        /setStatusMessage\(\{\s*type:\s*['"]error['"],\s*text:\s*usersRes\.error/,
        'Must surface error message in statusMessage instead of silent swallowing'
      );
    });

    // TC_UT_SIDEBAR_ROLES_ITEM: Sidebar Admin chứa mục Phân Quyền & Vai Trò
    it('TC_UT_SIDEBAR_ROLES_ITEM: AdminSidebar must contain /admin/roles in THÀNH VIÊN & TÀI KHOẢN group', () => {
      const sidebarContent = fs.readFileSync(
        path.join(__dirname, '../src/components/admin/AdminSidebar.tsx'),
        'utf-8'
      );
      assert.match(
        sidebarContent,
        /href:\s*['"]\/admin\/roles['"]/,
        'AdminSidebar must contain href to /admin/roles'
      );
      assert.match(
        sidebarContent,
        /label:\s*['"]Phân Quyền & Vai Trò['"]/,
        'AdminSidebar must have label "Phân Quyền & Vai Trò"'
      );
    });

    // TC_UT_MIDDLEWARE_SUPER_ADMIN_BYPASS: Middleware nhận diện Super Admin email để miễn nhiễm cờ chặn
    it('TC_UT_MIDDLEWARE_SUPER_ADMIN_BYPASS: middleware must recognize giap.pt.90@gmail.com as super_admin for auth gate bypass', () => {
      const middlewareContent = fs.readFileSync(
        path.join(__dirname, '../src/middleware.ts'),
        'utf-8'
      );
      assert.match(
        middlewareContent,
        /user\.email\?\.toLowerCase\(\)\s*===\s*['"]giap\.pt\.90@gmail\.com['"]/,
        'Middleware must recognize giap.pt.90@gmail.com'
      );
      assert.match(
        middlewareContent,
        /isSuperAdmin\s*=\s*true/,
        'Middleware must grant isSuperAdmin = true to bypass feature flags'
      );
    });

    // TC_UT_ROLE_IMPERSONATION_STORE_PURE: Hàm resolveEffectiveRole đảm bảo chỉ Super Admin mới được đóng vai
    it('TC_UT_ROLE_IMPERSONATION_STORE_PURE: resolveEffectiveRole allows only super_admin to impersonate and prevents privilege escalation', () => {
      // Khi là super_admin và đóng vai các role khác
      assert.strictEqual(resolveEffectiveRole('super_admin', 'guest'), 'guest');
      assert.strictEqual(resolveEffectiveRole('super_admin', 'viewer'), 'viewer');
      assert.strictEqual(resolveEffectiveRole('super_admin', 'claimed_member'), 'claimed_member');
      assert.strictEqual(resolveEffectiveRole('super_admin', 'branch_editor'), 'branch_editor');
      assert.strictEqual(resolveEffectiveRole('super_admin', null), 'super_admin');

      // Khi người dùng KHÔNG PHẢI super_admin (chống leo thang quyền)
      assert.strictEqual(resolveEffectiveRole('viewer', 'super_admin' as any), 'viewer');
      assert.strictEqual(resolveEffectiveRole('claimed_member', 'super_admin' as any), 'claimed_member');
      assert.strictEqual(resolveEffectiveRole('branch_editor', 'super_admin' as any), 'branch_editor');
      assert.strictEqual(resolveEffectiveRole(undefined, 'super_admin' as any), 'viewer');
    });

    // TC_UT_ROLES_PAGE_NEVER_LOCKED_OUT: Banner đóng vai luôn có lối thoát và link vào Quản Trị
    it('TC_UT_ROLES_PAGE_NEVER_LOCKED_OUT: RoleImpersonationBanner must provide Admin entry and Exit mechanism to avoid lock-out', () => {
      const bannerContent = fs.readFileSync(
        path.join(__dirname, '../src/components/admin/RoleImpersonationBanner.tsx'),
        'utf-8'
      );
      assert.match(
        bannerContent,
        /href=["']\/admin\/roles["']/,
        'Banner must contain link to /admin/roles'
      );
      assert.match(
        bannerContent,
        /handleExit/,
        'Banner must have handleExit to clear impersonation cookie'
      );
    });
  });
});



