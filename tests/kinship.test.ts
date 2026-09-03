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
});
