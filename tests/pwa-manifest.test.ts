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
});
