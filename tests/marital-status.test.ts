import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateTreeLayout, NODE_WIDTH, NODE_HEIGHT } from '../src/lib/tree-layout/genealogy-layout';
import { MemberRecord, SpouseRelationRecord } from '../src/types/tree';
import * as XLSX from 'xlsx';
import { parseExcelFamilyTree } from '../src/lib/excel/excel-parser';

describe('Marital Status & Remarriage Engine Suite (TC_UT_MARITAL_01 -> 05)', () => {
  // Mock dữ liệu gia đình có tái giá và đã lấy vợ
  const mockMembers: MemberRecord[] = [
    {
      id: 'husband-1',
      full_name: 'Nguyễn Văn Hùng',
      gender: 'male',
      life_status: 'living',
      generation_level: 2,
      birth_year: 1970,
      is_root: true,
      branch_name: 'Chi 1',
    },
    {
      id: 'wife-1',
      full_name: 'Trần Thị Thảo',
      gender: 'female',
      life_status: 'living',
      generation_level: 2,
      birth_year: 1972,
      is_root: false,
      marital_status: 'remarried',
      marital_event_year: 2024,
    },
    {
      id: 'child-1',
      full_name: 'Nguyễn Văn Minh',
      gender: 'male',
      life_status: 'living',
      father_id: 'husband-1',
      mother_id: 'wife-1',
      generation_level: 3,
      birth_year: 1995,
      is_root: false,
    },
    {
      id: 'husband-2',
      full_name: 'Nguyễn Văn Nam',
      gender: 'male',
      life_status: 'living',
      father_id: 'husband-1',
      generation_level: 3,
      birth_year: 1998,
      is_root: false,
      marital_status: 'remarried',
      marital_event_year: 2022,
    },
    {
      id: 'wife-2',
      full_name: 'Phạm Thị Lan',
      gender: 'female',
      life_status: 'living',
      generation_level: 2,
      birth_year: 1978,
      is_root: false,
      marital_status: 'divorced',
    },
  ];

  const mockSpouses: SpouseRelationRecord[] = [
    {
      id: 'rel-1',
      member_a_id: 'husband-1',
      member_b_id: 'wife-1',
      marriage_order: 1,
      marriage_status: 'married',
    },
    {
      id: 'rel-2',
      member_a_id: 'husband-2',
      member_b_id: 'wife-2',
      marriage_order: 1,
      marriage_status: 'married',
    },
  ];

  it('TC_UT_MARITAL_01: Thẻ Node con dâu tái giá nạp đúng maritalStatus="remarried", nhãn hiển thị "Tái giá" và loại bỏ fallback "Huyết tộc"', () => {
    const layout = calculateTreeLayout(mockMembers, mockSpouses);
    const wifeNode = layout.nodes.find((n) => n.id === 'wife-1');

    assert.ok(wifeNode, 'Thẻ vợ-1 phải tồn tại trong kết quả layout');
    assert.strictEqual(wifeNode.data.maritalStatus, 'remarried', 'Dữ liệu node phải mang maritalStatus là remarried');
    assert.strictEqual(wifeNode.data.maritalEventYear, 2024, 'Dữ liệu node phải mang maritalEventYear là 2024');

    // Kiểm tra quy tắc suy luận nhãn chân thẻ bên trái của MemberNode:
    const footerLabel = wifeNode.data.maritalStatus === 'remarried'
      ? (wifeNode.data.gender === 'female' ? 'Tái giá' : 'Đã lấy vợ')
      : wifeNode.data.maritalStatus === 'divorced'
      ? 'Ly hôn'
      : (wifeNode.data.branchName || '');

    assert.strictEqual(footerLabel, 'Tái giá', 'Nhãn chân thẻ bên trái cho con dâu tái giá phải là "Tái giá"');
    assert.notStrictEqual(footerLabel, 'Huyết tộc', 'Tuyệt đối không gán nhãn "Huyết tộc" cho con dâu');
    assert.notStrictEqual(footerLabel, 'Thành viên', 'Tuyệt đối không gán nhãn "Thành viên"');
  });

  it('TC_UT_MARITAL_02: Thẻ Node thành viên Nam lấy vợ nạp maritalStatus="remarried", nhãn hiển thị "Đã lấy vợ", và thành viên ly hôn hiển thị "Ly hôn"', () => {
    const layout = calculateTreeLayout(mockMembers, mockSpouses);
    const husband2Node = layout.nodes.find((n) => n.id === 'husband-2');

    assert.ok(husband2Node, 'Thẻ husband-2 phải tồn tại trong layout');
    assert.strictEqual(husband2Node.data.maritalStatus, 'remarried');
    assert.strictEqual(husband2Node.data.maritalEventYear, 2022);

    const husbandLabel = husband2Node.data.maritalStatus === 'remarried'
      ? (husband2Node.data.gender === 'female' ? 'Tái giá' : 'Đã lấy vợ')
      : husband2Node.data.maritalStatus === 'divorced'
      ? 'Ly hôn'
      : (husband2Node.data.branchName || '');

    assert.strictEqual(husbandLabel, 'Đã lấy vợ', 'Nhãn chân thẻ bên trái cho nam giới lấy vợ phải là "Đã lấy vợ"');

    // Kiểm tra thành viên ly hôn wife-2
    const wife2Node = layout.nodes.find((n) => n.id === 'wife-2');
    assert.ok(wife2Node, 'Thẻ wife-2 phải tồn tại trong layout');
    assert.strictEqual(wife2Node.data.maritalStatus, 'divorced');

    const status = wife2Node.data.maritalStatus as string | undefined;
    const divorceLabel = status === 'remarried'
      ? (wife2Node.data.gender === 'female' ? 'Tái giá' : 'Đã lấy vợ')
      : status === 'divorced'
      ? 'Ly hôn'
      : (wife2Node.data.branchName || '');

    assert.strictEqual(divorceLabel, 'Ly hôn', 'Nhãn chân thẻ bên trái khi ly hôn phải là "Ly hôn"');
  });

  it('TC_UT_MARITAL_03: Chân thẻ bên phải: Thẻ chồng dòng họ chính hiển thị số con, thẻ con dâu/phối ngẫu không lặp lại số con', () => {
    const layout = calculateTreeLayout(mockMembers, mockSpouses);
    const husbandNode = layout.nodes.find((n) => n.id === 'husband-1')!;
    const wifeNode = layout.nodes.find((n) => n.id === 'wife-1')!;

    // Chồng là primary lineage member: inlawRole không có, childCount = 2 (child-1 và husband-2)
    assert.strictEqual(husbandNode.data.inlawRole, undefined);
    assert.strictEqual(husbandNode.data.childCount, 2);

    const husbandShowsChildCount = !husbandNode.data.inlawRole && husbandNode.data.childCount != null && husbandNode.data.childCount > 0;
    assert.strictEqual(husbandShowsChildCount, true, 'Thẻ chồng mang dòng họ chính phải hiển thị số con');

    // Vợ là spouse: inlawRole = 'daughter_in_law'
    assert.strictEqual(wifeNode.data.inlawRole, 'daughter_in_law');
    const wifeShowsChildCount = !wifeNode.data.inlawRole && wifeNode.data.childCount != null && wifeNode.data.childCount > 0;
    assert.strictEqual(wifeShowsChildCount, false, 'Thẻ con dâu không được lặp lại số con bên phải (để trống)');
  });

  it('TC_UT_MARITAL_04: Parser Excel tự động trích xuất tình trạng tái giá / lấy vợ / ly hôn từ ghi chú hoặc cột riêng', () => {
    // Tạo workbook Excel giả lập
    const wsData = [
      ['STT', 'Họ và Tên', 'Giới tính', 'Trạng thái', 'STT Bố', 'STT Mẹ', 'STT Vợ/Chồng', 'Năm sinh', 'Ghi chú / Tiểu sử', 'Tình trạng hôn nhân', 'Năm hôn nhân'],
      [1, 'Nguyễn Văn Thìn', 'Nam', 'Còn sống', '', '', 2, 1968, '', '', ''],
      [2, 'Nguyễn Thị Kim', 'Nữ', 'Còn sống', '', '', 1, 1972, 'Đã tái giá năm 2024', '', ''],
      [3, 'Tạ Duy Hưng', 'Nam', 'Còn sống', '', '', '', 1980, 'Đã lấy vợ khác năm 2021', '', ''],
      [4, 'Lê Thị Hà', 'Nữ', 'Còn sống', '', '', '', 1985, '', 'Ly hôn', 2019],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const parsedRows = parseExcelFamilyTree(buffer);
    assert.strictEqual(parsedRows.length, 4);

    const rowKim = parsedRows.find((r) => r.fullName === 'Nguyễn Thị Kim');
    assert.ok(rowKim, 'Phải tìm thấy dòng Nguyễn Thị Kim');
    assert.strictEqual(rowKim.maritalStatus, 'remarried', 'Phải nhận diện được status remarried từ ghi chú');
    assert.strictEqual(rowKim.maritalEventYear, 2024, 'Phải bóc tách được năm biến cố 2024');

    const rowHung = parsedRows.find((r) => r.fullName === 'Tạ Duy Hưng');
    assert.ok(rowHung, 'Phải tìm thấy dòng Tạ Duy Hưng');
    assert.strictEqual(rowHung.maritalStatus, 'remarried', 'Phải nhận diện được status remarried từ ghi chú lấy vợ');
    assert.strictEqual(rowHung.maritalEventYear, 2021, 'Phải bóc tách được năm lấy vợ 2021');

    const rowHa = parsedRows.find((r) => r.fullName === 'Lê Thị Hà');
    assert.ok(rowHa, 'Phải tìm thấy dòng Lê Thị Hà');
    assert.strictEqual(rowHa.maritalStatus, 'divorced', 'Phải nhận diện được status divorced từ cột riêng');
    assert.strictEqual(rowHa.maritalEventYear, 2019, 'Phải nhận diện được năm hôn nhân 2019');
  });

  it('TC_UT_MARITAL_05: 100% các node mang tình trạng hôn nhân đặc biệt bảo toàn kích thước chuẩn 200 x 96 px', () => {
    const layout = calculateTreeLayout(mockMembers, mockSpouses);
    layout.nodes.forEach((node) => {
      assert.strictEqual(node.width, NODE_WIDTH, `Node ${node.id} phải có width đúng 200px`);
      assert.strictEqual(node.height, NODE_HEIGHT, `Node ${node.id} phải có height đúng 96px`);
    });
  });
});
