import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS } from '@/lib/tree-layout/sample-data';
import { MemberRecord, SpouseRelationRecord, TreeResponseDTO } from '@/types/tree';

export async function GET(request: NextRequest) {
  try {
    let members: MemberRecord[] = [];
    let spouseRelations: SpouseRelationRecord[] = [];
    let clanName = 'DÒNG HỌ NGUYỄN VĂN';
    let rootAncestorId: string | null = null;

    try {
      const supabase = createClient();

      // Thử lấy thông tin cài đặt dòng họ
      const { data: clanSettings } = await supabase
        .from('clan_settings')
        .select('clan_name')
        .limit(1)
        .maybeSingle();

      if (clanSettings?.clan_name) {
        clanName = clanSettings.clan_name;
      }

      // Lấy danh sách thành viên
      const { data: dbMembers, error: memberError } = await supabase
        .from('members')
        .select('*')
        .order('generation_level', { ascending: true })
        .order('birth_order', { ascending: true });

      // Lấy quan hệ hôn phối
      const { data: dbRelations } = await supabase
        .from('spouse_relations')
        .select('*');

      if (!memberError && dbMembers && dbMembers.length > 0) {
        members = dbMembers as unknown as MemberRecord[];
        spouseRelations = (dbRelations || []) as unknown as SpouseRelationRecord[];
      } else {
        // Fallback sang bộ dữ liệu chuẩn 28 thành viên 4 thế hệ có hôn nhân nội tộc
        members = SAMPLE_MEMBERS_28;
        spouseRelations = SAMPLE_SPOUSE_RELATIONS;
      }
    } catch {
      // Fallback an toàn khi chạy offline / dev môi trường chưa có DB
      members = SAMPLE_MEMBERS_28;
      spouseRelations = SAMPLE_SPOUSE_RELATIONS;
    }

    const rootMember = members.find((m) => m.is_root);
    rootAncestorId = rootMember ? rootMember.id : (members[0]?.id || null);

    const responseData: TreeResponseDTO = {
      success: true,
      clanName,
      rootAncestorId,
      members,
      spouseRelations,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Không thể tải dữ liệu cây phả hệ',
      },
      { status: 500 }
    );
  }
}
