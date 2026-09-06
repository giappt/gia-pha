import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateExcelTemplate,
  parseExcelFamilyTree,
  validateExcelRows,
  topologicalSortExcelRows,
} from '../src/lib/excel/excel-parser';
import { ExcelMemberRow } from '../src/types/tree';

describe('Bulk Excel Parser & Topological Sort Test Suite (Milestone 4)', () => {
  // TC_XLS01: Parse file Excel mẫu hợp lệ
  it('TC_XLS01: Parse file Excel mẫu hợp lệ và vượt qua toàn bộ validation', () => {
    const templateBuffer = generateExcelTemplate();
    assert.ok(templateBuffer.length > 0, 'Buffer file Excel template phải được tạo ra');

    const parsedRows = parseExcelFamilyTree(templateBuffer);
    assert.strictEqual(parsedRows.length, 4, 'Template mẫu phải có đúng 4 dòng thành viên');

    // Kiểm tra dòng 1: Cụ Khởi
    const row1 = parsedRows[0];
    assert.strictEqual(row1.fullName, 'Nguyễn Văn Khởi');
    assert.strictEqual(row1.gender, 'Nam');
    assert.strictEqual(row1.lifeStatus, 'Đã mất');
    assert.strictEqual(row1.deathLunarDay, 15);
    assert.strictEqual(row1.deathLunarMonth, 7);
    assert.strictEqual(row1.isSenior, true);
    assert.strictEqual(row1.isRoot, true);

    // Kiểm tra validation
    const result = validateExcelRows(parsedRows);
    assert.strictEqual(result.canImport, true, 'Dữ liệu template chuẩn phải cho phép import');
    assert.strictEqual(result.errorRowsCount, 0, 'Không được có lỗi chặn trong template mẫu');
    assert.strictEqual(result.validRowsCount, 4, 'Toàn bộ 4 dòng đều phải hợp lệ');
  });

  // TC_XLS02: Sắp xếp Topological Sort theo thế hệ
  it('TC_XLS02: Sắp xếp Topological Sort chuẩn xác dù thứ tự trong file bị xáo trộn', () => {
    // Tạo danh sách xáo trộn: Cháu (STT 3) ở đầu, Con (STT 2) ở giữa, Cụ Tổ (STT 1) ở cuối
    const scrambledRows: ExcelMemberRow[] = [
      {
        rowNumber: 2,
        stt: 3,
        fullName: 'Cháu Đời 3',
        gender: 'Nam',
        lifeStatus: 'Còn sống',
        fatherStt: 2,
        validationErrors: [],
        validationWarnings: [],
        isValid: true,
      },
      {
        rowNumber: 3,
        stt: 2,
        fullName: 'Con Đời 2',
        gender: 'Nam',
        lifeStatus: 'Còn sống',
        fatherStt: 1,
        validationErrors: [],
        validationWarnings: [],
        isValid: true,
      },
      {
        rowNumber: 4,
        stt: 1,
        fullName: 'Cụ Tổ Đời 1',
        gender: 'Nam',
        lifeStatus: 'Đã mất',
        validationErrors: [],
        validationWarnings: [],
        isValid: true,
      },
    ];

    const sorted = topologicalSortExcelRows(scrambledRows);
    assert.strictEqual(sorted.length, 3);
    // Cụ Tổ (STT 1) phải được đưa lên đầu
    assert.strictEqual(sorted[0].stt, 1, 'Cụ Tổ (STT 1) phải đứng đầu sau khi sort');
    // Con Đời 2 (STT 2) phải đứng thứ hai
    assert.strictEqual(sorted[1].stt, 2, 'Con Đời 2 (STT 2) phải đứng thứ hai');
    // Cháu Đời 3 (STT 3) phải đứng cuối
    assert.strictEqual(sorted[2].stt, 3, 'Cháu Đời 3 (STT 3) phải đứng cuối');
  });

  // TC_XLS03: Phát hiện lỗi STT cha mẹ không tồn tại
  it('TC_XLS03: Phát hiện lỗi STT cha mẹ không tồn tại và thiếu họ tên', () => {
    const invalidRows: ExcelMemberRow[] = [
      {
        rowNumber: 2,
        stt: 1,
        fullName: '', // Rỗng họ tên
        gender: 'Nam',
        lifeStatus: 'Còn sống',
        fatherStt: 999, // Không tồn tại trong file
        validationErrors: [],
        validationWarnings: [],
        isValid: true,
      },
      {
        rowNumber: 3,
        stt: 2,
        fullName: 'Thành viên B',
        gender: 'Nữ',
        lifeStatus: 'Đã mất',
        deathLunarDay: 35, // Sai ngày âm lịch (>30)
        validationErrors: [],
        validationWarnings: [],
        isValid: true,
      },
    ];

    const result = validateExcelRows(invalidRows);
    assert.strictEqual(result.canImport, false, 'Dữ liệu có lỗi không được phép import');
    assert.strictEqual(result.errorRowsCount, 2, 'Cả 2 dòng đều phải bị đánh dấu lỗi');

    const row1Errors = result.rows[0].validationErrors;
    assert.ok(row1Errors.some((e) => e.includes('Họ và Tên')), 'Phải báo lỗi thiếu họ tên');
    assert.ok(row1Errors.some((e) => e.includes('999')), 'Phải báo lỗi STT Bố 999 không tồn tại');

    const row2Errors = result.rows[1].validationErrors;
    assert.ok(row2Errors.some((e) => e.includes('Ngày mất Âm lịch')), 'Phải báo lỗi ngày mất âm lịch không hợp lệ');
  });

  // TC_XLS04: Phát hiện chu trình phụ thuộc trong Excel
  it('TC_XLS04: Phát hiện chu trình phụ thuộc vòng lặp kín trong file Excel', () => {
    // Dòng 1 khai cha là 2, Dòng 2 khai cha là 1 -> Vòng lặp kín
    const cyclicRows: ExcelMemberRow[] = [
      {
        rowNumber: 2,
        stt: 1,
        fullName: 'Người A',
        gender: 'Nam',
        lifeStatus: 'Còn sống',
        fatherStt: 2,
        validationErrors: [],
        validationWarnings: [],
        isValid: true,
      },
      {
        rowNumber: 3,
        stt: 2,
        fullName: 'Người B',
        gender: 'Nam',
        lifeStatus: 'Còn sống',
        fatherStt: 1,
        validationErrors: [],
        validationWarnings: [],
        isValid: true,
      },
    ];

    const result = validateExcelRows(cyclicRows);
    assert.strictEqual(result.canImport, false, 'Dữ liệu có chu trình không được phép import');

    const hasCycleError = result.rows.some((r) =>
      r.validationErrors.some((e) => e.includes('chu trình') || e.includes('vòng lặp'))
    );
    assert.strictEqual(hasCycleError, true, 'Phải phát hiện và gắn cờ lỗi chu trình vòng lặp');
  });
});
