import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar/Navbar';
import AppFooter from '@/components/layout/AppFooter';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import TopProgressBar from '@/components/navigation/TopProgressBar';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import RoleImpersonationBanner from '@/components/admin/RoleImpersonationBanner';
import { createClient } from '@/lib/supabase/server';
import {
  resolveFeatureFlags,
  resolveEffectiveRole,
  resolveThemeConfig,
  resolveEffectiveThemeProfile,
  type ImpersonatedRole,
} from '@/lib/admin/admin-engine';
import { cookies } from 'next/headers';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Gia Phả Phạm Văn',
    template: '%s | Gia Phả Phạm Văn',
  },
  description:
    'Nền tảng số hóa gia phả dòng họ Phạm Văn, phân định vai vế xưng hô, tra cứu ngày giỗ âm lịch và kết nối con cháu.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gia Phả Phạm Văn',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const cookieStore = cookies();

  let isGuest = true;
  let enablePublicTree = true;
  let featureFlags = resolveFeatureFlags(undefined);
  let themeConfig = resolveThemeConfig(undefined);
  let isSuperAdmin = false;
  let currentUserId: string | undefined = undefined;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id;

    const devUser = cookieStore.get('fat_dev_user')?.value;
    isGuest = !user && !(process.env.NODE_ENV === 'development' && devUser);

    if (user) {
      if (user.id === '00000000-0000-0000-0000-000000000001') {
        isSuperAdmin = true;
      } else {
        const { data: profile } = await supabase
          .from('users')
          .select('user_role')
          .eq('id', user.id)
          .single();
        isSuperAdmin = profile?.user_role === 'super_admin';
      }
    } else if (process.env.NODE_ENV === 'development' && devUser) {
      try {
        const parsed = JSON.parse(devUser);
        if (parsed.user_role === 'super_admin' || parsed.id === '00000000-0000-0000-0000-000000000001') {
          isSuperAdmin = true;
        }
      } catch {
        // ignore
      }
    }

    // Đọc feature flags: Ưu tiên cookie cache để đồng bộ tức thì với admin updates
    const cacheCookie = cookieStore.get('fat_feature_flags_cache')?.value;
    const devFlagsCookie = cookieStore.get('fat_dev_feature_flags')?.value;
    const targetCookie = devFlagsCookie || cacheCookie;

    // Đọc theme config: Ưu tiên cookie cache
    const themeCacheCookie = cookieStore.get('fat_theme_config_cache')?.value;
    const devThemeCookie = cookieStore.get('fat_dev_theme_config')?.value;
    const targetThemeCookie = devThemeCookie || themeCacheCookie;

    if (targetCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(targetCookie));
        featureFlags = resolveFeatureFlags(parsed);
      } catch {
        // ignore
      }
    }

    if (targetThemeCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(targetThemeCookie));
        themeConfig = resolveThemeConfig(parsed);
      } catch {
        // ignore
      }
    }

    if (!targetCookie || !targetThemeCookie) {
      const { data: clanData } = await supabase
        .from('clan_settings')
        .select('feature_flags, theme_config')
        .limit(1)
        .single();

      if (!targetCookie && clanData?.feature_flags) {
        featureFlags = resolveFeatureFlags(clanData.feature_flags);
      }
      if (!targetThemeCookie && clanData?.theme_config) {
        themeConfig = resolveThemeConfig(clanData.theme_config);
      }
    }

    enablePublicTree = featureFlags.enable_public_tree;
  } catch {
    // fallback defaults
  }

  // Xử lý Chế độ Đóng Vai (Role Impersonation)
  const impersonatedRole = cookieStore.get('fat_impersonated_role')?.value as ImpersonatedRole;
  const realRole = isSuperAdmin ? 'super_admin' : (isGuest ? undefined : 'viewer');
  const effectiveRole = resolveEffectiveRole(realRole, impersonatedRole);

  const effectiveIsGuest = isGuest || effectiveRole === 'guest';
  const effectiveIsSuperAdmin = isSuperAdmin && effectiveRole === 'super_admin';

  // Xác định Theme Profile hiệu lực
  const effectiveThemeProfile = resolveEffectiveThemeProfile(themeConfig, {
    id: currentUserId,
    role: effectiveRole as any,
    isSuperAdmin: effectiveIsSuperAdmin,
  });

  return (
    <html lang="vi" data-theme-profile={effectiveThemeProfile} className={`h-full ${beVietnamPro.variable}`} suppressHydrationWarning>
      <head>
        {/* Script khởi tạo Theme an toàn chống FOUC: Mặc định Light, chỉ Dark khi đã lưu */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Script đón bắt sớm sự kiện beforeinstallprompt chống Race Condition khi React Hydration [RG31] */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  window.addEventListener('beforeinstallprompt', function(e) {
                    e.preventDefault();
                    window.__fat_deferred_prompt = e;
                    if (typeof window.__fat_pwa_on_prompt === 'function') {
                      window.__fat_pwa_on_prompt(e);
                    }
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 dark:selection:bg-emerald-950/80 dark:selection:text-emerald-200">
        <TopProgressBar />
        <ServiceWorkerRegister />
        <RoleImpersonationBanner />
        <Navbar
          isGuest={effectiveIsGuest}
          enablePublicTree={enablePublicTree}
          featureFlags={featureFlags}
          isSuperAdmin={effectiveIsSuperAdmin}
          impersonatedRole={impersonatedRole}
        />
        <main className="flex-1 flex flex-col min-h-0 relative pb-16 md:pb-0">{children}</main>
        <AppFooter />
        <MobileBottomNav
          isGuest={effectiveIsGuest}
          enablePublicTree={enablePublicTree}
          featureFlags={featureFlags}
          isSuperAdmin={effectiveIsSuperAdmin}
        />
      </body>
    </html>
  );
}
