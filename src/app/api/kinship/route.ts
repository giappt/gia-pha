import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findLowestCommonAncestor } from '@/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '@/lib/kinship-engine/regional-dictionaries';
import { MOCK_CLAN_MEMBERS } from '@/lib/kinship-engine/mock-data';
import type { Member } from '@/types/database';
import type { KinshipRegion } from '@/types/kinship';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const p1 = searchParams.get('p1') || searchParams.get('person1');
    const p2 = searchParams.get('p2') || searchParams.get('person2');
    const region = (searchParams.get('region') as KinshipRegion) || 'north';
    const action = searchParams.get('action');

    // 1. Lấy danh sách thành viên từ Supabase (hoặc fallback bộ mock dữ liệu)
    let members: Member[] = [];
    try {
      const supabase = createClient();
      const { data: dbMembers, error } = await supabase
        .from('members')
        .select('*')
        .order('generation_number', { ascending: true });

      if (!error && dbMembers && dbMembers.length > 0) {
        members = dbMembers;
      } else {
        members = MOCK_CLAN_MEMBERS;
      }
    } catch {
      members = MOCK_CLAN_MEMBERS;
    }

    // 2. Nếu yêu cầu lấy danh sách thành viên cho bộ chọn giao diện
    if (action === 'members' || (!p1 && !p2)) {
      return NextResponse.json({
        success: true,
        data: {
          members: members.map((m) => ({
            id: m.id,
            full_name: m.full_name,
            gender: m.gender,
            generation_number: m.generation_number,
            birth_year: m.birth_year,
            birth_order: m.birth_order,
            is_senior_branch: m.is_senior_branch,
            is_adopted: m.is_adopted,
            has_parents: Boolean(m.father_id || m.mother_id),
          })),
        },
      });
    }

    // 3. Kiểm tra tham số đầu vào
    if (!p1 || !p2) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn đầy đủ 2 thành viên cần tra cứu vai vế.' },
        { status: 400 }
      );
    }

    // Edge Case 1 (TC05): Chọn trùng 1 người
    if (p1 === p2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vui lòng chọn 2 thành viên khác nhau để tra cứu quan hệ xưng hô.',
        },
        { status: 400 }
      );
    }

    const membersMap = new Map<string, Member>(members.map((m) => [m.id, m]));
    const member1 = membersMap.get(p1);
    const member2 = membersMap.get(p2);

    if (!member1 || !member2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không tìm thấy một trong hai thành viên trong dữ liệu phả hệ.',
        },
        { status: 404 }
      );
    }

    // Edge Case 2 (TC06): Thành viên chưa nối phả
    const isMember1Unlinked = !member1.father_id && !member1.mother_id && member1.generation_number > 1;
    const isMember2Unlinked = !member2.father_id && !member2.mother_id && member2.generation_number > 1;

    // 4. Tính toán Tổ tiên chung gần nhất (LCA)
    const lcaResult = findLowestCommonAncestor(p1, p2, membersMap);

    // 5. Ánh xạ từ điển xưng hô 3 miền
    const resolution = resolveKinshipTerms(lcaResult, member1, member2, region);

    // Bổ sung thông điệp cảnh báo nếu có thành viên chưa nối phả
    if (lcaResult.relationshipType === 'unrelated') {
      if (isMember1Unlinked || isMember2Unlinked) {
        const unlinkedName = isMember1Unlinked ? member1.full_name : member2.full_name;
        resolution.explanation = `Thành viên "${unlinkedName}" chưa được liên kết cha/mẹ trong cây phả hệ, do đó chưa thể xác định quan hệ xưng hô.`;
      }
    }

    return NextResponse.json({
      success: true,
      data: resolution,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Có lỗi xảy ra trong quá trình tính toán vai vế phả hệ.',
      },
      { status: 500 }
    );
  }
}
