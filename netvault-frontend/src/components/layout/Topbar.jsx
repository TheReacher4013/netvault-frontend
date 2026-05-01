import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, User, Building2, LogOut, ChevronDown } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { alertService } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import ThemeToggle from '../ui/ThemeToggle'
import { getNotificationRoute } from '../../utils/notifcationRoutes'

export default function Topbar({ onMenuClick }) {
  const { theme, user, logout } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  // Bell shows system alerts (source: 'system') via /api/alerts
  const { data: nData } = useQuery({
    queryKey: ['topbar-alerts'],
    queryFn: () => alertService.getAll({ limit: 10 }),
    refetchInterval: 30000,
  })
  const notifs = nData?.data?.data?.notifications || []
  const unread = nData?.data?.data?.unreadCount || 0

  const handleLogout = () => {
    setShowProfile(false)
    logout()
    navigate('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const severityDot = (s) => ({
    danger:  '#F87171',
    warning: '#FBBF24',
    success: '#4ADE80',
    info:    '#60A5FA',
  }[s] || '#6B7385')

  /**
   * Click a notification:
   *  1. Mark it as read (system alert uses /api/alerts/:id/read)
   *  2. Close the dropdown
   *  3. Navigate to the correct page based on notification data
   */
  const handleNotifClick = async (notif) => {
    // Mark read (fire-and-forget; don't block navigation)
    alertService.markRead(notif._id).then(() => {
      qc.invalidateQueries(['topbar-alerts'])
    }).catch(() => {})

    setShowNotifs(false)
    const route = getNotificationRoute(notif, user?.role)
    navigate(route)
  }

  const handleMarkAllRead = async () => {
    await alertService.markAllRead()
    qc.invalidateQueries(['topbar-alerts'])
  }

  const isSuperAdmin = user?.role === 'superAdmin'
  const isAdmin      = user?.role === 'admin'
  const isClient     = user?.role === 'client'

  // "View all" goes to the correct alerts page for this role
  const viewAllRoute = isClient
    ? '/client-portal/alerts'
    : isSuperAdmin
      ? '/super-admin/alerts'
      : '/alerts'

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 gap-3"
      style={{ background: `${theme.bg2}ee`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-opacity opacity-60 hover:opacity-100"
          style={{ color: theme.text }}
        >
          <Menu size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
          <span className="text-xs font-mono" style={{ color: theme.muted }}>Live</span>
        </div>
      </div>

      <div className="flex items-center gap-2">

        {/* ── Light / Dark toggle ── */}
        <ThemeToggle />

        {/* ── Notifications Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(v => !v); setShowProfile(false) }}
            className="relative p-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}
          >
            <Bell size={16} style={{ color: theme.text }} />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center font-mono"
                style={{ background: '#F87171', color: '#fff', border: `2px solid ${theme.bg2}` }}
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="absolute right-0 top-10 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${theme.border}` }}
              >
                <span className="text-sm font-semibold" style={{ color: theme.text }}>
                  System Alerts
                </span>
                {unread > 0 && (
                  <button
                    className="text-xs font-mono hover:underline"
                    style={{ color: theme.accent }}
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: theme.muted }}>
                    No alerts
                  </p>
                ) : notifs.map(n => (
                  <div
                    key={n._id}
                    onClick={() => handleNotifClick(n)}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      opacity: n.read ? 0.5 : 1,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: severityDot(n.severity) }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight" style={{ color: theme.text }}>
                        {n.title}
                      </p>
                      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: theme.muted }}>
                        {n.message}
                      </p>
                      <p className="text-[10px] mt-1 font-mono" style={{ color: theme.muted }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {/* Unread indicator dot */}
                    {!n.read && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: theme.accent }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                <button
                  className="text-xs w-full text-center font-mono hover:underline"
                  style={{ color: theme.accent }}
                  onClick={() => { setShowNotifs(false); navigate(viewAllRoute) }}
                >
                  View all alerts →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Profile Dropdown ── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotifs(false) }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all duration-200 hover:bg-white/5"
            style={{ border: `1px solid ${showProfile ? theme.accent : theme.border}` }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-none" style={{ color: theme.text }}>{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] font-mono leading-none mt-0.5 capitalize" style={{ color: theme.muted }}>{user?.role}</p>
            </div>
            <ChevronDown
              size={12}
              style={{ color: theme.muted, transform: showProfile ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {showProfile && (
            <div
              className="absolute right-0 top-11 w-52 rounded-2xl shadow-2xl z-50 overflow-hidden"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
            >
              {/* User info */}
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: '#fff' }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: theme.text }}>{user?.name}</p>
                    <p className="text-[10px] font-mono truncate" style={{ color: theme.muted }}>{user?.email}</p>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded capitalize inline-block mt-0.5"
                      style={{ background: `${theme.accent}15`, color: theme.accent }}
                    >
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { setShowProfile(false); navigate('/settings/profile') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:bg-white/5 text-left"
                  style={{ color: theme.text }}
                >
                  <User size={14} style={{ color: theme.accent }} />
                  My Profile
                </button>

                {(isAdmin || isSuperAdmin) && (
                  <button
                    onClick={() => { setShowProfile(false); navigate('/settings/company') }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:bg-white/5 text-left"
                    style={{ color: theme.text }}
                  >
                    <Building2 size={14} style={{ color: theme.accent }} />
                    Company Settings
                  </button>
                )}
              </div>

              {/* Sign out */}
              <div className="p-1.5 pt-0" style={{ borderTop: `1px solid ${theme.border}` }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:bg-red-500/10 text-left"
                  style={{ color: '#F87171' }}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
