import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: 'var(--radius-sm, 0.125rem)',
      DEFAULT: 'var(--radius-md, 0.25rem)',
      md: 'var(--radius-md, 0.375rem)',
      lg: 'var(--radius-lg, 0.5rem)',
      xl: 'var(--radius-xl, 0.75rem)',
      '2xl': 'var(--radius-2xl, 1rem)',
      '3xl': 'var(--radius-3xl, 1.5rem)',
      card: 'var(--radius-card, 1rem)',
      control: 'var(--radius-control, 0.5rem)',
      full: '9999px',
    },
    extend: {
      colors: {
        jade: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
        },
        clan: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
      },
      fontFamily: {
        sans: ['var(--font-be-vietnam-pro)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
