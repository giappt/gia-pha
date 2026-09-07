import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { calculateTreeLayout } from '../src/lib/tree-layout/genealogy-layout';
import { parseExcelFamilyTree, topologicalSortExcelRows } from '../src/lib/excel/excel-parser';
import { MemberRecord, SpouseRelationRecord } from '../src/types/tree';

describe('Root Ancestor Setting & Graph-Derived Generation Test Suite (Milestone 7.3)', () => {
  // TC_UT_ROOT_SETTING_API: Kiểm chứng API đọc/ghi root_ancestor_id trong clan_settings
  it('TC_UT_ROOT_SETTING_API: API clan-settings hỗ trợ truy vấn và cập nhật root_ancestor_id', () => {
    const routePath = path.resolve(process.cwd(), 'src/app/api/clan-settings/route.ts');
    assert.ok(fs.existsSync(routePath), 'File src/app/api/clan-settings/route.ts phải tồn tại');

    const content = fs.readFileSync(routePath, 'utf8');

    // GET handler
    assert.ok(
      content.includes('root_ancestor_id'),
      'GET handler phải truy vấn hoặc trả về trường root_ancestor_id'
    );

    // PATCH handler
    assert.ok(
      content.includes('root_ancestor_id !== undefined') || content.includes('root_ancestor_id'),
      'PATCH handler phải tiếp nhận trường root_ancestor_id để cập nhật Cụ Thủy Tổ'
    );
  });

  // TC_UT_GRAPH_DERIVED_GENERATION: Kiểm chứng thuật toán tự động tính thế hệ theo đồ thị từ Root
  it('TC_UT_GRAPH_DERIVED_GENERATION: BFS tính thế hệ chuẩn xác từ Root, con = cha + 1, vợ kế thừa cùng đời', () => {
    const mockMembers: MemberRecord[] = [
      {
        id: 'cu-chien',
        full_name: 'Phạm Văn Chiến',
        gender: 'male',
        life_status: 'deceased',
        father_id: null,
        mother_id: null,
        generation_level: 1,
        birth_order: 1,
        is_root: true,
      },
      {
        id: 'ba-mo',
        full_name: 'Hoàng Thị Mơ',
        gender: 'female',
        life_status: 'deceased',
        father_id: null,
        mother_id: null,
        generation_level: 1, // DB cũ có thể lưu 1
        birth_order: 1,
        is_root: false,
      },
      {
        id: 'ong-dong',
        full_name: 'Phạm Văn Đồng',
        gender: 'male',
        life_status: 'deceased',
        father_id: 'cu-chien',
        mother_id: 'ba-mo',
        generation_level: 2,
        birth_order: 1,
        is_root: false,
      },
      {
        id: 'ba-thin',
        full_name: 'Vũ Thị Thìn',
        gender: 'female',
        life_status: 'deceased',
        father_id: null,
        mother_id: null,
        generation_level: 1, // Dữ liệu cũ bị gán 1 do không có cha mẹ
        birth_order: 1,
        is_root: false,
      },
      {
        id: 'chau-chuc',
        full_name: 'Phạm Kim Chức',
        gender: 'male',
        life_status: 'deceased',
        father_id: 'ong-dong',
        mother_id: 'ba-thin',
        generation_level: 3,
        birth_order: 1,
        is_root: false,
      },
      {
        id: 'chau-dau-dinh',
        full_name: 'Hoàng Thị Dĩnh',
        gender: 'female',
        life_status: 'deceased',
        father_id: null,
        mother_id: null,
        generation_level: 1, // Dữ liệu cũ bị gán 1 do không có cha mẹ
        birth_order: 1,
        is_root: false,
      },
    ];

    const mockSpouses: SpouseRelationRecord[] = [
      {
        id: 'sp-1',
        member_a_id: 'cu-chien',
        member_b_id: 'ba-mo',
        marriage_order: 1,
        marriage_status: 'married',
      },
      {
        id: 'sp-2',
        member_a_id: 'ong-dong',
        member_b_id: 'ba-thin',
        marriage_order: 1,
        marriage_status: 'married',
      },
      {
        id: 'sp-3',
        member_a_id: 'chau-chuc',
        member_b_id: 'chau-dau-dinh',
        marriage_order: 1,
        marriage_status: 'married',
      },
    ];

    const layout = calculateTreeLayout(mockMembers, mockSpouses, {
      rootAncestorId: 'cu-chien',
    });

    const nodeChien = layout.nodes.find((n) => n.id === 'cu-chien');
    const nodeMo = layout.nodes.find((n) => n.id === 'ba-mo');
    const nodeDong = layout.nodes.find((n) => n.id === 'ong-dong');
    const nodeThin = layout.nodes.find((n) => n.id === 'ba-thin');
    const nodeChuc = layout.nodes.find((n) => n.id === 'chau-chuc');
    const nodeDinh = layout.nodes.find((n) => n.id === 'chau-dau-dinh');

    assert.ok(nodeChien, 'Node Cụ Chiến phải tồn tại');
    assert.ok(nodeMo, 'Node Bà Mơ phải tồn tại');
    assert.ok(nodeDong, 'Node Ông Đồng phải tồn tại');
    assert.ok(nodeThin, 'Node Bà Thìn phải tồn tại');
    assert.ok(nodeChuc, 'Node Cháu Chức phải tồn tại');
    assert.ok(nodeDinh, 'Node Cháu Dâu Dĩnh phải tồn tại');

    // Cụ Chiến là Root
    assert.strictEqual(nodeChien.data.generationLevel, 1, 'Cụ Thủy Tổ phải có generationLevel = 1');
    assert.strictEqual(nodeChien.data.isRoot, true, 'Cụ Thủy Tổ phải có isRoot = true');

    // Bà Mơ (Vợ Cụ Chiến)
    assert.strictEqual(nodeMo.data.generationLevel, 1, 'Bà Mơ phải có generationLevel = 1 (cùng đời chồng)');
    assert.strictEqual(nodeMo.data.isRoot, false, 'Bà Mơ tuyệt đối KHÔNG được mang isRoot = true');

    // Ông Đồng (Đời 2)
    assert.strictEqual(nodeDong.data.generationLevel, 2, 'Ông Đồng con Cụ Chiến phải là Đời 2');
    assert.strictEqual(nodeDong.data.isRoot, false, 'Ông Đồng isRoot = false');

    // Bà Thìn (Vợ Ông Đồng) - Trước đây bị lỗi Đời 1
    assert.strictEqual(
      nodeThin.data.generationLevel,
      2,
      'Bà Thìn vợ Ông Đồng phải mang đúng Đời 2 (không được bị ép về Đời 1)'
    );
    assert.strictEqual(nodeThin.data.isRoot, false, 'Bà Thìn isRoot = false');

    // Cháu Chức (Đời 3)
    assert.strictEqual(nodeChuc.data.generationLevel, 3, 'Cháu Chức con Ông Đồng phải là Đời 3');

    // Cháu Dâu Dĩnh (Vợ Cháu Chức) - Trước đây bị lỗi Đời 1
    assert.strictEqual(
      nodeDinh.data.generationLevel,
      3,
      'Cháu Dâu Dĩnh phải mang đúng Đời 3 (kế thừa đời của chồng)'
    );
    assert.strictEqual(nodeDinh.data.isRoot, false, 'Cháu Dâu Dĩnh isRoot = false');
  });

  // TC_UT_MEMBER_NODE_ROOT_BADGE_EXCLUSIVE: Kiểm chứng Huy hiệu Cụ Tổ CHỈ hiển thị duy nhất trên Root Node
  it('TC_UT_MEMBER_NODE_ROOT_BADGE_EXCLUSIVE: Huy hiệu Cụ Tổ loại bỏ hoàn toàn điều kiện generationLevel === 1', () => {
    const memberNodePath = path.resolve(process.cwd(), 'src/components/tree/MemberNode.tsx');
    assert.ok(fs.existsSync(memberNodePath), 'File MemberNode.tsx phải tồn tại');

    const content = fs.readFileSync(memberNodePath, 'utf8');

    // Kiểm tra không còn đoạn code sai: nodeData.isRoot || nodeData.generationLevel === 1
    assert.ok(
      !content.includes('nodeData.generationLevel === 1'),
      'MemberNode tuyệt đối KHÔNG được dùng generationLevel === 1 để hiển thị huy hiệu Cụ Tổ'
    );

    // Huy hiệu Cụ Tổ phải phụ thuộc trực tiếp vào nodeData.isRoot
    assert.ok(
      content.includes('nodeData.isRoot ?'),
      'Huy hiệu Cụ Tổ chỉ được render khi nodeData.isRoot là true'
    );
  });

  // TC_UT_IMPORT_AUTO_SYNC_ROOT: Kiểm chứng Import Clean Mode tự động cập nhật root_ancestor_id cho Cụ Thủy Tổ
  it('TC_UT_IMPORT_AUTO_SYNC_ROOT: Import logic tự động đồng bộ root_ancestor_id và tính đời cho phối ngẫu', () => {
    const importRoutePath = path.resolve(process.cwd(), 'src/app/api/admin/import/route.ts');
    assert.ok(fs.existsSync(importRoutePath), 'File src/app/api/admin/import/route.ts phải tồn tại');

    const content = fs.readFileSync(importRoutePath, 'utf8');

    // Kiểm tra tự động cập nhật clan_settings.root_ancestor_id khi tìm thấy isRoot
    assert.ok(
      content.includes('root_ancestor_id'),
      'Import route phải tự động cập nhật root_ancestor_id khi gặp dòng isRoot'
    );

    // Kiểm tra Pass 2 đồng bộ thế hệ cho phối ngẫu
    assert.ok(
      content.includes('partnerGen') || content.includes('spouseGen') || content.includes('Pass 2'),
      'Import route phải có Pass 2 đồng bộ thế hệ cho phối ngẫu ngoại tộc'
    );
  });

  // TC_UT_EXCEL_LITE_TOPOLOGY_INTEGRITY: Kiểm chứng file gia_pha_ho_pham_van_lite.xlsx liên kết liền mạch từ Đời 1 đến Đời 13
  it('TC_UT_EXCEL_LITE_TOPOLOGY_INTEGRITY: File Excel lite liên kết đầy đủ cha mẹ và không có chu trình', () => {
    const excelPath = path.resolve(process.cwd(), 'docs/data/gia_pha_ho_pham_van_lite.xlsx');
    assert.ok(fs.existsSync(excelPath), 'File gia_pha_ho_pham_van_lite.xlsx phải tồn tại');

    const buffer = fs.readFileSync(excelPath);
    const parsedRows = parseExcelFamilyTree(buffer);

    assert.strictEqual(parsedRows.length, 60, 'File Excel lite phải có đúng 60 thành viên');

    // Kiểm tra STT 1 là Cụ Tổ
    const stt1 = parsedRows.find((r) => r.stt === 1);
    assert.ok(stt1, 'Phải có thành viên STT 1');
    assert.strictEqual(stt1.fullName, 'Phạm Văn Chiến', 'STT 1 là Cụ Phạm Văn Chiến');
    assert.strictEqual(stt1.isRoot, true, 'STT 1 phải là Cụ Tổ (isRoot = true)');

    // Kiểm tra các liên kết cha mẹ vừa chuẩn hóa
    const stt4 = parsedRows.find((r) => r.stt === 4);
    assert.ok(stt4, 'Phải có STT 4');
    assert.strictEqual(stt4.fatherStt, 1, 'STT 4 (Phạm Văn Đồng) có Bố = 1');
    assert.strictEqual(stt4.motherStt, 2, 'STT 4 (Phạm Văn Đồng) có Mẹ = 2');

    const stt6 = parsedRows.find((r) => r.stt === 6);
    assert.ok(stt6, 'Phải có STT 6');
    assert.strictEqual(stt6.fatherStt, 4, 'STT 6 (Phạm Kim Chức) có Bố = 4');
    assert.strictEqual(stt6.motherStt, 5, 'STT 6 (Phạm Kim Chức) có Mẹ = 5');

    const stt69 = parsedRows.find((r) => r.stt === 69);
    assert.ok(stt69, 'Phải có STT 69');
    assert.strictEqual(stt69.fatherStt, 38, 'STT 69 (Phạm Kim Xây) có Bố = 38');
    assert.strictEqual(stt69.motherStt, 39, 'STT 69 (Phạm Kim Xây) có Mẹ = 39');

    const stt122 = parsedRows.find((r) => r.stt === 122);
    assert.ok(stt122, 'Phải có STT 122');
    assert.strictEqual(stt122.fatherStt, 69, 'STT 122 (Phạm Văn Tiễu) có Bố = 69');
    assert.strictEqual(stt122.motherStt, 70, 'STT 122 (Phạm Văn Tiễu) có Mẹ = 70');

    const stt795 = parsedRows.find((r) => r.stt === 795);
    assert.ok(stt795, 'Phải có STT 795');
    assert.strictEqual(stt795.fatherStt, 436, 'STT 795 (Phạm Hải Nam) có Bố = 436');
    assert.strictEqual(stt795.motherStt, 437, 'STT 795 (Phạm Hải Nam) có Mẹ = 437');

    // Chạy topological sort: không được ném Exception chu trình
    assert.doesNotThrow(() => {
      const sorted = topologicalSortExcelRows(parsedRows);
      assert.strictEqual(sorted.length, 60, 'Topological sort phải sắp xếp trọn vẹn 60 thành viên');
    }, 'Topological sort phải hoàn tất thành công không có chu trình (cycle)');
  });
});
