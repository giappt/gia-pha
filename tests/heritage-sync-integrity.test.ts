import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Contemporary Heritage System-Wide Synchronization Test Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const srcDir = path.join(rootDir, 'src');

  // TC_ARCH_HERITAGE_SYNC_01: Logo Ấn Triện chuẩn màu sắc Contemporary Heritage và bảo toàn SVG geometry
  it('TC_ARCH_HERITAGE_SYNC_01: Logo Ấn Triện có màu nền #0F382C, viền #164E3D, chữ 范 #E8D49E và giữ nguyên SVG path', () => {
    const globalsCss = fs.readFileSync(path.join(srcDir, 'app', 'globals.css'), 'utf8');
    const clanHanLogo = fs.readFileSync(path.join(srcDir, 'components', 'icons', 'ClanHanLogo.tsx'), 'utf8');
    const navbarLogo = fs.readFileSync(path.join(srcDir, 'components', 'navbar', 'ClanHanLogoNavbar.tsx'), 'utf8');
    const loginGate = fs.readFileSync(path.join(srcDir, 'app', 'login-gate', 'page.tsx'), 'utf8');

    // 1. Kiểm tra ID trên cả 2 nơi dùng ấn triện
    assert.ok(navbarLogo.includes('id="navbar-clan-han-logo"'), 'Navbar logo phải có id="navbar-clan-han-logo"');
    assert.ok(loginGate.includes('id="login-gate-seal"'), 'Login gate phải có id="login-gate-seal"');

    // 2. Kiểm tra CSS scoped styling cho ấn triện
    assert.ok(globalsCss.includes('#navbar-clan-han-logo'), 'globals.css phải chứa selector cho #navbar-clan-han-logo');
    assert.ok(globalsCss.includes('#login-gate-seal'), 'globals.css phải chứa selector cho #login-gate-seal');
    assert.ok(globalsCss.includes('#0F382C'), 'globals.css phải định nghĩa màu nền ngọc di sản #0F382C');
    assert.ok(globalsCss.includes('#164E3D'), 'globals.css phải định nghĩa viền ngọc #164E3D');
    assert.ok(globalsCss.includes('#E8D49E'), 'globals.css phải định nghĩa màu chữ 范 vàng ngà #E8D49E');

    // 3. Kiểm tra bảo toàn 100% hình học vector SVG
    assert.ok(clanHanLogo.includes('CLAN_HAN_CALLIGRAPHY_PATH'), 'ClanHanLogo phải chứa đường dẫn thư pháp gia tộc');
    assert.ok(clanHanLogo.includes('viewBox="0 0 100 100"'), 'ClanHanLogo phải giữ nguyên tỷ lệ viewBox 100x100');
  });

  // TC_ARCH_HERITAGE_SYNC_02: Navbar, MobileBottomNav và SyncLoadingBadge đồng bộ Contemporary Heritage
  it('TC_ARCH_HERITAGE_SYNC_02: Navbar, MobileBottomNav và SyncLoadingBadge đồng bộ Contemporary Heritage', () => {
    const globalsCss = fs.readFileSync(path.join(srcDir, 'app', 'globals.css'), 'utf8');
    const bottomNav = fs.readFileSync(path.join(srcDir, 'components', 'navigation', 'MobileBottomNav.tsx'), 'utf8');
    const loadingBadge = fs.readFileSync(path.join(srcDir, 'components', 'ui', 'SyncLoadingBadge.tsx'), 'utf8');

    // 1. MobileBottomNav có id="mobile-bottom-nav"
    assert.ok(bottomNav.includes('id="mobile-bottom-nav"'), 'MobileBottomNav phải có id="mobile-bottom-nav"');

    // 2. SyncLoadingBadge tuân thủ R-UI.LOADING contract
    assert.ok(loadingBadge.includes('Loader2'), 'SyncLoadingBadge phải dùng Lucide Loader2');
    assert.ok(loadingBadge.includes('Đang tải dữ liệu...'), 'SyncLoadingBadge phải có câu chữ thống nhất');

    // 3. CSS Scoped Styling trong globals.css
    assert.ok(globalsCss.includes('#mobile-bottom-nav'), 'globals.css phải style cho #mobile-bottom-nav');
    assert.ok(globalsCss.includes('[data-testid="sync-loading-badge"]'), 'globals.css phải style cho sync-loading-badge');
    assert.ok(globalsCss.includes('#EAE5D9'), 'globals.css phải chứa viền đá #EAE5D9');
  });

  // TC_ARCH_HERITAGE_SYNC_03: Cây gia phả (Canvas, FamilyBusEdge, MemberNode) đồng bộ CSS tokens
  it('TC_ARCH_HERITAGE_SYNC_03: Cây gia phả (Canvas, FamilyBusEdge, MemberNode) đồng bộ CSS tokens', () => {
    const globalsCss = fs.readFileSync(path.join(srcDir, 'app', 'globals.css'), 'utf8');
    const canvas = fs.readFileSync(path.join(srcDir, 'components', 'tree', 'FamilyTreeCanvas.tsx'), 'utf8');
    const busEdge = fs.readFileSync(path.join(srcDir, 'components', 'tree', 'FamilyBusEdge.tsx'), 'utf8');

    // 1. BusEdge sử dụng CSS Variable --tree-bus-stroke
    assert.ok(busEdge.includes('var(--tree-bus-stroke'), 'FamilyBusEdge phải sử dụng biến CSS var(--tree-bus-stroke)');

    // 2. FamilyTreeCanvas sử dụng CSS Variable --bg-canvas
    assert.ok(canvas.includes('var(--bg-canvas)'), 'FamilyTreeCanvas phải sử dụng biến CSS var(--bg-canvas)');

    // 3. globals.css khai báo --tree-bus-stroke và override stroke
    assert.ok(globalsCss.includes('--tree-bus-stroke: #0F382C'), 'globals.css phải định nghĩa --tree-bus-stroke: #0F382C cho contemporary_heritage');
    assert.ok(globalsCss.includes('.react-flow__edge-path'), 'globals.css phải style cho .react-flow__edge-path');
  });

  // TC_ARCH_HERITAGE_SYNC_04: 4 Form Modals đồng bộ viền đá tự nhiên và input focus ngọc di sản
  it('TC_ARCH_HERITAGE_SYNC_04: 4 Form Modals đồng bộ viền đá tự nhiên và input focus ngọc di sản', () => {
    const globalsCss = fs.readFileSync(path.join(srcDir, 'app', 'globals.css'), 'utf8');
    const memberModal = fs.readFileSync(path.join(srcDir, 'components', 'modals', 'MemberFormModal.tsx'), 'utf8');
    const connectModal = fs.readFileSync(path.join(srcDir, 'components', 'modals', 'ConnectGenealogyModal.tsx'), 'utf8');
    const reorderModal = fs.readFileSync(path.join(srcDir, 'components', 'modals', 'ReorderChildrenModal.tsx'), 'utf8');
    const personalModal = fs.readFileSync(path.join(srcDir, 'components', 'auth', 'PersonalSettingsModal.tsx'), 'utf8');

    // 1. Cả 4 modal đều có id định danh dialog
    assert.ok(memberModal.includes('id="member-form-modal-dialog"'), 'MemberFormModal phải có id="member-form-modal-dialog"');
    assert.ok(connectModal.includes('id="connect-genealogy-modal-dialog"'), 'ConnectGenealogyModal phải có id="connect-genealogy-modal-dialog"');
    assert.ok(reorderModal.includes('id="reorder-children-modal-dialog"'), 'ReorderChildrenModal phải có id="reorder-children-modal-dialog"');
    assert.ok(personalModal.includes('id="personal-settings-modal-dialog"'), 'PersonalSettingsModal phải có id="personal-settings-modal-dialog"');

    // 2. globals.css style cho các modal bằng selector ngữ nghĩa [role="dialog"] và input fields
    assert.ok(globalsCss.includes('[role="dialog"]'), 'globals.css phải style cho [role="dialog"]');
    assert.ok(globalsCss.includes('input:focus'), 'globals.css phải style cho input:focus');
  });

  // TC_ARCH_HERITAGE_SYNC_05: Admin Shell, Sidebar và /admin/theme đồng bộ 100% Contemporary Heritage
  it('TC_ARCH_HERITAGE_SYNC_05: Admin Shell, Sidebar và /admin/theme đồng bộ 100% Contemporary Heritage', () => {
    const globalsCss = fs.readFileSync(path.join(srcDir, 'app', 'globals.css'), 'utf8');
    const adminSidebar = fs.readFileSync(path.join(srcDir, 'components', 'admin', 'AdminSidebar.tsx'), 'utf8');

    // 1. Sidebar có cấu trúc aside và menu
    assert.ok(adminSidebar.includes('<aside'), 'AdminSidebar phải render thẻ <aside');

    // 2. globals.css style cho aside và các menu links trong Contemporary Heritage
    assert.ok(globalsCss.includes('aside a.border-emerald-600'), 'globals.css phải style cho menu active trong aside');
    assert.ok(globalsCss.includes('#F5F2EA'), 'Menu active trong aside phải có nền #F5F2EA');
    assert.ok(globalsCss.includes('#0F382C'), 'Menu active trong aside phải có chữ #0F382C');
  });
});
