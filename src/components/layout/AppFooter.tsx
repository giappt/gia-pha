'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const AppFooter: React.FC = () => {
  const pathname = usePathname();

  // Trang Cây phả hệ là canvas đồ họa tương tác toàn màn hình, không hiển thị footer chung
  if (pathname === '/tree') {
    return null;
  }

  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm">
      <p>© {new Date().getFullYear()} FAT - Quản Lý Gia Phả Dòng Họ. Nền tảng phả hệ số hiện đại.</p>
    </footer>
  );
};

export default AppFooter;
