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
  });
});

