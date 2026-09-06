'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppTheme } from '@/hooks/use-theme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 shadow-sm"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
