import type { Config } from 'tailwindcss';

/**
 * Studio glass.
 *
 * Every colour is a channel triplet in globals.css (`--c-ink: 9 11 15`), so the
 * alpha modifiers the components use (`bg-signal/80`, `text-muted/70`,
 * `border-pulse/40`) all resolve without a second set of tokens.
 */
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Studio glass. Note `border-line` is deliberately absent from the
        // colour map: the hairline rule lives in globals.css, otherwise an
        // opaque `border` would win over it on specificity.
        ink: token('ink'),
        glass: token('glass'),
        chalk: token('chalk'),
        signal: token('signal'),
        pulse: token('pulse'),
        wave: token('wave'),
        muted: token('muted'),

        // Dividers, inactive traces, the "off" dot. bg-line resolves to this.
        line: {
          DEFAULT: 'rgb(var(--c-line) / 0.18)',
          faint: 'rgb(var(--c-line) / 0.08)',
        },

        // Old palette. Kept only until the remaining pages (room, lobby, the
        // modal set) are moved onto studio glass — nothing new should use it.
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
      },
      fontFamily: {
        // Geist variables come from the `geist` package in app/layout.tsx;
        // Instrument Serif is loaded by @fontsource in the same file.
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        panel: '2px',
        control: '2px',
      },
      boxShadow: {
        // Raised glass: a hairline lift, not a floating card.
        float: '0 1px 0 0 rgb(var(--c-line)), 0 24px 48px -24px rgb(0 0 0 / 0.55)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        rise: 'rise 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'soft-pulse': 'soft-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
