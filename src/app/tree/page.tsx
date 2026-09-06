import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SAMPLE_MEMBERS_28, SAMPLE_SPOUSE_RELATIONS } from '@/lib/tree-layout/sample-data';
import { FamilyTreeCanvas } from '@/components/tree/FamilyTreeCanvas';
import { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import type { BranchNode } from '@/types/database';

export const metadata: Metadata = {
  title: 'Cây Phả Hệ Tương Tác - FAT Family Tree',
  description: 'Màn hình trực quan hóa cây phả hệ gia tộc đa thế hệ, hỗ trợ pan zoom và Ghost Node hôn nhân nội tộc.',
};

export default async function TreePage() {
  let members: MemberRecord[] = [];
  let spouseRelations: SpouseRelationRecord[] = [];
  let clanName = 'DÒNG HỌ NGUYỄN VĂN';
  let clanBranches: BranchNode[] = [];

  try {
    const supabase = createClient();
    const cookieStore = cookies();
    const devBranchesStr = cookieStore.get('fat_dev_branches')?.value;
    if (devBranchesStr) {
      try {
        clanBranches = JSON.parse(devBranchesStr);
      } catch {}
    }

    // Lấy thông tin cài đặt dòng họ
    const { data: clanSettings } = await supabase
      .from('clan_settings')
      .select('clan_name, branches')
      .limit(1)
      .maybeSingle();

    if (clanSettings?.clan_name) {
      clanName = clanSettings.clan_name;
    }
    if (clanBranches.length === 0 && clanSettings?.branches && Array.isArray(clanSettings.branches)) {
      clanBranches = clanSettings.branches as unknown as BranchNode[];
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
      members = SAMPLE_MEMBERS_28;
      spouseRelations = SAMPLE_SPOUSE_RELATIONS;
    }
  } catch {
    members = SAMPLE_MEMBERS_28;
    spouseRelations = SAMPLE_SPOUSE_RELATIONS;
  }

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden flex flex-col">
      <FamilyTreeCanvas
        initialMembers={members}
        initialSpouseRelations={spouseRelations}
        clanName={clanName}
        clanBranches={clanBranches}
      />
    </div>
  );
}
