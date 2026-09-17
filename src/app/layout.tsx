import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar/Navbar';
import AppFooter from '@/components/layout/AppFooter';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { createClient } from '@/lib/supabase/server';
import { resolveFeatureFlags } from '@/lib/admin/admin-engine';
import { cookies } from 'next/headers';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gia Phả Dòng Họ - Hệ Thống Quản Lý Phả Hệ Trực Tuyến',
  description:
    'Nền tảng số hóa gia phả dòng họ, phân định vai vế xưng hô, tra cứu ngày giỗ âm lịch và kết nối con cháu.',
  manifest: '/manifest.json',
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
  let isSuperAdmin = false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    if (targetCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(targetCookie));
        featureFlags = resolveFeatureFlags(parsed);
      } catch {
        // ignore
      }
    } else {
      const { data: clanData } = await supabase
        .from('clan_settings')
        .select('feature_flags')
        .limit(1)
        .single();

      if (clanData?.feature_flags) {
        featureFlags = resolveFeatureFlags(clanData.feature_flags);
      }
    }

    enablePublicTree = featureFlags.enable_public_tree;
  } catch {
    // fallback defaults
  }

  return (
    <html lang="vi" className={`h-full ${beVietnamPro.variable}`} suppressHydrationWarning>
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
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <Navbar
          isGuest={isGuest}
          enablePublicTree={enablePublicTree}
          featureFlags={featureFlags}
          isSuperAdmin={isSuperAdmin}
        />
        <main className="flex-1 flex flex-col min-h-0 relative pb-16 md:pb-0">{children}</main>
        <AppFooter />
        <MobileBottomNav
          isGuest={isGuest}
          enablePublicTree={enablePublicTree}
          featureFlags={featureFlags}
          isSuperAdmin={isSuperAdmin}
        />
      </body>
    </html>
  );
}
