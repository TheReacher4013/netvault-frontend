// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const ROLE_THEMES = {
  superAdmin: {
    bg: '#0D0F0D', bg2: '#141614', surface: '#1A1C1A',
    border: 'rgba(98,184,73,0.15)',
    accent: '#62B849', accent2: '#82D860',
    text: '#E8F0E5', muted: '#8A9E87',
    gradient: 'linear-gradient(135deg, #0D0F0D 0%, #1A2A1A 100%)',
    loginBg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    loginOverlay: 'rgba(13,15,13,0.82)',
    name: 'Super Admin',
  },
  admin: {
    bg: '#0B1209', bg2: '#111A0F', surface: '#172014',
    border: 'rgba(121,123,45,0.18)',
    accent: '#797B2D', accent2: '#9BA040',
    text: '#EAF0E2', muted: '#7A9070',
    gradient: 'linear-gradient(135deg, #0B1209 0%, #1C2A10 100%)',
    loginBg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    loginOverlay: 'rgba(11,18,9,0.80)',
    name: 'Admin',
  },
  staff: {
    bg: '#0E1018', bg2: '#141720', surface: '#1A1F2E',
    border: 'rgba(74,143,168,0.18)',
    accent: '#4A8FA8', accent2: '#6AB8D0',
    text: '#E2EAF0', muted: '#7090A8',
    gradient: 'linear-gradient(135deg, #0E1018 0%, #1A2030 100%)',
    loginBg: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
    loginOverlay: 'rgba(14,16,24,0.82)',
    name: 'Staff',
  },
  client: {
    bg: '#0E1208', bg2: '#141A0C', surface: '#1C2410',
    border: 'rgba(187,174,100,0.18)',
    accent: '#BBAE64', accent2: '#D4C870',
    text: '#F0EEE0', muted: '#9A9870',
    gradient: 'linear-gradient(135deg, #0E1208 0%, #1C2410 100%)',
    loginBg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    loginOverlay: 'rgba(14,18,8,0.80)',
    name: 'Client',
  },
}

export const getTheme = (role) => ROLE_THEMES[role] || ROLE_THEMES.admin

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('nv_token'))
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)

  // ✅ FIX (Bug #7): Use a ref to track the current socket instance.
  // This gives connectSocket and logout access to the latest socket without
  // needing it in their dependency arrays (which would cause infinite re-renders).
  const socketRef = useRef(null)

  const theme = getTheme(user?.role)

  // Apply CSS variables whenever the role/theme changes
  useEffect(() => {
    const t = getTheme(user?.role)
    const root = document.documentElement.style
    root.setProperty('--nv-bg', t.bg)
    root.setProperty('--nv-bg2', t.bg2)
    root.setProperty('--nv-surface', t.surface)
    root.setProperty('--nv-border', t.border)
    root.setProperty('--nv-accent', t.accent)
    root.setProperty('--nv-accent2', t.accent2)
    root.setProperty('--nv-text', t.text)
    root.setProperty('--nv-muted', t.muted)
    document.body.style.background = t.bg
    document.body.style.color = t.text
  }, [user?.role])

  // ✅ FIX (Bug #7): disconnectSocket is a standalone helper that always
  // operates on the ref, not the state. This avoids stale-closure issues.
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [])

  /**
   * ✅ FIX (Bug #7): connectSocket now:
   *   1. Disconnects any EXISTING socket before creating a new one.
   *      Previously, re-logging in created a new socket but left the old one
   *      alive — leading to an unbounded number of open WebSocket connections.
   *   2. Does NOT return a cleanup function that gets silently ignored.
   *      Instead it writes directly to socketRef.current and setSocket().
   */
  const connectSocket = useCallback((u) => {
    if (!u?.tenantId) return

    // Always disconnect any existing connection first
    disconnectSocket()

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('nv_token') },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    // s.on('connect', () => {
    //   s.emit('join-tenant', u.tenantId?._id || u.tenantId)
    // })
    s.on('connect', () => {
      const tid = u.tenantId?._id?.toString() || u.tenantId?.toString()
      s.emit('join-tenant', tid)
    })


    s.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message)
    })

    s.on('server-down', (data) => {
      toast.error(`🔴 Server Down: ${data.label}`, { duration: 8000 })
    })

    s.on('server-up', (data) => {
      toast.success(`✅ Server Recovered: ${data.label}`, { duration: 5000 })
    })

    s.on('domain-added', () => { })
    s.on('client-added', () => { })

    socketRef.current = s
    setSocket(s)
  }, [disconnectSocket])

  // On mount: restore session if token exists
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          const u = res.data.data.user
          setUser(u)
          connectSocket(u)
        })
        .catch(() => {
          // Token is invalid/expired — clean up silently
          localStorage.removeItem('nv_token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  // Cleanup socket on unmount
  useEffect(() => {
    return () => disconnectSocket()
  }, [disconnectSocket])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: tk, user: u } = res.data.data
    localStorage.setItem('nv_token', tk)
    setToken(tk)
    setUser(u)
    // ✅ connectSocket already disconnects any stale socket before creating new one
    connectSocket(u)
    return u
  }

  const logout = useCallback(() => {
    localStorage.removeItem('nv_token')
    setToken(null)
    setUser(null)
    disconnectSocket()
  }, [disconnectSocket])

  return (
    <AuthContext.Provider value={{
      user, token, loading, theme,
      login, logout,
      socket,      // expose for components that need to listen to custom events
      isAuthenticated: !!token && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
