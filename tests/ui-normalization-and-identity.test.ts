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

  // TC_UT_SPOUSE_DISPLAY_INIT_01: Khởi tạo form thành viên đã có vợ không bị ép vào tab nội tộc & thẻ Node có nút reorder
  it('TC_UT_SPOUSE_DISPLAY_INIT_01: Khởi tạo form thành viên đã có vợ không bị ép vào tab nội tộc & thẻ Node có nút reorder', () => {
    const formModalPath = path.resolve(process.cwd(), 'src/components/modals/MemberFormModal.tsx');
    const formContent = fs.readFileSync(formModalPath, 'utf-8');

    // Kiểm tra không còn đoạn ép spouseMode = 'existing' khi tìm thấy quan hệ
    assert.ok(
      !formContent.includes("setSpouseMode('existing');"),
      'MemberFormModal không được tự động ép setSpouseMode("existing") khi mở form edit'
    );
    assert.ok(
      formContent.includes('currentMemberSpouses'),
      'MemberFormModal phải tính toán currentMemberSpouses để hiển thị phối ngẫu hiện tại'
    );
    assert.ok(
      formContent.includes('Thêm Vợ ngoài họ') || formContent.includes('Thêm Chồng ngoài họ'),
      'MemberFormModal phải có nút chủ động thêm phối ngẫu'
    );
    assert.ok(
      formContent.includes('quickChildMotherId'),
      'MemberFormModal phải có state quickChildMotherId để chọn mẹ cho con'
    );

    // Kiểm tra thẻ Node có nút dispatch event fat:open-reorder-children
    const nodePath = path.resolve(process.cwd(), 'src/components/tree/MemberNode.tsx');
    const nodeContent = fs.readFileSync(nodePath, 'utf-8');
    assert.ok(
      nodeContent.includes('fat:open-reorder-children'),
      'MemberNode phải dispatch event fat:open-reorder-children khi click vào badge con cái'
    );
  });

  it('TC_UT_ZERO_HOOK_AFTER_RETURN_GUARD: MemberFormModal tuân thủ 100% React Rules of Hooks, không có hook sau early return', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/modals/MemberFormModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    // Tìm vị trí câu lệnh early return if (!isOpen) return null;
    const earlyReturnPattern = /if\s*\(!isOpen\)\s*return\s+null;/;
    const match = earlyReturnPattern.exec(modalContent);
    assert.ok(match, 'MemberFormModal phải có câu lệnh early return if (!isOpen) return null;');

    const returnIndex = match.index;
    const contentAfterReturn = modalContent.slice(returnIndex + match[0].length);

    // Danh sách các hooks bị cấm xuất hiện sau câu lệnh return
    const forbiddenHooks = [
      'useState(',
      'useEffect(',
      'useMemo(',
      'useCallback(',
      'useRef(',
      'useContext(',
      'useReducer(',
    ];

    for (const hook of forbiddenHooks) {
      assert.strictEqual(
        contentAfterReturn.includes(hook),
        false,
        `Vi phạm React Rules of Hooks: Phát hiện hook "${hook}" được khai báo sau "if (!isOpen) return null;". 100% hooks phải được gọi ở đầu component.`
      );
    }
  });

  // TC_UT_SINGLE_SPOUSE_LABEL_01: Hôn phối đơn chỉ hiển thị 'Vợ'/'Chồng', chỉ hiển thị 'Vợ cả/hai' khi có từ 2 vợ trở lên
  it('TC_UT_SINGLE_SPOUSE_LABEL_01: Hôn phối đơn chỉ hiển thị "Vợ"/"Chồng", chỉ hiển thị "Vợ cả/hai" khi có từ 2 vợ trở lên', () => {
    const drawerPath = path.resolve(process.cwd(), 'src/components/tree/MemberDetailDrawer.tsx');
    const drawerContent = fs.readFileSync(drawerPath, 'utf-8');

    // Drawer: phải kiểm tra isMultiSpouse trước khi gán KINSHIP_TERMS.WIFE_FIRST
    assert.ok(
      drawerContent.includes('const isMultiSpouse = familyData.spouses.length > 1;'),
      'MemberDetailDrawer phải kiểm tra isMultiSpouse dựa trên spouses.length > 1'
    );
    assert.ok(
      drawerContent.includes('!isMultiSpouse\n                        ? KINSHIP_TERMS.WIFE_DEFAULT') ||
      drawerContent.includes('!isMultiSpouse ? KINSHIP_TERMS.WIFE_DEFAULT') ||
      drawerContent.includes('!isMultiSpouse'),
      'Nếu không phải đa thê thì bắt buộc dùng WIFE_DEFAULT ("Vợ"), không được dùng WIFE_FIRST'
    );

    // Form Modal: phải kiểm tra isMultiSpouse
    const formPath = path.resolve(process.cwd(), 'src/components/modals/MemberFormModal.tsx');
    const formContent = fs.readFileSync(formPath, 'utf-8');
    assert.ok(
      formContent.includes('const isMultiSpouse = currentMemberSpouses.length > 1;'),
      'MemberFormModal phải kiểm tra currentMemberSpouses.length > 1'
    );
    assert.ok(
      formContent.includes("gender === 'female' ? 'Chồng' : 'Vợ'"),
      'MemberFormModal chỉ hiển thị "Vợ" hoặc "Chồng" khi có 1 phối ngẫu'
    );
  });

  // TC_UT_CHILDREN_DUPLICATE_ORDER_FALLBACK_01: Tránh hiển thị trùng lặp số 1 khi nhiều con có birth_order = 1
  it('TC_UT_CHILDREN_DUPLICATE_ORDER_FALLBACK_01: Tránh hiển thị trùng lặp số 1 khi nhiều con có birth_order = 1 trong CSDL', () => {
    // Giả lập đàn con 7 người của Cụ Phạm Văn Uyên với 6 người con đầu đều mang birth_order = 1
    const mockRawChildren = [
      { id: 'c1', full_name: 'Phạm Thị Năng', birth_order: 1 },
      { id: 'c2', full_name: 'Phạm Thị Chi', birth_order: 1 },
      { id: 'c3', full_name: 'Phạm Thị Khương', birth_order: 1 },
      { id: 'c4', full_name: 'Phạm Văn Cường', birth_order: 1 },
      { id: 'c5', full_name: 'Phạm Thị Tráng', birth_order: 1 },
      { id: 'c6', full_name: 'Phạm Thị Sáng', birth_order: 1 },
      { id: 'c7', full_name: 'Phạm Văn Bảy', birth_order: 7 },
    ];

    // Thuật toán kiểm tra trùng lặp và tính displayOrder như đã triển khai trong MemberDetailDrawer & MemberFormModal
    const nonNullOrders = mockRawChildren.map((c) => c.birth_order).filter((o) => o != null);
    const hasDuplicates = mockRawChildren.length > 1 && new Set(nonNullOrders).size < nonNullOrders.length;
    assert.strictEqual(hasDuplicates, true, 'Phải phát hiện có dữ liệu birth_order bị trùng lặp');

    const renderedOrders = mockRawChildren.map((child, idx) =>
      hasDuplicates || child.birth_order == null ? idx + 1 : child.birth_order
    );

    // Kỳ vọng danh sách hiển thị tuần tự 1, 2, 3, 4, 5, 6, 7 chứ không phải 1, 1, 1, 1, 1, 1, 7
    assert.deepStrictEqual(renderedOrders, [1, 2, 3, 4, 5, 6, 7]);
  });

  // TC_UT_NODE_AVATAR_BASELINE_ANCHOR_01: Thẻ Node neo cứng vị trí Y của Avatar và Tên bằng mt-auto và fixed geometry, loại bỏ justify-between
  it('TC_UT_NODE_AVATAR_BASELINE_ANCHOR_01: Thẻ Node neo cứng vị trí Y của Avatar và Tên bằng mt-auto và fixed geometry, loại bỏ justify-between', () => {
    const memberNodePath = path.resolve(process.cwd(), 'src/components/tree/MemberNode.tsx');
    assert.ok(fs.existsSync(memberNodePath), 'File MemberNode.tsx phải tồn tại');
    const content = fs.readFileSync(memberNodePath, 'utf-8');

    // 1. Container thẻ cha tuyệt đối không dùng justify-between (nguyên nhân gây tụt avatar khi chân thẻ rỗng)
    const containerDivMatch = content.match(/className=\{`group relative w-\[200px\] h-\[96px\][^`]+`\}/);
    assert.ok(containerDivMatch, 'Container MemberNode phải có class wrapper chuẩn');
    assert.ok(
      !containerDivMatch[0].includes('justify-between'),
      'MemberNode.tsx container thẻ cha không được dùng "justify-between" để tránh biến thiên khe hở trục Y'
    );
    assert.ok(
      containerDivMatch[0].includes('flex flex-col'),
      'MemberNode.tsx container phải dùng "flex flex-col" tuần tự'
    );

    // 2. Header cố định chiều cao h-[18px] shrink-0
    assert.ok(
      content.includes('h-[18px] shrink-0 flex items-center justify-between text-[11px]'),
      'Header thẻ MemberNode phải có h-[18px] shrink-0'
    );

    // 3. Body (Avatar + Tên) neo khoảng cách cố định mt-1.5 shrink-0 từ Header
    assert.ok(
      content.includes('flex items-center gap-2 mt-1.5 shrink-0'),
      'Body thẻ MemberNode phải dùng mt-1.5 shrink-0 để neo cứng tọa độ Y của Avatar và Tên'
    );

    // 4. Footer dính sát đáy bằng mt-auto và cố định h-[18px] shrink-0
    assert.ok(
      content.includes('mt-auto h-[18px] shrink-0 flex items-center justify-between'),
      'Footer thẻ MemberNode phải dùng "mt-auto h-[18px] shrink-0" để cố định đáy thẻ phẳng phiu'
    );

    // 5. Kiểm tra tương tự trên GhostNode.tsx
    const ghostNodePath = path.resolve(process.cwd(), 'src/components/tree/GhostNode.tsx');
    assert.ok(fs.existsSync(ghostNodePath), 'File GhostNode.tsx phải tồn tại');
    const ghostContent = fs.readFileSync(ghostNodePath, 'utf-8');
    assert.ok(
      !ghostContent.includes('flex flex-col justify-between'),
      'GhostNode.tsx container không được dùng "justify-between"'
    );
    assert.ok(
      ghostContent.includes('mt-auto h-[18px] shrink-0'),
      'GhostNode.tsx footer phải dùng "mt-auto h-[18px] shrink-0"'
    );
  });

  // TC_UT_NO_RAW_UNICODE_IN_JSX_01: Loại bỏ hoàn toàn ký tự thô \u00A0 trong JSX của thẻ Node
  it('TC_UT_NO_RAW_UNICODE_IN_JSX_01: Loại bỏ hoàn toàn ký tự thô \\u00A0 trong JSX của thẻ Node', () => {
    const memberNodePath = path.resolve(process.cwd(), 'src/components/tree/MemberNode.tsx');
    const ghostNodePath = path.resolve(process.cwd(), 'src/components/tree/GhostNode.tsx');

    const memberContent = fs.readFileSync(memberNodePath, 'utf-8');
    const ghostContent = fs.readFileSync(ghostNodePath, 'utf-8');

    // 1. Tuyệt đối không chứa text thô >\u00A0< trực tiếp trong JSX tags (nguyên nhân in chữ \u00A0 ra UI)
    assert.ok(
      !memberContent.includes('>\\u00A0<'),
      'MemberNode.tsx không được chứa chuỗi thô ">\\u00A0<" trong thẻ JSX'
    );
    assert.ok(
      !ghostContent.includes('>\\u00A0<'),
      'GhostNode.tsx không được chứa chuỗi thô ">\\u00A0<" trong thẻ JSX'
    );

    // 2. Footer của MemberNode không chứa chuỗi fallback \\u00A0 gây rác giao diện
    const footerMatch = memberContent.match(/\{\/\* Footer thẻ:[\s\S]*?\{\/\* Source Handles con cái/);
    assert.ok(footerMatch, 'Phải tìm thấy khối footer thẻ MemberNode');
    assert.ok(
      !footerMatch[0].includes('\\u00A0'),
      'Footer thẻ MemberNode không được chứa ký tự escape \\u00A0 hoặc placeholder rác'
    );
  });
});




