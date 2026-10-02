import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Anti-Pill & System-wide Editorial Cleansing Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const srcDir = path.join(rootDir, 'src');

  function getAllSourceFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllSourceFiles(filePath));
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(filePath);
      }
    }
    return results;
  }

  // 1. TC_UT_ZERO_EMOJI_SYSTEM_WIDE: Quét 100% file .ts và .tsx trong src/ đảm bảo 0 emoji & 0 ký tự đối phó
  it('TC_UT_ZERO_EMOJI_SYSTEM_WIDE: 0 emoji và 0 ký tự đối phó trong toàn bộ 100% source code src/', () => {
    const files = getAllSourceFiles(srcDir);
    assert.ok(files.length > 100, `Phải quét được ít nhất 100 files trong src/, thực tế tìm thấy: ${files.length}`);

    const emojiRegex = new RegExp('[\\u{1F300}-\\u{1FAD6}\\u{1F600}-\\u{1F64F}\\u{1F680}-\\u{1F6FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{1F900}-\\u{1F9FF}\\u{FE00}-\\u{FE0F}]', 'u');
    const forbiddenSymbols = ['✓', '✗', '✕', '⚠', 'ℹ', '♂', '♀', '⚪', '🌸', '🔗', '🌱', '❓', '⚡', '✨', '💡', '🔒'];

    const violations: { file: string; line: number; char: string; snippet: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        const emojiMatch = lineText.match(emojiRegex);
        if (emojiMatch) {
          violations.push({
            file: path.relative(rootDir, file),
            line: idx + 1,
            char: emojiMatch[0],
            snippet: lineText.trim(),
          });
        }
        for (const sym of forbiddenSymbols) {
          if (lineText.includes(sym)) {
            violations.push({
              file: path.relative(rootDir, file),
              line: idx + 1,
              char: sym,
              snippet: lineText.trim(),
            });
          }
        }
      });
    }

    assert.strictEqual(
      violations.length,
      0,
      `Phát hiện ${violations.length} vi phạm emoji/symbol trong src:\n` +
        violations.map((v) => `  - [${v.file}:${v.line}] '${v.char}': ${v.snippet}`).join('\n')
    );
  });

  // 2. TC_UT_ZERO_PILL_SYSTEM_WIDE: Quét 100% file .tsx trong src/ đảm bảo không có pill, nút bo tròn hay skeleton que
  it('TC_UT_ZERO_PILL_SYSTEM_WIDE: 0 rounded-full vi phạm trên button, navbar, skeleton bar, hoặc badge', () => {
    const files = getAllSourceFiles(srcDir).filter((f) => f.endsWith('.tsx'));
    assert.ok(files.length > 50, `Phải quét được ít nhất 50 files .tsx trong src/, thực tế: ${files.length}`);

    const violations: { file: string; match: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/className=(?:\{`[^`]*rounded-full[^`]*`\}|"[^"]*rounded-full[^"]*")/g) || [];

      for (const m of matches) {
        // Kiểm tra đặc trưng của pill / nút bấm / badge
        const hasPadding = /px-[0-9.]+/.test(m);
        const hasTextSize = /text-(?:xs|sm|base|lg|\[[0-9]+px\])/.test(m);

        // Kiểm tra skeleton dạng que (chiều rộng lớn hơn chiều cao nhiều lần)
        const isSausageBar = /(?:w-(?:16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|full)\s+h-(?:[1-9]|1[0-2])|h-(?:[1-9]|1[0-2])\s+w-(?:16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|full))/.test(m);

        // Whitelist hợp lệ:
        // 1. Chấm vi mô trạng thái (Micro Dot: w-1.5, w-2, w-2.5)
        const isMicroDot = /w-(?:1\.5|2|2\.5)\s+h-(?:1\.5|2|2\.5)/.test(m);
        // 2. Avatar tròn hình vuông đều (w-X h-X hoặc aspect-square)
        const isAvatarSquare = /(?:w-[0-9.]+\s+h-[0-9.]+|h-[0-9.]+\s+w-[0-9.]+|aspect-square)/.test(m);
        // 3. Spinner loading
        const isSpinner = /animate-spin/.test(m);
        // 4. Toggle switch thumb
        const isSwitchThumb = /translate-x-/.test(m);

        // Nếu có padding hoặc text size hoặc dạng que dài, mà KHÔNG PHẢI là micro dot/avatar vuông/spinner/switch -> VI PHẠM
        if ((hasPadding || hasTextSize || isSausageBar) && !isMicroDot && !isSpinner && !isSwitchThumb) {
          // Ngoại lệ avatar initial có text nhưng là hình vuông tỉ lệ 1:1
          const isSquareAvatarWithInitials = isAvatarSquare && /(?:w-(?:7|8|10|12|14)\s+h-(?:7|8|10|12|14)|aspect-square)/.test(m);
          if (!isSquareAvatarWithInitials) {
            violations.push({
              file: path.relative(rootDir, file),
              match: m,
            });
          }
        }
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Phát hiện ${violations.length} vi phạm rounded-full trên text/pill/button/skeleton trong src:\n` +
        violations.map((v) => `  - ${v.file}: ${v.match}`).join('\n')
    );
  });

  // 3. TC_UT_ADMIN_KINSHIP_ZERO_ICON_FILTER: Thanh Filter Bar trong admin/kinship đạt chuẩn Zero-Icon
  it('TC_UT_ADMIN_KINSHIP_ZERO_ICON_FILTER: Thanh phân loại admin/kinship sạch bóng icon và không vỡ layout', () => {
    const kinshipAdminPath = path.join(srcDir, 'app/admin/kinship/page.tsx');
    assert.ok(fs.existsSync(kinshipAdminPath), 'admin/kinship/page.tsx phải tồn tại');
    const content = fs.readFileSync(kinshipAdminPath, 'utf8');

    // 1. Không import icon trang trí rác cho chips
    assert.ok(
      !content.includes('GitBranch') && !content.includes('Shield') && !content.includes('Compass'),
      'admin/kinship không được import các icon rườm rà GitBranch, Shield, Compass'
    );

    // 2. FILTER_CHIPS không có trường icon
    assert.ok(
      !content.includes('icon: BookOpen') && !content.includes('icon: Landmark') && !content.includes('icon: GitBranch'),
      'FILTER_CHIPS không được chứa thuộc tính icon'
    );

    // 3. Container dùng flex-wrap để không tràn ngang trên desktop
    assert.ok(
      content.includes('flex items-center gap-1 flex-wrap') && !content.includes('overflow-x-auto'),
      'Thanh phân loại phải sử dụng flex-wrap để dàn hàng ngang phẳng phiu, không sinh scrollbar ngang'
    );
  });

  // 4. TC_UT_MEMBER_NODE_EDITORIAL_STATUS: Thẻ MemberNode dùng micro dot và niên đại di sản
  it('TC_UT_MEMBER_NODE_EDITORIAL_STATUS: MemberNode.tsx sử dụng Micro Dot w-1.5 h-1.5 và niên đại di sản thay thế hoàn toàn chữ Còn sống/Đã mất', () => {
    const memberNodePath = path.join(srcDir, 'components/tree/MemberNode.tsx');
    assert.ok(fs.existsSync(memberNodePath), 'MemberNode.tsx phải tồn tại');
    const content = fs.readFileSync(memberNodePath, 'utf8');

    // 1. Không còn chữ "Còn sống" hay "Đã mất" ở nhãn trạng thái
    assert.ok(
      !content.includes("isDeceased ? 'Đã mất' : 'Còn sống'"),
      'MemberNode.tsx không được dùng nhãn chữ "Còn sống" / "Đã mất"'
    );

    // 2. Chứa micro dot indicator cho cả sống và mất
    assert.ok(
      content.includes('w-1.5 h-1.5 rounded-full bg-emerald-500'),
      'MemberNode.tsx phải chứa micro dot xanh cho người còn sống'
    );
    assert.ok(
      content.includes('w-1.5 h-1.5 rounded-full bg-slate-400'),
      'MemberNode.tsx phải chứa micro dot xám cho người đã mất'
    );

    // 3. Cụ Tổ và Khuyết danh dùng rounded-control (không dùng rounded-full hay Sparks emoji)
    assert.ok(
      content.includes('rounded-control') &&
      content.includes('Cụ Tổ') &&
      !content.includes('<Sparkles'),
      'Nhãn Cụ Tổ phải dùng rounded-control mực thước và không dùng icon Sparkles rườm rà'
    );
  });

  // 5. TC_ARCH_ANTI_PILL_THEME_01: Màn hình admin/theme đạt chuẩn 0 emoji và 0 pill badge vi phạm
  it('TC_ARCH_ANTI_PILL_THEME_01: admin/theme/page.tsx đạt chuẩn 0 emoji và 0 pill badge vi phạm (chỉ micro-dot w-1.5)', () => {
    const themeAdminPath = path.join(srcDir, 'app/admin/theme/page.tsx');
    assert.ok(fs.existsSync(themeAdminPath), 'admin/theme/page.tsx phải tồn tại');
    const content = fs.readFileSync(themeAdminPath, 'utf8');

    // 1. Không chứa rounded-full ngoại trừ micro dot
    const roundedFullMatches = content.match(/rounded-full/g) || [];
    const microDotMatches = content.match(/w-1\.5\s+h-1\.5\s+rounded-full/g) || [];
    assert.strictEqual(
      roundedFullMatches.length,
      microDotMatches.length,
      `admin/theme/page.tsx chỉ được dùng rounded-full cho micro-dots w-1.5. Tìm thấy ${roundedFullMatches.length} rounded-full nhưng chỉ có ${microDotMatches.length} micro-dots`
    );

    // 2. Không chứa emoji
    const emojiRegex = new RegExp('[\\u{1F300}-\\u{1FAD6}\\u{1F600}-\\u{1F64F}\\u{1F680}-\\u{1F6FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{1F900}-\\u{1F9FF}\\u{FE00}-\\u{FE0F}]', 'u');
    assert.strictEqual(emojiRegex.test(content), false, 'admin/theme/page.tsx không được chứa emoji');

    // 3. Có tích hợp hàm promoteCanaryToProduction
    assert.ok(
      content.includes('promoteCanaryToProduction') && content.includes('handlePromoteToProduction'),
      'admin/theme/page.tsx phải tích hợp hàm promoteCanaryToProduction cho nút 1-click'
    );
  });

  // 6. TC_ARCH_ZERO_SPARKLES_THEME_01: Màn hình admin/theme khử sạch 100% icon Sparkles
  it('TC_ARCH_ZERO_SPARKLES_THEME_01: admin/theme/page.tsx khử sạch 100% icon Sparkles trang trí vô nghĩa', () => {
    const themeAdminPath = path.join(srcDir, 'app/admin/theme/page.tsx');
    assert.ok(fs.existsSync(themeAdminPath), 'admin/theme/page.tsx phải tồn tại');
    const content = fs.readFileSync(themeAdminPath, 'utf8');

    assert.ok(
      !content.includes('Sparkles') && !content.includes('<Sparkles'),
      'admin/theme/page.tsx không được chứa bất kỳ instance nào của icon Sparkles'
    );
  });

  // 7. TC_ARCH_THEME_SEGMENTED_MODE_01: Segmented Switcher 2 tab và in-place preview
  it('TC_ARCH_THEME_SEGMENTED_MODE_01: admin/theme/page.tsx áp dụng Segmented Switcher 2 tab, in-place preview và không còn preview chung ở đáy', () => {
    const themeAdminPath = path.join(srcDir, 'app/admin/theme/page.tsx');
    assert.ok(fs.existsSync(themeAdminPath), 'admin/theme/page.tsx phải tồn tại');
    const content = fs.readFileSync(themeAdminPath, 'utf8');

    // 1. Phải có bộ chuyển đổi 2 chế độ
    assert.ok(content.includes('id="theme-mode-base"'), 'Phải có nút chế độ Base Giao diện chính thức');
    assert.ok(content.includes('id="theme-mode-canary"'), 'Phải có nút chế độ Canary Thử nghiệm');

    // 2. Không còn preview chung ở đáy (đã xóa setPreviewTarget và previewTarget)
    assert.ok(
      !content.includes('setPreviewTarget') && !content.includes("previewTarget === 'canary'"),
      'Không được chứa state hoặc khối điều khiển previewTarget chung ở đáy'
    );

    // 3. Có in-place preview trong Base Theme
    assert.ok(
      content.includes('AnniversaryBlocCardPreview') && content.includes('Classic Minimalist'),
      'Phải có in-place preview của component thật trong giao diện chính thức'
    );
  });

  // 8. TC_ARCH_THEME_TIERED_PREVIEW_01: Bố cục Tầng Lớp Bề Thế với preview max-w-2xl và bộ gạt đối chiếu Canary
  it('TC_ARCH_THEME_TIERED_PREVIEW_01: admin/theme/page.tsx áp dụng Bố cục Tầng Lớp Bề Thế với preview max-w-2xl và bộ gạt đối chiếu Canary', () => {
    const themeAdminPath = path.join(srcDir, 'app/admin/theme/page.tsx');
    assert.ok(fs.existsSync(themeAdminPath), 'admin/theme/page.tsx phải tồn tại');
    const content = fs.readFileSync(themeAdminPath, 'utf8');

    // 1. Cả 2 tab đều sử dụng container preview căn giữa bề thế max-w-2xl mx-auto
    const maxW2xlMatches = content.match(/max-w-2xl\s+mx-auto/g) || [];
    assert.ok(
      maxW2xlMatches.length >= 2,
      `Phải có ít nhất 2 container max-w-2xl mx-auto cho khung preview bề thế trong 2 tab (tìm thấy ${maxW2xlMatches.length})`
    );

    // 2. Tab 2 có bộ gạt đối chiếu 2 chế độ: Bản Thử Nghiệm và Bản Con Cháu
    assert.ok(content.includes('id="canary-view-preview-btn"'), 'Tab 2 phải có nút gạt xem Bản Thử Nghiệm');
    assert.ok(content.includes('id="canary-view-base-btn"'), 'Tab 2 phải có nút gạt xem Bản Con Cháu');
    assert.ok(content.includes('canaryPreviewMode'), 'Phải có state canaryPreviewMode quản lý bộ gạt đối chiếu');

    // 3. Không còn cấu trúc ép 2 thẻ preview song song vào cột hẹp (sm:grid-cols-2)
    assert.ok(
      !content.includes('Đối Chiếu Trực Quan: Ai Thấy Giao Diện Nào?'),
      'Đã xóa bỏ hoàn toàn khối ép 2 thẻ preview song song vào cột hẹp'
    );
  });

  // 9. TC_UT_BLOC_CARD_PROFILE_VARIANTS_01: AnniversaryBlocCard hiển thị style phân biệt rõ rệt theo prop profile
  it('TC_UT_BLOC_CARD_PROFILE_VARIANTS_01: AnniversaryBlocCard hiển thị style phân biệt rõ rệt theo prop profile', () => {
    const cardPath = path.join(srcDir, 'components/anniversaries/AnniversaryBlocCard.tsx');
    assert.ok(fs.existsSync(cardPath), 'AnniversaryBlocCard.tsx phải tồn tại');
    const content = fs.readFileSync(cardPath, 'utf8');

    // 1. Phải nhận prop profile?: DesignProfileId
    assert.ok(
      content.includes('profile?: DesignProfileId'),
      'AnniversaryBlocCardProps phải khai báo prop profile?: DesignProfileId'
    );

    // 2. Chứa phân nhánh phong cách cho contemporary_heritage
    assert.ok(
      content.includes("profile === 'contemporary_heritage'"),
      "Phải kiểm tra profile === 'contemporary_heritage' để áp dụng bộ nhận diện Di Sản Đương Đại"
    );

    // 3. Phải áp dụng màu gáy ngọc bích #065F46 và ruột tờ lịch trắng sứ bg-white
    assert.ok(
      content.includes('#065F46') && content.includes('bg-white dark:bg-slate-900'),
      'Profile contemporary_heritage phải áp dụng gáy ngọc #065F46 và ruột tờ lịch trắng sứ bg-white'
    );

    // 4. Phải bảo toàn màu gáy đỏ cờ cho heritage
    assert.ok(
      content.includes('bg-red-600'),
      'Profile heritage phải bảo toàn màu gáy đỏ cờ bg-red-600'
    );

    // 5. AnniversaryBlocCardPreview phải truyền tiếp prop profile
    assert.ok(
      content.includes('profile?: DesignProfileId') && content.includes('profile={profile}'),
      'AnniversaryBlocCardPreview phải nhận và truyền prop profile vào AnniversaryBlocCard'
    );
  });

  // 10. TC_ARCH_THEME_PREVIEW_PROFILE_PROP_01: /admin/theme, page.tsx và anniversaries/page.tsx truyền prop profile phân biệt
  it('TC_ARCH_THEME_PREVIEW_PROFILE_PROP_01: /admin/theme, page.tsx và anniversaries/page.tsx truyền prop profile phân biệt', () => {
    const adminThemePath = path.join(srcDir, 'app/admin/theme/page.tsx');
    const pagePath = path.join(srcDir, 'app/page.tsx');
    const annivPagePath = path.join(srcDir, 'app/anniversaries/page.tsx');

    const adminContent = fs.readFileSync(adminThemePath, 'utf8');
    const homeContent = fs.readFileSync(pagePath, 'utf8');
    const annivContent = fs.readFileSync(annivPagePath, 'utf8');

    // 1. Tab 1 trong admin/theme truyền profile active
    assert.ok(
      adminContent.includes('profile={themeConfig.active_profile}'),
      'Tab 1 của /admin/theme phải truyền profile={themeConfig.active_profile} vào AnniversaryBlocCardPreview'
    );

    // 2. Tab 2 trong admin/theme truyền profile đối chiếu
    assert.ok(
      adminContent.includes('profile={profileToRender}'),
      'Tab 2 của /admin/theme phải truyền profile={profileToRender} vào AnniversaryBlocCardPreview'
    );

    // 3. Trang chủ truyền effectiveThemeProfile
    assert.ok(
      homeContent.includes('profile={effectiveThemeProfile}'),
      'src/app/page.tsx phải truyền profile={effectiveThemeProfile} vào AnniversaryBlocCard'
    );

    // 4. Trang anniversaries truyền themeProfile vào AnniversaryBlocTimeline
    assert.ok(
      annivContent.includes('profile={themeProfile}'),
      'src/app/anniversaries/page.tsx phải truyền profile={themeProfile} vào AnniversaryBlocTimeline'
    );
  });
});

