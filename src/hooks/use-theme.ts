'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook theo dõi và điều khiển theme (Sáng / Tối) đồng bộ toàn ứng dụng
 * Sử dụng MutationObserver để phản ứng tức thì 0ms khi class .dark trên <html> thay đổi
 */
export function useAppTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 1. Khởi tạo theme ban đầu từ class của documentElement
    const checkDark = () =>
      typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    setTheme(checkDark() ? 'dark' : 'light');

    // 2. Theo dõi sự thay đổi class trên <html> qua MutationObserver
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      const observer = new MutationObserver(() => {
        setTheme(checkDark() ? 'dark' : 'light');
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }
  }, []);

  const toggleTheme = useCallback(() => {
    if (typeof document === 'undefined') return;
    const isDark = document.documentElement.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
}

export default useAppTheme;
