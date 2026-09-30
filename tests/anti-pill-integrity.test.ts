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
});
