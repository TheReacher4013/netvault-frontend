/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Keep existing fonts
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      colors: {
        // ── CSS-var bridge — use via Tailwind ──────────────────────
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

        // ── VisionCraft dark palette (static, for JIT) ─────────────
        // Base dark
        'vc-bg': '#12100C',
        'vc-bg2': '#1A1710',
        'vc-surface': '#221F14',

        // Gold accents (per role)
        'gold': '#C9A84C',   // superAdmin
        'gold-2': '#E2C06A',
        'amber': '#D4872A',   // admin
        'amber-2': '#F0A84A',
        'bronze': '#A07840',   // staff
        'bronze-2': '#C09860',
        'ochre': '#B89A30',   // client
        'ochre-2': '#D4B84A',

        // Warm text
        'vc-text': '#F0EAD6',
        'vc-muted': '#8A7E62',

        // ── Light palette ──────────────────────────────────────────
        'cream': '#FAF7F0',

        // ── Semantic (CSS-var driven) ──────────────────────────────
        success: 'var(--nv-success)',
        warning: 'var(--nv-warning)',
        danger: 'var(--nv-danger)',
        info: 'var(--nv-info)',
      },

      backgroundImage: {
        // Gold gradient — used on hero headlines, CTA buttons
        'gold-gradient': 'linear-gradient(135deg, #C9A84C, #E2C06A)',
        'amber-gradient': 'linear-gradient(135deg, #D4872A, #F0A84A)',
        'bronze-gradient': 'linear-gradient(135deg, #A07840, #C09860)',
        'ochre-gradient': 'linear-gradient(135deg, #B89A30, #D4B84A)',
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
          '0%,100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.35)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(201,168,76,0.15)' },
        },
      },

      boxShadow: {
        'gold-glow': '0 0 30px rgba(201,168,76,0.25)',
        'gold-sm': '0 0 12px rgba(201,168,76,0.18)',
        'card-dark': '0 4px 28px rgba(0,0,0,0.45)',
        'card-light': '0 2px 12px rgba(26,21,8,0.08)',
      },

      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}