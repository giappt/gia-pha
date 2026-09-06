import fs from 'fs';
import * as XLSX from 'xlsx';
import path from 'path';

const rawData = JSON.parse(fs.readFileSync('scratch/extracted_members.json', 'utf8'));

const EXCEL_COLUMNS = [
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

const excelRows = rawData.map((m) => {
  return {
    'STT': m.stt,
    'Họ và Tên': m.fullName,
    'Giới tính': m.gender,
    'Trạng thái': m.lifeStatus,
    'STT Bố': m.fatherStt ?? '',
    'STT Mẹ': m.motherStt ?? '',
    'STT Vợ/Chồng': m.spouseStt ?? '',
    'Năm sinh': m.birthYear ?? '',
    'Ngày mất (Âm)': m.deathLunarDay ?? '',
    'Tháng mất (Âm)': m.deathLunarMonth ?? '',
    'Tháng nhuận (Âm)': m.deathLunarIsLeap || 'S',
    'Năm Can Chi': m.deathLunarYearName || '',
    'Năm mất (Dương)': m.deathSolarYear ?? '',
    'Thứ tự sinh': m.birthOrder ?? '',
    'Con trưởng (Đ/S)': m.isSenior || 'S',
    'Con nuôi (Đ/S)': m.isAdopted || 'S',
    'Cụ Tổ (Đ/S)': m.isRoot || 'S',
    'Nơi an táng': m.burialLocation || '',
    'Ghi chú / Tiểu sử': m.notes || '',
  };
});

const worksheet = XLSX.utils.json_to_sheet(excelRows, { header: EXCEL_COLUMNS });

// Set column widths for comfortable editing
worksheet['!cols'] = [
  { wch: 6 },  // STT
  { wch: 28 }, // Họ và Tên
  { wch: 10 }, // Giới tính
  { wch: 12 }, // Trạng thái
  { wch: 10 }, // STT Bố
  { wch: 10 }, // STT Mẹ
  { wch: 14 }, // STT Vợ/Chồng
  { wch: 10 }, // Năm sinh
  { wch: 14 }, // Ngày mất (Âm)
  { wch: 15 }, // Tháng mất (Âm)
  { wch: 16 }, // Tháng nhuận (Âm)
  { wch: 14 }, // Năm Can Chi
  { wch: 16 }, // Năm mất (Dương)
  { wch: 12 }, // Thứ tự sinh
  { wch: 15 }, // Con trưởng (Đ/S)
  { wch: 14 }, // Con nuôi (Đ/S)
  { wch: 12 }, // Cụ Tổ (Đ/S)
  { wch: 25 }, // Nơi an táng
  { wch: 45 }, // Ghi chú / Tiểu sử
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'GiaPhaHoPhamVan');

const outputPath = 'docs/data/gia_pha_ho_pham_van.xlsx';
XLSX.writeFile(workbook, outputPath);

// Tự hủy file tạm scratch theo chuẩn [R-SCRATCH]
if (fs.existsSync('scratch/extracted_members.json')) {
  fs.unlinkSync('scratch/extracted_members.json');
}

console.log(`Successfully generated ${outputPath}`);
console.log(`Total rows written: ${excelRows.length}`);
