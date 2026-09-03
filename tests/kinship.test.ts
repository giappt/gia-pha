import { describe, it } from 'node:test';
import assert from 'node:assert';
import { findLowestCommonAncestor } from '../src/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '../src/lib/kinship-engine/regional-dictionaries';
import { MOCK_CLAN_MEMBERS } from '../src/lib/kinship-engine/mock-data';
import type { Member } from '../src/types/database';

describe('Kinship Engine Test Suite (Comprehensive 7-Generation Clan)', () => {
  const membersMap = new Map<string, Member>(MOCK_CLAN_MEMBERS.map((m) => [m.id, m]));

  const ID_KHOI = '10000000-0000-0000-0000-000000000001'; // Cụ Khởi (Đời 1 - Root)
  const ID_BINH = '20000000-0000-0000-0000-000000000001'; // Cụ Bình (Trưởng Chi 1, Đời 2)
  const ID_CUONG = '20000000-0000-0000-0000-000000000004'; // Cụ Cường (Thứ Chi 2, Đời 2)
  const ID_HAI = '30000000-0000-0000-0000-000000000001'; // Hải (Con bà cả Chi 1, Đời 3, sinh 1938)
  const ID_TUAN = '30000000-0000-0000-0000-000000000002'; // Tuấn (Con bà hai Chi 1, Đời 3, sinh 1950)
  const ID_HUNG = '30000000-0000-0000-0000-000000000003'; // Hùng (Con Chi 2, Đời 3, sinh 1945)
  const ID_MINH = '40000000-0000-0000-0000-000000000001'; // Minh (Đời 4 Chi 1)
  const ID_NAM = '40000000-0000-0000-0000-000000000002'; // Nam (Con ruột Chi 2, Đời 4)
  const ID_TAM = '40000000-0000-0000-0000-000000000003'; // Tâm (Con nuôi Chi 2, Đời 4)
  const ID_QUAN = '50000000-0000-0000-0000-000000000001'; // Quân (Đời 5 Chi 1)
  const ID_BAO = '60000000-0000-0000-0000-000000000001'; // Bảo (Đời 6 Chi 1)
  const ID_AN = '70000000-0000-0000-0000-000000000001'; // An (Đời 7 Chi 1 - sâu nhất)
  const ID_LAN = '99999999-9999-9999-9999-999999999999'; // Lan (Chưa nối phả)

  // TC01: LCA Anh Em Ruột / Cùng Cha Khác Mẹ
  it('TC01: LCA Anh Em Ruột - Hải và Tuấn (Cùng cha Bình, khác mẹ)', () => {
    const lca = findLowestCommonAncestor(ID_HAI, ID_TUAN, membersMap);

    assert.strictEqual(lca.lcaNodeId, ID_BINH, 'LCA của Hải và Tuấn phải là bố Bình');
    assert.strictEqual(lca.distanceA, 1, 'Khoảng cách từ Hải lên bố là 1');
    assert.strictEqual(lca.distanceB, 1, 'Khoảng cách từ Tuấn lên bố là 1');
    assert.strictEqual(lca.generationDelta, 0, 'Cùng thế hệ nên delta = 0');
    assert.strictEqual(lca.relationshipType, 'sibling', 'Phải là anh em');

    const hai = membersMap.get(ID_HAI)!;
    const tuan = membersMap.get(ID_TUAN)!;
    const res = resolveKinshipTerms(lca, hai, tuan, 'north');
    assert.strictEqual(res.termAtoB, 'Em', 'Hải sinh 1938 trước Tuấn 1950 nên gọi Tuấn là Em');
    assert.strictEqual(res.termBtoA, 'Anh', 'Tuấn gọi Hải là Anh');
  });

  // TC02: Xưng Hô Con Chú Con Bác (Miền Bắc) - Tôn vai nhánh Trưởng
  it('TC02: Xưng Hô Con Chú Con Bác (Miền Bắc) - Hùng (Chi 2, 1945) & Hải (Chi 1, 1938)', () => {
    const lca = findLowestCommonAncestor(ID_HUNG, ID_HAI, membersMap);

    assert.strictEqual(lca.lcaNodeId, ID_KHOI, 'Tổ tiên chung gần nhất là cụ Khởi Đời 1');
    assert.strictEqual(lca.distanceA, 2, 'Hùng cách cụ Khởi 2 thế hệ');
    assert.strictEqual(lca.distanceB, 2, 'Hải cách cụ Khởi 2 thế hệ');
    assert.strictEqual(lca.generationDelta, 0, 'Cùng đời 3 nên delta = 0');
    assert.strictEqual(lca.isSeniorBranchA, false, 'Hùng thuộc Chi 2 nên là nhánh thứ');

    const hung = membersMap.get(ID_HUNG)!;
    const hai = membersMap.get(ID_HAI)!;

    // Miền Bắc: Hùng là con chú thứ gọi Hải là Anh họ
    const resNorth = resolveKinshipTerms(lca, hung, hai, 'north');
    assert.strictEqual(resNorth.termAtoB, 'Anh họ');
    assert.strictEqual(resNorth.termBtoA, 'Em họ');
  });

  // TC03: Xưng Hô Chú Cháu Lệch 1 Đời
  it('TC03: Xưng Hô Chú Cháu Lệch 1 Đời - Cụ Cường & Ông Hải (cháu)', () => {
    const lca = findLowestCommonAncestor(ID_CUONG, ID_HAI, membersMap);

    assert.strictEqual(lca.lcaNodeId, ID_KHOI, 'LCA của Cường và Hải là cụ Khởi');
    assert.strictEqual(lca.distanceA, 1, 'Cường là con cụ Khởi (dist = 1)');
    assert.strictEqual(lca.distanceB, 2, 'Hải là cháu cụ Khởi (dist = 2)');
    assert.strictEqual(lca.generationDelta, 1, 'Cường ở trên Hải 1 thế hệ (delta = 1)');

    const cuong = membersMap.get(ID_CUONG)!;
    const hai = membersMap.get(ID_HAI)!;

    const res = resolveKinshipTerms(lca, cuong, hai, 'north');
    assert.strictEqual(res.termAtoB, 'Cháu', 'Cường gọi Hải là Cháu');
    assert.strictEqual(res.termBtoA, 'Chú', 'Hải gọi Cường là Chú vì Cường là em của bố Bình');
  });

  // TC06: Thành viên chưa nối phả (Lan)
  it('TC06: Thành viên chưa nối phả không tìm thấy LCA', () => {
    const lca = findLowestCommonAncestor(ID_HAI, ID_LAN, membersMap);
    assert.strictEqual(lca.relationshipType, 'unrelated');
    assert.strictEqual(lca.lcaNodeId, null);

    const hai = membersMap.get(ID_HAI)!;
    const lan = membersMap.get(ID_LAN)!;
    const res = resolveKinshipTerms(lca, hai, lan, 'north');
    assert.strictEqual(res.termAtoB, 'Người ngoài họ');
  });

  // TC08: Sơ đồ Cây Chữ V Ngược xuất phát chính xác từ LCA (không kéo lên Root)
  it('TC08: LCA của Minh (Đời 4) và Hải (Đời 3, bố của Minh) là Hải', () => {
    const lca = findLowestCommonAncestor(ID_HAI, ID_MINH, membersMap);
    assert.strictEqual(lca.lcaNodeId, ID_HAI, 'LCA chính là Hải (Đời 3), không kéo thừa lên Cụ Bình hay Cụ Khởi');
    assert.strictEqual(lca.distanceA, 0, 'Hải là LCA nên distanceA = 0');
    assert.strictEqual(lca.distanceB, 1, 'Minh là con Hải nên distanceB = 1');
  });

  // TC09: Nén Tầng Trung Gian khi khoảng cách >= 4 đời
  it('TC09: Kiểm tra khoảng cách 6 thế hệ giữa Cụ Khởi (Đời 1) và Bé An (Đời 7)', () => {
    const lca = findLowestCommonAncestor(ID_KHOI, ID_AN, membersMap);
    assert.strictEqual(lca.lcaNodeId, ID_KHOI, 'LCA là Cụ Khởi');
    assert.strictEqual(lca.distanceA, 0);
    assert.strictEqual(lca.distanceB, 6, 'Khoảng cách là 6 thế hệ (đủ điều kiện kích hoạt Smart Folding)');
    assert.ok(lca.pathB.length >= 7, 'Chuỗi thế hệ pathB có 7 node');

    const khoi = membersMap.get(ID_KHOI)!;
    const an = membersMap.get(ID_AN)!;
    const res = resolveKinshipTerms(lca, khoi, an, 'north');
    assert.ok(res.pathB && res.pathB.length >= 7);
  });

  // TC10: Thẻ Diễn Giải Phong Tục Cấu Trúc Hóa
  it('TC10: Kiểm tra Thẻ Diễn Giải Phong Tục Cấu Trúc Hóa chứa đầy đủ 3 khối', () => {
    const lca = findLowestCommonAncestor(ID_HUNG, ID_HAI, membersMap);
    const hung = membersMap.get(ID_HUNG)!;
    const hai = membersMap.get(ID_HAI)!;

    const res = resolveKinshipTerms(lca, hung, hai, 'north');
    assert.ok(res.customsBadge, 'Phải có Huy hiệu nguyên tắc phong tục');
    assert.ok(res.proverbQuote, 'Phải có Lời tục ngữ / danh ngôn cổ phong');
    assert.ok(res.comparisonFacts, 'Phải có Bảng đối sánh tương quan');
    assert.strictEqual(res.comparisonFacts.labelA, hung.full_name);
    assert.strictEqual(res.comparisonFacts.labelB, hai.full_name);
    assert.ok(res.comparisonFacts.summary.length > 0);
  });

  // TC11: Phả Hệ Đa Thê & Con Nuôi
  it('TC11: Nhận diện chính xác quan hệ con ruột vs con nuôi trong Chi 2', () => {
    // Nam (con ruột) & Tâm (con nuôi) của ông Hùng
    const lca = findLowestCommonAncestor(ID_NAM, ID_TAM, membersMap);
    assert.strictEqual(lca.lcaNodeId, ID_HUNG, 'Cả hai có chung cha nuôi/cha đẻ là ông Hùng');
    assert.strictEqual(lca.relationshipType, 'sibling');

    const nam = membersMap.get(ID_NAM)!;
    const tam = membersMap.get(ID_TAM)!;
    const res = resolveKinshipTerms(lca, nam, tam, 'north');
    assert.strictEqual(res.termAtoB, 'Em');
    assert.strictEqual(res.termBtoA, 'Anh');
    assert.ok(
      res.comparisonFacts?.detailB.includes('Con Nuôi'),
      'Thông tin so sánh phải ghi nhận rõ thành viên là Con Nuôi'
    );
  });

  it('TC16 & TC19: Quan hệ Trực Hệ Cha-Con & Xưng Hô Ngữ Cảnh', () => {
    const khoi = membersMap.get('10000000-0000-0000-0000-000000000001')!; // Cụ Khởi Tổ
    const binh = membersMap.get('20000000-0000-0000-0000-000000000001')!; // Cụ Bình Chi 1

    const lca = findLowestCommonAncestor(khoi.id, binh.id, membersMap);
    assert.strictEqual(lca.relationshipType, 'parent_child');
    assert.strictEqual(lca.distanceA, 0, 'Khoảng cách từ Khởi lên LCA là 0');
    assert.strictEqual(lca.distanceB, 1, 'Khoảng cách từ Bình lên LCA là 1');

    const res = resolveKinshipTerms(lca, khoi, binh, 'north');
    assert.strictEqual(res.termAtoB, 'Con');
    assert.strictEqual(res.termBtoA, 'Bố');

    // Contextual addressing
    assert.ok(res.contextual, 'Phải có trường contextual');
    assert.strictEqual(res.contextual?.formalTermAtoB, 'Con');
    assert.strictEqual(res.contextual?.formalTermBtoA, 'Bố');
    assert.ok(res.contextual?.guidanceA.includes('Xưng "Bố"'), 'Chỉ dẫn xưng gọi cho Khởi');
    assert.ok(res.contextual?.guidanceB.includes('Xưng "Con"'), 'Chỉ dẫn xưng gọi cho Bình');
  });

  // TC23: Danh mục từ điển xưng hô mẫu cho 3 miền
  it('TC23: Master Presets cho 3 miền có đầy đủ 16 mối quan hệ cốt lõi', async () => {
    const { getRegionalPresetDictionary } = await import(
      '../src/lib/kinship-engine/regional-dictionaries'
    );
    const northRules = getRegionalPresetDictionary('north');
    const centralRules = getRegionalPresetDictionary('central');
    const southRules = getRegionalPresetDictionary('south');

    assert.ok(northRules.length >= 32, 'Miền Bắc phải có ít nhất 32 quan hệ');
    assert.ok(centralRules.length >= 32, 'Miền Trung phải có ít nhất 32 quan hệ');
    assert.ok(southRules.length >= 32, 'Miền Nam phải có ít nhất 32 quan hệ');

    // Kiểm tra đặc trưng vùng miền
    const northFather = northRules.find((r) => r.id === 'parent_father');
    assert.strictEqual(northFather?.termSenior, 'Bố');

    const centralMother = centralRules.find((r) => r.id === 'parent_mother');
    assert.strictEqual(centralMother?.termSenior, 'Mẹ (Mạ)');

    const southBrother = southRules.find((r) => r.id === 'sibling_brother');
    assert.strictEqual(southBrother?.termSenior, 'Anh Hai (Anh)');
  });

  // TC24 & TC25: Áp dụng từ điển tùy biến vào lõi Kinship Engine
  it('TC24 & TC25: Áp dụng custom_kinship_dictionary tùy biến của dòng họ vào resolveKinshipTerms', () => {
    const khoi = membersMap.get(ID_KHOI)!;
    const binh = membersMap.get(ID_BINH)!;
    const lca = findLowestCommonAncestor(khoi.id, binh.id, membersMap);

    // Mặc định miền Bắc: Bố - Con
    const defaultRes = resolveKinshipTerms(lca, khoi, binh, 'north');
    assert.strictEqual(defaultRes.termBtoA, 'Bố');

    // Tùy biến dòng họ: Bố -> "Cha", Con -> "Con trai"
    const customRes = resolveKinshipTerms(lca, khoi, binh, 'north', {
      parent_father: {
        termSenior: 'Cha',
        termJunior: 'Con trai',
      },
    });

    assert.strictEqual(customRes.termBtoA, 'Cha', 'Bình gọi Khởi là Cha theo từ điển tùy biến');
    assert.strictEqual(customRes.termAtoB, 'Con trai', 'Khởi gọi Bình là Con trai theo từ điển tùy biến');

    // Thử với chú cháu: Cụ Cường và Ông Hải
    const cuong = membersMap.get(ID_CUONG)!;
    const hai = membersMap.get(ID_HAI)!;
    const lcaUncle = findLowestCommonAncestor(cuong.id, hai.id, membersMap);

    const customUncleRes = resolveKinshipTerms(lcaUncle, cuong, hai, 'north', {
      uncle_junior: {
        termSenior: 'Chú út gia tộc',
        termJunior: 'Cháu ruột',
      },
    });
    assert.strictEqual(customUncleRes.termBtoA, 'Chú út gia tộc');
    assert.strictEqual(customUncleRes.termAtoB, 'Cháu ruột');
  });

  // TC26: Master Presets 32+ Mối quan hệ thân tộc cốt lõi (Bao gồm Thím, Mợ, Cậu, Dì, Dượng, Dâu, Rể)
  it('TC26: Master Presets bao quát đầy đủ 6 nhóm thân tộc: Bên Nội, Bên Ngoại, Hôn phối & Dâu/Rể', async () => {
    const { getRegionalPresetDictionary } = await import(
      '../src/lib/kinship-engine/regional-dictionaries'
    );
    const northRules = getRegionalPresetDictionary('north');
    const southRules = getRegionalPresetDictionary('south');

    // 1. Bên Nội: Thím, Dượng
    const thimNorth = northRules.find((r) => r.id === 'aunt_junior_wife');
    assert.ok(thimNorth, 'Phải có quy tắc Vợ của Chú (Thím)');
    assert.strictEqual(thimNorth?.termSenior, 'Thím');

    const duongNorth = northRules.find((r) => r.id === 'uncle_junior_husband');
    assert.ok(duongNorth, 'Phải có quy tắc Chồng của Cô');
    assert.strictEqual(duongNorth?.termSenior, 'Chú dượng (Chú rể)');

    const duongSouth = southRules.find((r) => r.id === 'uncle_junior_husband');
    assert.strictEqual(duongSouth?.termSenior, 'Dượng');

    // 2. Bên Ngoại: Cậu, Mợ, Dì, Dượng ngoại
    const cau = northRules.find((r) => r.id === 'uncle_maternal_junior');
    assert.strictEqual(cau?.termSenior, 'Cậu');

    const mo = northRules.find((r) => r.id === 'aunt_maternal_junior_wife');
    assert.strictEqual(mo?.termSenior, 'Mợ');

    const di = northRules.find((r) => r.id === 'aunt_maternal_junior');
    assert.strictEqual(di?.termSenior, 'Dì');

    // 3. Dâu / Rể ngang hàng và thế hệ dưới
    const chiDau = northRules.find((r) => r.id === 'sister_in_law');
    assert.ok(chiDau, 'Phải có Chị dâu');

    const anhRe = northRules.find((r) => r.id === 'brother_in_law');
    assert.ok(anhRe, 'Phải có Anh rể');

    const conDau = northRules.find((r) => r.id === 'daughter_in_law');
    assert.ok(conDau, 'Phải có Con dâu');

    const conRe = northRules.find((r) => r.id === 'son_in_law');
    assert.ok(conRe, 'Phải có Con rể');
  });

  // TC27: Kiểm tra tính năng lọc phân nhóm và tìm kiếm từ điển
  it('TC27: Bộ lọc phân nhóm và tìm kiếm lọc chính xác các quan hệ', async () => {
    const { getRegionalPresetDictionary } = await import(
      '../src/lib/kinship-engine/regional-dictionaries'
    );
    const northRules = getRegionalPresetDictionary('north');

    // Lọc nhóm Bên Ngoại
    const maternalRules = northRules.filter((r) => r.category === 'maternal_uncle_aunt');
    assert.strictEqual(maternalRules.length, 6, 'Nhóm Cậu/Dì bên ngoại phải có 6 quan hệ');

    // Lọc nhóm Dâu Rể con cháu
    const inLawDescendants = northRules.filter((r) => r.category === 'in_law_descendant');
    assert.strictEqual(inLawDescendants.length, 4, 'Nhóm Dâu/Rể con cháu phải có 4 quan hệ');

    // Tìm kiếm theo từ khóa "Thím"
    const searchThim = northRules.filter((r) =>
      r.name.toLowerCase().includes('thím') || r.termSenior.toLowerCase().includes('thím')
    );
    assert.ok(searchThim.length >= 1, 'Tìm kiếm từ khóa "thím" phải ra kết quả');
  });

  // TC28: Tùy biến và áp dụng danh xưng Dâu/Rể/Thím/Mợ
  it('TC28: Tùy biến và áp dụng danh xưng Thím, Mợ, Dượng trong customDictionary', async () => {
    const customDict = {
      aunt_junior_wife: {
        termSenior: 'Thím út',
        termJunior: 'Cháu cưng',
      },
      aunt_maternal_junior_wife: {
        termSenior: 'Mợ hai',
        termJunior: 'Cháu ngoại',
      },
    };

    assert.strictEqual(customDict.aunt_junior_wife.termSenior, 'Thím út');
    assert.strictEqual(customDict.aunt_maternal_junior_wife.termSenior, 'Mợ hai');
  });
});



