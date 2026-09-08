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

      let aliasName: string | null = null;
      const aliasMatch = r.fullName.match(/\((.*?)\)/);
      if (aliasMatch) {
        aliasName = aliasMatch[1].trim();
      }

      membersToInsert.push({
        id: memberId,
        full_name: r.fullName,
        alias_name: aliasName,
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

      // Tạo quan hệ hôn phối nếu có (hỗ trợ cả dạng STT đơn và danh sách phân cách dấu phẩy như "2, 3")
      if (r.spouseStt != null) {
        const spouseSttList = String(r.spouseStt)
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);

        for (const spStt of spouseSttList) {
          const spouseId = sttToUuid.get(spStt);
          if (spouseId) {
            // Tránh tạo 2 lần cùng một cặp
            const alreadyAdded = spousesToInsert.some(
              (s) =>
                (s.member_a_id === memberId && s.member_b_id === spouseId) ||
                (s.member_a_id === spouseId && s.member_b_id === memberId)
            );
            if (!alreadyAdded) {
              const spouseRow = sortedRows.find((sr) => String(sr.stt) === spStt);
              const combinedNotes = `${r.notes || ''} ${spouseRow?.notes || ''}`;

              let order = 1;
              if (/vợ cả|bà cả/i.test(combinedNotes)) {
                order = 1;
              } else if (/vợ hai|bà hai|vợ 2/i.test(combinedNotes)) {
                order = 2;
              } else if (/vợ ba|bà ba|vợ 3/i.test(combinedNotes)) {
                order = 3;
              } else if (/vợ tư|bà tư|vợ 4/i.test(combinedNotes)) {
                order = 4;
              } else {
                const husbandId = r.gender === 'Nam' ? memberId : spouseId;
                const existingForHusband = spousesToInsert.filter(
                  (s) => s.member_a_id === husbandId || s.member_b_id === husbandId
                );
                order = existingForHusband.length + 1;
              }

              const isMemberMale = r.gender === 'Nam';
              const aId = isMemberMale ? memberId : spouseId;
              const bId = isMemberMale ? spouseId : memberId;

              spousesToInsert.push({
                id: crypto.randomUUID(),
                member_a_id: aId,
                member_b_id: bId,
                marriage_order: order,
                marriage_status: 'married',
              });
            }
          }
        }
      }
    }

    // Pass 2: Đồng bộ thế hệ cho các phối ngẫu ngoại tộc (không có cha mẹ trong file)
    for (const r of sortedRows) {
      const memberId = sttToUuid.get(String(r.stt))!;
      if (r.spouseStt != null) {
        const spouseSttList = String(r.spouseStt)
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean);

        for (const spStt of spouseSttList) {
          const spouseId = sttToUuid.get(spStt);
          if (spouseId && genMap.has(spouseId)) {
            if (!r.fatherStt && !r.motherStt && !r.isRoot) {
              const partnerGen = genMap.get(spouseId)!;
              genMap.set(memberId, partnerGen);
              const target = membersToInsert.find((m) => m.id === memberId);
              if (target) {
                target.generation_level = partnerGen;
              }
            }
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

      // Tự động đồng bộ Cụ Thủy Tổ (root_ancestor_id) vào clan_settings nếu phát hiện hàng có isRoot
      const rootRow = sortedRows.find((r) => r.isRoot);
      if (rootRow) {
        const rootMemberId = sttToUuid.get(String(rootRow.stt));
        if (rootMemberId) {
          await admin
            .from('clan_settings')
            .update({ root_ancestor_id: rootMemberId })
            .neq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      // Batch insert theo từng nhóm 100 bản ghi để tối ưu hiệu năng
      const chunkSize = 100;
      for (let i = 0; i < membersToInsert.length; i += chunkSize) {
        const chunk = membersToInsert.slice(i, i + chunkSize);
        const { error: insertMemErr } = await admin.from('members').insert(chunk as any);
        if (insertMemErr) {
          if (insertMemErr.message?.includes('schema cache') || insertMemErr.code === 'PGRST204') {
            throw new Error(`Lỗi CSDL (${insertMemErr.message}): Bảng members bị thiếu cột hoặc chưa đồng bộ schema. Vui lòng vào Supabase SQL Editor và chạy file: supabase/migrations/20260907000000_db_sync_and_auth_trigger.sql`);
          }
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
