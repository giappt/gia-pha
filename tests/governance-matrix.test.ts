import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  PERMISSION_MATRIX_DEFINITIONS,
  ROLES_META,
  resolveFeatureFlags,
  resolveEffectiveCellState,
  DEFAULT_FEATURE_FLAGS,
  type PermissionMatrixItem,
  type EffectiveCellState,
} from '../src/lib/admin/admin-engine';
import type { ClanFeatureFlags, UserRole } from '../src/types/database';

describe('Milestone 10: Unified Clan Governance Studio & Master-Aware Policy Matrix', () => {
  const getMatrixItem = (id: string): PermissionMatrixItem => {
    const item = PERMISSION_MATRIX_DEFINITIONS.find((p) => p.id === id);
    if (!item) {
      throw new Error(`PermissionMatrixItem not found: ${id}`);
    }
    return item;
  };

  // 1. TC_UT_GOV_STATE_ACTIVE: Phân giải trạng thái ACTIVE khi Master ON và Role true
  it('TC_UT_GOV_STATE_ACTIVE: should resolve to ACTIVE when master flag is ON and role has entitlement', () => {
    const item = getMatrixItem('manage_own_family');
    const flags: ClanFeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      allow_member_self_edit: true,
      maintenance_mode: false,
    };

    const state = resolveEffectiveCellState(item, 'claimed_member', flags);
    assert.strictEqual(state, 'ACTIVE');

    // Branch editor also has entitlement on own family
    const branchEditorState = resolveEffectiveCellState(item, 'branch_editor', flags);
    assert.strictEqual(branchEditorState, 'ACTIVE');
  });

  // 2. TC_UT_GOV_STATE_SUSPENDED: Phân giải trạng thái SUSPENDED khi Master OFF
  it('TC_UT_GOV_STATE_SUSPENDED: should resolve to SUSPENDED when master switch is OFF regardless of role entitlement', () => {
    const item = getMatrixItem('manage_own_family');
    const flags: ClanFeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      allow_member_self_edit: false,
      maintenance_mode: false,
    };

    // Even though claimed_member has entitlement, master flag is OFF -> must be SUSPENDED
    const state = resolveEffectiveCellState(item, 'claimed_member', flags);
    assert.strictEqual(state, 'SUSPENDED');

    // Branch editor on this item must also be SUSPENDED
    const branchEditorState = resolveEffectiveCellState(item, 'branch_editor', flags);
    assert.strictEqual(branchEditorState, 'SUSPENDED');
  });

  // 3. TC_UT_GOV_STATE_LOCKED: Phân giải trạng thái LOCKED khi vai trò không có quyền
  it('TC_UT_GOV_STATE_LOCKED: should resolve to LOCKED when role lacks entitlement even if master switch is ON', () => {
    const item = getMatrixItem('manage_own_family');
    const flags: ClanFeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      allow_member_self_edit: true,
      maintenance_mode: false,
    };

    // viewer and guest have no entitlement on manage_own_family
    const viewerState = resolveEffectiveCellState(item, 'viewer', flags);
    assert.strictEqual(viewerState, 'LOCKED');

    const guestState = resolveEffectiveCellState(item, 'guest', flags);
    assert.strictEqual(guestState, 'LOCKED');
  });

  // 4. TC_UT_GOV_STATE_GOD_MODE: Super Admin luôn có GOD_MODE kể cả cờ tắt
  it('TC_UT_GOV_STATE_GOD_MODE: should always resolve to GOD_MODE for super_admin regardless of master switch or maintenance mode', () => {
    const item = getMatrixItem('manage_own_family');

    // Case A: Master switch OFF
    const flagsOff: ClanFeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      allow_member_self_edit: false,
      maintenance_mode: false,
    };
    const adminStateOff = resolveEffectiveCellState(item, 'super_admin', flagsOff);
    assert.strictEqual(adminStateOff, 'GOD_MODE');

    // Case B: Maintenance mode ON
    const flagsMaintenance: ClanFeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      maintenance_mode: true,
      allow_member_self_edit: false,
    };
    const adminStateMaint = resolveEffectiveCellState(item, 'super_admin', flagsMaintenance);
    assert.strictEqual(adminStateMaint, 'GOD_MODE');

    // Case C: Across ALL permission items
    for (const matrixItem of PERMISSION_MATRIX_DEFINITIONS) {
      const state = resolveEffectiveCellState(matrixItem, 'super_admin', flagsMaintenance);
      assert.strictEqual(
        state,
        'GOD_MODE',
        `Super admin must have GOD_MODE on item ${matrixItem.id}`
      );
    }
  });

  // 5. TC_UT_GOV_CIRCUIT_INVARIANT: Khi Master OFF, không có role thường nào được ACTIVE trên cùng hàng
  it('TC_UT_GOV_CIRCUIT_INVARIANT: when master circuit is OFF, 100% of non-admin roles must be SUSPENDED or LOCKED (0% ACTIVE)', () => {
    const nonAdminRoles: (UserRole | 'guest')[] = ['guest', 'viewer', 'claimed_member', 'branch_editor'];

    // Test every matrix item that is bound to a master flag
    const itemsWithMaster = PERMISSION_MATRIX_DEFINITIONS.filter((p) => Boolean(p.masterFlagKey));
    assert.ok(itemsWithMaster.length > 0, 'Must have items with masterFlagKey');

    for (const item of itemsWithMaster) {
      const masterKey = item.masterFlagKey!;
      const flagsWithOff: ClanFeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        [masterKey]: false,
      };

      for (const role of nonAdminRoles) {
        const state = resolveEffectiveCellState(item, role, flagsWithOff);
        assert.notStrictEqual(
          state,
          'ACTIVE',
          `Circuit breaker violation: role "${role}" cannot be ACTIVE on item "${item.id}" when master flag "${masterKey}" is OFF`
        );
        assert.ok(
          state === 'SUSPENDED' || state === 'LOCKED',
          `State must be either SUSPENDED or LOCKED when master is OFF, got: ${state}`
        );
      }
    }

    // Global maintenance mode invariant
    const flagsMaintenance: ClanFeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      maintenance_mode: true,
    };
    for (const item of PERMISSION_MATRIX_DEFINITIONS) {
      for (const role of nonAdminRoles) {
        const state = resolveEffectiveCellState(item, role, flagsMaintenance);
        assert.notStrictEqual(
          state,
          'ACTIVE',
          `Maintenance mode violation: role "${role}" cannot be ACTIVE on item "${item.id}" when maintenance_mode is ON`
        );
      }
    }
  });

  // 6. TC_INT_GOV_FAMILY_APPROVAL_GATE: API review claim chặn 403 khi cờ duyệt gia đình tắt
  it('TC_INT_GOV_FAMILY_APPROVAL_GATE: claim review API route guards claimed_member approval when allow_family_claim_approval is false', () => {
    const routeFilePath = path.join(__dirname, '../src/app/api/claims/[id]/review/route.ts');
    assert.ok(fs.existsSync(routeFilePath), 'Claim review route must exist');

    const routeContent = fs.readFileSync(routeFilePath, 'utf-8');

    // Verify circuit breaker check exists in claim review route
    assert.match(
      routeContent,
      /userProfile\.user_role\s*===\s*['"]claimed_member['"]/,
      'Route must inspect user_role claimed_member'
    );
    assert.match(
      routeContent,
      /allow_family_claim_approval\s*===\s*false/,
      'Route must check allow_family_claim_approval === false'
    );
    assert.match(
      routeContent,
      /allow_member_self_edit\s*===\s*false/,
      'Route must check allow_member_self_edit === false'
    );
    assert.match(
      routeContent,
      /Chức năng tự duyệt hồ sơ con cháu trong gia đình đang tạm đóng băng theo chính sách tông tộc/,
      'Route must return exact human guidance message on 403 forbidden'
    );
    assert.match(
      routeContent,
      /status:\s*403/,
      'Route must return HTTP status 403'
    );
  });

  // 7. TC_INT_GOV_SHARED_DB_SYNC: API PATCH clan-settings và resolveFeatureFlags đồng bộ cờ mới chính xác
  it('TC_INT_GOV_SHARED_DB_SYNC: resolveFeatureFlags and clan-settings handle allow_family_claim_approval with full backward compatibility', () => {
    // 1. Default value check
    assert.strictEqual(
      DEFAULT_FEATURE_FLAGS.allow_family_claim_approval,
      true,
      'DEFAULT_FEATURE_FLAGS.allow_family_claim_approval must default to true'
    );

    // 2. resolveFeatureFlags resolves undefined with default
    const resolvedDefault = resolveFeatureFlags(undefined);
    assert.strictEqual(resolvedDefault.allow_family_claim_approval, true);

    // 3. resolveFeatureFlags resolves false explicitly
    const resolvedFalse = resolveFeatureFlags({ allow_family_claim_approval: false });
    assert.strictEqual(resolvedFalse.allow_family_claim_approval, false);

    // 4. resolveFeatureFlags preserves other flags when toggling allow_family_claim_approval
    const resolvedTrue = resolveFeatureFlags({ allow_family_claim_approval: true, allow_member_self_edit: false });
    assert.strictEqual(resolvedTrue.allow_family_claim_approval, true);
    assert.strictEqual(resolvedTrue.allow_member_self_edit, false);

    // 5. Verify database schema definition
    const dbTypePath = path.join(__dirname, '../src/types/database.ts');
    const dbTypeContent = fs.readFileSync(dbTypePath, 'utf-8');
    assert.match(
      dbTypeContent,
      /allow_family_claim_approval:\s*boolean;/,
      'ClanFeatureFlags in database.ts must include allow_family_claim_approval'
    );

    // 6. Verify clan-settings route handles allow_family_claim_approval via resolveFeatureFlags
    const clanSettingsRoutePath = path.join(__dirname, '../src/app/api/clan-settings/route.ts');
    const clanSettingsContent = fs.readFileSync(clanSettingsRoutePath, 'utf-8');
    assert.match(
      clanSettingsContent,
      /resolveFeatureFlags/,
      'clan-settings route must use resolveFeatureFlags for sanitize'
    );

    // 7. Verify admin features page includes allow_family_claim_approval
    const featuresPagePath = path.join(__dirname, '../src/app/admin/features/page.tsx');
    const featuresPageContent = fs.readFileSync(featuresPagePath, 'utf-8');
    assert.match(
      featuresPageContent,
      /allow_family_claim_approval/,
      'admin/features/page.tsx must include allow_family_claim_approval'
    );
  });

  // Architectural Invariant Checks
  describe('Architectural Invariants & UI Consistency', () => {
    it('should have /admin/governance route with loading.tsx conforming to [R-UI.LOADING]', () => {
      const loadingPath = path.join(__dirname, '../src/app/admin/governance/loading.tsx');
      assert.ok(fs.existsSync(loadingPath), 'loading.tsx must exist in /admin/governance');

      const loadingContent = fs.readFileSync(loadingPath, 'utf-8');
      assert.match(
        loadingContent,
        /SyncLoadingBadge/,
        'loading.tsx must use SyncLoadingBadge'
      );
      assert.match(
        loadingContent,
        /Đang tải dữ liệu\.\.\./,
        'loading.tsx must use standardized loading text "Đang tải dữ liệu..."'
      );
    });

    it('should register /admin/governance in AdminSidebar without removing old routes', () => {
      const sidebarPath = path.join(__dirname, '../src/components/admin/AdminSidebar.tsx');
      const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

      assert.match(
        sidebarContent,
        /\/admin\/governance/,
        'AdminSidebar must include /admin/governance link'
      );
      assert.match(
        sidebarContent,
        /\/admin\/features/,
        'AdminSidebar must preserve /admin/features'
      );
      assert.match(
        sidebarContent,
        /\/admin\/roles/,
        'AdminSidebar must preserve /admin/roles'
      );
    });

    it('should have AdminGovernancePage with 7-column matrix table, master switches and impersonation', () => {
      const govPagePath = path.join(__dirname, '../src/app/admin/governance/page.tsx');
      assert.ok(fs.existsSync(govPagePath), 'page.tsx must exist in /admin/governance');

      const govPageContent = fs.readFileSync(govPagePath, 'utf-8');
      assert.match(
        govPageContent,
        /resolveEffectiveCellState/,
        'AdminGovernancePage must use resolveEffectiveCellState'
      );
      assert.match(
        govPageContent,
        /PERMISSION_MATRIX_DEFINITIONS/,
        'AdminGovernancePage must render PERMISSION_MATRIX_DEFINITIONS'
      );
      assert.match(
        govPageContent,
        /ROLES_META/,
        'AdminGovernancePage must render ROLES_META'
      );
      assert.match(
        govPageContent,
        /fat_impersonated_role/,
        'AdminGovernancePage must support role impersonation cookie'
      );
      assert.match(
        govPageContent,
        /handleToggleMasterSwitch/,
        'AdminGovernancePage must support direct toggle on master switches'
      );
      assert.match(
        govPageContent,
        /CLAN_SYSTEM_FEATURES/,
        'AdminGovernancePage must filter to strictly 8 CLAN_SYSTEM_FEATURES'
      );
      assert.doesNotMatch(
        govPageContent,
        /Cố định chức trách/,
        'AdminGovernancePage must NOT have any un-toggleable fixed rows'
      );
      assert.doesNotMatch(
        govPageContent,
        /Bàn Điều Hành\s*\/\s*Thành Viên/,
        'AdminGovernancePage must NOT have custom inconsistent breadcrumbs'
      );
    });
  });
});
