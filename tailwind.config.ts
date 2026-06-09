import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        base: '#0f0d0b',
        surface: '#1a1714',
        'surface-hover': '#201d19',
        accent: '#f59e0b',
        'accent-hover': '#f97316',
        'text-primary': '#fafaf9',
        'text-secondary': '#a8a29e',
        'text-muted': '#57534e',
        success: '#4ade80',
        border: 'rgba(245,158,11,0.10)',
        'border-active': 'rgba(245,158,11,0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(245,158,11,0.08), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':
          '0 0 0 1px rgba(245,158,11,0.25), 0 8px 32px rgba(0,0,0,0.5)',
      },
      animation: {
        sonar: 'sonar 2.4s ease-out infinite',
      },
      keyframes: {
        sonar: {
          '0%': { transform: 'scale(0.6)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
