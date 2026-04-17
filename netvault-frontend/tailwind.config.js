/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Super Admin theme — Verified Black + Bancha Green
        sa: {
          bg:      '#0D0F0D',
          bg2:     '#141614',
          surface: '#1A1C1A',
          border:  '#2A3A2A',
          accent:  '#62B849',
          accent2: '#82D860',
          text:    '#E8F0E5',
          muted:   '#8A9E87',
        },
        // Admin theme — Kuro Green + Evening Green
        admin: {
          bg:      '#0B1209',
          bg2:     '#111A0F',
          surface: '#172014',
          border:  '#243320',
          accent:  '#797B2D',
          accent2: '#9BA040',
          text:    '#EAF0E2',
          muted:   '#7A9070',
        },
        // Staff theme — English Holly + Windy Pine
        staff: {
          bg:      '#0E1018',
          bg2:     '#141720',
          surface: '#1A1F2E',
          border:  '#252D40',
          accent:  '#4A8FA8',
          accent2: '#6AB8D0',
          text:    '#E2EAF0',
          muted:   '#7090A8',
        },
        // Client theme — Deep Slate Olive + Summer Moss
        client: {
          bg:      '#0E1208',
          bg2:     '#141A0C',
          surface: '#1C2410',
          border:  '#2C3818',
          accent:  '#BBAE64',
          accent2: '#D4C870',
          text:    '#F0EEE0',
          muted:   '#9A9870',
        },
        // Shared semantic colors
        success: '#62B849',
        warning: '#F0A045',
        danger:  '#C94040',
        info:    '#4A8FA8',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease both',
        'fade-in':    'fadeIn 0.3s ease both',
        'slide-in':   'slideIn 0.3s cubic-bezier(0.4,0,0.2,1) both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(98,184,73,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(98,184,73,0)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
