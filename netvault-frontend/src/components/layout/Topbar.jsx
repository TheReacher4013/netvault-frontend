import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function Topbar({ onMenuClick }) {
  const { theme, user } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [search, setSearch] = useState('')

  const { data: nData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll({ limit: 10 }),
    refetchInterval: 30000,
  })
  const notifs = nData?.data?.data?.notifications || []
  const unread = nData?.data?.data?.unreadCount || 0

  const handleMarkRead = async (id) => {
    await notificationService.markRead(id)
  }

  const severityDot = (s) => ({
    danger:  '#C94040',
    warning: '#F0A045',
    success: '#62B849',
    info:    '#4A8FA8',
  }[s] || '#888')

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 gap-3"
      style={{ background: `${theme.bg2}ee`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${theme.border}` }}>

  
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg transition-opacity opacity-60 hover:opacity-100"
          style={{ color: theme.text }}>
          <Menu size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: theme.accent }} />
          <span className="text-xs font-mono" style={{ color: theme.muted }}>Live</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
 
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all duration-200"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search domains, clients…"
            className="bg-transparent outline-none w-44 text-xs"
            style={{ color: theme.text, fontFamily: "'DM Sans', sans-serif" }}
          />
          {search && <button onClick={() => setSearch('')}><X size={11} style={{ color: theme.muted }} /></button>}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}` }}>
            <Bell size={16} style={{ color: theme.text }} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center font-mono"
                style={{ background: '#C94040', color: '#fff', border: `2px solid ${theme.bg2}` }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

    
          {showNotifs && (
            <div className="absolute right-0 top-10 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-up"
              style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <span className="text-sm font-semibold" style={{ color: theme.text }}>Notifications</span>
                <button className="text-xs font-mono hover:underline" style={{ color: theme.accent }}
                  onClick={() => notificationService.markAllRead()}>
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: theme.muted }}>No notifications</p>
                ) : notifs.map(n => (
                  <div key={n._id}
                    onClick={() => { handleMarkRead(n._id); setShowNotifs(false); navigate('/alerts') }}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
                    style={{ borderBottom: `1px solid ${theme.border}`, opacity: n.read ? 0.5 : 1 }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: severityDot(n.severity) }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight" style={{ color: theme.text }}>{n.title}</p>
                      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: theme.muted }}>{n.message}</p>
                      <p className="text-[10px] mt-1 font-mono" style={{ color: theme.muted }}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                <button className="text-xs w-full text-center font-mono hover:underline" style={{ color: theme.accent }}
                  onClick={() => { setShowNotifs(false); navigate('/alerts') }}>
                  View all alerts →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, color: theme.bg }}
          onClick={() => navigate('/settings/profile')}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
