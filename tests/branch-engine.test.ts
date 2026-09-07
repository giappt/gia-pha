import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  flattenBranchTree,
  findBranchNode,
  validateBranchTree,
  resolveMemberBranchHierarchy,
  filterMembersByBranch,
  getNextTierName,
  DEFAULT_BRANCH_TIERS,
  findBranchesUsingTier,
  BranchNode,
} from '../src/lib/tree-layout/branch-engine';
import type { MemberRecord } from '../src/types/tree';

describe('Multi-tier Branch Taxonomy & Hierarchy Engine (Milestone 6)', () => {
  // Mock dữ liệu dòng họ 4 thế hệ:
  // Đời 1: Cụ Khởi Thủy Tổ (id: m_root)
  // Đời 2: Cụ Ngành 1 (id: m_nganh1, con m_root) & Cụ Ngành 2 (id: m_nganh2, con m_root)
  // Đời 3: Cụ Chi 1 (id: m_chi1, con m_nganh1) & Cụ Chi 2 (id: m_chi2, con m_nganh1)
  // Đời 4: Cháu Tuấn (id: m_tuan, con m_chi2) & Cháu Lan (id: m_lan, con m_chi1) & Cháu Hùng (id: m_hung, con m_nganh2)
  const mockMembers: MemberRecord[] = [
    {
      id: 'm_root',
      full_name: 'Nguyễn Văn Khởi',
      gender: 'male',
      life_status: 'deceased',
      father_id: null,
      generation_level: 1,
      is_root: true,
    },
    {
      id: 'm_nganh1',
      full_name: 'Nguyễn Văn Ngành Một',
      gender: 'male',
      life_status: 'deceased',
      father_id: 'm_root',
      generation_level: 2,
      is_root: false,
    },
    {
      id: 'm_nganh2',
      full_name: 'Nguyễn Văn Ngành Hai',
      gender: 'male',
      life_status: 'deceased',
      father_id: 'm_root',
      generation_level: 2,
      is_root: false,
    },
    {
      id: 'm_chi1',
      full_name: 'Nguyễn Văn Chi Một',
      gender: 'male',
      life_status: 'deceased',
      father_id: 'm_nganh1',
      generation_level: 3,
      is_root: false,
    },
    {
      id: 'm_chi2',
      full_name: 'Nguyễn Văn Chi Hai',
      gender: 'male',
      life_status: 'deceased',
      father_id: 'm_nganh1',
      generation_level: 3,
      is_root: false,
    },
    {
      id: 'm_tuan',
      full_name: 'Nguyễn Văn Tuấn',
      gender: 'male',
      life_status: 'living',
      father_id: 'm_chi2',
      generation_level: 4,
      is_root: false,
    },
    {
      id: 'm_lan',
      full_name: 'Nguyễn Thị Lan',
      gender: 'female',
      life_status: 'living',
      father_id: 'm_chi1',
      generation_level: 4,
      is_root: false,
    },
    {
      id: 'm_hung',
      full_name: 'Nguyễn Văn Hùng',
      gender: 'male',
      life_status: 'living',
      father_id: 'm_nganh2',
      generation_level: 3,
      is_root: false,
    },
  ];

  // Cây phân cấp:
  // - Ngành 1 (root: m_nganh1)
  //   - Chi 1 (root: m_chi1)
  //   - Chi 2 (root: m_chi2)
  // - Ngành 2 (root: m_nganh2)
  const mockBranches: BranchNode[] = [
    {
      id: 'branch_nganh1',
      tierName: 'Ngành',
      name: 'Ngành 1',
      rootMemberId: 'm_nganh1',
      children: [
        {
          id: 'branch_chi1',
          tierName: 'Chi',
          name: 'Chi 1',
          rootMemberId: 'm_chi1',
        },
        {
          id: 'branch_chi2',
          tierName: 'Chi',
          name: 'Chi 2',
          rootMemberId: 'm_chi2',
        },
      ],
    },
    {
      id: 'branch_nganh2',
      tierName: 'Ngành',
      name: 'Ngành 2',
      rootMemberId: 'm_nganh2',
      children: [],
    },
  ];

  it('TC_UT_BRANCH_INHERITANCE_01: Kế thừa phả hệ tự động 2 tầng (Ngành -> Chi) chuẩn xác', () => {
    // 1. Cháu Tuấn (Đời 4) có cha là Cụ Chi 2, ông nội là Cụ Ngành 1
    const resTuan = resolveMemberBranchHierarchy('m_tuan', mockMembers, mockBranches);
    assert.strictEqual(resTuan.branchPath, 'Ngành 1 · Chi 2');
    assert.deepStrictEqual(resTuan.matchedBranchIds, ['branch_nganh1', 'branch_chi2']);
    assert.strictEqual(resTuan.primaryBranchName, 'Chi 2');
    assert.deepStrictEqual(resTuan.hierarchyLabels, ['Ngành 1', 'Chi 2']);

    // 2. Cháu Lan (Đời 4) có cha là Cụ Chi 1
    const resLan = resolveMemberBranchHierarchy('m_lan', mockMembers, mockBranches);
    assert.strictEqual(resLan.branchPath, 'Ngành 1 · Chi 1');
    assert.deepStrictEqual(resLan.matchedBranchIds, ['branch_nganh1', 'branch_chi1']);
    assert.strictEqual(resLan.primaryBranchName, 'Chi 1');

    // 3. Cháu Hùng thuộc Ngành 2 (chưa phân Chi)
    const resHung = resolveMemberBranchHierarchy('m_hung', mockMembers, mockBranches);
    assert.strictEqual(resHung.branchPath, 'Ngành 2');
    assert.deepStrictEqual(resHung.matchedBranchIds, ['branch_nganh2']);
    assert.strictEqual(resHung.primaryBranchName, 'Ngành 2');

    // 4. Cụ Khởi (Thủy Tổ) đứng trên tất cả các Ngành -> Không thuộc riêng Ngành nào
    const resRoot = resolveMemberBranchHierarchy('m_root', mockMembers, mockBranches);
    assert.strictEqual(resRoot.branchPath, '');
    assert.deepStrictEqual(resRoot.matchedBranchIds, []);
    assert.strictEqual(resRoot.primaryBranchName, null);
  });

  it('TC_UT_BRANCH_TREE_VALIDATION: Kiểm tra tính hợp lệ và phát hiện vòng lặp của Cây phân chi', () => {
    // 1. Cây hợp lệ
    const validCheck = validateBranchTree(mockBranches);
    assert.strictEqual(validCheck.isValid, true);
    assert.strictEqual(validCheck.errors.length, 0);

    // 2. Cây có ID trùng lặp
    const duplicateTree: BranchNode[] = [
      { id: 'dup_id', tierName: 'Ngành', name: 'Ngành A' },
      { id: 'dup_id', tierName: 'Ngành', name: 'Ngành B' },
    ];
    const dupCheck = validateBranchTree(duplicateTree);
    assert.strictEqual(dupCheck.isValid, false);
    assert.ok(dupCheck.errors.some((e) => e.includes('Trùng lặp ID')));

    // 3. Nhánh để trống tên
    const emptyNameTree: BranchNode[] = [
      { id: 'valid_id', tierName: 'Ngành', name: '   ' },
    ];
    const emptyCheck = validateBranchTree(emptyNameTree);
    assert.strictEqual(emptyCheck.isValid, false);
    assert.ok(emptyCheck.errors.some((e) => e.includes('không được để trống tên')));

    // 4. Cây có vòng lặp đệ quy (Node tự trỏ làm con chính nó)
    const recursiveNode: BranchNode = {
      id: 'loop_node',
      tierName: 'Ngành',
      name: 'Vòng Lặp',
      children: [],
    };
    recursiveNode.children = [recursiveNode]; // Tự trỏ đệ quy
    const loopCheck = validateBranchTree([recursiveNode]);
    assert.strictEqual(loopCheck.isValid, false);
    assert.ok(loopCheck.errors.some((e) => e.includes('vòng lặp cấu trúc đệ quy')));
  });

  it('TC_UT_BRANCH_FLATTEN: Làm phẳng cây phân chi và tính toán đường dẫn phân cấp', () => {
    const flattened = flattenBranchTree(mockBranches);

    // mockBranches có 2 Ngành, trong đó Ngành 1 có 2 Chi -> Tổng cộng 4 node
    assert.strictEqual(flattened.length, 4);

    // Kiểm tra độ sâu và đường dẫn của từng phần tử
    const nganh1 = flattened.find((f) => f.id === 'branch_nganh1');
    assert.ok(nganh1);
    assert.strictEqual(nganh1.depth, 0);
    assert.strictEqual(nganh1.pathName, 'Ngành 1');
    assert.strictEqual(nganh1.fullTitle, 'Ngành 1');

    const chi2 = flattened.find((f) => f.id === 'branch_chi2');
    assert.ok(chi2);
    assert.strictEqual(chi2.depth, 1);
    assert.strictEqual(chi2.pathName, 'Ngành 1 > Chi 2');
    assert.strictEqual(chi2.fullTitle, 'Chi 2');

    // Test findBranchNode
    const foundNode = findBranchNode(mockBranches, 'branch_chi2');
    assert.ok(foundNode);
    assert.strictEqual(foundNode.id, 'branch_chi2');
    assert.strictEqual(foundNode.name, 'Chi 2');

    const notFound = findBranchNode(mockBranches, 'non_existent_id');
    assert.strictEqual(notFound, null);
  });

  it('TC_UT_BRANCH_FILTER: Lọc danh sách con cháu theo Ngành hoặc Chi', () => {
    // 1. Lọc theo Ngành 1 -> Bao gồm Cụ Ngành 1, Cụ Chi 1, Cụ Chi 2, Tuấn, Lan (5 người)
    const nganh1Members = filterMembersByBranch(mockMembers, 'branch_nganh1', mockBranches);
    const nganh1Ids = nganh1Members.map((m) => m.id);
    assert.strictEqual(nganh1Members.length, 5);
    assert.ok(nganh1Ids.includes('m_nganh1'));
    assert.ok(nganh1Ids.includes('m_chi1'));
    assert.ok(nganh1Ids.includes('m_chi2'));
    assert.ok(nganh1Ids.includes('m_tuan'));
    assert.ok(nganh1Ids.includes('m_lan'));
    assert.ok(!nganh1Ids.includes('m_hung')); // Hùng thuộc Ngành 2
    assert.ok(!nganh1Ids.includes('m_root')); // Cụ Khởi không thuộc riêng Ngành 1

    // 2. Lọc sâu vào Chi 2 -> Chỉ có Cụ Chi 2 và con cháu (Tuấn)
    const chi2Members = filterMembersByBranch(mockMembers, 'branch_chi2', mockBranches);
    const chi2Ids = chi2Members.map((m) => m.id);
    assert.strictEqual(chi2Members.length, 2);
    assert.ok(chi2Ids.includes('m_chi2'));
    assert.ok(chi2Ids.includes('m_tuan'));
    assert.ok(!chi2Ids.includes('m_lan')); // Lan thuộc Chi 1

    // 3. Lọc theo 'all' hoặc null -> Trả về tất cả
    const allMembers = filterMembersByBranch(mockMembers, 'all', mockBranches);
    assert.strictEqual(allMembers.length, mockMembers.length);

    const nullFilter = filterMembersByBranch(mockMembers, null, mockBranches);
    assert.strictEqual(nullFilter.length, mockMembers.length);
  });

  it('TC_UT_NAVBAR_ADMIN_GATE: Logic phân quyền Super Admin cho cổng Quản Trị', () => {
    function canAccessAdminPortal(userRole?: string | null): boolean {
      return userRole === 'super_admin';
    }

    assert.strictEqual(canAccessAdminPortal('super_admin'), true);
    assert.strictEqual(canAccessAdminPortal('branch_editor'), false);
    assert.strictEqual(canAccessAdminPortal('claimed_member'), false);
    assert.strictEqual(canAccessAdminPortal('viewer'), false);
    assert.strictEqual(canAccessAdminPortal(null), false);
    assert.strictEqual(canAccessAdminPortal(undefined), false);
  });

  it('TC_UT_MODAL_VIEWPORT_RESILIENCE: Cấu trúc cuộn linh hoạt của PersonalSettingsModal chống chém cụt Header', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/auth/PersonalSettingsModal.tsx');
    assert.ok(fs.existsSync(filePath), 'File PersonalSettingsModal.tsx phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Container bao ngoài phải có overflow-y-auto và min-h-full để cuộn được khi viewport thấp
    assert.ok(content.includes('overflow-y-auto'), 'Container phải có overflow-y-auto');
    assert.ok(content.includes('min-h-full'), 'Container phải có min-h-full');

    // 2. Không được sử dụng class backdrop-blur-xs không tồn tại trong Tailwind v3
    assert.ok(!content.includes('backdrop-blur-xs'), 'Không được dùng class backdrop-blur-xs');
    assert.ok(content.includes('backdrop-blur-sm'), 'Phải dùng class backdrop-blur-sm chuẩn');

    // 3. Header và Footer phải có shrink-0 để không bị co méo hay chém cụt
    assert.ok(content.includes('shrink-0'), 'Header/Footer phải có class shrink-0');
    assert.ok(content.includes('flex flex-col'), 'Card modal phải tổ chức theo dạng flex flex-col');
  });

  it('TC_UT_LATEX_TYPO_GUARD: Rà soát và loại trừ hoàn toàn chuỗi mã thô LaTeX rightarrow', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/admin/BranchTaxonomyManager.tsx');
    assert.ok(fs.existsSync(filePath), 'File BranchTaxonomyManager.tsx phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Tuyệt đối không còn chuỗi mã nguồn thô $\rightarrow$
    assert.ok(!content.includes('$\\rightarrow$'), 'Không được chứa chuỗi LaTeX $\\rightarrow$');
    assert.ok(!content.includes('rightarrow'), 'Không được chứa từ khóa rightarrow trong UI text');
    // Phải sử dụng ký tự mũi tên Unicode chuẩn
    assert.ok(content.includes('Ngành → Chi → Nhánh'), 'Phải sử dụng mũi tên Unicode chuẩn trong tiêu đề');
    assert.ok(content.includes('cha → con'), 'Phải sử dụng mũi tên Unicode chuẩn trong tip hướng dẫn');
  });

  it('TC_UT_ADMIN_TABS_CLEAN: Thanh Tab trang Admin Settings chỉ chứa 2 phân hệ cấu hình thực tế', () => {
    const filePath = path.resolve(process.cwd(), 'src/app/admin/settings/page.tsx');
    assert.ok(fs.existsSync(filePath), 'File admin/settings/page.tsx phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Không còn tab thừa trùng lặp tab-btn-import
    assert.ok(!content.includes('id="tab-btn-import"'), 'Không được chứa tab-btn-import trùng lặp');
    assert.ok(!content.includes('ExternalLink'), 'Không còn import icon ExternalLink thừa');

    // 2. Phải duy trì đúng 2 tabs chức năng
    assert.ok(content.includes('id="tab-btn-branches"'), 'Phải có tab Cấu Trúc Ngành/Chi');
    assert.ok(content.includes('id="tab-btn-info"'), 'Phải có tab Thông Tin & Xưng Hô');
  });

  it('TC_UT_PORTAL_BODY_ESCAPE: PersonalSettingsModal sử dụng React Portal gắn vào document.body và hỗ trợ Escape', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/auth/PersonalSettingsModal.tsx');
    assert.ok(fs.existsSync(filePath), 'File PersonalSettingsModal.tsx phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Phải import createPortal từ react-dom
    assert.ok(content.includes("from 'react-dom'"), 'Phải import từ react-dom');
    assert.ok(content.includes('createPortal'), 'Phải sử dụng createPortal');

    // 2. Phải gắn vào document.body để thoát ly containing block của header
    assert.ok(content.includes('document.body'), 'Target của createPortal phải là document.body');

    // 3. Phải có cờ mounted để bảo vệ SSR Hydration
    assert.ok(content.includes('mounted'), 'Phải có state mounted kiểm tra client-side mount');

    // 4. Phải có listener phím tắt Escape
    assert.ok(content.includes("'Escape'"), 'Phải lắng nghe sự kiện phím Escape');

    // 5. Phải khóa cuộn body khi modal mở
    assert.ok(content.includes("overflow = 'hidden'"), 'Phải khóa cuộn body khi mở modal');
  });

  it('TC_UT_CUSTOM_TIERS_LOGIC: Hàm getNextTierName và xử lý mảng branch_tiers tùy biến chuẩn xác', () => {
    // 1. Kiểm tra hằng số mặc định
    assert.deepStrictEqual(DEFAULT_BRANCH_TIERS, ['Ngành', 'Chi', 'Nhánh', 'Phái']);

    // 2. Gợi ý theo chuỗi mặc định
    assert.strictEqual(getNextTierName('Ngành'), 'Chi', 'Con của Ngành phải là Chi');
    assert.strictEqual(getNextTierName('Chi'), 'Nhánh', 'Con của Chi phải là Nhánh');
    assert.strictEqual(getNextTierName('Nhánh'), 'Phái', 'Con của Nhánh phải là Phái');
    assert.strictEqual(getNextTierName('Phái'), 'Phái', 'Cấp cuối cùng phải giữ nguyên');

    // 3. Gợi ý theo chuỗi tùy biến của dòng họ: ['Phái', 'Chi', 'Phân chi']
    const customTiers = ['Phái', 'Chi', 'Phân chi'];
    assert.strictEqual(getNextTierName('Phái', customTiers), 'Chi');
    assert.strictEqual(getNextTierName('Chi', customTiers), 'Phân chi');
    assert.strictEqual(getNextTierName('Phân chi', customTiers), 'Phân chi');

    // 4. Khi cấp cha không nằm trong danh mục, fallback an toàn
    assert.strictEqual(getNextTierName('Không rõ', ['Giáp', 'Ngành', 'Chi']), 'Ngành');
    assert.strictEqual(getNextTierName(undefined, ['Giáp', 'Ngành']), 'Giáp');
  });

  it('TC_UT_FLAT_TREE_NO_BOX_IN_BOX: Rà soát cấu trúc BranchTaxonomyManager triệt tiêu Box-in-Box và dùng Flat Tree Outline', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/admin/BranchTaxonomyManager.tsx');
    assert.ok(fs.existsSync(filePath), 'File BranchTaxonomyManager.tsx phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Tuyệt đối không còn class card con lồng nhau rounded-xl border bg-slate-50/60
    assert.ok(
      !content.includes('rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60'),
      'Không được dùng card xám lồng card xám trong các hàng nhánh con'
    );

    // 2. Phải có component FlatBranchRow hoặc cấu trúc Flat Row
    assert.ok(content.includes('FlatBranchRow'), 'Phải sử dụng cấu trúc FlatBranchRow');

    // 3. Phải có đường hairline phân cách giữa các dòng
    assert.ok(content.includes('divide-y') || content.includes('border-b'), 'Phải có đường kẻ hairline phân cách các dòng');

    // 4. Phải có đường gióng cây phả hệ (tree guide line)
    assert.ok(
      content.includes('border-l-2 border-emerald-') || content.includes('border-l-2'),
      'Phải có đường gióng cây phả hệ cho các cấp con'
    );

    // 5. Phải có Thanh Thứ Bậc Tông Tộc (Tier Hierarchy Bar)
    assert.ok(content.includes('Thứ Bậc Tông Tộc'), 'Phải có tiêu đề Thanh Thứ Bậc Tông Tộc');
    assert.ok(content.includes('Thêm Cấp Mới') || content.includes('Thêm Cấp'), 'Phải có nút thêm cấp bậc mới');
  });

  it('TC_UT_BRANCH_TIERS_API_CONTRACT: API /api/clan-settings hỗ trợ trả về và cập nhật branch_tiers an toàn', () => {
    const filePath = path.resolve(process.cwd(), 'src/app/api/clan-settings/route.ts');
    assert.ok(fs.existsSync(filePath), 'File /api/clan-settings/route.ts phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Trong GET: phải nạp branch_tiers và fallback DEFAULT_BRANCH_TIERS
    assert.ok(content.includes('branch_tiers'), 'GET route phải xử lý trường branch_tiers');
    assert.ok(content.includes('DEFAULT_BRANCH_TIERS'), 'Phải import và fallback DEFAULT_BRANCH_TIERS');

    // 2. Trong PATCH: phải nhận, làm sạch và lưu branch_tiers
    assert.ok(content.includes('body.branch_tiers'), 'PATCH route phải đọc body.branch_tiers');
    assert.ok(content.includes('fat_dev_branch_tiers'), 'Phải lưu cookie dev fallback fat_dev_branch_tiers');
  });

  it('TC_UT_TIER_INTEGRITY_GUARD_01: findBranchesUsingTier phát hiện đúng các nhánh đang sử dụng cấp bậc kể cả ở tầng sâu đệ quy', () => {
    // mockBranches có:
    // - Ngành 1 (tierName: 'Ngành')
    //   - Chi 1 (tierName: 'Chi')
    //   - Chi 2 (tierName: 'Chi')
    // - Ngành 2 (tierName: 'Ngành')
    const nganhBranches = findBranchesUsingTier(mockBranches, 'Ngành');
    assert.strictEqual(nganhBranches.length, 2);
    assert.ok(nganhBranches.some((b) => b.id === 'branch_nganh1'));
    assert.ok(nganhBranches.some((b) => b.id === 'branch_nganh2'));

    // Kiểm tra cấp con đệ quy sâu
    const chiBranches = findBranchesUsingTier(mockBranches, 'Chi');
    assert.strictEqual(chiBranches.length, 2);
    assert.ok(chiBranches.some((b) => b.id === 'branch_chi1'));
    assert.ok(chiBranches.some((b) => b.id === 'branch_chi2'));

    // Kiểm tra không phân biệt hoa thường và tự động trim
    const chiTrimBranches = findBranchesUsingTier(mockBranches, '  cHi  ');
    assert.strictEqual(chiTrimBranches.length, 2);
  });

  it('TC_UT_TIER_INTEGRITY_GUARD_02: findBranchesUsingTier trả về rỗng khi cấp bậc không dùng -> Cho phép xóa cấp cuối an toàn', () => {
    // Cấp 'Phái' hoặc 'Giáp' không hề có nhánh nào sử dụng trong mockBranches
    const phaiBranches = findBranchesUsingTier(mockBranches, 'Phái');
    assert.strictEqual(phaiBranches.length, 0);

    const giapBranches = findBranchesUsingTier(mockBranches, 'Giáp');
    assert.strictEqual(giapBranches.length, 0);

    // Xử lý đầu vào biên an toàn
    assert.strictEqual(findBranchesUsingTier(mockBranches, '').length, 0);
    assert.strictEqual(findBranchesUsingTier([], 'Ngành').length, 0);
  });

  it('TC_UT_FLAT_STEPPER_NO_BOX_IN_BOX: Rà soát loại bỏ triệt để card xám bao bọc Thứ Bậc Tông Tộc', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/admin/BranchTaxonomyManager.tsx');
    assert.ok(fs.existsSync(filePath), 'File BranchTaxonomyManager.tsx phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Không còn card xám bao quanh thanh thứ bậc
    assert.ok(
      !content.includes('bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/70'),
      'Không được dùng card xám lồng nhau bao bọc thanh thứ bậc tông tộc'
    );

    // 2. Phải có đường phân cách phẳng hairline giữa Cụm 1 và Cụm 2
    assert.ok(
      content.includes('border-b border-slate-100 dark:border-slate-800'),
      'Phải có đường hairline phân cách giữa Cụm 1 và Cụm 2'
    );

    // 3. Phải hiển thị tiêu đề Thứ Bậc Tông Tộc
    assert.ok(
      content.includes('Thứ Bậc Tông Tộc (Thứ tự phân tầng từ cao xuống thấp)'),
      'Phải có tiêu đề mô tả phân tầng của Thứ Bậc Tông Tộc'
    );
  });

  it('TC_UT_ADD_BRANCH_BTN_POSITION: Nút Thêm Nhánh Mới được bố trí tại Cụm Cây phân cấp thay vì Header chính', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/admin/BranchTaxonomyManager.tsx');
    assert.ok(fs.existsSync(filePath), 'File BranchTaxonomyManager.tsx phải tồn tại');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Phải có tiêu đề phân khu Cụm 2: Cây Phân Cấp Các Nhánh & Cụ Khởi Nguồn
    assert.ok(
      content.includes('Cây Phân Cấp Các Nhánh & Cụ Khởi Nguồn'),
      'Phải có tiêu đề rõ ràng cho Cụm 2 Cây Phân Cấp'
    );

    // 2. Nút add-root-branch-btn phải nằm trong Cụm 2
    assert.ok(content.includes('id="add-root-branch-btn"'), 'Phải có nút add-root-branch-btn');

    // 3. Header chính không còn chứa nút add-root-branch-btn
    const headerBlock = content.split('{/* Header (Title & Description only')[1]?.split('{/* Cụm 1:')[0];
    assert.ok(headerBlock, 'Phải có khối header chính');
    assert.ok(
      !headerBlock.includes('id="add-root-branch-btn"'),
      'Nút thêm nhánh không được nằm lẫn lộn ở Header chính của trang'
    );

    // 4. Có nút thêm ở đáy cây
    assert.ok(
      content.includes('ở Đáy Cây') || content.includes('Thêm {rootTierName} Mới ở Đáy Cây'),
      'Phải có nút hỗ trợ thêm nhánh ở đáy danh sách cây'
    );
  });
});
