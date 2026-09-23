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
    assert.ok(content.includes('interactive'), 'HanziCalligraphyLogo phải hỗ trợ tương tác click replay');
  });

  // TC_UT_SPLASH_STATE_MACHINE_LOGIC: Logic cổng kép Dual-Gate canEnterApp và tuân thủ [R-UI.LOADING]
  it('TC_UT_SPLASH_STATE_MACHINE_LOGIC: LoginGateCalligraphy triển khai Dual-Gate và tuân thủ [R-UI.LOADING]', () => {
    const loginGateCompPath = path.resolve(process.cwd(), 'src/components/pwa/LoginGateCalligraphy.tsx');
    assert.ok(fs.existsSync(loginGateCompPath), 'src/components/pwa/LoginGateCalligraphy.tsx phải tồn tại');

    const content = fs.readFileSync(loginGateCompPath, 'utf-8');
    assert.ok(content.includes('canEnterApp = animationDone && !isLoading'), 'Phải có logic cổng kép Dual-Gate canEnterApp');
    assert.ok(content.includes('SyncLoadingBadge'), 'Phải sử dụng component chuẩn hóa SyncLoadingBadge theo [R-UI.LOADING]');
    assert.ok(content.includes('Đang tải dữ liệu...'), 'Thông điệp loading phải thống nhất "Đang tải dữ liệu..."');
    assert.ok(content.includes('HanziCalligraphyLogo'), 'Phải nhúng HanziCalligraphyLogo');
    assert.ok(content.includes('#059669'), 'Chữ thư pháp phải hiển thị màu chủ đề ngọc bích #059669');

    // Kiểm tra LoginGatePage nhúng LoginGateCalligraphy
    const pagePath = path.resolve(process.cwd(), 'src/app/login-gate/page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(pageContent.includes('LoginGateCalligraphy'), 'src/app/login-gate/page.tsx phải nhúng LoginGateCalligraphy');
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
});
