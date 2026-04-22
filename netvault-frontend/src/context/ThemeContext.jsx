import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

/**
 * ══════════════════════════════════════════════════════════════════
 *  VISIONCRAFT COLOR SYSTEM
 *
 *  Dark base:  Cinematic warm black  #12100C
 *  Accent:     Warm gold / amber     #C9A84C → #E2C06A
 *  Text:       Warm parchment white  #F0EAD6
 *
 *  Each role shares the same cinematic dark base but gets its
 *  own distinct gold/amber hue for accent + accent2.
 *
 *  superAdmin  →  Deep Royal Gold   #C9A84C / #E2C06A
 *  admin       →  Warm Amber        #D4872A / #F0A84A
 *  staff       →  Bronze            #A07840 / #C09860
 *  client      →  Ochre             #B89A30 / #D4B84A
 * ══════════════════════════════════════════════════════════════════
 */
const ROLE_ACCENTS = {
    superAdmin: { accent: '#C9A84C', accent2: '#E2C06A', name: 'Super Admin' },
    admin: { accent: '#D4872A', accent2: '#F0A84A', name: 'Admin' },
    staff: { accent: '#A07840', accent2: '#C09860', name: 'Staff' },
    client: { accent: '#B89A30', accent2: '#D4B84A', name: 'Client' },
}

/**
 *  DARK  — Cinematic Warm Black (VisionCraft-exact)
 *    bg      #12100C   deep warm black
 *    bg2     #1A1710   panel / sidebar
 *    surface #221F14   cards
 *    border  warm gold @ 11% alpha
 *    text    #F0EAD6   warm parchment
 *    muted   #8A7E62   warm tan-grey
 *
 *  LIGHT — Warm Cream
 *    bg      #FAF7F0   parchment cream
 *    bg2     #FFFFFF   white panels
 *    text    #1A1508   warm near-black
 *    muted   #7A7060   warm mid-grey
 */
const MODE_PALETTES = {
    dark: {
        bg: '#12100C',
        bg2: '#1A1710',
        surface: '#221F14',
        border: 'rgba(201,168,76,0.11)',
        text: '#F0EAD6',
        muted: '#8A7E62',
        overlay: 'rgba(18,16,12,0.78)',
    },
    light: {
        bg: '#FAF7F0',
        bg2: '#FFFFFF',
        surface: '#FFFFFF',
        border: 'rgba(26,21,8,0.09)',
        text: '#1A1508',
        muted: '#7A7060',
        overlay: 'rgba(250,247,240,0.82)',
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

        // Base palette
        root.style.setProperty('--nv-bg', theme.bg)
        root.style.setProperty('--nv-bg2', theme.bg2)
        root.style.setProperty('--nv-surface', theme.surface)
        root.style.setProperty('--nv-border', theme.border)
        root.style.setProperty('--nv-accent', theme.accent)
        root.style.setProperty('--nv-accent2', theme.accent2)
        root.style.setProperty('--nv-text', theme.text)
        root.style.setProperty('--nv-muted', theme.muted)

        // Dropdown thick border vars
        root.style.setProperty('--nv-dd-bg', mode === 'dark' ? theme.surface : theme.bg2)
        root.style.setProperty('--nv-dd-border', theme.accent)
        root.style.setProperty('--nv-dd-hover', `${theme.accent}18`)
        root.style.setProperty('--nv-dd-selected', `${theme.accent}22`)

        // Status — warm-tuned
        root.style.setProperty('--nv-success', mode === 'dark' ? '#4ADE80' : '#16A34A')
        root.style.setProperty('--nv-success-bg', mode === 'dark' ? 'rgba(74,222,128,0.10)' : 'rgba(22,163,74,0.08)')
        root.style.setProperty('--nv-warning', theme.accent)
        root.style.setProperty('--nv-warning-bg', `${theme.accent}15`)
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

