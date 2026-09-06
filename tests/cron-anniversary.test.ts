import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET as cronAnniversaryReminder } from '../src/app/api/cron/anniversary-reminder/route';
import { getTodayAnniversaryMembers } from '../src/lib/anniversaries/anniversary-engine';
import { solarToLunar } from '../src/lib/lunar/vietnamese-lunar';
import { MemberRecord } from '../src/types/tree';

describe('Vercel Cron Anniversary Reminder Test Suite (Milestone 5)', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-key-12345';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  // TC_INT_CRON_AUTH_SECURITY: Chặn đứng truy cập trái phép vào Route Cron
  it('TC_INT_CRON_AUTH_SECURITY: Sai hoặc thiếu CRON_SECRET trả về HTTP 401 Unauthorized', async () => {
    // 1. Không có header
    const reqNoAuth = new NextRequest('http://localhost:3000/api/cron/anniversary-reminder');
    const res1 = await cronAnniversaryReminder(reqNoAuth);
    assert.strictEqual(res1.status, 401, 'Phải chặn khi thiếu Secret');

    // 2. Sai Bearer token
    const reqWrongAuth = new NextRequest('http://localhost:3000/api/cron/anniversary-reminder', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res2 = await cronAnniversaryReminder(reqWrongAuth);
    assert.strictEqual(res2.status, 401, 'Phải chặn khi sai Secret');

    // 3. Đúng Bearer token -> Được phép thực thi
    const reqValidAuth = new NextRequest('http://localhost:3000/api/cron/anniversary-reminder', {
      headers: { Authorization: 'Bearer test-secret-key-12345' },
    });
    const res3 = await cronAnniversaryReminder(reqValidAuth);
    assert.strictEqual(res3.status, 200, 'Phải trả về 200 khi đúng Secret');
    const json3 = await res3.json();
    assert.strictEqual(json3.success, true);
  });

  // TC_INT_CRON_DISPATCH_LOGIC: Quét đúng người giỗ hôm nay & lọc đúng con cháu nhận push
  it('TC_INT_CRON_DISPATCH_LOGIC: getTodayAnniversaryMembers quét chính xác người có ngày giỗ hôm nay', () => {
    // Ngày giả định: 15/09/2026
    const refDate = new Date(2026, 8, 15);
    const todayLunar = solarToLunar(15, 9, 2026);

    const mockMembers: MemberRecord[] = [
      {
        id: 'ancestor-today',
        full_name: 'Cụ Giỗ Hôm Nay',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: todayLunar.lunarDay,
        death_lunar_month: todayLunar.lunarMonth,
        generation_level: 1,
        is_root: true,
      },
      {
        id: 'ancestor-other-day',
        full_name: 'Cụ Giỗ Ngày Khác',
        gender: 'female',
        life_status: 'deceased',
        death_lunar_day: (todayLunar.lunarDay % 28) + 1,
        death_lunar_month: (todayLunar.lunarMonth % 12) + 1,
        generation_level: 1,
        is_root: false,
      },
      {
        id: 'living-member',
        full_name: 'Người Còn Sống',
        gender: 'male',
        life_status: 'living',
        generation_level: 2,
        is_root: false,
      },
    ];

    const matched = getTodayAnniversaryMembers(mockMembers, refDate);
    assert.strictEqual(matched.length, 1, 'Chỉ có 1 cụ trùng ngày giỗ hôm nay');
    assert.strictEqual(matched[0].id, 'ancestor-today');
  });
});
