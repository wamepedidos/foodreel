import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0B0C',
        surface: '#151516',
        card: '#1C1C1E',
        accent: '#FF6500',
        muted: '#A7A7AB'
      },
      boxShadow: {
        glow: '0 18px 50px rgba(255, 101, 0, 0.24)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif']
      }
    }
  },
  plugins: []
} satisfies Config;
