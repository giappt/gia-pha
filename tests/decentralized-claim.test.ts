import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateProposedChildData,
  validateFindOriginData,
  deduceUserBranchFocus,
  formatMemberContextCard,
  canUserManageMember,
  getCandidateSpouses,
  getParentDisplayNameWithSpouse,
  calculateSuggestedBirthOrder,
  calculateBirthOrderExplanation,
  filterUnclaimedCandidateMembers,
} from '../src/lib/claims/claim-engine';
import type { BranchNode } from '../src/types/database';
import type { MemberRecord, SpouseRelationRecord } from '../src/types/tree';

describe('Decentralized Claim, Onboarding & Subtree Governance (Milestone 8 - Phase 1)', () => {
  // Mock dữ liệu dòng họ 4 thế hệ:
  // Đời 1: Cụ Thủy Tổ (id: m1)
  // Đời 2: Cụ Ngành 1 (id: m2, con m1) & Cụ Ngành 2 (id: m3, con m1)
  // Đời 3: Bác Bình (id: m4, con m2) & Chú Hùng (id: m5, con m3)
  // Đời 4: Tuấn Chi 1 (id: m6, con m4, Chi 1) & Tuấn Chi 2 (id: m7, con m5, Chi 2)
  const mockMembers: MemberRecord[] = [
    {
      id: 'm1',
      full_name: 'Phạm Thủy Tổ',
      gender: 'male',
      life_status: 'deceased',
      father_id: null,
      generation_level: 1,
      is_root: true,
    },
    {
      id: 'm2',
      full_name: 'Phạm Văn Ngành Một',
      gender: 'male',
      life_status: 'deceased',
      father_id: 'm1',
      generation_level: 2,
      is_root: false,
    },
    {
      id: 'm3',
      full_name: 'Phạm Văn Ngành Hai',
      gender: 'male',
      life_status: 'deceased',
      father_id: 'm1',
      generation_level: 2,
      is_root: false,
    },
    {
      id: 'm4',
      full_name: 'Phạm Văn Bình',
      gender: 'male',
      life_status: 'living',
      father_id: 'm2',
      generation_level: 3,
      birth_year: 1965,
      is_root: false,
    },
    {
      id: 'm4_spouse',
      full_name: 'Trần Thị Mai',
      gender: 'female',
      life_status: 'living',
      father_id: null,
      generation_level: 3,
      birth_year: 1968,
      is_root: false,
    },
    {
      id: 'm5',
      full_name: 'Phạm Văn Hùng',
      gender: 'male',
      life_status: 'living',
      father_id: 'm3',
      generation_level: 3,
      birth_year: 1970,
      is_root: false,
    },
    {
      id: 'm5_spouse',
      full_name: 'Lê Thị Hoa',
      gender: 'female',
      life_status: 'living',
      father_id: null,
      generation_level: 3,
      birth_year: 1972,
      is_root: false,
    },
    {
      id: 'm6',
      full_name: 'Phạm Văn Tuấn',
      gender: 'male',
      life_status: 'living',
      father_id: 'm4',
      mother_id: 'm4_spouse',
      generation_level: 4,
      birth_year: 1995,
      birth_order: 1,
      is_root: false,
    },
    {
      id: 'm7',
      full_name: 'Phạm Văn Tuấn',
      gender: 'male',
      life_status: 'living',
      father_id: 'm5',
      mother_id: 'm5_spouse',
      generation_level: 4,
      birth_year: 2001,
      birth_order: 2,
      is_root: false,
    },
  ];

  const mockSpouseRelations: SpouseRelationRecord[] = [
    {
      id: 'sp1',
      member_a_id: 'm4',
      member_b_id: 'm4_spouse',
      marriage_order: 1,
    },
    {
      id: 'sp2',
      member_a_id: 'm5',
      member_b_id: 'm5_spouse',
      marriage_order: 1,
    },
  ];

  const mockBranches: BranchNode[] = [
    {
      id: 'b_nganh1',
      tierName: 'Ngành',
      name: 'Ngành 1',
      rootMemberId: 'm2',
      children: [
        {
          id: 'b_chi1',
          tierName: 'Chi',
          name: 'Chi 1',
          rootMemberId: 'm4',
        },
      ],
    },
    {
      id: 'b_nganh2',
      tierName: 'Ngành',
      name: 'Ngành 2',
      rootMemberId: 'm3',
      children: [
        {
          id: 'b_chi2',
          tierName: 'Chi',
          name: 'Chi 2',
          rootMemberId: 'm5',
        },
      ],
    },
  ];

  const mockMembersMap = new Map<string, MemberRecord>();
  mockMembers.forEach((m) => mockMembersMap.set(m.id, m));

  it('TC_UT_CLAIM_AUTO_DEDUCE_BRANCH: Tự động khởi tạo Chi Nhánh sâu nhất khi user gắn node', () => {
    // Member m6 (con cụ m4 thuộc Chi 1, Ngành 1)
    const deducedBranch1 = deduceUserBranchFocus('m6', mockMembers, mockBranches, mockSpouseRelations);
    assert.strictEqual(deducedBranch1, 'b_chi1', 'm6 phải được auto-deduce về b_chi1');

    // Member m7 (con cụ m5 thuộc Chi 2, Ngành 2)
    const deducedBranch2 = deduceUserBranchFocus('m7', mockMembers, mockBranches, mockSpouseRelations);
    assert.strictEqual(deducedBranch2, 'b_chi2', 'm7 phải được auto-deduce về b_chi2');

    // Member Cụ Thủy Tổ (chưa vào nhánh nào)
    const deducedBranchRoot = deduceUserBranchFocus('m1', mockMembers, mockBranches, mockSpouseRelations);
    assert.strictEqual(deducedBranchRoot, null, 'Cụ Thủy Tổ không thuộc nhánh con nào nên trả về null');
  });

  it('TC_UT_CLAIM_PROPOSE_CHILD_VALIDATION: Kiểm tra tính hợp lệ của phiếu đề xuất con mới', () => {
    // 1. Dữ liệu hợp lệ
    const validData = {
      full_name: 'Phạm Minh Khang',
      gender: 'male' as const,
      birth_year: 2005,
      birth_order: 2,
    };
    const res1 = validateProposedChildData(validData);
    assert.strictEqual(res1.isValid, true);
    assert.strictEqual(res1.errors.length, 0);

    // 2. Tên rỗng hoặc quá ngắn
    const invalidName = { full_name: '  ', gender: 'female' as const };
    const res2 = validateProposedChildData(invalidName);
    assert.strictEqual(res2.isValid, false);
    assert.ok(res2.errors.some((e) => e.includes('Họ và tên')));

    // 3. Giới tính không hợp lệ
    const invalidGender = { full_name: 'Phạm Lan', gender: 'unknown' as any };
    const res3 = validateProposedChildData(invalidGender);
    assert.strictEqual(res3.isValid, false);
    assert.ok(res3.errors.some((e) => e.includes('Giới tính')));

    // 4. Năm sinh phi lý
    const invalidYear = { full_name: 'Phạm Tuấn', gender: 'male' as const, birth_year: 1500 };
    const res4 = validateProposedChildData(invalidYear);
    assert.strictEqual(res4.isValid, false);
    assert.ok(res4.errors.some((e) => e.includes('Năm sinh')));

    // 5. Thứ tự sinh âm hoặc 0
    const invalidOrder = { full_name: 'Phạm Tuấn', gender: 'male' as const, birth_order: 0 };
    const res5 = validateProposedChildData(invalidOrder);
    assert.strictEqual(res5.isValid, false);
    assert.ok(res5.errors.some((e) => e.includes('Thứ tự sinh')));
  });

  it('TC_UT_SEARCH_MEMBER_CONTEXT_CARD: Thẻ tra cứu hiển thị đầy đủ thông tin Cha Mẹ và Chi Nhánh', () => {
    // Có 2 người cùng tên "Phạm Văn Tuấn":
    // m6: con Bố Bình (Chi 1, Ngành 1)
    // m7: con Bố Hùng (Chi 2, Ngành 2)
    const cardM6 = formatMemberContextCard(mockMembersMap.get('m6')!, mockMembersMap, mockBranches, mockSpouseRelations);
    const cardM7 = formatMemberContextCard(mockMembersMap.get('m7')!, mockMembersMap, mockBranches, mockSpouseRelations);

    // Kiểm tra tên hiển thị
    assert.strictEqual(cardM6.fullName, 'Phạm Văn Tuấn');
    assert.strictEqual(cardM7.fullName, 'Phạm Văn Tuấn');

    // Kiểm tra thông tin cha mẹ phân biệt rạch ròi
    assert.ok(cardM6.parentInfo.includes('Phạm Văn Bình'), 'Card M6 phải nêu rõ con cụ Phạm Văn Bình');
    assert.ok(cardM7.parentInfo.includes('Phạm Văn Hùng'), 'Card M7 phải nêu rõ con cụ Phạm Văn Hùng');

    // Kiểm tra thông tin Chi/Ngành
    assert.ok(cardM6.branchInfo.includes('Chi 1'), 'Card M6 phải chứa Chi 1');
    assert.ok(cardM7.branchInfo.includes('Chi 2'), 'Card M7 phải chứa Chi 2');

    // Chuỗi tổng hợp displaySummary không được trùng nhau
    assert.notStrictEqual(cardM6.displaySummary, cardM7.displaySummary);
  });

  it('TC_UT_CLAIM_CAN_MANAGE_PARENT: Bố mẹ có quyền quản lý và thêm con trực hệ của mình', () => {
    // User là Bố Bình (m4), role claimed_member, linked_member_id = 'm4'
    const parentUser = {
      id: 'u_binh',
      user_role: 'claimed_member',
      linked_member_id: 'm4',
    };

    // A. Quản lý chính mình (m4) -> TRUE
    assert.strictEqual(
      canUserManageMember(parentUser, 'm4', mockMembers, mockSpouseRelations, mockBranches),
      true
    );

    // B. Quản lý vợ mình (m4_spouse) -> TRUE
    assert.strictEqual(
      canUserManageMember(parentUser, 'm4_spouse', mockMembers, mockSpouseRelations, mockBranches),
      true
    );

    // C. Quản lý con đẻ của mình (m6 - Tuấn Chi 1) -> TRUE
    assert.strictEqual(
      canUserManageMember(parentUser, 'm6', mockMembers, mockSpouseRelations, mockBranches),
      true
    );

    // D. Cố tình quản lý con của chú Hùng (m7) -> FALSE
    assert.strictEqual(
      canUserManageMember(parentUser, 'm7', mockMembers, mockSpouseRelations, mockBranches),
      false
    );

    // E. Cố tình quản lý bậc bề trên (m2 - cụ Ngành 1) -> FALSE
    assert.strictEqual(
      canUserManageMember(parentUser, 'm2', mockMembers, mockSpouseRelations, mockBranches),
      false
    );
  });

  it('TC_UT_CLAIM_CAN_MANAGE_BRANCH: Trưởng Chi quản lý toàn bộ con cháu trong chi bất kể đời', () => {
    // User là Trưởng Chi 2 (phụ trách 'b_chi2')
    const branchEditorUser = {
      id: 'u_editor_chi2',
      user_role: 'branch_editor',
      assigned_branch_code: 'b_chi2',
    };

    // A. Quản lý con cháu trong Chi 2 (m5: Đời 3, m7: Đời 4) -> TRUE
    assert.strictEqual(
      canUserManageMember(branchEditorUser, 'm5', mockMembers, mockSpouseRelations, mockBranches),
      true
    );
    assert.strictEqual(
      canUserManageMember(branchEditorUser, 'm7', mockMembers, mockSpouseRelations, mockBranches),
      true
    );

    // B. Cố tình quản lý thành viên Chi 1 (m4, m6) -> FALSE
    assert.strictEqual(
      canUserManageMember(branchEditorUser, 'm4', mockMembers, mockSpouseRelations, mockBranches),
      false
    );
    assert.strictEqual(
      canUserManageMember(branchEditorUser, 'm6', mockMembers, mockSpouseRelations, mockBranches),
      false
    );
  });

  it('TC_UT_CLAIM_PREVENT_ORPHAN_IN_DB: Phiếu Tìm Cội Nguồn không tạo node trôi nổi vào members', () => {
    // Đọc mã nguồn API POST /api/claims
    const apiCode = fs.readFileSync(
      path.resolve(__dirname, '../src/app/api/claims/route.ts'),
      'utf-8'
    );

    // Kiểm tra cấu trúc insert: Khi request_type === 'find_origin' hoặc 'propose_child', member_id = null
    assert.ok(
      apiCode.includes("request_type === 'claim_existing' ? member_id : null"),
      'API claims phải gán member_id = null khi không phải claim_existing'
    );
    assert.ok(
      /from\(['"]claim_requests['"]\)\s*\.insert/.test(apiCode),
      'API claims chỉ insert vào claim_requests, không insert vào bảng members'
    );
    assert.ok(
      !/from\(['"]members['"]\)\s*\.insert/.test(apiCode),
      'API POST /api/claims tuyệt đối không được tự ý insert vào bảng members'
    );
  });

  it('TC_UT_HOME_IDENTITY_WIDGET_INTEGRATION: Khung nhận diện Home tích hợp đầy đủ tính năng Phase 1', () => {
    const homePageCode = fs.readFileSync(
      path.resolve(__dirname, '../src/app/page.tsx'),
      'utf-8'
    );
    assert.ok(
      homePageCode.includes('IdentityContextWidget'),
      'src/app/page.tsx phải nhúng component IdentityContextWidget'
    );

    const widgetCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/home/IdentityContextWidget.tsx'),
      'utf-8'
    );
    assert.ok(
      widgetCode.includes('open-connect-genealogy-modal-btn'),
      'IdentityContextWidget phải có nút mở modal kết nối Gia Phả'
    );
    assert.ok(
      widgetCode.includes('ConnectGenealogyModal'),
      'IdentityContextWidget phải tích hợp ConnectGenealogyModal'
    );
    assert.ok(
      widgetCode.includes('USER_PREFERENCES_EVENT'),
      'IdentityContextWidget phải đồng bộ với USER_PREFERENCES_EVENT'
    );
  });

  it('TC_UT_CLAIM_PREVENT_CLAIM_ALREADY_LINKED: Chặn nhận hồ sơ đã có tài khoản khác liên kết', () => {
    // 1. Kiểm tra mã nguồn API POST /api/claims có rào chắn chặn nhận node đã linked
    const apiCode = fs.readFileSync(
      path.resolve(__dirname, '../src/app/api/claims/route.ts'),
      'utf-8'
    );
    assert.ok(
      apiCode.includes('.eq(\'linked_member_id\', member_id)'),
      'API claims phải truy vấn kiểm tra linked_member_id trong bảng users'
    );
    assert.ok(
      apiCode.includes('Hồ sơ thành viên này đã được liên kết'),
      'API claims phải ném lỗi khi node đã có tài khoản liên kết'
    );

    // 2. Kiểm tra bộ lọc filterUnclaimedCandidateMembers loại bỏ thành viên đã có chủ
    const unclaimed = filterUnclaimedCandidateMembers(
      mockMembers,
      ['m6'], // m6 đã được liên kết
      'Tuấn',
      mockMembersMap
    );
    assert.strictEqual(unclaimed.length, 1, 'Chỉ được trả về 1 thành viên chưa liên kết');
    assert.strictEqual(unclaimed[0].id, 'm7', 'Thành viên chưa liên kết phải là m7');
  });

  it('TC_UT_CLAIM_SEARCH_FILTER_OUT_CLAIMED: Lọc bỏ 100% hồ sơ đã liên kết khỏi kết quả tra cứu Tab 1 (Bảo Mật & Riêng Tư)', () => {
    // Giả sử có 2 thành viên trùng tên: m6 (Phạm Văn Tuấn Chi 1) và m7 (Phạm Văn Tuấn Chi 2)
    // Khi m6 đã được tài khoản khác liên kết:
    const res1 = filterUnclaimedCandidateMembers(mockMembers, ['m6'], 'Tuấn', mockMembersMap);
    assert.strictEqual(res1.length, 1, 'Hồ sơ m6 đã liên kết phải bị loại bỏ 100%');
    assert.strictEqual(res1[0].id, 'm7');
    assert.ok(!res1.some((m) => m.id === 'm6'), 'Tuyệt đối không được chứa m6 trong kết quả');

    // Khi cả 2 đều đã liên kết:
    const res2 = filterUnclaimedCandidateMembers(mockMembers, ['m6', 'm7'], 'Tuấn', mockMembersMap);
    assert.strictEqual(res2.length, 0, 'Khi toàn bộ người trùng tên đã có chủ, trả về mảng rỗng');
  });

  it('TC_UT_CLAIM_FIND_ORIGIN_REQUIRE_RAW_PARENT: Ràng buộc bắt buộc Tên Bố/Mẹ ngoài đời khi gửi Phiếu Yêu Cầu', () => {
    // 1. Trường hợp thiếu raw_parent_info -> Không hợp lệ
    const invalidOrigin = {
      full_name: 'Phạm Văn Mới',
      gender: 'male' as const,
      raw_parent_info: '',
    };
    const resInvalid = validateFindOriginData(invalidOrigin);
    assert.strictEqual(resInvalid.isValid, false, 'Phiếu thiếu Tên Bố/Mẹ ngoài đời phải bị từ chối');
    assert.ok(
      resInvalid.errors.some((e) => e.includes('Tên Bố / Mẹ ngoài đời')),
      'Lỗi phải nhắc nhở nhập Tên Bố/Mẹ ngoài đời'
    );

    // 2. Trường hợp đầy đủ raw_parent_info -> Hợp lệ
    const validOrigin = {
      full_name: 'Phạm Văn Mới',
      gender: 'male' as const,
      raw_parent_info: 'Bố tôi là Phạm Văn Minh, sinh năm 1968',
    };
    const resValid = validateFindOriginData(validOrigin);
    assert.strictEqual(resValid.isValid, true, 'Phiếu có Tên Bố/Mẹ ngoài đời phải hợp lệ');

    // 3. Kiểm tra API POST /api/claims có tích hợp validateFindOriginData
    const apiCode = fs.readFileSync(
      path.resolve(__dirname, '../src/app/api/claims/route.ts'),
      'utf-8'
    );
    assert.ok(
      apiCode.includes('validateFindOriginData'),
      'API /api/claims phải gọi validateFindOriginData cho request_type find_origin'
    );
  });

  it('TC_UT_CLAIM_SMART_BIRTH_ORDER_SUGGESTION: Gợi ý thứ tự con thông minh theo năm sinh và lấp lỗ hổng', () => {
    const existingFamily = [
      { id: 'c1', full_name: 'Phạm Tiến Giáp', birth_order: 1, birth_year: 1990 },
      { id: 'c2', full_name: 'Phạm Tiến Dũng', birth_order: 2, birth_year: 1995 },
    ];

    // Case A: Người dùng sinh năm 1992 (giữa 1990 và 1995) -> Gợi ý #2 (chèn giữa)
    const sugMiddle = calculateSuggestedBirthOrder(1992, existingFamily);
    assert.strictEqual(sugMiddle.suggestedOrder, 2, 'Sinh 1992 phải gợi ý con thứ 2');
    assert.ok(sugMiddle.explanation.includes('Phạm Tiến Giáp') && sugMiddle.explanation.includes('Phạm Tiến Dũng'));

    // Case B: Người dùng sinh năm 1988 (trước 1990) -> Gợi ý #1 (con đầu lòng)
    const sugFirst = calculateSuggestedBirthOrder(1988, existingFamily);
    assert.strictEqual(sugFirst.suggestedOrder, 1, 'Sinh 1988 phải gợi ý con đầu lòng');
    assert.ok(sugFirst.explanation.includes('Con đầu lòng'));

    // Case C: Người dùng sinh năm 1998 (sau 1995) -> Gợi ý #3 (kế tiếp)
    const sugLast = calculateSuggestedBirthOrder(1998, existingFamily);
    assert.strictEqual(sugLast.suggestedOrder, 3, 'Sinh 1998 phải gợi ý con thứ 3');
    assert.ok(sugLast.explanation.includes('kế tiếp'));

    // Case D: Có lỗ hổng gap (đã có con #1 và con #3, chưa có con #2, không có năm sinh)
    const gapFamily = [
      { id: 'c1', full_name: 'Con Một', birth_order: 1, birth_year: null },
      { id: 'c3', full_name: 'Con Ba', birth_order: 3, birth_year: null },
    ];
    const sugGap = calculateSuggestedBirthOrder(null, gapFamily);
    assert.strictEqual(sugGap.suggestedOrder, 2, 'Phải tự động lấp lỗ hổng thứ #2 còn thiếu');
  });

  it('TC_UT_CLAIM_SENIOR_DESIRE_PAYLOAD: Ghi nhận nguyện vọng Con Trưởng (Trưởng Nam) trong payload', () => {
    // 1. Kiểm tra payload hỗ trợ is_senior
    const seniorChildData = {
      full_name: 'Phạm Tiến Trưởng',
      gender: 'male' as const,
      birth_order: 1,
      birth_year: 1990,
      is_senior: true,
      parent_id: 'm4',
    };
    const res = validateProposedChildData(seniorChildData);
    assert.strictEqual(res.isValid, true, 'Payload có is_senior: true phải hợp lệ');

    // 2. Kiểm tra Modal ConnectGenealogyModal có trường is_senior
    const modalCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/modals/ConnectGenealogyModal.tsx'),
      'utf-8'
    );
    assert.ok(
      modalCode.includes('is_senior: gender === \'male\' && isSenior ? true : false'),
      'Modal phải chuyển nguyện vọng is_senior vào proposed_data khi chọn Nam'
    );
  });

  it('TC_UT_CLAIM_MULTI_SPOUSE_DETECTION: Tự động nhận diện bạn đời của Cha/Mẹ, hỗ trợ đa thê và con riêng', () => {
    // Trường hợp 1: Bố Bình (m4) chỉ có 1 vợ là Trần Thị Mai (m4_spouse)
    const spousesM4 = getCandidateSpouses('m4', mockMembersMap, mockSpouseRelations);
    assert.strictEqual(spousesM4.length, 1);
    assert.strictEqual(spousesM4[0].fullName, 'Trần Thị Mai');
    assert.strictEqual(spousesM4[0].spouseTitle, 'Mẹ');

    // Kiểm tra tên hiển thị khi tìm kiếm kèm tên vợ
    const displayNameM4 = getParentDisplayNameWithSpouse(mockMembersMap.get('m4')!, mockMembersMap, mockSpouseRelations, mockBranches);
    assert.ok(displayNameM4.includes('Trần Thị Mai'), 'Tên hiển thị phải chứa tên vợ');
    assert.ok(displayNameM4.includes('Phạm Văn Bình'), 'Tên hiển thị phải chứa tên bố');

    // Trường hợp 2: Giả lập một người cha đa thê có 2 vợ
    const polySpouseRelations: SpouseRelationRecord[] = [
      { id: 'rel_1', member_a_id: 'm_dad', member_b_id: 'm_wife1', marriage_order: 1 },
      { id: 'rel_2', member_a_id: 'm_dad', member_b_id: 'm_wife2', marriage_order: 2 },
    ];
    const polyMap = new Map<string, MemberRecord>([
      ['m_dad', { id: 'm_dad', full_name: 'Cụ Đa Thê', gender: 'male', life_status: 'living', generation_level: 2, is_root: false }],
      ['m_wife1', { id: 'm_wife1', full_name: 'Bà Cả Chu Thị A', gender: 'female', life_status: 'living', generation_level: 2, is_root: false }],
      ['m_wife2', { id: 'm_wife2', full_name: 'Bà Hai Nguyễn Thị B', gender: 'female', life_status: 'living', generation_level: 2, is_root: false }],
    ]);

    const polySpouses = getCandidateSpouses('m_dad', polyMap, polySpouseRelations);
    assert.strictEqual(polySpouses.length, 2);
    assert.strictEqual(polySpouses[0].spouseTitle, 'Mẹ (Bà cả)');
    assert.strictEqual(polySpouses[0].fullName, 'Bà Cả Chu Thị A');
    assert.strictEqual(polySpouses[1].spouseTitle, 'Mẹ (Bà hai)');
    assert.strictEqual(polySpouses[1].fullName, 'Bà Hai Nguyễn Thị B');
  });

  it('TC_UT_CLAIM_FLEXIBLE_BIRTH_ORDER: Bộ chọn thứ tự con linh hoạt, hỗ trợ gia đình đông con (> 6 con)', () => {
    // 1. Gia đình đông con (ví dụ: con thứ 9 hoặc 12)
    const largeOrderData = {
      full_name: 'Phạm Văn Út',
      gender: 'male' as const,
      birth_order: 9,
      birth_year: 2005,
      spouse_id: 'm_wife1',
    };
    const res = validateProposedChildData(largeOrderData);
    assert.strictEqual(res.isValid, true, 'Thứ tự sinh = 9 phải hợp lệ');

    // 2. Con riêng (không chọn người còn lại, is_stepchild = true)
    const stepchildData = {
      full_name: 'Phạm Văn Riêng',
      gender: 'male' as const,
      birth_order: 1,
      is_stepchild: true,
      spouse_id: null,
    };
    const resStep = validateProposedChildData(stepchildData);
    assert.strictEqual(resStep.isValid, true, 'Dữ liệu con riêng phải hợp lệ');
  });
});
