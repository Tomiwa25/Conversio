import type { Config } from 'tailwindcss';

/**
 * Conversio design tokens.
 *
 * The palette is "studio glass": the light of a monitor in a dim room, with
 * webcam-LED lime as the only accent. All colour goes through CSS custom
 * properties (defined in globals.css) so light and dark mode switch without
 * any component knowing which theme is active.
 */
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
        ink: 'var(--c-ink)',
        glass: 'var(--c-glass)',
        chalk: 'var(--c-chalk)',
        signal: {
          DEFAULT: 'var(--c-signal)',
          soft: 'var(--c-signal-soft)',
        },
        pulse: 'var(--c-pulse)',
        wave: 'var(--c-wave)',
        line: {
          DEFAULT: 'var(--c-line)',
          soft: 'var(--c-line-soft)',
        },
        muted: 'var(--c-muted)',
        foreground: 'var(--c-chalk)',
        background: 'var(--c-ink)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Instrument Serif', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Geist', 'Segoe UI', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.3' }],
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.55' }],
        lg: ['18px', { lineHeight: '1.45' }],
        xl: ['24px', { lineHeight: '1.25' }],
        '2xl': ['32px', { lineHeight: '1.15' }],
        '3xl': ['48px', { lineHeight: '1.05' }],
        '4xl': ['72px', { lineHeight: '0.98', letterSpacing: '-0.022em' }],
      },
      borderRadius: {
        panel: '2px',
        control: '8px',
        pill: '999px',
      },
      boxShadow: {
        float: '0 24px 60px -20px rgba(0, 0, 0, 0.55)',
        lift: '0 2px 0 0 var(--c-line)',
      },
      keyframes: {
        // hero trace draws in once on the landing page
        trace: {
          from: { strokeDashoffset: 'var(--trace-length, 900)' },
          to: { strokeDashoffset: '0' },
        },
        // a horizontal sweep, used as the primary button's hover/focus state
        sweep: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        // chat + drawer entries: 6px rise, opacity in
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // incoming waiting-room card: slides in from the left edge
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // the socket-reconnect sweep across the room header
        reconnect: {
          '0%': { transform: 'translateX(-100%)', opacity: '0.2' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0.2' },
        },
        // quiet dot used for "live" indicators at rest
        softPulse: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        // participant bitmap rendering: placeholder until real video attaches
        scanline: {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(200%)' },
        },
      },
      animation: {
        trace: 'trace 1.4s cubic-bezier(0.2, 0.7, 0.3, 1) forwards',
        sweep: 'sweep 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        rise: 'rise 0.16s ease-out',
        'slide-in-left': 'slideInLeft 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)',
        reconnect: 'reconnect 1.6s ease-in-out infinite',
        'soft-pulse': 'softPulse 2.4s ease-in-out infinite',
        scanline: 'scanline 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
