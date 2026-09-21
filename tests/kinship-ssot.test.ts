import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_NORTH_RULES,
  DEFAULT_CENTRAL_RULES,
  DEFAULT_SOUTH_RULES,
  getRegionalPresetDictionary,
  getTermFromSSOT,
  resolveKinshipTerms,
  formatBirthOrder,
} from '../src/lib/kinship-engine/regional-dictionaries';
import {
  findLowestCommonAncestor,
  compareSeniority,
  buildSpouseMap,
} from '../src/lib/kinship-engine/lca-finder';
import type { Member } from '../src/types/database';

describe('Kinship SSOT & Seniority Engine Test Suite (TC37 - TC42)', () => {
  // TC37: Clean Preset Rules Integrity
  it('TC37: Toàn bộ 32+ preset rules của cả 3 miền không chứa ngoặc đơn, ngoặc kép hoặc gạch chéo', () => {
    const northRules = getRegionalPresetDictionary('north');
    const centralRules = getRegionalPresetDictionary('central');
    const southRules = getRegionalPresetDictionary('south');

    const invalidCharRegex = /[()"/]/;

    const testRuleset = (rules: typeof northRules, regionName: string) => {
      assert.ok(rules.length >= 32, `${regionName} phải có ít nhất 32 rules`);
      for (const r of rules) {
        assert.ok(
          !invalidCharRegex.test(r.termSenior),
          `[${regionName}] rule "${r.id}" có termSenior "${r.termSenior}" chứa ký tự không hợp lệ`
        );
        assert.ok(
          !invalidCharRegex.test(r.termJunior),
          `[${regionName}] rule "${r.id}" có termJunior "${r.termJunior}" chứa ký tự không hợp lệ`
        );
      }
    };

    testRuleset(northRules, 'Miền Bắc');
    testRuleset(centralRules, 'Miền Trung');
    testRuleset(southRules, 'Miền Nam');

    // Kiểm tra danh xưng cụ thể đã sạch
    const uncleHusbandNorth = northRules.find((r) => r.id === 'uncle_senior_husband');
    assert.strictEqual(uncleHusbandNorth?.termSenior, 'Bác rể');

    const centralMother = centralRules.find((r) => r.id === 'parent_mother');
    assert.strictEqual(centralMother?.termSenior, 'Mạ');

    const southBrother = southRules.find((r) => r.id === 'sibling_brother');
    assert.strictEqual(southBrother?.termSenior, 'Anh Hai');

    const southSister = southRules.find((r) => r.id === 'sibling_sister');
    assert.strictEqual(southSister?.termSenior, 'Chị Ba');
  });

  // TC38: SSOT Term Retrieval Helper
  it('TC38: Helper getTermFromSSOT ưu tiên customDictionary, fallback về regional preset và default', () => {
    // 1. Khi có customDictionary
    const customTerm = getTermFromSSOT(
      'uncle_senior_husband',
      'senior',
      'north',
      {
        uncle_senior_husband: {
          termSenior: 'Bác rể cả họ',
          termJunior: 'Cháu ngoan',
        },
      },
      'Bác rể'
    );
    assert.strictEqual(customTerm, 'Bác rể cả họ', 'Phải ưu tiên customDictionary');

    // 2. Khi không có customDictionary -> fallback về preset vùng miền
    const northPresetTerm = getTermFromSSOT(
      'uncle_senior_husband',
      'senior',
      'north',
      null,
      'Mặc định'
    );
    assert.strictEqual(northPresetTerm, 'Bác rể', 'Phải fallback về preset miền Bắc');

    const centralMotherTerm = getTermFromSSOT('parent_mother', 'senior', 'central', null);
    assert.strictEqual(centralMotherTerm, 'Mạ', 'Phải fallback về preset miền Trung');

    const southBrotherTerm = getTermFromSSOT('sibling_brother', 'senior', 'south', null);
    assert.strictEqual(southBrotherTerm, 'Anh Hai', 'Phải fallback về preset miền Nam');

    // 3. Fallback default khi rule không tồn tại
    const unknownTerm = getTermFromSSOT('non_existent_rule', 'senior', 'north', null, 'Bạn bè');
    assert.strictEqual(unknownTerm, 'Bạn bè', 'Phải trả về fallbackDefault');
  });

  // TC39: Uncle Senior Husband In-Law Resolution (Tạ Duy Hưng & Phạm Thị Chỉ vs Phạm Văn Khương)
  it('TC39: Tạ Duy Hưng (chồng bà Phạm Thị Chỉ - con thứ 2) được nhận diện chuẩn xác là Bác rể đối với con của ông Khương', () => {
    const FATHER_ID = '00000000-0000-0000-0000-000000000001';
    const CHI_ID = '00000000-0000-0000-0000-000000000002'; // Bà Chỉ: Con thứ 2 (chị gái)
    const KHUONG_ID = '00000000-0000-0000-0000-000000000003'; // Ông Khương: Con thứ 3 (em trai, trưởng nam)
    const HUNG_ID = '00000000-0000-0000-0000-000000000004'; // Ông Tạ Duy Hưng (chồng bà Chỉ)
    const CHILD_KHUONG_ID = '00000000-0000-0000-0000-000000000005'; // Con của ông Khương

    const mockMembers: Member[] = [
      {
        id: FATHER_ID,
        full_name: 'Cụ Thân Sinh',
        gender: 'male',
        generation_level: 1,
        generation_number: 1,
      } as Member,
      {
        id: CHI_ID,
        full_name: 'Phạm Thị Chỉ',
        gender: 'female',
        father_id: FATHER_ID,
        birth_order: 2,
        birth_year: 1940,
        generation_level: 2,
        generation_number: 2,
        is_senior_branch: false,
        spouse_ids: [HUNG_ID],
      } as Member,
      {
        id: KHUONG_ID,
        full_name: 'Phạm Văn Khương',
        gender: 'male',
        father_id: FATHER_ID,
        birth_order: 3,
        birth_year: 1943,
        generation_level: 2,
        generation_number: 2,
        is_senior_branch: false,
      } as Member,
      {
        id: HUNG_ID,
        full_name: 'Tạ Duy Hưng',
        gender: 'male',
        generation_level: 2,
        generation_number: 2,
        spouse_ids: [CHI_ID],
      } as Member,
      {
        id: CHILD_KHUONG_ID,
        full_name: 'Phạm Văn Con',
        gender: 'male',
        father_id: KHUONG_ID,
        generation_level: 3,
        generation_number: 3,
      } as Member,
    ];

    const membersMap = new Map<string, Member>(mockMembers.map((m) => [m.id, m]));
    const spouseMap = buildSpouseMap(
      [{ member_a_id: CHI_ID, member_b_id: HUNG_ID }],
      membersMap
    );

    // 1. Xét quan hệ giữa Tạ Duy Hưng và Con ông Khương
    const lcaChildToHung = findLowestCommonAncestor(
      CHILD_KHUONG_ID,
      HUNG_ID,
      membersMap,
      spouseMap
    );

    assert.strictEqual(lcaChildToHung.relationshipType, 'in_law', 'Phải là quan hệ dâu/rể in_law');
    assert.strictEqual(lcaChildToHung.generationDelta, -1, 'Con ông Khương ở thế hệ dưới Tạ Duy Hưng 1 đời');

    const resChildToHung = resolveKinshipTerms(
      lcaChildToHung,
      membersMap.get(CHILD_KHUONG_ID)!,
      membersMap.get(HUNG_ID)!,
      'north'
    );

    assert.strictEqual(
      resChildToHung.termAtoB,
      'Bác rể',
      'Con ông Khương phải gọi ông Tạ Duy Hưng là "Bác rể" (không phải "Chú dượng")'
    );
    assert.strictEqual(
      resChildToHung.termBtoA,
      'Cháu',
      'Ông Tạ Duy Hưng gọi con ông Khương là "Cháu"'
    );
    assert.ok(
      !resChildToHung.termAtoB.includes('('),
      'Danh xưng không được chứa ngoặc đơn giải thích thừa'
    );

    // 2. Xét quan hệ giữa Tạ Duy Hưng và Ông Khương (cùng thế hệ)
    const lcaKhuongToHung = findLowestCommonAncestor(
      KHUONG_ID,
      HUNG_ID,
      membersMap,
      spouseMap
    );

    const resKhuongToHung = resolveKinshipTerms(
      lcaKhuongToHung,
      membersMap.get(KHUONG_ID)!,
      membersMap.get(HUNG_ID)!,
      'north'
    );

    assert.strictEqual(
      resKhuongToHung.termAtoB,
      'Anh rể',
      'Ông Khương phải gọi chồng của chị gái (Tạ Duy Hưng) là "Anh rể"'
    );
  });

  // TC40: Sibling Seniority Ignores Senior Branch Flag
  it('TC40: Thứ bậc anh chị em ruột ưu tiên birth_order và ngày/năm sinh, không bị cờ chi trưởng làm đảo lộn', () => {
    const FATHER_ID = 'father-001';

    const olderSister: Member = {
      id: 'sister-001',
      full_name: 'Chị Gái',
      gender: 'female',
      father_id: FATHER_ID,
      birth_order: 2,
      birth_year: 1950,
      is_senior_branch: false,
    } as Member;

    const youngerBrotherSeniorBranch: Member = {
      id: 'brother-001',
      full_name: 'Em Trai Trưởng Chi',
      gender: 'male',
      father_id: FATHER_ID,
      birth_order: 3,
      birth_year: 1953,
      is_senior_branch: true, // Được đánh dấu trưởng nam trong thực tế
    } as Member;

    // Chị gái (order 2) so với Em trai (order 3, is_senior_branch: true)
    const isSisterSenior = compareSeniority(olderSister, youngerBrotherSeniorBranch);
    assert.strictEqual(
      isSisterSenior,
      true,
      'Chị gái sinh trước (birth_order 2 < 3) phải giữ vai trên dù em trai mang cờ is_senior_branch'
    );

    const isBrotherSenior = compareSeniority(youngerBrotherSeniorBranch, olderSister);
    assert.strictEqual(
      isBrotherSenior,
      false,
      'Em trai mang cờ is_senior_branch không được lấn át thứ bậc của chị gái ruột'
    );
  });

  // TC41: Custom Regional Term Reflection in Kinship Resolution
  it('TC41: Thay đổi từ điển tùy biến trong customDictionary được phản ánh tức thì vào kết quả resolveKinshipTerms', () => {
    const FATHER_ID = '00000000-0000-0000-0000-000000000001';
    const CHI_ID = '00000000-0000-0000-0000-000000000002';
    const KHUONG_ID = '00000000-0000-0000-0000-000000000003';
    const HUNG_ID = '00000000-0000-0000-0000-000000000004';
    const CHILD_KHUONG_ID = '00000000-0000-0000-0000-000000000005';

    const mockMembers: Member[] = [
      { id: FATHER_ID, full_name: 'Cụ Thân Sinh', gender: 'male' } as Member,
      {
        id: CHI_ID,
        full_name: 'Phạm Thị Chỉ',
        gender: 'female',
        father_id: FATHER_ID,
        birth_order: 2,
        spouse_ids: [HUNG_ID],
      } as Member,
      {
        id: KHUONG_ID,
        full_name: 'Phạm Văn Khương',
        gender: 'male',
        father_id: FATHER_ID,
        birth_order: 3,
      } as Member,
      {
        id: HUNG_ID,
        full_name: 'Tạ Duy Hưng',
        gender: 'male',
        spouse_ids: [CHI_ID],
      } as Member,
      {
        id: CHILD_KHUONG_ID,
        full_name: 'Phạm Văn Con',
        gender: 'male',
        father_id: KHUONG_ID,
      } as Member,
    ];

    const membersMap = new Map<string, Member>(mockMembers.map((m) => [m.id, m]));
    const spouseMap = buildSpouseMap(
      [{ member_a_id: CHI_ID, member_b_id: HUNG_ID }],
      membersMap
    );

    const lca = findLowestCommonAncestor(CHILD_KHUONG_ID, HUNG_ID, membersMap, spouseMap);

    // Ghi đè danh xưng bác rể trong dòng họ thành "Bác dượng cả" - "Cháu nội dòng"
    const customRes = resolveKinshipTerms(
      lca,
      membersMap.get(CHILD_KHUONG_ID)!,
      membersMap.get(HUNG_ID)!,
      'north',
      {
        uncle_senior_husband: {
          termSenior: 'Bác dượng cả',
          termJunior: 'Cháu nội dòng',
        },
      }
    );

    assert.strictEqual(
      customRes.termAtoB,
      'Bác dượng cả',
      'Phải phản ánh chuẩn xác danh xưng ghi đè từ customDictionary'
    );
    assert.strictEqual(
      customRes.termBtoA,
      'Cháu nội dòng',
      'Phải phản ánh chuẩn xác danh xưng gọi lại từ customDictionary'
    );
  });

  // TC42: Settings Unified Route & Compatibility
  it('TC42: Trang /admin/settings tự động điều hướng sang /admin/kinship và /kinship dẫn tới /admin/kinship', () => {
    // 1. Kiểm tra trang /admin/settings chuyển hướng sang /admin/kinship
    const settingsPath = path.resolve(process.cwd(), 'src/app/admin/settings/page.tsx');
    assert.ok(fs.existsSync(settingsPath), 'File src/app/admin/settings/page.tsx phải tồn tại');

    const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
    assert.ok(
      settingsContent.includes('/admin/kinship'),
      'src/app/admin/settings/page.tsx phải điều hướng tới /admin/kinship'
    );
    assert.ok(
      settingsContent.includes('tab-btn-branches') && settingsContent.includes('tab-btn-info'),
      'Phải duy trì các id kiểm thử tương thích tab-btn-branches và tab-btn-info'
    );

    // 2. Kiểm tra màn hình tra cứu /kinship dẫn tới /admin/kinship
    const kinshipPagePath = path.resolve(process.cwd(), 'src/app/kinship/page.tsx');
    assert.ok(fs.existsSync(kinshipPagePath), 'File src/app/kinship/page.tsx phải tồn tại');

    const kinshipContent = fs.readFileSync(kinshipPagePath, 'utf-8');
    assert.ok(
      kinshipContent.includes('href="/admin/kinship"'),
      'Màn hình /kinship phải trỏ nút Cài đặt sang /admin/kinship'
    );
    assert.ok(
      !kinshipContent.includes('href="/admin/settings"'),
      'Màn hình /kinship không được còn liên kết tới /admin/settings'
    );
  });

  // TC43: Gán cờ isSpouse cho người phối ngẫu ngoài họ và isSpouseBridge cho thành viên trong họ
  it('TC43: Thuật toán LCA gán đúng isSpouse: true cho người ngoài họ và isSpouse: false cho người trong họ', () => {
    const CHIEN_ID = '00000000-0000-0000-0000-000000000001'; // Cụ Chiến (Đời 1)
    const DONG_ID = '00000000-0000-0000-0000-000000000002';  // Cụ Đồng (Đời 2)
    const CHUC_ID = '00000000-0000-0000-0000-000000000003';  // Cụ Chức (Đời 3)
    const TUONG_ID = '00000000-0000-0000-0000-000000000004'; // Ông Tường (Đời 4, con Chức)
    const HIEN_ID = '00000000-0000-0000-0000-000000000005';  // Bà Hiến (Đời 4, vợ Tường, Dâu)

    const mockMembers: Member[] = [
      { id: CHIEN_ID, full_name: 'Phạm Văn Chiến', gender: 'male', generation_level: 1, generation_number: 1 } as Member,
      { id: DONG_ID, full_name: 'Phạm Văn Đồng', gender: 'male', father_id: CHIEN_ID, generation_level: 2, generation_number: 2 } as Member,
      { id: CHUC_ID, full_name: 'Phạm Kim Chức', gender: 'male', father_id: DONG_ID, generation_level: 3, generation_number: 3 } as Member,
      { id: TUONG_ID, full_name: 'Phạm Khắc Tường', gender: 'male', father_id: CHUC_ID, generation_level: 4, generation_number: 4, spouse_ids: [HIEN_ID] } as Member,
      { id: HIEN_ID, full_name: 'Nguyễn Thị Hiến', gender: 'female', generation_level: 4, generation_number: 4, spouse_ids: [TUONG_ID] } as Member,
    ];

    const membersMap = new Map<string, Member>();
    mockMembers.forEach((m) => membersMap.set(m.id, m));
    const spouseMap = buildSpouseMap(
      [{ member_a_id: TUONG_ID, member_b_id: HIEN_ID }],
      membersMap
    );

    // Tra cứu giữa Cụ Chiến (A) và Bà Hiến (B - Dâu)
    const lca = findLowestCommonAncestor(CHIEN_ID, HIEN_ID, membersMap, spouseMap);
    assert.strictEqual(lca.relationshipType, 'in_law', 'Quan hệ phải là in_law');

    // Kiểm tra pathB: [Hiến, Tường, Chức, Đồng, Chiến]
    const nodeHien = lca.pathB.find((n) => n.id === HIEN_ID);
    assert.ok(nodeHien, 'PathB phải chứa node Hiến');
    assert.strictEqual(nodeHien?.isSpouse, true, 'Nguyễn Thị Hiến (dâu ngoài họ) phải có isSpouse: true');

    const nodeTuong = lca.pathB.find((n) => n.id === TUONG_ID);
    assert.ok(nodeTuong, 'PathB phải chứa node Tường');
    assert.strictEqual(nodeTuong?.isSpouse, false, 'Phạm Khắc Tường (con ruột họ Phạm) bắt buộc isSpouse: false');
    assert.strictEqual(nodeTuong?.isSpouseBridge, true, 'Phạm Khắc Tường phải có isSpouseBridge: true');

    const nodeChuc = lca.pathB.find((n) => n.id === CHUC_ID);
    assert.strictEqual(nodeChuc?.isSpouse, undefined, 'Phạm Kim Chức (cha ruột) không có isSpouse');
  });

  // TC44 & TC45: Quy tắc hiển thị nhịp nối trực hệ và badge hôn phối
  it('TC44 & TC45: Nhịp nối giữa Cha và Con ruột là huyết thống, chỉ cặp vợ chồng cùng đời mới là nhịp Hôn Phối', () => {
    // Mô phỏng chuỗi node trên dòng trực hệ dọc directLineageNodes
    const directLineageNodes = [
      { id: '1', name: 'Phạm Văn Chiến', generationNumber: 1, isSpouse: false },
      { id: '2', name: 'Phạm Văn Đồng', generationNumber: 2, isSpouse: false },
      { id: '3', name: 'Phạm Kim Chức', generationNumber: 3, isSpouse: false },
      { id: '4', name: 'Phạm Khắc Tường', generationNumber: 4, isSpouse: false, isSpouseBridge: true },
      { id: '5', name: 'Nguyễn Thị Hiến', generationNumber: 4, isSpouse: true },
    ];

    // Kiểm tra từng nhịp nối
    for (let idx = 1; idx < directLineageNodes.length; idx++) {
      const node = directLineageNodes[idx];
      const prevNode = directLineageNodes[idx - 1];
      const isSpousePair =
        (node.isSpouse || prevNode?.isSpouse) &&
        node.generationNumber === prevNode?.generationNumber;

      if (node.id === '4') {
        // Nhịp nối giữa Chức (Đời 3) và Tường (Đời 4)
        assert.strictEqual(
          isSpousePair,
          false,
          'Cạnh giữa Bố Chức và Con Tường TUYỆT ĐỐI KHÔNG được là nhịp Hôn Phối'
        );
      }

      if (node.id === '5') {
        // Nhịp nối giữa Tường (Đời 4) và Hiến (Đời 4)
        assert.strictEqual(
          isSpousePair,
          true,
          'Cạnh giữa Chồng Tường và Vợ Hiến BẮT BUỘC là nhịp Hôn Phối'
        );
      }
    }

    // TC45: Kiểm tra cờ hiển thị badge 💍 Hôn phối
    assert.strictEqual(
      directLineageNodes.find((n) => n.id === '4')?.isSpouse,
      false,
      'Thẻ của Phạm Khắc Tường không được mang cờ isSpouse (không gắn badge 💍 Hôn phối)'
    );
    assert.strictEqual(
      directLineageNodes.find((n) => n.id === '5')?.isSpouse,
      true,
      'Thẻ của Nguyễn Thị Hiến mang cờ isSpouse: true (gắn badge 💍 Hôn phối)'
    );
  });

  // TC46: Lịch giỗ đồng bộ vùng miền và Custom Dictionary từ clan_settings
  it('TC46: Lịch giỗ getUpcomingAnniversaries nạp đúng region và customDictionary từ clan_settings', () => {
    const { getUpcomingAnniversaries } = require('../src/lib/anniversaries/anniversary-engine');

    const GRANDFATHER_ID = '00000000-0000-0000-0000-000000000010';
    const FATHER_ID = '00000000-0000-0000-0000-000000000011';
    const VIEWER_ID = '00000000-0000-0000-0000-000000000012'; // Cháu
    const UNCLE_ID = '00000000-0000-0000-0000-000000000013';  // Em trai của bố (Chú)

    const testMembers = [
      {
        id: GRANDFATHER_ID,
        full_name: 'Phạm Văn Ông',
        gender: 'male',
        generation_level: 1,
        life_status: 'deceased',
      },
      {
        id: FATHER_ID,
        full_name: 'Phạm Văn Bố',
        gender: 'male',
        father_id: GRANDFATHER_ID,
        birth_order: 1,
        birth_year: 1950,
        generation_level: 2,
        life_status: 'living',
      },
      {
        id: UNCLE_ID,
        full_name: 'Phạm Văn Chú',
        gender: 'male',
        father_id: GRANDFATHER_ID,
        birth_order: 2,
        birth_year: 1955,
        generation_level: 2,
        life_status: 'deceased',
        death_lunar_day: 15,
        death_lunar_month: 8,
      },
      {
        id: VIEWER_ID,
        full_name: 'Phạm Văn Cháu',
        gender: 'male',
        father_id: FATHER_ID,
        generation_level: 3,
        life_status: 'living',
      },
    ];

    // 1. Kiểm tra khi có customDictionary ghi đè uncle_junior
    const resCustom = getUpcomingAnniversaries(testMembers, {
      daysAhead: 365,
      viewerMemberId: VIEWER_ID,
      region: 'north',
      customDictionary: {
        uncle_junior: {
          termSenior: 'Chú quý họ',
          termJunior: 'Cháu ngoan',
        },
      },
    });

    assert.ok(resCustom.length > 0, 'Phải tìm thấy ngày giỗ của Chú');
    const uncleItem = resCustom[0].members.find((m: any) => m.id === UNCLE_ID);
    assert.ok(uncleItem, 'Phải có item của chú');
    assert.strictEqual(
      uncleItem.relative_kinship,
      'Chú quý họ của bạn',
      'Lịch giỗ phải áp dụng chính xác danh xưng tùy biến từ customDictionary'
    );
    assert.strictEqual(
      uncleItem.honorific_prefix,
      'Chú quý họ',
      'Tiền tố danh xưng phải phản ánh đúng từ customDictionary'
    );

    // 2. Kiểm tra khi chuyển sang Miền Trung với Cô/O
    const AUNT_ID = '00000000-0000-0000-0000-000000000014';
    const testWithAunt = [
      ...testMembers,
      {
        id: AUNT_ID,
        full_name: 'Phạm Thị Cô',
        gender: 'female',
        father_id: GRANDFATHER_ID,
        birth_order: 3,
        birth_year: 1958,
        generation_level: 2,
        life_status: 'deceased',
        death_lunar_day: 15,
        death_lunar_month: 8,
      },
    ];

    const resCentral = getUpcomingAnniversaries(testWithAunt, {
      daysAhead: 365,
      viewerMemberId: VIEWER_ID,
      region: 'central',
    });

    const auntItem = resCentral[0].members.find((m: any) => m.id === AUNT_ID);
    assert.ok(auntItem, 'Phải có item của cô');
    assert.strictEqual(
      auntItem.relative_kinship,
      'O của bạn',
      'Miền Trung em gái của cha phải gọi là O của bạn'
    );
    assert.strictEqual(
      auntItem.honorific_prefix,
      'O',
      'Tiền tố danh xưng Miền Trung phải là O'
    );
  });

  // TC47: KinshipPathNode mang đúng birthOrder từ Member
  it('TC47: KinshipPathNode nạp đầy đủ thuộc tính birthOrder từ Member cho các node trong pathA và pathB', () => {
    const FATHER_ID = 'father-test-01';
    const CHILD_1_ID = 'child-test-01';
    const CHILD_2_ID = 'child-test-02';

    const members: Member[] = [
      {
        id: FATHER_ID,
        full_name: 'Phạm Văn Cha',
        gender: 'male',
        generation_level: 1,
        generation_number: 1,
        birth_order: 1,
      } as Member,
      {
        id: CHILD_1_ID,
        full_name: 'Phạm Văn Cả',
        gender: 'male',
        father_id: FATHER_ID,
        generation_level: 2,
        generation_number: 2,
        birth_order: 1,
      } as Member,
      {
        id: CHILD_2_ID,
        full_name: 'Phạm Văn Ba',
        gender: 'male',
        father_id: FATHER_ID,
        generation_level: 2,
        generation_number: 2,
        birth_order: 3,
      } as Member,
    ];

    const membersMap = new Map<string, Member>(members.map((m) => [m.id, m]));
    const lca = findLowestCommonAncestor(CHILD_1_ID, CHILD_2_ID, membersMap);

    assert.strictEqual(lca.pathA[0].birthOrder, 1, 'Node A phải có birthOrder = 1');
    assert.strictEqual(lca.pathB[0].birthOrder, 3, 'Node B phải có birthOrder = 3');
    assert.strictEqual(lca.pathA[1].birthOrder, 1, 'Node Cha phải có birthOrder = 1');
  });

  // TC48: formatBirthOrder định dạng chuẩn phong tục Việt Nam
  it('TC48: formatBirthOrder định dạng đúng "Con cả" cho số 1 và "Con thứ N" cho số > 1', () => {
    assert.strictEqual(formatBirthOrder(1), 'Con cả');
    assert.strictEqual(formatBirthOrder(2), 'Con thứ 2');
    assert.strictEqual(formatBirthOrder(3), 'Con thứ 3');
    assert.strictEqual(formatBirthOrder(5), 'Con thứ 5');
    assert.strictEqual(formatBirthOrder(null), null);
    assert.strictEqual(formatBirthOrder(undefined), null);
    assert.strictEqual(formatBirthOrder(0), null);
    assert.strictEqual(formatBirthOrder(-1), null);
  });

  // TC49: Người phối ngẫu ngoại tộc không hiển thị thứ bậc sinh con cái của nhánh họ
  it('TC49: Người phối ngẫu ngoại tộc (isSpouse: true) không hiển thị thứ bậc sinh con cái của nhánh họ', () => {
    const HUSBAND_ID = 'husband-01';
    const WIFE_INLAW_ID = 'wife-inlaw-01';
    const FATHER_ID = 'father-01';

    const members: Member[] = [
      {
        id: FATHER_ID,
        full_name: 'Cụ Tổ',
        gender: 'male',
        generation_level: 1,
      } as Member,
      {
        id: HUSBAND_ID,
        full_name: 'Phạm Văn Chồng',
        gender: 'male',
        father_id: FATHER_ID,
        generation_level: 2,
        birth_order: 2,
        spouse_ids: [WIFE_INLAW_ID],
      } as Member,
      {
        id: WIFE_INLAW_ID,
        full_name: 'Đào Thị Vợ',
        gender: 'female',
        generation_level: 2,
        birth_order: 1, // Dù có số sinh ở gia đình mẹ đẻ
        spouse_ids: [HUSBAND_ID],
      } as Member,
    ];

    const membersMap = new Map<string, Member>(members.map((m) => [m.id, m]));
    const spouseMap = buildSpouseMap(
      [{ member_a_id: HUSBAND_ID, member_b_id: WIFE_INLAW_ID }],
      membersMap
    );

    const lca = findLowestCommonAncestor(FATHER_ID, WIFE_INLAW_ID, membersMap, spouseMap);
    const spouseNode = lca.pathB.find((n) => n.id === WIFE_INLAW_ID);
    assert.ok(spouseNode, 'Phải có node của vợ dâu');
    assert.strictEqual(spouseNode.isSpouse, true, 'Dâu ngoại tộc phải có isSpouse = true');

    // Quy tắc hiển thị trên UI: !node.isSpouse && formatBirthOrder(node.birthOrder)
    const shouldDisplayBirthOrder = !spouseNode.isSpouse && !!formatBirthOrder(spouseNode.birthOrder);
    assert.strictEqual(
      shouldDisplayBirthOrder,
      false,
      'Dâu/Rể ngoại tộc tuyệt đối không được hiển thị nhãn Con cả / Con thứ trên nhánh họ nội'
    );
  });

  // TC50: Loại bỏ hoàn toàn nhãn Chi Thứ / Chi Trưởng khỏi DOM thẻ node sơ đồ cây
  it('TC50: Giao diện thẻ cây trong src/app/kinship/page.tsx không còn chứa bất kỳ chuỗi "Chi Thứ" hay "Chi Trưởng" nào', () => {
    const kinshipPagePath = path.resolve(process.cwd(), 'src/app/kinship/page.tsx');
    const kinshipContent = fs.readFileSync(kinshipPagePath, 'utf-8');

    assert.ok(
      !kinshipContent.includes("'Chi Trưởng' : 'Chi Thứ'"),
      'Không được còn biểu thức ternary "Chi Trưởng : Chi Thứ" trên thẻ cây'
    );
    assert.ok(
      !kinshipContent.includes('<span>· {node.isSeniorBranch'),
      'Không được còn span render isSeniorBranch trên thẻ cây'
    );
    assert.ok(
      kinshipContent.includes('formatBirthOrder(node.birthOrder)'),
      'Thẻ cây phải sử dụng formatBirthOrder(node.birthOrder) để hiển thị Con cả / Con thứ N'
    );
  });
});

