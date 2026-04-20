import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
const ROLE_ACCENTS = {
    superAdmin: { accent: '#10B981', accent2: '#34D399', name: 'Super Admin' },
    admin: { accent: '#6366F1', accent2: '#818CF8', name: 'Admin' },
    staff: { accent: '#0EA5E9', accent2: '#38BDF8', name: 'Staff' },
    client: { accent: '#F59E0B', accent2: '#FBBF24', name: 'Client' },
}

const MODE_PALETTES = {
    dark: {
        bg: '#0A0B0F',
        bg2: '#13151C',
        surface: '#1A1D26',
        border: 'rgba(255,255,255,0.08)',
        text: '#F1F5F9',
        muted: '#94A3B8',
        overlay: 'rgba(10,11,15,0.72)',
    },
    light: {
        bg: '#F8FAFC',
        bg2: '#FFFFFF',
        surface: '#FFFFFF',
        border: 'rgba(15,23,42,0.08)',
        text: '#0F172A',
        muted: '#64748B',
        overlay: 'rgba(248,250,252,0.72)',
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