import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getImmediateFamily, getNextSolarAnniversary, groupChildrenByMother } from '../src/lib/tree-layout/immediate-family';
import { calculateTreeLayout } from '../src/lib/tree-layout/genealogy-layout';
import { SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS } from './fixtures/sample-clan-28';
import { MemberRecord, SpouseRelationRecord } from '../src/types/tree';

describe('Member Detail & Immediate Family Test Suite (Milestone 3.2)', () => {
  // TC_UT_DET_01: Trích xuất gia đình 1 đời chuẩn xác
  it('TC_UT_DET_01: Trích xuất chính xác Phụ mẫu, Phu thê, Huynh đệ, Con cái của một người bình thường', () => {
    // Thử nghiệm với m-gen2-truong (Nguyễn Văn Trưởng)
    // Cha: m-root-khoi, Mẹ: m-root-to, Vợ: m-gen2-hoa, Em gái: m-gen2-thu, Con: m-gen3-thanh, m-gen3-thao
    const family = getImmediateFamily('m-gen2-truong', SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS);

    assert.ok(family, 'Phải tìm thấy dữ liệu thân tộc');
    assert.strictEqual(family.targetMember.id, 'm-gen2-truong');

    // Phụ mẫu
    assert.strictEqual(family.parents.father?.id, 'm-root-khoi', 'Cha phải là Nguyễn Văn Khởi');
    assert.strictEqual(family.parents.mother?.id, 'm-root-to', 'Mẹ phải là Trần Thị Tổ');

    // Phu thê
    assert.strictEqual(family.spouses.length, 1, 'Phải có đúng 1 người vợ');
    assert.strictEqual(family.spouses[0].member.id, 'm-gen2-hoa', 'Vợ phải là Lê Thị Hoa');

    // Huynh đệ (Em trai m-gen2-thu - Nguyễn Văn Thứ)
    const hasSiblingThu = family.siblings.some((s) => s.id === 'm-gen2-thu');
    assert.ok(hasSiblingThu, 'Huynh đệ phải có Nguyễn Văn Thứ (m-gen2-thu)');

    // Con cái (m-gen3-an, m-gen3-binh)
    const childIds = family.children.map((c) => c.id);
    assert.ok(childIds.includes('m-gen3-an'), 'Con cái phải có Nguyễn Văn An');
    assert.ok(childIds.includes('m-gen3-binh'), 'Con cái phải có Nguyễn Văn Bình');
  });

  // TC_UT_DET_02: Trích xuất gia đình cho trường hợp đa thê
  it('TC_UT_DET_02: Trích xuất chuẩn xác quan hệ cho trường hợp đa thê (1 chồng 2 vợ)', () => {
    // Tạo fixture nhỏ đa thê: Cụ Ông có Vợ Cả và Vợ Hai
    const polyMembers: MemberRecord[] = [
      {
        id: 'poly-husband',
        full_name: 'Phạm Kim Châu',
        gender: 'male',
        life_status: 'deceased',
        generation_level: 6,
        is_root: true,
      },
      {
        id: 'poly-wife-1',
        full_name: 'Lê Thị Lựu',
        gender: 'female',
        life_status: 'deceased',
        generation_level: 6,
        is_root: false,
      },
      {
        id: 'poly-wife-2',
        full_name: 'Lê Thị Thông',
        gender: 'female',
        life_status: 'deceased',
        generation_level: 6,
        is_root: false,
      },
      {
        id: 'child-w1',
        full_name: 'Phạm Kim Lúa',
        gender: 'male',
        life_status: 'deceased',
        generation_level: 7,
        father_id: 'poly-husband',
        mother_id: 'poly-wife-1',
        is_root: false,
      },
      {
        id: 'child-w2',
        full_name: 'Phạm Kim Diễn',
        gender: 'male',
        life_status: 'deceased',
        generation_level: 7,
        father_id: 'poly-husband',
        mother_id: 'poly-wife-2',
        is_root: false,
      },
    ];

    const polyRelations: SpouseRelationRecord[] = [
      {
        id: 'rel-1',
        member_a_id: 'poly-husband',
        member_b_id: 'poly-wife-1',
        marriage_order: 1,
        marriage_status: 'first_wife',
      },
      {
        id: 'rel-2',
        member_a_id: 'poly-husband',
        member_b_id: 'poly-wife-2',
        marriage_order: 2,
        marriage_status: 'second_wife',
      },
    ];

    const family = getImmediateFamily('poly-husband', polyMembers, polyRelations);

    assert.ok(family, 'Phải tìm thấy dữ liệu thân tộc đa thê');
    assert.strictEqual(family.spouses.length, 2, 'Người chồng phải có đúng 2 người vợ');
    assert.strictEqual(family.spouses[0].member.id, 'poly-wife-1', 'Vợ thứ nhất phải là Lê Thị Lựu');
    assert.strictEqual(family.spouses[1].member.id, 'poly-wife-2', 'Vợ thứ hai phải là Lê Thị Thông');

    assert.strictEqual(family.children.length, 2, 'Tổng số con phải là 2 người từ 2 bà');
  });

  // TC_UT_DET_03: Tính ngày giỗ Dương lịch kế tiếp chuẩn xác
  it('TC_UT_DET_03: Tính toán Ngày giỗ Dương lịch kế tiếp từ Ngày giỗ Âm lịch chuẩn xác', () => {
    // Ngày giỗ Âm lịch: Rằm tháng Giêng (15/01 Âm)
    const anniv = getNextSolarAnniversary(15, 1);

    assert.ok(anniv, 'Phải tính được ngày giỗ dương lịch');
    assert.match(anniv.solarDateStr, /^\d{4}-\d{2}-\d{2}$/, 'Chuỗi ngày giỗ phải có định dạng YYYY-MM-DD');
    assert.ok(anniv.daysLeft >= 0, 'Số ngày đếm ngược phải >= 0');

    // Trường hợp dữ liệu âm lịch không hợp lệ hoặc rỗng -> Trả về null
    assert.strictEqual(getNextSolarAnniversary(null, null), null, 'Rỗng phải trả về null');
    assert.strictEqual(getNextSolarAnniversary(0, 5), null, 'Ngày 0 phải trả về null');
    assert.strictEqual(getNextSolarAnniversary(15, 0), null, 'Tháng 0 phải trả về null');
  });

  // TC_UT_DET_04: Xử lý node khuyết danh trong layout & family
  it('TC_UT_DET_04: Xử lý Node Khuyết danh (is_anonymous = true) ở Đời 2 không làm gãy bus line và thế hệ', () => {
    const anonClan: MemberRecord[] = [
      {
        id: 'm-d01',
        full_name: 'Phạm Văn Chiến (Đời 1)',
        gender: 'male',
        life_status: 'deceased',
        generation_level: 1,
        is_root: true,
      },
      {
        id: 'm-d02-anon',
        full_name: '(Khuyết danh Đời 2)',
        gender: 'male',
        life_status: 'deceased',
        generation_level: 2,
        father_id: 'm-d01',
        is_root: false,
        is_anonymous: true,
        notes: 'Thất truyền tên húy trong gia phả',
      },
      {
        id: 'm-d03',
        full_name: 'Phạm Kim Chức (Đời 3)',
        gender: 'male',
        life_status: 'deceased',
        generation_level: 3,
        father_id: 'm-d02-anon',
        is_root: false,
      },
    ];

    const { nodes, edges } = calculateTreeLayout(anonClan, []);

    assert.strictEqual(nodes.length, 3, 'Phải có đủ 3 nodes');

    const anonNode = nodes.find((n) => n.id === 'm-d02-anon');
    assert.ok(anonNode, 'Phải có node khuyết danh');
    assert.strictEqual(anonNode.data.isAnonymous, true, 'isAnonymous phải là true trong TreeNodeData');
    assert.strictEqual(anonNode.data.generationLevel, 2, 'Thế hệ phải là Đời 2');

    // Kiểm tra thân tộc của cụ Đời 3
    const familyD03 = getImmediateFamily('m-d03', anonClan, []);
    assert.ok(familyD03);
    assert.strictEqual(familyD03.parents.father?.id, 'm-d02-anon', 'Cha của Cụ Đời 3 phải là Node Khuyết danh Đời 2');
    assert.strictEqual(familyD03.parents.father?.is_anonymous, true);
  });

  // TC_UT_DET_05: Phân nhóm con cái theo mẹ trong ImmediateFamily
  it('TC_UT_DET_05: Phân nhóm con cái theo mẹ cho người cha đa thê (Vợ cả, Vợ hai) và con riêng khuyết mẹ', () => {
    const polyMembers: MemberRecord[] = [
      { id: 'm-chien', full_name: 'Phạm Văn Chiến', gender: 'male', life_status: 'living', generation_level: 5, is_root: true },
      { id: 'm-mo', full_name: 'Hoàng Thị Mơ', gender: 'female', life_status: 'living', generation_level: 5, is_root: false },
      { id: 'm-lieu', full_name: 'Đào Thị Liễu', gender: 'female', life_status: 'living', generation_level: 5, is_root: false },
      // Con bà Mơ
      { id: 'c-mo-1', full_name: 'Phạm Văn Minh', gender: 'male', life_status: 'living', generation_level: 6, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 1, is_root: false },
      { id: 'c-mo-2', full_name: 'Phạm Thị Lan', gender: 'female', life_status: 'living', generation_level: 6, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 2, is_root: false },
      // Con bà Liễu
      { id: 'c-lieu-1', full_name: 'Phạm Văn Đức', gender: 'male', life_status: 'living', generation_level: 6, father_id: 'm-chien', mother_id: 'm-lieu', birth_order: 1, is_root: false },
      { id: 'c-lieu-2', full_name: 'Phạm Thị Mai', gender: 'female', life_status: 'living', generation_level: 6, father_id: 'm-chien', mother_id: 'm-lieu', birth_order: 2, is_root: false },
      // Con riêng khuyết mẹ
      { id: 'c-single-1', full_name: 'Phạm Văn Khuyết', gender: 'male', life_status: 'living', generation_level: 6, father_id: 'm-chien', mother_id: null, birth_order: 3, is_root: false },
    ];

    const polySpouses: SpouseRelationRecord[] = [
      { id: 'rel-chien-mo', member_a_id: 'm-chien', member_b_id: 'm-mo', marriage_order: 1 },
      { id: 'rel-chien-lieu', member_a_id: 'm-chien', member_b_id: 'm-lieu', marriage_order: 2 },
    ];

    const memberMap = new Map<string, MemberRecord>();
    polyMembers.forEach((m) => memberMap.set(m.id, m));

    const children = polyMembers.filter((m) => m.father_id === 'm-chien');
    const groups = groupChildrenByMother('m-chien', children, polySpouses, memberMap);

    // Phải có đúng 3 nhóm: Bà cả (2 con), Bà hai (2 con), Khuyết mẹ (1 con)
    assert.strictEqual(groups.length, 3, 'Phải chia thành 3 nhóm con');

    // Nhóm 1: Bà Cả Hoàng Thị Mơ
    assert.strictEqual(groups[0].motherId, 'm-mo');
    assert.strictEqual(groups[0].motherName, 'Hoàng Thị Mơ');
    assert.strictEqual(groups[0].marriageOrder, 1);
    assert.strictEqual(groups[0].children.length, 2);
    assert.deepStrictEqual(groups[0].children.map((c) => c.id), ['c-mo-1', 'c-mo-2']);

    // Nhóm 2: Bà Hai Đào Thị Liễu
    assert.strictEqual(groups[1].motherId, 'm-lieu');
    assert.strictEqual(groups[1].motherName, 'Đào Thị Liễu');
    assert.strictEqual(groups[1].marriageOrder, 2);
    assert.strictEqual(groups[1].children.length, 2);
    assert.deepStrictEqual(groups[1].children.map((c) => c.id), ['c-lieu-1', 'c-lieu-2']);

    // Nhóm 3: Con riêng khuyết mẹ
    assert.strictEqual(groups[2].motherId, null);
    assert.strictEqual(groups[2].motherName, 'Chưa rõ thông tin mẹ');
    assert.strictEqual(groups[2].children.length, 1);
    assert.strictEqual(groups[2].children[0].id, 'c-single-1');

    // Kiểm tra qua getImmediateFamily cũng chứa childrenGroups
    const family = getImmediateFamily('m-chien', polyMembers, polySpouses);
    assert.ok(family);
    assert.ok(family.childrenGroups);
    assert.strictEqual(family.childrenGroups.length, 3);
  });
});
