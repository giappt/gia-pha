import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MemberFormData, MemberRecord } from '@/types/tree';
import { validateNoCycle, CycleDetectedError } from '@/lib/tree-layout/graph-validation';
import { SAMPLE_MEMBERS_28 } from '@/lib/tree-layout/sample-data';

export async function GET() {
  try {
    const admin = createAdminClient();
    const supabase = admin || createClient();
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('generation_level', { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, members: data });
    }
    return NextResponse.json({ success: true, members: SAMPLE_MEMBERS_28 });
  } catch {
    return NextResponse.json({ success: true, members: SAMPLE_MEMBERS_28 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: MemberFormData = await request.json();

    if (!body.full_name || !body.full_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Họ và Tên không được để trống' },
        { status: 400 }
      );
    }

    // Lấy danh sách thành viên hiện tại để kiểm tra đồ thị và tính thế hệ
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

    // Kiểm tra chu trình lặp nếu có gán cha hoặc mẹ
    const parentId = body.father_id || body.mother_id;
    if (parentId && body.id) {
      try {
        validateNoCycle(body.id, parentId, existingMembers);
      } catch (err) {
        if (err instanceof CycleDetectedError) {
          return NextResponse.json(
            { success: false, error: err.message },
            { status: 400 }
          );
        }
      }
    }

    // Kiểm tra tính hợp lý của năm sinh con vs bố mẹ
    if (body.birth_year != null) {
      const childYear = Number(body.birth_year);
      if (body.father_id) {
        const father = existingMembers.find((m) => m.id === body.father_id);
        if (father && father.birth_year && childYear <= father.birth_year) {
          return NextResponse.json(
            {
              success: false,
              error: `Năm sinh của con (${childYear}) không thể trước hoặc bằng năm sinh của Bố ${father.full_name} (${father.birth_year}).`,
            },
            { status: 400 }
          );
        }
      }
      if (body.mother_id) {
        const mother = existingMembers.find((m) => m.id === body.mother_id);
        if (mother && mother.birth_year && childYear <= mother.birth_year) {
          return NextResponse.json(
            {
              success: false,
              error: `Năm sinh của con (${childYear}) không thể trước hoặc bằng năm sinh của Mẹ ${mother.full_name} (${mother.birth_year}).`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Dọn trùng birth_order và giải quyết xung đột is_senior nếu có cha hoặc mẹ
    const siblings = (body.father_id || body.mother_id)
      ? existingMembers.filter(
          (m) =>
            (body.father_id && m.father_id === body.father_id) ||
            (body.mother_id && m.mother_id === body.mother_id)
        )
      : [];

    let oldSeniorId: string | null = null;
    if (body.is_senior && siblings.length > 0) {
      const oldSenior = siblings.find((s) => s.is_senior && s.id !== (body.id || ''));
      if (oldSenior) {
        oldSeniorId = oldSenior.id;
      }
    }

    let conflictBirthOrderId: string | null = null;
    if (body.birth_order != null && siblings.length > 0) {
      const conflictChild = siblings.find(
        (s) => s.birth_order === Number(body.birth_order) && s.id !== (body.id || '')
      );
      if (conflictChild) {
        conflictBirthOrderId = conflictChild.id;
      }
    }

    // Tính toán generation_level
    let generationLevel = 1;
    if (parentId) {
      const parent = existingMembers.find((m) => m.id === parentId);
      if (parent) {
        generationLevel = (parent.generation_level || 1) + 1;
      }
    } else if (!body.is_root) {
      // Mặc định unlinked member bắt đầu từ đời 1 hoặc tùy chọn
      generationLevel = 1;
    }

    const newMemberId = body.id || crypto.randomUUID();
    const newMember: MemberRecord = {
      id: newMemberId,
      full_name: body.full_name.trim(),
      alias_name: body.alias_name?.trim() || null,
      gender: body.gender || 'male',
      life_status: body.life_status || 'living',
      father_id: body.father_id || null,
      mother_id: body.mother_id || null,
      birth_year: body.birth_year != null ? Number(body.birth_year) : null,
      birth_date: body.birth_date || null,
      death_year: body.death_year != null ? Number(body.death_year) : null,
      death_date: body.death_date || null,
      death_lunar_day: body.death_lunar_day != null ? Number(body.death_lunar_day) : null,
      death_lunar_month: body.death_lunar_month != null ? Number(body.death_lunar_month) : null,
      death_lunar_is_leap: !!body.death_lunar_is_leap,
      death_lunar_year_name: body.death_lunar_year_name || null,
      generation_level: generationLevel,
      birth_order: body.birth_order != null ? Number(body.birth_order) : 1,
      is_root: !!body.is_root,
      is_senior: !!body.is_senior,
      is_adopted: !!body.is_adopted,
      burial_location: body.burial_location || null,
      notes: body.notes || null,
    };

    let newSpouse: MemberRecord | undefined;
    let newSpouseRelation: any | undefined;

    // Lưu vào Supabase với quyền Admin (bypassing RLS)
    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();
      const { error: insertErr } = await supabase.from('members').insert([newMember as any]);
      if (insertErr) {
        console.error('[POST /api/members] Error inserting member:', insertErr);
      }

      // Hạ cờ con trưởng cũ nếu có
      if (oldSeniorId) {
        await supabase.from('members').update({ is_senior: false } as any).eq('id', oldSeniorId);
      }

      // Gỡ bỏ thứ tự sinh của người cũ nếu bị trùng
      if (conflictBirthOrderId) {
        await supabase.from('members').update({ birth_order: null } as any).eq('id', conflictBirthOrderId);
      }

      // 1. Nếu có liên kết hôn phối với người đã có (Hôn nhân nội tộc hoặc Thêm phối ngẫu)
      if (body.spouse_id) {
        newSpouseRelation = {
          id: crypto.randomUUID(),
          member_a_id: newMember.gender === 'male' ? newMember.id : body.spouse_id,
          member_b_id: newMember.gender === 'male' ? body.spouse_id : newMember.id,
          marriage_order: body.marriage_order || 1,
          marriage_status: body.marriage_status || 'married',
        };
        await supabase.from('spouse_relations').insert([newSpouseRelation as any]);
      }

      // 2. Nếu có tạo Vợ/Chồng mới ngoài tộc tại chỗ (Inline Spouse Creation)
      if (body.new_spouse_name && body.new_spouse_name.trim()) {
        const spouseId = crypto.randomUUID();
        const spouseGender = body.new_spouse_gender || (newMember.gender === 'male' ? 'female' : 'male');
        newSpouse = {
          id: spouseId,
          full_name: body.new_spouse_name.trim(),
          gender: spouseGender,
          life_status: body.new_spouse_is_deceased ? 'deceased' : 'living',
          birth_year: body.new_spouse_birth_year != null ? Number(body.new_spouse_birth_year) : null,
          generation_level: newMember.generation_level,
          is_root: false,
        };

        await supabase.from('members').insert([newSpouse as any]);
        newSpouseRelation = {
          id: crypto.randomUUID(),
          member_a_id: newMember.gender === 'male' ? newMember.id : spouseId,
          member_b_id: newMember.gender === 'male' ? spouseId : newMember.id,
          marriage_order: body.marriage_order || 1,
          marriage_status: body.marriage_status || 'married',
        };
        await supabase.from('spouse_relations').insert([newSpouseRelation as any]);
      }

      // 3. Nếu có gán nối danh sách con cái từ khay chưa nối
      if (body.child_ids_to_link && Array.isArray(body.child_ids_to_link) && body.child_ids_to_link.length > 0) {
        const updateField = newMember.gender === 'male' ? { father_id: newMember.id } : { mother_id: newMember.id };
        for (const childId of body.child_ids_to_link) {
          await supabase.from('members').update(updateField as any).eq('id', childId);
        }
      }
    } catch (dbErr) {
      console.warn('[POST /api/members] Database write warning (falling back to mock):', dbErr);
      if (body.new_spouse_name && body.new_spouse_name.trim() && !newSpouse) {
        const spouseId = crypto.randomUUID();
        const spouseGender = body.new_spouse_gender || (newMember.gender === 'male' ? 'female' : 'male');
        newSpouse = {
          id: spouseId,
          full_name: body.new_spouse_name.trim(),
          gender: spouseGender,
          life_status: body.new_spouse_is_deceased ? 'deceased' : 'living',
          birth_year: body.new_spouse_birth_year != null ? Number(body.new_spouse_birth_year) : null,
          generation_level: newMember.generation_level,
          is_root: false,
        };
      }
      if (body.spouse_id && !newSpouseRelation) {
        newSpouseRelation = {
          id: crypto.randomUUID(),
          member_a_id: newMember.gender === 'male' ? newMember.id : body.spouse_id,
          member_b_id: newMember.gender === 'male' ? body.spouse_id : newMember.id,
          marriage_order: body.marriage_order || 1,
          marriage_status: body.marriage_status || 'married',
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        member: newMember,
        newSpouse,
        newSpouseRelation,
        clearedBirthOrderId: conflictBirthOrderId,
        demotedSeniorId: oldSeniorId,
        linkedChildIds: body.child_ids_to_link || [],
        message: 'Tạo thành viên thành công',
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi server khi tạo thành viên' },
      { status: 500 }
    );
  }
}
