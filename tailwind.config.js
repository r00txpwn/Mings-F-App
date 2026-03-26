/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cockpit: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
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
        cockpit: '0 0 0 1px rgba(20, 184, 166, 0.15), 0 4px 24px -4px rgba(0, 0, 0, 0.45)',
        'cockpit-glow': '0 0 40px -8px rgba(45, 212, 191, 0.25)',
        neon: '0 0 0 1px rgba(139, 92, 246, 0.2), 0 16px 50px -20px rgba(91, 33, 182, 0.65)',
        'neon-soft': '0 10px 30px -16px rgba(139, 92, 246, 0.45)',
      },
      backgroundImage: {
        'grid-cockpit':
          'linear-gradient(to right, rgba(45, 212, 191, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(45, 212, 191, 0.06) 1px, transparent 1px)',
        'radial-cockpit': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.15), transparent)',
        'radial-neon':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.22), transparent)',
      },
    },
  },
  plugins: [],
};
