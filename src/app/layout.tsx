import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar/Navbar';

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
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="antialiased min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FAT - Quản Lý Gia Phả Dòng Họ. Nền tảng phả hệ số hiện đại.</p>
        </footer>
      </body>
    </html>
  );
}
