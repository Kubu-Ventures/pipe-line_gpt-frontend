import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#050D1A',
        surface: '#0A1628',
        'surface-elevated': '#0F1E38',
        border: '#1C2E4A',
        'border-strong': '#2A4270',
        primary: {
          DEFAULT: '#1D6FD9',
          hover: '#1A5FC4',
          glow: 'rgba(29,111,217,0.15)',
        },
        accent: '#4AA8FF',
        'text-primary': '#E8EDF4',
        'text-secondary': '#8B9BB4',
        'text-muted': '#4A5A72',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        'danger-surface': 'rgba(220,38,38,0.10)',
        'warning-surface': 'rgba(217,119,6,0.10)',
        'success-surface': 'rgba(22,163,74,0.10)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blink: 'blink 1s step-end infinite',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}

export default config
