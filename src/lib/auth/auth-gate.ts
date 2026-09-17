import type { User } from '@supabase/supabase-js';
import type { ClanFeatureFlags } from '@/types/database';

export interface AuthGateDecision {
  action: 'pass' | 'redirect';
  redirectUrl?: string;
  statusCode?: number;
}

/**
 * Thuần logic phân quyền truy cập cho Middleware & Auth Gate
 * Pure Function - Đảm bảo tính tất định và dễ dàng kiểm thử tự động
 */
export function evaluateAuthGate(
  pathname: string,
  user: User | null,
  featureFlags: ClanFeatureFlags,
  isSuperAdmin: boolean = false
): AuthGateDecision {
  // 1. Bypass routes: Các tuyến đường hệ thống, quản trị, API và tài nguyên tĩnh
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login-gate') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  ) {
    return { action: 'pass' };
  }

  // 2. Super Admin toàn quyền truy cập để quản trị và hiệu chỉnh từ điển
  if (isSuperAdmin) {
    return { action: 'pass' };
  }

  // 3. Feature Flags Route Enforcement (Chặn truy cập trực tiếp các route bị tắt đối với non-admin)
  if (
    (pathname === '/kinship' || pathname.startsWith('/kinship/')) &&
    !featureFlags.enable_kinship_lookup
  ) {
    return {
      action: 'redirect',
      redirectUrl: '/',
      statusCode: 307,
    };
  }

  if (
    (pathname === '/anniversaries' || pathname.startsWith('/anniversaries/')) &&
    !featureFlags.enable_anniversaries
  ) {
    return {
      action: 'redirect',
      redirectUrl: '/',
      statusCode: 307,
    };
  }

  // 4. Người dùng đã đăng nhập (mọi role thường) -> Toàn quyền truy cập
  if (user) {
    return { action: 'pass' };
  }

  // 5. Khách (Guest - chưa đăng nhập) khi cây ở chế độ Riêng tư (enable_public_tree = false)
  if (!featureFlags.enable_public_tree) {
    return {
      action: 'redirect',
      redirectUrl: `/login-gate?returnTo=${encodeURIComponent(pathname)}`,
      statusCode: 307,
    };
  }

  // 6. Khách khi cây ở chế độ Công khai (enable_public_tree = true)
  // CHỈ cho phép xem Trang Chủ (/) và Cây Phả Hệ (/tree)
  if (pathname === '/' || pathname.startsWith('/tree')) {
    return { action: 'pass' };
  }

  // 7. Mọi tuyến đường khác (/anniversaries, /kinship, v.v.) đối với khách đều yêu cầu đăng nhập
  return {
    action: 'redirect',
    redirectUrl: `/login-gate?returnTo=${encodeURIComponent(pathname)}`,
    statusCode: 307,
  };
}
