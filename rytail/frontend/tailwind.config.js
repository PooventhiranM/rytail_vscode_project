/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--ry-primary)',
          hover: 'var(--ry-primary-hover)',
          pressed: 'var(--ry-primary-pressed)',
        },
        accent: 'var(--ry-accent)',
        sage: {
          DEFAULT: 'var(--ry-sage)',
          strong: 'var(--ry-sage-strong)',
        },
        bg: 'var(--ry-bg)',
        card: 'var(--ry-card)',
        border: {
          DEFAULT: 'var(--ry-border)',
          strong: 'var(--ry-border-strong)',
        },
        ink: {
          DEFAULT: 'var(--ry-text)',
          muted: 'var(--ry-text-muted)',
          onPrimary: 'var(--ry-text-on-primary)',
        },
        warning: {
          DEFAULT: 'var(--ry-warning)',
          bg: 'var(--ry-warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--ry-danger)',
          bg: 'var(--ry-danger-bg)',
        },
        info: {
          DEFAULT: 'var(--ry-info)',
          bg: 'var(--ry-info-bg)',
        },
        success: {
          DEFAULT: 'var(--ry-success)',
          bg: 'var(--ry-success-bg)',
        },
        inactive: {
          DEFAULT: 'var(--ry-inactive)',
          bg: 'var(--ry-inactive-bg)',
        },
        ai: {
          DEFAULT: 'var(--ry-ai)',
          bg: 'var(--ry-ai-bg)',
        },
      },
      borderRadius: {
        sm: 'var(--ry-radius-sm)',
        DEFAULT: 'var(--ry-radius)',
        lg: 'var(--ry-radius-lg)',
      },
      boxShadow: {
        sm: 'var(--ry-shadow-sm)',
        DEFAULT: 'var(--ry-shadow)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
