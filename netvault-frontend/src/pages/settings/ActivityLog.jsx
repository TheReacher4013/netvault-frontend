import { useState } from 'react'
import { activityService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Loader, EmptyState, PageHeader } from '../../components/ui/index'
import { History, Search } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const ACTION_META = {
  // Auth
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
  // Domains
  'domain.create': { emoji: '🌐', color: '#62B849', label: 'Domain added' },
  'domain.update': { emoji: '✏️', color: '#4A8FA8', label: 'Domain updated' },
  'domain.delete': { emoji: '🗑️', color: '#C94040', label: 'Domain deleted' },
  'domain.whois-refresh': { emoji: '🔍', color: '#4A8FA8', label: 'WHOIS refreshed' },
  'domain.dns-record-add': { emoji: '📡', color: '#62B849', label: 'DNS record added' },
  'domain.dns-record-update': { emoji: '📡', color: '#4A8FA8', label: 'DNS record updated' },
  'domain.dns-record-delete': { emoji: '📡', color: '#C94040', label: 'DNS record deleted' },
  // Hosting
  'hosting.create': { emoji: '🖥️', color: '#62B849', label: 'Hosting added' },
  'hosting.update': { emoji: '✏️', color: '#4A8FA8', label: 'Hosting updated' },
  'hosting.delete': { emoji: '🗑️', color: '#C94040', label: 'Hosting deleted' },
  // Clients
  'client.create': { emoji: '👤', color: '#62B849', label: 'Client added' },
  'client.update': { emoji: '✏️', color: '#4A8FA8', label: 'Client updated' },
  'client.delete': { emoji: '🗑️', color: '#C94040', label: 'Client deleted' },
  'client.invite-sent': { emoji: '📧', color: '#F0A045', label: 'Portal invite sent' },
  'client.portal-access-revoked': { emoji: '🔒', color: '#C94040', label: 'Portal access revoked' },
  // Invoices
  'invoice.create': { emoji: '📄', color: '#62B849', label: 'Invoice created' },
  'invoice.update': { emoji: '✏️', color: '#4A8FA8', label: 'Invoice updated' },
  'invoice.status-change': { emoji: '🔄', color: '#4A8FA8', label: 'Invoice status changed' },
  'invoice.delete': { emoji: '🗑️', color: '#C94040', label: 'Invoice deleted' },
  'invoice.download': { emoji: '⬇️', color: '#4A8FA8', label: 'Invoice downloaded' },
  // Users
  'user.create': { emoji: '👤', color: '#62B849', label: 'User added' },
  'user.update': { emoji: '✏️', color: '#4A8FA8', label: 'User updated' },
  'user.delete': { emoji: '🗑️', color: '#C94040', label: 'User deleted' },
  'user.role-change': { emoji: '🔄', color: '#F0A045', label: 'User role changed' },
  // Credentials
  'credential.create': { emoji: '🔐', color: '#62B849', label: 'Credential added' },
  'credential.update': { emoji: '✏️', color: '#4A8FA8', label: 'Credential updated' },
  'credential.delete': { emoji: '🗑️', color: '#C94040', label: 'Credential deleted' },
  'credential.view': { emoji: '👁️', color: '#F0A045', label: 'Credential viewed' },
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
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)

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

  const allSelected = filtered.length > 0 && filtered.every(l => selected.has(l._id))
  const someSelected = selected.size > 0 && !allSelected

  const toggleOne = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(l => l._id)))
    }
  }
  const handleDeleteSelected = async () => {
    if (!window.confirm(`${selected.size} delete your logs`)) return
    setDeleting(true)
    try {
      await activityService.deleteMany([...selected])
      setSelected(new Set())
      queryClient.invalidateQueries(['activity']) // ✅ list refresh होईल
    } catch (err) {
      alert('Delete failed: ' + (err?.response?.data?.message || err.message))
    } finally {
      setDeleting(false)
    }
  }
  // const handleDeleteSelected = async () => {
  //   if (!window.confirm(`${selected.size} logs delete all logs`)) return
  //   setDeleting(true)
  //   try {
  //     await activityService.deleteMany([...selected])
  //     setSelected(new Set())
  //   } finally {
  //     setDeleting(false)
  //   }
  // }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    setSelected(new Set())
  }

  const handlePerPageCommit = () => {
    const v = parseInt(perPageInput, 10)
    if (v > 0 && v <= 200) {
      setPerPage(v)
      handlePageChange(1)
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
          onChange={e => { setEntityType(e.target.value); handlePageChange(1) }}
          className="px-3 py-2 rounded-xl text-xs outline-none cursor-pointer capitalize"
          style={{ background: `${theme.accent}08`, border: `1px solid ${theme.border}`, color: theme.text }}>
          {ENTITY_TYPES.map(t => (
            <option key={t || 'all'} value={t}>{t ? t : 'All entities'}</option>
          ))}
        </select>
      </Card>

      {/* Selection action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl"
          style={{ background: '#4A8FA810', border: '1px solid #4A8FA840' }}>
          <span className="text-xs font-mono" style={{ color: theme.text }}>
            {selected.size} item{selected.size > 1 ? 's' : ''} choose
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
            style={{ background: '#C9404020', color: '#C94040' }}>
            {deleting ? 'Deleting...' : `Delete (${selected.size})`}
          </button>
        </div>
      )}

      {/* Log list */}
      <Card style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={History}
            title={searchText ? 'No matches' : 'No activity yet'}
            description={searchText ? 'Try a different search term.' : 'Activity will appear here as users take actions.'}
          />
        ) : (
          <>
            {/* Select All header */}
            <div className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: `1px solid ${theme.border}`, background: `${theme.accent}06` }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={toggleAll}
                className="w-3.5 h-3.5 cursor-pointer"
                style={{ accentColor: theme.accent }}
              />
              <span className="text-[11px] font-mono" style={{ color: theme.muted }}>
                {allSelected ? 'deselect all' : ' select all'}
              </span>
            </div>

            {/* Log rows */}
            <div className="divide-y" style={{ borderColor: theme.border }}>
              {filtered.map((log, i) => {
                const meta = actionMeta(log.action)
                const srNo = (page - 1) * perPage + i + 1
                return (
                  <div key={log._id}
                    className="flex items-start gap-3 px-4 py-4 hover:bg-white/[0.02] transition-colors"
                    style={{ background: selected.has(log._id) ? `${theme.accent}10` : undefined }}>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selected.has(log._id)}
                      onChange={() => toggleOne(log._id)}
                      onClick={e => e.stopPropagation()}
                      className="w-3.5 h-3.5 mt-1 cursor-pointer flex-shrink-0"
                      style={{ accentColor: theme.accent }}
                    />

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
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 flex-wrap"
          style={{ borderTop: `1px solid ${theme.border}` }}>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
            <input
              type="number" min="1" max="200"
              value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={handlePerPageCommit}
              onKeyDown={e => e.key === 'Enter' && handlePerPageCommit()}
              className="w-12 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>perPage</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1}
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
                    : <button key={p} onClick={() => handlePageChange(p)}
                      className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                      style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>
                      {p}
                    </button>
                )
              })()}

              <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
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