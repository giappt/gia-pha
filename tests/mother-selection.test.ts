import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { resolveMothersForFather } from '../src/lib/tree-layout/mother-selection-utils';
import { POST as createMember } from '../src/app/api/members/route';
import { MemberRecord, SpouseRelationRecord } from '../src/types/tree';

describe('TC_UT_MOTHER_SELECT_01 & TC_INT_QUICK_CHILD_MOTHER_01: Mother Selection & Child Creation Suite', () => {
  const mockFather: MemberRecord = {
    id: 'f-1',
    full_name: 'Phạm Văn Cha',
    gender: 'male',
    life_status: 'living',
    generation_level: 2,
    is_root: false,
  };

  const mockWife1: MemberRecord = {
    id: 'w-1',
    full_name: 'Nguyễn Thị Vợ Cả',
    gender: 'female',
    life_status: 'living',
    generation_level: 2,
    is_root: false,
  };

  const mockWife2: MemberRecord = {
    id: 'w-2',
    full_name: 'Trần Thị Vợ Hai',
    gender: 'female',
    life_status: 'living',
    generation_level: 2,
    is_root: false,
  };

  it('TC_UT_MOTHER_SELECT_01: Khi cha có đúng 1 vợ -> Mẹ mặc định (default) là người vợ đó', () => {
    const spouses: SpouseRelationRecord[] = [
      { id: 'rel-1', member_a_id: 'f-1', member_b_id: 'w-1', marriage_order: 1 },
    ];
    const members = [mockFather, mockWife1];

    const result = resolveMothersForFather('f-1', spouses, members);
    assert.strictEqual(result.wives.length, 1);
    assert.strictEqual(result.defaultMotherId, 'w-1', 'Phải default mẹ là vợ w-1');
    assert.strictEqual(result.requiresSelection, false);
    assert.strictEqual(result.options[0].motherName, 'Nguyễn Thị Vợ Cả');
    assert.strictEqual(result.options[0].isDefault, true);
  });

  it('TC_UT_MOTHER_SELECT_01: Khi cha có 2 vợ trở lên -> Yêu cầu người dùng chọn mẹ từ danh sách các bà vợ', () => {
    const spouses: SpouseRelationRecord[] = [
      { id: 'rel-1', member_a_id: 'f-1', member_b_id: 'w-1', marriage_order: 1 },
      { id: 'rel-2', member_a_id: 'f-1', member_b_id: 'w-2', marriage_order: 2 },
    ];
    const members = [mockFather, mockWife1, mockWife2];

    const result = resolveMothersForFather('f-1', spouses, members);
    assert.strictEqual(result.wives.length, 2);
    assert.strictEqual(result.requiresSelection, true, 'Cha có 2 vợ phải yêu cầu chọn mẹ');
    assert.strictEqual(result.options.length, 2);
    assert.strictEqual(result.options[0].motherId, 'w-1');
    assert.strictEqual(result.options[0].marriageOrder, 1);
    assert.strictEqual(result.options[1].motherId, 'w-2');
    assert.strictEqual(result.options[1].marriageOrder, 2);
  });

  it('TC_UT_MOTHER_SELECT_01: Khi cha chưa có vợ -> defaultMotherId là null và không ép chọn', () => {
    const result = resolveMothersForFather('f-1', [], [mockFather]);
    assert.strictEqual(result.wives.length, 0);
    assert.strictEqual(result.defaultMotherId, null);
    assert.strictEqual(result.requiresSelection, false);
  });

  it('TC_INT_QUICK_CHILD_MOTHER_01: POST /api/members lưu con nhanh kèm mother_id chuẩn xác vào CSDL', async () => {
    const payload = {
      full_name: 'Phạm Văn Con Của Mẹ Cả',
      gender: 'male',
      life_status: 'living',
      father_id: 'm-gen2-truong',
      mother_id: 'w-1',
      birth_year: 2005,
      birth_order: 1,
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 201, 'Tạo thành viên thành công HTTP 201');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.member.full_name, 'Phạm Văn Con Của Mẹ Cả');
    assert.strictEqual(json.member.father_id, 'm-gen2-truong');
    assert.strictEqual(json.member.mother_id, 'w-1', 'mother_id phải được lưu chính xác w-1, không bị null');
  });
});
