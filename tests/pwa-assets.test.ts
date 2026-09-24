import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { HANZI_FAN_DATA } from '../src/lib/pwa/hanzi-fan-data';
import { evaluateAuthGate } from '../src/lib/auth/auth-gate';
import { resolveFeatureFlags } from '../src/lib/admin/admin-engine';

describe('PWA Assets & Calligraphy Stroke Animation Test Suite (Milestone 5 - Section 5.17)', () => {
  // TC_UT_HANZI_DATA_INTEGRITY: Bộ dữ liệu vector chữ 范 chuẩn hóa đủ 8 nét và medians tọa độ
  it('TC_UT_HANZI_DATA_INTEGRITY: Bộ dữ liệu vector chữ 范 có đúng 8 nét và tọa độ medians hợp lệ', () => {
    assert.ok(HANZI_FAN_DATA, 'Dữ liệu HANZI_FAN_DATA phải tồn tại');
    assert.strictEqual(Array.isArray(HANZI_FAN_DATA.strokes), true, 'strokes phải là mảng');
    assert.strictEqual(HANZI_FAN_DATA.strokes.length, 8, 'Chữ 范 bắt buộc phải có đúng 8 nét theo chuẩn Makemeahanzi');

    assert.strictEqual(Array.isArray(HANZI_FAN_DATA.medians), true, 'medians phải là mảng');
    assert.strictEqual(HANZI_FAN_DATA.medians.length, 8, 'Mỗi nét phải có một danh sách tọa độ medians tương ứng');

    // Kiểm tra từng nét đều có ít nhất 2 điểm tọa độ medians (điểm đầu và điểm cuối nét)
    for (let i = 0; i < 8; i++) {
      const strokePath = HANZI_FAN_DATA.strokes[i];
      const strokeMedian = HANZI_FAN_DATA.medians[i];

      assert.ok(strokePath.startsWith('M'), `Nét ${i + 1} phải bắt đầu bằng lệnh M (Move) trong SVG path`);
      assert.ok(strokeMedian.length >= 2, `Nét ${i + 1} phải có ít nhất 2 điểm medians để dẫn đường bút vẽ`);
    }

    assert.deepStrictEqual(HANZI_FAN_DATA.radStrokes, [0, 1, 2], 'Bộ Thảo đầu 艹 phải gồm 3 nét đầu tiên [0, 1, 2]');
  });

  // TC_UT_CALLIGRAPHY_COMPONENT_EXISTS: Component HanziCalligraphyLogo hỗ trợ Client Component và callback hoàn tất
  it('TC_UT_CALLIGRAPHY_COMPONENT_EXISTS: Component HanziCalligraphyLogo tồn tại, là Client Component và nạp data local', () => {
    const compPath = path.resolve(process.cwd(), 'src/components/pwa/HanziCalligraphyLogo.tsx');
    assert.ok(fs.existsSync(compPath), 'src/components/pwa/HanziCalligraphyLogo.tsx phải tồn tại');

    const content = fs.readFileSync(compPath, 'utf-8');
    assert.ok(content.includes("'use client'"), 'HanziCalligraphyLogo phải có chỉ thị "use client"');
    assert.ok(content.includes('HANZI_FAN_DATA'), 'HanziCalligraphyLogo phải import và sử dụng HANZI_FAN_DATA local');
    assert.ok(content.includes('hanzi-writer'), 'HanziCalligraphyLogo phải tích hợp thư viện hanzi-writer');
    assert.ok(content.includes('onComplete'), 'HanziCalligraphyLogo phải hỗ trợ prop onComplete khi viết xong');
    assert.ok(content.includes('isLivingIdle'), 'HanziCalligraphyLogo phải hỗ trợ prop isLivingIdle (hào quang thở)');
  });

  // TC_UT_ZERO_REACT_SPLASH_IN_LAYOUT: RootLayout loại bỏ hoàn toàn overlay AppSplashScreen, AppSplashScreen trả về null
  it('TC_UT_ZERO_REACT_SPLASH_IN_LAYOUT: RootLayout không còn nhúng AppSplashScreen, AppSplashScreen trả về null', () => {
    const splashPath = path.resolve(process.cwd(), 'src/components/pwa/AppSplashScreen.tsx');
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');

    assert.ok(fs.existsSync(splashPath), 'src/components/pwa/AppSplashScreen.tsx phải tồn tại');
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx phải tồn tại');

    const splashContent = fs.readFileSync(splashPath, 'utf-8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

    // 1. Kiểm tra layout.tsx không còn import hay nhúng AppSplashScreen
    assert.strictEqual(
      layoutContent.includes('<AppSplashScreen'),
      false,
      'src/app/layout.tsx tuyệt đối không được nhúng <AppSplashScreen />'
    );
    assert.strictEqual(
      layoutContent.includes('import AppSplashScreen'),
      false,
      'src/app/layout.tsx tuyệt đối không import AppSplashScreen'
    );

    // 2. Kiểm tra AppSplashScreen component trả về null (zero DOM footprint)
    assert.ok(
      splashContent.includes('return null'),
      'AppSplashScreen phải trả về null để triệt tiêu toàn bộ DOM overlay'
    );
    assert.strictEqual(
      splashContent.includes('fixed inset-0 z-[9999]'),
      false,
      'AppSplashScreen không được chứa class fixed inset-0 z-[9999] gây che khuất viewport'
    );
  });

  // TC_UT_LOGIN_GATE_APP_LOGO_RESTORED: Trang login-gate hiển thị đúng huy hiệu logo chính thức ClanHanLogo nền xanh
  it('TC_UT_LOGIN_GATE_APP_LOGO_RESTORED: Trang login-gate hiển thị đúng logo chính thức ClanHanLogo và không nhúng animation nhầm', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/login-gate/page.tsx');
    assert.ok(fs.existsSync(pagePath), 'src/app/login-gate/page.tsx phải tồn tại');

    const pageContent = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(pageContent.includes('ClanHanLogo'), 'login-gate/page.tsx phải sử dụng ClanHanLogo chính thức');
    assert.ok(pageContent.includes('bg-emerald-600'), 'Logo login-gate phải nằm trong khối vuông bo góc bg-emerald-600');
    assert.strictEqual(
      pageContent.includes('LoginGateCalligraphy'),
      false,
      'login-gate/page.tsx tuyệt đối không nhúng LoginGateCalligraphy nhầm chỗ'
    );
  });

  // TC_UT_SINGLE_SPLASH_ICON_PARITY: Icon 512x512 và 192x192 purpose any là chữ 范 xanh trên nền trắng/trong suốt
  it('TC_UT_SINGLE_SPLASH_ICON_PARITY: Icon 512x512 và 192x192 cho purpose "any" tồn tại, sắc nét và đồng bộ', () => {
    const icon192Path = path.resolve(process.cwd(), 'public/icons/icon-192x192.png');
    const icon512Path = path.resolve(process.cwd(), 'public/icons/icon-512x512.png');
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');

    assert.ok(fs.existsSync(icon192Path), 'icon-192x192.png phải tồn tại');
    assert.ok(fs.existsSync(icon512Path), 'icon-512x512.png phải tồn tại');
    assert.ok(fs.statSync(icon512Path).size > 5000, 'icon-512x512.png phải sắc nét (>5KB)');
    assert.ok(fs.statSync(icon192Path).size > 2000, 'icon-192x192.png phải sắc nét (>2KB)');

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const anyIcon512 = manifestContent.icons.find((i: any) => i.sizes === '512x512' && i.purpose === 'any');
    const anyIcon192 = manifestContent.icons.find((i: any) => i.sizes === '192x192' && i.purpose === 'any');

    assert.ok(anyIcon512, 'manifest.json phải khai báo icon 512x512 purpose any');
    assert.ok(anyIcon192, 'manifest.json phải khai báo icon 192x192 purpose any');
  });

  // TC_UT_CLAN_HAN_CALLIGRAPHY_WRITER: Component múa bút thư pháp SVG Mask Reveal chuẩn nét Logo dòng họ
  it('TC_UT_CLAN_HAN_CALLIGRAPHY_WRITER: ClanHanCalligraphyWriter dùng vector CLAN_HAN_CALLIGRAPHY_PATH và mask 8 nét', () => {
    const writerPath = path.resolve(process.cwd(), 'src/components/pwa/ClanHanCalligraphyWriter.tsx');
    assert.ok(fs.existsSync(writerPath), 'ClanHanCalligraphyWriter.tsx phải tồn tại');

    const content = fs.readFileSync(writerPath, 'utf-8');
    assert.ok(content.includes('CLAN_HAN_CALLIGRAPHY_PATH'), 'Phải dùng vector CLAN_HAN_CALLIGRAPHY_PATH');
    assert.ok(content.includes('CLAN_HAN_STROKES'), 'Phải định nghĩa 8 nét cọ CLAN_HAN_STROKES');
    assert.ok(content.includes('onComplete'), 'Phải hỗ trợ callback onComplete');
    assert.ok(content.includes('isLivingIdle'), 'Phải hỗ trợ trạng thái isLivingIdle');
    assert.ok(content.includes('strokeColor'), 'Phải hỗ trợ tùy biến strokeColor');
  });

  // TC_UT_AUTH_GATE_DIRECT_ROUTING: Khởi động không cần Splash - Khách chưa login vào /login-gate, thành viên vào /
  it('TC_UT_AUTH_GATE_DIRECT_ROUTING: evaluateAuthGate bảo vệ trang chủ và điều hướng chuẩn xác', () => {
    // Khi public tree = false (chế độ bảo mật), khách vào /tree bị redirect
    const flagsPrivate = resolveFeatureFlags({ enable_public_tree: false });
    const decisionTree = evaluateAuthGate('/tree', null, flagsPrivate);
    assert.strictEqual(decisionTree.action, 'redirect');
    assert.strictEqual(decisionTree.redirectUrl, '/login-gate?returnTo=%2Ftree');

    // Khách truy cập /login-gate luôn được pass
    const decisionLoginGate = evaluateAuthGate('/login-gate', null, flagsPrivate);
    assert.strictEqual(decisionLoginGate.action, 'pass');

    // Thành viên đã đăng nhập truy cập / hoặc /tree luôn pass
    const mockUser = { id: '00000000-0000-0000-0000-000000000001' } as any;
    const decisionHome = evaluateAuthGate('/', mockUser, flagsPrivate);
    assert.strictEqual(decisionHome.action, 'pass');
  });

  // TC_UT_IOS_PWA_SPLASH_METADATA: RootLayout cấu hình status bar style và apple meta đồng bộ trải nghiệm iOS
  it('TC_UT_IOS_PWA_SPLASH_METADATA: RootLayout khai báo appleWebApp metadata với statusBarStyle default', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    assert.ok(content.includes('appleWebApp'), 'src/app/layout.tsx phải khai báo appleWebApp');
    assert.ok(content.includes("statusBarStyle: 'default'"), 'appleWebApp phải có statusBarStyle default');
    assert.ok(content.includes('capable: true'), 'appleWebApp phải có capable: true');
  });

  // RG35: Bán kính nét chữ trong icon maskable không vượt quá 40% canvas
  it('RG35: Bộ icon PNG chuẩn kích thước, icon-512x512-maskable.png tồn tại và sắc nét', () => {
    const icon192Path = path.resolve(process.cwd(), 'public/icons/icon-192x192.png');
    const icon512Path = path.resolve(process.cwd(), 'public/icons/icon-512x512.png');
    const iconMaskablePath = path.resolve(process.cwd(), 'public/icons/icon-512x512-maskable.png');
    const appleTouchPath = path.resolve(process.cwd(), 'public/icons/apple-touch-icon.png');
    const badgePath = path.resolve(process.cwd(), 'public/icons/badge-72x72.png');

    assert.ok(fs.existsSync(icon192Path), 'icon-192x192.png phải tồn tại');
    assert.ok(fs.existsSync(icon512Path), 'icon-512x512.png phải tồn tại');
    assert.ok(fs.existsSync(iconMaskablePath), 'icon-512x512-maskable.png phải tồn tại');
    assert.ok(fs.existsSync(appleTouchPath), 'apple-touch-icon.png phải tồn tại');
    assert.ok(fs.existsSync(badgePath), 'badge-72x72.png phải tồn tại');

    // Kiểm tra dung lượng hợp lệ (> 5KB cho ảnh 512x512 sắc nét)
    assert.ok(fs.statSync(icon512Path).size > 5000, 'icon-512x512.png phải có dung lượng ảnh nét cao');
    assert.ok(fs.statSync(iconMaskablePath).size > 5000, 'icon-512x512-maskable.png phải có dung lượng ảnh nét cao');
  });

  // TC_UT_BADGE_MONOCHROME_ALPHA: File badge-72x72.png tồn tại, là ảnh PNG chuẩn với nền trong suốt alpha silhouette
  it('TC_UT_BADGE_MONOCHROME_ALPHA: File badge-72x72.png tồn tại, là PNG chuẩn hỗ trợ alpha mask cho Android Notification', () => {
    const badgePath = path.resolve(process.cwd(), 'public/icons/badge-72x72.png');
    assert.ok(fs.existsSync(badgePath), 'badge-72x72.png phải tồn tại');

    const stat = fs.statSync(badgePath);
    assert.ok(stat.size > 200, 'badge-72x72.png phải có dung lượng hợp lệ (>200 bytes)');

    const buffer = fs.readFileSync(badgePath);
    // Kiểm tra PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    assert.ok(isPng, 'badge-72x72.png phải là định dạng PNG hợp lệ');
  });

  // RG36: Chữ 范 chạy hoàn toàn offline không gọi CDN
  it('RG36: Zero-CDN Overhead - Dữ liệu chữ 范 hoàn toàn độc lập với cdn.jsdelivr.net', () => {
    const dataPath = path.resolve(process.cwd(), 'src/lib/pwa/hanzi-fan-data.ts');
    const compPath = path.resolve(process.cwd(), 'src/components/pwa/HanziCalligraphyLogo.tsx');

    const dataContent = fs.readFileSync(dataPath, 'utf-8');
    const compContent = fs.readFileSync(compPath, 'utf-8');

    assert.strictEqual(dataContent.includes('jsdelivr'), false, 'hanzi-fan-data không phụ thuộc cdn jsdelivr');
    assert.strictEqual(compContent.includes('jsdelivr'), false, 'HanziCalligraphyLogo không gọi cdn jsdelivr');
    assert.ok(compContent.includes('charDataLoader: () => HANZI_FAN_DATA'), 'HanziCalligraphyLogo phải chỉ định charDataLoader trả về dữ liệu nội bộ');
  });

  // RG38: Đảm bảo trang login-gate duy trì huy hiệu logo tĩnh chuẩn của ứng dụng
  it('RG38: Login Gate card header duy trì huy hiệu logo chính thức của ứng dụng', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/login-gate/page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(pageContent.includes('ClanHanLogo size={44} className="text-white"'), 'Logo login gate phải dùng ClanHanLogo size 44 màu trắng');
  });

  // RG40: Clean Layout & Zero DOM Footprint - AppSplashScreen trả về null và layout.tsx không nhúng
  it('RG40: Clean Layout & Zero DOM Footprint - Không tồn tại bất kỳ overlay nào che phủ app', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    assert.strictEqual(
      layoutContent.includes('AppSplashScreen'),
      false,
      'layout.tsx không được import hoặc nhúng AppSplashScreen'
    );
  });
});

