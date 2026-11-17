// BEST design tokens -> Tailwind.
// Single source of truth for the token values documented in design-system/MASTER.md
// (plan Sec. 3.1 semantic colors, Sec. 2.3 8-point rhythm, Sec. 3.3 motion, Sec. 14.3 glass).

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/lib/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base surfaces (Sec. 2.2 / 3.1): obsidian slate, never pure black.
        obsidian: {
          DEFAULT: '#0a0f1d',
          800: '#0f172a',
          700: '#131c31',
        },
        // Semantic state matrix (Sec. 3.1). Each state ships fg / surface / border / glow.
        success: {
          DEFAULT: '#34d399',
          fg: '#34d399',
          surface: 'rgba(16, 185, 129, 0.10)',
          border: 'rgba(16, 185, 129, 0.30)',
          glow: '0 0 15px rgba(16, 185, 129, 0.15)',
        },
        warning: {
          DEFAULT: '#fcd34d',
          fg: '#fcd34d',
          surface: 'rgba(245, 158, 11, 0.10)',
          border: 'rgba(245, 158, 11, 0.30)',
          glow: '0 0 15px rgba(245, 158, 11, 0.15)',
          text: '#fbbf24',
        },
        danger: {
          DEFAULT: '#fb7185',
          fg: '#fb7185',
          surface: 'rgba(244, 63, 94, 0.10)',
          border: 'rgba(244, 63, 94, 0.30)',
          glow: '0 0 15px rgba(244, 63, 94, 0.15)',
        },
        info: {
          DEFAULT: '#22d3ee',
          fg: '#22d3ee',
          surface: 'rgba(6, 182, 212, 0.10)',
          border: 'rgba(6, 182, 212, 0.30)',
          glow: '0 0 15px rgba(6, 182, 212, 0.15)',
        },
        official: {
          DEFAULT: '#fde68a',
          fg: '#fde68a',
          surface: 'rgba(234, 179, 8, 0.10)',
          border: 'rgba(234, 179, 8, 0.30)',
          glow: '0 0 15px rgba(234, 179, 8, 0.15)',
        },
        neutralglass: {
          fg: '#cbd5e1',
          surface: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.10)',
        },
        // Glass surfaces (Sec. 14.3). Lite fill is opaque-ish; full tier adds blur in CSS.
        glass: {
          DEFAULT: 'rgba(15, 23, 42, 0.82)',
          full: 'rgba(15, 23, 42, 0.55)',
          border: 'rgba(255, 255, 255, 0.10)',
          highlight: 'rgba(255, 255, 255, 0.06)',
        },
        ambient: {
          cyan: 'rgba(34, 211, 238, 0.35)',
          teal: 'rgba(20, 184, 166, 0.30)',
          amber: 'rgba(251, 191, 36, 0.22)',
        },
      },
      fontFamily: {
        sans: [
          '"Public Sans"',
          '"Source Sans 3"',
          '"Source Sans Pro"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'sans-serif',
        ],
        display: [
          '"Poppins"',
          '"Public Sans"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        body: [
          '"Source Sans 3"',
          '"Source Sans Pro"',
          '"Public Sans"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono Variable"',
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      // 8-point spatial rhythm (Sec. 2.3): 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96.
      spacing: {
        'rhythm-1': '4px',
        'rhythm-2': '8px',
        'rhythm-3': '16px',
        'rhythm-4': '24px',
        'rhythm-5': '32px',
        'rhythm-6': '48px',
        'rhythm-7': '64px',
        'rhythm-8': '96px',
        gutter: '24px',
        section: '48px',
        'tap': '44px',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        glass: '20px',
      },
      boxShadow: {
        glass: '0 8px 24px rgba(0, 0, 0, 0.25)',
        'glass-lg': '0 24px 60px rgba(0, 0, 0, 0.35)',
        'glow-info': '0 0 15px rgba(6, 182, 212, 0.15)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-warning': '0 0 15px rgba(245, 158, 11, 0.15)',
        'glow-danger': '0 0 15px rgba(244, 63, 94, 0.15)',
        'glow-official': '0 0 15px rgba(234, 179, 8, 0.15)',
        focus: '0 0 0 2px #0a0f1d, 0 0 0 4px #22d3ee',
        lift: '0 16px 40px rgba(0, 0, 0, 0.4)',
      },
      maxWidth: {
        content: '72rem',
        prose: '68ch',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: '180ms',
        base: '600ms',
        slow: '1200ms',
      },
      letterSpacing: {
        code: '0.06em',
        wide: '0.04em',
      },
      screens: {
        // Budget Android phones are the baseline, not the exception.
        xs: '375px',
      },
    },
  },
  plugins: [],
};
