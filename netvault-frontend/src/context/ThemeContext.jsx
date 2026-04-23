import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

/**
 * DOMAINVAULT COLOR SYSTEM
 * superAdmin → Indigo  #6366F1 / #818CF8
 * admin      → Violet  #8B5CF6 / #A78BFA
 * staff      → Blue    #3B82F6 / #60A5FA
 * client     → Cyan    #06B6D4 / #22D3EE
 */
const ROLE_ACCENTS = {
    superAdmin: { accent: '#6366F1', accent2: '#818CF8', name: 'Super Admin' },
    admin: { accent: '#8B5CF6', accent2: '#A78BFA', name: 'Admin' },
    staff: { accent: '#3B82F6', accent2: '#60A5FA', name: 'Staff' },
    client: { accent: '#06B6D4', accent2: '#22D3EE', name: 'Client' },
}

const MODE_PALETTES = {
    dark: {
        bg: '#0A0B0F',
        bg2: '#0F1117',
        surface: '#161A24',
        border: 'rgba(99,102,241,0.14)',
        text: '#E8EDFF',
        muted: '#6B7385',
        overlay: 'rgba(10,11,15,0.80)',
    },
    light: {
        bg: '#F4F6FF',
        bg2: '#FFFFFF',
        surface: '#FFFFFF',
        border: 'rgba(99,102,241,0.12)',
        text: '#0D1033',
        muted: '#6B7385',
        overlay: 'rgba(244,246,255,0.90)',
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