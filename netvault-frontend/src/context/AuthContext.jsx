import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import api, { twoFactorService } from '../services/api'
import { useTheme, ROLE_ACCENTS } from './ThemeContext'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)
export const ROLE_THEMES = {
  superAdmin: { ...ROLE_ACCENTS.superAdmin, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
  admin: { ...ROLE_ACCENTS.admin, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
  staff: { ...ROLE_ACCENTS.staff, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
  client: { ...ROLE_ACCENTS.client, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
}

export const getTheme = (role) => ROLE_THEMES[role] || ROLE_THEMES.admin

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('nv_token'))
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const socketRef = useRef(null)
  const { theme, setRole } = useTheme()
  useEffect(() => {
    setRole(user?.role || 'admin')
  }, [user?.role, setRole])

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [])

  const connectSocket = useCallback((u) => {
    if (!u?.tenantId) return
    disconnectSocket()

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('nv_token') },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    s.on('connect', () => {
      const tid = u.tenantId?._id?.toString() || u.tenantId?.toString()
      s.emit('join-tenant', tid)
    })

    s.on('connect_error', (err) => console.warn('[Socket] Connection error:', err.message))
    s.on('server-down', (data) => toast.error(`🔴 Server Down: ${data.label}`, { duration: 8000 }))
    s.on('server-up', (data) => toast.success(`✅ Server Recovered: ${data.label}`, { duration: 5000 }))

    socketRef.current = s
    setSocket(s)
  }, [disconnectSocket])

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          const u = res.data.data.user
          setUser(u)
          connectSocket(u)
        })
        .catch(() => {
          localStorage.removeItem('nv_token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => () => disconnectSocket(), [disconnectSocket])

  const finalizeSession = useCallback((tk, u) => {
    localStorage.setItem('nv_token', tk)
    setToken(tk)
    setUser(u)
    connectSocket(u)
    return u
  }, [connectSocket])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const data = res.data.data
    if (data.requires2FA) return { requires2FA: true, tempToken: data.tempToken }
    return finalizeSession(data.token, data.user)
  }

  const completeLoginWith2FA = async (tempToken, code) => {
    const res = await twoFactorService.verifyLogin(tempToken, code)
    const { token: tk, user: u } = res.data.data
    return finalizeSession(tk, u)
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
      login, completeLoginWith2FA, logout,
      socket,
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