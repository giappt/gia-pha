import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateTreeLayout, NODE_WIDTH, NODE_HEIGHT, SPOUSE_GAP, LEVEL_HEIGHT } from '../src/lib/tree-layout/genealogy-layout';
import { SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS } from './fixtures/sample-clan-28';
import { MemberRecord, SpouseRelationRecord } from '../src/types/tree';

describe('Genealogy Tree Layout Engine Test Suite', () => {
  // TC_UT01: Phân tầng thế hệ & Zero-collision
  it('TC_UT01: Phân tầng thế hệ Y chuẩn và không chồng chéo tọa độ X giữa các node cùng thế hệ', () => {
    const { nodes, edges } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS);

    assert.ok(nodes.length > 0, 'Phải sinh ra danh sách nodes');
    assert.ok(edges.length > 0, 'Phải sinh ra danh sách edges');

    // Kiểm tra phân tầng thế hệ theo Y
    nodes.forEach((node) => {
      const expectedY = (node.data.generationLevel - 1) * LEVEL_HEIGHT;
      assert.strictEqual(
        node.position.y,
        expectedY,
        `Node ${node.data.fullName} (Đời ${node.data.generationLevel}) phải có Y = ${expectedY}`
      );
    });

    // Gom nhóm các node theo từng thế hệ (Y) để kiểm tra va chạm tọa độ X
    const nodesByLevel = new Map<number, typeof nodes>();
    nodes.forEach((node) => {
      const list = nodesByLevel.get(node.position.y) || [];
      list.push(node);
      nodesByLevel.set(node.position.y, list);
    });

    nodesByLevel.forEach((levelNodes, y) => {
      // Sắp xếp theo tọa độ X tăng dần
      levelNodes.sort((a, b) => a.position.x - b.position.x);

      for (let i = 0; i < levelNodes.length - 1; i++) {
        const current = levelNodes[i];
        const next = levelNodes[i + 1];

        const minNextX = current.position.x + NODE_WIDTH;
        assert.ok(
          next.position.x >= minNextX,
          `Va chạm tọa độ tại Y=${y}: Node "${current.data.fullName}" (X=${current.position.x}) và Node "${next.data.fullName}" (X=${next.position.x}) bị đè nhau! Khoảng cách tối thiểu phải là ${minNextX}`
        );
      }
    });
  });

  // TC_UT02: Khoảng cách tọa độ cặp vợ chồng (Spouse Offset)
  it('TC_UT02: Người phối ngẫu được đặt kề bên phải người chính đúng khoảng cách NODE_WIDTH + 20px', () => {
    const { nodes } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS);

    // Kiểm tra cặp Cụ Tổ: Khởi và Tổ
    const nodeKhoi = nodes.find((n) => n.id === 'm-root-khoi');
    const nodeTo = nodes.find((n) => n.id === 'm-root-to');

    assert.ok(nodeKhoi, 'Phải tìm thấy node Cụ Khởi');
    assert.ok(nodeTo, 'Phải tìm thấy node Cụ Tổ');

    const expectedToX = nodeKhoi.position.x + NODE_WIDTH + SPOUSE_GAP;
    assert.strictEqual(nodeTo.position.x, expectedToX, 'Node Cụ Tổ phải đặt kề bên phải Cụ Khởi đúng offset');
    assert.strictEqual(nodeTo.position.y, nodeKhoi.position.y, 'Hai vợ chồng phải cùng tọa độ Y');

    // Kiểm tra cặp Chi 1: Trưởng và Hoa
    const nodeTruong = nodes.find((n) => n.id === 'm-gen2-truong');
    const nodeHoa = nodes.find((n) => n.id === 'm-gen2-hoa');
    assert.ok(nodeTruong && nodeHoa, 'Phải tìm thấy cặp Trưởng - Hoa');
    assert.strictEqual(nodeHoa.position.x, nodeTruong.position.x + NODE_WIDTH + SPOUSE_GAP);
    assert.strictEqual(nodeHoa.position.y, nodeTruong.position.y);
  });

  // TC_UT03: Nhận diện hôn nhân nội tộc & Sinh Ghost Node đối xứng 2 chiều
  it('TC_UT03: Nhận diện hôn nhân nội tộc sinh GhostNode đối xứng 2 chiều (Dâu nội tộc bên chồng & Rể nội tộc bên vợ)', () => {
    const { nodes } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS);

    // 28 thành viên thực thể + 2 Ghost Nodes phản chiếu = 30 nodes
    assert.strictEqual(
      nodes.length,
      30,
      `Tổng số node trên canvas phải là 30 (28 thực thể + 2 GhostNodes), thực tế nhận được: ${nodes.length}`
    );

    // Tìm 2 GhostNodes của cặp hôn nhân nội tộc Tuấn - Mai
    const ghostNodes = nodes.filter((n) => n.data.isGhost === true);
    assert.strictEqual(ghostNodes.length, 2, 'Phải sinh đúng 2 GhostNodes đối xứng cho cặp hôn nhân nội tộc');

    // 1. GhostNode của Nguyễn Thị Mai (Chi 2) làm Dâu nội tộc bên chồng Tuấn (Chi 1)
    const ghostMai = ghostNodes.find((n) => n.data.originalMemberId === 'm-gen4-mai-noi-toc');
    assert.ok(ghostMai, 'Phải có GhostNode của Nguyễn Thị Mai bên Chi 1');
    assert.strictEqual(ghostMai.type, 'ghostNode');
    assert.strictEqual(ghostMai.data.partnerMemberId, 'm-gen4-tuan');
    assert.strictEqual(ghostMai.data.inlawRole, 'daughter_in_law');

    // 2. GhostNode của Nguyễn Văn Tuấn (Chi 1) làm Rể nội tộc bên vợ Mai (Chi 2)
    const ghostTuan = ghostNodes.find((n) => n.data.originalMemberId === 'm-gen4-tuan');
    assert.ok(ghostTuan, 'Phải có GhostNode của Nguyễn Văn Tuấn bên Chi 2');
    assert.strictEqual(ghostTuan.type, 'ghostNode');
    assert.strictEqual(ghostTuan.data.partnerMemberId, 'm-gen4-mai-noi-toc');
    assert.strictEqual(ghostTuan.data.inlawRole, 'son_in_law');

    // Node gốc của Mai vẫn phải tồn tại độc lập và có metadata internalSpouse
    const originalMai = nodes.find((n) => n.id === 'm-gen4-mai-noi-toc');
    assert.ok(originalMai, 'Node thực thể gốc của Nguyễn Thị Mai vẫn phải tồn tại');
    assert.strictEqual(originalMai.data.isGhost, false, 'Node gốc không được đánh dấu là Ghost');
    assert.ok(originalMai.data.internalSpouse, 'Node gốc của Mai phải có internalSpouse trỏ về Tuấn');
    assert.strictEqual(originalMai.data.internalSpouse.id, 'm-gen4-tuan');
    assert.strictEqual(originalMai.data.internalSpouse.fullName, 'Nguyễn Văn Tuấn');
  });

  // TC_UT04: Cấu trúc Edge: Nối ngang phẳng phiu & Nối nhánh con thước thợ FamilyBusEdge
  it('TC_UT04: Edge hôn phối nối ngang phẳng phiu qua handles hông; Edge con cái nối vuông góc 90 độ từ trung điểm', () => {
    const { edges } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS);

    // Lọc các edge hôn phối thông thường
    const marriageEdges = edges.filter((e) => e.data?.relationType === 'marriage');
    assert.ok(marriageEdges.length > 0, 'Phải có các cạnh hôn phối thông thường');
    marriageEdges.forEach((e) => {
      assert.strictEqual(e.type, 'straight', `Edge ${e.id} phải có type straight`);
      assert.strictEqual(e.sourceHandle, 'spouse-right', `Edge ${e.id} phải xuất phát từ handle spouse-right`);
      assert.strictEqual(e.targetHandle, 'spouse-left', `Edge ${e.id} phải đến handle spouse-left`);
      assert.strictEqual(e.style?.stroke, '#059669', `Edge ${e.id} phải có stroke màu xanh ngọc bích #059669`);
    });

    // Lọc edge hôn phối nội tộc (Ghost)
    const ghostMarriageEdges = edges.filter((e) => e.data?.relationType === 'marriage_ghost');
    assert.strictEqual(ghostMarriageEdges.length, 2, 'Phải có 2 cạnh hôn phối nội tộc tương ứng với 2 Ghost Nodes');
    ghostMarriageEdges.forEach((e) => {
      assert.strictEqual(e.type, 'straight', `Ghost edge ${e.id} phải có type straight`);
      assert.strictEqual(e.style?.stroke, '#059669', `Ghost edge ${e.id} phải có stroke màu xanh ngọc bích #059669`);
    });

    // Lọc các edge con cái (lineage)
    const lineageEdges = edges.filter((e) => e.data?.relationType === 'lineage');
    assert.ok(lineageEdges.length > 0, 'Phải có các cạnh nối xuống con cái');
    lineageEdges.forEach((e) => {
      assert.strictEqual(e.type, 'familyBusEdge', `Lineage edge ${e.id} phải có type familyBusEdge`);
      assert.strictEqual(e.targetHandle, 'parent-top', `Lineage edge ${e.id} phải cắm vào parent-top của con`);
      assert.strictEqual(e.sourceHandle, 'children-joint', `Lineage edge ${e.id} phải xuất phát từ children-joint`);
    });
  });

  // TC_UT05: Tùy chọn Ẩn/Hiện nhánh ngoại (showMaternalBranches)
  it('TC_UT05: Tùy chọn showMaternalBranches = false ẩn rể ngoại và nạp externalSpouse cho con gái', () => {
    const { nodes } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS, {
      showMaternalBranches: false,
    });

    // Trong fixture: Nguyễn Thị Quỳnh lấy Trần Văn Hùng (ngoại tộc)
    // Khi showMaternalBranches = false: Hùng bị ẩn khỏi nodes
    const nodeHung = nodes.find((n) => n.id === 'm-gen4-hung');
    assert.strictEqual(nodeHung, undefined, 'Rể ngoại Trần Văn Hùng phải được ẩn khi showMaternalBranches = false');

    // Thẻ Quỳnh vẫn tồn tại và có externalSpouse chứa tên Hùng
    const nodeQuynh = nodes.find((n) => n.id === 'm-gen4-quynh');
    assert.ok(nodeQuynh, 'Node con gái Nguyễn Thị Quỳnh vẫn phải tồn tại');
    assert.ok(nodeQuynh.data.externalSpouse, 'Quỳnh phải có externalSpouse');
    assert.strictEqual(nodeQuynh.data.externalSpouse.fullName, 'Trần Văn Hùng');
  });

  // TC_UT06: Sắp xếp con cái theo birth_order trước, rồi đến birth_year (kể cả khi không rõ năm sinh)
  it('TC_UT06: Sắp xếp đàn con chuẩn ngôi thứ theo birth_order từ trái sang phải kể cả khi không rõ năm sinh', () => {
    // Giả lập 1 gia đình có 3 con: năm sinh không rõ nhưng có birth_order
    const mockParent: MemberRecord = {
      id: 'p-1',
      full_name: 'Ông Cha',
      gender: 'male',
      life_status: 'living',
      generation_level: 1,
      is_root: true,
    };
    const child3: MemberRecord = {
      id: 'c-3',
      full_name: 'Con Ba (Út)',
      gender: 'male',
      life_status: 'living',
      father_id: 'p-1',
      generation_level: 2,
      birth_order: 3,
      birth_year: null, // Không rõ năm sinh
      is_root: false,
    };
    const child1: MemberRecord = {
      id: 'c-1',
      full_name: 'Con Cả',
      gender: 'male',
      life_status: 'living',
      father_id: 'p-1',
      generation_level: 2,
      birth_order: 1,
      birth_year: null, // Không rõ năm sinh
      is_root: false,
    };
    const child2: MemberRecord = {
      id: 'c-2',
      full_name: 'Con Hai',
      gender: 'male',
      life_status: 'living',
      father_id: 'p-1',
      generation_level: 2,
      birth_order: 2,
      birth_year: null, // Không rõ năm sinh
      is_root: false,
    };

    // Đưa vào mảng theo thứ tự lộn xộn: child3, child1, child2
    const { nodes } = calculateTreeLayout([mockParent, child3, child1, child2], []);

    const node1 = nodes.find((n) => n.id === 'c-1')!;
    const node2 = nodes.find((n) => n.id === 'c-2')!;
    const node3 = nodes.find((n) => n.id === 'c-3')!;

    // Kiểm tra thứ tự tọa độ X từ trái sang phải: Con Cả < Con Hai < Con Ba
    assert.ok(node1.position.x < node2.position.x, 'Con Cả phải đứng bên trái Con Hai');
    assert.ok(node2.position.x < node3.position.x, 'Con Hai phải đứng bên trái Con Ba');
  });

  // TC_UT07: Cơ chế Gốc Tùy Biến (Focus Root) & Tự Đổi Vai (Dâu/Rể, Cháu nội/ngoại)
  it('TC_UT07: Khi chọn Gốc là Ông Dũng Chi 2, lọc cây con và tự động đổi vai Tuấn làm Con rể, con của Mai làm Cháu ngoại', () => {
    // Thêm 1 người con của cặp Tuấn - Mai ở Đời 5 để kiểm tra vai trò Cháu ngoại
    const childOfMai: MemberRecord = {
      id: 'm-gen5-bao',
      full_name: 'Nguyễn Quốc Bảo',
      gender: 'male',
      life_status: 'living',
      father_id: 'm-gen4-tuan',
      mother_id: 'm-gen4-mai-noi-toc',
      birth_year: 2020,
      generation_level: 5,
      is_root: false,
    };

    const { nodes } = calculateTreeLayout([...SAMPLE_MEMBERS_28, childOfMai], SAMPLE_SPOUSE_RELATIONS, {
      focusRootId: 'm-gen3-dung',
    });

    // 1. Cây con chỉ gồm các hậu duệ của Ông Dũng (Đời 3, 4, 5)
    assert.ok(nodes.length > 0, 'Phải sinh ra cây con của Ông Dũng');
    const nodeDung = nodes.find((n) => n.id === 'm-gen3-dung');
    assert.ok(nodeDung, 'Phải có node Gốc Ông Dũng');

    // 2. Không chứa các thành viên thuộc Chi 1 ở tầng trên (như Cụ Khởi hay Cụ Trưởng)
    const nodeKhoi = nodes.find((n) => n.id === 'm-root-khoi');
    assert.strictEqual(nodeKhoi, undefined, 'Cụ Khởi không thuộc cây con của Ông Dũng');

    // 3. Nguyễn Thị Mai là con gái ruột của Ông Dũng
    const nodeMai = nodes.find((n) => n.id === 'm-gen4-mai-noi-toc');
    assert.ok(nodeMai, 'Phải có node con gái Nguyễn Thị Mai');

    // 4. Tuấn (chồng Mai) xuất hiện trong cây với danh phận Con rể (son_in_law)
    const nodeTuan = nodes.find((n) => n.id === 'm-gen4-tuan');
    assert.ok(nodeTuan, 'Phải có node Tuấn bên cạnh Mai');
    assert.strictEqual(nodeTuan.data.inlawRole, 'son_in_law', 'Tuấn phải được gán vai trò Con rể');

    // 5. Bầy con của Mai & Tuấn được vẽ và mang vai trò Cháu ngoại (maternal_grandchild)
    const nodeBao = nodes.find((n) => n.id === 'm-gen5-bao');
    assert.ok(nodeBao, 'Bầy con (Bảo) phải xuất hiện trong gia phả Chi 2 dưới chân mẹ Mai');
    assert.strictEqual(nodeBao.data.childRole, 'maternal_grandchild', 'Bảo phải mang vai trò Cháu ngoại của Chi 2');
  });

  // TC_UT08: Tự động xác định Con Trưởng (Trưởng Nam)
  it('TC_UT08: Tự động suy luận con trai lớn nhất là Trưởng Nam (kể cả sau chị gái) và hỗ trợ gán thủ công', () => {
    // 1. Cụ Trưởng là con trai lớn nhất của Cụ Khởi
    const { nodes: standardNodes } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS);
    const nodeTruong = standardNodes.find((n) => n.id === 'm-gen2-truong');
    assert.ok(nodeTruong, 'Phải có node Cụ Trưởng');
    assert.strictEqual(nodeTruong.data.isSenior, true, 'Cụ Trưởng phải được xác định là Con Trưởng (isSenior = true)');

    const nodeThu = standardNodes.find((n) => n.id === 'm-gen2-thu');
    assert.ok(nodeThu, 'Phải có node Cụ Thứ');
    assert.strictEqual(nodeThu.data.isSenior, false, 'Cụ Thứ là con thứ, không phải Trưởng Nam (isSenior = false)');

    // 2. Trường hợp con gái đầu lòng (order 1), con trai sinh sau (order 2) -> con trai vẫn là Trưởng Nam
    const customFamily: MemberRecord[] = [
      {
        id: 'father',
        full_name: 'Bố Gia Đình',
        gender: 'male',
        life_status: 'living',
        generation_level: 1,
        is_root: true,
      },
      {
        id: 'daughter-1',
        full_name: 'Chị Cả',
        gender: 'female',
        life_status: 'living',
        father_id: 'father',
        birth_order: 1,
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'son-2',
        full_name: 'Em Trai Trưởng',
        gender: 'male',
        life_status: 'living',
        father_id: 'father',
        birth_order: 2,
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'son-3',
        full_name: 'Em Trai Út',
        gender: 'male',
        life_status: 'living',
        father_id: 'father',
        birth_order: 3,
        generation_level: 2,
        is_root: false,
      },
    ];

    const { nodes: customNodes } = calculateTreeLayout(customFamily, []);
    const nodeSon2 = customNodes.find((n) => n.id === 'son-2');
    const nodeSon3 = customNodes.find((n) => n.id === 'son-3');
    const nodeDaughter1 = customNodes.find((n) => n.id === 'daughter-1');

    assert.strictEqual(nodeSon2?.data.isSenior, true, 'Con trai thứ 2 sinh sau chị gái vẫn là Trưởng Nam (isSenior = true)');
    assert.strictEqual(nodeSon3?.data.isSenior, false, 'Con trai thứ 3 là con thứ (isSenior = false)');
    assert.strictEqual(nodeDaughter1?.data.isSenior, false, 'Chị gái không nhận cờ Trưởng Nam');
  });

  // TC_UT09: Ghost Node Rể nội tộc bên phía người vợ (showInternalHusbands = true)
  it('TC_UT09: Khi showInternalHusbands = true, sinh Ghost Node cho chồng (Tuấn) bên cạnh vợ (Mai) tại Chi 2, đặt bên trái theo quy ước Nam tả Nữ hữu, không nhân đôi số đinh', () => {
    const { nodes, edges } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS, {
      showInternalHusbands: true,
    });

    const ghostTuan = nodes.find((n) => n.id === 'ghost-m-gen4-tuan-partner-m-gen4-mai-noi-toc');
    const nodeMai = nodes.find((n) => n.id === 'm-gen4-mai-noi-toc');

    assert.ok(ghostTuan, 'Phải có Ghost Node của Tuấn bên cạnh Mai tại Chi 2');
    assert.ok(nodeMai, 'Phải có node Mai tại Chi 2');

    // Kiểm tra quy ước Nam tả Nữ hữu: Tuấn (chồng) ở bên TRÁI, Mai (vợ) ở bên PHẢI
    assert.ok(
      ghostTuan.position.x < nodeMai.position.x,
      `Chồng (${ghostTuan.position.x}) phải đứng bên trái vợ (${nodeMai.position.x})`
    );
    assert.strictEqual(
      nodeMai.position.x,
      ghostTuan.position.x + NODE_WIDTH + SPOUSE_GAP,
      'Khoảng cách giữa Tuấn và Mai phải đúng bằng NODE_WIDTH + SPOUSE_GAP (220px)'
    );
    assert.strictEqual(ghostTuan.position.y, nodeMai.position.y, 'Hai người phải cùng cao độ Y');

    // Cạnh hôn phối nối ngang phẳng phiu từ Tuấn sang Mai
    const marriageEdge = edges.find((e) => e.id === `marriage-${ghostTuan.id}-${nodeMai.id}`);
    assert.ok(marriageEdge, 'Phải có cạnh hôn phối nối từ Ghost Tuấn sang Mai');
    assert.strictEqual(marriageEdge.source, ghostTuan.id);
    assert.strictEqual(marriageEdge.target, nodeMai.id);
    assert.strictEqual(marriageEdge.sourceHandle, 'spouse-right');
    assert.strictEqual(marriageEdge.targetHandle, 'spouse-left');
    assert.strictEqual(marriageEdge.type, 'straight');
    assert.strictEqual(marriageEdge.style?.stroke, '#059669');

    // Không nhân đôi số đinh: Không có con cái dưới Chi 2 của Mai
    assert.strictEqual(nodeMai.data.childCount, 0, 'Chi 2 của Mai không được vẽ con cái để tránh nhân đôi số đinh');
  });

  // TC_UT10: Tùy chọn ẩn Ghost Node Rể nội tộc (showInternalHusbands = false)
  it('TC_UT10: Khi showInternalHusbands = false, ẩn Ghost Node của chồng tại Chi 2, thẻ vợ hiển thị footer điều hướng gọn gàng', () => {
    const { nodes } = calculateTreeLayout(SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS, {
      showInternalHusbands: false,
    });

    // 1. Không có Ghost Node Tuấn ở Chi 2
    const ghostTuan = nodes.find((n) => n.id === 'ghost-m-gen4-tuan-partner-m-gen4-mai-noi-toc');
    assert.strictEqual(ghostTuan, undefined, 'Không được sinh Ghost Node Tuấn ở Chi 2 khi showInternalHusbands = false');

    // 2. Chỉ có đúng 1 Ghost Node trên toàn cây (Mai ở Chi 1)
    const ghostNodes = nodes.filter((n) => n.data.isGhost === true);
    assert.strictEqual(ghostNodes.length, 1, 'Chỉ có 1 Ghost Node (Mai ở Chi 1)');
    assert.strictEqual(nodes.length, 29, 'Tổng số node là 29 (28 thực thể + 1 Ghost Node Mai)');

    // 3. Thẻ Mai ở Chi 2 hiển thị thông tin internalSpouse để điều hướng sang Chi 1
    const nodeMai = nodes.find((n) => n.id === 'm-gen4-mai-noi-toc')!;
    assert.ok(nodeMai, 'Node Mai vẫn phải tồn tại');
    assert.ok(nodeMai.data.internalSpouse, 'Thẻ Mai phải có thông tin internalSpouse');
    assert.strictEqual(nodeMai.data.internalSpouse.id, 'm-gen4-tuan');
    assert.strictEqual(nodeMai.data.internalSpouse.fullName, 'Nguyễn Văn Tuấn');
    assert.strictEqual(nodeMai.data.spouseIds?.length, 0, 'Mai không có companion node cạnh bên');
  });

  it('Xử lý an toàn khi danh sách thành viên rỗng', () => {
    const result = calculateTreeLayout([], []);
    assert.deepStrictEqual(result, { nodes: [], edges: [] });
  });

  // TC_UT_LAYOUT_POLY: Dàn trang 3 nhánh con đa thê không cắt chéo dây
  it('TC_UT_LAYOUT_POLY: Dàn trang 3 nhánh con cho gia đình đa thê và con riêng không cắt chéo dây (0 crossing lines)', () => {
    const polyMembers: MemberRecord[] = [
      { id: 'm-chien', full_name: 'Phạm Văn Chiến', gender: 'male', life_status: 'living', generation_level: 1, is_root: true },
      { id: 'm-mo', full_name: 'Hoàng Thị Mơ', gender: 'female', life_status: 'living', generation_level: 1, is_root: false },
      { id: 'm-lieu', full_name: 'Đào Thị Liễu', gender: 'female', life_status: 'living', generation_level: 1, is_root: false },
      // Con riêng khuyết mẹ
      { id: 'c-single-1', full_name: 'Phạm Văn Khuyết', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: null, birth_order: 1, is_root: false },
      // Con bà Mơ
      { id: 'c-mo-1', full_name: 'Phạm Văn Minh', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 1, is_root: false },
      { id: 'c-mo-2', full_name: 'Phạm Thị Lan', gender: 'female', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 2, is_root: false },
      // Con bà Liễu
      { id: 'c-lieu-1', full_name: 'Phạm Văn Đức', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-lieu', birth_order: 1, is_root: false },
      { id: 'c-lieu-2', full_name: 'Phạm Thị Mai', gender: 'female', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-lieu', birth_order: 2, is_root: false },
    ];

    const polySpouses: SpouseRelationRecord[] = [
      { id: 'rel-chien-mo', member_a_id: 'm-chien', member_b_id: 'm-mo', marriage_order: 1 },
      { id: 'rel-chien-lieu', member_a_id: 'm-chien', member_b_id: 'm-lieu', marriage_order: 2 },
    ];

    const { nodes, edges } = calculateTreeLayout(polyMembers, polySpouses);

    assert.strictEqual(nodes.length, 8, 'Phải có đủ 8 nodes');

    // 1. Kiểm tra vị trí ngang của vợ chồng: Chồng < Vợ cả < Vợ hai
    const nodeChien = nodes.find((n) => n.id === 'm-chien')!;
    const nodeMo = nodes.find((n) => n.id === 'm-mo')!;
    const nodeLieu = nodes.find((n) => n.id === 'm-lieu')!;

    assert.ok(nodeChien.position.x < nodeMo.position.x, 'Chồng phải nằm bên trái Vợ Cả');
    assert.ok(nodeMo.position.x < nodeLieu.position.x, 'Vợ Cả phải nằm bên trái Vợ Hai');

    // 2. Kiểm tra vị trí các cụm con: Cụm con riêng < Cụm con bà Mơ < Cụm con bà Liễu
    const nodeCSingle = nodes.find((n) => n.id === 'c-single-1')!;
    const nodeCMo1 = nodes.find((n) => n.id === 'c-mo-1')!;
    const nodeCMo2 = nodes.find((n) => n.id === 'c-mo-2')!;
    const nodeCLieu1 = nodes.find((n) => n.id === 'c-lieu-1')!;
    const nodeCLieu2 = nodes.find((n) => n.id === 'c-lieu-2')!;

    assert.ok(nodeCSingle.position.x < nodeCMo1.position.x, 'Con riêng phải nằm bên trái con bà Mơ');
    assert.ok(nodeCMo1.position.x < nodeCMo2.position.x, 'Con cả bà Mơ nằm trước con thứ');
    assert.ok(nodeCMo2.position.x < nodeCLieu1.position.x, 'Cụm con bà Mơ phải nằm bên trái cụm con bà Liễu');
    assert.ok(nodeCLieu1.position.x < nodeCLieu2.position.x, 'Con cả bà Liễu nằm trước con thứ');

    // 3. Kiểm tra các handles của edge:
    const edgeSingle = edges.find((e) => e.target === 'c-single-1')!;
    assert.strictEqual(edgeSingle.sourceHandle, 'children-single', 'Con riêng phải nối từ chân người cha (children-single)');

    const edgeMo1 = edges.find((e) => e.target === 'c-mo-1')!;
    const edgeMo2 = edges.find((e) => e.target === 'c-mo-2')!;
    assert.strictEqual(edgeMo1.sourceHandle, 'children-spouse-0', 'Con bà Cả phải nối từ children-spouse-0');
    assert.strictEqual(edgeMo2.sourceHandle, 'children-spouse-0');

    const edgeLieu1 = edges.find((e) => e.target === 'c-lieu-1')!;
    const edgeLieu2 = edges.find((e) => e.target === 'c-lieu-2')!;
    assert.strictEqual(edgeLieu1.sourceHandle, 'children-spouse-1', 'Con bà Hai phải nối từ children-spouse-1');
    assert.strictEqual(edgeLieu2.sourceHandle, 'children-spouse-1');

    // 4. Kiểm tra dữ liệu mẹ được gắn trên node
    assert.strictEqual(nodeCSingle.data.motherOrderTitle, 'Chưa rõ mẹ');
    assert.strictEqual(nodeCMo1.data.motherOrderTitle, 'Con bà cả');
    assert.strictEqual(nodeCMo1.data.motherName, 'Hoàng Thị Mơ');
    assert.strictEqual(nodeCLieu1.data.motherOrderTitle, 'Con bà hai');
    assert.strictEqual(nodeCLieu1.data.motherName, 'Đào Thị Liễu');
  });

  it('TC_UT_BUS_ALTITUDE_01: Phân tầng cao độ Bus Y chống va chạm giữa các cụm con', () => {
    const polyMembers: MemberRecord[] = [
      { id: 'm-chien', full_name: 'Phạm Văn Chiến', gender: 'male', life_status: 'deceased', generation_level: 1, is_root: true },
      { id: 'm-mo', full_name: 'Hoàng Thị Mơ', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'm-lieu', full_name: 'Đào Thị Liễu', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'c-single-1', full_name: 'Phạm Văn Khuyết', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: null, birth_order: 1, is_root: false },
      { id: 'c-mo-1', full_name: 'Phạm Văn Minh', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 1, is_root: false },
      { id: 'c-mo-2', full_name: 'Phạm Thị Lan', gender: 'female', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 2, is_root: false },
      { id: 'c-lieu-1', full_name: 'Phạm Văn Đức', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-lieu', birth_order: 1, is_root: false },
      { id: 'c-lieu-2', full_name: 'Phạm Thị Mai', gender: 'female', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-lieu', birth_order: 2, is_root: false },
    ];

    const polySpouses: SpouseRelationRecord[] = [
      { id: 'rel-chien-mo', member_a_id: 'm-chien', member_b_id: 'm-mo', marriage_order: 1 },
      { id: 'rel-chien-lieu', member_a_id: 'm-chien', member_b_id: 'm-lieu', marriage_order: 2 },
    ];

    const { edges } = calculateTreeLayout(polyMembers, polySpouses);

    const edgeSingle = edges.find((e) => e.target === 'c-single-1')!;
    const edgeMo1 = edges.find((e) => e.target === 'c-mo-1')!;
    const edgeMo2 = edges.find((e) => e.target === 'c-mo-2')!;
    const edgeLieu1 = edges.find((e) => e.target === 'c-lieu-1')!;
    const edgeLieu2 = edges.find((e) => e.target === 'c-lieu-2')!;

    // Kiểm tra tồn tại busY trên data
    assert.strictEqual(typeof edgeSingle.data?.busY, 'number', 'Edge con riêng phải có data.busY');
    assert.strictEqual(typeof edgeMo1.data?.busY, 'number', 'Edge con bà cả phải có data.busY');
    assert.strictEqual(typeof edgeLieu1.data?.busY, 'number', 'Edge con bà hai phải có data.busY');

    const busYSingle = edgeSingle.data!.busY as number;
    const busYMo = edgeMo1.data!.busY as number;
    const busYLieu = edgeLieu1.data!.busY as number;

    // Các con cùng mẹ phải cùng cao độ bus
    assert.strictEqual(edgeMo1.data?.busY, edgeMo2.data?.busY, 'Các con cùng bà Mơ phải cùng cao độ bus');
    assert.strictEqual(edgeLieu1.data?.busY, edgeLieu2.data?.busY, 'Các con cùng bà Liễu phải cùng cao độ bus');

    // Phân tầng tách biệt: Y_single < Y_mo < Y_lieu, chênh lệch tối thiểu 15px
    assert.ok(busYMo - busYSingle >= 15, `Chênh lệch busY giữa con riêng (${busYSingle}) và con bà cả (${busYMo}) phải >= 15px`);
    assert.ok(busYLieu - busYMo >= 15, `Chênh lệch busY giữa con bà cả (${busYMo}) và con bà hai (${busYLieu}) phải >= 15px`);
  });

  it('TC_UT_STEPCHILD_01: Xử lý con riêng của người vợ hạ nhánh từ chính thẻ người mẹ', () => {
    const stepMembers: MemberRecord[] = [
      { id: 'm-chien', full_name: 'Phạm Văn Chiến', gender: 'male', life_status: 'living', generation_level: 1, is_root: true },
      { id: 'm-mo', full_name: 'Hoàng Thị Mơ', gender: 'female', life_status: 'living', generation_level: 1, is_root: false },
      // Con chung
      { id: 'c-chung', full_name: 'Phạm Văn Chung', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 1, is_root: false },
      // Con riêng của bà Mơ (cha không rõ hoặc người khác)
      { id: 'c-rieng-mo', full_name: 'Hoàng Văn Riêng', gender: 'male', life_status: 'living', generation_level: 2, father_id: null, mother_id: 'm-mo', birth_order: 2, is_root: false },
    ];

    const stepSpouses: SpouseRelationRecord[] = [
      { id: 'rel-chien-mo', member_a_id: 'm-chien', member_b_id: 'm-mo', marriage_order: 1 },
    ];

    const { edges } = calculateTreeLayout(stepMembers, stepSpouses);

    const edgeChung = edges.find((e) => e.target === 'c-chung')!;
    const edgeRieng = edges.find((e) => e.target === 'c-rieng-mo')!;

    // Con chung nối từ cha
    assert.strictEqual(edgeChung.source, 'm-chien', 'Con chung phải nối từ người cha');

    // Con riêng của mẹ: Nối từ chính người mẹ
    assert.strictEqual(edgeRieng.source, 'm-mo', 'Con riêng của mẹ phải nối từ chính thẻ mẹ m-mo');
    assert.strictEqual(edgeRieng.sourceHandle, 'children-single', 'Nối từ children-single của mẹ');
    assert.strictEqual(edgeRieng.data?.relationType, 'stepchild', 'Relation type là stepchild');
    assert.ok(edgeRieng.style?.strokeDasharray, 'Đường nét đứt cho con riêng của mẹ');

    // Không sinh edge nào từ người cha tới con riêng của mẹ
    const edgeFromFatherToStepChild = edges.find((e) => e.source === 'm-chien' && e.target === 'c-rieng-mo');
    assert.strictEqual(edgeFromFatherToStepChild, undefined, 'Tuyệt đối không sinh edge từ cha tới con riêng của vợ');
  });

  it('TC_UT_POLY_3_WIVES: Hỗ trợ người cha có 3 vợ dàn hàng ngang và 4 tầng bus Y tách biệt', () => {
    const threeWivesMembers: MemberRecord[] = [
      { id: 'm-cha', full_name: 'Cụ Cha', gender: 'male', life_status: 'deceased', generation_level: 1, is_root: true },
      { id: 'w-1', full_name: 'Bà Một', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'w-2', full_name: 'Bà Hai', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'w-3', full_name: 'Bà Ba', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      // Con riêng của cha
      { id: 'c-single', full_name: 'Con Riêng Cha', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-cha', mother_id: null, is_root: false },
      // Con bà 1
      { id: 'c-w1', full_name: 'Con Bà Một', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-cha', mother_id: 'w-1', is_root: false },
      // Con bà 2
      { id: 'c-w2', full_name: 'Con Bà Hai', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-cha', mother_id: 'w-2', is_root: false },
      // Con bà 3
      { id: 'c-w3', full_name: 'Con Bà Ba', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-cha', mother_id: 'w-3', is_root: false },
    ];

    const threeSpouses: SpouseRelationRecord[] = [
      { id: 'rel-1', member_a_id: 'm-cha', member_b_id: 'w-1', marriage_order: 1 },
      { id: 'rel-2', member_a_id: 'm-cha', member_b_id: 'w-2', marriage_order: 2 },
      { id: 'rel-3', member_a_id: 'm-cha', member_b_id: 'w-3', marriage_order: 3 },
    ];

    const { nodes, edges } = calculateTreeLayout(threeWivesMembers, threeSpouses);

    // 1. Kiểm tra thứ tự hàng ngang của cha và 3 vợ: Cha < Bà 1 < Bà 2 < Bà 3
    const nodeCha = nodes.find((n) => n.id === 'm-cha')!;
    const nodeW1 = nodes.find((n) => n.id === 'w-1')!;
    const nodeW2 = nodes.find((n) => n.id === 'w-2')!;
    const nodeW3 = nodes.find((n) => n.id === 'w-3')!;

    assert.ok(nodeCha.position.x < nodeW1.position.x, 'Cha nằm bên trái Bà 1');
    assert.ok(nodeW1.position.x < nodeW2.position.x, 'Bà 1 nằm bên trái Bà 2');
    assert.ok(nodeW2.position.x < nodeW3.position.x, 'Bà 2 nằm bên trái Bà 3');

    // 2. Kiểm tra vị trí ngang của đàn con: Con riêng < Con bà 1 < Con bà 2 < Con bà 3
    const nodeCSingle = nodes.find((n) => n.id === 'c-single')!;
    const nodeCW1 = nodes.find((n) => n.id === 'c-w1')!;
    const nodeCW2 = nodes.find((n) => n.id === 'c-w2')!;
    const nodeCW3 = nodes.find((n) => n.id === 'c-w3')!;

    assert.ok(nodeCSingle.position.x < nodeCW1.position.x, 'Con riêng bên trái con bà 1');
    assert.ok(nodeCW1.position.x < nodeCW2.position.x, 'Con bà 1 bên trái con bà 2');
    assert.ok(nodeCW2.position.x < nodeCW3.position.x, 'Con bà 2 bên trái con bà 3');

    // 3. Kiểm tra 4 tầng cao độ bus Y riêng biệt
    const edgeSingle = edges.find((e) => e.target === 'c-single')!;
    const edgeW1 = edges.find((e) => e.target === 'c-w1')!;
    const edgeW2 = edges.find((e) => e.target === 'c-w2')!;
    const edgeW3 = edges.find((e) => e.target === 'c-w3')!;

    const busYSingle = edgeSingle.data!.busY as number;
    const busYW1 = edgeW1.data!.busY as number;
    const busYW2 = edgeW2.data!.busY as number;
    const busYW3 = edgeW3.data!.busY as number;

    assert.ok(busYW1 - busYSingle >= 15, 'Tầng 1 chênh lệch busY >= 15px');
    assert.ok(busYW2 - busYW1 >= 15, 'Tầng 2 chênh lệch busY >= 15px');
    assert.ok(busYW3 - busYW2 >= 15, 'Tầng 3 chênh lệch busY >= 15px');
  });

  it('TC_UT_SPOUSE_TITLE_01: Gán danh vị Bà cả / Bà hai trên thẻ phối ngẫu đa thê', () => {
    const polyMembers: MemberRecord[] = [
      { id: 'm-chien', full_name: 'Phạm Văn Chiến', gender: 'male', life_status: 'deceased', generation_level: 1, is_root: true },
      { id: 'm-mo', full_name: 'Hoàng Thị Mơ', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'm-lieu', full_name: 'Đào Thị Liễu', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'c-mo-1', full_name: 'Phạm Văn Minh', gender: 'male', life_status: 'living', generation_level: 2, father_id: 'm-chien', mother_id: 'm-mo', birth_order: 1, is_root: false },
    ];

    const polySpouses: SpouseRelationRecord[] = [
      { id: 'rel-chien-mo', member_a_id: 'm-chien', member_b_id: 'm-mo', marriage_order: 1 },
      { id: 'rel-chien-lieu', member_a_id: 'm-chien', member_b_id: 'm-lieu', marriage_order: 2 },
    ];

    const { nodes } = calculateTreeLayout(polyMembers, polySpouses);

    const nodeMo = nodes.find((n) => n.id === 'm-mo')!;
    const nodeLieu = nodes.find((n) => n.id === 'm-lieu')!;

    assert.strictEqual(nodeMo.data.spouseOrderTitle, 'Bà cả', 'Bà Mơ có marriage_order = 1 phải là Bà cả');
    assert.strictEqual(nodeLieu.data.spouseOrderTitle, 'Bà hai', 'Bà Liễu có marriage_order = 2 phải là Bà hai');
  });
});
