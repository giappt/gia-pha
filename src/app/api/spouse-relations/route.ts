import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { detectConsanguinity } from '@/lib/tree-layout/graph-validation';
import { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import { SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS } from '@/lib/tree-layout/sample-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { member_a_id, member_b_id, marriage_order = 1, marriage_status = 'married', notes = null } = body;

    if (!member_a_id || !member_b_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ID của một trong 2 người phối ngẫu' },
        { status: 400 }
      );
    }

    if (member_a_id === member_b_id) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết hôn với chính mình' },
        { status: 400 }
      );
    }

    let existingMembers: MemberRecord[] = [];
    let existingSpouses: SpouseRelationRecord[] = [];
    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();
      const { data: mems } = await supabase.from('members').select('*');
      const { data: sps } = await supabase.from('spouse_relations').select('*');
      existingMembers = (mems && mems.length > 0 ? mems : SAMPLE_MEMBERS_28) as unknown as MemberRecord[];
      existingSpouses = (sps && sps.length > 0 ? sps : SAMPLE_SPOUSE_RELATIONS) as unknown as SpouseRelationRecord[];
    } catch {
      existingMembers = SAMPLE_MEMBERS_28;
      existingSpouses = SAMPLE_SPOUSE_RELATIONS;
    }

    // Kiểm tra xem cặp đôi này đã có quan hệ chưa
    const alreadyMarried = existingSpouses.some(
      (s) =>
        (s.member_a_id === member_a_id && s.member_b_id === member_b_id) ||
        (s.member_a_id === member_b_id && s.member_b_id === member_a_id)
    );

    if (alreadyMarried) {
      return NextResponse.json(
        { success: false, error: 'Hai người này đã có quan hệ hôn phối trước đó' },
        { status: 400 }
      );
    }

    // Phát hiện hôn nhân nội tộc qua LCA
    const consanguinityResult = detectConsanguinity(member_a_id, member_b_id, existingMembers);

    const newRelation: SpouseRelationRecord = {
      id: crypto.randomUUID(),
      member_a_id,
      member_b_id,
      marriage_order: Number(marriage_order) || 1,
      marriage_status,
    };

    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();
      await supabase.from('spouse_relations').insert([
        {
          id: newRelation.id,
          member_a_id,
          member_b_id,
          marriage_order: newRelation.marriage_order,
          marriage_status: newRelation.marriage_status,
          notes,
        },
      ]);
    } catch (dbErr) {
      console.warn('[POST /api/spouse-relations] Database write warning:', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        relation: newRelation,
        is_consanguineous: consanguinityResult.isConsanguineous,
        common_ancestor: consanguinityResult.commonAncestorName,
        message: consanguinityResult.isConsanguineous
          ? consanguinityResult.message
          : 'Tạo quan hệ hôn phối thành công',
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi server khi tạo quan hệ hôn phối' },
      { status: 500 }
    );
  }
}
