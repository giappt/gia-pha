import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA Manifest & Service Worker Compliance Test Suite (Milestone 5)', () => {
  // TC_UT_PWA_MANIFEST_VALID: Kiểm tra tính hợp lệ của Web App Manifest
  it('TC_UT_PWA_MANIFEST_VALID: public/manifest.json có đầy đủ thuộc tính chuẩn PWA', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'File public/manifest.json phải tồn tại');

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const json = JSON.parse(content);

    assert.ok(json.name, 'Phải có thuộc tính name');
    assert.ok(json.short_name, 'Phải có thuộc tính short_name');
    assert.ok(json.start_url, 'Phải có thuộc tính start_url');
    assert.strictEqual(json.display, 'standalone', 'Thuộc tính display phải là standalone');
    assert.ok(Array.isArray(json.icons), 'Thuộc tính icons phải là mảng');
    assert.ok(json.icons.length >= 2, 'Phải có ít nhất 2 kích cỡ icon (192 và 512)');

    const sizes = json.icons.map((i: { sizes: string }) => i.sizes);
    assert.ok(sizes.includes('192x192'), 'Phải hỗ trợ icon 192x192');
    assert.ok(sizes.includes('512x512'), 'Phải hỗ trợ icon 512x512');
  });

  it('Service worker public/sw.js tồn tại và xử lý sự kiện push, notificationclick', () => {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    assert.ok(fs.existsSync(swPath), 'File public/sw.js phải tồn tại');

    const swContent = fs.readFileSync(swPath, 'utf-8');
    assert.ok(swContent.includes("addEventListener('push'"), 'SW phải bắt sự kiện push');
    assert.ok(
      swContent.includes("addEventListener('notificationclick'"),
      'SW phải bắt sự kiện notificationclick'
    );
  });

  // TC_UT_GLOBAL_SW_AND_FETCH: Service Worker được đăng ký toàn cục và public/sw.js có fetch listener
  it('TC_UT_GLOBAL_SW_AND_FETCH: sw.js có fetch listener và ServiceWorkerRegister/layout.tsx đăng ký SW toàn cục', () => {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
    const swRegisterPath = path.join(process.cwd(), 'src', 'components', 'pwa', 'ServiceWorkerRegister.tsx');

    assert.ok(fs.existsSync(swPath), 'public/sw.js phải tồn tại');
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx phải tồn tại');
    assert.ok(fs.existsSync(swRegisterPath), 'ServiceWorkerRegister.tsx phải tồn tại');

    const swContent = fs.readFileSync(swPath, 'utf-8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    const swRegisterContent = fs.readFileSync(swRegisterPath, 'utf-8');

    // 1. sw.js có fetch listener đáp ứng tiêu chuẩn Chromium PWA Installability
    assert.ok(
      swContent.includes("addEventListener('fetch'"),
      'public/sw.js phải bắt sự kiện fetch để đủ điều kiện cài đặt PWA'
    );

    // 2. ServiceWorkerRegister đăng ký /sw.js
    assert.ok(
      swRegisterContent.includes("navigator.serviceWorker.register('/sw.js')"),
      'ServiceWorkerRegister phải gọi navigator.serviceWorker.register'
    );

    // 3. layout.tsx nhúng ServiceWorkerRegister toàn cục
    assert.ok(
      layoutContent.includes('ServiceWorkerRegister'),
      'src/app/layout.tsx phải nhúng ServiceWorkerRegister'
    );
  });

  // TC_UT_PWA_MANIFEST_CLAN_BRANDING: public/manifest.json chuẩn hóa 100% thương hiệu Gia Phả Phạm Văn
  it('TC_UT_PWA_MANIFEST_CLAN_BRANDING: manifest.json có name, short_name là "Gia Phả Phạm Văn" và start_url là "/"', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'File public/manifest.json phải tồn tại');

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const json = JSON.parse(content);

    // 1. Tên App đầy đủ và tên ngắn phải là "Gia Phả Phạm Văn"
    assert.strictEqual(json.name, 'Gia Phả Phạm Văn', 'manifest.json name phải là "Gia Phả Phạm Văn"');
    assert.strictEqual(json.short_name, 'Gia Phả Phạm Văn', 'manifest.json short_name phải là "Gia Phả Phạm Văn"');

    // 2. start_url phải là "/"
    assert.strictEqual(json.start_url, '/', 'manifest.json start_url phải là "/"');

    // 3. Không còn chứa FAT hay chữ "Đại Tộc" chung chung
    assert.strictEqual(json.name.includes('FAT'), false, 'Tên không được chứa FAT');
  });

  // TC_UT_MANIFEST_ICON_PURPOSE_SEPARATION: Tách bạch purpose any và maskable cho icon 512x512
  it('TC_UT_MANIFEST_ICON_PURPOSE_SEPARATION: manifest.json tách bạch purpose any và maskable cho icon 512x512', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const json = JSON.parse(content);

    const anyIcon512 = json.icons.find(
      (i: { sizes: string; purpose?: string }) => i.sizes === '512x512' && i.purpose === 'any'
    );
    const maskableIcon512 = json.icons.find(
      (i: { sizes: string; purpose?: string }) => i.sizes === '512x512' && i.purpose === 'maskable'
    );

    assert.ok(anyIcon512, 'Phải có icon 512x512 với purpose: "any" cho Splash Screen và Task Switcher');
    assert.ok(maskableIcon512, 'Phải có icon 512x512 với purpose: "maskable" cho Android Launcher');
    assert.strictEqual(anyIcon512.src, '/icons/icon-512x512.png');
    assert.strictEqual(maskableIcon512.src, '/icons/icon-512x512-maskable.png');

    // Đảm bảo các file vật lý thật sự tồn tại trên đĩa
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', anyIcon512.src)), 'File icon-512x512.png phải tồn tại');
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', maskableIcon512.src)), 'File icon-512x512-maskable.png phải tồn tại');
  });

  // TC_UT_SW_ABSOLUTE_URL_AND_TAG_OPTIONS: public/sw.js nạp URL tuyệt đối cho icon/badge và hỗ trợ tag: data.tag kèm renotify: true
  it('TC_UT_SW_ABSOLUTE_URL_AND_TAG_OPTIONS: public/sw.js nạp URL tuyệt đối cho icon/badge và gán tag, renotify vào showNotification options', () => {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    assert.ok(fs.existsSync(swPath), 'public/sw.js phải tồn tại');

    const swContent = fs.readFileSync(swPath, 'utf-8');

    // 1. Kiểm tra việc phân giải URL tuyệt đối từ origin
    assert.ok(
      swContent.includes('self.location.origin'),
      'sw.js phải sử dụng self.location.origin để giải quyết đường dẫn tuyệt đối'
    );
    assert.ok(
      swContent.includes('new URL('),
      'sw.js phải dùng new URL(...) để tạo URL tuyệt đối cho icon/badge tránh lỗi chữ G của Android'
    );

    // 2. Kiểm tra tag và renotify
    assert.ok(
      swContent.includes('tag: data.tag'),
      'showNotification options phải cấu hình tag: data.tag để phân biệt các thông báo'
    );
    assert.ok(
      swContent.includes('renotify:'),
      'showNotification options phải cấu hình renotify để hiển thị song song không bị ghi đè'
    );
  });
});
