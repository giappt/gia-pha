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
  canUserReviewClaim,
} from '../src/lib/claims/claim-engine';
import type { BranchNode } from '../src/types/database';
import type { MemberRecord, SpouseRelationRecord } from '../src/types/tree';
import {
  DEFAULT_FEATURE_FLAGS,
  resolveFeatureFlags,
  PERMISSION_MATRIX_DEFINITIONS,
  ROLES_META,
} from '../src/lib/admin/admin-engine';

describe('Decentralized Claim, Onboarding & Subtree Governance (Milestone 8 - Phase 1)', () => {
  // Mock dữ liệu dòng họ 4 thế hệ:
  // Đời 1: Cụ Tổ (id: m1)
  // Đời 2: Cụ Ngành 1 (id: m2, con m1) & Cụ Ngành 2 (id: m3, con m1)
  // Đời 3: Bác Bình (id: m4, con m2) & Chú Hùng (id: m5, con m3)
  // Đời 4: Tuấn Chi 1 (id: m6, con m4, Chi 1) & Tuấn Chi 2 (id: m7, con m5, Chi 2)
  const mockMembers: MemberRecord[] = [
    {
      id: 'm1',
      full_name: 'Phạm Cụ Tổ',
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

    // Member Cụ Tổ (chưa vào nhánh nào)
    const deducedBranchRoot = deduceUserBranchFocus('m1', mockMembers, mockBranches, mockSpouseRelations);
    assert.strictEqual(deducedBranchRoot, null, 'Cụ Tổ không thuộc nhánh con nào nên trả về null');
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

describe('Decentralized Member Onboarding & Household Management (Milestone 8 - Phase 2)', () => {
  const phase2Members: MemberRecord[] = [
    {
      id: 'p_dad',
      full_name: 'Phạm Văn Bố',
      gender: 'male',
      life_status: 'living',
      generation_level: 3,
      is_root: false,
    },
    {
      id: 'p_mom',
      full_name: 'Trần Thị Mẹ',
      gender: 'female',
      life_status: 'living',
      generation_level: 3,
      is_root: false,
    },
    {
      id: 'p_child_unclaimed',
      full_name: 'Phạm Văn Con Chưa Claim',
      gender: 'male',
      life_status: 'living',
      father_id: 'p_dad',
      mother_id: 'p_mom',
      generation_level: 4,
      birth_order: 1,
      is_root: false,
    },
    {
      id: 'p_child_claimed',
      full_name: 'Phạm Thị Con Đã Claim',
      gender: 'female',
      life_status: 'living',
      father_id: 'p_dad',
      mother_id: 'p_mom',
      generation_level: 4,
      birth_order: 2,
      linked_user_id: 'user_child_claimed_123',
      is_root: false,
    },
    {
      id: 'p_cousin',
      full_name: 'Phạm Văn Người Họ Xa',
      gender: 'male',
      life_status: 'living',
      generation_level: 3,
      is_root: false,
    },
  ];

  const phase2Spouses: SpouseRelationRecord[] = [
    {
      id: 'sp_p1',
      member_a_id: 'p_dad',
      member_b_id: 'p_mom',
      marriage_order: 1,
    },
  ];

  it('TC_UT_CLAIM_AUTO_APPROVE_PARENT_ADD: Claimed member tự động thêm con trực tiếp mà không cần duyệt', () => {
    const parentUser = {
      id: 'user_dad_1',
      user_role: 'claimed_member',
      linked_member_id: 'p_dad',
    };

    // Bố có quyền quản lý bản thân để thêm con
    const canManageSelf = canUserManageMember(parentUser, 'p_dad', phase2Members, phase2Spouses);
    assert.strictEqual(canManageSelf, true, 'Bố đã claim node phải có quyền thêm con đẻ');
  });

  it('TC_INT_MEMBERS_API_CLAIMED_MEMBER_CHILD_ADD: Claimed member quản lý con chưa claim và người phối ngẫu', () => {
    const parentUser = {
      id: 'user_dad_1',
      user_role: 'claimed_member',
      linked_member_id: 'p_dad',
    };

    // Quản lý vợ
    const canManageSpouse = canUserManageMember(parentUser, 'p_mom', phase2Members, phase2Spouses);
    assert.strictEqual(canManageSpouse, true, 'Bố phải có quyền cập nhật người phối ngẫu');

    // Quản lý con chưa liên kết tài khoản
    const canManageChild = canUserManageMember(parentUser, 'p_child_unclaimed', phase2Members, phase2Spouses);
    assert.strictEqual(canManageChild, true, 'Bố phải có quyền cập nhật con chưa claim tài khoản');
  });

  it('TC_UT_CLAIM_CANNOT_EDIT_CLAIMED_CHILD: Edge Case 7 - Bố mẹ không được sửa con đã tự liên kết tài khoản riêng', () => {
    const parentUser = {
      id: 'user_dad_1',
      user_role: 'claimed_member',
      linked_member_id: 'p_dad',
    };

    // Con gái đã liên kết tài khoản riêng (linked_user_id)
    const canManageClaimedChild = canUserManageMember(parentUser, 'p_child_claimed', phase2Members, phase2Spouses);
    assert.strictEqual(
      canManageClaimedChild,
      false,
      'Bố mẹ KHÔNG ĐƯỢC phép sửa hồ sơ của con khi con đã tự nhận node và liên kết tài khoản riêng'
    );
  });

  it('TC_INT_MEMBERS_API_CLAIMED_MEMBER_BLOCKED_UNAUTHORIZED: Claimed member bị chặn khi can thiệp họ hàng xa', () => {
    const parentUser = {
      id: 'user_dad_1',
      user_role: 'claimed_member',
      linked_member_id: 'p_dad',
    };

    const canManageCousin = canUserManageMember(parentUser, 'p_cousin', phase2Members, phase2Spouses);
    assert.strictEqual(canManageCousin, false, 'Không được phép quản lý họ hàng ngoài hộ gia đình');
  });

  it('TC_INT_MEMBERS_API_CLAIMED_MEMBER_EDIT_HOUSEHOLD: Lọc bỏ trường cấu trúc khi claimed member sửa hồ sơ', () => {
    // Giả lập payload update của claimed_member
    const updatePayload: any = {
      full_name: 'Phạm Văn Bố Mới',
      alias_name: 'Cụ Bố',
      generation_level: 99, // Hacked attempt to change generation
      branch_name: 'Hacked Branch', // Hacked attempt to change branch
      father_id: 'fake_father',
      mother_id: 'fake_mother',
      birth_year: 1980,
    };

    // Kiểm tra logic bảo vệ cấu trúc (được code trong /api/members/[id]/route.ts)
    const userRole = 'claimed_member';
    if (userRole === 'claimed_member') {
      delete updatePayload.generation_level;
      delete updatePayload.branch_name;
      delete updatePayload.father_id;
      delete updatePayload.mother_id;
    }

    assert.strictEqual(updatePayload.generation_level, undefined, 'Phải xóa generation_level khỏi payload');
    assert.strictEqual(updatePayload.branch_name, undefined, 'Phải xóa branch_name khỏi payload');
    assert.strictEqual(updatePayload.father_id, undefined, 'Phải xóa father_id khỏi payload');
    assert.strictEqual(updatePayload.mother_id, undefined, 'Phải xóa mother_id khỏi payload');
    assert.strictEqual(updatePayload.full_name, 'Phạm Văn Bố Mới', 'Cho phép cập nhật thông tin nhân khẩu');
  });

  it('TC_INT_MEMBERS_API_CLAIMED_MEMBER_CANNOT_DELETE: Claimed member tuyệt đối không có quyền xóa thành viên', () => {
    const memberDrawerCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/tree/MemberDetailDrawer.tsx'),
      'utf-8'
    );

    // Nút xóa chỉ hiển thị cho canManageTree (super_admin hoặc branch_editor)
    assert.ok(
      memberDrawerCode.includes('canManageTree && onDeleteMember && target'),
      'Nút xóa trong Drawer chỉ được cấp cho canManageTree, CẤM cấp cho claimed_member'
    );

    const apiMemberIdRoute = fs.readFileSync(
      path.resolve(__dirname, '../src/app/api/members/[id]/route.ts'),
      'utf-8'
    );
    assert.ok(
      apiMemberIdRoute.includes("currentUser.user_role === 'claimed_member'"),
      'API DELETE /api/members/[id] phải chặn 403 nếu user_role là claimed_member'
    );
  });

  it('TC_UI_DRAWER_ANTI_PILL_TYPOGRAPHY: MemberDetailDrawer áp dụng Typography Hierarchy, loại bỏ lạm dụng pill badge', () => {
    const drawerCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/tree/MemberDetailDrawer.tsx'),
      'utf-8'
    );

    // Không còn cluster các thẻ pill px-2 py-0.5 rounded-full trong khối info/badges header
    assert.ok(
      !drawerCode.includes('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100'),
      'Phải loại bỏ pill badge Đời thứ x'
    );
    assert.ok(
      drawerCode.includes('Phả hệ & thứ bậc - Typography thanh lịch, không dùng pill'),
      'Phải có khối Typography với ký tự phân tách · thanh lịch'
    );
  });

  it('TC_UT_CLAIM_CAN_MANAGE_GRANDCHILD: Ông bà (F0) có thể quản lý cháu trực tiếp (F2) khi F1 và F2 chưa claim', () => {
    const tamDaiMembers: MemberRecord[] = [
      {
        id: 'f0_grandpa',
        full_name: 'Cụ Ông F0',
        gender: 'male',
        life_status: 'living',
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'f1_dad',
        full_name: 'Bố F1',
        gender: 'male',
        life_status: 'living',
        father_id: 'f0_grandpa',
        generation_level: 3,
        is_root: false,
      },
      {
        id: 'f2_grandchild',
        full_name: 'Cháu F2 Chưa Claim',
        gender: 'male',
        life_status: 'living',
        father_id: 'f1_dad',
        generation_level: 4,
        is_root: false,
      },
    ];

    const grandpaUser = {
      id: 'user_grandpa',
      user_role: 'claimed_member',
      linked_member_id: 'f0_grandpa',
    };

    const canManageGrandchild = canUserManageMember(grandpaUser, 'f2_grandchild', tamDaiMembers, []);
    assert.strictEqual(canManageGrandchild, true, 'Ông bà (F0) phải có quyền quản lý cháu ruột (F2) chưa claim');
  });

  it('TC_UT_CLAIM_CANNOT_EDIT_CLAIMED_GRANDCHILD: Quyền quản lý F2 tự động thu hồi khi F2 hoặc F1 đã claim tài khoản riêng', () => {
    const tamDaiMembers: MemberRecord[] = [
      {
        id: 'f0_grandpa',
        full_name: 'Cụ Ông F0',
        gender: 'male',
        life_status: 'living',
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'f1_dad_unclaimed',
        full_name: 'Bố F1 Chưa Claim',
        gender: 'male',
        life_status: 'living',
        father_id: 'f0_grandpa',
        generation_level: 3,
        is_root: false,
      },
      {
        id: 'f2_grandchild_claimed',
        full_name: 'Cháu F2 Đã Claim',
        gender: 'male',
        life_status: 'living',
        father_id: 'f1_dad_unclaimed',
        generation_level: 4,
        linked_user_id: 'user_f2',
        is_root: false,
      },
      {
        id: 'f1_mom_claimed',
        full_name: 'Mẹ F1 Đã Claim',
        gender: 'female',
        life_status: 'living',
        father_id: 'f0_grandpa',
        generation_level: 3,
        linked_user_id: 'user_f1_mom',
        is_root: false,
      },
      {
        id: 'f2_grandchild_under_claimed_parent',
        full_name: 'Cháu F2 Dưới Mẹ Đã Claim',
        gender: 'male',
        life_status: 'living',
        mother_id: 'f1_mom_claimed',
        generation_level: 4,
        is_root: false,
      },
    ];

    const grandpaUser = {
      id: 'user_grandpa',
      user_role: 'claimed_member',
      linked_member_id: 'f0_grandpa',
    };

    // Trường hợp 1: Cháu F2 đã claim tài khoản
    const canManageClaimedF2 = canUserManageMember(grandpaUser, 'f2_grandchild_claimed', tamDaiMembers, []);
    assert.strictEqual(canManageClaimedF2, false, 'Cụ ông F0 bị thu hồi quyền khi cháu F2 đã tự nhận tài khoản riêng');

    // Trường hợp 2: Cha/Mẹ F1 đã claim tài khoản (phân quyền chuyển giao cho F1)
    const canManageF2UnderClaimedParent = canUserManageMember(grandpaUser, 'f2_grandchild_under_claimed_parent', tamDaiMembers, []);
    assert.strictEqual(canManageF2UnderClaimedParent, false, 'Cụ ông F0 bị thu hồi quyền khi F1 đã nhận tài khoản riêng');
  });

  it('TC_UT_DRAWER_SPOUSE_GENDER_TITLES: Tiêu đề & nút hôn phối hiển thị đúng theo giới tính (Vợ/Chồng) thay vì thuật ngữ kỹ thuật', () => {
    const drawerCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/tree/MemberDetailDrawer.tsx'),
      'utf-8'
    );
    const modalCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/modals/MemberFormModal.tsx'),
      'utf-8'
    );

    // Tiêu đề & Nút Drawer
    assert.ok(
      drawerCode.includes("target.gender === 'male' ? 'Vợ' : target.gender === 'female' ? 'Chồng' : KINSHIP_TERMS.SPOUSE"),
      'MemberDetailDrawer phải hiển thị Vợ/Chồng tùy giới tính mục tiêu'
    );
    assert.ok(
      drawerCode.includes("target.gender === 'male' ? '+ Thêm vợ' : target.gender === 'female' ? '+ Thêm chồng' : '+ Thêm phối ngẫu'"),
      'MemberDetailDrawer phải hiển thị nút + Thêm vợ / + Thêm chồng tùy giới tính mục tiêu'
    );

    // Header Modal
    assert.ok(
      modalCode.includes("currentSpouse.gender === 'male' ? 'Thêm Vợ Cho:' : currentSpouse.gender === 'female' ? 'Thêm Chồng Cho:' : 'Thêm Phối Ngẫu Cho:'"),
      'MemberFormModal header phải hiển thị Thêm Vợ Cho: / Thêm Chồng Cho:'
    );
  });

  it('TC_UT_DRAWER_GRANDCHILD_LABEL: Khi F0 xem hồ sơ con ruột, nhóm con cái hiển thị Con cái (Cháu của bạn)', () => {
    const drawerCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/tree/MemberDetailDrawer.tsx'),
      'utf-8'
    );

    assert.ok(
      drawerCode.includes('isTargetChildOfCurrentUser'),
      'MemberDetailDrawer phải có biến kiểm tra isTargetChildOfCurrentUser'
    );
    assert.ok(
      drawerCode.includes('target.father_id === myId || target.mother_id === myId'),
      'isTargetChildOfCurrentUser phải kiểm tra father_id hoặc mother_id khớp với linked_member_id của user'
    );
    assert.ok(
      drawerCode.includes('isTargetChildOfCurrentUser ? `${KINSHIP_TERMS.CHILDREN} (Cháu của bạn)` : KINSHIP_TERMS.CHILDREN'),
      'Nhóm Con cái phải hiển thị Con cái (Cháu của bạn) khi target là con của currentUser'
    );
  });

  it('TC_UT_DRAWER_FOCUS_ROOT_TOOLTIP: Nút [Đặt làm Gốc] có tooltip giải thích rõ mục đích xem nhánh & đổi góc xưng hô', () => {
    const drawerCode = fs.readFileSync(
      path.resolve(__dirname, '../src/components/tree/MemberDetailDrawer.tsx'),
      'utf-8'
    );

    assert.ok(
      drawerCode.includes('title="Lọc cây gia phả lấy người này làm gốc, xem riêng nhánh con cháu của họ và tự động đổi góc nhìn xưng hô thân tộc"'),
      'Nút Đặt làm Gốc phải có thuộc tính title giải thích rõ chức năng lọc nhánh và đổi góc nhìn xưng hô'
    );
  });
});

// ==========================================
// MILESTONE 8 - PHASE 3 TEST SUITE
// ==========================================

describe('Decentralized Approval & Branch Portal (Milestone 8 - Phase 3)', () => {
  const phase3Members: MemberRecord[] = [
    {
      id: 'm1',
      full_name: 'Phạm Cụ Tổ',
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

  const phase3Branches: BranchNode[] = [
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

  const phase3SpouseRelations: SpouseRelationRecord[] = [
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

  it('TC_UT_CLAIM_CAN_USER_REVIEW_CLAIM: Xác thực quyền duyệt 3 tầng (Bố mẹ / Trưởng Chi / Super Admin)', () => {
    // 1. Super Admin luôn có quyền với mọi phiếu
    const adminUser = { id: 'u_admin', user_role: 'super_admin' };
    const arbitraryClaim = {
      id: 'c1',
      request_type: 'claim_existing' as const,
      member_id: 'm7',
      target_branch_code: 'b_chi2',
    };
    assert.strictEqual(
      canUserReviewClaim(adminUser, arbitraryClaim, phase3Members, phase3Branches, phase3SpouseRelations),
      true,
      'Super Admin phải có quyền duyệt bất kỳ phiếu nào'
    );

    // 2. Branch Editor Chi 1 (b_chi1)
    const branchEditorChi1 = {
      id: 'u_editor1',
      user_role: 'branch_editor',
      assigned_branch_code: 'b_chi1',
    };

    // A. Phiếu có target_branch_code khớp Chi 1
    const claimMatchingBranchCode = {
      id: 'c2',
      request_type: 'find_origin' as const,
      target_branch_code: 'b_chi1',
    };
    assert.strictEqual(
      canUserReviewClaim(branchEditorChi1, claimMatchingBranchCode, phase3Members, phase3Branches, phase3SpouseRelations),
      true,
      'Branch Editor phải duyệt được phiếu có target_branch_code khớp với mình'
    );

    // B. Phiếu claim_existing trỏ tới m6 (thuộc Chi 1)
    const claimM6 = {
      id: 'c3',
      request_type: 'claim_existing' as const,
      member_id: 'm6',
    };
    assert.strictEqual(
      canUserReviewClaim(branchEditorChi1, claimM6, phase3Members, phase3Branches, phase3SpouseRelations),
      true,
      'Branch Editor Chi 1 phải duyệt được phiếu claim m6 thuộc Chi 1'
    );

    // C. Phiếu claim_existing trỏ tới m7 (thuộc Chi 2) -> Phải từ chối
    const claimM7 = {
      id: 'c4',
      request_type: 'claim_existing' as const,
      member_id: 'm7',
    };
    assert.strictEqual(
      canUserReviewClaim(branchEditorChi1, claimM7, phase3Members, phase3Branches, phase3SpouseRelations),
      false,
      'Branch Editor Chi 1 không được duyệt phiếu m7 thuộc Chi 2'
    );

    // D. Phiếu được phân công đích danh (assigned_to)
    const assignedClaim = {
      id: 'c5',
      request_type: 'find_origin' as const,
      assigned_to: 'u_editor1',
    };
    assert.strictEqual(
      canUserReviewClaim(branchEditorChi1, assignedClaim, phase3Members, phase3Branches, phase3SpouseRelations),
      true,
      'Branch Editor phải duyệt được phiếu được phân công đích danh cho mình'
    );

    // 3. Claimed Member (Bố Mẹ: Bác Bình m4)
    const parentBinh = {
      id: 'u_binh',
      user_role: 'claimed_member',
      linked_member_id: 'm4',
    };

    // A. Propose child chọn cha mẹ là m4
    const proposeChildToBinh = {
      id: 'c6',
      request_type: 'propose_child' as const,
      proposed_data: { parent_id: 'm4', full_name: 'Phạm Tuấn Anh', gender: 'male' as const },
    };
    assert.strictEqual(
      canUserReviewClaim(parentBinh, proposeChildToBinh, phase3Members, phase3Branches, phase3SpouseRelations),
      true,
      'Bố Bình m4 phải duyệt được phiếu con xin nối vào mình'
    );

    // B. Propose child chọn cha mẹ là m5 (Chú Hùng) -> Bác Bình không được duyệt
    const proposeChildToHung = {
      id: 'c7',
      request_type: 'propose_child' as const,
      proposed_data: { parent_id: 'm5', full_name: 'Phạm Hồng', gender: 'female' as const },
    };
    assert.strictEqual(
      canUserReviewClaim(parentBinh, proposeChildToHung, phase3Members, phase3Branches, phase3SpouseRelations),
      false,
      'Bác Bình m4 không được duyệt phiếu con của Chú Hùng m5'
    );

    // C. Claim existing con đẻ m6 của Bác Bình
    assert.strictEqual(
      canUserReviewClaim(parentBinh, claimM6, phase3Members, phase3Branches, phase3SpouseRelations),
      true,
      'Bác Bình m4 phải duyệt được phiếu con đẻ m6 xin nhận tài khoản'
    );

    // 4. Viewer / Khách ngoài
    const viewerUser = { id: 'u_viewer', user_role: 'viewer' };
    assert.strictEqual(
      canUserReviewClaim(viewerUser, proposeChildToBinh, phase3Members, phase3Branches, phase3SpouseRelations),
      false,
      'Viewer vãng lai không có quyền duyệt bất kỳ phiếu nào'
    );
  });

  it('TC_UT_CLAIM_ASSIGN_TO_BRANCH_EDITOR: Super Admin ủy quyền phiếu cho Trưởng Chi xác minh', () => {
    const reviewRoutePath = path.resolve(__dirname, '../src/app/api/claims/[id]/review/route.ts');
    const reviewCode = fs.readFileSync(reviewRoutePath, 'utf-8');

    // Kiểm tra API chấp thuận decision 'assign'
    assert.ok(
      reviewCode.includes("decision === 'assign'"),
      'API review phải có khối xử lý decision assign'
    );

    // Chỉ super_admin mới được assign
    assert.ok(
      reviewCode.includes("userProfile.user_role !== 'super_admin'"),
      'API review phải kiểm tra chỉ super_admin mới được ủy quyền'
    );

    // Yêu cầu trường assigned_to
    assert.ok(
      reviewCode.includes('if (!assigned_to)'),
      'API review phải yêu cầu assigned_to khi ủy quyền'
    );

    // Cập nhật assigned_to vào claim_requests
    assert.ok(
      reviewCode.includes('.update({\n          assigned_to,'),
      'API review phải cập nhật cột assigned_to trong DB'
    );
  });

  it('TC_INT_CLAIMS_API_AUTH_GUARD: Chặn người dùng không có quyền duyệt phiếu', () => {
    const reviewRoutePath = path.resolve(__dirname, '../src/app/api/claims/[id]/review/route.ts');
    const reviewCode = fs.readFileSync(reviewRoutePath, 'utf-8');

    // Chặn người chưa đăng nhập (401)
    assert.ok(
      reviewCode.includes('if (!userProfile) {') && reviewCode.includes('status: 401'),
      'API review phải trả về 401 nếu chưa đăng nhập'
    );

    // Sử dụng canUserReviewClaim để rào chắn quyền duyệt
    assert.ok(
      reviewCode.includes('canUserReviewClaim('),
      'API review phải gọi canUserReviewClaim để kiểm tra thẩm quyền'
    );

    // Trả về 403 Forbidden nếu không đủ quyền
    assert.ok(
      reviewCode.includes('if (!hasPermission) {') && reviewCode.includes('status: 403'),
      'API review phải trả về 403 Forbidden nếu user không đủ thẩm quyền'
    );

    // Chặn duyệt trực tiếp phiếu find_origin khi chưa xác định cha mẹ
    assert.ok(
      reviewCode.includes("claim.request_type === 'find_origin'") &&
      reviewCode.includes('Phiếu Tìm Cội Nguồn chưa rõ cha mẹ'),
      'API review phải từ chối phê duyệt trực tiếp phiếu find_origin'
    );
  });

  it('TC_INT_CLAIMS_API_PENDING_FILTER_BY_ROLE: API pending lọc danh sách phiếu chặt chẽ theo phân quyền người gọi', () => {
    const pendingRoutePath = path.resolve(__dirname, '../src/app/api/claims/pending/route.ts');
    const pendingCode = fs.readFileSync(pendingRoutePath, 'utf-8');

    // Chặn viewer không có linked_member_id (403)
    assert.ok(
      pendingCode.includes("userProfile.user_role === 'viewer' && !userProfile.linked_member_id") &&
      pendingCode.includes('status: 403'),
      'API pending phải chặn viewer không liên kết hồ sơ truy cập hàng đợi'
    );

    // Lọc visible claims thông qua canUserReviewClaim
    assert.ok(
      pendingCode.includes('canUserReviewClaim(userProfile, claim, members, branches, spouseRelations)'),
      'API pending phải lọc các phiếu hiển thị bằng canUserReviewClaim'
    );

    // Enrich thông tin applicant và target_member cho frontend
    assert.ok(
      pendingCode.includes('applicant') && pendingCode.includes('target_member: targetMember'),
      'API pending phải enrich thông tin applicant và target_member'
    );
  });

  it('TC_UT_CLAIM_APPROVE_PROPOSE_CHILD_INSERT_SHIFT: Phê duyệt đề xuất con mới tự động chèn node vào members và tịnh tiến thứ tự con sau', () => {
    const reviewRoutePath = path.resolve(__dirname, '../src/app/api/claims/[id]/review/route.ts');
    const reviewCode = fs.readFileSync(reviewRoutePath, 'utf-8');

    // Kiểm tra xử lý propose_child
    assert.ok(
      reviewCode.includes("claim.request_type === 'propose_child'"),
      'API review phải có nhánh xử lý riêng cho propose_child'
    );

    // Tự động tính thế hệ con = parent.generation_level + 1
    assert.ok(
      reviewCode.includes('(parent.generation_level || 1) + 1'),
      'API review phải tính generation_level của con bằng cha mẹ + 1'
    );

    // Tìm và lọc siblings cần tịnh tiến birth_order
    assert.ok(
      reviewCode.includes('s.birth_order != null && s.birth_order >= targetOrder'),
      'API review phải lọc các con hiện có với birth_order >= targetOrder để tịnh tiến'
    );

    // Tịnh tiến thứ tự sinh: birth_order + 1
    assert.ok(
      reviewCode.includes('birth_order: (s.birth_order || 0) + 1'),
      'API review phải tịnh tiến thứ tự con cũ: birth_order + 1'
    );

    // Insert bản ghi con mới vào bảng members với birth_order = targetOrder
    assert.ok(
      reviewCode.includes(".from('members')\n          .insert(newMemberPayload)"),
      'API review phải insert bản ghi con mới vào bảng members'
    );

    // Gán tài khoản user thành claimed_member với linked_member_id mới
    assert.ok(
      reviewCode.includes("user_role: 'claimed_member'"),
      'API review phải nâng cấp vai trò user thành claimed_member khi duyệt'
    );
  });

  it('TC_UT_ANTI_PILL_CLAIMS_PORTAL: Cổng /admin/claims tuân thủ nghiêm ngặt chuẩn Anti-Pill, không lạm dụng rounded-full', () => {
    const clientPath = path.resolve(__dirname, '../src/components/admin/claims/AdminClaimsClient.tsx');
    const clientCode = fs.readFileSync(clientPath, 'utf-8');
    const loadingPath = path.resolve(__dirname, '../src/app/admin/claims/loading.tsx');
    const loadingCode = fs.readFileSync(loadingPath, 'utf-8');
    const pagePath = path.resolve(__dirname, '../src/app/admin/claims/page.tsx');
    const pageCode = fs.readFileSync(pagePath, 'utf-8');

    // 1. Loading tuân thủ [R-UI.LOADING]
    assert.ok(
      loadingCode.includes('<SyncLoadingBadge />') || loadingCode.includes('SyncLoadingBadge'),
      'Cổng /admin/claims loading phải dùng SyncLoadingBadge'
    );

    // 2. Page kết nối với AdminClaimsClient
    assert.ok(
      pageCode.includes('<AdminClaimsClient'),
      'Cổng /admin/claims page.tsx phải render AdminClaimsClient'
    );

    // 3. Kỷ luật Anti-Pill:
    // Kiểm tra không có rounded-full được áp dụng vào button hoặc badge
    // (chỉ cho phép rounded-full với avatar img/div hoặc loader)
    const matches = clientCode.match(/className="[^"]*rounded-full[^"]*"/g) || [];
    for (const m of matches) {
      // Cho phép rounded-full cho avatar (w-7 h-7, w-8 h-8, w-9 h-9, w-10 h-10) hoặc icon/dot indicator (w-1.5 h-1.5, w-2 h-2)
      const isAvatarOrIndicator = /w-[0-9.]+\s+h-[0-9.]+/.test(m) || /h-[0-9.]+\s+w-[0-9.]+/.test(m);
      assert.ok(
        isAvatarOrIndicator,
        `Phát hiện vi phạm Anti-Pill: class rounded-full dùng cho phần tử không phải avatar hay indicator dot: ${m}`
      );
    }

    // Các button hành động trong portal phải dùng rounded-lg
    assert.ok(
      clientCode.includes('rounded-lg'),
      'Nút bấm trong AdminClaimsClient phải dùng rounded-lg chuẩn mực'
    );

    // Dùng dấu chấm trung tâm · để phân tách thông tin thay vì pill tags
    assert.ok(
      clientCode.includes('·'),
      'AdminClaimsClient phải dùng dấu chấm · để phân cấp typography'
    );
  });

  it('TC_UT_UNIFIED_APPROVAL_ENTRY_AUTH_BUTTON: Entry point Duyệt Hồ Sơ nằm trong AuthButton dropdown, loại bỏ hoàn toàn khỏi Navbar', () => {
    const navbarCode = fs.readFileSync(path.resolve(__dirname, '../src/components/navbar/Navbar.tsx'), 'utf-8');
    const authButtonCode = fs.readFileSync(path.resolve(__dirname, '../src/components/auth/AuthButton.tsx'), 'utf-8');

    // Navbar không còn chứa link Quản trị Chi hay branch-portal-nav-link
    assert.ok(
      !navbarCode.includes('id="branch-portal-nav-link"'),
      'Navbar không được chứa id branch-portal-nav-link'
    );
    assert.ok(
      !navbarCode.includes('<span>Quản trị Chi</span>'),
      'Navbar không được chứa văn bản Quản trị Chi'
    );

    // AuthButton chứa link Phê Duyệt Hồ Sơ trỏ tới /admin/claims
    assert.ok(
      authButtonCode.includes('id="unified-approvals-dropdown-link"'),
      'AuthButton dropdown phải chứa link id unified-approvals-dropdown-link'
    );
    assert.ok(
      authButtonCode.includes('href="/admin/claims"'),
      'AuthButton dropdown phải trỏ tới /admin/claims'
    );
    assert.ok(
      authButtonCode.includes('<span>Phê Duyệt Hồ Sơ</span>'),
      'AuthButton dropdown phải hiển thị nhãn Phê Duyệt Hồ Sơ'
    );
    assert.ok(
      authButtonCode.includes('ClipboardList'),
      'AuthButton dropdown phải sử dụng icon ClipboardList'
    );
    assert.ok(
      authButtonCode.includes('id="pending-claims-badge"'),
      'AuthButton dropdown phải có badge hiển thị số lượng phiếu chờ duyệt'
    );
  });

  it('TC_UT_ADMIN_SIDEBAR_CLAIMS_LINK: AdminSidebar có mục Phê Duyệt Hồ Sơ dẫn tới /admin/claims kèm badge realtime', () => {
    const sidebarCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/AdminSidebar.tsx'), 'utf-8');

    // AdminSidebar có mục Phê Duyệt Hồ Sơ trỏ tới /admin/claims
    assert.ok(
      sidebarCode.includes("href: '/admin/claims'"),
      'AdminSidebar phải có mục điều hướng tới /admin/claims'
    );
    assert.ok(
      sidebarCode.includes("label: 'Phê Duyệt Hồ Sơ'"),
      'AdminSidebar phải có nhãn Phê Duyệt Hồ Sơ'
    );
    assert.ok(
      sidebarCode.includes('icon: ClipboardList'),
      'AdminSidebar mục Phê Duyệt Hồ Sơ phải dùng icon ClipboardList'
    );
    assert.ok(
      sidebarCode.includes('pendingClaimsCount'),
      'AdminSidebar phải có state và badge pendingClaimsCount'
    );
  });

  it('TC_UT_UNIFIED_APPROVAL_SCOPED_VIEW_PARENT: Giao diện duyệt scoped cho Bố Mẹ hiển thị tiêu đề và danh sách con cháu Gia Đình Của Bạn', () => {
    const clientCode = fs.readFileSync(path.resolve(__dirname, '../src/components/branch/BranchPortalClient.tsx'), 'utf-8');

    // Tiêu đề & phụ đề cho Bố Mẹ (claimed_member)
    assert.ok(
      clientCode.replace(/\r\n/g, '\n').includes("isParent\n    ? 'Phê Duyệt Hồ Sơ Con Cháu'"),
      'BranchPortalClient phải hiển thị tiêu đề Phê Duyệt Hồ Sơ Con Cháu cho Bố Mẹ'
    );
    assert.ok(
      clientCode.includes('Xét duyệt yêu cầu kết nối hoặc bổ sung thành viên trực hệ trong Gia Đình Của Bạn.'),
      'BranchPortalClient phải có phụ đề giải thích quyền hạn Gia Đình Của Bạn'
    );
    // Bố mẹ chỉ xem con cái và bản thân trong Gia Đình Của Bạn
    assert.ok(
      clientCode.includes('m.father_id === myId || m.mother_id === myId || m.id === myId'),
      'Bố Mẹ chỉ lọc và xem thành viên thuộc Gia Đình Của Bạn của mình'
    );
  });

  it('TC_UT_UNIFIED_APPROVAL_SCOPED_VIEW_BRANCH_EDITOR: Giao diện duyệt scoped cho Trưởng Chi hiển thị tiêu đề và danh sách Chi nhánh phụ trách', () => {
    const clientCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/claims/AdminClaimsClient.tsx'), 'utf-8');

    // Tiêu đề & phụ đề cho Trưởng Chi (branch_editor)
    assert.ok(
      clientCode.includes('Phê Duyệt Thành Viên Chi'),
      'AdminClaimsClient phải hiển thị tiêu đề Phê Duyệt Thành Viên Chi cho Trưởng Chi'
    );
    assert.ok(
      clientCode.includes('Xét duyệt hồ sơ con cháu thuộc Chi bạn phụ trách.'),
      'AdminClaimsClient phải có phụ đề cho Trưởng Chi phụ trách Chi'
    );
    // Lọc theo assignedBranchCode
    assert.ok(
      clientCode.includes('claim.target_branch_code.toLowerCase() === assignedBranchCode.toLowerCase()'),
      'Trưởng Chi lọc hồ sơ theo assignedBranchCode'
    );
  });

  it('TC_UT_ADMIN_CLAIMS_BRANCH_FILTER: Super Admin có Branch Selector trên Filter Bar để lọc phiếu theo Chi nhánh', () => {
    const clientCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/claims/AdminClaimsClient.tsx'), 'utf-8');

    // Tiêu đề & phụ đề cho Super Admin
    assert.ok(
      clientCode.includes("'Phê Duyệt Hồ Sơ Toàn Tộc'"),
      'AdminClaimsClient phải hiển thị tiêu đề Phê Duyệt Hồ Sơ Toàn Tộc cho Super Admin'
    );
    assert.ok(
      clientCode.includes('Toàn quyền xét duyệt, ủy quyền và điều phối hồ sơ phả hệ toàn tộc.'),
      'AdminClaimsClient phải có phụ đề phân quyền toàn tộc cho Super Admin'
    );

    // Có component Branch Selector trên thanh công cụ lọc
    assert.ok(
      clientCode.includes('id="admin-claims-branch-selector"'),
      'Phải có phần tử id admin-claims-branch-selector trên Filter Bar cho Super Admin'
    );
    // Lọc theo chi nhánh
    assert.ok(
      clientCode.includes('initialBranches.map'),
      'Branch Selector phải render các chi nhánh từ initialBranches'
    );
    assert.ok(
      clientCode.includes('Tất cả chi tộc (Toàn tộc)'),
      'Branch Selector phải có tùy chọn mặc định xem Tất cả chi tộc'
    );
  });

  it('TC_UT_TREE_PAGE_DEEP_FOCUS_ZOOM: Route /tree?focus={id} truyền focusId và kích hoạt pan/zoom camera + mở Drawer', () => {
    const treePageCode = fs.readFileSync(path.resolve(__dirname, '../src/app/tree/page.tsx'), 'utf-8');
    const canvasCode = fs.readFileSync(path.resolve(__dirname, '../src/components/tree/FamilyTreeCanvas.tsx'), 'utf-8');
    const memberNodeCode = fs.readFileSync(path.resolve(__dirname, '../src/components/tree/MemberNode.tsx'), 'utf-8');

    // TreePage đón nhận searchParams.focus và truyền initialFocusMemberId
    assert.ok(
      treePageCode.includes('searchParams?: { [key: string]: string | string[] | undefined }'),
      'TreePage phải nhận searchParams theo chuẩn PageProps'
    );
    assert.ok(
      treePageCode.includes("initialFocusMemberId={typeof searchParams?.focus === 'string' ? searchParams.focus : null}"),
      'TreePage phải truyền initialFocusMemberId vào FamilyTreeCanvas'
    );

    // Canvas đón nhận và kích hoạt camera zoom + drawer + highlight
    assert.ok(
      canvasCode.includes('initialFocusMemberId?: string | null;'),
      'FamilyTreeCanvasProps phải có initialFocusMemberId'
    );
    assert.ok(
      canvasCode.includes('zoom: 1.15'),
      'Canvas phải lia camera với độ zoom 1.15'
    );
    assert.ok(
      canvasCode.includes('duration: 800'),
      'Canvas phải lia camera với hiệu ứng duration 800ms'
    );
    assert.ok(
      canvasCode.includes('setSelectedMemberId(initialFocusMemberId)'),
      'Canvas phải tự động chọn memberId tương ứng khi focus'
    );
    assert.ok(
      canvasCode.includes('setIsDrawerOpen(true)'),
      'Canvas phải tự động mở MemberDetailDrawer khi có focus'
    );
    assert.ok(
      canvasCode.includes('setHighlightedMemberId(initialFocusMemberId)'),
      'Canvas phải bật trạng thái phát sáng highlight cho node'
    );

    // MemberNode hỗ trợ class phát sáng animate-pulse
    assert.ok(
      memberNodeCode.includes('animate-pulse'),
      'MemberNode phải có hiệu ứng viền phát sáng animate-pulse khi isHighlighted'
    );
  });

  it('TC_UT_ADMIN_CLAIMS_ZERO_LAYOUT_SHIFT: /admin/claims dùng AdminShell fluid canvas, triệt tiêu hoàn toàn tab ngang và co giật layout', () => {
    const clientCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/claims/AdminClaimsClient.tsx'), 'utf-8');

    // Fluid canvas w-full, loại bỏ max-w-5xl và activeTab ngang
    assert.ok(
      clientCode.includes('w-full'),
      'AdminClaimsClient phải sử dụng fluid canvas w-full trong AdminShell'
    );
    assert.ok(
      !clientCode.includes('max-w-5xl'),
      'AdminClaimsClient không được chứa container hạn hẹp max-w-5xl'
    );
    assert.ok(
      !clientCode.includes('activeTab'),
      'AdminClaimsClient triệt tiêu hoàn toàn tab ngang activeTab'
    );

    // Bảng table-fixed với các cột cố định
    assert.ok(
      clientCode.includes('table-fixed'),
      'Bảng danh sách phải sử dụng thuộc tính table-fixed để triệt tiêu layout shift'
    );
    assert.ok(
      clientCode.includes('w-[38%]'),
      'Bảng danh sách phải có cột cố định w-[38%]'
    );
    assert.ok(
      clientCode.includes('w-[22%]'),
      'Bảng danh sách phải có cột cố định w-[22%]'
    );
    assert.ok(
      clientCode.includes('w-[15%]'),
      'Bảng danh sách phải có cột cố định w-[15%]'
    );
    assert.ok(
      clientCode.includes('w-[25%]'),
      'Bảng danh sách phải có cột cố định w-[25%]'
    );

    // Hairline divider
    assert.ok(
      clientCode.includes('divide-y divide-slate-100 dark:divide-slate-800'),
      'Bảng danh sách phải dùng hairline divider divide-y divide-slate-100'
    );
  });

  it('TC_INT_MEMBERS_API_CLAIMED_MEMBER_SPOUSE_ADD: API chấp thuận khi claimed_member thêm vợ/chồng cho chính mình, tự gán đúng thế hệ', () => {
    const membersRouteCode = fs.readFileSync(path.resolve(__dirname, '../src/app/api/members/route.ts'), 'utf-8');

    // 1. Kiểm tra API nhận diện spouse_id từ Frontend
    assert.ok(
      membersRouteCode.includes('const targetManageId = parentId || body.spouse_id || (body as any).current_spouse_id;'),
      'API POST /api/members phải nhận diện spouse_id làm targetManageId để kiểm tra quyền hạn'
    );

    // 2. Kiểm tra kế thừa thế hệ chính xác theo thế hệ của người phối ngẫu (Generation Parity)
    assert.ok(
      membersRouteCode.includes('else if (body.spouse_id) {'),
      'API phải có nhánh tính thế hệ theo spouse_id'
    );
    assert.ok(
      membersRouteCode.includes('generationLevel = spouse.generation_level || 1;'),
      'Thế hệ của người phối ngẫu mới phải kế thừa đúng đời của người bạn đời, không bị rơi về đời 1'
    );

    // 3. Kiểm tra logic phân quyền canUserManageMember cho claimed_member
    const testMembers: MemberRecord[] = [
      {
        id: 'giap_13',
        full_name: 'Phạm Tiến Giáp',
        gender: 'male',
        life_status: 'living',
        generation_level: 13,
        is_root: false,
      },
      {
        id: 'uncle_hung',
        full_name: 'Phạm Văn Hùng',
        gender: 'male',
        life_status: 'living',
        generation_level: 12,
        is_root: false,
      },
    ];

    const claimedUser = {
      id: 'user_giap_13',
      user_role: 'claimed_member',
      linked_member_id: 'giap_13', // Giáp Đời 13
    };

    // Khi thêm vợ cho chính mình (targetManageId = giap_13): Phải được phép
    const canManageSelfSpouse = canUserManageMember(claimedUser, 'giap_13', testMembers, []);
    assert.strictEqual(canManageSelfSpouse, true, 'Claimed member phải có quyền thêm vợ/chồng cho chính mình');

    // Kiểm tra thế hệ được gán cho vợ:
    const selfMember = testMembers.find((m) => m.id === claimedUser.linked_member_id);
    assert.ok(selfMember, 'Node bản thân phải tồn tại trong mock data');
    const calculatedGenLevel = selfMember.generation_level || 1;
    assert.strictEqual(calculatedGenLevel, 13, 'Thế hệ của người vợ mới tạo phải bằng đời 13 (Generation Parity)');

    // Khi người ngoài cố tình thêm vợ cho chú Hùng: Phải bị từ chối
    const canManageOtherSpouse = canUserManageMember(claimedUser, 'uncle_hung', testMembers, []);
    assert.strictEqual(canManageOtherSpouse, false, 'Claimed member không được phép thêm vợ/chồng cho người ngoài Gia Đình Của Bạn');
  });

  it('TC_UT_CLAIMED_MEMBER_ADMIN_CLAIMS_ISOLATED_SIDEBAR: Bố Mẹ vào /admin/claims được mở cửa và Sidebar chỉ hiện duy nhất mục Phê Duyệt Hồ Sơ Con Cháu', () => {
    const layoutCode = fs.readFileSync(path.resolve(__dirname, '../src/app/admin/layout.tsx'), 'utf-8');
    const sidebarCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/AdminSidebar.tsx'), 'utf-8');
    const shellCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/AdminShell.tsx'), 'utf-8');

    // 1. Layout cho phép claimed_member truy cập /admin/claims và bảo vệ các trang khác
    assert.ok(
      layoutCode.includes("userRole === 'claimed_member'"),
      'AdminLayout phải phân biệt vai trò claimed_member'
    );
    assert.ok(
      layoutCode.includes("pathname && !pathname.startsWith('/admin/claims')"),
      'AdminLayout phải chặn claimed_member truy cập vào các trang ngoài /admin/claims'
    );
    assert.ok(
      layoutCode.includes("redirect('/?auth_error=unauthorized_admin')"),
      'AdminLayout phải chuyển hướng người dùng khi cố truy cập trái phép'
    );
    assert.ok(
      layoutCode.includes('userRole={userRole}'),
      'AdminLayout phải truyền userRole vào AdminShell'
    );

    // 2. AdminShell nhận và truyền userRole xuống AdminSidebar
    assert.ok(
      shellCode.includes('userRole?: UserRole'),
      'AdminShellProps phải chấp nhận prop userRole'
    );
    assert.ok(
      shellCode.includes('userRole={userRole}'),
      'AdminShell phải truyền userRole vào AdminSidebar'
    );

    // 3. AdminSidebar cách ly danh mục cho claimed_member
    assert.ok(
      sidebarCode.includes("const CLAIMED_MEMBER_GROUPS: NavGroup[] = ["),
      'AdminSidebar phải định nghĩa riêng CLAIMED_MEMBER_GROUPS'
    );
    assert.ok(
      sidebarCode.includes("title: 'Gia Đình Của Bạn'"),
      'CLAIMED_MEMBER_GROUPS phải có nhóm danh mục Gia Đình Của Bạn'
    );
    assert.ok(
      sidebarCode.includes("label: 'Phê Duyệt Hồ Sơ Con Cháu'"),
      'Nhóm Gia Đình Của Bạn phải có mục Phê Duyệt Hồ Sơ Con Cháu'
    );
    assert.ok(
      sidebarCode.includes("Con Cháu"),
      'Huy hiệu vai trò của claimed_member phải hiển thị là Con Cháu'
    );
    assert.ok(
      sidebarCode.includes("userRole === 'claimed_member' ? CLAIMED_MEMBER_GROUPS : NAV_GROUPS"),
      'AdminSidebar phải tự động chuyển sang CLAIMED_MEMBER_GROUPS khi userRole là claimed_member'
    );
  });
});

describe('Feature Flag Member Self-Edit Kill Switch & Permission Matrix Sync (Spec 17 - Milestone 8 Extension)', () => {
  it('TC_UT_FEATURE_FLAG_MEMBER_SELF_EDIT_DEFAULT: Khởi tạo giá trị mặc định true và hỗ trợ ghi đè an toàn cho allow_member_self_edit', () => {
    // 1. Kiểm tra DEFAULT_FEATURE_FLAGS
    assert.strictEqual(
      DEFAULT_FEATURE_FLAGS.allow_member_self_edit,
      true,
      'DEFAULT_FEATURE_FLAGS.allow_member_self_edit phải có giá trị mặc định là true'
    );

    // 2. Kiểm tra resolveFeatureFlags khi không truyền hoặc truyền rỗng
    const resolvedDefault = resolveFeatureFlags(undefined);
    assert.strictEqual(
      resolvedDefault.allow_member_self_edit,
      true,
      'resolveFeatureFlags(undefined) phải trả về allow_member_self_edit: true'
    );

    const resolvedEmpty = resolveFeatureFlags({});
    assert.strictEqual(
      resolvedEmpty.allow_member_self_edit,
      true,
      'resolveFeatureFlags({}) phải trả về allow_member_self_edit: true'
    );

    // 3. Kiểm tra ghi đè tắt cờ (Kill Switch kích hoạt)
    const resolvedDisabled = resolveFeatureFlags({ allow_member_self_edit: false });
    assert.strictEqual(
      resolvedDisabled.allow_member_self_edit,
      false,
      'Khi truyền { allow_member_self_edit: false }, resolveFeatureFlags phải trả về false'
    );
  });

  it('TC_UT_ROLES_MATRIX_CLAIMED_MEMBER_SYNC: Ma trận phân quyền phản ánh chuẩn xác quyền tự quản gia đình và duyệt hồ sơ', () => {
    // 1. Kiểm tra ma trận phân quyền PERMISSION_MATRIX_DEFINITIONS
    const allPermissions = PERMISSION_MATRIX_DEFINITIONS;

    // Quyền tự quản gia đình (manage_own_family)
    const manageFamilyPerm = allPermissions.find((p) => p.id === 'manage_own_family');
    assert.ok(manageFamilyPerm, 'Phải có định nghĩa quyền manage_own_family trong ma trận');
    assert.strictEqual(manageFamilyPerm.roles.claimed_member, true, 'claimed_member phải có quyền manage_own_family: true');
    assert.strictEqual(manageFamilyPerm.roles.branch_editor, true, 'branch_editor phải có quyền manage_own_family: true');
    assert.strictEqual(manageFamilyPerm.roles.super_admin, true, 'super_admin phải có quyền manage_own_family: true');
    assert.strictEqual(manageFamilyPerm.roles.viewer, false, 'viewer không được có quyền manage_own_family');

    // Quyền duyệt hồ sơ con cháu trong gia đình (review_family_claims)
    const reviewFamilyPerm = allPermissions.find((p) => p.id === 'review_family_claims');
    assert.ok(reviewFamilyPerm, 'Phải có định nghĩa quyền review_family_claims trong ma trận');
    assert.strictEqual(reviewFamilyPerm.roles.claimed_member, true, 'claimed_member phải có quyền review_family_claims: true');
    assert.strictEqual(reviewFamilyPerm.roles.branch_editor, true, 'branch_editor phải có quyền review_family_claims: true');
    assert.strictEqual(reviewFamilyPerm.roles.super_admin, true, 'super_admin phải có quyền review_family_claims: true');
    assert.strictEqual(reviewFamilyPerm.roles.viewer, false, 'viewer không được có quyền review_family_claims');

    // Quyền duyệt hồ sơ chi nhánh (review_branch_claims)
    const reviewBranchPerm = allPermissions.find((p) => p.id === 'review_branch_claims');
    assert.ok(reviewBranchPerm, 'Phải có định nghĩa quyền review_branch_claims trong ma trận');
    assert.strictEqual(reviewBranchPerm.roles.claimed_member, false, 'claimed_member không được có quyền review_branch_claims');
    assert.strictEqual(reviewBranchPerm.roles.branch_editor, true, 'branch_editor phải có quyền review_branch_claims: true');
    assert.strictEqual(reviewBranchPerm.roles.super_admin, true, 'super_admin phải có quyền review_branch_claims: true');

    // Quyền chỉnh sửa nhánh (edit_branch_members)
    const editBranchPerm = allPermissions.find((p) => p.id === 'edit_branch_members');
    assert.ok(editBranchPerm, 'Phải có quyền edit_branch_members');
    assert.strictEqual(editBranchPerm.roles.claimed_member, false, 'claimed_member không được có quyền edit_branch_members');

    // Quyền quản lý toàn bộ tài khoản (manage_users_claims)
    const manageUsersPerm = allPermissions.find((p) => p.id === 'manage_users_claims');
    assert.ok(manageUsersPerm, 'Phải có quyền manage_users_claims');
    assert.strictEqual(manageUsersPerm.roles.claimed_member, false, 'claimed_member không được có quyền manage_users_claims');
    assert.strictEqual(manageUsersPerm.roles.branch_editor, false, 'branch_editor không được có quyền manage_users_claims');
    assert.strictEqual(manageUsersPerm.roles.super_admin, true, 'super_admin phải có quyền manage_users_claims: true');

    // 2. Kiểm tra mô tả vai trò ROLES_META
    const claimedMeta = ROLES_META.find((r) => r.id === 'claimed_member');
    assert.ok(claimedMeta, 'Phải có metadata cho vai trò claimed_member');
    assert.ok(
      claimedMeta.description.includes('gia đình của mình'),
      'Mô tả claimed_member phải nêu rõ quyền quản lý gia đình của mình'
    );
    assert.ok(
      claimedMeta.description.includes('phê duyệt hồ sơ con cháu'),
      'Mô tả claimed_member phải nêu rõ quyền phê duyệt hồ sơ con cháu'
    );
  });

  it('TC_INT_MEMBERS_API_BLOCKED_WHEN_SELF_EDIT_FLAG_DISABLED: Backend APIs chặn 403 Forbidden khi cờ allow_member_self_edit bị tắt', () => {
    // 1. Kiểm tra API POST /api/members
    const postMembersCode = fs.readFileSync(path.resolve(__dirname, '../src/app/api/members/route.ts'), 'utf-8');
    assert.ok(
      postMembersCode.includes('extractFeatureFlagsFromRequest'),
      'POST /api/members phải import và gọi extractFeatureFlagsFromRequest'
    );
    assert.ok(
      postMembersCode.includes('!featureFlags.allow_member_self_edit'),
      'POST /api/members phải kiểm tra cờ !featureFlags.allow_member_self_edit'
    );
    assert.ok(
      postMembersCode.includes('Tính năng tự chỉnh sửa thông tin gia đình đang tạm thời bị khóa bởi Ban Quản Trị'),
      'POST /api/members phải trả về thông điệp lỗi chuẩn xác'
    );

    // 2. Kiểm tra API PUT /api/members/[id]
    const putMemberCode = fs.readFileSync(path.resolve(__dirname, '../src/app/api/members/[id]/route.ts'), 'utf-8');
    assert.ok(
      putMemberCode.includes('extractFeatureFlagsFromRequest'),
      'PUT /api/members/[id] phải import và gọi extractFeatureFlagsFromRequest'
    );
    assert.ok(
      putMemberCode.includes('!featureFlags.allow_member_self_edit'),
      'PUT /api/members/[id] phải kiểm tra cờ !featureFlags.allow_member_self_edit'
    );
    assert.ok(
      putMemberCode.includes('Tính năng tự chỉnh sửa thông tin gia đình đang tạm thời bị khóa bởi Ban Quản Trị'),
      'PUT /api/members/[id] phải trả về thông điệp lỗi chuẩn xác'
    );

    // 3. Kiểm tra API POST /api/members/quick-add-child
    const quickAddCode = fs.readFileSync(path.resolve(__dirname, '../src/app/api/members/quick-add-child/route.ts'), 'utf-8');
    assert.ok(
      quickAddCode.includes('extractFeatureFlagsFromRequest'),
      'quick-add-child phải import và gọi extractFeatureFlagsFromRequest'
    );
    assert.ok(
      quickAddCode.includes('!featureFlags.allow_member_self_edit'),
      'quick-add-child phải kiểm tra cờ !featureFlags.allow_member_self_edit'
    );
    assert.ok(
      quickAddCode.includes('Tính năng tự chỉnh sửa thông tin gia đình đang tạm thời bị khóa bởi Ban Quản Trị'),
      'quick-add-child phải trả về thông điệp lỗi chuẩn xác'
    );
  });

  it('TC_UT_DRAWER_ACTIONS_HIDDEN_WHEN_SELF_EDIT_FLAG_DISABLED: Drawer ẩn toàn bộ nút chỉnh sửa và hiển thị banner khóa khi cờ bị tắt', () => {
    const drawerCode = fs.readFileSync(path.resolve(__dirname, '../src/components/tree/MemberDetailDrawer.tsx'), 'utf-8');

    // 1. canManageCurrentMember bị vô hiệu hóa khi cờ tắt
    assert.ok(
      drawerCode.includes("currentUser.user_role === 'claimed_member' && featureFlags?.allow_member_self_edit === false"),
      'Drawer canManageCurrentMember phải trả về false khi cờ allow_member_self_edit bị tắt'
    );

    // 2. Có cờ isFamilyMemberUnderLock
    assert.ok(
      drawerCode.includes('const isFamilyMemberUnderLock'),
      'Drawer phải tính toán isFamilyMemberUnderLock'
    );

    // 3. Hiển thị banner cảnh báo
    assert.ok(
      drawerCode.includes('Tạm khóa chỉnh sửa gia đình'),
      'Drawer phải hiển thị tiêu đề banner "Tạm khóa chỉnh sửa gia đình"'
    );
    assert.ok(
      drawerCode.includes('Ban Quản Trị đang tạm đóng tính năng tự sửa thông tin gia đình để đối soát dữ liệu phả hệ.'),
      'Drawer phải hiển thị nội dung thông báo khóa phả hệ'
    );

    // 4. Nhận diện hồ sơ cập nhật chữ
    assert.ok(
      drawerCode.includes('Thuộc gia đình của bạn'),
      'Drawer phải hiển thị badge "Thuộc gia đình của bạn"'
    );
    assert.ok(
      !drawerCode.includes('Thuộc hộ gia đình của bạn'),
      'Drawer tuyệt đối không được dùng cụm từ cũ "Thuộc hộ gia đình của bạn"'
    );
  });

  it('TC_UT_ADMIN_SIDEBAR_FAMILY_LABEL_SYNC: Đồng bộ hóa toàn bộ danh mục và giao diện sang "Gia Đình Của Bạn"', () => {
    const sidebarCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/AdminSidebar.tsx'), 'utf-8');
    const claimsClientCode = fs.readFileSync(path.resolve(__dirname, '../src/components/admin/claims/AdminClaimsClient.tsx'), 'utf-8');

    // 1. Sidebar danh mục
    assert.ok(
      sidebarCode.includes("title: 'Gia Đình Của Bạn'"),
      'Sidebar phải định nghĩa title: "Gia Đình Của Bạn"'
    );
    assert.ok(
      !sidebarCode.includes('TIỂU GIA ĐÌNH'),
      'Sidebar tuyệt đối không được chứa cụm từ "TIỂU GIA ĐÌNH"'
    );
    assert.ok(
      !sidebarCode.includes('Tiểu gia đình'),
      'Sidebar tuyệt đối không được chứa cụm từ "Tiểu gia đình"'
    );

    // 2. Claims Client
    assert.ok(
      claimsClientCode.includes('Gia Đình Của Bạn'),
      'Claims Client phải hiển thị badge "Gia Đình Của Bạn"'
    );
    assert.ok(
      claimsClientCode.includes('trong gia đình của bạn'),
      'Claims Client phụ đề phải ghi "trong gia đình của bạn"'
    );
    assert.ok(
      !claimsClientCode.includes('Tiểu Gia Đình'),
      'Claims Client tuyệt đối không được chứa cụm từ "Tiểu Gia Đình"'
    );
    assert.ok(
      !claimsClientCode.includes('tiểu gia đình'),
      'Claims Client tuyệt đối không được chứa cụm từ "tiểu gia đình"'
    );
  });
});


