import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as reorderChildren } from '../src/app/api/members/reorder/route';

describe('TC_UT_REORDER_01: Member Reorder API & Logic Suite', () => {
  it('TC_UT_REORDER_01: POST /api/members/reorder cập nhật đồng loạt birth_order 1..N cho đàn con không xung đột', async () => {
    // Giả lập đàn con 8 người của Cụ Phạm Văn Uyên
    const mockChildIds = [
      'c-nang',
      'c-chi',
      'c-khuong',
      'c-cuong',
      'c-trang',
      'c-sang',
      'c-bay',
      'c-ut',
    ];

    // Đảo ngược thứ tự: con út lên đầu, con cả xuống cuối
    const reversedChildIds = [...mockChildIds].reverse();

    const request = new NextRequest('http://localhost:3000/api/members/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: 'm-uyen',
        orderedChildIds: reversedChildIds,
      }),
    });

    const response = await reorderChildren(request);
    assert.strictEqual(response.status, 200, 'HTTP status phải là 200');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.items.length, 8, 'Phải cập nhật đủ 8 con');

    // Kiểm tra từng con nhận đúng birth_order từ 1 đến 8 theo thứ tự đảo ngược
    reversedChildIds.forEach((childId, idx) => {
      const item = json.items.find((it: any) => it.id === childId);
      assert.ok(item, `Con ${childId} phải có trong kết quả trả về`);
      assert.strictEqual(
        item.birth_order,
        idx + 1,
        `Con ${childId} tại vị trí index ${idx} phải nhận birth_order = ${idx + 1}`
      );
    });

    // Xác nhận con đầu tiên trong mảng mới (con út) mang birth_order = 1
    assert.strictEqual(json.items[0].id, 'c-ut');
    assert.strictEqual(json.items[0].birth_order, 1);
    // Con cuối cùng trong mảng mới (con cả cũ) mang birth_order = 8
    assert.strictEqual(json.items[7].id, 'c-nang');
    assert.strictEqual(json.items[7].birth_order, 8);
  });

  it('TC_UT_REORDER_01 (Validation): POST /api/members/reorder từ chối payload thiếu parentId hoặc orderedChildIds rỗng', async () => {
    // Thiếu parentId
    const req1 = new NextRequest('http://localhost:3000/api/members/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: '',
        orderedChildIds: ['c-1', 'c-2'],
      }),
    });
    const res1 = await reorderChildren(req1);
    assert.strictEqual(res1.status, 400);
    const json1 = await res1.json();
    assert.strictEqual(json1.success, false);

    // Mảng orderedChildIds rỗng
    const req2 = new NextRequest('http://localhost:3000/api/members/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: 'm-uyen',
        orderedChildIds: [],
      }),
    });
    const res2 = await reorderChildren(req2);
    assert.strictEqual(res2.status, 400);
    const json2 = await res2.json();
    assert.strictEqual(json2.success, false);
  });

  // TC_INT_REORDER_EVENT_SYNC_01: ReorderChildrenModal phát sự kiện fat:members-reordered và FamilyTreeCanvas lắng nghe cập nhật liveMembers
  it('TC_INT_REORDER_EVENT_SYNC_01: ReorderChildrenModal phát sự kiện fat:members-reordered và FamilyTreeCanvas lắng nghe cập nhật liveMembers', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // 1. Kiểm tra ReorderChildrenModal có dispatch event fat:members-reordered
    const modalPath = path.resolve(process.cwd(), 'src/components/modals/ReorderChildrenModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'File ReorderChildrenModal.tsx phải tồn tại');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    assert.ok(
      modalContent.includes("new CustomEvent('fat:members-reordered'"),
      'ReorderChildrenModal phải tạo và dispatch CustomEvent fat:members-reordered khi lưu thành công'
    );
    assert.ok(
      modalContent.includes('updatedChildren: updatedList'),
      'CustomEvent fat:members-reordered phải mang payload updatedChildren chứa birth_order mới'
    );

    // 2. Kiểm tra FamilyTreeCanvas có lắng nghe fat:members-reordered để cập nhật liveMembers tức thì
    const canvasPath = path.resolve(process.cwd(), 'src/components/tree/FamilyTreeCanvas.tsx');
    assert.ok(fs.existsSync(canvasPath), 'File FamilyTreeCanvas.tsx phải tồn tại');
    const canvasContent = fs.readFileSync(canvasPath, 'utf-8');

    assert.ok(
      canvasContent.includes("window.addEventListener('fat:members-reordered'"),
      'FamilyTreeCanvas phải đăng ký lắng nghe sự kiện fat:members-reordered'
    );
    assert.ok(
      canvasContent.includes('handleReorderSaved(updatedChildren)'),
      'FamilyTreeCanvas phải gọi handleReorderSaved khi nhận được sự kiện fat:members-reordered'
    );
  });
});
