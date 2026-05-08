// import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
// import { io } from 'socket.io-client'
// import api, { twoFactorService } from '../services/api'
// import { useTheme, ROLE_ACCENTS } from './ThemeContext'
// import toast from 'react-hot-toast'

// const AuthContext = createContext(null)

// export const ROLE_THEMES = {
//   superAdmin: { ...ROLE_ACCENTS.superAdmin, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
//   admin: { ...ROLE_ACCENTS.admin, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
//   staff: { ...ROLE_ACCENTS.staff, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
//   client: { ...ROLE_ACCENTS.client, bg: '#0A0B0F', bg2: '#13151C', surface: '#1A1D26', border: 'rgba(255,255,255,0.08)', text: '#F1F5F9', muted: '#94A3B8', loginBg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', loginOverlay: 'rgba(10,11,15,0.72)' },
// }

// export const getTheme = (role) => ROLE_THEMES[role] || ROLE_THEMES.admin

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null)
//   const [token, setToken] = useState(() => localStorage.getItem('nv_token'))
//   const [loading, setLoading] = useState(true)
//   const [socket, setSocket] = useState(null)
//   const [trialInfo, setTrialInfo] = useState(null)
//   const socketRef = useRef(null)
//   const { theme, setRole } = useTheme()

//   useEffect(() => {
//     setRole(user?.role || 'admin')
//   }, [user?.role, setRole])

//   /* ── Socket ────────────────────────────────────────────────────────── */
//   const disconnectSocket = useCallback(() => {
//     if (socketRef.current) {
//       socketRef.current.disconnect()
//       socketRef.current = null
//       setSocket(null)
//     }
//   }, [])

//   const connectSocket = useCallback((u) => {
//     if (!u?.tenantId) return
//     disconnectSocket()

//     const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
//       auth: { token: localStorage.getItem('nv_token') },
//       reconnectionAttempts: 5,
//       reconnectionDelay: 2000,
//     })

//     s.on('connect', () => {
//       const tid = u.tenantId?._id?.toString() || u.tenantId?.toString()
//       s.emit('join-tenant', tid)
//     })
//     s.on('connect_error', (err) => console.warn('[Socket] Connection error:', err.message))
//     s.on('server-down', (data) => toast.error(`🔴 Server Down: ${data.label}`, { duration: 8000 }))
//     s.on('server-up', (data) => toast.success(`✅ Server Recovered: ${data.label}`, { duration: 5000 }))

//     socketRef.current = s
//     setSocket(s)
//   }, [disconnectSocket])

//   /* ── Trial info fetch ──────────────────────────────────────────────── */
//   const fetchTrialInfo = useCallback(async () => {
//     try {
//       const res = await api.get('/tenant/status')
//       const d = res.data?.data
//       if (d) {
//         setTrialInfo({
//           isOnTrial: d.isOnTrial,
//           daysRemaining: d.trialDaysRemaining,
//           trialEndDate: d.trialEndDate,
//           trialExpired: d.planStatus === 'trial_expired',
//           planStatus: d.planStatus,
//           profileCompleted: d.profileCompleted || false,
//         })
//       }
//     } catch { /* ignore — non-blocking */ }
//   }, [])

//   /* ── Refresh user from /auth/me ────────────────────────────────────── */
//   const refreshUser = useCallback(async () => {
//     try {
//       const res = await api.get('/auth/me')
//       const u = res.data?.data?.user
//       if (u) setUser(u)
//     } catch { /* ignore */ }
//   }, [])

//   /* ── Boot: verify token ────────────────────────────────────────────── */
//   useEffect(() => {
//     if (token) {
//       api.get('/auth/me')
//         .then(res => {
//           const u = res.data.data.user
//           setUser(u)
//           connectSocket(u)
//           if (u.role !== 'superAdmin' && u.role !== 'client') {
//             fetchTrialInfo()
//           }
//         })
//         .catch(() => {
//           localStorage.removeItem('nv_token')
//           setToken(null)
//           setUser(null)
//         })
//         .finally(() => setLoading(false))
//     } else {
//       setLoading(false)
//     }
//   }, []) // eslint-disable-line react-hooks/exhaustive-deps

//   useEffect(() => () => disconnectSocket(), [disconnectSocket])

//   /* ── Session finalizer (used by login / 2FA) ───────────────────────── */
//   const finalizeSession = useCallback((tk, u, ti) => {
//     localStorage.setItem('nv_token', tk)
//     setToken(tk)
//     setUser(u)
//     connectSocket(u)
//     if (ti) setTrialInfo(ti)
//     return u
//   }, [connectSocket])

//   /* ── Auth actions ──────────────────────────────────────────────────── */
//   const login = async (email, password) => {
//     const rememberMe = !!(localStorage.getItem('nv_remember_email'))
//     const res = await api.post('/auth/login', { email, password, rememberMe })
//     const data = res.data.data
//     if (data.requires2FA) return { requires2FA: true, tempToken: data.tempToken }
//     return finalizeSession(data.token, data.user, data.trialInfo)
//   }

//   const completeLoginWith2FA = async (tempToken, code) => {
//     const res = await twoFactorService.verifyLogin(tempToken, code)
//     const { token: tk, user: u } = res.data.data
//     return finalizeSession(tk, u)
//   }

//   const logout = useCallback(() => {
//     localStorage.removeItem('nv_token')
//     localStorage.removeItem('nv_remember_email')
//     setToken(null)
//     setUser(null)
//     setTrialInfo(null)
//     disconnectSocket()
//   }, [disconnectSocket])

//   /* ── Trial helpers ─────────────────────────────────────────────────── */
//   /**
//    * refreshTrialInfo — re-fetches /tenant/status from the server.
//    * Call this after any action that might affect planStatus or profileCompleted,
//    * e.g. after saving company settings.
//    */
//   const refreshTrialInfo = useCallback(() => {
//     if (user && user.role !== 'superAdmin' && user.role !== 'client') {
//       fetchTrialInfo()
//     }
//   }, [user, fetchTrialInfo])

//   /**
//    * markProfileUpdated — immediately flips profileCompleted in local state
//    * WITHOUT waiting for a server round-trip.  Call this right after the
//    * company-settings save succeeds so the TrialPopup updates instantly.
//    *
//    * refreshTrialInfo() will also be called to keep the server state in sync.
//    */
//   const markProfileUpdated = useCallback(() => {
//     setTrialInfo(prev => prev ? { ...prev, profileCompleted: true } : prev)
//     // Also trigger a server refresh to confirm
//     if (user && user.role !== 'superAdmin' && user.role !== 'client') {
//       fetchTrialInfo()
//     }
//   }, [user, fetchTrialInfo])

//   /* ── Context value ─────────────────────────────────────────────────── */
//   return (
//     <AuthContext.Provider value={{
//       user, token, loading, theme,
//       login, completeLoginWith2FA, logout,
//       socket,
//       trialInfo, setTrialInfo, refreshTrialInfo, markProfileUpdated,
//       refreshUser,
//       isAuthenticated: !!token && !!user,
//     }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export const useAuth = () => {
//   const ctx = useContext(AuthContext)
//   if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
//   return ctx
// }
























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
  const [trialInfo, setTrialInfo] = useState(null)
  const socketRef = useRef(null)
  const { theme, setRole } = useTheme()

  useEffect(() => {
    setRole(user?.role || 'admin')
  }, [user?.role, setRole])

  /* ── Socket ────────────────────────────────────────────────────────── */
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

  /* ── Trial info fetch ──────────────────────────────────────────────── */
  const fetchTrialInfo = useCallback(async () => {
    try {
      const res = await api.get('/tenant/status')
      const d = res.data?.data
      if (d) {
        setTrialInfo({
          isOnTrial: d.isOnTrial,
          daysRemaining: d.trialDaysRemaining,
          trialEndDate: d.trialEndDate,
          trialExpired: d.planStatus === 'trial_expired',
          planStatus: d.planStatus,
          profileCompleted: d.profileCompleted || false,
        })
      }
    } catch { /* ignore — non-blocking */ }
  }, [])

  /* ── Refresh user from /auth/me ────────────────────────────────────── */
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      const u = res.data?.data?.user
      if (u) setUser(u)
    } catch { /* ignore */ }
  }, [])

  /* ── Boot: verify token ────────────────────────────────────────────── */
  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          const u = res.data.data.user
          setUser(u)
          connectSocket(u)
          if (u.role !== 'superAdmin' && u.role !== 'client') {
            fetchTrialInfo()
          }
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => disconnectSocket(), [disconnectSocket])

  /* ── Session finalizer (used by login / 2FA) ───────────────────────── */
  const finalizeSession = useCallback((tk, u, ti) => {
    localStorage.setItem('nv_token', tk)
    setToken(tk)
    setUser(u)
    connectSocket(u)
    if (ti) setTrialInfo(ti)
    return u
  }, [connectSocket])

  /* ── Auth actions ──────────────────────────────────────────────────── */
  const login = async (email, password) => {
    const rememberMe = !!(localStorage.getItem('nv_remember_email'))
    const res = await api.post('/auth/login', { email, password, rememberMe })
    const data = res.data.data
    if (data.requires2FA) return { requires2FA: true, tempToken: data.tempToken }
    return finalizeSession(data.token, data.user, data.trialInfo)
  }

  const completeLoginWith2FA = async (tempToken, code) => {
    const res = await twoFactorService.verifyLogin(tempToken, code)
    const { token: tk, user: u } = res.data.data
    return finalizeSession(tk, u)
  }

  const logout = useCallback(() => {
    // Trial popup dobara dikhane ke liye session flag clear karo
    if (user) {
      const uid = user.uid || user._id || user.id
      sessionStorage.removeItem(`nv_trial_shown_${uid}`)
    }
    localStorage.removeItem('nv_token')
    localStorage.removeItem('nv_remember_email')
    setToken(null)
    setUser(null)
    setTrialInfo(null)
    disconnectSocket()
  }, [disconnectSocket, user])

  /* ── Trial helpers ─────────────────────────────────────────────────── */
  /**
   * refreshTrialInfo — re-fetches /tenant/status from the server.
   * Call this after any action that might affect planStatus or profileCompleted,
   * e.g. after saving company settings.
   */
  const refreshTrialInfo = useCallback(() => {
    if (user && user.role !== 'superAdmin' && user.role !== 'client') {
      fetchTrialInfo()
    }
  }, [user, fetchTrialInfo])

  /**
   * markProfileUpdated — immediately flips profileCompleted in local state
   * WITHOUT waiting for a server round-trip.  Call this right after the
   * company-settings save succeeds so the TrialPopup updates instantly.
   *
   * refreshTrialInfo() will also be called to keep the server state in sync.
   */
  const markProfileUpdated = useCallback(() => {
    setTrialInfo(prev => prev ? { ...prev, profileCompleted: true } : prev)
    // Also trigger a server refresh to confirm
    if (user && user.role !== 'superAdmin' && user.role !== 'client') {
      fetchTrialInfo()
    }
  }, [user, fetchTrialInfo])

  /* ── Context value ─────────────────────────────────────────────────── */
  return (
    <AuthContext.Provider value={{
      user, token, loading, theme,
      login, completeLoginWith2FA, logout,
      socket,
      trialInfo, setTrialInfo, refreshTrialInfo, markProfileUpdated,
      refreshUser,
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