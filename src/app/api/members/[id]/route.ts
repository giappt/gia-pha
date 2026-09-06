import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MemberFormData, MemberRecord } from '@/types/tree';
import {
  validateNoCycle,
  CycleDetectedError,
  canDeleteMember,
  recalculateGenerations,
} from '@/lib/tree-layout/graph-validation';
import { SAMPLE_MEMBERS_28 } from '@/lib/tree-layout/sample-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const memberId = params.id;
  try {
    const admin = createAdminClient();
    const supabase = admin || createClient();
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json({ success: true, member: data });
    }

    const fallback = SAMPLE_MEMBERS_28.find((m) => m.id === memberId);
    if (fallback) {
      return NextResponse.json({ success: true, member: fallback });
    }

    return NextResponse.json(
      { success: false, error: 'Không tìm thấy thành viên' },
      { status: 404 }
    );
  } catch {
    const fallback = SAMPLE_MEMBERS_28.find((m) => m.id === memberId);
    if (fallback) {
      return NextResponse.json({ success: true, member: fallback });
    }
    return NextResponse.json(
      { success: false, error: 'Không tìm thấy thành viên' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const memberId = params.id;
  try {
    const body: Partial<MemberFormData> = await request.json();

    let existingMembers: MemberRecord[] = [];
    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();
      const { data } = await supabase.from('members').select('*');
      if (data && data.length > 0) {
        existingMembers = data as unknown as MemberRecord[];
      } else {
        existingMembers = SAMPLE_MEMBERS_28;
      }
    } catch {
      existingMembers = SAMPLE_MEMBERS_28;
    }

    const currentMember = existingMembers.find((m) => m.id === memberId);
    if (!currentMember) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy thành viên cần sửa' },
        { status: 404 }
      );
    }

    // Kiểm tra chu trình lặp nếu thay đổi cha hoặc mẹ
    const newFatherId = body.father_id !== undefined ? body.father_id : currentMember.father_id;
    const newMotherId = body.mother_id !== undefined ? body.mother_id : currentMember.mother_id;
    const parentIdToCheck = newFatherId || newMotherId;

    if (parentIdToCheck) {
      try {
        validateNoCycle(memberId, parentIdToCheck, existingMembers);
      } catch (err) {
        if (err instanceof CycleDetectedError) {
          return NextResponse.json(
            { success: false, error: err.message },
            { status: 400 }
          );
        }
      }
    }

    // Tính toán lại thế hệ nếu đổi cha mẹ
    let updatedGenerations: Map<string, number> | null = null;
    if (newFatherId !== currentMember.father_id || newMotherId !== currentMember.mother_id) {
      updatedGenerations = recalculateGenerations(memberId, parentIdToCheck || null, existingMembers);
    }

    // Kiểm tra tính hợp lý của năm sinh con vs bố mẹ (và ngược lại con cái hiện có)
    const newBirthYear = body.birth_year !== undefined
      ? (body.birth_year != null ? Number(body.birth_year) : null)
      : currentMember.birth_year;

    if (newBirthYear != null) {
      if (newFatherId) {
        const father = existingMembers.find((m) => m.id === newFatherId);
        if (father && father.birth_year && newBirthYear <= father.birth_year) {
          return NextResponse.json(
            {
              success: false,
              error: `Năm sinh của con (${newBirthYear}) không thể trước hoặc bằng năm sinh của Bố ${father.full_name} (${father.birth_year}).`,
            },
            { status: 400 }
          );
        }
      }
      if (newMotherId) {
        const mother = existingMembers.find((m) => m.id === newMotherId);
        if (mother && mother.birth_year && newBirthYear <= mother.birth_year) {
          return NextResponse.json(
            {
              success: false,
              error: `Năm sinh của con (${newBirthYear}) không thể trước hoặc bằng năm sinh của Mẹ ${mother.full_name} (${mother.birth_year}).`,
            },
            { status: 400 }
          );
        }
      }

      // Kiểm tra chiều ngược lại: nếu thành viên này đã có con cái, năm sinh của cha mẹ không thể >= năm sinh con
      const children = existingMembers.filter(
        (m) => m.father_id === memberId || m.mother_id === memberId
      );
      for (const ch of children) {
        if (ch.birth_year && ch.birth_year <= newBirthYear) {
          return NextResponse.json(
            {
              success: false,
              error: `Năm sinh của cha/mẹ (${newBirthYear}) không thể sau hoặc bằng năm sinh của con ${ch.full_name} (${ch.birth_year}).`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Dọn trùng birth_order và giải quyết xung đột is_senior với anh chị em
    const siblings = (newFatherId || newMotherId)
      ? existingMembers.filter(
          (m) =>
            m.id !== memberId &&
            ((newFatherId && m.father_id === newFatherId) ||
              (newMotherId && m.mother_id === newMotherId))
        )
      : [];

    let oldSeniorId: string | null = null;
    if (body.is_senior && siblings.length > 0) {
      const oldSenior = siblings.find((s) => s.is_senior);
      if (oldSenior) {
        oldSeniorId = oldSenior.id;
      }
    }

    let conflictBirthOrderId: string | null = null;
    if (body.birth_order != null && siblings.length > 0) {
      const conflictChild = siblings.find(
        (s) => s.birth_order === Number(body.birth_order)
      );
      if (conflictChild) {
        conflictBirthOrderId = conflictChild.id;
      }
    }

    const updatedMember: MemberRecord = {
      ...currentMember,
      full_name: body.full_name !== undefined ? body.full_name.trim() : currentMember.full_name,
      alias_name: body.alias_name !== undefined ? (body.alias_name?.trim() || null) : currentMember.alias_name,
      gender: body.gender !== undefined ? body.gender : currentMember.gender,
      life_status: body.life_status !== undefined ? body.life_status : currentMember.life_status,
      father_id: newFatherId !== undefined ? newFatherId : currentMember.father_id,
      mother_id: newMotherId !== undefined ? newMotherId : currentMember.mother_id,
      birth_year: newBirthYear,
      birth_date: body.birth_date !== undefined ? body.birth_date : currentMember.birth_date,
      death_year: body.death_year !== undefined ? (body.death_year ? Number(body.death_year) : null) : currentMember.death_year,
      death_date: body.death_date !== undefined ? body.death_date : currentMember.death_date,
      death_lunar_day: body.death_lunar_day !== undefined ? (body.death_lunar_day ? Number(body.death_lunar_day) : null) : currentMember.death_lunar_day,
      death_lunar_month: body.death_lunar_month !== undefined ? (body.death_lunar_month ? Number(body.death_lunar_month) : null) : currentMember.death_lunar_month,
      death_lunar_is_leap: body.death_lunar_is_leap !== undefined ? body.death_lunar_is_leap : currentMember.death_lunar_is_leap,
      death_lunar_year_name: body.death_lunar_year_name !== undefined ? body.death_lunar_year_name : currentMember.death_lunar_year_name,
      generation_level: updatedGenerations?.get(memberId) ?? currentMember.generation_level,
      birth_order: body.birth_order !== undefined ? (body.birth_order != null ? Number(body.birth_order) : null) : currentMember.birth_order,
      is_senior: body.is_senior !== undefined ? body.is_senior : currentMember.is_senior,
      is_adopted: body.is_adopted !== undefined ? body.is_adopted : currentMember.is_adopted,
      is_root: body.is_root !== undefined ? body.is_root : currentMember.is_root,
      burial_location: body.burial_location !== undefined ? body.burial_location : currentMember.burial_location,
      notes: body.notes !== undefined ? body.notes : currentMember.notes,
    };

    let newSpouse: MemberRecord | undefined;

    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();
      await supabase.from('members').update(updatedMember as any).eq('id', memberId);

      // Hạ cờ con trưởng cũ nếu có
      if (oldSeniorId) {
        await supabase.from('members').update({ is_senior: false } as any).eq('id', oldSeniorId);
      }

      // Gỡ bỏ thứ tự sinh của người cũ nếu bị trùng
      if (conflictBirthOrderId) {
        await supabase.from('members').update({ birth_order: null } as any).eq('id', conflictBirthOrderId);
      }

      // Nếu có cập nhật đệ quy thế hệ cho con cháu
      if (updatedGenerations && updatedGenerations.size > 1) {
        updatedGenerations.forEach(async (newGen, chId) => {
          if (chId !== memberId) {
            await supabase.from('members').update({ generation_level: newGen } as any).eq('id', chId);
          }
        });
      }

      // Nếu có tạo phối ngẫu mới ngoài tộc tại chỗ
      if (body.new_spouse_name && body.new_spouse_name.trim()) {
        const spouseId = crypto.randomUUID();
        const spouseGender = body.new_spouse_gender || (updatedMember.gender === 'male' ? 'female' : 'male');
        newSpouse = {
          id: spouseId,
          full_name: body.new_spouse_name.trim(),
          gender: spouseGender,
          life_status: body.new_spouse_is_deceased ? 'deceased' : 'living',
          birth_year: body.new_spouse_birth_year != null ? Number(body.new_spouse_birth_year) : null,
          generation_level: updatedMember.generation_level,
          is_root: false,
        };

        await supabase.from('members').insert([newSpouse as any]);
        await supabase.from('spouse_relations').insert([
          {
            member_a_id: updatedMember.gender === 'male' ? updatedMember.id : spouseId,
            member_b_id: updatedMember.gender === 'male' ? spouseId : updatedMember.id,
            marriage_order: body.marriage_order || 1,
            marriage_status: body.marriage_status || 'married',
          },
        ]);
      }

      // Nếu có gán nối con cái
      if (body.child_ids_to_link && body.child_ids_to_link.length > 0) {
        const updateField = updatedMember.gender === 'male' ? { father_id: updatedMember.id } : { mother_id: updatedMember.id };
        await supabase.from('members').update(updateField).in('id', body.child_ids_to_link);
      }
    } catch (dbErr) {
      console.warn('[PUT /api/members/[id]] Database write warning (falling back to mock):', dbErr);
      if (body.new_spouse_name && body.new_spouse_name.trim()) {
        const spouseId = crypto.randomUUID();
        const spouseGender = body.new_spouse_gender || (updatedMember.gender === 'male' ? 'female' : 'male');
        newSpouse = {
          id: spouseId,
          full_name: body.new_spouse_name.trim(),
          gender: spouseGender,
          life_status: body.new_spouse_is_deceased ? 'deceased' : 'living',
          birth_year: body.new_spouse_birth_year != null ? Number(body.new_spouse_birth_year) : null,
          generation_level: updatedMember.generation_level,
          is_root: false,
        };
      }
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
      newSpouse,
      clearedBirthOrderId: conflictBirthOrderId,
      demotedSeniorId: oldSeniorId,
      linkedChildIds: body.child_ids_to_link || [],
      message: 'Cập nhật hồ sơ thành viên thành công',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi server khi cập nhật thành viên' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const memberId = params.id;
  try {
    let existingMembers: MemberRecord[] = [];
    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();
      const { data } = await supabase.from('members').select('*');
      if (data && data.length > 0) {
        existingMembers = data as unknown as MemberRecord[];
      } else {
        existingMembers = SAMPLE_MEMBERS_28;
      }
    } catch {
      existingMembers = SAMPLE_MEMBERS_28;
    }

    // Áp dụng Chính sách Safe Delete RESTRICT
    const deleteCheck = canDeleteMember(memberId, existingMembers);
    if (!deleteCheck.canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: deleteCheck.reason,
          childrenCount: deleteCheck.childrenCount,
        },
        { status: 400 }
      );
    }

    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();
      // Xóa quan hệ hôn phối trước
      await supabase
        .from('spouse_relations')
        .delete()
        .or(`member_a_id.eq.${memberId},member_b_id.eq.${memberId}`);
      // Xóa thành viên
      await supabase.from('members').delete().eq('id', memberId);
    } catch (dbErr) {
      console.warn('[DELETE /api/members/[id]] Database delete warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa thành viên thành công',
      deletedId: memberId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi server khi xóa thành viên' },
      { status: 500 }
    );
  }
}
