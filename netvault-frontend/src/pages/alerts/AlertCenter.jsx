import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, CardHeader, Loader, PageHeader, EmptyState } from '../../components/ui/index'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const SEVERITY_COLORS = {
  danger:  '#C94040',
  warning: '#F0A045',
  success: '#62B849',
  info:    '#4A8FA8',
}

const TYPE_ICONS = {
  domain_expiry:  '🌐',
  hosting_expiry: '🖥️',
  ssl_expiry:     '🔒',
  server_down:    '🔴',
  invoice_overdue:'💳',
  new_client:     '👤',
  payment_received:'✅',
  info:           'ℹ️',
}

export default function AlertCenter() {
  const { theme } = useAuth()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-all', filter],
    queryFn: () => notificationService.getAll({
      limit: 50,
      ...(filter === 'unread' ? { read: false } : filter === 'read' ? { read: true } : {}),
    }),
    refetchInterval: 30000,
  })

  const markReadMut = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries(['notifications-all']),
  })
  const markAllMut = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['notifications-all']),
  })
  const deleteMut = useMutation({
    mutationFn: (id) => notificationService.remove(id),
    onSuccess: () => qc.invalidateQueries(['notifications-all']),
  })

  const notifs = data?.data?.data?.notifications || []
  const unread = data?.data?.data?.unreadCount || 0

  if (isLoading) return <Loader text="Loading alerts..." />

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title="Alert Center"
        subtitle={`${unread} unread notifications`}
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
          <button key={tab.key} onClick={() => setFilter(tab.key)}
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
        {notifs.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="divide-y" style={{ borderColor: theme.border }}>
            {notifs.map((n) => (
              <div key={n._id}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                style={{ opacity: n.read ? 0.55 : 1 }}>

                {/* Icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: `${SEVERITY_COLORS[n.severity] || theme.accent}12` }}>
                  {TYPE_ICONS[n.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight" style={{ color: theme.text }}>{n.title}</p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ background: SEVERITY_COLORS[n.severity] || theme.accent }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.muted }}>{n.message}</p>
                  <p className="text-[10px] mt-1.5 font-mono" style={{ color: theme.muted }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {!n.read && (
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
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
