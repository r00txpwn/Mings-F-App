/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Unbounded"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        ming: {
          red: '#E11D48',
          'red-600': '#E11D48',
          'red-700': '#BE123C',
          'red-800': '#9F1239',
          'red-900': '#4C0519',
          flame: '#F97316',
          gold: '#FBBF24',
          ink: '#0B0B0D',
          charcoal: '#17161A',
          graphite: '#24222A',
          smoke: '#3A3844',
          bone: '#F5F5F4',
          ash: '#A8A6B0',
          mute: '#6B6870',
        },
        kiosk: {
          bg: '#1f1f1f',
          card: '#2c2c2c',
          primary: '#d65745',
          teal: '#37bc9d',
          white: '#eeeeee',
          smoke: '#676767',
          border: '#595959',
        },
        cockpit: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        surface: {
          DEFAULT: '#0f172a',
          elevated: '#1e293b',
          border: '#334155',
        },
        neon: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      boxShadow: {
        cockpit: '0 0 0 1px rgba(251, 191, 36, 0.18), 0 4px 24px -4px rgba(0, 0, 0, 0.45)',
        'cockpit-glow': '0 0 40px -8px rgba(251, 191, 36, 0.28)',
        neon: '0 0 0 1px rgba(139, 92, 246, 0.2), 0 16px 50px -20px rgba(91, 33, 182, 0.65)',
        'neon-soft': '0 10px 30px -16px rgba(139, 92, 246, 0.45)',
        ming: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 45px -28px rgba(225, 29, 72, 0.55)',
        'ming-glow': '0 0 0 1px rgba(225, 29, 72, 0.35), 0 18px 60px -20px rgba(225, 29, 72, 0.6)',
      },
      backgroundImage: {
        'grid-cockpit':
          'linear-gradient(to right, rgba(251, 191, 36, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(251, 191, 36, 0.08) 1px, transparent 1px)',
        'radial-cockpit': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(251, 191, 36, 0.16), transparent)',
        'radial-neon':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.22), transparent)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
