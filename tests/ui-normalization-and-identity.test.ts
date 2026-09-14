import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { calculateMemberAge } from '../src/lib/tree-layout/age-utils';
import { getMemberInitials } from '../src/lib/tree-layout/avatar-utils';

describe('UI Normalization & Identity Consistency Suite (Milestone 4 Polish)', () => {
  // TC_UT_AVATAR_NAME_WITH_PARENTHESES: Avatar Initials lọc sạch ngoặc đơn/kép và tên húy
  it('TC_UT_AVATAR_NAME_WITH_PARENTHESES: Avatar Initials lọc sạch ngoặc đơn/kép và tên húy', () => {
    assert.strictEqual(getMemberInitials('Phạm Văn Uyên (Nuôi)'), 'VU');
    assert.strictEqual(getMemberInitials('Phạm Văn Cường (Cường Nhỏ)'), 'VC');
    assert.strictEqual(getMemberInitials('Nguyễn Thị Kim [Kim Oanh]'), 'TK');
    assert.strictEqual(getMemberInitials('(Nuôi)'), 'NU');
    assert.strictEqual(getMemberInitials(''), 'TV');
  });

  // TC_UT_NODE_NAME_Y_ANCHOR_RESERVE: Thẻ Node bảo đảm chiều cao cố định 32px và slot 14px cho dòng 2
  it('TC_UT_NODE_NAME_Y_ANCHOR_RESERVE: Thẻ Node bảo đảm chiều cao cố định 32px và slot 14px cho dòng 2', () => {
    const memberNodePath = path.resolve(process.cwd(), 'src/components/tree/MemberNode.tsx');
    assert.ok(fs.existsSync(memberNodePath), 'File MemberNode.tsx phải tồn tại');
    const content = fs.readFileSync(memberNodePath, 'utf-8');

    // Kiểm tra container text có h-8 (32px) để khớp tuyệt đối với avatar 32x32px
    assert.ok(
      content.includes('min-w-0 flex-1 flex flex-col justify-center h-8'),
      'Text container phải có h-8 và flex flex-col justify-center để cố định vị trí Y'
    );

    // Kiểm tra dòng 2 có slot h-[14px] leading-[14px] và fallback \u00A0 chống sụp đổ dòng khi không có năm sinh/mất
    assert.ok(
      content.includes('h-[14px]'),
      'Dòng 2 năm sinh/mất phải có chiều cao cố định h-[14px]'
    );
    assert.ok(
      content.includes("\\u00A0") || content.includes('\u00A0'),
      'Dòng 2 phải có fallback khoảng trắng không ngắt dòng (\\u00A0) khi không có năm sinh/mất'
    );
  });

  // TC_UT_DECEASED_GENDER_BORDER_COLOR: Thẻ người đã mất giữ viền theo giới tính và không còn ký tự thập †
  it('TC_UT_DECEASED_GENDER_BORDER_COLOR: Thẻ người đã mất giữ viền theo giới tính và không còn ký tự thập †', () => {
    const memberNodePath = path.resolve(process.cwd(), 'src/components/tree/MemberNode.tsx');
    const content = fs.readFileSync(memberNodePath, 'utf-8');

    // Kiểm tra borderColor không bị ghi đè màu xám cho người đã mất (bỏ isDeceased khỏi borderColor)
    const borderColorBlock = content.slice(content.indexOf('const borderColor ='), content.indexOf('const avatarBg ='));
    assert.ok(
      !borderColorBlock.includes('isDeceased'),
      'borderColor tuyệt đối không được kiểm tra isDeceased để viền luôn theo giới tính Nam/Nữ'
    );
    assert.ok(borderColorBlock.includes('isMale'), 'borderColor phải phân định theo isMale');

    // Kiểm tra avatarBg vẫn giữ xám cho người đã mất
    const avatarBgBlock = content.slice(content.indexOf('const avatarBg ='), content.indexOf('const initials ='));
    assert.ok(avatarBgBlock.includes('isDeceased'), 'avatarBg phải giữ màu xám trang trọng cho người đã mất');

    // Kiểm tra không còn ký tự † trong MemberNode.tsx
    assert.ok(!content.includes('†'), 'MemberNode.tsx không được chứa ký tự dấu thập †');
    assert.ok(content.includes("'Đã mất'"), "MemberNode.tsx phải hiển thị nhãn 'Đã mất'");
  });

  // TC_UT_ALIAS_NAME_SEPARATION_CLEANSE: Tự động làm sạch tên chính và bóc tách Tên húy/Bí danh
  it('TC_UT_ALIAS_NAME_SEPARATION_CLEANSE: Tự động làm sạch tên chính và bóc tách Tên húy/Bí danh', () => {
    // Thuật toán bóc tách chuẩn
    const rawName = 'Phạm Văn Uyên (Nuôi)';
    const cleanFullName = rawName.replace(/[\(\[][^\)\]]*[\)\]]/g, '').trim();
    const aliasMatch = rawName.match(/[\(\[](.*?)[\)\]]/);
    const aliasName = aliasMatch ? aliasMatch[1].trim() : null;

    assert.strictEqual(cleanFullName, 'Phạm Văn Uyên', 'Tên chính phải được làm sạch hoàn toàn ngoặc');
    assert.strictEqual(aliasName, 'Nuôi', 'Tên húy phải bóc tách đúng từ trong ngoặc');

    // Kiểm tra code trong import route và MemberFormModal
    const importRoutePath = path.resolve(process.cwd(), 'src/app/api/admin/import/route.ts');
    const importContent = fs.readFileSync(importRoutePath, 'utf-8');
    assert.ok(
      importContent.includes('cleanFullName') && importContent.includes('full_name: cleanFullName'),
      'Import API phải lưu cleanFullName vào full_name'
    );

    const formModalPath = path.resolve(process.cwd(), 'src/components/modals/MemberFormModal.tsx');
    const formContent = fs.readFileSync(formModalPath, 'utf-8');
    assert.ok(
      formContent.includes('cleanedFullName') && formContent.includes('full_name: cleanedFullName'),
      'MemberFormModal phải làm sạch full_name trước khi submit'
    );
    assert.ok(!formContent.includes('<span>†</span>'), 'MemberFormModal không được chứa thẻ <span>†</span>');
  });

  // TC_UT_DRAWER_TUC_LABEL: MemberDetailDrawer hiển thị nhãn Tức: thay vì Tự:
  it('TC_UT_DRAWER_TUC_LABEL: MemberDetailDrawer hiển thị nhãn Tức: thay vì Tự:', () => {
    const drawerPath = path.resolve(process.cwd(), 'src/components/tree/MemberDetailDrawer.tsx');
    const content = fs.readFileSync(drawerPath, 'utf-8');

    assert.ok(content.includes('Tức:'), 'MemberDetailDrawer phải có nhãn Tức:');
    assert.ok(!content.includes('Tự:'), 'MemberDetailDrawer không được chứa nhãn Tự:');
    assert.ok(content.includes('{cleanFullName}'), 'Tiêu đề Drawer phải hiển thị {cleanFullName} đã lọc sạch ngoặc');
  });

  // TC_UT_AGE_UTILS_NO_DAGGER: Hàm calculateMemberAge không còn trả về ký tự †
  it('TC_UT_AGE_UTILS_NO_DAGGER: Hàm calculateMemberAge không còn trả về ký tự †', () => {
    const res = calculateMemberAge(1940, null, 'deceased', 2026);
    assert.ok(res !== null);
    assert.strictEqual(res.displayLabel, 'SN 1940 (Đã mất)');
    assert.ok(!res.displayLabel.includes('†'), 'displayLabel không được chứa ký tự †');
  });
});
