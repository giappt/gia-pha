import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ExcelMemberRow, MemberRecord } from '@/types/tree';
import { topologicalSortExcelRows } from '@/lib/excel/excel-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rows = [], mode = 'append' } = body as {
      rows: ExcelMemberRow[];
      mode?: 'clean' | 'append';
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu thành viên để nhập' },
        { status: 400 }
      );
    }

    // 1. Sắp xếp theo Topological Order
    const sortedRows = topologicalSortExcelRows(rows);

    // 2. Tạo bản đồ ánh xạ STT trong file -> UUID ngẫu nhiên mới
    const sttToUuid = new Map<string, string>();
    for (const r of sortedRows) {
      sttToUuid.set(String(r.stt), crypto.randomUUID());
    }

    // 3. Chuẩn bị danh sách MemberRecord và SpouseRelation
    const membersToInsert: MemberRecord[] = [];
    const spousesToInsert: Array<{
      id: string;
      member_a_id: string;
      member_b_id: string;
      marriage_order: number;
      marriage_status: string;
    }> = [];

    // Bản đồ tính thế hệ cục bộ
    const genMap = new Map<string, number>();

    for (const r of sortedRows) {
      const memberId = sttToUuid.get(String(r.stt))!;
      const fatherId = r.fatherStt != null ? sttToUuid.get(String(r.fatherStt)) || null : null;
      const motherId = r.motherStt != null ? sttToUuid.get(String(r.motherStt)) || null : null;

      let gen = 1;
      if (fatherId && genMap.has(fatherId)) {
        gen = (genMap.get(fatherId) || 1) + 1;
      } else if (motherId && genMap.has(motherId)) {
        gen = (genMap.get(motherId) || 1) + 1;
      } else if (r.isRoot) {
        gen = 1;
      }
      genMap.set(memberId, gen);

      membersToInsert.push({
        id: memberId,
        full_name: r.fullName,
        gender: r.gender === 'Nam' ? 'male' : r.gender === 'Nữ' ? 'female' : 'other',
        life_status: r.lifeStatus === 'Đã mất' ? 'deceased' : 'living',
        father_id: fatherId,
        mother_id: motherId,
        birth_year: r.birthYear || null,
        death_year: r.deathYear || null,
        death_lunar_day: r.deathLunarDay || null,
        death_lunar_month: r.deathLunarMonth || null,
        death_lunar_is_leap: !!r.deathLunarIsLeap,
        death_lunar_year_name: r.deathLunarYearName || null,
        generation_level: gen,
        birth_order: r.birthOrder || 1,
        is_root: !!r.isRoot,
        is_senior: !!r.isSenior,
        is_adopted: !!r.isAdopted,
        burial_location: r.burialLocation || null,
        notes: r.notes || null,
      });

      // Tạo quan hệ hôn phối nếu có
      if (r.spouseStt != null) {
        const spouseId = sttToUuid.get(String(r.spouseStt));
        if (spouseId) {
          // Tránh tạo 2 lần cùng một cặp
          const alreadyAdded = spousesToInsert.some(
            (s) =>
              (s.member_a_id === memberId && s.member_b_id === spouseId) ||
              (s.member_a_id === spouseId && s.member_b_id === memberId)
          );
          if (!alreadyAdded) {
            spousesToInsert.push({
              id: crypto.randomUUID(),
              member_a_id: memberId,
              member_b_id: spouseId,
              marriage_order: 1,
              marriage_status: 'married',
            });
          }
        }
      }
    }

    const admin = createAdminClient();
    if (admin) {
      if (mode === 'clean') {
        const { error: delSpouseErr } = await admin.from('spouse_relations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (delSpouseErr) {
          throw new Error(`Lỗi xóa dữ liệu hôn phối cũ: ${delSpouseErr.message}`);
        }
        const { error: delMemErr } = await admin.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (delMemErr) {
          throw new Error(`Lỗi xóa dữ liệu thành viên cũ: ${delMemErr.message}`);
        }
      }

      // Batch insert theo từng nhóm 100 bản ghi để tối ưu hiệu năng
      const chunkSize = 100;
      for (let i = 0; i < membersToInsert.length; i += chunkSize) {
        const chunk = membersToInsert.slice(i, i + chunkSize);
        const { error: insertMemErr } = await admin.from('members').insert(chunk as any);
        if (insertMemErr) {
          throw new Error(`Lỗi lưu thành viên vào CSDL: ${insertMemErr.message}`);
        }
      }

      for (let i = 0; i < spousesToInsert.length; i += chunkSize) {
        const chunk = spousesToInsert.slice(i, i + chunkSize);
        const { error: insertSpouseErr } = await admin.from('spouse_relations').insert(chunk as any);
        if (insertSpouseErr) {
          throw new Error(`Lỗi lưu quan hệ hôn phối vào CSDL: ${insertSpouseErr.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: membersToInsert.length,
      spouseCount: spousesToInsert.length,
      message: `Đã nhập thành công ${membersToInsert.length} thành viên vào CSDL gia phả.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi khi nhập dữ liệu gia phả' },
      { status: 500 }
    );
  }
}
