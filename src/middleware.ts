import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { evaluateAuthGate } from '@/lib/auth/auth-gate';
import { resolveFeatureFlags, DEFAULT_FEATURE_FLAGS } from '@/lib/admin/admin-engine';
import type { ClanFeatureFlags } from '@/types/database';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Cập nhật session và lấy trạng thái người dùng
  const { response, user, supabase } = await updateSession(request);

  // 2. Bypass check nhanh: Tuyến đường admin, api, auth, login-gate không qua gate
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login-gate')
  ) {
    return response;
  }

  // 3. Đọc feature flags (Cookie-First Strategy để triệt tiêu độ trễ mạng)
  let featureFlags: ClanFeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
  const cacheCookie = request.cookies.get('fat_feature_flags_cache')?.value;
  const devFlagsCookie = request.cookies.get('fat_dev_feature_flags')?.value;

  const targetCookie = devFlagsCookie || cacheCookie;
  if (targetCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(targetCookie));
      featureFlags = resolveFeatureFlags(parsed);
    } catch {
      featureFlags = resolveFeatureFlags(undefined);
    }
  } else if (supabase) {
    // Cookie cache miss: Truy vấn DB 1 lần duy nhất và ghi cookie TTL 5 phút (300s)
    try {
      const { data } = await supabase
        .from('clan_settings')
        .select('feature_flags')
        .limit(1)
        .single();
      featureFlags = resolveFeatureFlags(data?.feature_flags);
      response.cookies.set('fat_feature_flags_cache', JSON.stringify(featureFlags), {
        path: '/',
        maxAge: 300,
        sameSite: 'lax',
      });
    } catch {
      featureFlags = resolveFeatureFlags(undefined);
    }
  }

  // 4. Đánh giá quyết định phân luồng qua Auth Gate Pure Function
  let isSuperAdmin = false;
  if (user) {
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      isSuperAdmin = true;
    } else {
      isSuperAdmin = user.user_metadata?.user_role === 'super_admin';
    }
  }
  if (!isSuperAdmin) {
    const devUserCookie = request.cookies.get('fat_dev_user')?.value;
    if (devUserCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devUserCookie));
        if (parsed.user_role === 'super_admin' || parsed.id === '00000000-0000-0000-0000-000000000001') {
          isSuperAdmin = true;
        }
      } catch {
        // ignore
      }
    }
  }

  const decision = evaluateAuthGate(pathname, user, featureFlags, isSuperAdmin);

  if (decision.action === 'redirect' && decision.redirectUrl) {
    const redirectUrl = new URL(decision.redirectUrl, request.url);
    return NextResponse.redirect(redirectUrl, {
      status: decision.statusCode ?? 307,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons (public media)
     * - api/kinship (Zero-latency public kinship endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|images|api/kinship|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
