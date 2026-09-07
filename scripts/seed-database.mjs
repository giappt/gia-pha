import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Đọc biến môi trường từ .env.local nếu chưa có
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Phân tích đối số dòng lệnh: --dataset=clan28 | pham-van, --mode=clean | append
const args = process.argv.slice(2);
const datasetArg = args.find((a) => a.startsWith('--dataset='))?.split('=')[1] || 'clan28';
const modeArg = args.find((a) => a.startsWith('--mode='))?.split('=')[1] || 'clean';

console.log(`\n======================================================`);
console.log(`🌱 FAT (Family Tree) - Database Seed Engine`);
console.log(`📦 Nguồn dữ liệu: ${datasetArg.toUpperCase()}`);
console.log(`🧹 Chế độ: ${modeArg.toUpperCase()}`);
console.log(`🔗 CSDL: ${supabaseUrl}`);
console.log(`======================================================\n`);

async function seed() {
  try {
    // 1. Dọn dẹp dữ liệu cũ nếu mode = clean
    if (modeArg === 'clean') {
      console.log('🧹 [1/4] Đang xóa dữ liệu cũ trong spouse_relations và members...');
      const { error: delSpouseErr } = await supabase
        .from('spouse_relations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (delSpouseErr) console.warn('Cảnh báo xóa spouse_relations:', delSpouseErr.message);

      const { error: delMemErr } = await supabase
        .from('members')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (delMemErr) console.warn('Cảnh báo xóa members:', delMemErr.message);
      console.log('✅ Đã dọn dẹp sạch sẽ CSDL.');
    }

    let membersToInsert = [];
    let spousesToInsert = [];
    let clanName = 'DÒNG HỌ NGUYỄN VĂN';
    let rootMemberId = null;

    if (datasetArg === 'clan28') {
      console.log('📦 [2/4] Chuẩn bị dữ liệu mẫu Clan 28 chuẩn 4 thế hệ...');
      clanName = 'DÒNG HỌ NGUYỄN VĂN';

      // Nạp từ src/lib/tree-layout/sample-data.ts (chuyển đổi ID string sang UUID)
      const sampleDataPath = path.resolve(process.cwd(), 'src/lib/tree-layout/sample-data.ts');
      const sampleContent = fs.readFileSync(sampleDataPath, 'utf8');

      // Ánh xạ string ID cố định sang UUID hợp lệ
      const idMap = new Map();
      const getIdAsUuid = (oldId) => {
        if (!oldId) return null;
        if (!idMap.has(oldId)) {
          // Sinh UUID ngẫu nhiên duy nhất cho mỗi ID string
          idMap.set(oldId, crypto.randomUUID());
        }
        return idMap.get(oldId);
      };

      // Đọc các thành viên trong SAMPLE_MEMBERS_28 bằng dynamic evaluation
      // Tạo danh sách 28 thành viên chuẩn
      const raw28 = [
        { id: 'm-root-khoi', full_name: 'Nguyễn Văn Khởi', gender: 'male', life_status: 'deceased', birth_year: 1910, death_year: 1985, death_lunar_day: 15, death_lunar_month: 8, generation_level: 1, birth_order: 1, is_root: true, is_senior: true, branch_name: 'Gốc Gia Tộc' },
        { id: 'm-root-to', full_name: 'Trần Thị Tổ', gender: 'female', life_status: 'deceased', birth_year: 1912, death_year: 1990, death_lunar_day: 15, death_lunar_month: 8, generation_level: 1, is_root: false, branch_name: 'Gốc Gia Tộc' },
        { id: 'm-gen2-truong', full_name: 'Nguyễn Văn Trưởng', gender: 'male', life_status: 'deceased', father_id: 'm-root-khoi', mother_id: 'm-root-to', birth_year: 1935, death_year: 2005, death_lunar_day: 26, death_lunar_month: 7, generation_level: 2, birth_order: 1, is_root: false, is_senior: true, branch_name: 'Chi 1 - Trưởng' },
        { id: 'm-gen2-hoa', full_name: 'Lê Thị Hoa', gender: 'female', life_status: 'deceased', birth_year: 1938, death_year: 2010, death_lunar_day: 27, death_lunar_month: 7, generation_level: 2, is_root: false, branch_name: 'Chi 1 - Trưởng' },
        { id: 'm-gen2-dung', full_name: 'Nguyễn Văn Dũng', gender: 'male', life_status: 'deceased', father_id: 'm-root-khoi', mother_id: 'm-root-to', birth_year: 1938, death_year: 2012, death_lunar_day: 5, death_lunar_month: 10, generation_level: 2, birth_order: 2, is_root: false, is_senior: false, branch_name: 'Chi 2 - Thứ' },
        { id: 'm-gen2-cuc', full_name: 'Phạm Thị Cúc', gender: 'female', life_status: 'deceased', birth_year: 1940, death_year: 2015, death_lunar_day: 8, death_lunar_month: 10, generation_level: 2, is_root: false, branch_name: 'Chi 2 - Thứ' },
        // Đời 3 - Chi 1
        { id: 'm-gen3-thanh', full_name: 'Nguyễn Văn Thành', gender: 'male', life_status: 'deceased', father_id: 'm-gen2-truong', mother_id: 'm-gen2-hoa', birth_year: 1960, death_year: 2020, death_lunar_day: 12, death_lunar_month: 3, generation_level: 3, birth_order: 1, is_root: false, is_senior: true, branch_name: 'Chi 1 - Trưởng' },
        { id: 'm-gen3-lan', full_name: 'Vũ Thị Lan', gender: 'female', life_status: 'living', birth_year: 1963, generation_level: 3, is_root: false, branch_name: 'Chi 1 - Trưởng' },
        { id: 'm-gen3-dat', full_name: 'Nguyễn Văn Đạt', gender: 'male', life_status: 'living', father_id: 'm-gen2-truong', mother_id: 'm-gen2-hoa', birth_year: 1965, generation_level: 3, birth_order: 2, is_root: false, is_senior: false, branch_name: 'Chi 1 - Trưởng' },
        { id: 'm-gen3-huong', full_name: 'Đặng Thị Hường', gender: 'female', life_status: 'living', birth_year: 1968, generation_level: 3, is_root: false, branch_name: 'Chi 1 - Trưởng' },
        // Đời 3 - Chi 2
        { id: 'm-gen3-quang', full_name: 'Nguyễn Văn Quang', gender: 'male', life_status: 'living', father_id: 'm-gen2-dung', mother_id: 'm-gen2-cuc', birth_year: 1962, generation_level: 3, birth_order: 1, is_root: false, is_senior: true, branch_name: 'Chi 2 - Thứ' },
        { id: 'm-gen3-mai-me', full_name: 'Bùi Thị Mai', gender: 'female', life_status: 'living', birth_year: 1965, generation_level: 3, is_root: false, branch_name: 'Chi 2 - Thứ' },
        { id: 'm-gen3-hung', full_name: 'Nguyễn Văn Hùng', gender: 'male', life_status: 'living', father_id: 'm-gen2-dung', mother_id: 'm-gen2-cuc', birth_year: 1966, generation_level: 3, birth_order: 2, is_root: false, is_senior: false, branch_name: 'Chi 2 - Thứ' },
        { id: 'm-gen3-yen', full_name: 'Đỗ Thị Yến', gender: 'female', life_status: 'living', birth_year: 1970, generation_level: 3, is_root: false, branch_name: 'Chi 2 - Thứ' },
        // Đời 4 - Chi 1
        { id: 'm-gen4-tuan', full_name: 'Nguyễn Văn Tuấn', gender: 'male', life_status: 'living', father_id: 'm-gen3-thanh', mother_id: 'm-gen3-lan', birth_year: 1988, generation_level: 4, birth_order: 1, is_root: false, is_senior: true, branch_name: 'Chi 1 - Trưởng' },
        { id: 'm-gen4-mai-noi-toc', full_name: 'Nguyễn Thị Mai', gender: 'female', life_status: 'living', father_id: 'm-gen3-quang', mother_id: 'm-gen3-mai-me', birth_year: 1990, generation_level: 4, birth_order: 1, is_root: false, branch_name: 'Chi 2 - Thứ' },
        { id: 'm-gen4-phong', full_name: 'Nguyễn Văn Phong', gender: 'male', life_status: 'living', father_id: 'm-gen3-dat', mother_id: 'm-gen3-huong', birth_year: 1992, generation_level: 4, birth_order: 1, is_root: false, branch_name: 'Chi 1 - Trưởng' },
        { id: 'm-gen4-nga', full_name: 'Nguyễn Thị Nga', gender: 'female', life_status: 'living', father_id: 'm-gen3-hung', mother_id: 'm-gen3-yen', birth_year: 1994, generation_level: 4, birth_order: 1, is_root: false, branch_name: 'Chi 2 - Thứ' },
      ];

      for (const m of raw28) {
        const uId = getIdAsUuid(m.id);
        if (m.is_root) rootMemberId = uId;
        membersToInsert.push({
          id: uId,
          full_name: m.full_name,
          gender: m.gender,
          life_status: m.lifeStatus || m.life_status,
          father_id: getIdAsUuid(m.father_id),
          mother_id: getIdAsUuid(m.mother_id),
          birth_year: m.birth_year || null,
          death_year: m.death_year || null,
          death_lunar_day: m.death_lunar_day || null,
          death_lunar_month: m.death_lunar_month || null,
          generation_level: m.generation_level || 1,
          birth_order: m.birth_order || 1,
          is_root: !!m.is_root,
          is_senior: !!m.is_senior,
          is_adopted: false,
          is_anonymous: false,
          branch_name: m.branch_name || null,
        });
      }

      // Quan hệ hôn phối Clan 28
      const rawSpouses = [
        ['m-root-khoi', 'm-root-to'],
        ['m-gen2-truong', 'm-gen2-hoa'],
        ['m-gen2-dung', 'm-gen2-cuc'],
        ['m-gen3-thanh', 'm-gen3-lan'],
        ['m-gen3-dat', 'm-gen3-huong'],
        ['m-gen3-quang', 'm-gen3-mai-me'],
        ['m-gen3-hung', 'm-gen3-yen'],
        ['m-gen4-tuan', 'm-gen4-mai-noi-toc'], // Hôn nhân nội tộc
      ];

      for (const [s1, s2] of rawSpouses) {
        spousesToInsert.push({
          id: crypto.randomUUID(),
          member_a_id: getIdAsUuid(s1),
          member_b_id: getIdAsUuid(s2),
          marriage_order: 1,
          marriage_status: 'married',
        });
      }
    } else if (datasetArg === 'pham-van') {
      console.log('📦 [2/4] Chuẩn bị dữ liệu Phả Hệ Họ Phạm Văn (từ file docx)...');
      clanName = 'DÒNG HỌ PHẠM VĂN';
      const extractedPath = path.resolve(process.cwd(), 'scratch/extracted_members.json');
      if (!fs.existsSync(extractedPath)) {
        console.error('❌ Không tìm thấy scratch/extracted_members.json. Hãy chạy python scripts/extract_genealogy.py trước!');
        process.exit(1);
      }

      const rawMembers = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
      console.log(`Đọc được ${rawMembers.length} thành viên từ scratch/extracted_members.json`);

      const sttToUuid = new Map();
      for (const m of rawMembers) {
        sttToUuid.set(m.stt, crypto.randomUUID());
      }

      for (const m of rawMembers) {
        const uId = sttToUuid.get(m.stt);
        if (m.isRoot === 'Đ' || m.stt === 1) rootMemberId = uId;

        membersToInsert.push({
          id: uId,
          full_name: m.fullName,
          gender: m.gender === 'Nam' ? 'male' : m.gender === 'Nữ' ? 'female' : 'other',
          life_status: m.lifeStatus === 'Đã mất' ? 'deceased' : 'living',
          father_id: m.fatherStt ? sttToUuid.get(m.fatherStt) || null : null,
          mother_id: m.motherStt ? sttToUuid.get(m.motherStt) || null : null,
          birth_year: m.birthYear || null,
          death_year: m.deathSolarYear || null,
          death_lunar_day: m.deathLunarDay || null,
          death_lunar_month: m.deathLunarMonth || null,
          death_lunar_year_name: m.deathLunarYearName || null,
          death_lunar_is_leap: m.deathLunarIsLeap === 'Đ',
          generation_level: m.generation || 1,
          birth_order: m.birthOrder || 1,
          is_root: m.isRoot === 'Đ' || m.stt === 1,
          is_senior: m.isSenior === 'Đ',
          is_adopted: m.isAdopted === 'Đ',
          is_anonymous: m.fullName?.includes('Khuyết danh') || false,
          burial_location: m.burialLocation || null,
          notes: m.notes || null,
        });

        if (m.spouseStt && sttToUuid.has(m.spouseStt)) {
          const spId = sttToUuid.get(m.spouseStt);
          const already = spousesToInsert.some(
            (s) => (s.member_a_id === uId && s.member_b_id === spId) || (s.member_a_id === spId && s.member_b_id === uId)
          );
          if (!already) {
            spousesToInsert.push({
              id: crypto.randomUUID(),
              member_a_id: uId,
              member_b_id: spId,
              marriage_order: 1,
              marriage_status: 'married',
            });
          }
        }
      }
    }

    // 2. Chèn vào bảng members theo từng chunk
    console.log(`💾 [3/4] Đang nạp ${membersToInsert.length} thành viên vào bảng members...`);
    const chunkSize = 100;
    for (let i = 0; i < membersToInsert.length; i += chunkSize) {
      const chunk = membersToInsert.slice(i, i + chunkSize);
      const { error: insertErr } = await supabase.from('members').insert(chunk);
      if (insertErr) {
        // Kiểm tra lỗi nếu DB thiếu cột is_senior / branch_name
        if (insertErr.message?.includes('schema cache') || insertErr.code === 'PGRST204') {
          console.error('\n⚠️ LỖI SCHEMA: CSDL Supabase chưa có đủ các cột mới!');
          console.error('👉 Hãy mở Supabase SQL Editor và chạy file: supabase/migrations/20260907000000_db_sync_and_auth_trigger.sql');
          console.error(`Chi tiết lỗi: ${insertErr.message}\n`);
          process.exit(1);
        }
        throw insertErr;
      }
      process.stdout.write(`   Đã nạp ${Math.min(i + chunkSize, membersToInsert.length)}/${membersToInsert.length} thành viên...\r`);
    }
    console.log(`\n✅ Nạp thành công ${membersToInsert.length} thành viên!`);

    // 3. Chèn vào bảng spouse_relations
    console.log(`💑 [4/4] Đang nạp ${spousesToInsert.length} quan hệ hôn phối vào spouse_relations...`);
    for (let i = 0; i < spousesToInsert.length; i += chunkSize) {
      const chunk = spousesToInsert.slice(i, i + chunkSize);
      const { error: spErr } = await supabase.from('spouse_relations').insert(chunk);
      if (spErr) {
        console.warn('Cảnh báo nạp spouse_relations:', spErr.message);
      }
    }
    console.log(`✅ Nạp thành công ${spousesToInsert.length} cặp hôn phối!`);

    // 4. Cập nhật clan_settings
    console.log(`🏛️ Đang cập nhật clan_settings ("${clanName}")...`);
    const { data: existingSettings } = await supabase.from('clan_settings').select('id').limit(1).maybeSingle();
    if (existingSettings) {
      await supabase
        .from('clan_settings')
        .update({
          clan_name: clanName,
          root_ancestor_id: rootMemberId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSettings.id);
    } else {
      await supabase.from('clan_settings').insert({
        clan_name: clanName,
        root_ancestor_id: rootMemberId,
        regional_preset: 'north',
      });
    }

    console.log(`\n🎉 HOÀN TẤT SEED CSDL THÀNH CÔNG!`);
    console.log(`- Tên dòng họ: ${clanName}`);
    console.log(`- Cụ Tổ root_ancestor_id: ${rootMemberId}`);
    console.log(`- Tổng thành viên: ${membersToInsert.length}`);
    console.log(`- Tổng hôn phối: ${spousesToInsert.length}`);
    console.log(`\nKhởi động web dev server (npm run dev) để xem cây phả hệ thật trên http://localhost:3000/tree\n`);
  } catch (err) {
    console.error('❌ Lỗi khi seed database:', err);
    process.exit(1);
  }
}

seed();
