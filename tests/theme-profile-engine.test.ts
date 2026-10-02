import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_THEME_CONFIG,
  resolveThemeConfig,
  resolveEffectiveThemeProfile,
  promoteCanaryToProduction,
} from '../src/lib/admin/admin-engine';
import type { ClanThemeConfig } from '../src/types/database';

describe('Clan Design Profiles & Theme Engine (Milestone 9)', () => {
  // TC_UT_THEME_01: Khởi tạo cấu hình mặc định an toàn
  it('TC_UT_THEME_01: should return default classic profile and all scope when input is empty or invalid', () => {
    assert.deepStrictEqual(resolveThemeConfig(undefined), {
      active_profile: 'classic',
      canary_enabled: false,
      canary_profile: 'contemporary_heritage',
      apply_scope: 'all',
      allowed_user_ids: [],
    });

    assert.deepStrictEqual(resolveThemeConfig(null), {
      active_profile: 'classic',
      canary_enabled: false,
      canary_profile: 'contemporary_heritage',
      apply_scope: 'all',
      allowed_user_ids: [],
    });

    assert.deepStrictEqual(resolveThemeConfig({}), {
      active_profile: 'classic',
      canary_enabled: false,
      canary_profile: 'contemporary_heritage',
      apply_scope: 'all',
      allowed_user_ids: [],
    });

    // Cấu hình không hợp lệ tự động sửa lỗi
    const invalidConfig = {
      active_profile: 'unknown_theme' as any,
      apply_scope: 'invalid_scope' as any,
      allowed_user_ids: ['u1', 123 as any, null as any],
    };
    const resolved = resolveThemeConfig(invalidConfig);
    assert.strictEqual(resolved.active_profile, 'classic');
    assert.strictEqual(resolved.apply_scope, 'all');
    assert.deepStrictEqual(resolved.allowed_user_ids, ['u1']);
  });

  // TC_UT_THEME_02: Phân giải khi scope là 'all'
  it('TC_UT_THEME_02: should resolve to heritage for all users and guests when scope is all', () => {
    const config: ClanThemeConfig = {
      active_profile: 'heritage',
      apply_scope: 'all',
      allowed_user_ids: [],
    };

    // Khách vãng lai (không đăng nhập)
    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'heritage');
    assert.strictEqual(resolveEffectiveThemeProfile(config, undefined), 'heritage');

    // Con cháu thông thường (viewer / claimed_member)
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-guest', role: 'viewer', isSuperAdmin: false }),
      'heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-member', role: 'claimed_member', isSuperAdmin: false }),
      'heritage'
    );

    // Ban biên tập & Super Admin
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-editor', role: 'branch_editor', isSuperAdmin: false }),
      'heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-admin', role: 'super_admin', isSuperAdmin: true }),
      'heritage'
    );

    // Khi active_profile là classic, mọi người đều nhận classic bất kể scope
    const classicConfig: ClanThemeConfig = {
      active_profile: 'classic',
      apply_scope: 'all',
      allowed_user_ids: [],
    };
    assert.strictEqual(resolveEffectiveThemeProfile(classicConfig, { isSuperAdmin: true }), 'classic');
  });

  // TC_UT_THEME_03: Phân giải khi scope là 'admin_only'
  it('TC_UT_THEME_03: should only grant heritage to super_admin when scope is admin_only', () => {
    const config: ClanThemeConfig = {
      active_profile: 'heritage',
      apply_scope: 'admin_only',
      allowed_user_ids: [],
    };

    // Super Admin nhận heritage
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'admin-1', role: 'super_admin', isSuperAdmin: true }),
      'heritage'
    );

    // Khách và con cháu nhận classic (an toàn không bị xáo trộn)
    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'classic');
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'guest-1', role: 'viewer', isSuperAdmin: false }),
      'classic'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'member-1', role: 'claimed_member', isSuperAdmin: false }),
      'classic'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'editor-1', role: 'branch_editor', isSuperAdmin: false }),
      'classic'
    );
  });

  // TC_UT_THEME_04: Phân giải khi scope là 'custom_users'
  it('TC_UT_THEME_04: should grant heritage to super_admin and whitelisted users only when scope is custom_users', () => {
    const config: ClanThemeConfig = {
      active_profile: 'heritage',
      apply_scope: 'custom_users',
      allowed_user_ids: ['whitelisted-user-1', 'whitelisted-user-2'],
    };

    // Super Admin luôn nhận heritage
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'admin-1', role: 'super_admin', isSuperAdmin: true }),
      'heritage'
    );

    // User nằm trong whitelist nhận heritage
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'whitelisted-user-1', role: 'claimed_member', isSuperAdmin: false }),
      'heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'whitelisted-user-2', role: 'viewer', isSuperAdmin: false }),
      'heritage'
    );

    // User không nằm trong whitelist nhận classic
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'other-user', role: 'claimed_member', isSuperAdmin: false }),
      'classic'
    );
    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'classic');
  });

  // TC_UT_THEME_05: Tương thích với Role Impersonation
  it('TC_UT_THEME_05: should respect impersonated role when super admin impersonates guest or member under admin_only scope', () => {
    const config: ClanThemeConfig = {
      active_profile: 'heritage',
      apply_scope: 'admin_only',
      allowed_user_ids: [],
    };

    // Khi Super Admin đang đóng vai 'guest' (effectiveIsSuperAdmin = false)
    const impersonatingGuest = {
      id: 'admin-1',
      role: 'viewer' as const,
      isSuperAdmin: false, // Vì đã đóng vai guest
    };
    assert.strictEqual(resolveEffectiveThemeProfile(config, impersonatingGuest), 'classic');

    // Khi đóng vai Super Admin thực sự
    const realAdmin = {
      id: 'admin-1',
      role: 'super_admin' as const,
      isSuperAdmin: true,
    };
    assert.strictEqual(resolveEffectiveThemeProfile(config, realAdmin), 'heritage');
  });

  // TC_INT_THEME_01: API GET Contract validation
  it('TC_INT_THEME_01: should parse and validate theme_config payload from raw clan_settings JSON', () => {
    const rawDbRow = {
      clan_name: 'Gia Phả Phạm Văn',
      theme_config: {
        active_profile: 'heritage',
        apply_scope: 'custom_users',
        allowed_user_ids: ['u-100', 'u-200'],
      },
    };

    const resolved = resolveThemeConfig(rawDbRow.theme_config as any);
    assert.strictEqual(resolved.active_profile, 'heritage');
    assert.strictEqual(resolved.apply_scope, 'custom_users');
    assert.deepStrictEqual(resolved.allowed_user_ids, ['u-100', 'u-200']);
  });

  // TC_INT_THEME_02 & 03: API PATCH simulation & input validation
  it('TC_INT_THEME_02 & 03: should validate PATCH body and safely filter theme_config updates', () => {
    // Input từ request body
    const patchBody = {
      theme_config: {
        active_profile: 'heritage',
        apply_scope: 'admin_only',
        allowed_user_ids: ['admin-uuid'],
      },
    };

    const validated = resolveThemeConfig(patchBody.theme_config as any);
    assert.strictEqual(validated.active_profile, 'heritage');
    assert.strictEqual(validated.apply_scope, 'admin_only');
    assert.deepStrictEqual(validated.allowed_user_ids, ['admin-uuid']);

    // Serialized cookie format test
    const serializedCookie = JSON.stringify(validated);
    const parsedCookie = JSON.parse(serializedCookie);
    assert.strictEqual(parsedCookie.active_profile, 'heritage');
    assert.strictEqual(parsedCookie.apply_scope, 'admin_only');
  });

  // TC_UT_THEME_06: Khởi tạo & phân giải an toàn với profile thứ 3 contemporary_heritage
  it('TC_UT_THEME_06: should resolve contemporary_heritage correctly and not fallback to classic', () => {
    const config: ClanThemeConfig = {
      active_profile: 'contemporary_heritage',
      apply_scope: 'all',
      allowed_user_ids: [],
    };
    const resolved = resolveThemeConfig(config);
    assert.strictEqual(resolved.active_profile, 'contemporary_heritage');
    assert.strictEqual(resolved.apply_scope, 'all');
    assert.deepStrictEqual(resolved.allowed_user_ids, []);
  });

  // TC_UT_THEME_07: Phân giải khi active_profile là contemporary_heritage và scope là 'all'
  it('TC_UT_THEME_07: should resolve to contemporary_heritage for all users and guests when scope is all', () => {
    const config: ClanThemeConfig = {
      active_profile: 'contemporary_heritage',
      apply_scope: 'all',
      allowed_user_ids: [],
    };

    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'contemporary_heritage');
    assert.strictEqual(resolveEffectiveThemeProfile(config, undefined), 'contemporary_heritage');
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-guest', role: 'viewer', isSuperAdmin: false }),
      'contemporary_heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-admin', role: 'super_admin', isSuperAdmin: true }),
      'contemporary_heritage'
    );
  });

  // TC_UT_THEME_08: Phân giải khi active_profile là contemporary_heritage và scope là 'admin_only'
  it('TC_UT_THEME_08: should only grant contemporary_heritage to super_admin when scope is admin_only', () => {
    const config: ClanThemeConfig = {
      active_profile: 'contemporary_heritage',
      apply_scope: 'admin_only',
      allowed_user_ids: [],
    };

    // Super Admin nhận contemporary_heritage
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'admin-1', role: 'super_admin', isSuperAdmin: true }),
      'contemporary_heritage'
    );

    // Guest và member thường nhận classic
    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'classic');
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-1', role: 'viewer', isSuperAdmin: false }),
      'classic'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'member-1', role: 'claimed_member', isSuperAdmin: false }),
      'classic'
    );
  });

  // TC_UT_THEME_09: Phân giải khi active_profile là contemporary_heritage và scope là 'custom_users'
  it('TC_UT_THEME_09: should grant contemporary_heritage to super_admin and whitelisted users only when scope is custom_users', () => {
    const config: ClanThemeConfig = {
      active_profile: 'contemporary_heritage',
      apply_scope: 'custom_users',
      allowed_user_ids: ['u1', 'u2'],
    };

    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'admin-1', role: 'super_admin', isSuperAdmin: true }),
      'contemporary_heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'u1', role: 'viewer', isSuperAdmin: false }),
      'contemporary_heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'u3', role: 'viewer', isSuperAdmin: false }),
      'classic'
    );
    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'classic');
  });

  // TC_UT_THEME_10: Tương thích Role Impersonation với contemporary_heritage
  it('TC_UT_THEME_10: should respect impersonated role when super admin impersonates guest under admin_only scope with contemporary_heritage', () => {
    const config: ClanThemeConfig = {
      active_profile: 'contemporary_heritage',
      apply_scope: 'admin_only',
      allowed_user_ids: [],
    };

    // Đóng vai guest -> classic
    const impersonatingGuest = {
      id: 'admin-1',
      role: 'viewer' as const,
      isSuperAdmin: false,
    };
    assert.strictEqual(resolveEffectiveThemeProfile(config, impersonatingGuest), 'classic');

    // Super admin thật -> contemporary_heritage
    const realAdmin = {
      id: 'admin-1',
      role: 'super_admin' as const,
      isSuperAdmin: true,
    };
    assert.strictEqual(resolveEffectiveThemeProfile(config, realAdmin), 'contemporary_heritage');
  });

  // TC_UT_THEME_2TIER_01: Khi canary_enabled = false (hoặc apply_scope = 'all'), 100% người dùng nhận Base Theme
  it('TC_UT_THEME_2TIER_01: should grant base active_profile to all users when canary is disabled', () => {
    const config: ClanThemeConfig = {
      active_profile: 'heritage',
      canary_enabled: false,
      canary_profile: 'contemporary_heritage',
      apply_scope: 'all',
      allowed_user_ids: [],
    };

    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'heritage');
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'u1', role: 'viewer', isSuperAdmin: false }),
      'heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'u2', role: 'claimed_member', isSuperAdmin: false }),
      'heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'admin-1', role: 'super_admin', isSuperAdmin: true }),
      'heritage'
    );
  });

  // TC_UT_THEME_2TIER_02: Khi canary_enabled = true và scope = 'admin_only': Admin nhận Canary, Con cháu nhận Base Theme (Zero Regression)
  it('TC_UT_THEME_2TIER_02: should grant canary to admin while preserving base heritage for con chau and guests under admin_only', () => {
    const config: ClanThemeConfig = {
      active_profile: 'heritage',
      canary_enabled: true,
      canary_profile: 'contemporary_heritage',
      apply_scope: 'admin_only',
      allowed_user_ids: [],
    };

    // Super Admin nhận giao diện thử nghiệm Contemporary Heritage
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'admin-1', role: 'super_admin', isSuperAdmin: true }),
      'contemporary_heritage'
    );

    // Con cháu & Khách vãng lai nhận Base Profile Dòng Họ ('heritage'), KHÔNG bị rơi về 'classic'
    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'heritage');
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-guest', role: 'viewer', isSuperAdmin: false }),
      'heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-member', role: 'claimed_member', isSuperAdmin: false }),
      'heritage'
    );
  });

  // TC_UT_THEME_2TIER_03: Khi apply_scope = 'custom_users': Whitelist nhận Canary, người khác nhận Base
  it('TC_UT_THEME_2TIER_03: should grant canary to whitelisted users and admin, while others get base profile', () => {
    const config: ClanThemeConfig = {
      active_profile: 'heritage',
      canary_enabled: true,
      canary_profile: 'contemporary_heritage',
      apply_scope: 'custom_users',
      allowed_user_ids: ['user-tuan', 'user-nam'],
    };

    // Super Admin nhận Canary
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'admin-1', role: 'super_admin', isSuperAdmin: true }),
      'contemporary_heritage'
    );

    // Người trong Whitelist nhận Canary
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-tuan', role: 'claimed_member', isSuperAdmin: false }),
      'contemporary_heritage'
    );
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-nam', role: 'claimed_member', isSuperAdmin: false }),
      'contemporary_heritage'
    );

    // Người ngoài Whitelist nhận Base Heritage (không bị rơi về classic)
    assert.strictEqual(
      resolveEffectiveThemeProfile(config, { id: 'user-other', role: 'claimed_member', isSuperAdmin: false }),
      'heritage'
    );
    assert.strictEqual(resolveEffectiveThemeProfile(config, null), 'heritage');
  });

  // TC_UT_THEME_PROMOTE_01: Hàm promoteCanaryToProduction chuyển đổi nguyên tử 1-Click
  it('TC_UT_THEME_PROMOTE_01: should promote canary_profile to active_profile and disable canary', () => {
    const initialConfig: ClanThemeConfig = {
      active_profile: 'heritage',
      canary_enabled: true,
      canary_profile: 'contemporary_heritage',
      apply_scope: 'admin_only',
      allowed_user_ids: [],
    };

    const promoted = promoteCanaryToProduction(initialConfig);

    assert.strictEqual(promoted.active_profile, 'contemporary_heritage');
    assert.strictEqual(promoted.canary_enabled, false);
    assert.strictEqual(promoted.apply_scope, 'all');

    // Sau khi promote, 100% mọi người đều nhận profile mới
    assert.strictEqual(resolveEffectiveThemeProfile(promoted, null), 'contemporary_heritage');
    assert.strictEqual(
      resolveEffectiveThemeProfile(promoted, { id: 'user-guest', role: 'viewer', isSuperAdmin: false }),
      'contemporary_heritage'
    );
  });
});
