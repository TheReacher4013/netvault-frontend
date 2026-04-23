/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      colors: {
        nv: {
          bg: 'var(--nv-bg)',
          bg2: 'var(--nv-bg2)',
          surface: 'var(--nv-surface)',
          border: 'var(--nv-border)',
          accent: 'var(--nv-accent)',
          accent2: 'var(--nv-accent2)',
          text: 'var(--nv-text)',
          muted: 'var(--nv-muted)',
        },

        // DomainVault dark palette (static, for JIT)
        'dv-bg': '#0A0B0F',
        'dv-bg2': '#0F1117',
        'dv-surface': '#161A24',

        // Accent palette
        'indigo': '#6366F1',
        'indigo-2': '#818CF8',
        'violet': '#8B5CF6',
        'violet-2': '#A78BFA',
        'blue': '#3B82F6',
        'blue-2': '#60A5FA',
        'cyan': '#06B6D4',
        'cyan-2': '#22D3EE',

        // Text
        'dv-text': '#E8EDFF',
        'dv-muted': '#6B7385',

        // Light palette
        'dv-light': '#F4F6FF',

        // Semantic
        success: 'var(--nv-success)',
        warning: 'var(--nv-warning)',
        danger: 'var(--nv-danger)',
        info: 'var(--nv-info)',
      },

      backgroundImage: {
        'indigo-gradient': 'linear-gradient(135deg, #6366F1, #818CF8)',
        'violet-gradient': 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
        'blue-gradient': 'linear-gradient(135deg, #3B82F6, #60A5FA)',
        'cyan-gradient': 'linear-gradient(135deg, #06B6D4, #22D3EE)',
      },

      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-up': 'fadeUp 0.35s ease both',
        'fade-in': 'fadeIn 0.25s ease both',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4,0,0.2,1) both',
        'scale-in': 'scaleIn 0.2s ease both',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
      },

      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.35)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(99,102,241,0.15)' },
        },
      },

      boxShadow: {
        'indigo-glow': '0 0 30px rgba(99,102,241,0.25)',
        'indigo-sm': '0 0 12px rgba(99,102,241,0.18)',
        'card-dark': '0 4px 28px rgba(0,0,0,0.45)',
        'card-light': '0 2px 12px rgba(13,16,51,0.08)',
      },

      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}