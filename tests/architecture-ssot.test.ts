import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AnniversaryBlocCardPreview } from '../src/components/anniversaries/AnniversaryBlocCard';
import { MOCK_ANNIVERSARY_GROUP_TODAY, MOCK_ANNIVERSARY_GROUP_UPCOMING } from '../src/fixtures/anniversary-fixtures';

describe('Architecture SSOT & Code Guards Test Suite (Milestone 9)', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('TC_UT_PREVIEW_COMPONENT_01: AnniversaryBlocCardPreview render thành công từ Shared Fixtures', () => {
    // 1. Render variant Hôm Nay
    const htmlToday = renderToString(React.createElement(AnniversaryBlocCardPreview, { variant: 'today' }));
    assert.ok(htmlToday.includes(MOCK_ANNIVERSARY_GROUP_TODAY.members[0].full_name), 'Phải chứa tên cụ ngày hôm nay');
    assert.ok(htmlToday.includes('Hôm nay giỗ'), 'Phải chứa nhãn Hôm nay giỗ');

    // 2. Render variant Tương Lai
    const htmlUpcoming = renderToString(React.createElement(AnniversaryBlocCardPreview, { variant: 'upcoming' }));
    assert.ok(htmlUpcoming.includes(MOCK_ANNIVERSARY_GROUP_UPCOMING.members[0].full_name), 'Phải chứa tên cụ ngày tương lai');
    assert.ok(htmlUpcoming.includes(`Còn ${MOCK_ANNIVERSARY_GROUP_UPCOMING.days_left} ngày`), 'Phải chứa nhãn số ngày còn lại');
  });

  it('TC_ARCH_GUARD_01: Chặn mã mockup HTML thô sơ trong trang Quản trị Theme', () => {
    const themePagePath = path.join(rootDir, 'src/app/admin/theme/page.tsx');
    const content = fs.readFileSync(themePagePath, 'utf8');

    // CẤM chứa chuỗi mockup cũ từ bản thảo thô
    assert.ok(!content.includes('19/08 Âm Lịch'), 'CẤM chứa chuỗi mockup tĩnh 19/08 Âm Lịch');
    assert.ok(!content.includes('Cụ Nguyễn Thị Hiến'), 'CẤM chứa mockup tên cụ hardcode trong admin theme');

    // BẮT BUỘC tái sử dụng production component
    assert.ok(
      content.includes("import { AnniversaryBlocCardPreview } from '@/components/anniversaries/AnniversaryBlocCard'"),
      'Bắt buộc import AnniversaryBlocCardPreview từ component production'
    );
    assert.ok(content.includes('<AnniversaryBlocCardPreview'), 'Bắt buộc render AnniversaryBlocCardPreview trong JSX');
  });

  it('TC_ARCH_GUARD_02: Chặn class hardcode hình học tùy tiện trên các surface chính (Semantic Tokens First)', () => {
    // 1. Kiểm tra AnniversaryBlocCard
    const blocCardPath = path.join(rootDir, 'src/components/anniversaries/AnniversaryBlocCard.tsx');
    const blocContent = fs.readFileSync(blocCardPath, 'utf8');
    assert.ok(blocContent.includes('rounded-card'), 'AnniversaryBlocCard phải dùng semantic token rounded-card');
    assert.ok(
      blocContent.includes("bg-emerald-800 text-white font-bold"),
      'Màu đỉnh tháng tương lai phải là Xanh Lục Bảo Trầm bg-emerald-800'
    );
    assert.ok(!blocContent.includes("bg-slate-700 text-slate-100 font-bold"), 'CẤM dùng màu xám than bg-slate-700 cho đỉnh tháng');

    // 2. Kiểm tra IdentityContextWidget
    const identityPath = path.join(rootDir, 'src/components/home/IdentityContextWidget.tsx');
    const identityContent = fs.readFileSync(identityPath, 'utf8');
    assert.ok(identityContent.includes('rounded-card'), 'IdentityContextWidget phải dùng semantic token rounded-card');

    // 3. Kiểm tra InstallPwaButton banner
    const pwaPath = path.join(rootDir, 'src/components/pwa/InstallPwaButton.tsx');
    const pwaContent = fs.readFileSync(pwaPath, 'utf8');
    assert.ok(pwaContent.includes('rounded-card'), 'Banner InstallPwaButton phải dùng semantic token rounded-card');

    // 4. Kiểm tra tokens trong globals.css và tailwind.config.ts
    const globalsPath = path.join(rootDir, 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');
    assert.ok(globalsContent.includes('--radius-card'), 'globals.css phải khai báo biến --radius-card');
    assert.ok(globalsContent.includes('--radius-control'), 'globals.css phải khai báo biến --radius-control');

    const tailwindPath = path.join(rootDir, 'tailwind.config.ts');
    const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');
    assert.ok(tailwindContent.includes('var(--radius-card'), 'tailwind.config.ts phải map card với --radius-card');
  });

  it('TC_ARCH_GUARD_03: Chặn việc query DB ngày giỗ phân mảnh ngoài SSOT Domain Service', () => {
    // 1. Kiểm tra src/app/page.tsx
    const homePagePath = path.join(rootDir, 'src/app/page.tsx');
    const homeContent = fs.readFileSync(homePagePath, 'utf8');
    assert.ok(
      homeContent.includes("import { getUpcomingAnniversariesFeed } from '@/lib/services/anniversary.service'"),
      'Home Page bắt buộc import getUpcomingAnniversariesFeed'
    );
    assert.ok(
      homeContent.includes('await getUpcomingAnniversariesFeed('),
      'Home Page bắt buộc gọi getUpcomingAnniversariesFeed'
    );
    assert.ok(!homeContent.includes('getUpcomingAnniversaries(membersList'), 'Home Page không được tự gọi hàm engine cũ');

    // 2. Kiểm tra src/app/api/anniversaries/route.ts
    const apiRoutePath = path.join(rootDir, 'src/app/api/anniversaries/route.ts');
    const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
    assert.ok(
      apiContent.includes("import { getUpcomingAnniversariesFeed } from '@/lib/services/anniversary.service'"),
      'API Route bắt buộc import getUpcomingAnniversariesFeed'
    );
    assert.ok(
      apiContent.includes('await getUpcomingAnniversariesFeed('),
      'API Route bắt buộc gọi getUpcomingAnniversariesFeed'
    );
  });

  it('TC_UT_BLOC_TYPOGRAPHY_01: Tỷ lệ chữ số ngày và thứ trên thẻ Lịch Bloc đạt chuẩn tờ lịch', () => {
    const blocCardPath = path.join(rootDir, 'src/components/anniversaries/AnniversaryBlocCard.tsx');
    const content = fs.readFileSync(blocCardPath, 'utf8');

    // Số ngày Dương lịch trên Mobile phải là cỡ chữ lớn (text-7xl sm:text-8xl)
    assert.ok(
      content.includes('text-7xl sm:text-8xl'),
      'Thẻ Lịch Bloc trên mobile phải có class số ngày cỡ lớn text-7xl sm:text-8xl'
    );

    // Thứ trong tuần phải có class cỡ lớn (text-base sm:text-lg)
    assert.ok(
      content.includes('text-base sm:text-lg'),
      'Thứ trong tuần trên mobile phải có class cỡ chữ text-base sm:text-lg'
    );
  });

  it('TC_ARCH_GUARD_04: Chặn hardcode rounded-lg / rounded-xl trên các nút bấm chính (Ép dùng rounded-control)', () => {
    // 1. AnniversaryBlocCard button
    const blocCardPath = path.join(rootDir, 'src/components/anniversaries/AnniversaryBlocCard.tsx');
    const blocContent = fs.readFileSync(blocCardPath, 'utf8');
    assert.ok(
      blocContent.includes('rounded-control'),
      'Nút bấm trong AnniversaryBlocCard phải dùng semantic token rounded-control'
    );

    // 2. InstallPwaButton buttons
    const pwaPath = path.join(rootDir, 'src/components/pwa/InstallPwaButton.tsx');
    const pwaContent = fs.readFileSync(pwaPath, 'utf8');
    assert.ok(
      pwaContent.includes('rounded-control'),
      'Nút bấm trong InstallPwaButton phải dùng semantic token rounded-control'
    );

    // 3. AnniversaryBlocTimeline buttons and cards
    const timelinePath = path.join(rootDir, 'src/components/anniversaries/AnniversaryBlocTimeline.tsx');
    const timelineContent = fs.readFileSync(timelinePath, 'utf8');
    assert.ok(
      timelineContent.includes('rounded-card'),
      'Khung thẻ AnniversaryBlocTimeline phải dùng rounded-card'
    );
    assert.ok(
      timelineContent.includes('rounded-control'),
      'Nút bấm Xem Cây trong AnniversaryBlocTimeline phải dùng rounded-control'
    );
  });

  it('TC_ARCH_GUARD_05: Khóa tỷ lệ bo góc Profile heritage nhỏ hơn classic (Anti-Bubble)', () => {
    const globalsPath = path.join(rootDir, 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');

    // Profile heritage bắt buộc khai báo góc bo ít hơn: card 0.375rem (6px), control 0.25rem (4px)
    assert.ok(
      globalsContent.includes('--radius-card: 0.375rem;'),
      'globals.css phải khai báo --radius-card: 0.375rem cho profile heritage'
    );
    assert.ok(
      globalsContent.includes('--radius-control: 0.25rem;'),
      'globals.css phải khai báo --radius-control: 0.25rem cho profile heritage'
    );

    // Tuyệt đối CẤM còn giá trị bo tròn 20px (1.25rem) hay 12px (0.75rem) gây tròn bồng bềnh
    assert.ok(
      !globalsContent.includes('--radius-card: 1.25rem'),
      'CẤM dùng --radius-card: 1.25rem (20px) gây tròn bồng bềnh phá vỡ tính mực thước cổ kính'
    );
  });

  it('TC_ARCH_GUARD_06: Khóa Hệ Thống Phòng Thủ Toàn Cầu Tailwind Scale Mapping (Triệt tiêu sửa cục bộ)', () => {
    const globalsPath = path.join(rootDir, 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');

    // 1. globals.css phải khai báo đủ thang đo CSS variables
    const requiredVars = ['--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-2xl', '--radius-3xl', '--radius-card', '--radius-control'];
    for (const v of requiredVars) {
      assert.ok(globalsContent.includes(v), `globals.css phải khai báo biến ${v}`);
    }

    // 2. tailwind.config.ts phải map toàn bộ thang đo vào các biến CSS
    const tailwindPath = path.join(rootDir, 'tailwind.config.ts');
    const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');

    assert.ok(tailwindContent.includes("'2xl': 'var(--radius-2xl"), "tailwind.config.ts phải map '2xl' với --radius-2xl");
    assert.ok(tailwindContent.includes("xl: 'var(--radius-xl"), "tailwind.config.ts phải map xl với --radius-xl");
    assert.ok(tailwindContent.includes("lg: 'var(--radius-lg"), "tailwind.config.ts phải map lg với --radius-lg");
    assert.ok(tailwindContent.includes("md: 'var(--radius-md"), "tailwind.config.ts phải map md với --radius-md");
    assert.ok(tailwindContent.includes("card: 'var(--radius-card"), "tailwind.config.ts phải map card với --radius-card");
    assert.ok(tailwindContent.includes("control: 'var(--radius-control"), "tailwind.config.ts phải map control với --radius-control");
  });

  it('TC_UT_BLOC_TYPOGRAPHY_02: Tỷ lệ chữ số và kích thước Mobile Bloc Timeline đạt chuẩn to rõ', () => {
    const timelinePath = path.join(rootDir, 'src/components/anniversaries/AnniversaryBlocTimeline.tsx');
    const timelineContent = fs.readFileSync(timelinePath, 'utf8');

    // 1. Cột bloc mở rộng 76px
    assert.ok(timelineContent.includes('w-[76px]'), 'Cột lịch bloc mobile phải mở rộng lên w-[76px]');

    // 2. Số ngày Dương 30px (text-3xl font-black)
    assert.ok(timelineContent.includes('text-3xl font-black'), 'Số ngày Dương mobile phải dùng cỡ text-3xl font-black');

    // 3. Đỉnh tháng (text-xs font-black)
    assert.ok(timelineContent.includes('text-xs font-black'), 'Đỉnh tháng mobile phải dùng text-xs font-black');

    // 4. Thứ trong tuần (text-[10px] font-bold)
    assert.ok(timelineContent.includes('text-[10px] font-bold'), 'Thứ trong tuần mobile phải dùng text-[10px] font-bold');
  });

  it('TC_ARCH_GUARD_07: Khóa khối CSS Scoping html[data-theme-profile="contemporary_heritage"] độc lập', () => {
    const globalsPath = path.join(rootDir, 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');

    // Phải khai báo selector độc lập cho contemporary_heritage
    assert.ok(
      globalsContent.includes('html[data-theme-profile="contemporary_heritage"]'),
      'globals.css phải khai báo html[data-theme-profile="contemporary_heritage"]'
    );
    assert.ok(
      globalsContent.includes('html[data-theme-profile="contemporary_heritage"].dark'),
      'globals.css phải khai báo selector dark cho contemporary_heritage'
    );

    // Kiểm tra các biến cốt lõi của Contemporary Heritage
    const requiredHeritageVars = [
      '--bg-canvas: #FAF8F2;',
      '--bg-surface: #FFFFFF;',
      '--border-card: #EAE5D9;',
      '--bg-brand: #0F382C;',
      '--bloc-header-today: #B91C1C;',
      '--bloc-header-tomorrow: #FBBF24;',
      '--bloc-header-upcoming: #065F46;',
    ];
    for (const v of requiredHeritageVars) {
      assert.ok(globalsContent.includes(v), `globals.css phải chứa biến ${v}`);
    }
  });

  it('TC_ARCH_GUARD_08: Khóa Tailwind Config mở rộng màu sắc ngữ nghĩa không đè biến cũ', () => {
    const tailwindPath = path.join(rootDir, 'tailwind.config.ts');
    const tailwindContent = fs.readFileSync(tailwindPath, 'utf8');

    // 1. Bảo toàn các palette cũ
    assert.ok(tailwindContent.includes('jade:'), 'tailwind.config.ts phải bảo toàn palette jade');
    assert.ok(tailwindContent.includes('gold:'), 'tailwind.config.ts phải bảo toàn palette gold');
    assert.ok(tailwindContent.includes('clan:'), 'tailwind.config.ts phải bảo toàn palette clan');

    // 2. Chứa các semantic tokens mới
    const requiredSemanticColors = [
      "canvas: 'var(--bg-canvas)'",
      "surface: 'var(--bg-surface)'",
      "control: 'var(--bg-control)'",
      "brand:",
      "bloc:",
      "kinship:",
    ];
    for (const c of requiredSemanticColors) {
      assert.ok(tailwindContent.includes(c), `tailwind.config.ts phải chứa semantic color ${c}`);
    }
  });

  it('TC_ARCH_GUARD_09: Khóa Zero-Regression cho 2 profile cũ Classic và Heritage', () => {
    const globalsPath = path.join(rootDir, 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf8');

    // 1. Classic tokens (:root) nguyên vẹn
    assert.ok(globalsContent.includes('--brand-primary: #059669;'), 'Classic profile phải giữ nguyên --brand-primary #059669');
    assert.ok(globalsContent.includes('--radius-card: 1rem;'), 'Classic profile phải giữ nguyên --radius-card 1rem');

    // 2. Heritage tokens nguyên vẹn
    assert.ok(globalsContent.includes('--heritage-accent-red: #dc2626;'), 'Heritage profile phải giữ nguyên --heritage-accent-red #dc2626');
    assert.ok(globalsContent.includes('--radius-card: 0.375rem;'), 'Heritage profile phải giữ nguyên --radius-card 0.375rem');
  });
});
