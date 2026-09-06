import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SAMPLE_MEMBERS_28 } from '@/lib/tree-layout/sample-data';
import { MemberRecord } from '@/types/tree';
import { getTodayAnniversaryMembers } from '@/lib/anniversaries/anniversary-engine';

export const dynamic = 'force-dynamic';

/**
 * Thuật toán tìm toàn bộ ID con cháu trực hệ nhiều đời của một người
 */
function getDescendantMemberIds(targetId: string, members: MemberRecord[]): Set<string> {
  const descendants = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const m of members) {
      if ((m.father_id === current || m.mother_id === current) && !descendants.has(m.id)) {
        descendants.add(m.id);
        queue.push(m.id);
      }
    }
  }

  return descendants;
}

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

    // 2. Lấy danh sách thành viên dòng họ
    let members: MemberRecord[] = [];
    if (supabase) {
      try {
        const { data: dbMembers, error } = await supabase.from('members').select('*');
        if (!error && dbMembers && dbMembers.length > 0) {
          members = dbMembers as unknown as MemberRecord[];
        } else {
          members = SAMPLE_MEMBERS_28;
        }
      } catch {
        members = SAMPLE_MEMBERS_28;
      }
    } else {
      members = SAMPLE_MEMBERS_28;
    }

    // 3. Tìm các Cụ có ngày giỗ đúng hôm nay (Âm lịch UTC+7)
    const todayAnniversaries = getTodayAnniversaryMembers(members);

    if (todayAnniversaries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No anniversaries today',
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
        // Mock subscriptions list if DB not ready
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

    let totalSent = 0;
    let totalFailed = 0;
    const deadEndpoints: string[] = [];

    for (const ancestor of todayAnniversaries) {
      const descendantIds = getDescendantMemberIds(ancestor.id, members);

      // Lọc subscriptions của con cháu trực hệ (hoặc toàn bộ nếu chưa gán cụ thể)
      const targetSubs = subscriptions.filter((sub) => {
        const linkedMemberId = userMemberMap.get(sub.user_id);
        if (!linkedMemberId) return true; // Gửi cho thành viên chung của dòng họ
        return descendantIds.has(linkedMemberId);
      });

      const payload = JSON.stringify({
        title: `Hôm nay là Ngày Giỗ của Cụ ${ancestor.full_name}`,
        body: `Tức ngày ${ancestor.death_lunar_day}/${ancestor.death_lunar_month} Âm lịch. Kính mời con cháu tưởng nhớ tiền nhân.`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        url: '/anniversaries',
      });

      if (canSendPush && targetSubs.length > 0) {
        const sendPromises = targetSubs.map(async (sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          };
          try {
            await webpush.sendNotification(pushSubscription, payload);
            totalSent++;
          } catch (pushErr: any) {
            totalFailed++;
            // Dọn dẹp endpoint chết (404 Not Found hoặc 410 Gone)
            if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
              deadEndpoints.push(sub.endpoint);
            }
          }
        });

        await Promise.allSettled(sendPromises);
      } else {
        // Trong môi trường dev / mock không có VAPID keys thật
        totalSent += targetSubs.length;
      }
    }

    // 6. Tự động xóa subscription hỏng
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
      targetCount: todayAnniversaries.length,
      anniversaries: todayAnniversaries.map((m) => ({
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
  } catch (error) {
    console.error('Error in /api/cron/anniversary-reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error in cron job' },
      { status: 500 }
    );
  }
}
