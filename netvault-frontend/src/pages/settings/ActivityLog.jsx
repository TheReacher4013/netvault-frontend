import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Loader, EmptyState, PageHeader } from '../../components/ui/index'
import { History, Search } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const ACTION_META = {
  'auth.login':                { emoji: '🔑', color: '#62B849', label: 'Login' },
  'auth.login-failed':         { emoji: '🚫', color: '#C94040', label: 'Login failed' },
  'auth.login-blocked':        { emoji: '🚫', color: '#C94040', label: 'Login blocked' },
  'auth.login-2fa-required':   { emoji: '🔐', color: '#4A8FA8', label: '2FA required' },
  'auth.2fa-enabled':          { emoji: '🛡️', color: '#62B849', label: '2FA enabled' },
  'auth.2fa-disabled':         { emoji: '🛡️', color: '#F0A045', label: '2FA disabled' },
  'auth.2fa-failed':           { emoji: '🚫', color: '#C94040', label: '2FA failed' },
  'auth.2fa-backup-used':      { emoji: '🎫', color: '#F0A045', label: 'Backup code used' },
  'auth.register':             { emoji: '👋', color: '#62B849', label: 'Agency registered' },
  'auth.password-changed':     { emoji: '🔒', color: '#4A8FA8', label: 'Password changed' },
  'auth.password-reset-requested': { emoji: '📧', color: '#F0A045', label: 'Reset requested' },
  'auth.password-reset-complete':  { emoji: '🔒', color: '#62B849', label: 'Password reset' },

  'invoice.create':            { emoji: '📄', color: '#62B849', label: 'Invoice created' },
  'invoice.status-change':     { emoji: '🔄', color: '#4A8FA8', label: 'Invoice status' },
  'invoice.delete':            { emoji: '🗑️', color: '#C94040', label: 'Invoice deleted' },

  'domain.whois-refresh':      { emoji: '🌐', color: '#4A8FA8', label: 'WHOIS refreshed' },
}

const actionMeta = (action) => ACTION_META[action] || {
  emoji: '📝', color: '#8A9E87',
  label: action.replace(/[-.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
}

const ENTITY_TYPES = ['', 'domain', 'hosting', 'client', 'invoice', 'user', 'tenant', 'auth', 'credential']

export default function ActivityLog() {
  const { theme, user } = useAuth()
  const [entityType, setEntityType] = useState('')
  const [searchText, setSearchText] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['activity', { entityType, page }],
    queryFn: () => activityService.getAll({
      page, limit: 50,
      ...(entityType ? { entityType } : {}),
    }),
    keepPreviousData: true,
  })

  if (isLoading) return <Loader text="Loading activity log..." />

  const paginated = data?.data?.data || {}
  const logs = paginated.docs || []
  const totalPages = paginated.totalPages || 1
  const totalDocs = paginated.totalDocs || 0

  const filtered = !searchText ? logs : logs.filter(l => {
    const hay = [
      l.userName, l.userEmail, l.action,
      JSON.stringify(l.metadata || {}),
    ].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(searchText.toLowerCase())
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activity Log"
        subtitle={`${totalDocs.toLocaleString()} events ${user?.role === 'superAdmin' ? '· platform-wide' : ''}`}
      />

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}` }}>
          <Search size={13} style={{ color: theme.muted }} />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search user, action, or metadata..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: theme.text, fontFamily: "'DM Sans',sans-serif" }}
          />
        </div>
        <select value={entityType}
          onChange={e => { setEntityType(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer capitalize"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
          {ENTITY_TYPES.map(t => (
            <option key={t || 'all'} value={t}>{t ? t : 'All entities'}</option>
          ))}
        </select>
      </Card>

      {/* Log list */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={History}
            title={searchText ? 'No matches' : 'No activity yet'}
            description={searchText ? 'Try a different search term.' : 'Activity will appear here as users take actions.'}
          />
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {filtered.map(log => {
              const meta = actionMeta(log.action)
              return (
                <div key={log._id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  {/* Action icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ background: `${meta.color}14` }}>
                    {meta.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Line 1: action + entity */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: theme.text }}>
                        {meta.label}
                      </span>
                      {log.entityType && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: `${theme.accent}12`, color: theme.accent }}>
                          {log.entityType}
                        </span>
                      )}
                    </div>

                    {/* Line 2: user */}
                    <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                      {log.userName
                        ? <>by <span style={{ color: theme.text }}>{log.userName}</span>
                             <span className="font-mono"> ({log.userEmail})</span></>
                        : <em>system</em>}
                    </p>

                    {/* Line 3: metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(log.metadata).slice(0, 6).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded"
                            style={{ background: `${theme.accent}06`, color: theme.muted, border: `1px solid ${theme.border}` }}>
                            <span className="opacity-70">{k}:</span>{' '}
                            <span style={{ color: theme.text }}>
                              {typeof v === 'string' && v.length > 40 ? `${v.slice(0, 40)}…` : String(v)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Line 4: IP + timestamp */}
                    <div className="flex items-center gap-3 text-[10px] font-mono mt-1.5" style={{ color: theme.muted }}>
                      <span>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                      <span>·</span>
                      <span>{format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}</span>
                      {log.ip && <><span>·</span><span>{log.ip}</span></>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !searchText && (
          <div className="flex items-center justify-center gap-2 p-4"
            style={{ borderTop: `1px solid ${theme.border}` }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-mono disabled:opacity-30"
              style={{ background: `${theme.accent}10`, color: theme.text }}>
              ← Prev
            </button>
            <span className="text-xs font-mono" style={{ color: theme.muted }}>
              {page} of {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-mono disabled:opacity-30"
              style={{ background: `${theme.accent}10`, color: theme.text }}>
              Next →
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}
