import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

/**
 * NETVAULT COLOR SYSTEM — Aligned with DomainVault reference
 * superAdmin → Indigo  #6366F1 / #818CF8
 * admin      → Violet  #7C3AED / #A78BFA  (DomainVault purple)
 * staff      → Blue    #3B82F6 / #60A5FA
 * client     → Cyan    #06B6D4 / #22D3EE
 *
 * DomainVault reference palette:
 *  bg: #0B0D17 (very deep navy-black)
 *  surface: #12141F
 *  accent: #6C63FF (vivid indigo-purple)
 *  accent2: #9B8AFB (soft lavender)
 *  text: #ECEFFE
 *  muted: #6B7280
 */
const ROLE_ACCENTS = {
    superAdmin: { accent: '#914BBF', accent2: '#5C57F2', name: 'Super Admin' },
    admin: { accent: '#7663F2', accent2: '#D96AC6', name: 'Admin' },
    staff: { accent: '#2ABF89', accent2: '#5C57F2', name: 'Staff' },
    client: { accent: '#9D62D9', accent2: '#7663F2', name: 'Client' },
}

const MODE_PALETTES = {
    dark: {
        bg: '#0D0A1A',
        bg2: '#130F25',
        surface: '#1B1530',
        border: 'rgba(118,99,242,0.18)',
        text: '#F0ECFF',
        muted: '#7A708E',
        overlay: 'rgba(13,10,26,0.84)',
    },
    light: {
        bg: '#F8F5FF',
        bg2: '#FFFFFF',
        surface: '#FFFFFF',
        border: 'rgba(118,99,242,0.15)',
        text: '#0D0B24',
        muted: '#6B6085',
        overlay: 'rgba(248,245,255,0.92)',
    },
}

const LOGIN_BG = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80'

const buildTheme = (mode, role) => {
    const palette = MODE_PALETTES[mode]
    const roleAccent = ROLE_ACCENTS[role] || ROLE_ACCENTS.admin
    return {
        mode, role,
        ...palette, ...roleAccent,
        loginBg: LOGIN_BG,
        loginOverlay: palette.overlay,
        gradient: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bg2} 100%)`,
    }
}

const ThemeContext = createContext(null)

const getInitialMode = () => {
    if (typeof window === 'undefined') return 'dark'
    const saved = localStorage.getItem('nv_mode')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children, defaultRole = 'admin' }) {
    const [mode, setMode] = useState(getInitialMode)
    const [role, setRole] = useState(defaultRole)

    const theme = useMemo(() => buildTheme(mode, role), [mode, role])

    const toggleMode = useCallback(() => {
        setMode(m => (m === 'dark' ? 'light' : 'dark'))
    }, [])

    useEffect(() => { localStorage.setItem('nv_mode', mode) }, [mode])

    useEffect(() => {
        const root = document.documentElement

        root.style.setProperty('--nv-bg', theme.bg)
        root.style.setProperty('--nv-bg2', theme.bg2)
        root.style.setProperty('--nv-surface', theme.surface)
        root.style.setProperty('--nv-border', theme.border)
        root.style.setProperty('--nv-accent', theme.accent)
        root.style.setProperty('--nv-accent2', theme.accent2)
        root.style.setProperty('--nv-text', theme.text)
        root.style.setProperty('--nv-muted', theme.muted)

        root.style.setProperty('--nv-dd-bg', mode === 'dark' ? theme.surface : theme.bg2)
        root.style.setProperty('--nv-dd-border', theme.accent)
        root.style.setProperty('--nv-dd-hover', `${theme.accent}18`)
        root.style.setProperty('--nv-dd-selected', `${theme.accent}22`)

        root.style.setProperty('--nv-success', mode === 'dark' ? '#4ADE80' : '#16A34A')
        root.style.setProperty('--nv-success-bg', mode === 'dark' ? 'rgba(74,222,128,0.10)' : 'rgba(22,163,74,0.08)')
        root.style.setProperty('--nv-warning', mode === 'dark' ? '#FBBF24' : '#D97706')
        root.style.setProperty('--nv-warning-bg', mode === 'dark' ? 'rgba(251,191,36,0.12)' : 'rgba(217,119,6,0.08)')
        root.style.setProperty('--nv-danger', mode === 'dark' ? '#F87171' : '#DC2626')
        root.style.setProperty('--nv-danger-bg', mode === 'dark' ? 'rgba(248,113,113,0.10)' : 'rgba(220,38,38,0.08)')
        root.style.setProperty('--nv-info', mode === 'dark' ? '#60A5FA' : '#2563EB')
        root.style.setProperty('--nv-info-bg', mode === 'dark' ? 'rgba(96,165,250,0.10)' : 'rgba(37,99,235,0.08)')

        document.body.style.background = theme.bg
        document.body.style.color = theme.text
        root.style.colorScheme = mode
        root.classList.toggle('dark', mode === 'dark')
        root.classList.toggle('light', mode === 'light')
    }, [theme, mode])

    return (
        <ThemeContext.Provider value={{ theme, mode, role, toggleMode, setMode, setRole }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
    return ctx
}

export { ROLE_ACCENTS }