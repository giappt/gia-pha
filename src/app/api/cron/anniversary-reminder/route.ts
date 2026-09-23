import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { MemberRecord } from '@/types/tree';
import { Member } from '@/types/database';
import {
  getTodayAnniversaryMembers,
  getTomorrowAnniversaryMembers,
  getDescendantMemberIds,
  getExtendedFamilyMemberIds,
  computeDeceasedHonorificPrefix,
} from '@/lib/anniversaries/anniversary-engine';
import { findLowestCommonAncestor } from '@/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '@/lib/kinship-engine/regional-dictionaries';
import { solarToLunar } from '@/lib/lunar/vietnamese-lunar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Kiểm tra xác thực CRON_SECRET (bảo vệ endpoint Vercel Cron)
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const authHeader = request.headers.get('authorization');
      const urlSecret = request.nextUrl.searchParams.get('secret');
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` || urlSecret === expectedSecret;

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET' },
          { status: 401 }
        );
      }
    }

    const getSafeSupabase = () => {
      try {
        const admin = createAdminClient();
        if (admin) return admin;
        return createClient();
      } catch {
        return null;
      }
    };
    const supabase = getSafeSupabase();

    // 1.5. Kiểm tra Feature Flags từ CSDL (enable_anniversaries & enable_push_notifications)
    if (supabase) {
      try {
        const { data: clanData } = await supabase
          .from('clan_settings')
          .select('feature_flags')
          .limit(1)
          .single();
        if (clanData?.feature_flags) {
          const flags = clanData.feature_flags as Record<string, boolean>;
          if (flags.enable_anniversaries === false || flags.enable_push_notifications === false) {
            return NextResponse.json({
              success: true,
              message: 'Web Push notification is disabled by Clan Admin',
              sent: 0,
              failed: 0,
              anniversariesCount: 0,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to check feature flags in cron:', err);
      }
    }

    // 2. Lấy danh sách thành viên dòng họ
    let members: MemberRecord[] = [];
    if (supabase) {
      try {
        const { data: dbMembers, error } = await supabase.from('members').select('*');
        if (!error && dbMembers && dbMembers.length > 0) {
          members = dbMembers as unknown as MemberRecord[];
        } else {
          members = [];
        }
      } catch {
        members = [];
      }
    } else {
      members = [];
    }

    // 3. Tìm các Cụ có ngày giỗ Hôm nay & Ngày mai (Âm lịch UTC+7)
    const todayAnniversaries = getTodayAnniversaryMembers(members);
    const tomorrowAnniversaries = getTomorrowAnniversaryMembers(members);

    if (todayAnniversaries.length === 0 && tomorrowAnniversaries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No anniversaries today or tomorrow',
        sent: 0,
        failed: 0,
        anniversariesCount: 0,
      });
    }

    // 4. Thiết lập Web Push VAPID nếu có cấu hình
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:giapha@example.com';
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    let canSendPush = false;
    if (vapidPublicKey && vapidPrivateKey) {
      try {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        canSendPush = true;
      } catch (vapidErr) {
        console.warn('VAPID setup warning:', vapidErr);
      }
    }

    // 5. Lấy danh sách push_subscriptions từ CSDL
    let subscriptions: Array<{
      id: string;
      user_id: string;
      endpoint: string;
      p256dh_key: string;
      auth_key: string;
    }> = [];

    const userMemberMap = new Map<string, string>();

    if (supabase) {
      try {
        const { data: subData } = await supabase.from('push_subscriptions').select('*');
        if (subData) {
          subscriptions = subData;
        }
      } catch {
        // Fallback
      }

      // Lấy mapping user_id -> linked_member_id
      try {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, linked_member_id');
        if (usersData) {
          usersData.forEach((u: { id: string; linked_member_id: string | null }) => {
            if (u.linked_member_id) userMemberMap.set(u.id, u.linked_member_id);
          });
        }
      } catch {
        // Fallback
      }
    }

    // 6. Precompute: Members Map & Spouse Map cho Kinship Engine và Extended Family
    const membersMap = new Map<string, Member>();
    members.forEach((m) => membersMap.set(m.id, m as unknown as Member));

    const spouseMap = new Map<string, string[]>();
    if (supabase) {
      try {
        const { data: spouseData } = await supabase.from('spouse_relations').select('member1_id, member2_id');
        if (spouseData) {
          for (const r of spouseData) {
            if (!spouseMap.has(r.member1_id)) spouseMap.set(r.member1_id, []);
            if (!spouseMap.has(r.member2_id)) spouseMap.set(r.member2_id, []);
            spouseMap.get(r.member1_id)!.push(r.member2_id);
            spouseMap.get(r.member2_id)!.push(r.member1_id);
          }
        }
      } catch {
        // Fallback
      }
    }

    const maxGen = members.reduce(
      (max, m) =>
        Math.max(
          max,
          m.generation_level || (m as any).generation_number || (m as any).generation || 1
        ),
      1
    );

    // Helper tính danh xưng thân tộc cá nhân hóa theo Kinship Engine
    const formatPersonalizedDisplayName = (viewerId: string, deceased: MemberRecord): string => {
      let kinshipTerm: string | null = null;
      const viewer = membersMap.get(viewerId);
      if (viewer && viewer.id !== deceased.id) {
        try {
          const lca = findLowestCommonAncestor(viewer.id, deceased.id, membersMap, spouseMap);
          if (lca.lcaNodeId) {
            const res = resolveKinshipTerms(lca, viewer, deceased as unknown as Member);
            if (res?.termAtoB) {
              kinshipTerm = res.termAtoB;
            }
          }
        } catch {
          // Fallback
        }
      }

      const prefix =
        computeDeceasedHonorificPrefix(deceased, maxGen, kinshipTerm) ||
        (deceased.gender === 'female' ? 'Bà' : 'Cụ');

      if (
        deceased.full_name.startsWith('Cụ ') ||
        deceased.full_name.startsWith('Ông ') ||
        deceased.full_name.startsWith('Bà ') ||
        deceased.full_name.startsWith('Kỵ ')
      ) {
        return deceased.full_name;
      }

      return `${prefix} ${deceased.full_name}`;
    };

    // 7. Thuật toán Recipient-Centric Batching: Gửi riêng theo huyết thống từng con cháu
    let totalSent = 0;
    let totalFailed = 0;
    const deadEndpoints: string[] = [];
    const sendPromises: Promise<void>[] = [];

    for (const sub of subscriptions) {
      const linkedMemberId = userMemberMap.get(sub.user_id);

      // Khách/User chưa liên kết node: Bỏ qua (chưa gửi push để tránh spam)
      if (!linkedMemberId) {
        continue;
      }

      // Lấy toàn bộ người thân trong phạm vi gia đình mở rộng (Tổ tiên trực hệ + Bác/Chú/Cô + Dâu/Rể + Con cháu chắt)
      const familyScope = getExtendedFamilyMemberIds(linkedMemberId, members, spouseMap);

      // Tìm các Cụ giỗ Hôm nay thuộc phạm vi gia đình
      const matchingToday = todayAnniversaries.filter((a) => familyScope.has(a.id));

      // Tìm các Cụ giỗ Ngày mai thuộc phạm vi gia đình
      const matchingTomorrow = tomorrowAnniversaries.filter((a) => familyScope.has(a.id));

      if (matchingToday.length === 0 && matchingTomorrow.length === 0) {
        continue;
      }

      // Gửi thông báo giỗ Hôm nay
      for (const ancestor of matchingToday) {
        const displayName = formatPersonalizedDisplayName(linkedMemberId, ancestor);
        const title = `Hôm nay là Ngày Giỗ ${displayName}`;
        const body = `Tức ngày ${ancestor.death_lunar_day}/${ancestor.death_lunar_month} Âm lịch!`;
        const payload = JSON.stringify({
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `anniversary-today-${ancestor.id}`,
          url: '/anniversaries?scope=my_lineage',
        });

        if (canSendPush) {
          sendPromises.push(
            (async () => {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
                  },
                  payload
                );
                totalSent++;
              } catch (pushErr: any) {
                totalFailed++;
                if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                  deadEndpoints.push(sub.endpoint);
                }
              }
            })()
          );
        } else {
          totalSent++;
        }
      }

      // Gửi thông báo giỗ Ngày mai
      for (const ancestor of matchingTomorrow) {
        const displayName = formatPersonalizedDisplayName(linkedMemberId, ancestor);
        const title = `Ngày mai có Ngày Giỗ ${displayName}`;
        const body = `Tức ngày ${ancestor.death_lunar_day}/${ancestor.death_lunar_month} Âm lịch.`;
        const payload = JSON.stringify({
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `anniversary-tomorrow-${ancestor.id}`,
          url: '/anniversaries?scope=my_lineage',
        });

        if (canSendPush) {
          sendPromises.push(
            (async () => {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
                  },
                  payload
                );
                totalSent++;
              } catch (pushErr: any) {
                totalFailed++;
                if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                  deadEndpoints.push(sub.endpoint);
                }
              }
            })()
          );
        } else {
          totalSent++;
        }
      }
    }

    if (sendPromises.length > 0) {
      await Promise.allSettled(sendPromises);
    }

    // 8. Tự động xóa subscription hỏng
    if (deadEndpoints.length > 0 && supabase) {
      try {
        await supabase
          .from('push_subscriptions')
          .delete()
          .in('endpoint', deadEndpoints);
      } catch (delErr) {
        console.warn('Failed to clean up dead endpoints:', delErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron anniversary job completed',
      targetCount: todayAnniversaries.length + tomorrowAnniversaries.length,
      todayCount: todayAnniversaries.length,
      tomorrowCount: tomorrowAnniversaries.length,
      todayAnniversaries: todayAnniversaries.map((m) => ({
        id: m.id,
        name: m.full_name,
        lunar_day: m.death_lunar_day,
        lunar_month: m.death_lunar_month,
      })),
      tomorrowAnniversaries: tomorrowAnniversaries.map((m) => ({
        id: m.id,
        name: m.full_name,
        lunar_day: m.death_lunar_day,
        lunar_month: m.death_lunar_month,
      })),
      subscriptionsTargeted: subscriptions.length,
      sent: totalSent,
      failed: totalFailed,
      deadCleaned: deadEndpoints.length,
    });
  } catch (error: any) {
    console.error('Error in /api/cron/anniversary-reminder:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error in cron job', stack: error?.stack },
      { status: 500 }
    );
  }
}

