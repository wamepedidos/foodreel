import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--color-background-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        card: 'rgb(var(--color-surface-elevated-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        white: 'rgb(var(--color-text-primary-rgb) / <alpha-value>)',
        paper: '#FFFFFF',
        contrast: 'rgb(var(--color-primary-contrast-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        error: 'rgb(var(--color-error-rgb) / <alpha-value>)'
      },
      boxShadow: {
        glow: '0 18px 50px rgb(var(--color-primary-rgb) / 0.24)'
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif']
      }
    }
  },
  plugins: []
} satisfies Config;
