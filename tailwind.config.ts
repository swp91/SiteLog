import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          300: '#93C5FD',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        ink: '#0F172A',
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        green: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        amber: {
          50: '#FFFBEB',
          500: '#F59E0B',
        },
        red: {
          50: '#FEF2F2',
          500: '#EF4444',
        },
        kakao: {
          bg: '#FEE500',
          text: '#191600',
        },
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        DEFAULT: '14px',
        lg: '18px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04)',
        DEFAULT: '0 2px 8px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)',
        md: '0 6px 20px rgba(15,23,42,.08), 0 2px 6px rgba(15,23,42,.04)',
        lg: '0 16px 40px rgba(15,23,42,.12), 0 4px 12px rgba(15,23,42,.06)',
        blue: '0 8px 24px rgba(37,99,235,.28)',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      screens: {
        wide: '880px',
      },
    },
  },
  plugins: [],
}

export default config
