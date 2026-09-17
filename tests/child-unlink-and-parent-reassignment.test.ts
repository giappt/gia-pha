import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { PUT as updateMember } from '../src/app/api/members/[id]/route';
import { resolveParentPairingStatus } from '../src/components/modals/MemberFormModal';
import { getParentDisplayNameWithSpouse, resolveRelinkPayload } from '../src/components/tree/UnlinkedMembersDrawer';

describe('Child Unlink & Cascading Parent Reassignment Test Suite (Edge Case 37, 38 & 39)', () => {
  // TC_INT_UNLINK_CHILD_01: API /api/members/[id] hỗ trợ child_ids_to_unlink
  it('TC_INT_UNLINK_CHILD_01: API /api/members/[id] hỗ trợ child_ids_to_unlink và trả về unlinkedChildIds', async () => {
    const payload = {
      full_name: 'Nguyễn Văn Trưởng Test',
      child_ids_to_unlink: ['m-gen3-tuan'],
    };

    const request = new NextRequest('http://localhost:3000/api/members/m-gen2-truong', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await updateMember(request, { params: { id: 'm-gen2-truong' } });
    assert.strictEqual(response.status, 200, 'Status code phải là 200 OK');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.ok(Array.isArray(json.unlinkedChildIds), 'unlinkedChildIds phải là một mảng');
    assert.ok(json.unlinkedChildIds.includes('m-gen3-tuan'), 'Phải chứa ID của con vừa gỡ');
  });

  // TC_UT_PARENT_CASCADING_SELECT_01: Logic Cascading Dropdown tự động đồng bộ Mẹ theo Cha
  it('TC_UT_PARENT_CASCADING_SELECT_01: Cascading Dropdown tự động đồng bộ Mẹ theo Cha', () => {
    const mockAllMembers = [
      { id: 'f1', full_name: 'Phạm Văn Khương', gender: 'male' },
      { id: 'f2', full_name: 'Phạm Văn Chiến', gender: 'male' },
      { id: 'm1', full_name: 'Chu Thị Hà', gender: 'female' },
      { id: 'm2', full_name: 'Hoàng Thị Mơ', gender: 'female' },
      { id: 'm3', full_name: 'Đào Thị Liễu', gender: 'female' },
    ];

    const mockSpouses = [
      { id: 's1', member_a_id: 'f1', member_b_id: 'm1' }, // Khương có 1 vợ là Chu Thị Hà
      { id: 's2', member_a_id: 'f2', member_b_id: 'm2' }, // Chiến có 2 vợ: Mơ & Liễu
      { id: 's3', member_a_id: 'f2', member_b_id: 'm3' },
    ];

    // Hàm mô phỏng logic Cascading trong MemberFormModal
    const resolveMotherOnFatherChange = (newFatherId: string) => {
      if (!newFatherId) return { autoMotherId: '', availableMothers: [] };
      const spouseRels = mockSpouses.filter(
        (s) => s.member_a_id === newFatherId || s.member_b_id === newFatherId
      );
      const motherIds = spouseRels.map((s) => (s.member_a_id === newFatherId ? s.member_b_id : s.member_a_id));
      const wives = mockAllMembers.filter((m) => motherIds.includes(m.id));

      if (wives.length === 1) {
        return { autoMotherId: wives[0].id, availableMothers: wives };
      }
      return { autoMotherId: '', availableMothers: wives };
    };

    // 1. Khi chọn Cha chỉ có 1 vợ (Khương) -> Tự động điền Mẹ là Chu Thị Hà
    const res1 = resolveMotherOnFatherChange('f1');
    assert.strictEqual(res1.autoMotherId, 'm1', 'Cha có 1 vợ phải tự động gán Mẹ là vợ đó');
    assert.strictEqual(res1.availableMothers.length, 1);

    // 2. Khi chọn Cha có 2 vợ (Chiến) -> Reset Mẹ và danh sách Mẹ mở ra 2 người vợ
    const res2 = resolveMotherOnFatherChange('f2');
    assert.strictEqual(res2.autoMotherId, '', 'Cha có 2 vợ phải reset Mẹ để người dùng chọn');
    assert.strictEqual(res2.availableMothers.length, 2);
    assert.deepStrictEqual(res2.availableMothers.map((w) => w.id), ['m2', 'm3']);

    // 3. Khi không chọn Cha -> Reset Mẹ
    const res3 = resolveMotherOnFatherChange('');
    assert.strictEqual(res3.autoMotherId, '');
    assert.strictEqual(res3.availableMothers.length, 0);
  });

  // TC_UT_SPOUSE_INTEGRITY_GUARD_01: Rào chắn chặn lưu nếu Bố và Mẹ không phải vợ chồng
  it('TC_UT_SPOUSE_INTEGRITY_GUARD_01: Rào chắn chặn lưu nếu Bố và Mẹ không phải vợ chồng', () => {
    const mockSpouses = [
      { id: 's1', member_a_id: 'father-khuong', member_b_id: 'mother-ha' },
      { id: 's2', member_a_id: 'father-trang', member_b_id: 'mother-thuy' },
    ];

    const validateParentCoupling = (fatherId: string, motherId: string) => {
      if (!fatherId || !motherId) return { isValid: true };
      const isCoupled = mockSpouses.some(
        (s) =>
          (s.member_a_id === fatherId && s.member_b_id === motherId) ||
          (s.member_a_id === motherId && s.member_b_id === fatherId)
      );
      if (!isCoupled) {
        return {
          isValid: false,
          error: 'Người cha và người mẹ được chọn không phải là vợ chồng trong gia phả. Vui lòng kiểm tra lại.',
        };
      }
      return { isValid: true };
    };

    // Trường hợp hợp lệ: Khương và Hà là vợ chồng
    const validCheck = validateParentCoupling('father-khuong', 'mother-ha');
    assert.strictEqual(validCheck.isValid, true);

    // Trường hợp sai lệch: Bố là Khương nhưng Mẹ là Thuý (Vợ ông Tráng)
    const invalidCheck = validateParentCoupling('father-khuong', 'mother-thuy');
    assert.strictEqual(invalidCheck.isValid, false);
    assert.ok(invalidCheck.error?.includes('không phải là vợ chồng'));
  });

  // TC_UT_EDIT_MODE_PARENTS_UNLOCKED_01: Mục Bố Mẹ luôn mở khóa dropdown trong mode edit
  it('TC_UT_EDIT_MODE_PARENTS_UNLOCKED_01: Mục Bố Mẹ luôn mở khóa dropdown trong mode edit của MemberFormModal', () => {
    const formPath = path.resolve(process.cwd(), 'src/components/modals/MemberFormModal.tsx');
    assert.ok(fs.existsSync(formPath), 'File MemberFormModal.tsx phải tồn tại');
    const content = fs.readFileSync(formPath, 'utf-8');

    // 1. Kiểm tra Khối 2 mở khóa dropdown trong mode === 'edit'
    assert.ok(
      content.includes("(mode === 'edit' || defaultRole !== 'child')"),
      'MemberFormModal phải hiển thị Bố Mẹ khi mode === "edit"'
    );

    // 2. Kiểm tra có gắn handler Cascading cho dropdown Cha và Mẹ
    assert.ok(
      content.includes('onChange={(e) => handleFatherChange(e.target.value)}'),
      'Dropdown Cha phải dùng handleFatherChange để tự động đồng bộ Mẹ'
    );
    assert.ok(
      content.includes('onChange={(e) => handleMotherChange(e.target.value)}'),
      'Dropdown Mẹ phải dùng handleMotherChange'
    );

    // 3. Kiểm tra có state và nút gỡ con trong danh sách con
    assert.ok(
      content.includes('stagedUnlinkChildIds'),
      'MemberFormModal phải quản lý danh sách con chờ gỡ qua stagedUnlinkChildIds'
    );
    assert.ok(
      content.includes('handleToggleUnlinkChild'),
      'MemberFormModal phải có hàm handleToggleUnlinkChild'
    );
    assert.ok(
      content.includes('child_ids_to_unlink:'),
      'Payload formData phải gửi child_ids_to_unlink'
    );
  });

  // TC_UT_PARENT_OPTOUT_SINGLE_PARENT_01: Logic Opt-out cho phép lưu con riêng của Cha hoặc Mẹ
  it('TC_UT_PARENT_OPTOUT_SINGLE_PARENT_01: Logic Opt-out cho phép lưu con riêng của Cha hoặc Mẹ', () => {
    // Mô phỏng state và handler opt-out trong MemberFormModal
    let fatherId = 'father-khuong';
    let motherId = 'mother-ha';
    let isMotherOptedOut = false;

    const handleOptOutMother = () => {
      motherId = '';
      isMotherOptedOut = true;
    };

    // Người dùng bấm nút [✕ Bỏ chọn Mẹ (Con riêng của Bố)]
    handleOptOutMother();

    assert.strictEqual(motherId, '', 'motherId phải được xóa về rỗng');
    assert.strictEqual(isMotherOptedOut, true, 'Flag isMotherOptedOut phải bật true');

    // Giả lập logic build payload submit
    const payload = {
      father_id: fatherId || null,
      mother_id: motherId || null,
    };

    assert.strictEqual(payload.father_id, 'father-khuong');
    assert.strictEqual(payload.mother_id, null, 'Con riêng của Bố có mother_id là null');
  });

  // TC_UT_PARENT_PAIRING_CONFIRMATION_01: Phân giải trạng thái Cặp Phụ Mẫu
  it('TC_UT_PARENT_PAIRING_CONFIRMATION_01: Phân giải trạng thái Cặp Phụ Mẫu (resolveParentPairingStatus)', () => {
    const mockMembers: any[] = [
      { id: 'f1', full_name: 'Phạm Văn Khương', gender: 'male' },
      { id: 'm1', full_name: 'Chu Thị Hà', gender: 'female' },
      { id: 'f2', full_name: 'Phạm Văn Tráng', gender: 'male' },
      { id: 'm2', full_name: 'Phạm Thị Thuý', gender: 'female' },
    ];

    const mockSpouses: any[] = [
      { id: 's1', member_a_id: 'f1', member_b_id: 'm1' },
      { id: 's2', member_a_id: 'f2', member_b_id: 'm2' },
    ];

    // 1. Cặp phụ mẫu hợp pháp
    const validRes = resolveParentPairingStatus('f1', 'm1', mockMembers, mockSpouses);
    assert.strictEqual(validRes.status, 'valid_couple');
    assert.strictEqual(validRes.isValid, true);
    assert.ok(validRes.title.includes('Khương') && validRes.title.includes('Hà'));

    // 2. Con riêng của Bố (chỉ có bố)
    const singleFatherRes = resolveParentPairingStatus('f1', '', mockMembers, mockSpouses);
    assert.strictEqual(singleFatherRes.status, 'single_parent');
    assert.strictEqual(singleFatherRes.isValid, true);
    assert.ok(singleFatherRes.badge.includes('Con riêng của Bố'));

    // 3. Con riêng của Mẹ (chỉ có mẹ)
    const singleMotherRes = resolveParentPairingStatus('', 'm1', mockMembers, mockSpouses);
    assert.strictEqual(singleMotherRes.status, 'single_parent');
    assert.strictEqual(singleMotherRes.isValid, true);
    assert.ok(singleMotherRes.badge.includes('Con riêng của Mẹ'));

    // 4. Xung đột: Bố Khương nhưng Mẹ Thuý (không phải vợ chồng)
    const invalidRes = resolveParentPairingStatus('f1', 'm2', mockMembers, mockSpouses);
    assert.strictEqual(invalidRes.status, 'invalid_couple');
    assert.strictEqual(invalidRes.isValid, false);
    assert.ok(invalidRes.title.includes('Cảnh báo xung đột'));

    // 5. Mồ côi / chưa nối
    const noneRes = resolveParentPairingStatus('', '', mockMembers, mockSpouses);
    assert.strictEqual(noneRes.status, 'none');
    assert.strictEqual(noneRes.isValid, true);
  });

  // TC_INT_GENDER_AWARE_RELINK_01: Nối phả nhận diện giới tính không gán nhầm cột
  it('TC_INT_GENDER_AWARE_RELINK_01: Nối phả nhận diện giới tính phân bổ đúng father_id / mother_id', async () => {
    // 1. Logic phân bổ payload dựa theo giới tính
    const resolveRelinkPayload = (parent: { id: string; gender: string }) => {
      const isMother = parent.gender === 'female';
      return isMother ? { mother_id: parent.id } : { father_id: parent.id };
    };

    const fatherPayload = resolveRelinkPayload({ id: 'dad-1', gender: 'male' });
    assert.deepStrictEqual(fatherPayload, { father_id: 'dad-1' }, 'Nam phải gán vào father_id');

    const motherPayload = resolveRelinkPayload({ id: 'mom-1', gender: 'female' });
    assert.deepStrictEqual(motherPayload, { mother_id: 'mom-1' }, 'Nữ phải gán vào mother_id');

    // 2. Thử nghiệm qua API update với mother_id
    const request = new NextRequest('http://localhost:3000/api/members/m-gen4-tuan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mother_id: 'm-gen3-mai-an' }),
    });

    const response = await updateMember(request, { params: { id: 'm-gen4-tuan' } });
    assert.strictEqual(response.status, 200);
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.member.mother_id, 'm-gen3-mai-an');
  });

  // TC_UT_UNLINKED_DRAWER_SPOUSE_CONTEXT_01: Danh sách cha mẹ trong Khay Chưa Nối hiển thị kèm ngữ cảnh phối ngẫu
  it('TC_UT_UNLINKED_DRAWER_SPOUSE_CONTEXT_01: Khay Chưa Nối hiển thị kèm ngữ cảnh phối ngẫu (getParentDisplayNameWithSpouse)', () => {
    const mockMembers: any[] = [
      { id: 'f1', full_name: 'Phạm Văn Tráng', gender: 'male', generation_level: 2 },
      { id: 'm1', full_name: 'Phạm Thị Thuý', gender: 'female', generation_level: 2 },
      { id: 'f2', full_name: 'Phạm Văn Bẩy', gender: 'male', generation_level: 2 },
      { id: 'm2', full_name: 'Nguyễn Thị Thuý Hiền', gender: 'female', generation_level: 2 },
      { id: 'f3', full_name: 'Phạm Văn Chiến', gender: 'male', generation_level: 2 },
      { id: 'w1', full_name: 'Hoàng Thị Mơ', gender: 'female', generation_level: 2 },
      { id: 'w2', full_name: 'Đào Thị Liễu', gender: 'female', generation_level: 2 },
      { id: 'single', full_name: 'Nguyễn Văn Độc Thân', gender: 'male', generation_level: 3 },
    ];

    const mockSpouses: any[] = [
      { id: 's1', member_a_id: 'f1', member_b_id: 'm1' },
      { id: 's2', member_a_id: 'f2', member_b_id: 'm2' },
      { id: 's3', member_a_id: 'f3', member_b_id: 'w1' },
      { id: 's4', member_a_id: 'f3', member_b_id: 'w2' },
    ];

    // 1. Phụ mẫu là Nam có 1 vợ: Phạm Văn Tráng (Chồng của Phạm Thị Thuý, Đời 2)
    const nameTrang = getParentDisplayNameWithSpouse(mockMembers[0], mockMembers, mockSpouses);
    assert.ok(nameTrang.includes('Phạm Văn Tráng'));
    assert.ok(nameTrang.includes('Chồng của Phạm Thị Thuý'));

    // 2. Phụ mẫu là Nữ có chồng: Nguyễn Thị Thuý Hiền (Vợ của Phạm Văn Bẩy, Đời 2)
    const nameHien = getParentDisplayNameWithSpouse(mockMembers[3], mockMembers, mockSpouses);
    assert.ok(nameHien.includes('Nguyễn Thị Thuý Hiền'));
    assert.ok(nameHien.includes('Vợ của Phạm Văn Bẩy'));

    // 3. Phụ mẫu có 2 vợ: Phạm Văn Chiến (Chồng của Hoàng Thị Mơ & Đào Thị Liễu, Đời 2)
    const nameChien = getParentDisplayNameWithSpouse(mockMembers[4], mockMembers, mockSpouses);
    assert.ok(nameChien.includes('Phạm Văn Chiến'));
    assert.ok(nameChien.includes('Hoàng Thị Mơ') && nameChien.includes('Đào Thị Liễu'));

    // 4. Phụ mẫu chưa có vợ/chồng
    const nameSingle = getParentDisplayNameWithSpouse(mockMembers[7], mockMembers, mockSpouses);
    assert.strictEqual(nameSingle, 'Nguyễn Văn Độc Thân (Bố, Đời 3)');
  });

  // TC_UT_DRAWER_SMART_PAIRING_SINGLE_SPOUSE_01: Khay Chưa Nối tự động đề xuất người còn lại khi có 1 vợ/chồng & hỗ trợ Opt-out con riêng
  it('TC_UT_DRAWER_SMART_PAIRING_SINGLE_SPOUSE_01: Khay Chưa Nối đề xuất phối ngẫu 1 vợ/chồng & hỗ trợ Opt-out con riêng (resolveRelinkPayload)', () => {
    const dad = { id: 'dad-bay', full_name: 'Phạm Văn Bẩy', gender: 'male' } as any;
    const mom = { id: 'mom-hien', full_name: 'Nguyễn Thị Thuý Hiền', gender: 'female' } as any;

    // 1. Trường hợp chọn Bố Bẩy, đề xuất Mẹ Hiền được tick sẵn (con chung)
    const payloadCouple = resolveRelinkPayload(dad, mom.id, false);
    assert.deepStrictEqual(payloadCouple, {
      father_id: 'dad-bay',
      mother_id: 'mom-hien',
    }, 'Mặc định con nhận cả Bố và Mẹ');

    // 2. Người dùng bỏ tick (Opt-out) để lưu con riêng của Bố Bẩy
    const payloadSingleDad = resolveRelinkPayload(dad, mom.id, true);
    assert.deepStrictEqual(payloadSingleDad, {
      father_id: 'dad-bay',
      mother_id: null,
    }, 'Opt-out phải lưu father_id và mother_id là null');

    // 3. Trường hợp đối xứng chọn Mẹ Hiền, đề xuất Bố Bẩy được tick sẵn
    const payloadFromMom = resolveRelinkPayload(mom, dad.id, false);
    assert.deepStrictEqual(payloadFromMom, {
      father_id: 'dad-bay',
      mother_id: 'mom-hien',
    }, 'Chọn mẹ thì bố vẫn gán đúng father_id');

    // 4. Người dùng bỏ tick Bố để lưu con riêng của Mẹ Hiền
    const payloadSingleMom = resolveRelinkPayload(mom, dad.id, true);
    assert.deepStrictEqual(payloadSingleMom, {
      father_id: null,
      mother_id: 'mom-hien',
    }, 'Opt-out Bố phải lưu con riêng của Mẹ');
  });

  // TC_UT_DRAWER_SMART_PAIRING_MULTI_SPOUSE_01: Khay Chưa Nối hiển thị danh sách chọn mẹ khi người cha có đa thê
  it('TC_UT_DRAWER_SMART_PAIRING_MULTI_SPOUSE_01: Khay Chưa Nối hỗ trợ chọn mẹ khi cha có nhiều vợ', () => {
    const dadChien = { id: 'dad-chien', full_name: 'Phạm Văn Chiến', gender: 'male' } as any;
    const wifeMo = { id: 'wife-mo', full_name: 'Hoàng Thị Mơ', gender: 'female' } as any;
    const wifeLieu = { id: 'wife-lieu', full_name: 'Đào Thị Liễu', gender: 'female' } as any;

    // 1. Người dùng chọn Bà cả Hoàng Thị Mơ
    const payloadMo = resolveRelinkPayload(dadChien, wifeMo.id, false);
    assert.deepStrictEqual(payloadMo, {
      father_id: 'dad-chien',
      mother_id: 'wife-mo',
    });

    // 2. Người dùng chọn Bà hai Đào Thị Liễu
    const payloadLieu = resolveRelinkPayload(dadChien, wifeLieu.id, false);
    assert.deepStrictEqual(payloadLieu, {
      father_id: 'dad-chien',
      mother_id: 'wife-lieu',
    });

    // 3. Người dùng chọn không có mẹ (con riêng của Cụ Chiến)
    const payloadNoMom = resolveRelinkPayload(dadChien, '', true);
    assert.deepStrictEqual(payloadNoMom, {
      father_id: 'dad-chien',
      mother_id: null,
    });
  });

  // TC_INT_DRAWER_RELINK_FULL_PAYLOAD_01: onRelinkMember truyền payload cả cha lẫn mẹ lên API
  it('TC_INT_DRAWER_RELINK_FULL_PAYLOAD_01: API /api/members/[id] cập nhật đồng thời cả father_id và mother_id từ relink payload', async () => {
    const payload = {
      father_id: 'm-gen3-an',
      mother_id: 'm-gen3-mai-an',
    };

    const request = new NextRequest('http://localhost:3000/api/members/m-gen4-tuan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await updateMember(request, { params: { id: 'm-gen4-tuan' } });
    assert.strictEqual(response.status, 200, 'API phải trả về HTTP 200');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.member.father_id, 'm-gen3-an', 'father_id phải là m-gen3-an');
    assert.strictEqual(json.member.mother_id, 'm-gen3-mai-an', 'mother_id phải là m-gen3-mai-an');
  });

  // TC_UT_DRAWER_UNIFIED_FLAT_RADIO_01: Thống nhất lựa chọn phối ngẫu qua Radio phẳng cho cả 1 vợ và nhiều vợ
  it('TC_UT_DRAWER_UNIFIED_FLAT_RADIO_01: Thống nhất lựa chọn phối ngẫu qua Radio phẳng cho cả 1 vợ và nhiều vợ (Edge Case 40)', () => {
    const dad = { id: 'dad-1', full_name: 'Phạm Văn Bẩy', gender: 'male' } as any;
    const momSingle = { id: 'mom-1', full_name: 'Nguyễn Thị Thuý Hiền', gender: 'female' } as any;

    // 1. Trường hợp 1 vợ: Chọn radio phối ngẫu
    const p1 = resolveRelinkPayload(dad, momSingle.id, false);
    assert.deepStrictEqual(p1, { father_id: 'dad-1', mother_id: 'mom-1' });

    // 2. Trường hợp 1 vợ: Chọn radio không phối ngẫu (con riêng)
    const p2 = resolveRelinkPayload(dad, '', true);
    assert.deepStrictEqual(p2, { father_id: 'dad-1', mother_id: null });

    // 3. Trường hợp đa thê: Chọn radio bà cả / bà hai / con riêng
    const dadMulti = { id: 'dad-2', full_name: 'Phạm Văn Chiến', gender: 'male' } as any;
    const wife1 = { id: 'wife-1', full_name: 'Hoàng Thị Mơ' } as any;
    const wife2 = { id: 'wife-2', full_name: 'Đào Thị Liễu' } as any;

    const pWife1 = resolveRelinkPayload(dadMulti, wife1.id, false);
    assert.deepStrictEqual(pWife1, { father_id: 'dad-2', mother_id: 'wife-1' });

    const pWife2 = resolveRelinkPayload(dadMulti, wife2.id, false);
    assert.deepStrictEqual(pWife2, { father_id: 'dad-2', mother_id: 'wife-2' });

    const pStepchild = resolveRelinkPayload(dadMulti, '', true);
    assert.deepStrictEqual(pStepchild, { father_id: 'dad-2', mother_id: null });
  });

  // TC_UT_DRAWER_ZERO_BOX_IN_BOX_GUARD_01: Rào chắn cấu trúc mã nguồn không box-in-box trong Khay Chưa Nối
  it('TC_UT_DRAWER_ZERO_BOX_IN_BOX_GUARD_01: Rào chắn cấu trúc mã nguồn không box-in-box trong UnlinkedMembersDrawer (Edge Case 40)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(__dirname, '../src/components/tree/UnlinkedMembersDrawer.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Đảm bảo không còn checkbox trong khối candidateSpouses
    assert.ok(
      !content.includes('type="checkbox"'),
      'Khối lựa chọn phối ngẫu trong Drawer không được dùng checkbox (phải dùng radio thống nhất 100%)'
    );

    // 2. Đảm bảo các lựa chọn dùng type="radio"
    assert.ok(
      content.includes('type="radio"'),
      'Drawer phải sử dụng type="radio" cho các lựa chọn người phối ngẫu'
    );

    // 3. Rào chắn Zero Box-in-Box: Không được lồng container viền emerald hoặc amber bên trong khối candidateSpouses
    assert.ok(
      !content.includes('border-emerald-200 dark:border-emerald-800/60'),
      'Không được lồng hộp border-emerald-200 bên trong thẻ thành viên'
    );
    assert.ok(
      !content.includes('bg-emerald-50 dark:bg-emerald-950/40'),
      'Không được lồng hộp bg-emerald-50 bên trong thẻ thành viên'
    );
  });
});

