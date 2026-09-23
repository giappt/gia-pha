import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { HANZI_FAN_DATA } from '../src/lib/pwa/hanzi-fan-data';

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

  // TC_UT_APP_SPLASH_SCREEN_OVERLAY: Màn hình Splash toàn màn hình AppSplashScreen phủ toàn viewport z-[9999] và fade-out
  it('TC_UT_APP_SPLASH_SCREEN_OVERLAY: AppSplashScreen phủ toàn màn hình, tích hợp chữ 范 và được nhúng trong RootLayout', () => {
    const splashPath = path.resolve(process.cwd(), 'src/components/pwa/AppSplashScreen.tsx');
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');

    assert.ok(fs.existsSync(splashPath), 'src/components/pwa/AppSplashScreen.tsx phải tồn tại');
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx phải tồn tại');

    const splashContent = fs.readFileSync(splashPath, 'utf-8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

    // 1. Kiểm tra thuộc tính giao diện toàn màn hình
    assert.ok(splashContent.includes("'use client'"), 'AppSplashScreen phải là Client Component');
    assert.ok(splashContent.includes('fixed inset-0 z-[9999]'), 'AppSplashScreen phải phủ toàn viewport với z-[9999]');
    assert.ok(splashContent.includes('HanziCalligraphyLogo'), 'AppSplashScreen phải nhúng HanziCalligraphyLogo');
    assert.ok(splashContent.includes('#059669'), 'Chữ thư pháp phải hiển thị màu ngọc bích #059669');
    assert.ok(splashContent.includes('Gia Phả Phạm Văn'), 'Phải hiển thị tiêu đề thương hiệu Gia Phả Phạm Văn');
    assert.ok(splashContent.includes('SyncLoadingBadge'), 'Phải nhúng SyncLoadingBadge theo chuẩn [R-UI.LOADING]');
    assert.ok(splashContent.includes('canEnterApp'), 'Phải triển khai logic cổng kép canEnterApp');
    assert.ok(splashContent.includes('opacity-0 pointer-events-none'), 'Phải hỗ trợ hiệu ứng fade-out mở rèm');

    // 2. Kiểm tra layout.tsx nhúng AppSplashScreen
    assert.ok(layoutContent.includes('AppSplashScreen'), 'src/app/layout.tsx phải import và nhúng AppSplashScreen');
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
});
