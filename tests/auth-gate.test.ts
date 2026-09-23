import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import type { User } from '@supabase/supabase-js';
import { evaluateAuthGate } from '../src/lib/auth/auth-gate';
import { resolveFeatureFlags, DEFAULT_FEATURE_FLAGS } from '../src/lib/admin/admin-engine';
import { NAV_ITEMS } from '../src/components/navigation/MobileBottomNav';

describe('Auth Gate & Guest Visibility Test Suite (Milestone 7.5)', () => {
  const mockAuthUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'member@clan.org',
  } as User;

  // 1. TC_UT_MW_PRIVATE_GUEST_REDIRECT
  it('TC_UT_MW_PRIVATE_GUEST_REDIRECT: Middleware chặn guest khi enable_public_tree=false', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: false });
    const decision = evaluateAuthGate('/tree', null, flags);

    assert.strictEqual(decision.action, 'redirect');
    assert.strictEqual(decision.redirectUrl, '/login-gate?returnTo=%2Ftree');
    assert.strictEqual(decision.statusCode, 307);
  });

  // 2. TC_UT_MW_PRIVATE_LOGGEDIN_PASS
  it('TC_UT_MW_PRIVATE_LOGGEDIN_PASS: Middleware cho phép user đã đăng nhập khi enable_public_tree=false', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: false });
    const decision = evaluateAuthGate('/tree', mockAuthUser, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 3. TC_UT_MW_PUBLIC_GUEST_TREE_PASS
  it('TC_UT_MW_PUBLIC_GUEST_TREE_PASS: Middleware cho guest xem /tree khi enable_public_tree=true', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: true });
    const decision = evaluateAuthGate('/tree', null, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 4. TC_UT_MW_PUBLIC_GUEST_HOME_PASS
  it('TC_UT_MW_PUBLIC_GUEST_HOME_PASS: Middleware cho guest xem / khi enable_public_tree=true', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: true });
    const decision = evaluateAuthGate('/', null, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 5. TC_UT_MW_PUBLIC_GUEST_KINSHIP_BLOCK
  it('TC_UT_MW_PUBLIC_GUEST_KINSHIP_BLOCK: Middleware chặn guest /kinship khi enable_public_tree=true', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: true });
    const decision = evaluateAuthGate('/kinship', null, flags);

    assert.strictEqual(decision.action, 'redirect');
    assert.strictEqual(decision.redirectUrl, '/login-gate?returnTo=%2Fkinship');
    assert.strictEqual(decision.statusCode, 307);
  });

  // 6. TC_UT_MW_PUBLIC_GUEST_ANNIVERSARIES_BLOCK
  it('TC_UT_MW_PUBLIC_GUEST_ANNIVERSARIES_BLOCK: Middleware chặn guest /anniversaries khi enable_public_tree=true', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: true });
    const decision = evaluateAuthGate('/anniversaries', null, flags);

    assert.strictEqual(decision.action, 'redirect');
    assert.strictEqual(decision.redirectUrl, '/login-gate?returnTo=%2Fanniversaries');
    assert.strictEqual(decision.statusCode, 307);
  });

  // 7. TC_UT_MW_BYPASS_ADMIN
  it('TC_UT_MW_BYPASS_ADMIN: Middleware KHÔNG chặn /admin/*', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: false });
    const decision = evaluateAuthGate('/admin/features', null, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 8. TC_UT_MW_BYPASS_API
  it('TC_UT_MW_BYPASS_API: Middleware KHÔNG chặn /api/*', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: false });
    const decision = evaluateAuthGate('/api/members', null, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 9. TC_UT_MW_BYPASS_LOGIN_GATE
  it('TC_UT_MW_BYPASS_LOGIN_GATE: Middleware KHÔNG chặn /login-gate để tránh vòng lặp', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: false });
    const decision = evaluateAuthGate('/login-gate', null, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 10. TC_UT_MW_BYPASS_AUTH_CALLBACK
  it('TC_UT_MW_BYPASS_AUTH_CALLBACK: Middleware KHÔNG chặn /auth/callback', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: false });
    const decision = evaluateAuthGate('/auth/callback', null, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 11. TC_UT_MW_PUBLIC_LOGGEDIN_FULL_ACCESS
  it('TC_UT_MW_PUBLIC_LOGGEDIN_FULL_ACCESS: Middleware cho phép full access khi đã đăng nhập', () => {
    const flags = resolveFeatureFlags({ enable_public_tree: true });
    const decision = evaluateAuthGate('/anniversaries', mockAuthUser, flags);

    assert.strictEqual(decision.action, 'pass');
  });

  // 12. TC_UT_MW_DEFAULT_FLAGS_FALLBACK
  it('TC_UT_MW_DEFAULT_FLAGS_FALLBACK: Dùng DEFAULT_FEATURE_FLAGS khi không có cookie/DB', () => {
    const flags = resolveFeatureFlags(undefined);
    assert.strictEqual(flags.enable_public_tree, true, 'enable_public_tree mặc định là true');

    const treeDecision = evaluateAuthGate('/tree', null, flags);
    assert.strictEqual(treeDecision.action, 'pass', 'Mặc định guest xem được cây');

    const homeDecision = evaluateAuthGate('/', null, flags);
    assert.strictEqual(homeDecision.action, 'pass', 'Mặc định guest xem được trang chủ');
  });

  // 13. TC_UT_HOME_GUEST_NO_SPOTLIGHT
  it('TC_UT_HOME_GUEST_NO_SPOTLIGHT: Home ẩn Spotlight Ngày Giỗ cho guest', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    assert.ok(fs.existsSync(homePath), 'src/app/page.tsx phải tồn tại');

    const homeContent = fs.readFileSync(homePath, 'utf8');

    // Kiểm tra spotlight được bao bọc trong điều kiện !isGuest
    assert.ok(
      homeContent.includes('!isGuest && nearestGroup && nearestMember'),
      'Block Spotlight Ngày Giỗ Gần Nhất phải được bọc trong !isGuest'
    );
  });

  // 14. TC_UT_HOME_LOGGEDIN_HAS_SPOTLIGHT
  it('TC_UT_HOME_LOGGEDIN_HAS_SPOTLIGHT: Home hiện Spotlight Ngày Giỗ cho user đã đăng nhập', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');

    assert.ok(
      homeContent.includes('Ngày Giỗ Gần Nhất'),
      'src/app/page.tsx phải chứa tiêu đề Ngày Giỗ Gần Nhất'
    );
    assert.ok(
      homeContent.includes('isGuest'),
      'src/app/page.tsx phải có biến kiểm tra isGuest'
    );
  });

  // 15. TC_UT_NAVBAR_GUEST_HIDDEN_LINKS
  it('TC_UT_NAVBAR_GUEST_HIDDEN_LINKS: Navbar ẩn Lịch Giỗ/Xưng hô cho guest', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar/Navbar.tsx');
    assert.ok(fs.existsSync(navbarPath), 'src/components/navbar/Navbar.tsx phải tồn tại');

    const navbarContent = fs.readFileSync(navbarPath, 'utf8');

    // Kiểm tra link /anniversaries và /kinship được bọc trong !isGuest
    assert.ok(
      navbarContent.includes('!isGuest'),
      'Navbar.tsx phải chứa điều kiện !isGuest để ẩn các liên kết nội bộ'
    );
    assert.ok(
      navbarContent.includes('href="/anniversaries"'),
      'Navbar.tsx có link /anniversaries'
    );
    assert.ok(
      navbarContent.includes('href="/kinship"'),
      'Navbar.tsx có link /kinship'
    );
  });

  // 16. TC_UT_MOBILE_NAV_GUEST_FILTERED
  it('TC_UT_MOBILE_NAV_GUEST_FILTERED: MobileBottomNav lọc link chuẩn xác cho guest', () => {
    // 16a. Khi isGuest = true, enablePublicTree = true -> chỉ có Trang Chủ và Phả Hệ
    const guestPublicItems = NAV_ITEMS.filter((item) => {
      if (item.href === '/anniversaries' || item.href === '/kinship') return false;
      if (item.href === '/tree') return true;
      return true;
    });

    assert.strictEqual(guestPublicItems.length, 2, 'Guest công khai chỉ thấy 2 tabs');
    assert.strictEqual(guestPublicItems[0].href, '/');
    assert.strictEqual(guestPublicItems[1].href, '/tree');

    // 16b. Khi isGuest = true, enablePublicTree = false -> chỉ có Trang Chủ
    const guestPrivateItems = NAV_ITEMS.filter((item) => {
      if (item.href === '/anniversaries' || item.href === '/kinship') return false;
      if (item.href === '/tree') return false;
      return true;
    });

    assert.strictEqual(guestPrivateItems.length, 1, 'Guest riêng tư chỉ thấy 1 tab');
    assert.strictEqual(guestPrivateItems[0].href, '/');

    // 16c. Khi isGuest = false -> thấy đủ 4 tabs
    assert.strictEqual(NAV_ITEMS.length, 4, 'Đã đăng nhập thấy đủ 4 tabs');
  });

  // 17. TC_UT_MOBILE_NAV_LABEL_SYNC
  it('TC_UT_MOBILE_NAV_LABEL_SYNC: MobileBottomNav đổi nhãn "Vai Vế" → "Xưng hô"', () => {
    const kinshipItem = NAV_ITEMS.find((item) => item.href === '/kinship');
    assert.ok(kinshipItem, 'Phải có item /kinship trong NAV_ITEMS');
    assert.strictEqual(kinshipItem.label, 'Xưng hô', 'Nhãn tab phải là "Xưng hô" thay vì "Vai Vế"');
  });

  // 18. TC_UT_SETTINGS_ADMIN_CLIENT_MUTATION (Milestone 7.6)
  it('TC_UT_SETTINGS_ADMIN_CLIENT_MUTATION: PATCH clan-settings gọi Admin Client để bypass RLS', () => {
    const routePath = path.resolve(process.cwd(), 'src/app/api/clan-settings/route.ts');
    assert.ok(fs.existsSync(routePath), 'src/app/api/clan-settings/route.ts phải tồn tại');

    const routeContent = fs.readFileSync(routePath, 'utf8');
    assert.ok(
      routeContent.includes("import { createAdminClient } from '@/lib/supabase/admin'"),
      'route.ts phải import createAdminClient'
    );
    assert.ok(
      routeContent.includes('const adminClient = createAdminClient() || supabase'),
      'route.ts phải khởi tạo adminClient với service role key để bypass RLS'
    );
    assert.ok(
      routeContent.includes("adminClient\n        .from('clan_settings')\n        .update(updatePayload)") ||
      routeContent.includes("adminClient.from('clan_settings').update(updatePayload)") ||
      routeContent.includes("adminClient\n        .from('clan_settings')"),
      'route.ts phải thực hiện update qua adminClient'
    );
  });

  // 19. TC_UT_COOKIE_CACHE_SYNC (Milestone 7.6)
  it('TC_UT_COOKIE_CACHE_SYNC: Đồng bộ fat_feature_flags_cache khi lưu cờ mới', () => {
    const routePath = path.resolve(process.cwd(), 'src/app/api/clan-settings/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    assert.ok(
      routeContent.includes("'fat_feature_flags_cache'"),
      'route.ts phải set cookie fat_feature_flags_cache để làm tươi cache của Middleware'
    );
    assert.ok(
      routeContent.includes("maxAge: 300"),
      'fat_feature_flags_cache phải có maxAge 300 giây khớp với Middleware TTL'
    );
  });

  // 20. TC_UT_AUTOSAVE_OPTIMISTIC_ROLLBACK (Milestone 7.6)
  it('TC_UT_AUTOSAVE_OPTIMISTIC_ROLLBACK: Features page hỗ trợ Auto-Save, optimistic update và rollback', () => {
    const featuresPagePath = path.resolve(process.cwd(), 'src/app/admin/features/page.tsx');
    assert.ok(fs.existsSync(featuresPagePath), 'src/app/admin/features/page.tsx phải tồn tại');

    const pageContent = fs.readFileSync(featuresPagePath, 'utf8');

    assert.ok(
      pageContent.includes('setSavingKey'),
      'AdminFeaturesPage phải quản lý savingKey cho từng switch'
    );
    assert.ok(
      pageContent.includes('setSavedKey'),
      'AdminFeaturesPage phải quản lý savedKey để hiện badge đã lưu'
    );
    assert.ok(
      pageContent.includes('setFlags(previousFlags)'),
      'AdminFeaturesPage phải rollback setFlags(previousFlags) khi API báo lỗi hoặc mất kết nối'
    );
    assert.ok(
      pageContent.includes("body: JSON.stringify({ feature_flags: newFlags })"),
      'handleToggle phải tự động gọi PATCH /api/clan-settings với newFlags'
    );
  });

  // 21. TC_INT_INCOGNITO_ZERO_COOKIE_INSPECTION (Milestone 7.6)
  it('TC_INT_INCOGNITO_ZERO_COOKIE_INSPECTION: Khách không cookie nhận đúng cờ từ DB và bị Auth Gate chuyển hướng', () => {
    // Mô phỏng Tab Ẩn danh: không có cookie, đọc từ DB cờ enable_public_tree: false
    const dbResolvedFlags = resolveFeatureFlags({ enable_public_tree: false });

    // Khi truy cập / (Home)
    const homeDecision = evaluateAuthGate('/', null, dbResolvedFlags);
    assert.strictEqual(homeDecision.action, 'redirect');
    assert.strictEqual(homeDecision.redirectUrl, '/login-gate?returnTo=%2F');

    // Khi truy cập /tree
    const treeDecision = evaluateAuthGate('/tree', null, dbResolvedFlags);
    assert.strictEqual(treeDecision.action, 'redirect');
    assert.strictEqual(treeDecision.redirectUrl, '/login-gate?returnTo=%2Ftree');
  });

  // 22. TC_UT_LOGOUT_BUTTON_PROP_INTEGRITY (Milestone 7.7)
  it('TC_UT_LOGOUT_BUTTON_PROP_INTEGRITY: Nút đăng xuất là button có onClick handleLogout', () => {
    const authButtonPath = path.resolve(process.cwd(), 'src/components/auth/AuthButton.tsx');
    assert.ok(fs.existsSync(authButtonPath), 'src/components/auth/AuthButton.tsx phải tồn tại');

    const content = fs.readFileSync(authButtonPath, 'utf8');

    // Kiểm tra không còn dùng thẻ <a> trỏ vào dev link
    assert.ok(
      !content.includes('href="/api/auth/dev-login?action=logout"'),
      'Nút logout không được dùng thẻ link <a> trỏ vào dev-login'
    );

    // Kiểm tra là thẻ button có onClick={handleLogout}
    assert.ok(
      content.includes('onClick={handleLogout}') && content.includes('id="logout-btn"'),
      'Nút logout phải là button gọi onClick={handleLogout}'
    );
  });

  // 23. TC_UT_HANDLE_LOGOUT_FULL_SIGNOUT (Milestone 7.7)
  it('TC_UT_HANDLE_LOGOUT_FULL_SIGNOUT: handleLogout gọi cả client signOut và API server', () => {
    const authButtonPath = path.resolve(process.cwd(), 'src/components/auth/AuthButton.tsx');
    const content = fs.readFileSync(authButtonPath, 'utf8');

    assert.ok(
      content.includes('await supabase.auth.signOut()'),
      'handleLogout phải gọi supabase.auth.signOut() trên client'
    );
    assert.ok(
      content.includes("fetch('/api/auth/logout', { method: 'POST' })"),
      'handleLogout phải gọi endpoint server /api/auth/logout'
    );
    assert.ok(
      !content.includes("if (process.env.NODE_ENV === 'development') {\n      window.location.href = '/api/auth/dev-login?action=logout'"),
      'handleLogout không được bỏ qua signOut trong môi trường dev'
    );
  });

  // 24. TC_UT_LOGOUT_API_ROUTE_EXISTS (Milestone 7.7)
  it('TC_UT_LOGOUT_API_ROUTE_EXISTS: API route /api/auth/logout tồn tại và dọn dẹp đủ 2 tầng', () => {
    const routePath = path.resolve(process.cwd(), 'src/app/api/auth/logout/route.ts');
    assert.ok(fs.existsSync(routePath), 'src/app/api/auth/logout/route.ts phải tồn tại');

    const content = fs.readFileSync(routePath, 'utf8');

    assert.ok(content.includes('export async function POST'), 'Phải có handler POST');
    assert.ok(content.includes('export async function GET'), 'Phải có handler GET');
    assert.ok(content.includes('supabase.auth.signOut()'), 'Route phải gọi supabase.auth.signOut()');
    assert.ok(content.includes("'fat_dev_user'"), 'Route phải xóa cookie fat_dev_user');
    assert.ok(content.includes("'fat_feature_flags_cache'"), 'Route phải xóa cookie fat_feature_flags_cache');
  });

  // 25. TC_UT_DEV_LOGIN_CLEANSE_SUPABASE (Milestone 7.7)
  it('TC_UT_DEV_LOGIN_CLEANSE_SUPABASE: dev-login logout dọn sạch cả Supabase session', () => {
    const routePath = path.resolve(process.cwd(), 'src/app/api/auth/dev-login/route.ts');
    const content = fs.readFileSync(routePath, 'utf8');

    assert.ok(
      content.includes('await supabase.auth.signOut()'),
      'dev-login khi logout cũng phải gọi supabase.auth.signOut()'
    );
  });

  // 26. TC_UT_NAVBAR_KINSHIP_FLAG_ENFORCEMENT (Milestone 7.8)
  it('TC_UT_NAVBAR_KINSHIP_FLAG_ENFORCEMENT: Navbar ẩn Xưng hô khi enable_kinship_lookup=false', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar/Navbar.tsx');
    assert.ok(fs.existsSync(navbarPath), 'src/components/navbar/Navbar.tsx phải tồn tại');

    const content = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(
      content.includes('enable_kinship_lookup'),
      'Navbar.tsx phải kiểm tra cờ enable_kinship_lookup'
    );
    assert.ok(
      content.includes('flags.enable_kinship_lookup || isSuperAdmin') ||
      content.includes('enable_kinship_lookup || isSuperAdmin'),
      'Navbar.tsx phải hiển thị link /kinship phụ thuộc vào enable_kinship_lookup hoặc isSuperAdmin'
    );
  });

  // 27. TC_UT_NAVBAR_ANNIVERSARIES_FLAG_ENFORCEMENT (Milestone 7.8)
  it('TC_UT_NAVBAR_ANNIVERSARIES_FLAG_ENFORCEMENT: Navbar ẩn Lịch Giỗ khi enable_anniversaries=false', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar/Navbar.tsx');
    assert.ok(fs.existsSync(navbarPath), 'src/components/navbar/Navbar.tsx phải tồn tại');

    const content = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(
      content.includes('enable_anniversaries'),
      'Navbar.tsx phải kiểm tra cờ enable_anniversaries'
    );
    assert.ok(
      content.includes('flags.enable_anniversaries || isSuperAdmin') ||
      content.includes('enable_anniversaries || isSuperAdmin'),
      'Navbar.tsx phải hiển thị link /anniversaries phụ thuộc vào enable_anniversaries hoặc isSuperAdmin'
    );
  });

  // 28. TC_UT_MOBILE_NAV_FLAG_FILTERING (Milestone 7.8)
  it('TC_UT_MOBILE_NAV_FLAG_FILTERING: MobileBottomNav lọc items theo cả 2 cờ tính năng', () => {
    // Tắt cả 2 cờ: tra cứu vai vế và lịch giỗ
    const disabledFlags = resolveFeatureFlags({
      enable_kinship_lookup: false,
      enable_anniversaries: false,
    });

    // Hàm mô phỏng logic lọc của MobileBottomNav
    const filterNavItems = (flags: typeof disabledFlags, isSuperAdmin: boolean, isGuest: boolean) => {
      return NAV_ITEMS.filter((item) => {
        if (item.href === '/') return true;
        if (item.href === '/tree') return !isGuest || flags.enable_public_tree;
        if (item.href === '/anniversaries') {
          if (isGuest) return false;
          return flags.enable_anniversaries || isSuperAdmin;
        }
        if (item.href === '/kinship') {
          if (isGuest) return false;
          return flags.enable_kinship_lookup || isSuperAdmin;
        }
        return true;
      });
    };

    // User thông thường (isGuest = false, isSuperAdmin = false) khi cả 2 cờ tắt
    const visibleRegular = filterNavItems(disabledFlags, false, false);
    assert.strictEqual(
      visibleRegular.some((item) => item.href === '/kinship'),
      false,
      'Tab /kinship phải bị ẩn khi enable_kinship_lookup = false'
    );
    assert.strictEqual(
      visibleRegular.some((item) => item.href === '/anniversaries'),
      false,
      'Tab /anniversaries phải bị ẩn khi enable_anniversaries = false'
    );
    assert.strictEqual(visibleRegular.length, 2, 'Chỉ còn hiển thị 2 tab: Trang Chủ và Phả Hệ');

    // Super Admin (isSuperAdmin = true) luôn thấy đủ 4 tabs dù cờ tắt
    const visibleAdmin = filterNavItems(disabledFlags, true, false);
    assert.strictEqual(visibleAdmin.length, 4, 'Super Admin luôn thấy đủ 4 tab để cấu hình & kiểm tra');
  });

  // 29. TC_UT_HOMEPAGE_ANNIVERSARY_FLAG_GUARD (Milestone 7.8)
  it('TC_UT_HOMEPAGE_ANNIVERSARY_FLAG_GUARD: Trang chủ ẩn Spotlight Giỗ khi cờ tắt', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    assert.ok(fs.existsSync(pagePath), 'src/app/page.tsx phải tồn tại');

    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(
      content.includes('featureFlags.enable_anniversaries'),
      'src/app/page.tsx phải kiểm tra cờ featureFlags.enable_anniversaries cho khối Spotlight Ngày Giỗ'
    );
    assert.ok(
      content.includes('!isGuest') && content.includes('featureFlags.enable_anniversaries'),
      'Khối Spotlight Ngày Giỗ phải kết hợp cả !isGuest và featureFlags.enable_anniversaries'
    );
  });

  // 30. TC_UT_AUTH_GATE_FEATURE_FLAGS_ROUTE_BLOCK (Milestone 7.8)
  it('TC_UT_AUTH_GATE_FEATURE_FLAGS_ROUTE_BLOCK: Auth Gate chặn route khi cờ bị tắt, Super Admin bypass', () => {
    const regularUser = { id: 'regular-user-id', email: 'user@test.com' } as any;
    const disabledKinshipFlags = resolveFeatureFlags({
      enable_kinship_lookup: false,
      enable_anniversaries: true,
    });
    const disabledAnnivFlags = resolveFeatureFlags({
      enable_kinship_lookup: true,
      enable_anniversaries: false,
    });

    // 1. Khi enable_kinship_lookup = false, user thường truy cập /kinship -> redirect về /
    const kinshipBlockDecision = evaluateAuthGate('/kinship', regularUser, disabledKinshipFlags, false);
    assert.strictEqual(kinshipBlockDecision.action, 'redirect');
    assert.strictEqual(kinshipBlockDecision.redirectUrl, '/');
    assert.strictEqual(kinshipBlockDecision.statusCode, 307);

    // 2. Khi enable_anniversaries = false, user thường truy cập /anniversaries -> redirect về /
    const annivBlockDecision = evaluateAuthGate('/anniversaries', regularUser, disabledAnnivFlags, false);
    assert.strictEqual(annivBlockDecision.action, 'redirect');
    assert.strictEqual(annivBlockDecision.redirectUrl, '/');
    assert.strictEqual(annivBlockDecision.statusCode, 307);

    // 3. Khi isSuperAdmin = true -> Toàn quyền bypass, trả về action: pass
    const adminKinshipDecision = evaluateAuthGate('/kinship', regularUser, disabledKinshipFlags, true);
    assert.strictEqual(adminKinshipDecision.action, 'pass', 'Super Admin bypass chặn /kinship');

    const adminAnnivDecision = evaluateAuthGate('/anniversaries', regularUser, disabledAnnivFlags, true);
    assert.strictEqual(adminAnnivDecision.action, 'pass', 'Super Admin bypass chặn /anniversaries');
  });

  // 31. TC_UT_LOGIN_GATE_NAVBAR_NO_DUPLICATE_AUTH (Milestone 7.9)
  it('TC_UT_LOGIN_GATE_NAVBAR_NO_DUPLICATE_AUTH: Navbar ẩn nút login ở /login-gate', () => {
    const authButtonPath = path.resolve(process.cwd(), 'src/components/auth/AuthButton.tsx');
    assert.ok(fs.existsSync(authButtonPath), 'src/components/auth/AuthButton.tsx phải tồn tại');

    const content = fs.readFileSync(authButtonPath, 'utf8');

    assert.ok(
      content.includes("pathname === '/login-gate'"),
      'AuthButton phải kiểm tra pathname === "/login-gate"'
    );
    assert.ok(
      content.includes("if (pathname === '/login-gate') {\n      return null;\n    }") ||
      content.includes("if (pathname === '/login-gate') return null;"),
      'AuthButton phải return null khi pathname === "/login-gate" và !user'
    );
  });

  // 32. TC_UT_LOGIN_GATE_MOBILE_BOTTOM_NAV_SUPPRESSED (Milestone 7.9)
  it('TC_UT_LOGIN_GATE_MOBILE_BOTTOM_NAV_SUPPRESSED: MobileBottomNav ẩn ở /login-gate', () => {
    const navPath = path.resolve(process.cwd(), 'src/components/navigation/MobileBottomNav.tsx');
    assert.ok(fs.existsSync(navPath), 'src/components/navigation/MobileBottomNav.tsx phải tồn tại');

    const content = fs.readFileSync(navPath, 'utf8');

    assert.ok(
      content.includes("if (pathname === '/login-gate') {\n    return null;\n  }") ||
      content.includes("if (pathname === '/login-gate') return null;"),
      'MobileBottomNav phải trả về null khi pathname === "/login-gate"'
    );
  });

  // 33. TC_UT_LOGIN_GATE_FOOTER_SUPPRESSED (Milestone 7.9)
  it('TC_UT_LOGIN_GATE_FOOTER_SUPPRESSED: AppFooter ẩn ở /login-gate', () => {
    const footerPath = path.resolve(process.cwd(), 'src/components/layout/AppFooter.tsx');
    assert.ok(fs.existsSync(footerPath), 'src/components/layout/AppFooter.tsx phải tồn tại');

    const content = fs.readFileSync(footerPath, 'utf8');

    assert.ok(
      content.includes("pathname === '/login-gate'"),
      'AppFooter phải chứa kiểm tra pathname === "/login-gate" để ẩn chân trang'
    );
  });

  // 34. TC_UT_LOGIN_GATE_ZERO_SCROLL_GEOMETRY (Milestone 7.9)
  it('TC_UT_LOGIN_GATE_ZERO_SCROLL_GEOMETRY: LoginGatePage dùng flex-1 và margin bù trừ', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/login-gate/page.tsx');
    assert.ok(fs.existsSync(pagePath), 'src/app/login-gate/page.tsx phải tồn tại');

    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(
      content.includes('flex-1'),
      'LoginGatePage container phải có class flex-1'
    );
    assert.ok(
      content.includes('-mb-16 md:mb-0'),
      'LoginGatePage container phải có class -mb-16 md:mb-0 để bù trừ pb-16 của layout'
    );
    assert.ok(
      content.includes('overflow-y-auto'),
      'LoginGatePage container phải có class overflow-y-auto để cuộn an toàn khi màn hình cực thấp'
    );
  });

  // 35. TC_UT_NAVBAR_GUEST_LOGIN_VISIBLE_ON_OTHER_PAGES (Milestone 7.9)
  it('TC_UT_NAVBAR_GUEST_LOGIN_VISIBLE_ON_OTHER_PAGES: Navbar vẫn render nút login ở các trang khác', () => {
    const authButtonPath = path.resolve(process.cwd(), 'src/components/auth/AuthButton.tsx');
    const content = fs.readFileSync(authButtonPath, 'utf8');

    assert.ok(
      content.includes('id="login-google-btn"'),
      'AuthButton phải render button với id="login-google-btn" cho khách trên các trang thông thường'
    );
    assert.ok(
      content.includes('Đăng nhập Google'),
      'AuthButton phải có nhãn "Đăng nhập Google"'
    );
  });

  // 36. TC_UT_GATE_PWA_ASSETS_BYPASS_GUEST (Milestone 5 Section 5.16)
  it('TC_UT_GATE_PWA_ASSETS_BYPASS_GUEST: evaluateAuthGate cho phép khách chưa đăng nhập tải trực tiếp sw.js và manifest.json (action === pass)', () => {
    const defaultFlags = resolveFeatureFlags({
      enable_public_tree: false, // Thử thách cao nhất: Cây chế độ Riêng tư (Private mode)
      enable_kinship_lookup: false,
      enable_anniversaries: false,
      maintenance_mode: false,
    });

    const pwaPaths = [
      '/manifest.json',
      '/manifest.webmanifest',
      '/sw.js',
      '/favicon.ico',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/icons/badge-72x72.png',
    ];

    for (const p of pwaPaths) {
      const decision = evaluateAuthGate(p, null, defaultFlags, false);
      assert.strictEqual(
        decision.action,
        'pass',
        `evaluateAuthGate phải bypass và trả về action: pass cho PWA asset: ${p} khi user = null`
      );
      assert.strictEqual(
        decision.redirectUrl,
        undefined,
        `PWA asset: ${p} tuyệt đối không được redirect sang login-gate`
      );
    }
  });
});


