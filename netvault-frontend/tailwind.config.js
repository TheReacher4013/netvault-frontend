/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
       
        display: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
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
        'dv-bg': '#0B0D17',
        'dv-bg2': '#0F1120',
        'dv-surface': '#141624',

        // DomainVault accent palette — purple-indigo spectrum
        'indigo': '#5C57F2',
        'indigo-2': '#7663F2',
        'violet': '#7663F2',
        'violet-2': '#D96AC6',
        'purple': '#914BBF',
        'purple-2': '#9D62D9',
        'blue': '#3B82F6',
        'blue-2': '#60A5FA',
        'cyan': '#06B6D4',
        'cyan-2': '#22D3EE',

        // Text
        'dv-text': '#ECEFFE',
        'dv-muted': '#6B7280',

        // Light palette
        'dv-light': '#F5F4FF',

        // Semantic
        success: 'var(--nv-success)',
        warning: 'var(--nv-warning)',
        danger: 'var(--nv-danger)',
        info: 'var(--nv-info)',
      },

      backgroundImage: {
        'indigo-gradient': 'linear-gradient(135deg, #5C57F2, #7663F2)',
        'violet-gradient': 'linear-gradient(135deg, #7663F2, #D96AC6)',
        'purple-gradient': 'linear-gradient(135deg, #914BBF, #9D62D9)',
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
        'gradient-shift': 'gradientShift 4s ease infinite',
      },

      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(118,99,242,0.35)' },
          '50%': { boxShadow: '0 0 24px 6px rgba(118,99,242,0.15)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },

      boxShadow: {
        'purple-glow': '0 0 30px rgba(118,99,242,0.28)',
        'purple-sm': '0 0 14px rgba(118,99,242,0.20)',
        'card-dark': '0 4px 32px rgba(0,0,0,0.50)',
        'card-light': '0 2px 12px rgba(13,11,36,0.08)',
      },

      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}