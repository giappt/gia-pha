import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar/Navbar';
import AppFooter from '@/components/layout/AppFooter';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`h-full ${beVietnamPro.variable}`} suppressHydrationWarning>
      <head>
        {/* Script khởi tạo Theme an toàn chống FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
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
        <Navbar />
        <main className="flex-1 flex flex-col min-h-0 relative">{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
