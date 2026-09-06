import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET as getAnniversaries } from '../src/app/api/anniversaries/route';

describe('Anniversary API Integration Test Suite (Milestone 5)', () => {
  // TC_INT_ANNIV_API_RESPONSE: Kiểm tra cấu trúc API Lịch Giỗ /api/anniversaries
  it('TC_INT_ANNIV_API_RESPONSE: GET /api/anniversaries trả về HTTP 200 và DTO payload chuẩn xác', async () => {
    const request = new NextRequest('http://localhost:3000/api/anniversaries?days=30');

    const response = await getAnniversaries(request);
    assert.strictEqual(response.status, 200, 'Status code phải là 200 OK');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.data), 'Trường data phải là mảng');
    assert.strictEqual(typeof json.totalCount, 'number', 'totalCount phải là số nguyên');
    assert.strictEqual(json.timeZone, 'Asia/Ho_Chi_Minh', 'Múi giờ phải là Asia/Ho_Chi_Minh');

    // Kiểm tra cấu trúc từng nhóm
    if (json.data.length > 0) {
      const firstGroup = json.data[0];
      assert.ok(firstGroup.solar_date_str, 'Phải có solar_date_str');
      assert.ok(typeof firstGroup.days_left === 'number', 'days_left phải là số');
      assert.ok(Array.isArray(firstGroup.members), 'members phải là mảng');

      if (firstGroup.members.length > 0) {
        const firstMember = firstGroup.members[0];
        assert.ok(firstMember.id, 'Phải có id thành viên');
        assert.ok(firstMember.full_name, 'Phải có full_name');
        assert.ok(firstMember.death_lunar_day, 'Phải có death_lunar_day');
        assert.ok(firstMember.death_lunar_month, 'Phải có death_lunar_month');
      }
    }
  });
});
