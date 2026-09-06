import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as subscribePush } from '../src/app/api/push/subscribe/route';
import { POST as unsubscribePush } from '../src/app/api/push/unsubscribe/route';

describe('Web Push Notification API Test Suite (Milestone 5)', () => {
  // TC_INT_PUSH_SUBSCRIBE_VALIDATION: Validate dữ liệu API Subscribe Web Push
  it('TC_INT_PUSH_SUBSCRIBE_VALIDATION: Thiếu endpoint hoặc keys trả về HTTP 400 Bad Request', async () => {
    // 1. Trường hợp thiếu endpoint
    const reqNoEndpoint = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: { p256dh: 'fake-p256dh', auth: 'fake-auth' },
      }),
    });

    const res1 = await subscribePush(reqNoEndpoint);
    assert.strictEqual(res1.status, 400, 'Status phải là 400 khi thiếu endpoint');
    const json1 = await res1.json();
    assert.strictEqual(json1.success, false);
    assert.ok(json1.error.includes('endpoint'));

    // 2. Trường hợp thiếu keys
    const reqNoKeys = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      }),
    });

    const res2 = await subscribePush(reqNoKeys);
    assert.strictEqual(res2.status, 400, 'Status phải là 400 khi thiếu keys');
    const json2 = await res2.json();
    assert.strictEqual(json2.success, false);
    assert.ok(json2.error.includes('keys'));
  });

  // TC_INT_PUSH_SUBSCRIBE_SUCCESS: Lưu thành công subscription thiết bị mới
  it('TC_INT_PUSH_SUBSCRIBE_SUCCESS: Gửi payload hợp lệ trả về HTTP 200 { success: true }', async () => {
    const payload = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/valid-test-endpoint-001',
      keys: {
        p256dh: 'BNcR-sample-p256dh-key-content',
        auth: 'tBH8-sample-auth-secret-key',
      },
      userAgent: 'Mozilla/5.0 Test Suite Runner',
    };

    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mock-auth': 'true', // Kích hoạt mock user context trong môi trường test
      },
      body: JSON.stringify(payload),
    });

    const response = await subscribePush(request);
    assert.strictEqual(response.status, 200, 'Status phải là 200 OK');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.endpoint, payload.endpoint);
  });

  // TC_INT_PUSH_UNSUBSCRIBE: Hủy đăng ký nhận Web Push theo endpoint
  it('TC_INT_PUSH_UNSUBSCRIBE: Hủy đăng ký thành công trả về HTTP 200 { success: true }', async () => {
    const payload = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/valid-test-endpoint-001',
    };

    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await unsubscribePush(request);
    assert.strictEqual(response.status, 200, 'Status phải là 200 OK');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.message, 'Unsubscribed successfully');
  });
});
