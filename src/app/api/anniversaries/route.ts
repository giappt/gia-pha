import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SAMPLE_MEMBERS_28 } from '@/lib/tree-layout/sample-data';
import { MemberRecord } from '@/types/tree';
import { getUpcomingAnniversaries } from '@/lib/anniversaries/anniversary-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const branch = searchParams.get('branch') || undefined;
    const viewerMemberId = searchParams.get('viewerMemberId') || undefined;

    let daysAhead = 30;
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 90) {
        daysAhead = parsed;
      }
    }

    let members: MemberRecord[] = [];

    try {
      const supabase = createClient();
      const { data: dbMembers, error } = await supabase
        .from('members')
        .select('*')
        .order('generation_level', { ascending: true });

      if (!error && dbMembers && dbMembers.length > 0) {
        members = dbMembers as unknown as MemberRecord[];
      } else {
        members = SAMPLE_MEMBERS_28;
      }
    } catch {
      members = SAMPLE_MEMBERS_28;
    }

    const data = getUpcomingAnniversaries(members, {
      daysAhead,
      viewerMemberId,
      branchFilter: branch,
    });

    const totalCount = data.reduce((acc, g) => acc + g.members.length, 0);

    return NextResponse.json({
      success: true,
      data,
      totalCount,
      daysAhead,
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  } catch (error) {
    console.error('Error fetching anniversaries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching anniversaries' },
      { status: 500 }
    );
  }
}
