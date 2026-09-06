import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isDescendantOf,
  validateNoCycle,
  CycleDetectedError,
  getUnlinkedMembers,
  recalculateGenerations,
  canDeleteMember,
  detectConsanguinity,
  validateParentChildAge,
  BiologicalAgeError,
  resolveSeniorConflict,
} from '../src/lib/tree-layout/graph-validation';
import { SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS } from '../src/lib/tree-layout/sample-data';
import { MemberRecord, SpouseRelationRecord } from '../src/types/tree';

describe('Graph Validation & Relinking Test Suite (Milestone 4)', () => {
  // TC_UT01: Kiểm tra chặn vòng lặp cha-con trực tiếp
  it('TC_UT01: Kiểm tra chặn vòng lặp cha-con trực tiếp', () => {
    // Trong sample 28: m-root-khoi (Cha) -> m-gen2-truong (Con)
    // Nếu cố tình gán m-gen2-truong làm cha của m-root-khoi -> Phải ném CycleDetectedError
    assert.throws(
      () => {
        validateNoCycle('m-root-khoi', 'm-gen2-truong', SAMPLE_MEMBERS_28);
      },
      CycleDetectedError,
      'Phải ném CycleDetectedError khi gán con làm cha'
    );

    // Gán chính mình làm cha -> Phải ném lỗi
    assert.throws(
      () => {
        validateNoCycle('m-gen2-truong', 'm-gen2-truong', SAMPLE_MEMBERS_28);
      },
      CycleDetectedError,
      'Phải ném CycleDetectedError khi gán chính mình làm cha'
    );
  });

  // TC_UT02: Kiểm tra chặn vòng lặp gián tiếp 3 đời
  it('TC_UT02: Kiểm tra chặn vòng lặp gián tiếp 3 đời', () => {
    // m-root-khoi (Đời 1) -> m-gen2-truong (Đời 2) -> m-gen3-an (Đời 3) -> m-gen4-nam (Đời 4)
    // Gán m-gen4-nam (Chắt) làm cha của m-root-khoi (Cụ Cố) -> Phải phát hiện chu trình!
    const isCycle = isDescendantOf('m-gen4-nam', 'm-root-khoi', SAMPLE_MEMBERS_28);
    assert.strictEqual(isCycle, true, 'm-gen4-nam phải là hậu duệ của m-root-khoi');

    assert.throws(
      () => {
        validateNoCycle('m-root-khoi', 'm-gen4-nam', SAMPLE_MEMBERS_28);
      },
      CycleDetectedError,
      'Phải ném lỗi khi gán chắt làm cha của cụ tổ'
    );
  });

  // TC_UT03: Lọc thành viên chưa nối loại trừ Dâu/Rể ngoại tộc
  it('TC_UT03: Lọc thành viên chưa nối loại trừ Dâu/Rể ngoại tộc', () => {
    // Trong clan 28: Lê Thị Hoa (m-gen2-hoa) không có cha mẹ trong clan nhưng kết hôn với Nguyễn Văn Trưởng (m-gen2-truong).
    // Hoa là Dâu ngoại tộc -> KHÔNG ĐƯỢC coi là unlinked!
    // Thêm 1 thành viên mồ côi thực sự (orphan): Không có cha mẹ, không có vợ/chồng
    const orphanMember: MemberRecord = {
      id: 'm-orphan-test',
      full_name: 'Người Mồ Côi',
      gender: 'male',
      life_status: 'living',
      father_id: null,
      mother_id: null,
      generation_level: 1,
      is_root: false,
    };

    const membersWithOrphan = [...SAMPLE_MEMBERS_28, orphanMember];
    const unlinked = getUnlinkedMembers(membersWithOrphan, SAMPLE_SPOUSE_RELATIONS);

    // Unlinked chỉ được phép chứa orphanMember
    const containsOrphan = unlinked.some((m) => m.id === 'm-orphan-test');
    assert.strictEqual(containsOrphan, true, 'Người mồ côi phải nằm trong danh sách chưa nối');

    // Dâu Lê Thị Hoa không được nằm trong unlinked
    const containsHoa = unlinked.some((m) => m.id === 'm-gen2-hoa');
    assert.strictEqual(containsHoa, false, 'Dâu ngoại tộc Lê Thị Hoa tuyệt đối không được coi là unlinked');

    // Cụ tổ Khởi không được nằm trong unlinked
    const containsKhoi = unlinked.some((m) => m.id === 'm-root-khoi');
    assert.strictEqual(containsKhoi, false, 'Cụ tổ không được coi là unlinked');
  });

  // TC_UT04: Đệ quy cập nhật thế hệ khi nối phả
  it('TC_UT04: Đệ quy cập nhật thế hệ khi nối phả', () => {
    // Tạo 1 nhánh độc lập: Nhánh X (Cụ X, đời 1) -> Con Y (đời 2) -> Cháu Z (đời 3)
    const floatingMembers: MemberRecord[] = [
      {
        id: 'float-x',
        full_name: 'Cụ X',
        gender: 'male',
        life_status: 'living',
        father_id: null,
        mother_id: null,
        generation_level: 1,
        is_root: false,
      },
      {
        id: 'float-y',
        full_name: 'Con Y',
        gender: 'male',
        life_status: 'living',
        father_id: 'float-x',
        mother_id: null,
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'float-z',
        full_name: 'Cháu Z',
        gender: 'male',
        life_status: 'living',
        father_id: 'float-y',
        mother_id: null,
        generation_level: 3,
        is_root: false,
      },
    ];

    const allTestMembers = [...SAMPLE_MEMBERS_28, ...floatingMembers];

    // Nối Cụ X làm con của m-gen3-an (Ông An, Đời 3 trong Clan 28)
    // Sau khi nối: Cụ X phải thành Đời 4, Con Y phải thành Đời 5, Cháu Z phải thành Đời 6
    const updatedGenMap = recalculateGenerations('float-x', 'm-gen3-an', allTestMembers);

    assert.strictEqual(updatedGenMap.get('float-x'), 4, 'Cụ X phải được cập nhật lên Đời 4');
    assert.strictEqual(updatedGenMap.get('float-y'), 5, 'Con Y phải được đệ quy lên Đời 5');
    assert.strictEqual(updatedGenMap.get('float-z'), 6, 'Cháu Z phải được đệ quy lên Đời 6');
  });

  // TC_UT05: Chính sách xóa an toàn RESTRICT
  it('TC_UT05: Chính sách xóa an toàn RESTRICT', () => {
    // m-root-khoi có con cái -> KHÔNG được phép xóa
    const deleteCheckKhoi = canDeleteMember('m-root-khoi', SAMPLE_MEMBERS_28);
    assert.strictEqual(deleteCheckKhoi.canDelete, false, 'Cụ Khởi đang có con cái, cấm xóa');
    assert.ok(deleteCheckKhoi.childrenCount > 0, 'Số lượng con phải > 0');
    assert.ok(deleteCheckKhoi.reason?.includes('Không thể xóa'));

    // m-gen4-nam (Bé Nam, đời 4, chưa có con) -> Được phép xóa (Node lá)
    const deleteCheckNam = canDeleteMember('m-gen4-nam', SAMPLE_MEMBERS_28);
    assert.strictEqual(deleteCheckNam.canDelete, true, 'Bé Nam là node lá không có con cái, được phép xóa');
    assert.strictEqual(deleteCheckNam.childrenCount, 0);
  });

  // TC_UT06: Phát hiện hôn nhân nội tộc qua LCA
  it('TC_UT06: Phát hiện hôn nhân nội tộc qua LCA', () => {
    // Trong clan 28:
    // Tuấn (m-gen4-tuan, Chi 1) và Mai (m-gen4-mai-noi-toc, Chi 2) có chung Cụ Tổ là Nguyễn Văn Khởi (m-root-khoi)
    const consanguinity = detectConsanguinity('m-gen4-tuan', 'm-gen4-mai-noi-toc', SAMPLE_MEMBERS_28);

    assert.strictEqual(consanguinity.isConsanguineous, true, 'Tuấn và Mai phải là hôn nhân nội tộc');
    assert.strictEqual(consanguinity.commonAncestorName, 'Nguyễn Văn Khởi', 'Tổ tiên chung phải là Nguyễn Văn Khởi');
    assert.ok(consanguinity.message?.includes('hôn nhân nội tộc'));

    // Người ngoài họ kết hôn (ví dụ Khởi và Dâu Hoa không cùng huyết thống)
    const nonConsanguinity = detectConsanguinity('m-root-khoi', 'm-gen2-hoa', SAMPLE_MEMBERS_28);
    assert.strictEqual(nonConsanguinity.isConsanguineous, false, 'Khởi và Hoa không có quan hệ huyết thống nội tộc');
  });

  // TC_UT_AGE_01: Chặn con sinh trước hoặc cùng năm với Bố/Mẹ
  it('TC_UT_AGE_01: validateParentChildAge chặn con sinh trước hoặc cùng năm với Bố/Mẹ', () => {
    // Bố sinh 1990, con sinh 1978 -> Ném BiologicalAgeError
    assert.throws(
      () => {
        validateParentChildAge(1978, 1990, 'Bố', 'Nguyễn Văn Tuấn');
      },
      BiologicalAgeError,
      'Phải ném lỗi khi con sinh năm trước năm sinh của bố'
    );

    // Bố sinh 1990, con sinh cùng năm 1990 -> Ném BiologicalAgeError
    assert.throws(
      () => {
        validateParentChildAge(1990, 1990, 'Bố', 'Nguyễn Văn Tuấn');
      },
      BiologicalAgeError,
      'Phải ném lỗi khi con sinh cùng năm với bố'
    );

    // Bố sinh 1990, con sinh 1998 (cách 8 tuổi) -> Valid nhưng có cảnh báo tuổi gần
    const warnRes = validateParentChildAge(1998, 1990, 'Bố', 'Nguyễn Văn Tuấn');
    assert.strictEqual(warnRes.isValid, true);
    assert.ok(warnRes.warning?.includes('khá gần'), 'Phải cảnh báo khi khoảng cách tuổi < 15');

    // Bố sinh 1970, con sinh 1998 (cách 28 tuổi) -> Hoàn toàn hợp lệ, 0 cảnh báo
    const validRes = validateParentChildAge(1998, 1970, 'Bố', 'Nguyễn Văn An');
    assert.strictEqual(validRes.isValid, true);
    assert.strictEqual(validRes.warning, undefined);
  });

  // TC_UT_SENIOR_01: Phát hiện và giải quyết xung đột Con Trưởng duy nhất
  it('TC_UT_SENIOR_01: resolveSeniorConflict bảo toàn nguyên tắc duy nhất 1 Con Trưởng', () => {
    const mockSiblings: MemberRecord[] = [
      { id: 'child-1', full_name: 'Nguyên Văn A', is_senior: true, generation_level: 5, gender: 'male', life_status: 'living', is_root: false },
      { id: 'child-2', full_name: 'Nguyễn Văn B', is_senior: false, generation_level: 5, gender: 'male', life_status: 'living', is_root: false },
    ];

    // child-2 muốn làm Con Trưởng -> Phải phát hiện xung đột với child-1
    const conflictRes = resolveSeniorConflict('child-2', mockSiblings, true);
    assert.strictEqual(conflictRes.hasConflict, true);
    assert.strictEqual(conflictRes.currentSenior?.id, 'child-1');
    assert.strictEqual(conflictRes.currentSenior?.full_name, 'Nguyên Văn A');

    // Danh sách anh chị em được cập nhật: child-1 bị hạ cờ is_senior = false
    const oldSeniorAfter = conflictRes.updatedSiblings.find((s) => s.id === 'child-1');
    assert.strictEqual(oldSeniorAfter?.is_senior, false, 'Con trưởng cũ phải bị hạ cờ false');

    // Nếu không muốn làm con trưởng (wantsSenior = false) -> Không có xung đột
    const noConflictRes = resolveSeniorConflict('child-2', mockSiblings, false);
    assert.strictEqual(noConflictRes.hasConflict, false);
  });

  // TC_UT_DRAWER_SAFE_DELETE_STATUS: Kiểm tra logic Safe Delete RESTRICT cho Drawer
  it('TC_UT_DRAWER_SAFE_DELETE_STATUS: canDeleteMember cho phép xóa node lá và chặn xóa node có con cái kèm lý do', () => {
    // 1. Node lá không có con (Nam - m-gen4-nam) -> Được phép xóa
    const leafCheck = canDeleteMember('m-gen4-nam', SAMPLE_MEMBERS_28);
    assert.strictEqual(leafCheck.canDelete, true, 'Node lá không có con phải canDelete = true');
    assert.strictEqual(leafCheck.childrenCount, 0);

    // 2. Node cha có con cái (Trưởng - m-gen2-truong) -> Chặn xóa
    const parentCheck = canDeleteMember('m-gen2-truong', SAMPLE_MEMBERS_28);
    assert.strictEqual(parentCheck.canDelete, false, 'Node đang có con cái phải canDelete = false');
    assert.ok(parentCheck.childrenCount > 0, 'Phải đếm được số lượng con');
    assert.ok(parentCheck.reason?.includes('Không thể xóa'), 'Phải có lý do giải thích rõ ràng');

    // 3. Cụ tổ (Khởi - m-root-khoi) -> Chặn xóa
    const rootCheck = canDeleteMember('m-root-khoi', SAMPLE_MEMBERS_28);
    assert.strictEqual(rootCheck.canDelete, false);
    assert.ok(rootCheck.childrenCount > 0);
  });
});

