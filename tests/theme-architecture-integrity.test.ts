import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Kiến Trúc Quản Trị Đa Profile Toàn Diện & Zero-Debt Adapter (Theme Architecture Integrity)', () => {
  const rootDir = process.cwd();
  const globalsPath = path.join(rootDir, 'src/app/globals.css');
  const tailwindPath = path.join(rootDir, 'tailwind.config.ts');
  const blocCardPath = path.join(rootDir, 'src/components/anniversaries/AnniversaryBlocCard.tsx');
  const blocTimelinePath = path.join(rootDir, 'src/components/anniversaries/AnniversaryBlocTimeline.tsx');
  const pushBannerPath = path.join(rootDir, 'src/components/anniversaries/PushNotificationBanner.tsx');

  // 1. TC_THEME_ARCH_01: Hợp đồng Design Token 12 biến chuẩn hóa trong globals.css và tailwind.config.ts
  it('TC_THEME_ARCH_01: Kiểm tra Hợp đồng Design Token 12 biến chuẩn hóa trong globals.css và tailwind.config.ts cho cả 3 profile', () => {
    assert.ok(fs.existsSync(globalsPath), 'globals.css phải tồn tại');
    assert.ok(fs.existsSync(tailwindPath), 'tailwind.config.ts phải tồn tại');

    const globalsContent = fs.readFileSync(globalsPath, 'utf8');
    const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');

    const required12Tokens = [
      '--bg-canvas',
      '--bg-surface',
      '--bg-sub-surface',
      '--bg-control',
      '--border-card',
      '--border-divider',
      '--border-control',
      '--bg-brand',
      '--border-brand',
      '--text-brand-accent',
      '--text-title',
      '--radius-card',
      '--radius-control',
    ];

    // Kiểm tra trong :root (Classic Minimalist)
    const rootBlock = globalsContent.split('.dark')[0];
    for (const token of required12Tokens) {
      assert.ok(
        rootBlock.includes(token),
        `:root (Classic) phải định nghĩa biến chuẩn hóa: ${token}`
      );
    }

    // Kiểm tra trong html[data-theme-profile="heritage"] (Modern Vietnamese Heritage)
    const heritageBlock = globalsContent.slice(
      globalsContent.indexOf('html[data-theme-profile="heritage"]'),
      globalsContent.indexOf('html[data-theme-profile="contemporary_heritage"]')
    );
    for (const token of required12Tokens) {
      assert.ok(
        heritageBlock.includes(token),
        `heritage profile phải định nghĩa biến chuẩn hóa: ${token}`
      );
    }

    // Kiểm tra trong html[data-theme-profile="contemporary_heritage"]
    const contemporaryBlock = globalsContent.slice(
      globalsContent.indexOf('html[data-theme-profile="contemporary_heritage"]'),
      globalsContent.indexOf('html[data-theme-profile="contemporary_heritage"].dark')
    );
    for (const token of required12Tokens) {
      assert.ok(
        contemporaryBlock.includes(token),
        `contemporary_heritage profile phải định nghĩa biến chuẩn hóa: ${token}`
      );
    }

    // Kiểm tra tailwind.config.ts ánh xạ các token này
    const requiredTailwindMappings = [
      "canvas: 'var(--bg-canvas)'",
      "surface: 'var(--bg-surface)'",
      "'sub-surface': 'var(--bg-sub-surface)'",
      "control: 'var(--bg-control)'",
      "brand: {",
      "card: 'var(--radius-card",
      "control: 'var(--radius-control",
    ];

    for (const mapping of requiredTailwindMappings) {
      assert.ok(
        tailwindContent.includes(mapping),
        `tailwind.config.ts phải ánh xạ token: ${mapping}`
      );
    }
  });

  // 2. TC_THEME_ARCH_02: Lớp Chuyển Hóa Di Sản Systemic Legacy Proxy Layer trong globals.css
  it('TC_THEME_ARCH_02: Kiểm tra Lớp Chuyển Hóa Di Sản Systemic Legacy Proxy Layer trong globals.css', () => {
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');

    // Lớp Proxy phải tồn tại dưới contemporary_heritage
    assert.ok(
      globalsContent.includes('SYSTEMIC LEGACY PROXY LAYER'),
      'globals.css phải chứa khối khai báo SYSTEMIC LEGACY PROXY LAYER'
    );

    // 1. Ánh xạ bg-slate-50 sang --bg-canvas
    assert.ok(
      globalsContent.includes('.bg-slate-50') && globalsContent.includes('background-color: var(--bg-canvas) !important;'),
      'Proxy Layer phải ánh xạ .bg-slate-50 sang var(--bg-canvas)'
    );

    // 2. Ánh xạ bg-slate-100 sang --bg-sub-surface
    assert.ok(
      globalsContent.includes('.bg-slate-100') && globalsContent.includes('background-color: var(--bg-sub-surface) !important;'),
      'Proxy Layer phải ánh xạ .bg-slate-100 sang var(--bg-sub-surface)'
    );

    // 3. Ánh xạ border-slate-100 sang --border-divider
    assert.ok(
      globalsContent.includes('.border-slate-100') && globalsContent.includes('border-color: var(--border-divider) !important;'),
      'Proxy Layer phải ánh xạ .border-slate-100 sang var(--border-divider)'
    );

    // 4. Ánh xạ border-slate-200 sang --border-card
    assert.ok(
      globalsContent.includes('.border-slate-200') && globalsContent.includes('border-color: var(--border-card) !important;'),
      'Proxy Layer phải ánh xạ .border-slate-200 sang var(--border-card)'
    );

    // 5. Ánh xạ text-emerald-600/700/800 sang --text-brand-accent
    assert.ok(
      globalsContent.includes('.text-emerald-600') && globalsContent.includes('color: var(--text-brand-accent) !important;'),
      'Proxy Layer phải ánh xạ .text-emerald-600 sang var(--text-brand-accent)'
    );

    // 6. Ánh xạ button.bg-emerald-600 sang --bg-brand
    assert.ok(
      globalsContent.includes('button.bg-emerald-600') && globalsContent.includes('background-color: var(--bg-brand) !important;'),
      'Proxy Layer phải ánh xạ button.bg-emerald-600 sang var(--bg-brand)'
    );

    // 7. Ánh xạ bg-emerald-50/100 sang --bg-sub-surface
    assert.ok(
      globalsContent.includes('.bg-emerald-50') && globalsContent.includes('background-color: var(--bg-sub-surface) !important;'),
      'Proxy Layer phải ánh xạ .bg-emerald-50 sang var(--bg-sub-surface)'
    );

    // 8. Triệt tiêu gradient background-image: none !important
    assert.ok(
      globalsContent.includes('background-image: none !important;'),
      'Proxy Layer phải triệt tiêu background gradient của banners cũ'
    );
  });

  // 3. TC_THEME_ARCH_03: Khử sạch 100% Ternary Spaghetti trong AnniversaryBlocCard và AnniversaryBlocTimeline
  it('TC_THEME_ARCH_03: Khử sạch 100% Ternary Spaghetti trong AnniversaryBlocCard và AnniversaryBlocTimeline', () => {
    assert.ok(fs.existsSync(blocCardPath), 'AnniversaryBlocCard.tsx phải tồn tại');
    assert.ok(fs.existsSync(blocTimelinePath), 'AnniversaryBlocTimeline.tsx phải tồn tại');

    const cardContent = fs.readFileSync(blocCardPath, 'utf8');
    const timelineContent = fs.readFileSync(blocTimelinePath, 'utf8');

    // 1. AnniversaryBlocCard container phải mang data-theme-profile
    assert.ok(
      cardContent.includes('data-theme-profile={profile}'),
      'AnniversaryBlocCard phải khai báo data-theme-profile={profile} trên container để kế thừa CSS scoping'
    );

    // 2. Không còn các ternary inline lắt nhắt trong JSX của AnniversaryBlocCard
    assert.ok(
      !cardContent.includes("isContemporary ? 'w-full max-w-3xl"),
      'Không còn ternary containerClasses trong AnniversaryBlocCard'
    );
    assert.ok(
      !cardContent.includes("isContemporary ? 'text-6xl"),
      'Không còn ternary solarDayTextClasses trong AnniversaryBlocCard'
    );
    assert.ok(
      !cardContent.includes("isContemporary ? 'py-4 text-center"),
      'Không còn ternary solarAreaClasses trong AnniversaryBlocCard'
    );
    assert.ok(
      !cardContent.includes("isContemporary ? 'divide-y divide-[#EAE5D9]"),
      'Không còn ternary divide-y trong JSX của AnniversaryBlocCard'
    );

    // 3. AnniversaryBlocTimeline container phải mang data-theme-profile
    assert.ok(
      timelineContent.includes('data-theme-profile={profile}'),
      'AnniversaryBlocTimeline phải khai báo data-theme-profile={profile} trên container thẻ card'
    );

    // 4. Không còn các ternary inline lắt nhắt trong JSX của AnniversaryBlocTimeline
    assert.ok(
      !timelineContent.includes("isContemporary ? 'w-[76px]"),
      'Không còn ternary mobileStampColClasses trong AnniversaryBlocTimeline'
    );
    assert.ok(
      !timelineContent.includes("isContemporary ? 'flex items-stretch border-b border-[#EAE5D9]"),
      'Không còn ternary border-b trong mobile header của AnniversaryBlocTimeline'
    );
    assert.ok(
      !timelineContent.includes("isContemporary ? 'text-[#BE123C]"),
      'Không còn ternary lunar date color trong AnniversaryBlocTimeline'
    );
    assert.ok(
      !timelineContent.includes("isContemporary ? 'divide-y divide-[#EAE5D9]"),
      'Không còn ternary memberDividerClasses trong AnniversaryBlocTimeline'
    );
  });

  // 4. TC_THEME_ARCH_04: Khử sạch các selector ID chắp vá cũ (#*-dialog, #*-modal) và bảo toàn selector hợp lệ
  it('TC_THEME_ARCH_04: Khử sạch các selector ID chắp vá cũ (#*-dialog, #*-modal) và bảo toàn selector hợp lệ', () => {
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');
    const pushBannerContent = fs.readFileSync(pushBannerPath, 'utf8');

    // 1. Tuyệt đối KHÔNG còn các selector ID chắp vá cũ kiểu bắt chuột chũi
    const forbiddenSelectors = [
      '#member-form-modal-dialog',
      '#connect-genealogy-modal-dialog',
      '#reorder-children-modal-dialog',
      '#personal-settings-modal-dialog',
      '.member-modal-content',
    ];

    for (const sel of forbiddenSelectors) {
      assert.ok(
        !globalsContent.includes(sel),
        `globals.css đã loại bỏ hoàn toàn selector chắp vá theo ID: ${sel}`
      );
    }

    // 2. Modals phải dùng rule ngữ nghĩa toàn diện: [role="dialog"]
    assert.ok(
      globalsContent.includes('[role="dialog"]'),
      'globals.css phải sử dụng selector ngữ nghĩa [role="dialog"] cho Modals/Dialogs'
    );

    // 3. PushNotificationBanner.tsx phải có id="push-notification-banner"
    assert.ok(
      pushBannerContent.includes('id="push-notification-banner"'),
      'PushNotificationBanner.tsx phải có id="push-notification-banner" để nhận style chuẩn từ globals.css'
    );

    // 4. globals.css phải bảo toàn các selector hợp lệ đã chốt
    const validRequiredSelectors = [
      '#push-notification-banner',
      '#hero-eyebrow',
      '#identity-context-widget',
      '#navbar-clan-han-logo',
      '#login-gate-seal',
      '#mobile-bottom-nav',
    ];

    for (const sel of validRequiredSelectors) {
      assert.ok(
        globalsContent.includes(sel),
        `globals.css phải bảo toàn selector hợp lệ: ${sel}`
      );
    }
  });

  // 5. TC_THEME_BLOC_SYNC_01: Cột lịch bloc của AnniversaryBlocCard và AnniversaryBlocTimeline bắt buộc sử dụng bg-white, 0% bg-[#FAF8F2]
  it('TC_THEME_BLOC_SYNC_01: Cột lịch bloc của AnniversaryBlocCard và AnniversaryBlocTimeline bắt buộc sử dụng bg-white, 0% bg-[#FAF8F2]', () => {
    const cardContent = fs.readFileSync(blocCardPath, 'utf8');
    const timelineContent = fs.readFileSync(blocTimelinePath, 'utf8');

    // 1. AnniversaryBlocCard desktop bloc column phải là bg-white dark:bg-slate-900, không chứa bg-[#FAF8F2]
    assert.ok(
      cardContent.includes("const blocColClasses = 'w-[185px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col select-none';"),
      'AnniversaryBlocCard cột desktop 185px phải khóa cứng màu trắng sứ bg-white dark:bg-slate-900'
    );
    assert.ok(
      !cardContent.includes("bg-[#FAF8F2]' : 'w-[185px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white"),
      'AnniversaryBlocCard tuyệt đối không còn ternary gán bg-[#FAF8F2] vào cột bloc'
    );

    // 2. AnniversaryBlocTimeline mobile (76px) và desktop (90px) đều phải dùng bg-white dark:bg-slate-900
    assert.ok(
      timelineContent.includes('w-[76px] shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'),
      'AnniversaryBlocTimeline cột mobile 76px phải là bg-white dark:bg-slate-900'
    );
    assert.ok(
      timelineContent.includes('w-[90px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'),
      'AnniversaryBlocTimeline cột desktop 90px phải là bg-white dark:bg-slate-900'
    );
  });

  // 6. TC_THEME_BLOC_SYNC_02: Đồng bộ ma trận 3 màu gáy lịch bloc (Hôm nay: đỏ, Ngày mai: vàng, Ngày thường: xanh di sản #0F382C)
  it('TC_THEME_BLOC_SYNC_02: Đồng bộ ma trận 3 màu gáy lịch bloc (Hôm nay: đỏ, Ngày mai: vàng, Ngày thường: xanh di sản #0F382C)', () => {
    const cardContent = fs.readFileSync(blocCardPath, 'utf8');
    const timelineContent = fs.readFileSync(blocTimelinePath, 'utf8');

    // 1. Kiểm tra ma trận 3 trạng thái trong headerBg của AnniversaryBlocCard
    assert.ok(
      cardContent.includes("const headerBg = isContemporary"),
      'AnniversaryBlocCard phải có định nghĩa headerBg phân nhánh theme'
    );
    assert.ok(
      cardContent.includes("'bg-red-600 text-white font-black'"),
      'AnniversaryBlocCard hôm nay giỗ phải có gáy đỏ son bg-red-600'
    );
    assert.ok(
      cardContent.includes("'bg-amber-400 text-slate-950 font-black'"),
      'AnniversaryBlocCard ngày mai giỗ phải có gáy vàng hổ phách bg-amber-400'
    );
    assert.ok(
      cardContent.includes("'bg-[#065F46] text-white font-bold border-b border-[#047857]'"),
      'AnniversaryBlocCard ngày thường phải có gáy xanh ngọc bích bg-[#065F46]'
    );

    // 2. Kiểm tra ma trận 3 trạng thái trong stampHeaderBg của AnniversaryBlocTimeline
    assert.ok(
      timelineContent.includes("const stampHeaderBg = isContemporary"),
      'AnniversaryBlocTimeline phải có định nghĩa stampHeaderBg phân nhánh theme'
    );
    assert.ok(
      timelineContent.includes("'bg-red-600 text-white font-black'"),
      'AnniversaryBlocTimeline hôm nay giỗ phải có gáy đỏ son bg-red-600'
    );
    assert.ok(
      timelineContent.includes("'bg-amber-400 text-slate-950 font-black'"),
      'AnniversaryBlocTimeline ngày mai giỗ phải có gáy vàng hổ phách bg-amber-400'
    );
    assert.ok(
      timelineContent.includes("'bg-[#065F46] text-white font-bold'"),
      'AnniversaryBlocTimeline ngày thường phải có gáy xanh ngọc bích bg-[#065F46]'
    );
  });
});

