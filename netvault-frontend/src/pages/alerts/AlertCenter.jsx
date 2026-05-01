import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Loader, PageHeader, EmptyState } from '../../components/ui/index'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const SEVERITY_COLORS = {
  danger: '#C94040',
  warning: '#F0A045',
  success: '#62B849',
  info: '#4A8FA8',
}

const TYPE_ICONS = {
  domain_expiry: '🌐',
  hosting_expiry: '🖥️',
  ssl_expiry: '🔒',
  server_down: '🔴',
  invoice_overdue: '💳',
  new_client: '👤',
  payment_received: '✅',
  info: 'ℹ️',
}

export default function AlertCenter() {
  const { theme, user } = useAuth()
  const isSuperAdmin = user?.role === 'superAdmin'
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [perPageInput, setPerPageInput] = useState('10')

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', filter, page, perPage],
    queryFn: () => alertService.getAll({
      page, limit: perPage,
      ...(filter === 'unread' ? { read: false } : filter === 'read' ? { read: true } : {}),
    }),
    refetchInterval: 30000,
  })

  const markReadMut = useMutation({
    mutationFn: (id) => alertService.markRead(id),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })
  const markAllMut = useMutation({
    mutationFn: () => alertService.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => alertService.remove(id),
    onSuccess: () => qc.invalidateQueries(['alerts']),
  })

  const alerts = data?.data?.data?.notifications || []
  const unread = data?.data?.data?.unreadCount || 0
  const totalPages = data?.data?.data?.totalPages || 1
  const totalDocs = data?.data?.data?.total || alerts.length

  if (isLoading) return <Loader text="Loading alerts..." />

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Alert Center"
        subtitle={`${unread} unread system alert${unread !== 1 ? 's' : ''}`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => markAllMut.mutate()} loading={markAllMut.isPending}>
            <CheckCheck size={13} />Mark all read
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${unread})` },
          { key: 'read', label: 'Read' },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setFilter(tab.key); setPage(1) }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === tab.key ? theme.accent : `${theme.accent}10`,
              color: filter === tab.key ? theme.bg : theme.text,
              border: `1px solid ${filter === tab.key ? theme.accent : theme.border}`,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {alerts.length === 0 ? (
          <EmptyState icon={Bell} title="No alerts" description="You're all caught up!" />
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {alerts.map((n, i) => {
              const srNo = (page - 1) * perPage + i + 1
              // System alerts use boolean `read` field
              const isRead = n.read === true
              return (
                <div key={n._id}
                  className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02]"
                  style={{ opacity: isRead ? 0.55 : 1 }}>

                  {/* Sr No + Icon */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <span className="text-[9px] font-mono" style={{ color: theme.muted }}>#{srNo}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                      style={{ background: `${SEVERITY_COLORS[n.severity] || theme.accent}12` }}>
                      {TYPE_ICONS[n.type] || '🔔'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight" style={{ color: theme.text }}>{n.title}</p>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{ background: SEVERITY_COLORS[n.severity] || theme.accent }} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.muted }}>{n.message}</p>
                    {isSuperAdmin && n.tenantId?.name && (
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded mt-1"
                        style={{ background: `${theme.accent}15`, color: theme.accent }}>
                        {n.tenantId.name}
                      </span>
                    )}
                    <p className="text-[10px] mt-1.5 font-mono" style={{ color: theme.muted }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    {!isRead && (
                      <button onClick={() => markReadMut.mutate(n._id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: theme.accent }}
                        title="Mark as read">
                        <CheckCheck size={13} />
                      </button>
                    )}
                    <button onClick={() => deleteMut.mutate(n._id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#C94040' }}
                      title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 p-4 flex-wrap" style={{ borderTop: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>Show</span>
            <input
              type="number" min="1" max="100"
              value={perPageInput}
              onChange={e => setPerPageInput(e.target.value)}
              onBlur={() => {
                const v = parseInt(perPageInput, 10)
                if (v > 0) { setPerPage(v); setPage(1) }
                else setPerPageInput(String(perPage))
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = parseInt(perPageInput, 10)
                  if (v > 0) { setPerPage(v); setPage(1) }
                  else setPerPageInput(String(perPage))
                }
              }}
              className="w-14 text-center px-2 py-1 rounded-lg text-xs font-mono outline-none"
              style={{ background: `${theme.accent}10`, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <span className="text-[11px] font-mono" style={{ color: theme.muted }}>per page</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-mono transition-colors"
                  style={{ background: p === page ? theme.accent : 'transparent', color: p === page ? theme.bg : theme.muted }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2.5 py-1 rounded-lg text-xs font-mono disabled:opacity-30"
                style={{ background: `${theme.accent}10`, color: theme.muted }}>›</button>
            </div>
          )}
          <span className="text-[11px] font-mono" style={{ color: theme.muted }}>
            {totalDocs} total
          </span>
        </div>
      </Card>
    </div>
  )
}
