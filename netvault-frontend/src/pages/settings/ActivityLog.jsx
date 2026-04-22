import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Loader, EmptyState, PageHeader } from '../../components/ui/index'
import { History, Search } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

const ACTION_META = {
  'auth.login': { emoji: '🔑', color: '#62B849', label: 'Login' },
  'auth.login-failed': { emoji: '🚫', color: '#C94040', label: 'Login failed' },
  'auth.login-blocked': { emoji: '🚫', color: '#C94040', label: 'Login blocked' },
  'auth.login-2fa-required': { emoji: '🔐', color: '#4A8FA8', label: '2FA required' },
  'auth.2fa-enabled': { emoji: '🛡️', color: '#62B849', label: '2FA enabled' },
  'auth.2fa-disabled': { emoji: '🛡️', color: '#F0A045', label: '2FA disabled' },
  'auth.2fa-failed': { emoji: '🚫', color: '#C94040', label: '2FA failed' },
  'auth.2fa-backup-used': { emoji: '🎫', color: '#F0A045', label: 'Backup code used' },
  'auth.register': { emoji: '👋', color: '#62B849', label: 'Agency registered' },
  'auth.password-changed': { emoji: '🔒', color: '#4A8FA8', label: 'Password changed' },
  'auth.password-reset-requested': { emoji: '📧', color: '#F0A045', label: 'Reset requested' },
  'auth.password-reset-complete': { emoji: '🔒', color: '#62B849', label: 'Password reset' },
  'invoice.create': { emoji: '📄', color: '#62B849', label: 'Invoice created' },
  'invoice.status-change': { emoji: '🔄', color: '#4A8FA8', label: 'Invoice status' },
  'invoice.delete': { emoji: '🗑️', color: '#C94040', label: 'Invoice deleted' },
  'domain.whois-refresh': { emoji: '🌐', color: '#4A8FA8', label: 'WHOIS refreshed' },
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
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['activity', { entityType, page, perPage }],
    queryFn: () => activityService.getAll({
      page, limit: perPage,
      ...(entityType ? { entityType } : {}),
    }),
    keepPreviousData: true,
  })

  const paginated = data?.data?.data || {}
  const logs = paginated.docs || []
  const totalPages = paginated.totalPages || 1
  const totalDocs = paginated.totalDocs || 0

  const filtered = !searchText.trim()
    ? logs
    : logs.filter(l => {
      const hay = [l.userName, l.userEmail, l.action, JSON.stringify(l.metadata || {})]
        .filter(Boolean).join(' ').toLowerCase()
      return hay.includes(searchText.toLowerCase())
    })

  const handlePerPageCommit = () => {
    const v = parseInt(perPageInput, 10)
    if (v > 0 && v <= 200) {
      setPerPage(v)
      setPage(1)
    } else {
      setPerPageInput(String(perPage))
    }
  }

  if (isLoading) return <Loader text="Loading activity log..." />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activity Log"
        subtitle={`${totalDocs.toLocaleString()} events${user?.role === 'superAdmin' ? ' · platform-wide' : ''}`}
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
          {searchText && (
            <button onClick={() => setSearchText('')}
              className="text-xs opacity-50 hover:opacity-80"
              style={{ color: theme.muted }}>✕</button>
          )}
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
      <Card style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={History}
            title={searchText ? 'No matches' : 'No activity yet'}
            description={searchText ? 'Try a different search term.' : 'Activity will appear here as users take actions.'}
          />
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {filtered.map((log, i) => {
              const meta = actionMeta(log.action)
              const srNo = (page - 1) * perPage + i + 1
              return (
                <div key={log._id} className="flex items-start gap-3 px-4 py-4 hover:bg-white/[0.02] transition-colors">
                  {/* Sr + Icon */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-[9px] font-mono" style={{ color: theme.muted }}>#{srNo}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: `${meta.color}14` }}>
                      {meta.emoji}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Action + entity type */}
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

                    {/* User */}
                    <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
                      {log.userName
                        ? <>by <span style={{ color: theme.text }}>{log.userName}</span>
                          <span className="font-mono"> ({log.userEmail})</span></>
                        : <em>system</em>}
                    </p>

                    {/* Metadata chips */}
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

                    {/* Time + IP */}
                    <div className="flex items-center gap-3 text-[10px] font-mono mt-1.5 flex-wrap" style={{ color: theme.muted }}>
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
        <div className="flex items-center justify-between gap-3 p-4 flex-wrap"
          style={{ borderTop: `1px solid ${theme.border}` }}>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
            <input
              type="number" min="1" max="200"
              value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={handlePerPageCommit}
              onKeyDown={e => e.key === 'Enter' && handlePerPageCommit()}
              className="w-14 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>‹</button>

              {(() => {
                const pages = []
                const delta = 2
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                    pages.push(i)
                  }
                }
                const result = []
                let prev = null
                for (const p of pages) {
                  if (prev && p - prev > 1) result.push('…')
                  result.push(p)
                  prev = p
                }
                return result.map((p, idx) =>
                  p === '…'
                    ? <span key={`ellipsis-${idx}`} className="text-xs font-mono px-1" style={{ color: theme.muted }}>…</span>
                    : <button key={p} onClick={() => setPage(p)}
                      className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                      style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>
                      {p}
                    </button>
                )
              })()}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>›</button>
            </div>
          )}

          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>
            {totalDocs.toLocaleString()} total
          </span>
        </div>
      </Card>
    </div>
  )
}