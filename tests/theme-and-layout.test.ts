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
});
