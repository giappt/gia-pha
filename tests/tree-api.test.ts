import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/tree/route';

describe('Tree API Integration Test Suite', () => {
  // TC_INT01: Contract API GET /api/tree
  it('TC_INT01: GET /api/tree trả về HTTP status 200 và DTO payload chuẩn xác', async () => {
    const request = new NextRequest('http://localhost:3000/api/tree');
    const response = await GET(request);

    assert.strictEqual(response.status, 200, 'HTTP status code phải là 200');

    const json = await response.json();
    assert.strictEqual(json.success, true, 'success phải là true');
    assert.ok(typeof json.clanName === 'string' && json.clanName.length > 0, 'clanName phải là chuỗi hợp lệ');
    assert.ok(json.rootAncestorId, 'Phải có rootAncestorId');

    // Kiểm tra danh sách members
    assert.ok(Array.isArray(json.members), 'members phải là mảng');
    assert.strictEqual(json.members.length, 28, 'Phải trả về đủ 28 thành viên mẫu');

    // Kiểm tra các trường dữ liệu bắt buộc của member đầu tiên
    const rootMember = json.members.find((m: any) => m.id === json.rootAncestorId);
    assert.ok(rootMember, 'Phải tìm thấy thành viên root trong members');
    assert.strictEqual(rootMember.is_root, true);
    assert.ok(rootMember.full_name);
    assert.ok(rootMember.gender);

    // Kiểm tra danh sách quan hệ hôn phối
    assert.ok(Array.isArray(json.spouseRelations), 'spouseRelations phải là mảng');
    assert.ok(json.spouseRelations.length >= 10, 'Phải có danh sách các cặp kết hôn');

    // Kiểm tra cặp hôn nhân nội tộc giữa Tuấn (Chi 1) và Mai (Chi 2)
    const noiTocRel = json.spouseRelations.find(
      (r: any) =>
        (r.member_a_id === 'm-gen4-tuan' && r.member_b_id === 'm-gen4-mai-noi-toc') ||
        (r.member_a_id === 'm-gen4-mai-noi-toc' && r.member_b_id === 'm-gen4-tuan')
    );
    assert.ok(noiTocRel, 'Phải chứa quan hệ hôn nhân nội tộc giữa Tuấn và Mai');
  });
});
