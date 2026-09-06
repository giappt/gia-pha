import * as XLSX from 'xlsx';
import { ExcelMemberRow, ExcelParseResult } from '@/types/tree';

// Tên các cột tiêu chuẩn trong file Excel mẫu
export const EXCEL_COLUMNS = [
  'STT',
  'Họ và Tên',
  'Giới tính',
  'Trạng thái',
  'STT Bố',
  'STT Mẹ',
  'STT Vợ/Chồng',
  'Năm sinh',
  'Ngày mất (Âm)',
  'Tháng mất (Âm)',
  'Tháng nhuận (Âm)',
  'Năm Can Chi',
  'Năm mất (Dương)',
  'Thứ tự sinh',
  'Con trưởng (Đ/S)',
  'Con nuôi (Đ/S)',
  'Cụ Tổ (Đ/S)',
  'Nơi an táng',
  'Ghi chú / Tiểu sử',
];

/**
 * Đọc buffer của file Excel (.xlsx hoặc .csv) và chuyển đổi thành danh sách ExcelMemberRow
 */
export function parseExcelFamilyTree(data: ArrayBuffer | Buffer | Uint8Array): ExcelMemberRow[] {
  const workbook = XLSX.read(data, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const parsedRows: ExcelMemberRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Dòng 1 là header

    // Chuẩn hóa giới tính
    const rawGender = String(row['Giới tính'] || '').trim().toLowerCase();
    const gender: 'Nam' | 'Nữ' | 'Khác' =
      rawGender === 'nam' || rawGender === 'male' || rawGender === 'm'
        ? 'Nam'
        : rawGender === 'nữ' || rawGender === 'nu' || rawGender === 'female' || rawGender === 'f'
        ? 'Nữ'
        : 'Khác';

    // Chuẩn hóa trạng thái sống/mất
    const rawStatus = String(row['Trạng thái'] || '').trim().toLowerCase();
    const lifeStatus: 'Còn sống' | 'Đã mất' =
      rawStatus.includes('mất') || rawStatus.includes('chết') || rawStatus.includes('qua đời') || rawStatus === 'deceased'
        ? 'Đã mất'
        : 'Còn sống';

    // Xử lý cờ boolean
    const isSenior = isTrueVal(row['Con trưởng (Đ/S)']);
    const isAdopted = isTrueVal(row['Con nuôi (Đ/S)']);
    const isRoot = isTrueVal(row['Cụ Tổ (Đ/S)']);
    const deathLunarIsLeap = isTrueVal(row['Tháng nhuận (Âm)']);

    const parseNum = (val: any): number | null => {
      if (val === '' || val == null) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const parseStt = (val: any): number | string | null => {
      if (val === '' || val == null) return null;
      const s = String(val).trim();
      return s === '' ? null : isNaN(Number(s)) ? s : Number(s);
    };

    const stt = parseStt(row['STT']) ?? (index + 1);
    const fullName = String(row['Họ và Tên'] || '').trim();

    const memberRow: ExcelMemberRow = {
      rowNumber,
      stt,
      fullName,
      gender,
      lifeStatus,
      fatherStt: parseStt(row['STT Bố']),
      motherStt: parseStt(row['STT Mẹ']),
      spouseStt: parseStt(row['STT Vợ/Chồng']),
      birthYear: parseNum(row['Năm sinh']),
      deathLunarDay: parseNum(row['Ngày mất (Âm)']),
      deathLunarMonth: parseNum(row['Tháng mất (Âm)']),
      deathLunarIsLeap,
      deathLunarYearName: row['Năm Can Chi'] ? String(row['Năm Can Chi']).trim() : null,
      deathYear: parseNum(row['Năm mất (Dương)']),
      birthOrder: parseNum(row['Thứ tự sinh']) ?? 1,
      isSenior,
      isAdopted,
      isRoot,
      burialLocation: row['Nơi an táng'] ? String(row['Nơi an táng']).trim() : null,
      notes: row['Ghi chú / Tiểu sử'] ? String(row['Ghi chú / Tiểu sử']).trim() : null,
      validationErrors: [],
      validationWarnings: [],
      isValid: true,
    };

    parsedRows.push(memberRow);
  });

  return parsedRows;
}

function isTrueVal(val: any): boolean {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'đ' || s === 'd' || s === 'true' || s === '1' || s === 'có' || s === 'x';
}

/**
 * Kiểm tra tính hợp lệ về logic và đồ thị cho danh sách dòng Excel
 */
export function validateExcelRows(rows: ExcelMemberRow[]): ExcelParseResult {
  const sttMap = new Map<string, ExcelMemberRow>();
  const duplicateStts = new Set<string>();

  // 1. Kiểm tra trùng lặp STT
  for (const r of rows) {
    const key = String(r.stt);
    if (sttMap.has(key)) {
      duplicateStts.add(key);
    } else {
      sttMap.set(key, r);
    }
  }

  // 2. Validate từng dòng
  for (const r of rows) {
    r.validationErrors = [];
    r.validationWarnings = [];

    // Tên bắt buộc
    if (!r.fullName) {
      r.validationErrors.push('Họ và Tên không được để trống.');
    }

    // Trùng STT
    if (duplicateStts.has(String(r.stt))) {
      r.validationErrors.push(`STT [${r.stt}] bị trùng lặp trong file.`);
    }

    // Ngày mất âm lịch (nếu đã mất và có nhập)
    if (r.lifeStatus === 'Đã mất') {
      if (r.deathLunarDay != null && (r.deathLunarDay < 1 || r.deathLunarDay > 30)) {
        r.validationErrors.push('Ngày mất Âm lịch phải từ 1 đến 30.');
      }
      if (r.deathLunarMonth != null && (r.deathLunarMonth < 1 || r.deathLunarMonth > 12)) {
        r.validationErrors.push('Tháng mất Âm lịch phải từ 1 đến 12.');
      }
    }

    // Tham chiếu cha mẹ
    if (r.fatherStt != null) {
      const fKey = String(r.fatherStt);
      if (fKey === String(r.stt)) {
        r.validationErrors.push('STT Bố không thể là chính mình.');
      } else if (!sttMap.has(fKey)) {
        r.validationErrors.push(`STT Bố [${r.fatherStt}] không tồn tại trong danh sách.`);
      }
    }

    if (r.motherStt != null) {
      const mKey = String(r.motherStt);
      if (mKey === String(r.stt)) {
        r.validationErrors.push('STT Mẹ không thể là chính mình.');
      } else if (!sttMap.has(mKey)) {
        r.validationErrors.push(`STT Mẹ [${r.motherStt}] không tồn tại trong danh sách.`);
      }
    }

    if (r.spouseStt != null) {
      const sKey = String(r.spouseStt);
      if (sKey === String(r.stt)) {
        r.validationErrors.push('STT Vợ/Chồng không thể là chính mình.');
      } else if (!sttMap.has(sKey)) {
        r.validationWarnings.push(`STT Vợ/Chồng [${r.spouseStt}] chưa có trong danh sách.`);
      }
    }

    // Cảnh báo năm sinh bố < con
    if (r.birthYear != null && r.fatherStt != null && sttMap.has(String(r.fatherStt))) {
      const father = sttMap.get(String(r.fatherStt))!;
      if (father.birthYear != null && father.birthYear >= r.birthYear) {
        r.validationWarnings.push(`Năm sinh của Bố (${father.birthYear}) lớn hơn hoặc bằng năm sinh của Con (${r.birthYear}).`);
      }
    }

    r.isValid = r.validationErrors.length === 0;
  }

  // 3. Phát hiện chu trình vòng lặp trong file (Cycle Detection)
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const checkCycle = (sttStr: string, path: string[]): boolean => {
    visited.add(sttStr);
    inStack.add(sttStr);

    const row = sttMap.get(sttStr);
    if (row) {
      const parents = [row.fatherStt, row.motherStt].filter(Boolean).map(String);
      for (const p of parents) {
        if (!visited.has(p)) {
          if (checkCycle(p, [...path, p])) return true;
        } else if (inStack.has(p)) {
          // Tìm thấy chu trình
          const cycleStr = [...path, p].join(' -> ');
          row.validationErrors.push(`Phát hiện chu trình vòng lặp cha-con khép kín: ${cycleStr}`);
          row.isValid = false;
          return true;
        }
      }
    }

    inStack.delete(sttStr);
    return false;
  };

  for (const r of rows) {
    const key = String(r.stt);
    if (!visited.has(key)) {
      checkCycle(key, [key]);
    }
  }

  const errorRowsCount = rows.filter((r) => !r.isValid).length;
  const warningRowsCount = rows.filter((r) => r.validationWarnings.length > 0).length;
  const validRowsCount = rows.length - errorRowsCount;

  return {
    totalRows: rows.length,
    validRowsCount,
    errorRowsCount,
    warningRowsCount,
    rows,
    canImport: rows.length > 0 && errorRowsCount === 0,
  };
}

/**
 * Sắp xếp Topological Sort theo thế hệ (Topological Order):
 * Đảm bảo các thế hệ tổ tiên đi trước, thế hệ con cháu đi sau.
 */
export function topologicalSortExcelRows(rows: ExcelMemberRow[]): ExcelMemberRow[] {
  const rowMap = new Map<string, ExcelMemberRow>();
  for (const r of rows) {
    rowMap.set(String(r.stt), r);
  }

  const inDegree = new Map<string, number>();
  const childrenAdj = new Map<string, string[]>();

  for (const r of rows) {
    const key = String(r.stt);
    inDegree.set(key, 0);
    childrenAdj.set(key, []);
  }

  for (const r of rows) {
    const key = String(r.stt);
    const parents = [r.fatherStt, r.motherStt].filter(Boolean).map(String);

    for (const p of parents) {
      if (rowMap.has(p)) {
        childrenAdj.get(p)?.push(key);
        inDegree.set(key, (inDegree.get(key) || 0) + 1);
      }
    }
  }

  // Hàng đợi các node không có cha mẹ trong file (bậc vào = 0)
  const queue: string[] = [];
  inDegree.forEach((deg, key) => {
    if (deg === 0) {
      queue.push(key);
    }
  });

  const sortedKeys: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedKeys.push(curr);

    const children = childrenAdj.get(curr) || [];
    for (const ch of children) {
      const newDeg = (inDegree.get(ch) || 0) - 1;
      inDegree.set(ch, newDeg);
      if (newDeg === 0) {
        queue.push(ch);
      }
    }
  }

  // Trường hợp có node còn sót lại (do chu trình hoặc bị cô lập)
  for (const r of rows) {
    const key = String(r.stt);
    if (!sortedKeys.includes(key)) {
      sortedKeys.push(key);
    }
  }

  return sortedKeys.map((k) => rowMap.get(k)!).filter(Boolean);
}

/**
 * Sinh file Excel mẫu (.xlsx) chứa cấu trúc chuẩn và các dòng dữ liệu ví dụ
 */
export function generateExcelTemplate(): Uint8Array {
  const sampleData = [
    {
      'STT': 1,
      'Họ và Tên': 'Nguyễn Văn Khởi',
      'Giới tính': 'Nam',
      'Trạng thái': 'Đã mất',
      'STT Bố': '',
      'STT Mẹ': '',
      'STT Vợ/Chồng': 2,
      'Năm sinh': 1880,
      'Ngày mất (Âm)': 15,
      'Tháng mất (Âm)': 7,
      'Tháng nhuận (Âm)': 'S',
      'Năm Can Chi': 'Canh Tý',
      'Năm mất (Dương)': 1950,
      'Thứ tự sinh': 1,
      'Con trưởng (Đ/S)': 'Đ',
      'Con nuôi (Đ/S)': 'S',
      'Cụ Tổ (Đ/S)': 'Đ',
      'Nơi an táng': 'Nghĩa trang Dòng họ, Lô A1',
      'Ghi chú / Tiểu sử': 'Cụ Thủy Tổ khai hoang lập nghiệp dòng họ',
    },
    {
      'STT': 2,
      'Họ và Tên': 'Trần Thị Nhàn',
      'Giới tính': 'Nữ',
      'Trạng thái': 'Đã mất',
      'STT Bố': '',
      'STT Mẹ': '',
      'STT Vợ/Chồng': 1,
      'Năm sinh': 1885,
      'Ngày mất (Âm)': 20,
      'Tháng mất (Âm)': 11,
      'Tháng nhuận (Âm)': 'S',
      'Năm Can Chi': 'Ất Mùi',
      'Năm mất (Dương)': 1955,
      'Thứ tự sinh': 1,
      'Con trưởng (Đ/S)': 'S',
      'Con nuôi (Đ/S)': 'S',
      'Cụ Tổ (Đ/S)': 'S',
      'Nơi an táng': 'Nghĩa trang Dòng họ, Lô A2',
      'Ghi chú / Tiểu sử': 'Bà Cả Chánh thất của Cụ Khởi',
    },
    {
      'STT': 3,
      'Họ và Tên': 'Nguyễn Văn Bình',
      'Giới tính': 'Nam',
      'Trạng thái': 'Đã mất',
      'STT Bố': 1,
      'STT Mẹ': 2,
      'STT Vợ/Chồng': '',
      'Năm sinh': 1910,
      'Ngày mất (Âm)': 10,
      'Tháng mất (Âm)': 3,
      'Tháng nhuận (Âm)': 'S',
      'Năm Can Chi': 'Canh Ngọ',
      'Năm mất (Dương)': 1980,
      'Thứ tự sinh': 1,
      'Con trưởng (Đ/S)': 'Đ',
      'Con nuôi (Đ/S)': 'S',
      'Cụ Tổ (Đ/S)': 'S',
      'Nơi an táng': 'Nghĩa trang Cây Gạo, Lô B',
      'Ghi chú / Tiểu sử': 'Trưởng Chi 1, Đời 2',
    },
    {
      'STT': 4,
      'Họ và Tên': 'Nguyễn Văn Cường',
      'Giới tính': 'Nam',
      'Trạng thái': 'Đã mất',
      'STT Bố': 1,
      'STT Mẹ': 2,
      'STT Vợ/Chồng': '',
      'Năm sinh': 1915,
      'Ngày mất (Âm)': 5,
      'Tháng mất (Âm)': 8,
      'Tháng nhuận (Âm)': 'S',
      'Năm Can Chi': 'Ất Mão',
      'Năm mất (Dương)': 1985,
      'Thứ tự sinh': 2,
      'Con trưởng (Đ/S)': 'S',
      'Con nuôi (Đ/S)': 'S',
      'Cụ Tổ (Đ/S)': 'S',
      'Nơi an táng': 'Nghĩa trang Cây Gạo, Lô C',
      'Ghi chú / Tiểu sử': 'Trưởng Chi 2, Đời 2',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: EXCEL_COLUMNS });

  // Định dạng độ rộng cột (Column Widths)
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Họ và Tên
    { wch: 10 }, // Giới tính
    { wch: 12 }, // Trạng thái
    { wch: 8 },  // STT Bố
    { wch: 8 },  // STT Mẹ
    { wch: 14 }, // STT Vợ/Chồng
    { wch: 10 }, // Năm sinh
    { wch: 14 }, // Ngày mất (Âm)
    { wch: 14 }, // Tháng mất (Âm)
    { wch: 16 }, // Tháng nhuận (Âm)
    { wch: 14 }, // Năm Can Chi
    { wch: 14 }, // Năm mất (Dương)
    { wch: 12 }, // Thứ tự sinh
    { wch: 16 }, // Con trưởng (Đ/S)
    { wch: 14 }, // Con nuôi (Đ/S)
    { wch: 12 }, // Cụ Tổ (Đ/S)
    { wch: 28 }, // Nơi an táng
    { wch: 35 }, // Ghi chú / Tiểu sử
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Gia_Pha_Mau');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buffer);
}
