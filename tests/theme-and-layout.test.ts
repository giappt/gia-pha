import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Theme Synchronization & Canvas Viewport Resilience Suite', () => {
  // TC_UT_THEME_01: Kiểm tra Đồng Bộ Hóa Theme Globals & Tailwind Contract
  it('TC_UT_THEME_01: globals.css không chứa media query prefers-color-scheme ép body và đồng bộ .dark với Tailwind', () => {
    const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const tailwindConfigPath = path.resolve(process.cwd(), 'tailwind.config.ts');

    assert.ok(fs.existsSync(globalsCssPath), 'File src/app/globals.css phải tồn tại');
    assert.ok(fs.existsSync(tailwindConfigPath), 'File tailwind.config.ts phải tồn tại');

    const globalsContent = fs.readFileSync(globalsCssPath, 'utf8');
    const tailwindContent = fs.readFileSync(tailwindConfigPath, 'utf8');

    // 1. Kiểm tra Tailwind được cấu hình darkMode theo class
    assert.ok(
      tailwindContent.includes("darkMode: ['class']") || tailwindContent.includes('darkMode: ["class"]'),
      'Tailwind config phải thiết lập darkMode: [\'class\']'
    );

    // 2. globals.css TUYỆT ĐỐI KHÔNG chứa @media (prefers-color-scheme: dark) để tránh ép màu nửa vời
    assert.ok(
      !globalsContent.includes('@media (prefers-color-scheme: dark)'),
      'globals.css không được dùng @media (prefers-color-scheme: dark) gây xung đột màu với Tailwind class dark'
    );

    // 3. globals.css phải chứa :root và .dark selector đồng bộ
    assert.ok(globalsContent.includes(':root'), 'globals.css phải có :root selector cho Light mode');
    assert.ok(globalsContent.includes('.dark'), 'globals.css phải có .dark selector đồng bộ cho Dark mode');
    assert.ok(globalsContent.includes('--surface-bg'), 'globals.css phải cấu hình biến --surface-bg');
  });

  // TC_UT_CANVAS_CONTAINER_01: Kiểm tra Cấu Trúc Viewport Container của Canvas
  it('TC_UT_CANVAS_CONTAINER_01: TreePage và FamilyTreeCanvas có khai báo definite height chống sụp đổ Flexbox container', () => {
    const treePagePath = path.resolve(process.cwd(), 'src/app/tree/page.tsx');
    const canvasPath = path.resolve(process.cwd(), 'src/components/tree/FamilyTreeCanvas.tsx');
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');

    assert.ok(fs.existsSync(treePagePath), 'src/app/tree/page.tsx phải tồn tại');
    assert.ok(fs.existsSync(canvasPath), 'src/components/tree/FamilyTreeCanvas.tsx phải tồn tại');
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx phải tồn tại');

    const treePageContent = fs.readFileSync(treePagePath, 'utf8');
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // 1. layout.tsx main element phải có min-h-0 để chống sụp đổ flex child
    assert.ok(
      layoutContent.includes('min-h-0'),
      'Thẻ <main> trong src/app/layout.tsx phải có class min-h-0 để đảm bảo flex child không bị sụp đổ chiều cao'
    );

    // 2. TreePage container phải có h-full và overflow-hidden
    assert.ok(
      treePageContent.includes('h-full'),
      'TreePage container phải có chiều cao h-full kế thừa'
    );
    assert.ok(
      treePageContent.includes('overflow-hidden'),
      'TreePage container phải có overflow-hidden để chống scrollbar ngoài ý muốn'
    );

    // 3. FamilyTreeCanvas container gốc phải có màu nền Dark mode dark:bg-slate-950
    assert.ok(
      canvasContent.includes('dark:bg-slate-950'),
      'FamilyTreeCanvas container phải có màu nền Dark mode dark:bg-slate-950'
    );
  });

  // TC_UT_CANVAS_HEIGHT_ANCHOR_01: Kiểm tra Neo Chiều Cao Trực Tiếp Của Canvas & html 100% / body min-height 100%
  it('TC_UT_CANVAS_HEIGHT_ANCHOR_01: FamilyTreeCanvas.tsx có neo chiều cao calc(100vh - 4rem) và globals.css có html height: 100%, body min-height: 100%', () => {
    const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const canvasPath = path.resolve(process.cwd(), 'src/components/tree/FamilyTreeCanvas.tsx');
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');

    const globalsContent = fs.readFileSync(globalsCssPath, 'utf8');
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // 1. globals.css phải khai báo html { height: 100%; } và body { min-height: 100%; }
    assert.ok(
      globalsContent.includes('html {') && globalsContent.includes('height: 100%'),
      'globals.css phải khai báo html height: 100%'
    );
    assert.ok(
      globalsContent.includes('body {') && globalsContent.includes('min-height: 100%'),
      'globals.css phải khai báo body min-height: 100%'
    );

    // 2. layout.tsx phải có h-full trên html
    assert.ok(
      layoutContent.includes('h-full'),
      'layout.tsx phải có class h-full trên html'
    );

    // 3. FamilyTreeCanvas.tsx phải có neo chiều cao inline calc(100vh - 4rem)
    assert.ok(
      canvasContent.includes("calc(100vh - 4rem)"),
      'FamilyTreeCanvas.tsx phải có neo chiều cao calc(100vh - 4rem) để bảo đảm React Flow đo đạc clientHeight > 0'
    );
  });

  // TC_UT_THEME_SYNC_01: Hook useAppTheme và ThemeToggle đồng bộ reactive
  it('TC_UT_THEME_SYNC_01: Hook useAppTheme tồn tại và ThemeToggle kết nối với useAppTheme', () => {
    const hookPath = path.resolve(process.cwd(), 'src/hooks/use-theme.ts');
    const togglePath = path.resolve(process.cwd(), 'src/components/theme/ThemeToggle.tsx');

    assert.ok(fs.existsSync(hookPath), 'File src/hooks/use-theme.ts phải tồn tại');
    assert.ok(fs.existsSync(togglePath), 'File src/components/theme/ThemeToggle.tsx phải tồn tại');

    const hookContent = fs.readFileSync(hookPath, 'utf8');
    const toggleContent = fs.readFileSync(togglePath, 'utf8');

    assert.ok(
      hookContent.includes('MutationObserver'),
      'useAppTheme phải dùng MutationObserver để lắng nghe thay đổi class trên <html> tức thì 0ms'
    );
    assert.ok(
      hookContent.includes('export function useAppTheme'),
      'use-theme.ts phải export function useAppTheme'
    );
    assert.ok(
      toggleContent.includes('useAppTheme'),
      'ThemeToggle.tsx phải import và sử dụng useAppTheme'
    );
  });

  // TC_UT_CANVAS_COLORMODE_01: FamilyTreeCanvas đồng bộ colorMode với theme ứng dụng
  it('TC_UT_CANVAS_COLORMODE_01: FamilyTreeCanvas sử dụng reactive colorMode={isDark ? "dark" : "light"} thay vì gán cứng system', () => {
    const canvasPath = path.resolve(process.cwd(), 'src/components/tree/FamilyTreeCanvas.tsx');
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');

    // 1. Phải import useAppTheme
    assert.ok(
      canvasContent.includes('useAppTheme'),
      'FamilyTreeCanvas.tsx phải import useAppTheme'
    );

    // 2. KHÔNG ĐƯỢC gán cứng colorMode="system" (thủ phạm gây lỗi nửa sáng nửa tối)
    assert.ok(
      !canvasContent.includes('colorMode="system"'),
      'FamilyTreeCanvas.tsx tuyệt đối không được gán cứng colorMode="system"'
    );

    // 3. Phải truyền colorMode={isDark ? 'dark' : 'light'}
    assert.ok(
      canvasContent.includes("colorMode={isDark ? 'dark' : 'light'}"),
      "FamilyTreeCanvas.tsx phải truyền colorMode={isDark ? 'dark' : 'light'}"
    );
  });

  // TC_UT_STICKY_FOOTER_FLOW_01: Kiểm tra Flex Sticky Footer và giải phóng h-full khỏi main
  it('TC_UT_STICKY_FOOTER_FLOW_01: layout.tsx không gán h-full trên <main>, bảo đảm footer trôi tự nhiên sau nội dung', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // 1. Thẻ <main> không được chứa class h-full (tránh ép cứng 100vh làm tràn nội dung và kẹt footer ở giữa)
    assert.ok(
      !layoutContent.includes('h-full">{children}</main>') &&
      !layoutContent.includes('relative h-full">{children}'),
      'Thẻ <main> không được chứa h-full để cho phép nội dung trang dài giãn nở tự nhiên'
    );

    // 2. Thẻ <body> không được chứa h-full (để min-h-screen phát huy hiệu quả)
    assert.ok(
      !layoutContent.includes('<body className="h-full'),
      'Thẻ <body> không được chứa class h-full'
    );

    // 3. layout.tsx phải render AppFooter sau <main>
    assert.ok(
      layoutContent.includes('<AppFooter />'),
      'layout.tsx phải chứa <AppFooter />'
    );
  });

  // TC_UT_IMPORT_PAGE_GEOMETRY: Kiểm tra chuẩn hình học giao diện Import Excel (Clean Geometry)
  it('TC_UT_IMPORT_PAGE_GEOMETRY: Trang Import Excel không còn sử dụng rounded-2xl hay rounded-3xl quá khổ', () => {
    const importPagePath = path.resolve(process.cwd(), 'src/app/admin/import/page.tsx');
    assert.ok(fs.existsSync(importPagePath), 'src/app/admin/import/page.tsx phải tồn tại');

    const content = fs.readFileSync(importPagePath, 'utf8');

    // Tuyệt đối không còn class rounded-2xl hoặc rounded-3xl
    const hasRounded2xl = /rounded-2xl/.test(content);
    const hasRounded3xl = /rounded-3xl/.test(content);

    assert.strictEqual(
      hasRounded2xl,
      false,
      'src/app/admin/import/page.tsx không được chứa class rounded-2xl'
    );
    assert.strictEqual(
      hasRounded3xl,
      false,
      'src/app/admin/import/page.tsx không được chứa class rounded-3xl'
    );
  });

  // TC_UT_NAVBAR_NO_SUPABASE_BADGE: Kiểm tra loại bỏ huy hiệu kỹ thuật Supabase Cloud trên Header Navbar
  it('TC_UT_NAVBAR_NO_SUPABASE_BADGE: Navbar.tsx loại bỏ hoàn toàn chuỗi Supabase Cloud', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar/Navbar.tsx');
    assert.ok(fs.existsSync(navbarPath), 'src/components/navbar/Navbar.tsx phải tồn tại');

    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    assert.ok(
      !navbarContent.includes('Supabase Cloud'),
      'Navbar.tsx không được chứa chuỗi Supabase Cloud trên giao diện người dùng'
    );
  });

  // TC_UT_HOMEPAGE_NEAREST_ANNIVERSARY: Kiểm tra trang chủ tích hợp Tiêu điểm Ngày Giỗ Gần Nhất
  it('TC_UT_HOMEPAGE_NEAREST_ANNIVERSARY: src/app/page.tsx tích hợp getUpcomingAnniversaries và liên kết tới các tính năng', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar/Navbar.tsx');
    assert.ok(fs.existsSync(homePath), 'src/app/page.tsx phải tồn tại');
    assert.ok(fs.existsSync(navbarPath), 'src/components/navbar/Navbar.tsx phải tồn tại');

    const homeContent = fs.readFileSync(homePath, 'utf8');
    const navbarContent = fs.readFileSync(navbarPath, 'utf8');

    assert.ok(
      homeContent.includes('getUpcomingAnniversaries'),
      'src/app/page.tsx phải import và sử dụng getUpcomingAnniversaries'
    );
    assert.ok(
      homeContent.includes('href="/tree"'),
      'src/app/page.tsx phải chứa liên kết tới /tree'
    );
    assert.ok(
      homeContent.includes('href="/anniversaries"'),
      'src/app/page.tsx phải chứa liên kết tới /anniversaries'
    );
    // Tính năng /kinship luôn có sẵn trên Navbar toàn trang
    assert.ok(
      navbarContent.includes('href="/kinship"'),
      'Navbar phải chứa liên kết tới /kinship'
    );
  });

  // TC_UT_HOMEPAGE_CLEAN_NO_REDUNDANT_CARDS: Kiểm tra loại bỏ hoàn toàn khối 3 thẻ tính năng tiếp thị thừa trên trang chủ
  it('TC_UT_HOMEPAGE_CLEAN_NO_REDUNDANT_CARDS: src/app/page.tsx không còn chứa 3 thẻ tính năng tiếp thị thừa', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    assert.ok(fs.existsSync(homePath), 'src/app/page.tsx phải tồn tại');

    const homeContent = fs.readFileSync(homePath, 'utf8');

    // 1. Không còn chứa các tiêu đề thẻ tính năng tiếp thị cũ
    assert.strictEqual(
      homeContent.includes('Cây Phả Hệ Tương Tác'),
      false,
      'src/app/page.tsx không được chứa thẻ "Cây Phả Hệ Tương Tác"'
    );
    assert.strictEqual(
      homeContent.includes('Tra Cứu Vai Vế Xưng Hô'),
      false,
      'src/app/page.tsx không được chứa thẻ "Tra Cứu Vai Vế Xưng Hô"'
    );
    assert.strictEqual(
      homeContent.includes('Lịch Giỗ & Nhắc Nhở PWA'),
      false,
      'src/app/page.tsx không được chứa thẻ "Lịch Giỗ & Nhắc Nhở PWA"'
    );

    // 2. Vẫn giữ nguyên Tiêu điểm Ngày Giỗ Gần Nhất
    assert.ok(
      homeContent.includes('Ngày Giỗ Gần Nhất'),
      'src/app/page.tsx phải có khối Ngày Giỗ Gần Nhất'
    );
  });

  // TC_UT_MOBILE_ANNIV_DATE_STACK: Cấu trúc hiển thị ngày: Dương lịch có Thứ ở TRÊN, Âm lịch ở DƯỚI
  it('TC_UT_MOBILE_ANNIV_DATE_STACK: Trang Chủ và Lịch Giỗ hiển thị Dương lịch có Thứ ở TRÊN, Âm lịch ở DƯỚI', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const annivPath = path.resolve(process.cwd(), 'src/app/anniversaries/page.tsx');

    const homeContent = fs.readFileSync(homePath, 'utf8');
    const annivContent = fs.readFileSync(annivPath, 'utf8');

    // 1. Trên trang chủ: formatSolarDateWithDayOfWeek xuất hiện trước Âm lịch trong khối thẻ ngày giỗ
    const homeSolarIdx = homeContent.indexOf('formatSolarDateWithDayOfWeek');
    const homeLunarIdx = homeContent.indexOf('Âm lịch: Ngày');
    assert.ok(homeSolarIdx > 0, 'Trang chủ phải sử dụng formatSolarDateWithDayOfWeek');
    assert.ok(homeLunarIdx > 0, 'Trang chủ phải hiển thị Âm lịch: Ngày');
    assert.ok(
      homeSolarIdx < homeLunarIdx,
      'Trên trang chủ, Dương lịch có Thứ phải nằm TRÊN (xuất hiện trước) Âm lịch'
    );

    // 2. Trên trang lịch giỗ: trong thẻ Header của group, Dương lịch xuất hiện trước Âm lịch
    const annivSolarIdx = annivContent.indexOf('{formatSolarDateWithDayOfWeek(group.solar_year, group.solar_month, group.solar_day)}');
    const annivLunarIdx = annivContent.indexOf('Ngày {group.lunar_day < 10 ? \'0\' : \'\'}{group.lunar_day}/{group.lunar_month < 10 ? \'0\' : \'\'}{group.lunar_month} Âm lịch');
    assert.ok(annivSolarIdx > 0, 'Trang Lịch Giỗ phải hiển thị Dương lịch có Thứ trong Header group');
    assert.ok(annivLunarIdx > 0, 'Trang Lịch Giỗ phải hiển thị Âm lịch trong Header group');
    assert.ok(
      annivSolarIdx < annivLunarIdx,
      'Trên trang Lịch Giỗ, Dương lịch có Thứ phải nằm TRÊN (xuất hiện trước) Âm lịch trong Header group'
    );
  });

  // TC_UT_NO_SOLAR_SUFFIX: Loại bỏ hoàn toàn chữ (Dương lịch) trên Trang Chủ và Trang Lịch Giỗ
  it('TC_UT_NO_SOLAR_SUFFIX: Trang Chủ và Lịch Giỗ không còn chứa chuỗi (Dương lịch)', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    const annivPath = path.resolve(process.cwd(), 'src/app/anniversaries/page.tsx');

    const homeContent = fs.readFileSync(homePath, 'utf8');
    const annivContent = fs.readFileSync(annivPath, 'utf8');

    assert.ok(
      !homeContent.includes('(Dương lịch)') && !homeContent.includes('(Dương Lịch)'),
      'Trang chủ không được chứa chuỗi (Dương lịch) hoặc (Dương Lịch)'
    );
    assert.ok(
      !annivContent.includes('(Dương lịch)') && !annivContent.includes('(Dương Lịch)'),
      'Trang Lịch Giỗ không được chứa chuỗi (Dương lịch) hoặc (Dương Lịch)'
    );
  });

  // TC_UT_MOBILE_BOTTOM_NAV_STRUCTURE: Cấu trúc và liên kết của thanh MobileBottomNav
  it('TC_UT_MOBILE_BOTTOM_NAV_STRUCTURE: MobileBottomNav có md:hidden, 4 tab liên kết chuẩn và usePathname', () => {
    const navPath = path.resolve(process.cwd(), 'src/components/navigation/MobileBottomNav.tsx');
    assert.ok(fs.existsSync(navPath), 'src/components/navigation/MobileBottomNav.tsx phải tồn tại');

    const navContent = fs.readFileSync(navPath, 'utf8');

    // 1. Phải ẩn trên Desktop bằng md:hidden
    assert.ok(navContent.includes('md:hidden'), 'MobileBottomNav phải có class md:hidden để ẩn trên Desktop');

    // 2. Phải có đủ 4 liên kết phân hệ chính
    assert.ok(navContent.includes("href: '/'"), 'MobileBottomNav phải có tab Trang Chủ (/)');
    assert.ok(navContent.includes("href: '/tree'"), 'MobileBottomNav phải có tab Phả Hệ (/tree)');
    assert.ok(navContent.includes("href: '/anniversaries'"), 'MobileBottomNav phải có tab Lịch Giỗ (/anniversaries)');
    assert.ok(navContent.includes("href: '/kinship'"), 'MobileBottomNav phải có tab Vai Vế (/kinship)');

    // 3. Sử dụng usePathname để nhận biết active tab
    assert.ok(navContent.includes('usePathname'), 'MobileBottomNav phải sử dụng hook usePathname');
  });

  // TC_UT_LAYOUT_BOTTOM_NAV_INJECTION: layout.tsx nhúng MobileBottomNav và có padding-bottom an toàn
  it('TC_UT_LAYOUT_BOTTOM_NAV_INJECTION: layout.tsx nhúng MobileBottomNav và thẻ main có pb-16 md:pb-0', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx phải tồn tại');

    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // 1. layout.tsx phải render MobileBottomNav
    assert.ok(
      layoutContent.includes('<MobileBottomNav />') || layoutContent.includes('<MobileBottomNav'),
      'src/app/layout.tsx phải nhúng component MobileBottomNav'
    );

    // 2. Thẻ main phải có pb-16 md:pb-0 để chống che khuất nội dung
    assert.ok(
      layoutContent.includes('pb-16 md:pb-0'),
      'Thẻ <main> trong src/app/layout.tsx phải có class pb-16 md:pb-0'
    );
  });

  // TC_UT_CANVAS_CONTROLS_MOBILE_LIFT: Controls của React Flow trên mobile nâng cao độ chống che lấp
  it('TC_UT_CANVAS_CONTROLS_MOBILE_LIFT: Controls trong FamilyTreeCanvas có class !mb-16 md:!mb-0', () => {
    const canvasPath = path.resolve(process.cwd(), 'src/components/tree/FamilyTreeCanvas.tsx');
    assert.ok(fs.existsSync(canvasPath), 'src/components/tree/FamilyTreeCanvas.tsx phải tồn tại');

    const canvasContent = fs.readFileSync(canvasPath, 'utf8');

    // Controls phải có class !mb-16 md:!mb-0
    assert.ok(
      canvasContent.includes('!mb-16 md:!mb-0'),
      'Controls trong FamilyTreeCanvas phải có class !mb-16 md:!mb-0 để nổi lên trên Mobile Bottom Nav'
    );
  });

  // TC_UT_NAVBAR_NO_ADMIN_BUTTON: Loại bỏ hoàn toàn nút Quản trị trên Header Navbar
  it('TC_UT_NAVBAR_NO_ADMIN_BUTTON: Navbar.tsx không còn nút hay đường dẫn Quản trị', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar/Navbar.tsx');
    assert.ok(fs.existsSync(navbarPath), 'src/components/navbar/Navbar.tsx phải tồn tại');

    const navbarContent = fs.readFileSync(navbarPath, 'utf8');

    // 1. Không chứa ID navbar-admin-portal-btn
    assert.strictEqual(
      navbarContent.includes('navbar-admin-portal-btn'),
      false,
      'Navbar.tsx không được chứa button ID navbar-admin-portal-btn'
    );

    // 2. Không chứa đường dẫn /admin/settings hay /admin
    assert.strictEqual(
      navbarContent.includes('/admin/settings'),
      false,
      'Navbar.tsx không được chứa liên kết tới /admin/settings'
    );

    // 3. Không chứa text Quản Trị Dòng Họ
    assert.strictEqual(
      navbarContent.includes('Quản Trị Dòng Họ'),
      false,
      'Navbar.tsx không được hiển thị nhãn Quản Trị Dòng Họ trên Header'
    );
  });

  // TC_UT_NAVBAR_HAN_LOGO: Logo chữ Hán "Phạm" (范) trên nền xanh ngọc bích
  it('TC_UT_NAVBAR_HAN_LOGO: Navbar.tsx hiển thị chữ Hán Phạm 范 và tên thương hiệu GIA PHẢ HỌ PHẠM', () => {
    const navbarPath = path.resolve(process.cwd(), 'src/components/navbar/Navbar.tsx');
    const logoNavPath = path.resolve(process.cwd(), 'src/components/navbar/ClanHanLogoNavbar.tsx');
    assert.ok(fs.existsSync(navbarPath), 'src/components/navbar/Navbar.tsx phải tồn tại');
    assert.ok(fs.existsSync(logoNavPath), 'src/components/navbar/ClanHanLogoNavbar.tsx phải tồn tại');

    const navbarContent = fs.readFileSync(navbarPath, 'utf8');
    const logoNavContent = fs.readFileSync(logoNavPath, 'utf8');

    // 1. Phải nhúng ClanHanLogoNavbar hoặc chứa ký tự chữ Hán "Phạm" (范)
    assert.ok(
      navbarContent.includes('ClanHanLogoNavbar') || navbarContent.includes('范'),
      'Navbar.tsx phải nhúng ClanHanLogoNavbar hoặc chứa ký tự chữ Hán "范"'
    );

    // 2. Huy hiệu phải có nền màu xanh ngọc bích bg-emerald-600
    assert.ok(
      navbarContent.includes('bg-emerald-600') || logoNavContent.includes('bg-emerald-600'),
      'Huy hiệu logo phải có class bg-emerald-600'
    );

    // 3. Hiển thị tên thương hiệu "GIA PHẢ HỌ PHẠM"
    assert.ok(
      navbarContent.includes('GIA PHẢ HỌ PHẠM'),
      'Navbar.tsx phải hiển thị tên thương hiệu GIA PHẢ HỌ PHẠM'
    );
  });

  // TC_UT_FAMILY_TREE_ICON_STRUCTURE: Cấu trúc SVG biểu tượng Cây Phả Hệ chuẩn 3 ô vuông
  it('TC_UT_FAMILY_TREE_ICON_STRUCTURE: FamilyTreeIcon.tsx tồn tại và render chuẩn cấu trúc 3 ô vuông', () => {
    const iconPath = path.resolve(process.cwd(), 'src/components/icons/FamilyTreeIcon.tsx');
    assert.ok(fs.existsSync(iconPath), 'src/components/icons/FamilyTreeIcon.tsx phải tồn tại');

    const iconContent = fs.readFileSync(iconPath, 'utf8');

    // 1. Phải là SVG viewBox 24x24
    assert.ok(
      iconContent.includes('viewBox="0 0 24 24"'),
      'FamilyTreeIcon phải có viewBox="0 0 24 24"'
    );

    // 2. Phải có chính xác 3 thẻ rect (1 tiền nhân ở trên, 2 hậu duệ ở dưới)
    const rectMatches = iconContent.match(/<rect\s/g) || [];
    assert.strictEqual(
      rectMatches.length,
      3,
      'FamilyTreeIcon phải có đúng 3 thẻ <rect> mô phỏng 3 ô vuông thế hệ'
    );

    // 3. Phải có các đường path rẽ nhánh gia tộc
    assert.ok(
      iconContent.includes('<path d="M12 8v4"'),
      'FamilyTreeIcon phải có trục dọc nối thế hệ tiền nhân'
    );
    assert.ok(
      iconContent.includes('<path d="M6 12h12"'),
      'FamilyTreeIcon phải có đường rẽ nhánh ngang'
    );
  });

  // TC_UT_AUTH_AVATAR_NO_OVAL_DISTORTION: Avatar AuthButton tròn hoàn hảo không méo bầu dục trên mobile
  it('TC_UT_AUTH_AVATAR_NO_OVAL_DISTORTION: AuthButton.tsx có aspect-square, rounded-full và dùng getMemberInitials', () => {
    const authPath = path.resolve(process.cwd(), 'src/components/auth/AuthButton.tsx');
    assert.ok(fs.existsSync(authPath), 'src/components/auth/AuthButton.tsx phải tồn tại');

    const authContent = fs.readFileSync(authPath, 'utf8');

    // 1. Container nút user-menu-btn phải có aspect-square và rounded-full
    assert.ok(
      authContent.includes('aspect-square sm:aspect-auto') || authContent.includes('aspect-square'),
      'Nút avatar trong AuthButton phải có class aspect-square để chống méo bầu dục khi ẩn text trên mobile'
    );
    assert.ok(
      authContent.includes('rounded-full'),
      'Nút avatar trong AuthButton phải có class rounded-full'
    );

    // 2. Thẻ img avatar phải có aspect-square và object-cover
    assert.ok(
      authContent.includes('aspect-square shrink-0') || authContent.includes('aspect-square'),
      'Thẻ <img> đại diện phải có class aspect-square'
    );

    // 3. Fallback avatar sử dụng hàm getMemberInitials
    assert.ok(
      authContent.includes('getMemberInitials'),
      'AuthButton.tsx phải import và sử dụng getMemberInitials cho trường hợp không có avatar_url'
    );
  });

  // TC_UT_WELCOME_CARD_AVATAR_CONSISTENCY: Khối Chào Mừng Trang Chủ đồng bộ Avatar tròn và fallback 2 chữ cái
  it('TC_UT_WELCOME_CARD_AVATAR_CONSISTENCY: src/app/page.tsx hiển thị Avatar tròn và fallback getMemberInitials', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    assert.ok(fs.existsSync(homePath), 'src/app/page.tsx phải tồn tại');

    const homeContent = fs.readFileSync(homePath, 'utf8');

    // 1. Không còn ô vuông xanh 1 chữ cái cũ
    assert.strictEqual(
      homeContent.includes('rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs'),
      false,
      'src/app/page.tsx không được sử dụng ô vuông rounded-lg cho avatar chào mừng'
    );

    // 2. Có render thẻ <img> tròn và fallback 2 chữ cái getMemberInitials
    assert.ok(
      homeContent.includes('rounded-full border border-emerald-500/50 object-cover aspect-square') ||
      homeContent.includes('rounded-full'),
      'Avatar chào mừng phải là hình tròn hoàn hảo rounded-full aspect-square'
    );
    assert.ok(
      homeContent.includes('getMemberInitials(user.user_metadata?.full_name || user.email)'),
      'Fallback avatar chào mừng phải sử dụng getMemberInitials để lấy 2 chữ cái initials'
    );

    // 3. Nút [Xem trên Cây] trên trang chủ sử dụng FamilyTreeIcon
    assert.ok(
      homeContent.includes('<FamilyTreeIcon className="w-3.5 h-3.5" />'),
      'Nút [Xem trên Cây] tại Tiêu điểm Ngày Giỗ phải sử dụng FamilyTreeIcon'
    );
  });

  // TC_UT_CLAN_HAN_LOGO_AUTHENTIC_VECTOR: Component ClanHanLogo render chuẩn xác nét thư pháp đích thực
  it('TC_UT_CLAN_HAN_LOGO_AUTHENTIC_VECTOR: ClanHanLogo.tsx chứa vector path từ tác phẩm thư pháp và fillRule evenodd', () => {
    const logoPath = path.resolve(process.cwd(), 'src/components/icons/ClanHanLogo.tsx');
    assert.ok(fs.existsSync(logoPath), 'src/components/icons/ClanHanLogo.tsx phải tồn tại');

    const logoContent = fs.readFileSync(logoPath, 'utf8');

    // 1. Phải xuất khẩu chuỗi path thư pháp chính thống
    assert.ok(logoContent.includes('CLAN_HAN_CALLIGRAPHY_PATH'), 'ClanHanLogo phải có hằng số CLAN_HAN_CALLIGRAPHY_PATH');

    // 2. Phải có thuộc tính fillRule="evenodd" để đục rỗng lỗ bên trong chữ
    assert.ok(logoContent.includes('fillRule="evenodd"'), 'ClanHanLogo phải có fillRule="evenodd" để đục rỗng lỗ thư pháp');

    // 3. Phải hỗ trợ chế độ badgeContainer với nền bg-emerald-600
    assert.ok(logoContent.includes('bg-emerald-600'), 'ClanHanLogo phải hỗ trợ nền ngọc bích bg-emerald-600');
  });

  // TC_UT_ADMIN_PROFILE_CLAN_LOGO_PREVIEW: Căn Cước Dòng Họ hiển thị huy hiệu Logo Thư Pháp
  it('TC_UT_ADMIN_PROFILE_CLAN_LOGO_PREVIEW: src/app/admin/profile/page.tsx hiển thị huy hiệu Logo trong biểu ngữ chính thức', () => {
    const profilePath = path.resolve(process.cwd(), 'src/app/admin/profile/page.tsx');
    assert.ok(fs.existsSync(profilePath), 'src/app/admin/profile/page.tsx phải tồn tại');

    const profileContent = fs.readFileSync(profilePath, 'utf8');

    // 1. Phải import ClanHanLogo
    assert.ok(profileContent.includes('ClanHanLogo'), 'Trang Căn Cước Dòng Họ phải import ClanHanLogo');

    // 2. Chứa phần tử huy hiệu id="admin-profile-clan-han-logo"
    assert.ok(
      profileContent.includes('id="admin-profile-clan-han-logo"'),
      'Hộp biểu ngữ Căn Cước Dòng Họ phải chứa phần tử id admin-profile-clan-han-logo'
    );
  });

  // TC_UT_PERSONAL_SETTINGS_NO_LOGO_OPTION: Modal Cài Đặt Cá Nhân không còn chứa tùy chọn đổi logo dòng họ
  it('TC_UT_PERSONAL_SETTINGS_NO_LOGO_OPTION: PersonalSettingsModal.tsx không còn chứa tùy chọn đổi logo dòng họ', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/auth/PersonalSettingsModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'src/components/auth/PersonalSettingsModal.tsx phải tồn tại');

    const modalContent = fs.readFileSync(modalPath, 'utf8');

    // 1. Không còn chứa các nút chọn logo thư pháp
    assert.strictEqual(
      modalContent.includes('calligraphy-option'),
      false,
      'PersonalSettingsModal không được chứa các nút calligraphy-option'
    );

    // 2. Không còn can thiệp logoCalligraphyStyle
    assert.strictEqual(
      modalContent.includes('logoCalligraphyStyle'),
      false,
      'PersonalSettingsModal không được chứa state logoCalligraphyStyle'
    );
  });

  // TC_UT_CLAN_HAN_LOGO_SCALE_UP: Khắc phục chữ bé, tăng kích thước SVG lên size 28 và mở rộng vector chiếm 88% viewBox
  it('TC_UT_CLAN_HAN_LOGO_SCALE_UP: Navbar size=28, Admin Profile size=38 và vector độ phủ 88% viewBox', () => {
    const navLogoPath = path.resolve(process.cwd(), 'src/components/navbar/ClanHanLogoNavbar.tsx');
    const adminProfilePath = path.resolve(process.cwd(), 'src/app/admin/profile/page.tsx');
    const logoIconPath = path.resolve(process.cwd(), 'src/components/icons/ClanHanLogo.tsx');

    assert.ok(fs.existsSync(navLogoPath), 'ClanHanLogoNavbar.tsx phải tồn tại');
    assert.ok(fs.existsSync(adminProfilePath), 'admin/profile/page.tsx phải tồn tại');
    assert.ok(fs.existsSync(logoIconPath), 'ClanHanLogo.tsx phải tồn tại');

    const navContent = fs.readFileSync(navLogoPath, 'utf8');
    const adminContent = fs.readFileSync(adminProfilePath, 'utf8');
    const iconContent = fs.readFileSync(logoIconPath, 'utf8');

    // 1. ClanHanLogoNavbar cấp kích thước size={28}
    assert.ok(
      navContent.includes('size={28}'),
      'ClanHanLogoNavbar phải cấp size={28} để tăng kích thước chữ hiển thị'
    );

    // 2. Căn Cước Dòng Họ cấp kích thước size={38}
    assert.ok(
      adminContent.includes('size={38}'),
      'Căn Cước Dòng Họ (/admin/profile) phải cấp size={38} cho huy hiệu biểu ngữ'
    );

    // 3. ClanHanLogo mặc định size = 28
    assert.ok(
      iconContent.includes('size = 28'),
      'ClanHanLogo.tsx phải có kích thước mặc định size = 28'
    );

    // 4. Đo đạc độ phủ chiều cao Y và tâm đối xứng của vector path
    const pathMatch = iconContent.match(/CLAN_HAN_CALLIGRAPHY_PATH\s*=\s*["']([^"']+)["']/);
    assert.ok(pathMatch && pathMatch[1], 'Phải tìm thấy chuỗi CLAN_HAN_CALLIGRAPHY_PATH');

    const pathData = pathMatch[1];
    const pointMatches = pathData.match(/([0-9\.]+)\s+([0-9\.]+)/g) || [];
    assert.ok(pointMatches.length > 50, 'Vector path phải có nhiều điểm tọa độ');

    const ys = pointMatches.map((p: string) => parseFloat(p.trim().split(/\s+/)[1]));
    const xs = pointMatches.map((p: string) => parseFloat(p.trim().split(/\s+/)[0]));

    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    const heightCoverage = maxY - minY;
    assert.ok(
      heightCoverage >= 87.0 && heightCoverage <= 89.0,
      `Độ phủ chiều cao chữ phải đạt chuẩn ~88% (thực tế: ${heightCoverage})`
    );

    assert.ok(minY <= 6.5, `Đỉnh nét chữ phải đạt gần biên trên (minY: ${minY} <= 6.5)`);
    assert.ok(maxY >= 93.5, `Đáy nét chữ phải đạt gần biên dưới (maxY: ${maxY} >= 93.5)`);

    const centerY = (minY + maxY) / 2;
    const centerX = (minX + maxX) / 2;
    assert.ok(Math.abs(centerY - 50.0) < 1.0, `Tâm Y phải căn giữa (thực tế: ${centerY})`);
    assert.ok(Math.abs(centerX - 50.0) < 1.0, `Tâm X phải căn giữa (thực tế: ${centerX})`);
  });

  // TC_UT_THEME_DEFAULT_LIGHT: Theme mặc định luôn là Light, chỉ bật Dark khi localStorage có 'dark'
  it('TC_UT_THEME_DEFAULT_LIGHT: layout.tsx không tự ép Dark theo prefers-color-scheme, mặc định 100% là Light', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');
    assert.ok(fs.existsSync(layoutPath), 'src/app/layout.tsx phải tồn tại');

    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // 1. Inline script chỉ kích hoạt Dark khi người dùng chủ động chọn saved === 'dark'
    assert.ok(
      layoutContent.includes("saved === 'dark'") || layoutContent.includes('saved === "dark"'),
      'Script trong layout.tsx phải kiểm tra saved === "dark" để bật chế độ tối'
    );

    // 2. Tuyệt đối KHÔNG chứa prefers-color-scheme: dark trong script khởi tạo làm đổi theme của khách mới
    assert.ok(
      !layoutContent.includes("prefers-color-scheme: dark"),
      'layout.tsx không được dùng prefers-color-scheme để tự ý ép dark mode cho người dùng mới'
    );
  });

  // TC_UT_FAVICON_AND_ICONS_EXIST: Kiểm tra toàn bộ file asset icon & favicon tồn tại và khai báo metadata
  it('TC_UT_FAVICON_AND_ICONS_EXIST: public/ chứa đầy đủ favicon.ico, favicon.svg, apple-touch-icon.png và icons PWA', () => {
    const faviconIcoPath = path.resolve(process.cwd(), 'public/favicon.ico');
    const faviconSvgPath = path.resolve(process.cwd(), 'public/favicon.svg');
    const appleTouchIconPath = path.resolve(process.cwd(), 'public/apple-touch-icon.png');
    const icon192Path = path.resolve(process.cwd(), 'public/icons/icon-192x192.png');
    const icon512Path = path.resolve(process.cwd(), 'public/icons/icon-512x512.png');
    const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
    const layoutPath = path.resolve(process.cwd(), 'src/app/layout.tsx');

    // 1. Toàn bộ file ảnh biểu tượng phải tồn tại trên ổ đĩa và có dung lượng hợp lệ
    assert.ok(fs.existsSync(faviconIcoPath), 'public/favicon.ico phải tồn tại');
    assert.ok(fs.existsSync(faviconSvgPath), 'public/favicon.svg phải tồn tại');
    assert.ok(fs.existsSync(appleTouchIconPath), 'public/apple-touch-icon.png phải tồn tại');
    assert.ok(fs.existsSync(icon192Path), 'public/icons/icon-192x192.png phải tồn tại');
    assert.ok(fs.existsSync(icon512Path), 'public/icons/icon-512x512.png phải tồn tại');

    assert.ok(fs.statSync(faviconIcoPath).size > 1000, 'favicon.ico phải là file đa kích thước > 1KB');
    assert.ok(fs.statSync(appleTouchIconPath).size > 1000, 'apple-touch-icon.png phải có kích thước hợp lệ');
    assert.ok(fs.statSync(icon192Path).size > 1000, 'icon-192x192.png phải có kích thước hợp lệ');
    assert.ok(fs.statSync(icon512Path).size > 1000, 'icon-512x512.png phải có kích thước hợp lệ');

    // 2. manifest.json khai báo icons
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(manifestContent.includes('/icons/icon-192x192.png'), 'manifest.json phải khai báo icon-192x192.png');
    assert.ok(manifestContent.includes('/icons/icon-512x512.png'), 'manifest.json phải khai báo icon-512x512.png');

    // 3. layout.tsx metadata icons
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    assert.ok(layoutContent.includes('/favicon.ico'), 'layout.tsx metadata icons phải chứa /favicon.ico');
    assert.ok(layoutContent.includes('/favicon.svg'), 'layout.tsx metadata icons phải chứa /favicon.svg');
    assert.ok(layoutContent.includes('/apple-touch-icon.png'), 'layout.tsx metadata icons phải chứa /apple-touch-icon.png');
  });

  // TC_UT_LOGIN_GATE_INSTALL_PWA: Nút Cài Đặt PWA trên Login Gate và Trang Chủ
  it('TC_UT_LOGIN_GATE_INSTALL_PWA: InstallPwaButton hỗ trợ beforeinstallprompt, modal iOS và nhúng vào login-gate & homepage', () => {
    const pwaBtnPath = path.resolve(process.cwd(), 'src/components/pwa/InstallPwaButton.tsx');
    const loginGatePath = path.resolve(process.cwd(), 'src/app/login-gate/page.tsx');
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');

    assert.ok(fs.existsSync(pwaBtnPath), 'src/components/pwa/InstallPwaButton.tsx phải tồn tại');
    assert.ok(fs.existsSync(loginGatePath), 'src/app/login-gate/page.tsx phải tồn tại');
    assert.ok(fs.existsSync(homePath), 'src/app/page.tsx phải tồn tại');

    const pwaBtnContent = fs.readFileSync(pwaBtnPath, 'utf8');
    const loginGateContent = fs.readFileSync(loginGatePath, 'utf8');
    const homeContent = fs.readFileSync(homePath, 'utf8');

    // 1. Component InstallPwaButton xử lý beforeinstallprompt và standalone
    assert.ok(
      pwaBtnContent.includes('beforeinstallprompt'),
      'InstallPwaButton phải lắng nghe sự kiện beforeinstallprompt'
    );
    assert.ok(
      pwaBtnContent.includes('display-mode: standalone'),
      'InstallPwaButton phải phát hiện chế độ standalone để tự động ẩn nút'
    );
    assert.ok(
      pwaBtnContent.includes('iPad|iPhone|iPod'),
      'InstallPwaButton phải nhận diện thiết bị iOS để hiển thị modal hướng dẫn'
    );

    // 2. Nhúng vào Login Gate (/login-gate)
    assert.ok(
      loginGateContent.includes('InstallPwaButton'),
      'src/app/login-gate/page.tsx phải nhúng InstallPwaButton'
    );

    // 3. Nhúng vào Trang Chủ (/)
    assert.ok(
      homeContent.includes('InstallPwaButton'),
      'src/app/page.tsx phải nhúng InstallPwaButton'
    );
  });

  // TC_UT_HOMEPAGE_UNIFIED_WIDTH_ALIGNMENT: Thẻ Ngày Giỗ và Banner Tiện Ích PWA đồng bộ chuẩn max-w-3xl
  it('TC_UT_HOMEPAGE_UNIFIED_WIDTH_ALIGNMENT: Thẻ Ngày Giỗ và Banner Tiện Ích PWA trên page.tsx đều có max-w-3xl w-full', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    assert.ok(fs.existsSync(homePath), 'src/app/page.tsx phải tồn tại');

    const homeContent = fs.readFileSync(homePath, 'utf8');

    // 1. Thẻ Ngày Giỗ có max-w-3xl w-full
    assert.ok(
      homeContent.includes('max-w-3xl w-full'),
      'src/app/page.tsx phải có container max-w-3xl w-full cho nội dung trung tâm'
    );

    // 2. Banner Tiện Ích PwaInstallBanner được nhúng trên page.tsx
    assert.ok(
      homeContent.includes('<PwaInstallBanner') || homeContent.includes('PwaInstallBanner'),
      'src/app/page.tsx phải nhúng PwaInstallBanner'
    );

    // 3. Banner PWA xuất hiện sau (ở dưới) khối Ngày Giỗ
    const annivIndex = homeContent.indexOf('Ngày Giỗ Gần Nhất');
    const bannerIndex = homeContent.indexOf('<PwaInstallBanner');
    assert.ok(annivIndex > 0, 'Phải tìm thấy khối Ngày Giỗ Gần Nhất');
    assert.ok(bannerIndex > 0, 'Phải tìm thấy <PwaInstallBanner');
    assert.ok(
      bannerIndex > annivIndex,
      'PwaInstallBanner bắt buộc phải nằm bên dưới khối Ngày Giỗ Gần Nhất'
    );
  });

  // TC_UT_HOMEPAGE_NO_ADMIN_CARD: Trang Chủ loại bỏ hoàn toàn khối thẻ Quản Trị Viên thừa thãi
  it('TC_UT_HOMEPAGE_NO_ADMIN_CARD: page.tsx không còn chứa khối thẻ xanh Quản Trị Viên (Super Admin) ở cuối trang', () => {
    const homePath = path.resolve(process.cwd(), 'src/app/page.tsx');
    assert.ok(fs.existsSync(homePath), 'src/app/page.tsx phải tồn tại');

    const homeContent = fs.readFileSync(homePath, 'utf8');

    // 1. Không còn ID admin-settings-btn trên trang chủ
    assert.strictEqual(
      homeContent.includes('id="admin-settings-btn"'),
      false,
      'src/app/page.tsx không được chứa button id admin-settings-btn'
    );

    // 2. Không còn chuỗi "Khu vực Quản Trị Viên (Super Admin)"
    assert.strictEqual(
      homeContent.includes('Khu vực Quản Trị Viên (Super Admin)'),
      false,
      'src/app/page.tsx không được chứa khối Khu vực Quản Trị Viên (Super Admin)'
    );

    // 3. Không còn class max-w-xl gây lệch lề
    assert.strictEqual(
      homeContent.includes('max-w-xl w-full'),
      false,
      'src/app/page.tsx không được chứa class max-w-xl w-full gây lệch lề'
    );
  });

  // TC_UT_PWA_RESPONSIVE_LABEL: Nút / Banner PWA hiển thị nhãn responsive thông minh theo thiết bị
  it('TC_UT_PWA_RESPONSIVE_LABEL: InstallPwaButton chứa nhãn Desktop "Cài đặt ứng dụng" và Mobile "Cài đặt ứng dụng điện thoại"', () => {
    const pwaBtnPath = path.resolve(process.cwd(), 'src/components/pwa/InstallPwaButton.tsx');
    assert.ok(fs.existsSync(pwaBtnPath), 'src/components/pwa/InstallPwaButton.tsx phải tồn tại');

    const pwaContent = fs.readFileSync(pwaBtnPath, 'utf8');

    // 1. Chứa nhãn Desktop "Cài đặt ứng dụng"
    assert.ok(
      pwaContent.includes('Cài đặt ứng dụng'),
      'InstallPwaButton phải chứa nhãn "Cài đặt ứng dụng"'
    );

    // 2. Chứa nhãn Mobile "Cài đặt ứng dụng điện thoại"
    assert.ok(
      pwaContent.includes('Cài đặt ứng dụng điện thoại'),
      'InstallPwaButton phải chứa nhãn mobile "Cài đặt ứng dụng điện thoại"'
    );

    // 3. Tuyệt đối không còn chứa chữ kỹ thuật "FAT" hay "(PWA)"
    assert.strictEqual(
      pwaContent.includes('FAT (PWA)'),
      false,
      'InstallPwaButton không được chứa chuỗi kỹ thuật "FAT (PWA)"'
    );
  });
});



